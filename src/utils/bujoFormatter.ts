/**
 * Utilidades de formateo editorial Bujo para notas y cuadernos de Espiralia.
 * Provee parser de texto a bloques estructurados (secciones §, cajas/hitos, párrafos),
 * conteo seguro de palabras y resolución cromática de cintas marcapáginas.
 */

export type BujoBlockType = 'heading' | 'callout' | 'paragraph';

export interface BujoHeadingBlock {
  type: 'heading';
  symbol: string;
  title: string;
}

export interface BujoCalloutBlock {
  type: 'callout';
  icon: string;
  title: string;
  badge?: string;
  text: string;
}

export interface BujoParagraphBlock {
  type: 'paragraph';
  text: string;
}

export type BujoBlock = BujoHeadingBlock | BujoCalloutBlock | BujoParagraphBlock;

const STUDY_TAGS = [
  'estudio',
  'estudios',
  'conaset',
  'examen',
  'universidad',
  'apuntes',
  'study',
  'lectura',
  'curso',
];

const REFLECTION_TAGS = ['reflexion', 'reflexión', 'diario', 'terapia', 'autoobservacion', 'autoobservación'];

const IDEA_TAGS = ['idea', 'ideas', 'proyecto', 'proyectos', 'importante', 'pendiente'];

const DEFAULT_TAG_ICONS: Record<string, string> = {
  hito: '🎯',
  caja: '📌',
  callout: '💡',
};

/**
 * Limpia prefijos numéricos o símbolos residuales de un título de sección.
 */
function cleanHeadingTitle(raw: string): string {
  return raw
    .replace(/^(?:#+|§)\s*/, '')
    .replace(/^\d+[.)]\s*/, '')
    .trim();
}

/**
 * Calcula el número exacto de palabras de un texto ignorando espacios repetidos y saltos de línea.
 */
export function countWords(text: string): number {
  if (!text || typeof text !== 'string') {
    return 0;
  }
  const trimmed = text.trim();
  if (!trimmed) {
    return 0;
  }
  return trimmed.split(/\s+/).filter(Boolean).length;
}

/**
 * Determina el color cromático de la cinta marcapáginas según la naturaleza de la nota.
 */
export function getCategoryRibbonColor(isReflection?: boolean, tags?: string[]): string {
  const normalizedTags = (tags || []).map((t) => t.toLowerCase().trim());

  const isStudy = normalizedTags.some((t) => STUDY_TAGS.includes(t));
  if (isStudy) {
    return '#047857'; // Tono esmeralda / teal editorial para estudio
  }

  if (isReflection || normalizedTags.some((t) => REFLECTION_TAGS.includes(t))) {
    return 'var(--color-primary)'; // Tono púrpura institucional de Espiralia
  }

  const isIdea = normalizedTags.some((t) => IDEA_TAGS.includes(t));
  if (isIdea) {
    return '#d97706'; // Tono ámbar cálido para ideas y proyectos
  }

  return 'var(--color-primary)';
}

/**
 * Parsea el contenido de texto plano enriquecido de una nota en bloques editoriales bujo.
 */
export function parseBujoContent(content: string, defaultTitle?: string): BujoBlock[] {
  const cleanDefault = defaultTitle ? cleanHeadingTitle(defaultTitle) : '';

  if (!content || typeof content !== 'string') {
    if (cleanDefault) {
      return [{ type: 'heading', symbol: '§ 1.', title: cleanDefault }];
    }
    return [];
  }

  const lines = content.split(/\r?\n/);
  const blocks: BujoBlock[] = [];
  let currentParagraphLines: string[] = [];
  let headingCount = 0;

  function flushParagraph(): void {
    if (currentParagraphLines.length > 0) {
      const text = currentParagraphLines.join(' ').replace(/\s+/g, ' ').trim();
      if (text) {
        blocks.push({ type: 'paragraph', text });
      }
      currentParagraphLines = [];
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      flushParagraph();
      continue;
    }

    // 1. Detección de encabezados (§ o #)
    const headingMatch = trimmed.match(/^(?:#+|§)\s*(.*)$/);
    if (headingMatch) {
      flushParagraph();
      headingCount++;
      const rawTitle = headingMatch[1] || '';
      const cleanTitle = cleanHeadingTitle(rawTitle);

      blocks.push({
        type: 'heading',
        symbol: `§ ${headingCount}.`,
        title: cleanTitle || cleanDefault || `Sección ${headingCount}`,
      });
      continue;
    }

    // 2. Detección de bloques callout / caja [caja: ...], [hito: ...] o [callout: ...]
    if (trimmed.startsWith('[caja:') || trimmed.startsWith('[hito:') || trimmed.startsWith('[callout:')) {
      flushParagraph();
      let calloutText = trimmed;
      while (!calloutText.includes(']') && i + 1 < lines.length) {
        i++;
        calloutText += ` ${lines[i].trim()}`;
      }

      const match = calloutText.match(
        /^\[(caja|hito|callout):\s*([^|\]]+)(?:\|\s*([^|\]]+))?(?:\|\s*([^\]]+))?\]/
      );

      if (match) {
        const tag = match[1];
        const part1 = (match[2] || '').trim();
        const part2 = match[3]?.trim();
        const part3 = match[4]?.trim();

        let badge: string | undefined = undefined;
        let text = '';

        if (part3 !== undefined) {
          badge = part2;
          text = part3;
        } else if (part2 !== undefined) {
          text = part2;
        }

        const emojiMatch = part1.match(
          /^(\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*)\s*(.*)$/u
        );

        let icon: string;
        let title: string;

        if (emojiMatch) {
          icon = emojiMatch[1];
          title = emojiMatch[2]?.trim() || '';
        } else {
          icon = DEFAULT_TAG_ICONS[tag] || '📌';
          title = part1;
        }

        blocks.push({
          type: 'callout',
          icon,
          title,
          ...(badge ? { badge } : {}),
          text,
        });
        continue;
      }
    }

    // 3. Acumulación de líneas de párrafo
    currentParagraphLines.push(trimmed);
  }

  flushParagraph();

  // Si no se detectaron encabezados explícitos y se suministró un defaultTitle, se agrega § 1.
  if (headingCount === 0 && cleanDefault) {
    blocks.unshift({
      type: 'heading',
      symbol: '§ 1.',
      title: cleanDefault,
    });
  }

  return blocks;
}
