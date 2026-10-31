import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { THEME_KEY, applyTheme, currentTheme, switchTheme } from '../utils/theme';
import { ThemeToggle } from '../components/common/ThemeToggle';

const mockMatchMedia = (matches: Record<string, boolean>) => {
  window.matchMedia = ((query: string) => ({
    matches: matches[query] ?? false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
};

describe('Tema claro y oscuro (DESIGN.md §7.4)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.head.innerHTML = '<meta name="theme-color" content="#faf9f5" />';
    mockMatchMedia({});
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-theme');
  });

  it('sin elección guardada manda la preferencia del sistema', () => {
    mockMatchMedia({ '(prefers-color-scheme: dark)': true });
    expect(currentTheme()).toBe('dark');
    mockMatchMedia({ '(prefers-color-scheme: dark)': false });
    expect(currentTheme()).toBe('light');
  });

  it('la elección manda sobre el sistema', () => {
    mockMatchMedia({ '(prefers-color-scheme: dark)': true });
    document.documentElement.setAttribute('data-theme', 'light');
    expect(currentTheme()).toBe('light');
  });

  it('applyTheme fija data-theme, lo guarda y actualiza theme-color', () => {
    applyTheme('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem(THEME_KEY)).toBe('dark');
    expect(document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.content).toBe('#1a1817');
  });

  it('applyTheme cambia el tema aunque localStorage falle', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('lleno', 'QuotaExceededError');
    });
    expect(() => applyTheme('dark')).not.toThrow();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    spy.mockRestore();
  });

  it('switchTheme aplica de inmediato sin View Transitions y avisa con onApplied', () => {
    const onApplied = vi.fn();
    switchTheme('dark', { x: 10, y: 10 }, onApplied);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(onApplied).toHaveBeenCalledTimes(1);
  });

  // Técnica: tabla de decisión (preferencia de movimiento) sobre qué animación recibe el tema nuevo.
  describe.each([
    { reducido: true, clave: 'opacity', ausente: 'maskImage' },
    { reducido: false, clave: 'maskImage', ausente: 'opacity' },
  ])('con View Transitions y movimiento reducido = $reducido', ({ reducido, clave, ausente }) => {
    afterEach(() => {
      delete (document as unknown as { startViewTransition?: unknown }).startViewTransition;
      delete (document.documentElement as unknown as { animate?: unknown }).animate;
    });

    it(`el cambio no es instantáneo: anima ${clave} sobre el tema nuevo`, async () => {
      mockMatchMedia({ '(prefers-reduced-motion: reduce)': reducido });
      const animate = vi.fn();
      (document.documentElement as unknown as { animate: unknown }).animate = animate;
      const start = vi.fn((cb: () => void) => {
        cb();
        return { ready: Promise.resolve(), finished: Promise.resolve() };
      });
      (document as unknown as { startViewTransition: unknown }).startViewTransition = start;

      switchTheme('dark', { x: 10, y: 10 });
      await Promise.resolve();

      expect(start).toHaveBeenCalledTimes(1);
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      const [keyframes, options] = animate.mock.calls[0];
      expect(keyframes).toHaveProperty(clave);
      expect(keyframes).not.toHaveProperty(ausente);
      expect(options.pseudoElement).toBe('::view-transition-new(root)');
    });
  });

  it('ThemeToggle ofrece el cambio contrario y lo hace al pulsar', () => {
    render(<ThemeToggle />);
    const claro = screen.getByRole('button', { name: /cambiar a tema oscuro/i });
    fireEvent.click(claro);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(screen.getByRole('button', { name: /cambiar a tema claro/i })).toBeInTheDocument();
  });
});
