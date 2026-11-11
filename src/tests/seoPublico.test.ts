import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const leer = (ruta: string) => readFileSync(ruta, 'utf-8');

describe('SEO público (GitHub Pages en /Espiralia/)', () => {
  it('index.html tiene título descriptivo y URL canónica de la landing', () => {
    const html = leer('index.html');
    expect(html).toMatch(/<title>Espiralia · [^<]{10,}<\/title>/);
    expect(html).toContain('<link rel="canonical" href="https://marceloriv.github.io/Espiralia/" />');
  });

  it('sitemap.xml lista solo la landing y robots.txt lo declara', () => {
    const sitemap = leer('public/sitemap.xml');
    expect(sitemap.match(/<loc>/g)).toHaveLength(1);
    expect(sitemap).toContain('<loc>https://marceloriv.github.io/Espiralia/</loc>');
    expect(sitemap.match(/<loc>[^<]*<\/loc>/g)!.join('')).not.toContain('#/');
    expect(leer('public/robots.txt')).toContain('Sitemap: https://marceloriv.github.io/Espiralia/sitemap.xml');
  });
});
