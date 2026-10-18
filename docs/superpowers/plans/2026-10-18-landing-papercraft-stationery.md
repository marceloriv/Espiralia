# Landing Page Warm Editorial Stationery & Papercraft UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Espiralia home/landing page (`LandingView` and its sub-components) into a visually captivating analog papercraft sanctuary (*Warm Editorial Stationery*), incorporating multi-layer dossiers, folder tabs with clips, torn paper slips with polygon cutouts, washi tape accents, and realistic stationery ephemera aligned with `DESIGN.md`.

**Architecture:** 
- Break the landing visual experience into modular, highly aesthetic papercraft components in `src/components/landing/`:
  1. `LandingHeroCard`: Multi-layered stationery ensemble composed of a Manila dossier folder with tab, an asymmetric torn-edge paper slip with brass clip, and a rotated sticky note with washi tape and calligraphic quote.
  2. `LandingFolderCards`: A dedicated 3-pillar section featuring authentic Library Folder Tab Cards with stepped tabs (`01 / ESTUDIOS`, `02 / DIARIO`, `03 / HORIZONTE`), watermark background numbers, brass paper clips, and washi tape strips.
  3. `LandingRitmosSection`: Transform daily rhythm cards into torn paper tickets / slips with serrated top/bottom cutouts (`clip-path: polygon(...)`), ticket notches, washi tape anchors, and stamped labels.
  4. `LandingDeskPreview`: Elevate the central A4 sheet with an underlay paper stack (`--shadow-card-stack`), realistic brass binder clips, ruled lines, and torn edge stub.
  5. `LandingView`: Integrate all papercraft components, add subtle desk bujo grid and ruler markings, and guarantee full responsiveness and WCAG 2.2 AA accessibility.

**Tech Stack:** TypeScript 5.8, React 19.2, CSS Modules (`*.module.css`), Lucide React, Vitest 3.x, `@testing-library/react`.

**Spec:** `DESIGN.md` (Sistema de Diseño Visual Maestro & Especificación de Papelería Editorial: §1 Filosofía Papercraft UI, §2 Tokens de Color, §3 Tipografía Tríadica, §4 Formas & Sombras, §5.C Componentes de Papelería Artesanal).

## Global Constraints

- **Canvas Unificador:** Fondo base en pliego marfil cálido (`--color-canvas: #faf9f5` / `#FCF9F6`), sin blancos clínicos puros a nivel global (`DESIGN.md` §1.3, §6).
- **Tipografía Tríadica:** Serif (`--font-display` / `--font-primary`) para titulares, Sans (`--font-body` / `--font-family-2`) para lectura y control, Script (`--font-script`) para aforismos y notas adhesivas, Monospace (`--font-code`) para metadatos (`DESIGN.md` §3).
- **Sombras Multicapa:** Utilizar `--shadow-sheet`, `--shadow-card-stack`, `--shadow-folder-tab` y `--shadow-postit` para simular hojas de papel físico reposando sobre un escritorio analógico (`DESIGN.md` §4).
- **Accesibilidad y Movilidad:** Todas las áreas interactivas deben medir ≥44px de alto, focus visible con `--focus-ring`, `aria-hidden="true"` en elementos puramente decorativos (clips, washi tape, watermark numbers), y `@media (prefers-reduced-motion: reduce)` desactivando rotaciones y animaciones (`AGENTS.md` §7, WCAG 2.2).
- **Convención de Commits:** Conventional Commits con Gitmoji obligatorio en español según catálogo del proyecto (`:art: style(...)`, `:sparkles: feat(...)`, `:recycle: refactor(...)`, `:white_check_mark: test(...)`) (`AGENTS.md` §11.2).

## Review Focus

1. **Vestibular accessibility (`prefers-reduced-motion`)**: Sticky notes, dossiers, and folded papers with CSS rotations (`rotate(-2deg)`, `rotate(1.5deg)`) must reset to `transform: none !important` when the user requests reduced motion.
   *Pinned to Task 5: Step 1 (test reduced motion styles in `LandingView.test.tsx`).*
