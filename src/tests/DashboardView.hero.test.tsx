import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardView } from '../../src/components/DashboardView';
import type { Profile } from '../../src/types';
import fs from 'fs';
import path from 'path';

const mockProfile: Profile = {
  id: 'p-test',
  name: 'Test User',
} as unknown as Profile;

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
        areaId: 'default',
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
        areaId: 'default',
        title: 'Tarea Crítica Automática',
        priority: 'alta',
        status: 'pendiente',
        completed: false,
        createdAt: '2026-10-17',
      });
      StorageService.saveTodo({
        id: 'todo-opt-2',
        profileId: mockProfile.id,
        areaId: 'default',
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

    it('permite editar un compromiso: Enter guarda, Escape cancela y vaciarlo no lo borra', async () => {
      // Técnica: tabla de decisión sobre la tecla de cierre (Enter/Escape) y el texto (con contenido/vacío).
      const { userEvent } = await import('@testing-library/user-event');
      const { StorageService } = await import('../../src/services/storage');
      const user = userEvent.setup();
      localStorage.clear();
      StorageService.saveProfile(mockProfile);
      StorageService.saveDistractions(mockProfile.id, ['Sin redes hasta las 18h']);

      render(<DashboardView profile={mockProfile} onNavigate={() => {}} />);

      await user.click(screen.getByRole('button', { name: 'Sin redes hasta las 18h' }));
      const editInput = screen.getByRole('textbox', { name: /editar compromiso/i });
      await user.clear(editInput);
      await user.type(editInput, 'Sin redes hasta las 20h{enter}');
      expect(StorageService.getDistractions(mockProfile.id)).toEqual(['Sin redes hasta las 20h']);

      await user.click(screen.getByRole('button', { name: 'Sin redes hasta las 20h' }));
      await user.type(screen.getByRole('textbox', { name: /editar compromiso/i }), ' y más{escape}');
      expect(screen.getByRole('button', { name: 'Sin redes hasta las 20h' })).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Sin redes hasta las 20h' }));
      await user.clear(screen.getByRole('textbox', { name: /editar compromiso/i }));
      await user.keyboard('{enter}');
      expect(StorageService.getDistractions(mockProfile.id)).toEqual(['Sin redes hasta las 20h']);
    });

    it('el "+" de compromisos con el campo vacío lleva el foco al campo en vez de quedar bloqueado', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const { StorageService } = await import('../../src/services/storage');
      const user = userEvent.setup();
      localStorage.clear();
      StorageService.saveProfile(mockProfile);

      render(<DashboardView profile={mockProfile} onNavigate={() => {}} />);
      const addBtn = screen.getByRole('button', { name: /agregar compromiso/i });
      expect(addBtn).toBeEnabled();

      await user.click(addBtn);

      expect(screen.getByPlaceholderText(/nuevo compromiso/i)).toHaveFocus();
      expect(StorageService.getDistractions(mockProfile.id)).toEqual([]);
    });

    it('Focus Schedule muestra eventos reales y no renderiza los 7 slots estáticos de mock', () => {
      localStorage.clear();

      render(<DashboardView profile={mockProfile} onNavigate={() => {}} />);
      expect(screen.queryByText(/Lectura matutina & té de menta/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Almuerzo pausado & digestión tranquila/i)).not.toBeInTheDocument();
      expect(screen.getByText(/Día despejado • Sin eventos agendados para hoy/i)).toBeInTheDocument();
    });
  });

  describe('Hitos de Áreas, Brain Dump y Reflexión Nocturna', () => {
    it('Áreas Temáticas muestra las tareas reales del área y elimina mock de CONASET', async () => {
      const { StorageService } = await import('../../src/services/storage');
      const { within } = await import('@testing-library/react');
      localStorage.clear();
      StorageService.saveProfile(mockProfile);

      const areas = StorageService.getAreas(mockProfile.id);
      const personalArea = areas.find(a => a.name.toLowerCase() === 'personal') || areas[0];

      StorageService.saveTodo({
        id: 'todo-hito-1',
        profileId: mockProfile.id,
        title: 'Completar sesión de mindfulness',
        areaId: personalArea.id,
        priority: 'alta',
        status: 'pendiente',
        completed: false,
        createdAt: '2026-10-17',
      });

      render(<DashboardView profile={mockProfile} onNavigate={() => {}} />);
      const areaSection = screen.getByRole('region', { name: /áreas temáticas/i });
      expect(within(areaSection).getByText('Completar sesión de mindfulness')).toBeInTheDocument();
      expect(screen.queryByText(/Capítulo 1 a 6 leídos y sintetizados/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Examen: Noviembre 2026/i)).not.toBeInTheDocument();
    });

    it('guardar pliego de reflexión persiste una nota bujo real con tag #reflexion-diaria', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const { StorageService } = await import('../../src/services/storage');
      const user = userEvent.setup();
      localStorage.clear();
      StorageService.saveProfile(mockProfile);

      render(<DashboardView profile={mockProfile} onNavigate={() => {}} />);

      const q1 = screen.getByPlaceholderText(/momentos de calma, avances o pequeñas victorias/i);
      const q3 = screen.getByPlaceholderText(/primera acción precisa/i);

      await user.type(q1, 'Logré mantener el enfoque por 2 horas sin distracciones.');
      await user.type(q3, 'Comenzar a las 08:00 revisando la bitácora.');

      const saveBtn = screen.getByRole('button', { name: /guardar pliego/i });
      await user.click(saveBtn);

      const savedNotes = StorageService.getNotes(mockProfile.id);
      expect(savedNotes.length).toBeGreaterThan(0);
      const lastNote = savedNotes[savedNotes.length - 1];
      expect(lastNote.isReflection).toBe(true);
      expect(lastNote.tags).toContain('reflexion-diaria');
      expect(lastNote.content).toContain('Logré mantener el enfoque');
      expect(lastNote.content).toContain('Comenzar a las 08:00');
    });

    it('Brain Dump muestra la nota más reciente real en lugar de texto estático', async () => {
      const { StorageService } = await import('../../src/services/storage');
      localStorage.clear();
      StorageService.saveProfile(mockProfile);

      StorageService.saveNote({
        id: 'note-recent-1',
        profileId: mockProfile.id,
        title: 'Idea de Proyecto Espiralia',
        content: 'Explorar diseño con papel rasgado auténtico.',
        tags: ['diseño'],
        createdAt: '2026-10-17T10:00:00Z',
        updatedAt: '2026-10-17T10:00:00Z',
      });

      render(<DashboardView profile={mockProfile} onNavigate={() => {}} />);
      expect(screen.getByText(/Idea de Proyecto Espiralia/i)).toBeInTheDocument();
      expect(screen.getByText(/Explorar diseño con papel rasgado auténtico/i)).toBeInTheDocument();
      expect(screen.queryByText(/Comprar cuaderno de tapas duras tamaño A5/i)).not.toBeInTheDocument();
    });

    it('Métricas de Serenidad despliega valores dinámicos calculados reales y elimina textos fijos de mock', async () => {
      const { StorageService } = await import('../../src/services/storage');
      localStorage.clear();
      StorageService.saveProfile(mockProfile);

      StorageService.saveTodo({
        id: 't-perf-1',
        profileId: mockProfile.id,
        areaId: 'default',
        title: 'Tarea Real 1',
        priority: 'media',
        status: 'completada',
        completed: true,
        createdAt: '2026-10-17',
      });
      StorageService.saveTodo({
        id: 't-perf-2',
        profileId: mockProfile.id,
        areaId: 'default',
        title: 'Tarea Real 2',
        priority: 'alta',
        status: 'pendiente',
        completed: false,
        createdAt: '2026-10-17',
      });

      render(<DashboardView profile={mockProfile} onNavigate={() => {}} />);

      expect(screen.getAllByText('50%')[0]).toBeInTheDocument();
      expect(screen.getByText(/1 de 2 tareas logradas/i)).toBeInTheDocument();
      expect(screen.queryByText('IndexedDB activo')).not.toBeInTheDocument();
      expect(screen.queryByText('Objetivo semestral')).not.toBeInTheDocument();
      expect(screen.getByText('Almacenamiento')).toBeInTheDocument();
      expect(screen.getByText(/de ~5\.0 MB en este navegador/)).toBeInTheDocument();
    });
  });
});
