import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HabitModal } from '../components/habits/HabitModal';
import { AreaIntegratedWorkspace } from '../components/todo/AreaIntegratedWorkspace';
import { IntegrationsView } from '../components/IntegrationsView';
import { StorageService } from '../services/storage';
import { toLocalDateStr } from '../utils/localDate';
import type { Area, HabitTrackerItem, Profile, TodoItem } from '../types';

// Estado que sigue a sus propiedades: cuando una prop cambia con el componente montado, el estado se vuelve a cargar.
// Son pruebas de caracterización: fijan este comportamiento para poder cambiar cómo se implementa sin alterarlo.
describe('estado que sigue a sus propiedades', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('HabitModal', () => {
    const habitoA: HabitTrackerItem = { id: 'h-a', profileId: 'p-h', name: 'Leer', daysCompleted: [], category: 'Estudios' };
    const habitoB: HabitTrackerItem = { id: 'h-b', profileId: 'p-h', name: 'Caminar', daysCompleted: [], category: 'Salud & Bienestar' };
    const acciones = { onClose: vi.fn(), onSave: vi.fn() };

    it('al cambiar de hábito con el modal abierto muestra los datos del nuevo', () => {
      const { rerender } = render(<HabitModal isOpen habit={habitoA} {...acciones} />);
      expect(screen.getByLabelText('Nombre del hábito')).toHaveValue('Leer');
      expect(screen.getByLabelText('Categoría')).toHaveValue('Estudios');

      rerender(<HabitModal isOpen habit={habitoB} {...acciones} />);

      expect(screen.getByLabelText('Nombre del hábito')).toHaveValue('Caminar');
      expect(screen.getByLabelText('Categoría')).toHaveValue('Salud & Bienestar');
    });

    it('un modal que se cierra y se abre para un hábito nuevo empieza vacío y con la categoría General', () => {
      const { rerender } = render(<HabitModal isOpen habit={habitoA} {...acciones} />);
      rerender(<HabitModal isOpen={false} habit={habitoA} {...acciones} />);

      rerender(<HabitModal isOpen habit={null} {...acciones} />);

      expect(screen.getByLabelText('Nombre del hábito')).toHaveValue('');
      expect(screen.getByLabelText('Categoría')).toHaveValue('General');
    });

    it('lo que se escribe no se pisa mientras el hábito no cambie', () => {
      const { rerender } = render(<HabitModal isOpen habit={null} {...acciones} />);
      const campo = screen.getByLabelText('Nombre del hábito') as HTMLInputElement;
      campo.focus();
      campo.setRangeText('Meditar', 0, 0, 'end');
      campo.dispatchEvent(new Event('input', { bubbles: true }));

      rerender(<HabitModal isOpen habit={null} {...acciones} />);

      expect(screen.getByLabelText('Nombre del hábito')).toHaveValue('Meditar');
    });
  });

  describe('AreaIntegratedWorkspace', () => {
    const profileId = 'p-area-estado';
    const area = (id: string, name: string): Area => ({ id, profileId, name, color: '#3b82f6', createdAt: '2026-10-10' });
    const tarea = (id: string, title: string, areaId: string): TodoItem => ({
      id,
      profileId,
      title,
      areaId,
      priority: 'media',
      createdAt: '2026-10-10',
      status: 'pendiente',
      completed: false,
    });

    it('al cambiar de área muestra solo las tareas de la nueva', () => {
      StorageService.saveTodo(tarea('t-a', 'Preparar el examen', 'area-a'));
      StorageService.saveTodo(tarea('t-b', 'Entregar el informe', 'area-b'));
      const { rerender } = render(<AreaIntegratedWorkspace area={area('area-a', 'Estudios')} profileId={profileId} onNavigateAgenda={vi.fn()} />);
      expect(screen.getByText('Preparar el examen')).toBeInTheDocument();
      expect(screen.queryByText('Entregar el informe')).toBeNull();

      rerender(<AreaIntegratedWorkspace area={area('area-b', 'Trabajo')} profileId={profileId} onNavigateAgenda={vi.fn()} />);

      expect(screen.getByText('Entregar el informe')).toBeInTheDocument();
      expect(screen.queryByText('Preparar el examen')).toBeNull();
    });
  });

  describe('IntegrationsView', () => {
    const perfil = (id: string, name: string): Profile => ({ id, name, avatar: name[0], createdAt: '2026-10-10' });
    const manana = toLocalDateStr(new Date(Date.now() + 24 * 60 * 60 * 1000));

    it('al cambiar de perfil muestra los eventos próximos del nuevo', () => {
      StorageService.saveEvent({ id: 'e-1', profileId: 'p-int-a', title: 'Cita de Carolina', date: manana });
      StorageService.saveEvent({ id: 'e-2', profileId: 'p-int-b', title: 'Cita de Beto', date: manana });
      const { rerender } = render(<IntegrationsView profile={perfil('p-int-a', 'Carolina')} />);
      expect(screen.getByText('Cita de Carolina')).toBeInTheDocument();
      expect(screen.queryByText('Cita de Beto')).toBeNull();

      rerender(<IntegrationsView profile={perfil('p-int-b', 'Beto')} />);

      expect(screen.getByText('Cita de Beto')).toBeInTheDocument();
      expect(screen.queryByText('Cita de Carolina')).toBeNull();
    });
  });
});