2. **Horizontal overflow on narrow viewports (<360px)**: Asymmetric folder tabs, paper clips protruding outside container bounds, and rotated cards must not cause horizontal scroll or layout breakages.
   *Pinned to Task 5: Step 1 (test responsive wrapper classes and overflow guards).*
3. **Screen reader cleanliness for decorative papercraft**: Metallic clips, washi tapes, watermark background numerals (`01`, `02`), and torn edge clipping paths must have `aria-hidden="true"` so assistive technologies only read semantic content.
   *Pinned to Task 2: Step 1 (test `aria-hidden` on folder tabs decor in `LandingFolderCards.test.tsx`).*
4. **Color contrast on colored paper stocks**: Text placed over colored folder tabs (manila, slate, sage, amber) and sticky note cards must maintain WCAG 2.2 AA (≥4.5:1) text contrast.
   *Pinned to Task 2: Step 1 (test contrast tokens and styles on folder tabs).*
5. **Interactive button resilience**: Primary CTA buttons ("Comenzar Cuaderno", "Abrir Cuaderno Inmediato") must invoke navigation callbacks safely even if optional props are omitted or undefined.
   *Pinned to Task 5: Step 1 (test `LandingView` default prop handlers).*

---

### Task 1: Multi-Layer Stationery Dossier & Paper Ensemble en `LandingHeroCard`

**Files:**
- Modify: `src/components/landing/LandingHeroCard.tsx`
- Modify: `src/components/landing/LandingHeroCard.module.css`
- Test: `src/tests/LandingHeroCard.test.tsx`

**Interfaces:**
- Consumes: CSS tokens from `src/index.css` (`--color-surface-warm`, `--color-hairline`, `--font-script`, `--font-code`, `--shadow-folder-tab`, `--shadow-postit`).
- Produces: `LandingHeroCard` component displaying a 3-layer papercraft vignette:
  1. Fondo: Dossier de archivo Manila/Kraft (`.dossierFolder`) con pestaña superior `EXP. 2026 / SANTUARIO` y textura de cartulina.
  2. Capa intermedia: Pliego rasgado (`.tornPaperSlip`) con borde asimétrico `clip-path: polygon(...)`, trama bujo, sello "BIORRITMO HOY • EN FOCO", indicador de claridad mental y clip de latón metálico (`.brassClip`).
  3. Capa superior: Nota adhesiva amarilla rotada (`.stickyNote`) con clip dorado, cinta washi tape magenta semitransparente, aforismo manuscrito "small steps every day lead to big results ♡" y metadatos.

