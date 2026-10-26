/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

const html404 = readFileSync('public/404.html', 'utf8');
const nautilusCss = readFileSync('src/components/common/OrigamiNautilus.module.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const nautilusTsx = readFileSync('src/components/common/OrigamiNautilus.tsx', 'utf8');

/** Quita del CSS cada bloque `@media` que empieza con `inicio`, contando llaves. */
const sinBloques = (css: string, inicio: RegExp): string => {
  let resto = css;
  for (let m = inicio.exec(resto); m; m = inicio.exec(resto)) {
    let profundidad = 0;
    let fin = resto.indexOf('{', m.index);
    for (; fin < resto.length; fin++) {
      if (resto[fin] === '{') profundidad++;
      else if (resto[fin] === '}' && --profundidad === 0) break;
    }
    resto = resto.slice(0, m.index) + resto.slice(fin + 1);
  }
  return resto;
};

describe('public/404.html (GitHub Pages, fuera del hash)', () => {
  it('es una página en español que los buscadores no indexan', () => {
    expect(html404).toMatch(/<html[^>]*\blang="es"/);
    expect(html404).toMatch(/<meta name="robots" content="noindex/);
  });

  it('tiene un único h1 dentro de main', () => {
    expect(html404.match(/<h1\b/g)).toHaveLength(1);
    expect(html404).toMatch(/<main[\s\S]*<h1[\s\S]*<\/main>/);
  });

  it('no pide nada a otro origen: ni scripts, ni hojas de estilo, ni fuentes, ni imágenes', () => {
    expect(html404).not.toMatch(/(?:src|href)\s*=\s*["']?(?:https?:)?\/\//i);
    expect(html404).not.toMatch(/url\(\s*["']?(?:https?:)?\/\//i);
    expect(html404).not.toMatch(/@import/);
  });

  it('el enlace de regreso vale "/" sin JavaScript y se ajusta al prefijo del sitio con él', () => {
    expect(html404).toMatch(/<a [^>]*href="\/"/);
    expect(html404).toMatch(/location\.pathname/);
  });

  // GitHub Pages sirve este archivo en cualquier URL inexistente: la app tiene rutas con hash, así que se redirige a él.
  // La pantalla con el Nautilus es la de la app; esta página solo es el puente (y el respaldo sin JavaScript).
  it('lleva <sitio>/<ruta> a <sitio>/#/<ruta> para que la app decida si existe', () => {
    expect(html404).toMatch(/SITIO = '\/Espiralia\/'/);
    expect(html404).toMatch(/location\.replace\(base \+ '#\/' \+ resto\)/);
  });

  it('en la raíz (desarrollo o dominio propio) también lleva la dirección al hash, incluida /404.html', () => {
    expect(html404).toMatch(/indexOf\(SITIO\) === 0 \? SITIO : '\/'/);
  });
});

describe('OrigamiNautilus', () => {
  it('es decorativo: va fuera del árbol de accesibilidad', () => {
    expect(nautilusTsx).toMatch(/aria-hidden="true"/);
  });

  it('no usa drop-shadow, para no sumar al presupuesto de sombras (DESIGN.md §0.10.7)', () => {
    expect(nautilusCss).not.toMatch(/drop-shadow/);
  });

  it('toda animación vive dentro de prefers-reduced-motion: no-preference', () => {
    expect(nautilusCss).toMatch(/prefers-reduced-motion:\s*no-preference/);
    const fuera = sinBloques(nautilusCss, /@media \(prefers-reduced-motion:\s*no-preference\)/);
    expect(fuera).not.toMatch(/animation(-name)?\s*:/);
  });

  it('se oculta con colores forzados, donde ya no se lee como figura', () => {
    expect(nautilusCss).toMatch(/forced-colors:\s*active/);
  });
});
