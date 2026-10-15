import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodoView } from '../components/TodoView';

describe('TodoView — color picker de área (WCAG 4.1.2)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('cada botón de color tiene el atributo aria-pressed', async () => {
    const user = userEvent.setup();
    render(<TodoView profileId="p-test" />);

    const addAreaBtn = screen.getByRole('button', { name: /crear área/i });
    await user.click(addAreaBtn);

    const colorBtns = screen.getAllByRole('button', { name: /color #/i });
    expect(colorBtns.length).toBeGreaterThan(0);
    colorBtns.forEach(btn => {
      expect(btn).toHaveAttribute('aria-pressed');
    });
  });

  it('al seleccionar un color, aria-pressed cambia a true solo en ese botón', async () => {
    const user = userEvent.setup();
    render(<TodoView profileId="p-test" />);

    const addAreaBtn = screen.getByRole('button', { name: /crear área/i });
    await user.click(addAreaBtn);

    const colorBtns = screen.getAllByRole('button', { name: /color #/i });
    // Por defecto el primer color está activo
    expect(colorBtns[0]).toHaveAttribute('aria-pressed', 'true');
    expect(colorBtns[1]).toHaveAttribute('aria-pressed', 'false');

    // Clic en el segundo color
    await user.click(colorBtns[1]);

    expect(colorBtns[1]).toHaveAttribute('aria-pressed', 'true');
    expect(colorBtns[0]).toHaveAttribute('aria-pressed', 'false');
  });
});
