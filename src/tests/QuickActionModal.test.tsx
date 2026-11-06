import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { sileo } from 'sileo';
import { CATEGORIES, FILTER_LABELS } from '../components/agenda/eventMapping';
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

  // La Agenda valida las horas; la Acción Rápida guardaba un evento que terminaba antes de empezar.
  it('no guarda un evento cuya hora de término es anterior a la de inicio', async () => {
    const errorSpy = vi.spyOn(sileo, 'error');
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<QuickActionModal isOpen={true} onClose={onClose} profileId={profileId} />);

    await user.click(screen.getByRole('tab', { name: /nuevo evento/i }));
    await user.type(screen.getByPlaceholderText(/título del evento/i), 'Al revés');
    fireEvent.change(screen.getByLabelText(/hora inicio/i), { target: { value: '15:00' } });
    fireEvent.change(screen.getByLabelText(/hora fin/i), { target: { value: '14:00' } });
    await user.click(screen.getByRole('button', { name: /crear evento/i }));

    expect(StorageService.getEvents(profileId)).toEqual([]);
    expect(errorSpy).toHaveBeenCalledWith({ title: 'La hora de término debe ser posterior a la de inicio' });
    expect(onClose).not.toHaveBeenCalled();
  });

  // Ofrecía 'salud' y 'general', que la Agenda no conoce: el evento guardado la hacía caer.
  it('ofrece solo las categorías de evento que la Agenda sabe mostrar', async () => {
    const user = userEvent.setup();
    render(<QuickActionModal isOpen={true} onClose={vi.fn()} profileId={profileId} />);

    await user.click(screen.getByRole('tab', { name: /nuevo evento/i }));
    const opciones = within(screen.getByLabelText(/categoría/i)).getAllByRole('option');

    expect(opciones.map(o => (o as HTMLOptionElement).value)).toEqual(CATEGORIES);
    expect(opciones.map(o => o.textContent)).toEqual(CATEGORIES.map(c => FILTER_LABELS[c]));
  });

  it('se cierra al presionar la tecla Escape', () => {
    const onClose = vi.fn();
    render(<QuickActionModal isOpen={true} onClose={onClose} profileId={profileId} />);

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape', code: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
