import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AreaIntegratedWorkspace } from '../components/todo/AreaIntegratedWorkspace';
import { StorageService } from '../services/storage';
import type { Area } from '../types';

describe('AreaIntegratedWorkspace', () => {
  const profileId = 'p-area-1';
  const area: Area = {
    id: 'area-estudios',
    profileId,
    name: 'Estudios',
    color: '#3b82f6',
    createdAt: '2026-10-10',
  };

  beforeEach(() => {
    localStorage.clear();
  });

  it('despliega simultáneamente las 3 secciones: Tareas, Agenda Contextual y Notas/Recursos', () => {
    render(<AreaIntegratedWorkspace area={area} profileId={profileId} onNavigateAgenda={vi.fn()} />);
    expect(screen.getByRole('heading', { name: /tareas de estudios/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /agenda de estudios/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /notas & recursos/i })).toBeInTheDocument();
  });

  it('permite agregar una tarea directamente al área activa', async () => {
    const user = userEvent.setup();
    render(<AreaIntegratedWorkspace area={area} profileId={profileId} onNavigateAgenda={vi.fn()} />);

    const input = screen.getByPlaceholderText(/nueva tarea para estudios/i);
    await user.type(input, 'Repasar señales de tránsito{enter}');

    expect(screen.getByText('Repasar señales de tránsito')).toBeInTheDocument();
    const todos = StorageService.getTodos(profileId);
    expect(todos.some(t => t.title === 'Repasar señales de tránsito' && t.areaId === area.id)).toBe(true);
  });

  it('muestra eventos contextuales asociados al área o categoría', () => {
    StorageService.saveEvent({
      id: 'ev-test',
      profileId,
      title: 'Práctica en circuito',
      date: '2026-10-22',
      startTime: '11:00',
      category: 'estudio',
    });

    render(<AreaIntegratedWorkspace area={area} profileId={profileId} onNavigateAgenda={vi.fn()} />);
    expect(screen.getByText('Práctica en circuito')).toBeInTheDocument();
    expect(screen.getByText('11:00')).toBeInTheDocument();
  });

  it('muestra notas y vínculos asociados al área', () => {
    StorageService.saveNote({
      id: 'n-test',
      profileId,
      areaId: area.id,
      title: 'Resumen Ley Emilia',
      content: 'Puntos clave sobre tolerancia cero',
      createdAt: '2026-10-10',
      updatedAt: '2026-10-10',
    });
    StorageService.saveLink({
      id: 'l-test',
      profileId,
      areaId: area.id,
      title: 'Simulador Conaset',
      url: 'https://conaset.cl/simulador',
      createdAt: '2026-10-10',
    });

    render(<AreaIntegratedWorkspace area={area} profileId={profileId} onNavigateAgenda={vi.fn()} />);
    expect(screen.getByText('Resumen Ley Emilia')).toBeInTheDocument();
    expect(screen.getByText('Simulador Conaset')).toBeInTheDocument();
  });
});
