import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { sileo } from 'sileo';
import { QuickActionModal } from '../components/quickAction/QuickActionModal';
import { StorageService } from '../services/storage';

describe('QuickActionModal', () => {
  const profileId = 'p-qa-test';

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('no renderiza nada si isOpen es false', () => {
    render(<QuickActionModal isOpen={false} onClose={vi.fn()} profileId={profileId} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('permite crear una tarea rapida con area y prioridad', async () => {
    const successSpy = vi.spyOn(sileo, 'success');
    const onClose = vi.fn();
    const onItemCreated = vi.fn();
    const user = userEvent.setup();

    render(
      <QuickActionModal
        isOpen={true}
        onClose={onClose}
        profileId={profileId}
        onItemCreated={onItemCreated}
      />
    );

    expect(screen.getByRole('dialog', { name: /acción rápida/i })).toBeInTheDocument();

    const titleInput = screen.getByPlaceholderText(/¿qué necesitas registrar\?/i);
    await user.type(titleInput, 'Comprar insumos');

    const submitBtn = screen.getByRole('button', { name: /crear tarea/i });
    await user.click(submitBtn);

    const todos = StorageService.getTodos(profileId);
    expect(todos.some(t => t.title === 'Comprar insumos')).toBe(true);
    expect(successSpy).toHaveBeenCalledWith(expect.objectContaining({ title: expect.stringMatching(/tarea creada/i) }));
    expect(onItemCreated).toHaveBeenCalledWith('todo');
    expect(onClose).toHaveBeenCalled();
  });

  it('permite alternar a tab evento y crear un evento con fecha', async () => {
    const successSpy = vi.spyOn(sileo, 'success');
    const onClose = vi.fn();
    const onItemCreated = vi.fn();
    const user = userEvent.setup();

    render(
      <QuickActionModal
        isOpen={true}
        onClose={onClose}
        profileId={profileId}
        onItemCreated={onItemCreated}
      />
    );

    const eventTab = screen.getByRole('tab', { name: /nuevo evento/i });
    await user.click(eventTab);

    const titleInput = screen.getByPlaceholderText(/título del evento/i);
    await user.type(titleInput, 'Reunión de coordinación');

    const submitBtn = screen.getByRole('button', { name: /crear evento/i });
    await user.click(submitBtn);

    const events = StorageService.getEvents(profileId);
    expect(events.some(e => e.title === 'Reunión de coordinación')).toBe(true);
    expect(successSpy).toHaveBeenCalledWith(expect.objectContaining({ title: expect.stringMatching(/evento creado/i) }));
    expect(onItemCreated).toHaveBeenCalledWith('event');
    expect(onClose).toHaveBeenCalled();
  });

  it('se cierra al presionar la tecla Escape', () => {
    const onClose = vi.fn();
    render(<QuickActionModal isOpen={true} onClose={onClose} profileId={profileId} />);

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape', code: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
