import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AgendaView } from '../components/AgendaView';
import { StorageService } from '../services/storage';

describe('AgendaView', () => {
  const profileId = 'p-agenda';

  beforeEach(() => {
    localStorage.clear();
  });

  it('permite ver calendario y agregar evento para la fecha seleccionada', async () => {
    const user = userEvent.setup();

    render(<AgendaView profileId={profileId} />);

    expect(screen.getByText(/agenda de eventos/i)).toBeInTheDocument();

    const titleInput = screen.getByPlaceholderText(/título del evento/i);
    await user.type(titleInput, 'Reunión de coordinación');

    const addBtn = screen.getByRole('button', { name: /agregar evento/i });
    await user.click(addBtn);

    expect(screen.getByText('Reunión de coordinación')).toBeInTheDocument();
  });

  it('permite eliminar un evento existente', async () => {
    const user = userEvent.setup();
    const todayStr = new Date().toISOString().split('T')[0];

    StorageService.saveEvent({
      id: 'e-del',
      profileId,
      title: 'Almuerzo de trabajo',
      date: todayStr,
      startTime: '13:00',
      category: 'personal',
    });

    render(<AgendaView profileId={profileId} />);

    expect(screen.getByText('Almuerzo de trabajo')).toBeInTheDocument();

    const deleteBtn = screen.getByRole('button', { name: /eliminar almuerzo de trabajo/i });
    await user.click(deleteBtn);

    expect(screen.queryByText('Almuerzo de trabajo')).not.toBeInTheDocument();
  });
});
