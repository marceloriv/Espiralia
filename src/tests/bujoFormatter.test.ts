import { describe, it, expect } from 'vitest';
import {
  countWords,
  parseBujoContent,
  getCategoryRibbonColor,
  type BujoHeadingBlock,
  type BujoCalloutBlock,
  type BujoParagraphBlock,
} from '../utils/bujoFormatter';

describe('bujoFormatter', () => {
  describe('countWords', () => {
    it('calcula 0 para texto vacío o solo espacios en blanco', () => {
      expect(countWords('')).toBe(0);
      expect(countWords('   \n\t  ')).toBe(0);
    });

    it('calcula palabras exactas ignorando espacios extra, tabulaciones y saltos de línea', () => {
      expect(countWords('Hola')).toBe(1);
      expect(countWords('Hola    mundo')).toBe(2);
      expect(countWords('   En la   sesión de terapia anterior   revisamos   ')).toBe(7);
      expect(countWords("discipline today,\npeace tomorrow ♡\n\n— Cuaderno #4")).toBe(8);
    });

    it('maneja con seguridad valores nulos o tipos no string', () => {
      expect(countWords(undefined as unknown as string)).toBe(0);
      expect(countWords(null as unknown as string)).toBe(0);
    });
  });

  describe('parseBujoContent', () => {
    it('parsea encabezados con § o # como BujoHeadingBlock numerados secuencialmente', () => {
      const content = `
# Descompresión mental & Autoobservación
En la sesión de terapia anterior revisamos que la necesidad de control absoluto suele enmascarar miedo a ser evaluada.

§ 2. Planes de Postulación 2026
Conversado con el orientador: mantener el ritmo de lectura pausada.

### Reflexiones de Cierre
Concluir el día con calma vale más que tachar doce casillas con taquicardia.
      `.trim();

      const blocks = parseBujoContent(content);

      const headings = blocks.filter((b): b is BujoHeadingBlock => b.type === 'heading');
      expect(headings).toHaveLength(3);

      expect(headings[0]).toEqual({
        type: 'heading',
        symbol: '§ 1.',
        title: 'Descompresión mental & Autoobservación',
      });

      expect(headings[1]).toEqual({
        type: 'heading',
        symbol: '§ 2.',
        title: 'Planes de Postulación 2026',
      });

      expect(headings[2]).toEqual({
        type: 'heading',
        symbol: '§ 3.',
        title: 'Reflexiones de Cierre',
      });
    });

    it('parsea bloques de caja tipo [caja: 🚗 Avance | 91% Aprobado | Texto] o [hito: ...] como BujoCalloutBlock', () => {
      const content = `
[caja: 🚗 Avance Conaset - Simulacro Clase B | 32 / 35 Aprobado (91%) | Puntos críticos a repasar antes de salir a la vía: distancia de frenado en calzada húmeda.]

[hito: 🎯 Meta Semanal | 100% | 5 días de meditación matutina completados.]

[caja: 🌿 Pausa Consciente | Tomar 10 minutos para respirar sin mirar la pantalla.]

[caja: Examen Práctico | 100% | Excelente control de embrague.]
      `.trim();

      const blocks = parseBujoContent(content);
      const callouts = blocks.filter((b): b is BujoCalloutBlock => b.type === 'callout');

      expect(callouts).toHaveLength(4);

      expect(callouts[0]).toEqual({
        type: 'callout',
        icon: '🚗',
        title: 'Avance Conaset - Simulacro Clase B',
        badge: '32 / 35 Aprobado (91%)',
        text: 'Puntos críticos a repasar antes de salir a la vía: distancia de frenado en calzada húmeda.',
      });

      expect(callouts[1]).toEqual({
        type: 'callout',
        icon: '🎯',
        title: 'Meta Semanal',
        badge: '100%',
        text: '5 días de meditación matutina completados.',
      });

      expect(callouts[2]).toEqual({
        type: 'callout',
        icon: '🌿',
        title: 'Pausa Consciente',
        text: 'Tomar 10 minutos para respirar sin mirar la pantalla.',
      });

      // Sin emoji en título usa icono por defecto del tag ('📌' para caja)
      expect(callouts[3]).toEqual({
        type: 'callout',
        icon: '📌',
        title: 'Examen Práctico',
        badge: '100%',
        text: 'Excelente control de embrague.',
      });
    });

    it('envuelve texto plano en párrafos y agrega § 1. con defaultTitle si no tiene encabezados explícitos', () => {
      const content = `
Hoy decidí caminar por el parque sin auriculares. El crujido de las hojas secas me devolvió al presente.

Al volver a casa preparé una infusión de manzanilla y me senté a escribir sin juzgar la caligrafía.
      `.trim();

      const blocks = parseBujoContent(content, 'Diario de la Tarde');

      expect(blocks[0]).toEqual({
        type: 'heading',
        symbol: '§ 1.',
        title: 'Diario de la Tarde',
      });

      const paragraphs = blocks.filter((b): b is BujoParagraphBlock => b.type === 'paragraph');
      expect(paragraphs).toHaveLength(2);
      expect(paragraphs[0].text).toContain('Hoy decidí caminar por el parque sin auriculares');
      expect(paragraphs[1].text).toContain('Al volver a casa preparé una infusión');
    });

    it('no agrega encabezado duplicado si ya existen encabezados explícitos aunque se pase defaultTitle', () => {
      const content = `
§ 1. Nota Ya Titulada
Cuerpo de la nota existente.
      `.trim();

      const blocks = parseBujoContent(content, 'Título Ignorado');
      const headings = blocks.filter((b): b is BujoHeadingBlock => b.type === 'heading');

      expect(headings).toHaveLength(1);
      expect(headings[0].title).toBe('Nota Ya Titulada');
    });

    it('maneja contenido vacío retornando arreglo vacío o solo encabezado si hay defaultTitle', () => {
      expect(parseBujoContent('')).toEqual([]);
      expect(parseBujoContent('   ')).toEqual([]);
      expect(parseBujoContent('', 'Nueva Nota')).toEqual([
        {
          type: 'heading',
          symbol: '§ 1.',
          title: 'Nueva Nota',
        },
      ]);
    });
  });

  describe('getCategoryRibbonColor', () => {
    it('entrega el token o hex apropiado según si es reflexión o tag de estudio', () => {
      // Reflexión usa token de color primario de Espiralia
      expect(getCategoryRibbonColor(true)).toBe('var(--color-primary)');
      expect(getCategoryRibbonColor(true, ['personal'])).toBe('var(--color-primary)');
      expect(getCategoryRibbonColor(false, ['reflexión'])).toBe('var(--color-primary)');

      // Tags de estudio usan tono esmeralda / teal editorial
      expect(getCategoryRibbonColor(false, ['estudio'])).toBe('#047857');
      expect(getCategoryRibbonColor(false, ['conaset'])).toBe('#047857');
      expect(getCategoryRibbonColor(false, ['examen'])).toBe('#047857');

      // Tags de ideas / proyectos usan tono ámbar
      expect(getCategoryRibbonColor(false, ['idea'])).toBe('#d97706');
      expect(getCategoryRibbonColor(false, ['proyecto'])).toBe('#d97706');

      // Default sin tags ni reflexión retorna token primario
      expect(getCategoryRibbonColor(false, [])).toBe('var(--color-primary)');
      expect(getCategoryRibbonColor()).toBe('var(--color-primary)');
    });
  });
});
