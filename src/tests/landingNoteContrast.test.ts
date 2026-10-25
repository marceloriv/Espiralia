/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

// R-25 / WCAG 1.4.3: Lighthouse midió 4.28, 3.72 y 3.87:1 en estos textos de la landing; piden 4.5:1.
const luminance = (hex: string): number => {
  const [r, g, b] = [1, 3, 5].map(i => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const ratio = (a: string, b: string): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const color = (file: string, selector: string, property: string): string => {
  const css = readFileSync(`src/components/landing/${file}`, 'utf8');
  const match = css.match(new RegExp(String.raw`\n\.${selector}\s*\{[^}]*?\n\s*${property}:\s*(#[0-9a-fA-F]{6})`));
  if (!match) throw new Error(`${selector} sin ${property} en ${file}`);
  return match[1];
};

const CASES: [string, string, string, string][] = [
  ['rótulo del post-it', 'LandingHeroCard.module.css', 'noteHeader', 'stickyNote'],
  ['pie del post-it', 'LandingHeroCard.module.css', 'noteFooter', 'stickyNote'],
  ['hora de la nota rápida', 'LandingDeskPreview.module.css', 'quickNoteTag', 'quickNoteCard'],
  ['pie de la nota rápida', 'LandingDeskPreview.module.css', 'quickNoteFooter', 'quickNoteCard'],
];

describe('Contraste de la insignia de la sección oscura de la landing', () => {
  // Lighthouse midió 2.13:1: la insignia usaba --color-text-teal (teal oscuro, pensado para fondos claros) sobre #29322d.
  it('usa el teal para fondos oscuros y alcanza 4.5:1 sobre la tarjeta oscura', () => {
    const css = readFileSync('src/components/landing/LandingManifestoSection.module.css', 'utf8');
    expect(css.match(/\n\.certBadge\s*\{[^}]*?\n\s*color:\s*([^;]+);/)?.[1]).toBe('var(--color-text-teal-on-dark)');
    const tokens = readFileSync('src/index.css', 'utf8');
    const teal = tokens.match(/--color-text-teal-on-dark:\s*(#[0-9a-fA-F]{6})/)?.[1] ?? '';
    expect(ratio(teal, '#29322d')).toBeGreaterThanOrEqual(4.5);
  });
});

describe('Contraste de las notas de la landing', () => {
  it.each(CASES)('%s alcanza 4.5:1 sobre su papel', (_nombre, file, texto, papel) => {
    const fg = color(file, texto, 'color');
    const bg = color(file, papel, 'background-color');
    expect(ratio(fg, bg), `${texto} ${fg} sobre ${papel} ${bg}`).toBeGreaterThanOrEqual(4.5);
  });
});
