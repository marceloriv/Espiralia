import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardView } from '../../src/components/DashboardView';
import type { Profile } from '../../src/types';
import fs from 'fs';
import path from 'path';

const mockProfile: Profile = {
  id: 'p-test',
  name: 'Test User',
} as any;

describe('DashboardView critical CSS & Hero Content', () => {
  it('includes inline critical CSS for hero in index.html', () => {
    render(<DashboardView profile={mockProfile} onNavigate={() => {}} />);
    const indexPath = path.resolve(__dirname, '../../index.html');
    const html = fs.readFileSync(indexPath, 'utf-8');
    const hasHeroCSS = /\.hero/.test(html) && /\.heroTitle/.test(html);
    expect(hasHeroCSS).toBe(true);
  });

  it('despliega el aforismo motivacional oficial en el hero', () => {
    render(<DashboardView profile={mockProfile} onNavigate={() => {}} />);
    expect(screen.getByText(/El orden no es una restricción, es el espacio donde florecen tus ideas y tu calma/i)).toBeInTheDocument();
  });

  it('despliega los 4 accesos instantáneos requeridos en A un solo clic', () => {
    render(<DashboardView profile={mockProfile} onNavigate={() => {}} />);
    expect(screen.getByRole('button', { name: /nueva tarea/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /nuevo evento/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reflexión/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enlace/i })).toBeInTheDocument();
  });

  describe('Hábitos dinámicos en DashboardView', () => {
    it('renderiza los hábitos reales del perfil y permite alternar días', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const { StorageService } = await import('../../src/services/storage');
      const user = userEvent.setup();
      localStorage.clear();
      StorageService.saveProfile(mockProfile);
      StorageService.saveHabit({
        id: 'h-real-1',
        profileId: mockProfile.id,
        name: 'Ejercicio diario 30 min',
        category: 'Salud',
        daysCompleted: [false, false, false, false, false, false, false],
      });

      render(<DashboardView profile={mockProfile} onNavigate={() => {}} />);
      expect(screen.getByText('Ejercicio diario 30 min')).toBeInTheDocument();
      expect(screen.queryByText('Test CONASET')).not.toBeInTheDocument();

      const dayButton = screen.getByRole('button', { name: /Marcar L para Ejercicio diario 30 min/i });
      await user.click(dayButton);

      expect(StorageService.getHabits(mockProfile.id)[0].daysCompleted[0]).toBe(true);
    });

    it('abre HabitModal al pulsar + Hábito', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const { StorageService } = await import('../../src/services/storage');
      const user = userEvent.setup();
      localStorage.clear();
      StorageService.saveProfile(mockProfile);

      render(<DashboardView profile={mockProfile} onNavigate={() => {}} />);
      const addHabitBtn = screen.getByRole('button', { name: /añadir nuevo hábito/i });
      await user.click(addHabitBtn);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Foco Principal y Top Priorities reales', () => {
    it('Today\'s Main Focus refleja la tarea crítica real y permite completarla', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const { StorageService } = await import('../../src/services/storage');
      const user = userEvent.setup();
      localStorage.clear();
      StorageService.saveProfile(mockProfile);

      const criticalTodo = {
        id: 'todo-crit-1',
        profileId: mockProfile.id,
        title: 'Redactar informe final de tesis',
        priority: 'alta' as const,
        status: 'pendiente' as const,
        completed: false,
        createdAt: '2026-10-17',
      };
      StorageService.saveTodo(criticalTodo);

      render(<DashboardView profile={mockProfile} onNavigate={() => {}} />);
      expect(screen.getByRole('heading', { level: 3, name: 'Redactar informe final de tesis' })).toBeInTheDocument();
      expect(screen.queryByText(/Completar 3 test CONASET Clase B/i)).not.toBeInTheDocument();

      const checkbox = screen.getByRole('checkbox', { name: /Marcar foco principal completado/i });
      expect(checkbox).not.toBeChecked();
      await user.click(checkbox);

      expect(StorageService.getTodos(mockProfile.id).find(t => t.id === 'todo-crit-1')?.completed).toBe(true);
    });

    it('Top Priorities muestra estado limpio sin textos de epistemología cuando critical está vacío', () => {
      localStorage.clear();

      render(<DashboardView profile={mockProfile} onNavigate={() => {}} />);
      expect(screen.queryByText(/Revisión de lecturas del Módulo Epistemología/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Carta de Motivación/i)).not.toBeInTheDocument();
      expect(screen.getByText(/Todo al día • Ninguna tarea crítica pendiente/i)).toBeInTheDocument();
    });

    it('permite cambiar el foco diario manualmente a otra tarea pendiente', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const { StorageService } = await import('../../src/services/storage');
      const user = userEvent.setup();
      localStorage.clear();
      StorageService.saveProfile(mockProfile);

      StorageService.saveTodo({
        id: 'todo-crit-1',
        profileId: mockProfile.id,
        title: 'Tarea Crítica Automática',
        priority: 'alta',
        status: 'pendiente',
        completed: false,
        createdAt: '2026-10-17',
      });
      StorageService.saveTodo({
        id: 'todo-opt-2',
        profileId: mockProfile.id,
        title: 'Estudio de Gramática Latina',
        priority: 'media',
        status: 'pendiente',
        completed: false,
        createdAt: '2026-10-17',
      });

      render(<DashboardView profile={mockProfile} onNavigate={() => {}} />);
      expect(screen.getByRole('heading', { level: 3, name: 'Tarea Crítica Automática' })).toBeInTheDocument();

      const changeBtn = screen.getByRole('button', { name: /cambiar foco del día/i });
      await user.click(changeBtn);

      const targetTodoBtn = screen.getByRole('button', { name: /Estudio de Gramática Latina/i });
      await user.click(targetTodoBtn);

      expect(screen.getByRole('heading', { level: 3, name: 'Estudio de Gramática Latina' })).toBeInTheDocument();
    });
  });

  describe('Distracciones y Timeline de Eventos Reales', () => {
    it('despliega los compromisos reales de StorageService y permite agregar y eliminar', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const { StorageService } = await import('../../src/services/storage');
      const user = userEvent.setup();
      localStorage.clear();
      StorageService.saveProfile(mockProfile);
      StorageService.saveDistractions(mockProfile.id, [
        'No revisar WhatsApp hasta el almuerzo',
      ]);

      render(<DashboardView profile={mockProfile} onNavigate={() => {}} />);
      expect(screen.getByText('No revisar WhatsApp hasta el almuerzo')).toBeInTheDocument();

      // Agregar nuevo compromiso
      const input = screen.getByPlaceholderText(/nuevo compromiso/i);
      await user.type(input, 'Poner teléfono en modo avión{enter}');

      expect(screen.getByText('Poner teléfono en modo avión')).toBeInTheDocument();
      expect(StorageService.getDistractions(mockProfile.id)).toContain('Poner teléfono en modo avión');

      // Eliminar el primer compromiso
      const delBtn = screen.getByRole('button', { name: /eliminar compromiso: no revisar whatsapp hasta el almuerzo/i });
      await user.click(delBtn);

      expect(screen.queryByText('No revisar WhatsApp hasta el almuerzo')).not.toBeInTheDocument();
      expect(StorageService.getDistractions(mockProfile.id)).not.toContain('No revisar WhatsApp hasta el almuerzo');
    });

    it('Focus Schedule muestra eventos reales y no renderiza los 7 slots estáticos de mock', () => {
      localStorage.clear();

      render(<DashboardView profile={mockProfile} onNavigate={() => {}} />);
      expect(screen.queryByText(/Lectura matutina & té de menta/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Almuerzo pausado & digestión tranquila/i)).not.toBeInTheDocument();
      expect(screen.getByText(/Día despejado • Sin eventos agendados para hoy/i)).toBeInTheDocument();
    });
  });
});
