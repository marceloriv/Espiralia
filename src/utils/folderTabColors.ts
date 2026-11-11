type Rgb = [number, number, number];

const INK_DARK: Rgb = [20, 20, 19];
const INK_LIGHT: Rgb = [255, 255, 255];

const channel = (v: number) => {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const luminance = ([r, g, b]: Rgb) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
const contrast = (a: Rgb, b: Rgb) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const toCss = (c: Rgb) => `#${c.map(v => Math.round(v).toString(16).padStart(2, '0')).join('')}`;

const parseHex = (hex: string): Rgb | null => {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const full = m[1].length === 3 ? [...m[1]].map(c => c + c).join('') : m[1];
  return [0, 2, 4].map(i => Number.parseInt(full.slice(i, i + 2), 16)) as Rgb;
};

/**
 * Relleno y tinta de la solapa de una carpeta. El color lo elige la persona, así que el texto no puede ser siempre blanco:
 * se escoge la tinta (blanca u oscura) con más contraste y, si ninguna llega a AA (4,5:1), el relleno se oscurece de a poco
 * hasta que la tinta blanca llegue. Un color inválido da el relleno magenta de marca con tinta blanca.
 */
export function folderTabColors(hex: string): { fill: string; ink: string } {
  const rgb = parseHex(hex);
  if (!rgb) return { fill: '#8e1ea2', ink: '#ffffff' };
  for (let t = 0; t <= 0.6; t += 0.05) {
    const fill = rgb.map(v => v * (1 - t)) as Rgb;
    const light = contrast(fill, INK_LIGHT);
    const dark = contrast(fill, INK_DARK);
    if (Math.max(light, dark) >= 4.5) return { fill: toCss(fill), ink: light >= dark ? '#ffffff' : '#141413' };
  }
  return { fill: toCss(rgb.map(v => v * 0.4) as Rgb), ink: '#ffffff' };
}