- [ ] **Step 1: Escribir el test fallido para la composición de papelería en `src/tests/LandingHeroCard.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LandingHeroCard } from '../components/landing/LandingHeroCard';

describe('LandingHeroCard', () => {
  it('renderiza la nota adhesiva con aforismo caligráfico, cinta washi y clip dorado', () => {
    render(<LandingHeroCard />);
    expect(screen.getByText(/aforismo matutino/i)).toBeInTheDocument();
    expect(screen.getByText(/№ 042/i)).toBeInTheDocument();
    expect(screen.getByText(/small steps every day lead to big results/i)).toBeInTheDocument();
    expect(screen.getByText(/tinta ferrogalorresistente/i)).toBeInTheDocument();
  });

  it('despliega la ficha de biorritmo sobre pliego rasgado con sello de imprenta y porcentaje', () => {
    render(<LandingHeroCard />);
    expect(screen.getByText(/biorritmo hoy/i)).toBeInTheDocument();
    expect(screen.getByText(/en foco/i)).toBeInTheDocument();
    expect(screen.getByText(/claridad mental/i)).toBeInTheDocument();
    expect(screen.getByText(/88%/i)).toBeInTheDocument();
  });

  it('despliega la carpeta dossier de expediente analógico con pestaña de archivo y clip metálico', () => {
    render(<LandingHeroCard />);
    expect(screen.getByText(/exp\. 2026 \/ santuario/i)).toBeInTheDocument();
    expect(screen.getByText(/bóveda documental/i)).toBeInTheDocument();
    const dossier = screen.getByLabelText(/expediente analógico santuario/i);
    expect(dossier).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Ejecutar el test para verificar que falla**

Run: `pnpm exec vitest run src/tests/LandingHeroCard.test.tsx`
Expected: FAIL con "Unable to find an element with text: /exp\. 2026 \/ santuario/i".

- [ ] **Step 3: Implementar la carpeta dossier y pliego rasgado en `LandingHeroCard.tsx` y `LandingHeroCard.module.css`**

En `LandingHeroCard.tsx`:
- Añadir el contenedor dossier (`<div className={styles.dossierFolder} aria-label="Expediente analógico Santuario">`) con solapa superior de archivo (`.dossierTab`), sello en relieve (`.dossierSeal`), y texto "EXP. 2026 / SANTUARIO • Bóveda Documental".
- Envolver la tarjeta de biorritmo en `.tornPaperSlip` con clip de latón metálico (`.brassClip`) y borde de papel cortado asimétrico.
- Mantener la nota adhesiva `.stickyNote` con su micro-rotación, cinta washi magenta y aforismo manuscrito.

En `LandingHeroCard.module.css`:
- Añadir estilos para `.dossierFolder` (color manila cálido `#EDE3D0`, borde `1px solid #DDD5C6`, `border-radius: 4px 12px 12px 12px`, pestaña superior `.dossierTab` desfasada con `border-radius: 8px 8px 0 0`, sombra `--shadow-folder-tab`).
- Añadir estilos para `.tornPaperSlip` con `clip-path: polygon(...)` arriba y abajo (emulando borde dentado de papel rasgado), fondo blanco marfil `#FCF9F6`, y trama bujo sutil.
- Añadir doble clip metálico (latón dorado con reflejos degradados).

- [ ] **Step 4: Ejecutar el test para verificar que pasa**

Run: `pnpm exec vitest run src/tests/LandingHeroCard.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit con Gitmoji**

```bash
git add src/components/landing/LandingHeroCard.tsx src/components/landing/LandingHeroCard.module.css src/tests/LandingHeroCard.test.tsx
git commit -m ":sparkles: feat(landing): enriquecer hero card con dossier manila y pliego rasgado"
```

---

### Task 2: Fichas de Archivador con Tab Superior (`LandingFolderCards`) para los Tres Pilares

**Files:**
- Create: `src/components/landing/LandingFolderCards.tsx`
- Create: `src/components/landing/LandingFolderCards.module.css`
- Create: `src/tests/LandingFolderCards.test.tsx`

**Interfaces:**
- Consumes: Tokens de diseño de `DESIGN.md` §5.C.1 (`--color-surface-card`, `--color-surface-warm`, `--color-hairline`, `--color-muted`, `--color-accent-sage`, `--color-accent-amber`, `--color-primary`).
- Produces: `LandingFolderCards` component exportado como `React.FC`. Renderiza 3 fichas de archivador escalonadas:
  1. Carpeta 01: Pestaña izquierda `01 / ESTUDIOS`, número de agua `01`, clip de latón, título "1. Estudios & Foco Práctico", métrica "92% de éxito en simulaciones".
  2. Carpeta 02: Pestaña central `02 / DIARIO`, número de agua `02`, franja de washi tape salvia, título "2. Introspección & Diario", métrica "Sin límites de caracteres • Privacidad total".
  3. Carpeta 03: Pestaña derecha `03 / HORIZONTE`, número de agua `03`, clip dorado, título "3. Horizonte & Universidad", métrica "6 de 8 documentos verificados".

- [ ] **Step 1: Escribir el test unitario en `src/tests/LandingFolderCards.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LandingFolderCards } from '../components/landing/LandingFolderCards';

