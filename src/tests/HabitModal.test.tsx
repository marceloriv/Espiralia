import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HabitModal } from '../components/habits/HabitModal';
import type { HabitTrackerItem } from '../types';

describe('HabitModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('no renderiza nada si isOpen es false', () => {
    render(
      <HabitModal
        isOpen={false}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renderiza el modal cuando isOpen es true con campos accesibles', () => {
    render(
      <HabitModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/nombre del hábito/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/categoría/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /guardar hábito/i })).toBeInTheDocument();
  });

  it('permite crear un nuevo hábito llamando a onSave', async () => {
    const handleSave = vi.fn();
    const handleClose = vi.fn();
    const user = userEvent.setup();

    render(
      <HabitModal
        isOpen={true}
        onClose={handleClose}
        onSave={handleSave}
      />
    );

    const nameInput = screen.getByLabelText(/nombre del hábito/i);
    await user.type(nameInput, 'Meditación matutina');

    const submitBtn = screen.getByRole('button', { name: /guardar hábito/i });
    await user.click(submitBtn);

    expect(handleSave).toHaveBeenCalledWith({
      name: 'Meditación matutina',
      category: expect.any(String),
    });
  });

  it('permite editar y eliminar un hábito existente', async () => {
    const habit: HabitTrackerItem = {
      id: 'h-123',
      profileId: 'p-1',
      name: 'Lectura diaria',
      category: 'Estudios',
      daysCompleted: [true, false, false, false, false, false, false],
    };
    const handleSave = vi.fn();
    const handleDelete = vi.fn();
    const user = userEvent.setup();

    render(
      <HabitModal
        isOpen={true}
        habit={habit}
        onClose={vi.fn()}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    );

    const nameInput = screen.getByLabelText(/nombre del hábito/i) as HTMLInputElement;
    expect(nameInput.value).toBe('Lectura diaria');

    const deleteBtn = screen.getByRole('button', { name: /eliminar hábito/i });
    await user.click(deleteBtn);

    expect(handleDelete).toHaveBeenCalledWith('h-123');
  });

  it('cierra el modal al pulsar la tecla Escape o el botón cerrar', async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();

    render(
      <HabitModal
        isOpen={true}
        onClose={handleClose}
        onSave={vi.fn()}
      />
    );

    const closeBtn = screen.getByRole('button', { name: /cerrar ventana de hábitos/i });
    await user.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);

    await user.keyboard('{Escape}');
    expect(handleClose).toHaveBeenCalledTimes(2);
  });
});
