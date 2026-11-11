import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { PlannerBlockModal } from '../components/planner/PlannerBlockModal';
import { FolderModal } from '../components/folders/FolderModal';

// Hallazgos 1 y 2 de la auditoría: aria-modal exige que Tab no salga del diálogo y que el foco vuelva al disparador.
const casos = [
  ['PlannerBlockModal', (onClose: () => void) => <PlannerBlockModal isOpen onClose={onClose} onSave={vi.fn()} />],
  ['FolderModal', (onClose: () => void) => <FolderModal isOpen onClose={onClose} onSave={vi.fn()} />],
] as const;

describe.each(casos)('%s', (_nombre, modal) => {
  const Harness = () => {
    const [abierto, setAbierto] = useState(false);
    return (
      <>
        <button type="button" onClick={() => setAbierto(true)}>Disparador</button>
        <button type="button">Detrás</button>
        {abierto && modal(() => setAbierto(false))}
      </>
    );
  };

  it('mantiene Tab y Mayús+Tab dentro del diálogo', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Disparador' }));
    const dialogo = screen.getByRole('dialog');
    for (let i = 0; i < 25; i++) {
      await user.tab();
      expect(dialogo).toContainElement(document.activeElement as HTMLElement);
    }
    for (let i = 0; i < 25; i++) {
      await user.tab({ shift: true });
      expect(dialogo).toContainElement(document.activeElement as HTMLElement);
    }
  });

  it('devuelve el foco al disparador al cerrar con Escape', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const disparador = screen.getByRole('button', { name: 'Disparador' });
    await user.click(disparador);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(disparador).toHaveFocus();
  });

  it('devuelve el foco al disparador al cerrar con un botón', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const disparador = screen.getByRole('button', { name: 'Disparador' });
    await user.click(disparador);
    await user.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(disparador).toHaveFocus();
  });
});
