import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardView } from '../components/DashboardView';
import { StorageService } from '../services/storage';
import type { Profile } from '../types';

describe('DashboardView', () => {
  const mockProfile: Profile = {
    id: 'p-dash',
    name: 'Andrés',
    avatar: 'A',
    createdAt: '2026-10-09',
  };

  beforeEach(() => {
    localStorage.clear();
  });

  it('muestra saludo y widgets de resumen con navegacion rapida', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    const todayStr = new Date().toISOString().split('T')[0];

    StorageService.saveEvent({
      id: 'e-1',
      profileId: mockProfile.id,
      title: 'Revisión trimestral',
      date: todayStr,
      startTime: '11:00',
    });

    StorageService.saveTodo({
      id: 't-1',
      profileId: mockProfile.id,
      title: 'Comprar suministros',
      category: 'General',
      priority: 'alta',
      completed: false,
      createdAt: '2026-10-09',
    });

    render(<DashboardView profile={mockProfile} onNavigate={onNavigate} />);

    expect(screen.getByText(/¡hola, andrés!/i)).toBeInTheDocument();
    expect(screen.getByText('Revisión trimestral')).toBeInTheDocument();
    expect(screen.getByText('Comprar suministros')).toBeInTheDocument();

    const goToAgendaBtn = screen.getByRole('button', { name: /ver agenda completa/i });
    await user.click(goToAgendaBtn);
    expect(onNavigate).toHaveBeenCalledWith('agenda');
  });

  it('permite completar tarea pendiente desde el dashboard', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();

    StorageService.saveTodo({
      id: 't-quick',
      profileId: mockProfile.id,
      title: 'Tarea rapida',
      category: 'General',
      priority: 'media',
      completed: false,
      createdAt: '2026-10-09',
    });

    render(<DashboardView profile={mockProfile} onNavigate={onNavigate} />);

    const checkbox = screen.getByRole('checkbox', { name: /completar tarea rapida/i });
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(StorageService.getTodos(mockProfile.id)[0].completed).toBe(true);
  });

  it('hidrata los datos de almacenamiento sincronicamente en el render inicial sin flash vacio', () => {
    StorageService.saveTodo({
      id: 't-sync',
      profileId: mockProfile.id,
      title: 'Verificacion sincrona CLS',
      category: 'General',
      priority: 'alta',
      completed: false,
      createdAt: '2026-10-09',
    });

    const { container } = render(<DashboardView profile={mockProfile} onNavigate={vi.fn()} />);
    // La tarea debe estar inmediatamente presente en el DOM
    expect(container.textContent).toContain('Verificacion sincrona CLS');
  });
});
