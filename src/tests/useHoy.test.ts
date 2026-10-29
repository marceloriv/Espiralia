import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useHoy } from '../utils/useHoy';

const mostrarPestana = (visible: boolean) => {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (visible ? 'visible' : 'hidden') });
  document.dispatchEvent(new Event('visibilitychange'));
};

describe('useHoy', () => {
  afterEach(() => {
    vi.useRealTimers();
    mostrarPestana(true);
  });

  it('devuelve la fecha del momento en que se monta', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 26, 10, 30));

    const { result } = renderHook(() => useHoy());

    expect(result.current.getFullYear()).toBe(2026);
    expect(result.current.getMonth()).toBe(9);
    expect(result.current.getDate()).toBe(26);
  });

  it('conserva el mismo objeto en cada render, aunque el reloj avance', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 26, 10, 30));
    const { result, rerender } = renderHook(() => useHoy());
    const primera = result.current;

    vi.setSystemTime(new Date(2026, 9, 26, 18, 0));
    rerender();

    expect(result.current).toBe(primera);
  });

  // Técnica: tabla de decisión (pestaña visible u oculta x mismo día o día nuevo).
  it('al volver a ver la pestaña un día después, renueva la fecha', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 26, 23, 50));
    const { result } = renderHook(() => useHoy());
    expect(result.current.getDate()).toBe(26);

    vi.setSystemTime(new Date(2026, 9, 27, 8, 0));
    act(() => mostrarPestana(true));

    expect(result.current.getDate()).toBe(27);
  });

  it('al volver a ver la pestaña el mismo día, no cambia el objeto', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 26, 9, 0));
    const { result } = renderHook(() => useHoy());
    const primera = result.current;

    vi.setSystemTime(new Date(2026, 9, 26, 17, 0));
    act(() => mostrarPestana(true));

    expect(result.current).toBe(primera);
  });

  it('con la pestaña oculta no renueva la fecha', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 26, 23, 50));
    const { result } = renderHook(() => useHoy());

    vi.setSystemTime(new Date(2026, 9, 27, 8, 0));
    act(() => mostrarPestana(false));

    expect(result.current.getDate()).toBe(26);
  });
});
