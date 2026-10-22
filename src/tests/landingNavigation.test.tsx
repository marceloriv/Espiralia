import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LandingView } from '../components/LandingView';

// R-24 / R-26: con HashRouter un <a href="#id"> cambia la ruta; la navegación interna usa scroll.
describe('LandingView: navegación interna', () => {
  beforeEach(() => {
    window.location.hash = '';
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('clic en Ritmos llama scrollIntoView y no cambia el hash de la ruta', async () => {
    render(<LandingView onNavigateLogin={() => {}} />);

    await userEvent.setup().click(screen.getByRole('button', { name: 'Ritmos' }));

    expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(1);
    expect(window.location.hash).toBe('');
  });

  it('no hay elementos <a href="#...">', () => {
    const { container } = render(<LandingView onNavigateLogin={() => {}} />);

    expect(container.querySelectorAll('a[href^="#"]')).toHaveLength(0);
  });

  it.each(['Manifiesto', 'Cuaderno', 'Metodología'])('el enlace %s lleva a una sección que existe', async name => {
    const { container } = render(<LandingView onNavigateLogin={() => {}} />);
    const nav = screen.getByRole('navigation', { name: /navegación editorial/i });

    await userEvent.setup().click(within(nav).getByRole('button', { name }));

    const target = (Element.prototype.scrollIntoView as ReturnType<typeof vi.fn>).mock.contexts[0] as HTMLElement;
    expect(container.contains(target)).toBe(true);
  });
});