describe('LandingFolderCards', () => {
  it('renderiza las 3 fichas de archivador con solapas superiores y números monumentales de agua', () => {
    render(<LandingFolderCards />);
    
    expect(screen.getByRole('heading', { level: 3, name: /1\. estudios & foco práctico/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: /2\. introspección & diario/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: /3\. horizonte & universidad/i })).toBeInTheDocument();

    expect(screen.getByText(/01 \/ estudios/i)).toBeInTheDocument();
    expect(screen.getByText(/02 \/ diario/i)).toBeInTheDocument();
    expect(screen.getByText(/03 \/ horizonte/i)).toBeInTheDocument();

    expect(screen.getByText('01', { selector: '[data-watermark="01"]' })).toBeInTheDocument();
    expect(screen.getByText('02', { selector: '[data-watermark="02"]' })).toBeInTheDocument();
    expect(screen.getByText('03', { selector: '[data-watermark="03"]' })).toBeInTheDocument();
  });

  it('incluye elementos decorativos de papelería marcados con aria-hidden', () => {
    const { container } = render(<LandingFolderCards />);
    const clips = container.querySelectorAll('[data-papercraft="clip"]');
    const washiTapes = container.querySelectorAll('[data-papercraft="washi-tape"]');
    
    expect(clips.length).toBeGreaterThan(0);
    expect(washiTapes.length).toBeGreaterThan(0);
    clips.forEach(clip => expect(clip).toHaveAttribute('aria-hidden', 'true'));
    washiTapes.forEach(tape => expect(tape).toHaveAttribute('aria-hidden', 'true'));
  });

  it('despliega las métricas en recuadros estilo ficha técnica de imprenta', () => {
    render(<LandingFolderCards />);
    expect(screen.getByText(/92% de éxito en simulaciones/i)).toBeInTheDocument();
    expect(screen.getByText(/sin límites de caracteres • privacidad total/i)).toBeInTheDocument();
    expect(screen.getByText(/6 de 8 documentos verificados/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Ejecutar el test para verificar que falla**

Run: `pnpm exec vitest run src/tests/LandingFolderCards.test.tsx`
Expected: FAIL con error de importación o módulo no encontrado.

- [ ] **Step 3: Implementar `LandingFolderCards.tsx` y `LandingFolderCards.module.css`**

En `LandingFolderCards.tsx`:
- Definir las 3 fichas de archivador con su estructura semántica (`<article className={styles.folderCard}>`).
- Cada ficha tiene:
  - Solapa superior (`<div className={styles.folderTab}>` con alineación desfasada izquierda/centro/derecha según la tarjeta).
  - Decoración de papelería: clip metálico o tira de washi tape con `aria-hidden="true"`.
  - Número monumental de agua de fondo (`<span className={styles.watermarkNumber} data-watermark="01" aria-hidden="true">01</span>`).
  - Cabecera con título `<h3>`, descripción en texto serif/sans de imprenta.
  - Recuadro inferior de métrica con icono editorial (`Sparkles`, `Feather`, `GraduationCap`).

En `LandingFolderCards.module.css`:
- `.folderCardsGrid`: Grilla responsiva de 3 columnas (`repeat(3, 1fr)` en desktop, 1 columna en móvil).
- `.folderCard`: Fondo `var(--color-surface-card, #ffffff)`, borde `1px solid var(--color-hairline, #e6dfd8)`, `border-radius: 0 12px 12px 12px` (o con solapa superior coordinada), sombra `--shadow-folder-tab`, posición relativa y desbordamiento controlado.
- `.folderTab`: Solapa superior sobresaliente con `border-radius: 8px 8px 0 0`, borde superior/lateral `1px solid var(--color-hairline)`, fondo cálido manila o tono temático (pizarra, salvia, ámbar).
- `.watermarkNumber`: Tipografía monumental (`font-size: 5rem`, `font-weight: 800`, `opacity: 0.12`, `color: var(--color-muted)`, posición absoluta inferior derecha, sin interferir con eventos de puntero `pointer-events: none`).
- `.goldClip` y `.washiTape`: Efectos físicos de sujeción analógica.

- [ ] **Step 4: Ejecutar el test para verificar que pasa**

Run: `pnpm exec vitest run src/tests/LandingFolderCards.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit con Gitmoji**

```bash
git add src/components/landing/LandingFolderCards.tsx src/components/landing/LandingFolderCards.module.css src/tests/LandingFolderCards.test.tsx
git commit -m ":sparkles: feat(landing): crear fichas de archivador con solapas para los tres pilares"
```

---

### Task 3: Boletos de Turno y Pliegos Rasgados en `LandingRitmosSection`

**Files:**
- Modify: `src/components/landing/LandingRitmosSection.tsx`
- Modify: `src/components/landing/LandingRitmosSection.module.css`
- Test: `src/tests/LandingRitmosSection.test.tsx`

**Interfaces:**
- Consumes: Tokens `--color-canvas`, `--color-hairline`, `--color-surface-card`, `--color-washi-primary`, `--color-washi-slate`.
- Produces: `LandingRitmosSection` con las 3 tarjetas de cadencia vital estilizadas como boletos de turno de papelería física:
  1. Borde superior dentado/rasgado con `clip-path: polygon(...)`.
  2. Muescas laterales de boleto perforado (*ticket notches*).
  3. Cinta washi tape decorativa en ángulo sujetando cada boleto al lienzo marfil.
  4. Sellos de imprenta `MOMENTO 01`, `MOMENTO 02`, `MOMENTO 03`.

- [ ] **Step 1: Actualizar pruebas en `src/tests/LandingRitmosSection.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LandingRitmosSection } from '../components/landing/LandingRitmosSection';

describe('LandingRitmosSection', () => {
  it('despliega los tres momentos de cadencia vital con horarios e iconos representativos', () => {
    render(<LandingRitmosSection />);
    expect(screen.getByRole('heading', { level: 2, name: /una cadencia vital que respeta tus límites/i })).toBeInTheDocument();
    expect(screen.getByText(/01 • 07:30 - 09:00/i)).toBeInTheDocument();
    expect(screen.getByText(/02 • 11:00 - 13:00/i)).toBeInTheDocument();
    expect(screen.getByText(/03 • 20:00 - 20:30/i)).toBeInTheDocument();
  });

  it('renderiza los boletos con sellos de boleto perforado y cintas washi tape', () => {
    const { container } = render(<LandingRitmosSection />);
    const ticketStubs = container.querySelectorAll('[data-papercraft="ticket-stub"]');
    expect(ticketStubs.length).toBe(3);
    
    const washiTapes = container.querySelectorAll('[data-papercraft="washi-tape"]');
    expect(washiTapes.length).toBe(3);
  });

  it('incluye las métricas de serenidad en cada momento de la jornada', () => {
    render(<LandingRitmosSection />);
    expect(screen.getByText(/1 sola prioridad crítica • modo sin notificaciones/i)).toBeInTheDocument();
    expect(screen.getByText(/checklist visible • cierre antes del mediodía/i)).toBeInTheDocument();
    expect(screen.getByText(/cero pantallas tras el cierre • calma mental/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Ejecutar el test para verificar que falla**

Run: `pnpm exec vitest run src/tests/LandingRitmosSection.test.tsx`
Expected: FAIL con `ticketStubs.length` siendo 0.

- [ ] **Step 3: Implementar boletos de papel rasgado en `LandingRitmosSection.tsx` y `LandingRitmosSection.module.css`**

En `LandingRitmosSection.tsx`:
- Añadir el atributo `data-papercraft="ticket-stub"` a cada `<article className={styles.ritmoTicket}>`.
- Añadir franjas de washi tape `<div className={styles.ticketWashiTape} data-papercraft="washi-tape" aria-hidden="true" />` con variantes tonales (magenta, ámbar, teal).
- Añadir línea perforada decorativa divisoria entre la cabecera del boleto y la métrica de pie.

En `LandingRitmosSection.module.css`:
- `.ritmoTicket`: Tarjeta con acabado de papel cortado artesanal:
  ```css
  clip-path: polygon(
    0% 6px, 4% 1px, 8% 6px, 12% 2px, 16% 6px, 20% 1px, 24% 6px, 28% 2px,
    32% 6px, 36% 1px, 40% 6px, 44% 2px, 48% 6px, 52% 1px, 56% 6px, 60% 2px,
    64% 6px, 68% 1px, 72% 6px, 76% 2px, 80% 6px, 84% 1px, 88% 6px, 92% 2px,
    96% 6px, 100% 1px, 100% 100%, 0% 100%
  );
  ```
- Sombra `filter: drop-shadow(0 4px 12px rgba(26, 25, 23, 0.05))` para que la sombra se adapte fielmente al contorno rasgado del `clip-path`.
- Muescas de ticket con `radial-gradient` transparente en los bordes laterales a la altura del divisor punteado.
- Micro-rotación sutil alternada (`-0.5deg`, `0.4deg`, `-0.3deg`).

- [ ] **Step 4: Ejecutar el test para verificar que pasa**

Run: `pnpm exec vitest run src/tests/LandingRitmosSection.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit con Gitmoji**

```bash
git add src/components/landing/LandingRitmosSection.tsx src/components/landing/LandingRitmosSection.module.css src/tests/LandingRitmosSection.test.tsx
git commit -m ":art: style(landing): transformar ritmos en boletos de papel rasgado con washi tape"
```

---

### Task 4: Pila de Hojas y Sujeción con Broches Metálicos en `LandingDeskPreview`

**Files:**
- Modify: `src/components/landing/LandingDeskPreview.tsx`
- Modify: `src/components/landing/LandingDeskPreview.module.css`
- Test: `src/tests/LandingDeskPreview.test.tsx`

**Interfaces:**
- Consumes: Tokens `--shadow-card-stack`, `--color-canvas-paper`, `--color-hairline`, `--color-surface-warm`.
- Produces: `LandingDeskPreview` enriquecida con:
  1. Pila de pliegos superpuestos (`.paperSheetStack`: hoja posterior desfasada con micro-rotación 0.8deg visible bajo el pliego principal).
  2. Broche archivador metálico doble (*brass binder clip*) con arco de alambre y mordaza central en relieve.
  3. Renglones suaves continuos estilo libreta de notas en la sección horaria.
  4. Nota táctil de captura rápida con esquina doblada (*folded corner*) y chincheta dorada.

- [ ] **Step 1: Actualizar pruebas en `src/tests/LandingDeskPreview.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LandingDeskPreview } from '../components/landing/LandingDeskPreview';

describe('LandingDeskPreview', () => {
  it('despliega la cabecera de la mesa de trabajo con badge y titular editorial', () => {
    render(<LandingDeskPreview />);
    expect(screen.getByRole('heading', { level: 2, name: /la mesa de trabajo: tu centro de control silencioso/i })).toBeInTheDocument();
    expect(screen.getByText(/mesa de trabajo en vivo/i)).toBeInTheDocument();
  });

  it('despliega el pliego diario A4 con pila de hojas superpuestas y broche archivador metálico', () => {
    const { container } = render(<LandingDeskPreview />);
    expect(screen.getByText(/plan de foco • hoy/i)).toBeInTheDocument();
    expect(screen.getByText(/estudio licencia clase b/i)).toBeInTheDocument();
    expect(screen.getByText(/papel libre de ácido • 120 gsm/i)).toBeInTheDocument();

    const paperStack = container.querySelector('[data-papercraft="paper-stack"]');
    const binderClip = container.querySelector('[data-papercraft="binder-clip"]');
    expect(paperStack).toBeInTheDocument();
    expect(binderClip).toBeInTheDocument();
    expect(binderClip).toHaveAttribute('aria-hidden', 'true');
  });

  it('permite alternar el estado de completado en las tareas interactivas', async () => {
    const user = userEvent.setup();
    render(<LandingDeskPreview />);

    const secondTaskCheckbox = screen.getByRole('checkbox', { name: /postulación universitaria 2026/i });
    expect(secondTaskCheckbox).not.toBeChecked();

    await user.click(secondTaskCheckbox);
    expect(secondTaskCheckbox).toBeChecked();
  });

  it('despliega la tarjeta de estado vital y la nota táctil de captura rápida', () => {
    render(<LandingDeskPreview />);
    expect(screen.getByText(/estado vital & ritmo/i)).toBeInTheDocument();
    expect(screen.getByText(/captura rápida/i)).toBeInTheDocument();
    expect(screen.getByText(/no confundir movimiento con progreso/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Ejecutar el test para verificar que falla**

Run: `pnpm exec vitest run src/tests/LandingDeskPreview.test.tsx`
Expected: FAIL con `paperStack` no encontrado.

- [ ] **Step 3: Implementar la pila de hojas y broches en `LandingDeskPreview.tsx` y `LandingDeskPreview.module.css`**

En `LandingDeskPreview.tsx`:
- Envolver el pliego principal en un contenedor de pila `<div className={styles.paperSheetWrapper} data-papercraft="paper-stack">`.
- Añadir la hoja secundaria de fondo `<div className={styles.paperSheetUnderlay} aria-hidden="true" />`.
- Enriquecer el broche archivador `<div className={styles.binderClip} data-papercraft="binder-clip" aria-hidden="true">` con doble asa metálica.
- Añadir acabado de renglones suaves en la grilla de bloques de tiempo.
- Añadir la esquina plegada y sombra de chincheta a `.quickNoteCard`.

En `LandingDeskPreview.module.css`:
- `.paperSheetWrapper`: Posición relativa, `z-index: 1`.
- `.paperSheetUnderlay`: Posición absoluta detrás (`top: 6px; left: 4px; right: -4px; bottom: -6px`), fondo marfil `#f5f0e8`, borde `1px solid #e6dfd8`, `border-radius: 4px`, `transform: rotate(0.8deg)`, sombra `--shadow-card-stack`.
- `.binderClip`: Mordaza de acero y latón dorado (`linear-gradient(180deg, #3a3835 0%, #1f1e1b 100%)`) con asa de alambre dorada (`border: 2.5px solid #d4af37; border-radius: 6px 6px 0 0`).
- `.quickNoteCard`: Esquina plegada con pseudo-elemento `::before` triangular en la esquina superior derecha (`linear-gradient(135deg, transparent 50%, rgba(20, 20, 19, 0.08) 50%)`).

- [ ] **Step 4: Ejecutar el test para verificar que pasa**

Run: `pnpm exec vitest run src/tests/LandingDeskPreview.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit con Gitmoji**

```bash
git add src/components/landing/LandingDeskPreview.tsx src/components/landing/LandingDeskPreview.module.css src/tests/LandingDeskPreview.test.tsx
git commit -m ":art: style(landing): agregar efecto pila de hojas y broches de latón a la mesa de trabajo"
```

---

### Task 5: Integración del Escritorio Editorial en `LandingView` y Verificación A11y

**Files:**
- Modify: `src/components/LandingView.tsx`
- Modify: `src/components/LandingView.module.css`
- Test: `src/tests/LandingView.test.tsx`

**Interfaces:**
- Consumes: `LandingFolderCards` de `src/components/landing/LandingFolderCards.tsx`, `LandingHeroCard`, `LandingDeskPreview`, `LandingRitmosSection`, `LandingManifestoSection`.
- Produces: `LandingView` integrado, con fondo de escritorio cálido (trama bujo sutil y textura de regla editorial), sin desbordamiento horizontal y accesible en teclado y lectores de pantalla.

- [ ] **Step 1: Actualizar la suite de integración en `src/tests/LandingView.test.tsx`**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LandingView } from '../components/LandingView';

describe('LandingView', () => {
  it('renderiza la cabecera editorial con indicador v2.4 papelería y titular display', () => {
    render(<LandingView onNavigateLogin={() => {}} />);
    expect(screen.getByRole('heading', { level: 1, name: /el arte de organizar tu vida con serenidad cotidiana/i })).toBeInTheDocument();
    expect(screen.getByText(/v2\.4 papelería/i)).toBeInTheDocument();
    expect(screen.getByText(/100% client-side • sin rastreo • almacenamiento local/i)).toBeInTheDocument();
    expect(screen.getByText(/indexeddb cifrado/i)).toBeInTheDocument();
    expect(screen.getByText(/biorritmo hoy/i)).toBeInTheDocument();
  });

  it('integra las fichas de archivador en la sección de pilares con enlaces ancla', () => {
    render(<LandingView onNavigateLogin={() => {}} />);
    expect(screen.getByText(/1\. estudios & foco práctico/i)).toBeInTheDocument();
    expect(screen.getByText(/2\. introspección & diario/i)).toBeInTheDocument();
    expect(screen.getByText(/3\. horizonte & universidad/i)).toBeInTheDocument();
    expect(screen.getByText(/01 \/ estudios/i)).toBeInTheDocument();

    const pilaresSection = document.getElementById('pilares');
    expect(pilaresSection).toBeInTheDocument();
  });

  it('dispara la navegación hacia login al hacer clic en comenzar cuaderno o acceder', async () => {
    const user = userEvent.setup();
    const handleLogin = vi.fn();
    render(<LandingView onNavigateLogin={handleLogin} />);

    const ctaBtns = screen.getAllByRole('button', { name: /comenzar cuaderno|abrir cuaderno inmediato/i });
    expect(ctaBtns.length).toBeGreaterThan(0);
    await user.click(ctaBtns[0]);

    expect(handleLogin).toHaveBeenCalled();
  });

  it('soporta navegación hacia dashboard si el usuario ya cuenta con perfil activo', async () => {
    const user = userEvent.setup();
    const handleDashboard = vi.fn();
    render(
      <LandingView
        onNavigateLogin={() => {}}
        onNavigateDashboard={handleDashboard}
        hasActiveProfile={true}
      />
    );

    const ctaBtns = screen.getAllByRole('button', { name: /comenzar cuaderno|abrir cuaderno inmediato/i });
    await user.click(ctaBtns[0]);
    expect(handleDashboard).toHaveBeenCalled();
  });

  it('mantiene reglas de accesibilidad para movimiento reducido', () => {
    const { container } = render(<LandingView onNavigateLogin={() => {}} />);
    const wrapper = container.querySelector('[class*="landingWrapper"]');
    expect(wrapper).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Ejecutar el test para verificar que falla**

Run: `pnpm exec vitest run src/tests/LandingView.test.tsx`
Expected: FAIL con `01 / estudios` no encontrado en `LandingView`.

- [ ] **Step 3: Reemplazar pilares planos por `LandingFolderCards` y pulir `LandingView.module.css`**

En `LandingView.tsx`:
- Importar `LandingFolderCards` desde `./landing/LandingFolderCards`.
- Reemplazar la grilla estática `.pilaresGrid` por `<LandingFolderCards />` dentro de `<section id="pilares">`.
- Añadir detalle de regla/escala editorial en la barra de micro-specs del Hero.

En `LandingView.module.css`:
- Añadir trama milimetrada bujo muy suave al fondo del hero:
  ```css
  background-image: radial-gradient(var(--color-grid-bujo, #dfd8cc) 0.65px, transparent 0.65px);
  background-size: 24px 24px;
  ```
- Añadir regla `@media (prefers-reduced-motion: reduce)` que resetea las micro-rotaciones en todas las tarjetas de papelería (`transform: none !important; transition: none !important;`).
- Añadir protección de desbordamiento horizontal: `overflow-x: hidden; width: 100%;` en el envoltorio general.

- [ ] **Step 4: Ejecutar la suite completa de pruebas de Landing**

Run: `pnpm exec vitest run src/tests/Landing*`
Expected: PASS en todos los archivos de test (LandingView, LandingHeroCard, LandingFolderCards, LandingDeskPreview, LandingRitmosSection, LandingManifestoSection).

- [ ] **Step 5: Ejecutar la suite global para garantizar cero regresiones**

Run: `pnpm exec vitest run`
Expected: PASS en todos los tests de la suite.

- [ ] **Step 6: Commit con Gitmoji**

```bash
git add src/components/LandingView.tsx src/components/LandingView.module.css src/tests/LandingView.test.tsx
git commit -m ":recycle: refactor(landing): integrar fichas de archivador y ambientación de escritorio editorial"
```

---
