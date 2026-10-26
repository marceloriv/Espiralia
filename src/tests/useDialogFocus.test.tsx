import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { useDialogFocus } from '../utils/useDialogFocus';

// WCAG 2.4.3 (orden del foco): un diálogo recibe el foco al abrirse y lo devuelve a su disparador al cerrarse.
const Dialog = ({ withInnerFocus = false, active = true }: { withInnerFocus?: boolean; active?: boolean }) => {
  const ref = useDialogFocus(active);
  return (
    <div ref={ref} role="dialog" aria-label="Prueba">
      <button type="button">Cerrar</button>
      <input aria-label="Nombre" autoFocus={withInnerFocus} />
    </div>
  );
};

const Harness = (props: { withInnerFocus?: boolean }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>Abrir</button>
      <button type="button" onClick={() => setOpen(false)}>Fuera</button>
      {open && <Dialog {...props} />}
    </>
  );
};

describe('useDialogFocus', () => {
  it('lleva el foco al primer control del diálogo al abrirse', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Abrir' }));
    expect(screen.getByRole('button', { name: 'Cerrar' })).toHaveFocus();
  });

  it('devuelve el foco al botón que abrió el diálogo al cerrarse', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const abrir = screen.getByRole('button', { name: 'Abrir' });
    await user.click(abrir);
    await user.click(screen.getByRole('button', { name: 'Fuera' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(abrir).toHaveFocus();
  });

  it('respeta un control que el propio diálogo ya enfocó y aun así devuelve el foco al disparador', async () => {
    const user = userEvent.setup();
    render(<Harness withInnerFocus />);
    const abrir = screen.getByRole('button', { name: 'Abrir' });
    await user.click(abrir);
    expect(screen.getByRole('textbox', { name: 'Nombre' })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Fuera' }));
    expect(abrir).toHaveFocus();
  });

  it('con active en false no mueve el foco', () => {
    render(<Dialog active={false} />);
    expect(screen.getByRole('button', { name: 'Cerrar' })).not.toHaveFocus();
  });
});
