import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { THEME_KEY } from '../utils/theme';

// public/theme-init.js corre antes del primer pintado: debe dejar tema y barra del navegador (theme-color) coherentes.
const initScript = readFileSync('public/theme-init.js', 'utf-8');
const css = readFileSync('src/index.css', 'utf-8').replace(/\r\n/g, '\n');
const run = () => new Function(initScript)();
const barra = () => [...document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')].map(m => m.content);

describe('theme-init.js', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.head.innerHTML =
      '<meta name="theme-color" content="#faf9f5" media="(prefers-color-scheme: light)" />' +
      '<meta name="theme-color" content="#19191B" media="(prefers-color-scheme: dark)" />';
  });

  it('con oscuro guardado fija data-theme y pone la barra oscura aunque el sistema sea claro', () => {
    localStorage.setItem(THEME_KEY, 'dark');
    run();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(barra()).toEqual(['#19191B', '#19191B']);
  });

  it('con claro guardado pone la barra clara en ambos meta', () => {
    localStorage.setItem(THEME_KEY, 'light');
    run();
    expect(barra()).toEqual(['#faf9f5', '#faf9f5']);
  });

  it('sin elección guardada no toca data-theme ni la barra', () => {
    run();
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    expect(barra()).toEqual(['#faf9f5', '#19191B']);
  });

  it('con valor inválido no cambia nada', () => {
    localStorage.setItem(THEME_KEY, 'sepia');
    run();
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  it('con localStorage bloqueado no lanza y deja la preferencia del sistema', () => {
    const real = Object.getOwnPropertyDescriptor(window, 'localStorage')!;
    Object.defineProperty(window, 'localStorage', { get: () => { throw new DOMException('bloqueado', 'SecurityError'); }, configurable: true });
    try {
      expect(run).not.toThrow();
      expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    } finally {
      Object.defineProperty(window, 'localStorage', real);
    }
  });

  it('el color de la barra oscura es el canvas oscuro de index.css (sin franja distinta)', () => {
    const canvas = css.match(/:root\[data-theme="dark"\][^{]*\{[\s\S]*?--color-canvas:\s*(#[0-9a-fA-F]{6})/)![1].toLowerCase();
    expect(initScript.toLowerCase()).toContain(canvas);
    expect(readFileSync('index.html', 'utf-8').toLowerCase()).toContain(`content="${canvas}" media="(prefers-color-scheme: dark)"`);
  });
});
