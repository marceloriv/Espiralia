import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { sileo } from 'sileo';
import { TodoView } from '../components/TodoView';
import { StorageService } from '../services/storage';
import { toLocalDateStr } from '../utils/localDate';

describe('TodoView', () => {
  const profileId = 'p-test';

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renderiza la cabecera to-do, solapas manila con marcas de agua numericas, entrada rapida y agenda asociada', () => {
    render(<TodoView profileId={profileId} />);

    expect(screen.getByRole('heading', { level: 1, name: /to-do & áreas integradas\./i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /área estudios/i })).toBeInTheDocument();
    expect(screen.getByText(/entrada rápida/i)).toBeInTheDocument();
    expect(screen.getByText(/agenda asociada/i)).toBeInTheDocument();
    expect(screen.getByText(/disciplina hoy,\s*paz mañana/i)).toBeInTheDocument();
  });

  it('permite agregar, alternar y filtrar tareas', async () => {
    const successSpy = vi.spyOn(sileo, 'success');
    const infoSpy = vi.spyOn(sileo, 'info');
    const user = userEvent.setup();

    render(<TodoView profileId={profileId} />);

    expect(screen.getByText(/^Semana \d{1,2}$/)).toBeInTheDocument();

    const input = screen.getByPlaceholderText(/¿qué tienes pendiente\?/i);
    await user.type(input, 'Comprar insumos{enter}');

    expect(screen.getByText('Comprar insumos')).toBeInTheDocument();
    expect(successSpy).toHaveBeenCalledWith({ title: 'Tarea agregada exitosamente' });

    // Toggle completed
    const checkbox = screen.getByRole('checkbox', { name: /completar comprar insumos/i });
    expect(checkbox).not.toBeChecked();
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(infoSpy).toHaveBeenCalledWith({ title: 'Tarea completada' });

    // Filter pendientes -> no debe aparecer
    const statusFilters = screen.getByRole('region', { name: /filtro de estados/i });
    const pendingFilter = within(statusFilters).getByRole('button', { name: /pendientes/i });
    await user.click(pendingFilter);
    expect(pendingFilter).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByText('Comprar insumos')).not.toBeInTheDocument();

    // Filter completadas -> sí debe aparecer
    const completedFilter = within(statusFilters).getByRole('button', { name: /completadas/i });
    await user.click(completedFilter);
    expect(completedFilter).toHaveAttribute('aria-pressed', 'true');
    expect(pendingFilter).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('Comprar insumos')).toBeInTheDocument();
  });

  it('permite eliminar una tarea', async () => {
    const successSpy = vi.spyOn(sileo, 'success');
    const user = userEvent.setup();
    const areas = StorageService.getAreas(profileId);
    StorageService.saveTodo({
      id: 't-del',
      profileId,
      title: 'Tarea a borrar',
      areaId: areas[0].id,
      priority: 'baja',
      status: 'pendiente',
      completed: false,
      createdAt: '2026-10-09',
    });

    render(<TodoView profileId={profileId} />);

    expect(screen.getByText('Tarea a borrar')).toBeInTheDocument();

    const deleteBtn = screen.getByRole('button', { name: /eliminar tarea a borrar/i });
    await user.click(deleteBtn);

    expect(screen.queryByText('Tarea a borrar')).not.toBeInTheDocument();
    expect(successSpy).toHaveBeenCalledWith({ title: 'Tarea eliminada' });
    expect(StorageService.getTodos(profileId)).toEqual([]);
  });

  it('muestra mensajes explicativos contextuales cuando la lista esta vacia', async () => {
    const user = userEvent.setup();
    render(<TodoView profileId={profileId} />);

    expect(screen.getByText(/aún no has agregado tareas/i)).toBeInTheDocument();
    expect(screen.getByText(/usa el formulario superior para crear tu primera tarea/i)).toBeInTheDocument();

    const input = screen.getByPlaceholderText(/¿qué tienes pendiente\?/i);
    await user.type(input, 'Tarea de prueba{enter}');

    const statusFilters = screen.getByRole('region', { name: /filtro de estados/i });
    const completedFilter = within(statusFilters).getByRole('button', { name: /completadas/i });
    await user.click(completedFilter);

    expect(screen.getByText(/sin tareas completadas aún/i)).toBeInTheDocument();

    const allFilter = within(statusFilters).getByRole('button', { name: /todas/i });
    await user.click(allFilter);

    const checkbox = screen.getByRole('checkbox', { name: /completar tarea de prueba/i });
    await user.click(checkbox);

    await user.click(within(statusFilters).getByRole('button', { name: /pendientes/i }));
    expect(screen.getByText(/¡todo al día!/i)).toBeInTheDocument();
  });

  it('renderiza barra de áreas temáticas con conteos y permite filtrar por área', async () => {
    const user = userEvent.setup();
    const areas = StorageService.getAreas(profileId);
    const estudios = areas.find(a => a.name === 'Estudios')!;
    const personal = areas.find(a => a.name === 'Personal')!;

    StorageService.saveTodo({
      id: 't-w',
      profileId,
      title: 'Reporte trimestral',
      areaId: estudios.id,
      priority: 'alta',
      status: 'pendiente',
      createdAt: '2026-10-10',
    });
    StorageService.saveTodo({
      id: 't-p',
      profileId,
      title: 'Comprar frutas',
      areaId: personal.id,
      priority: 'media',
      status: 'pendiente',
      createdAt: '2026-10-10',
    });

    render(<TodoView profileId={profileId} />);

    // Barra de áreas
    const areaNav = screen.getByRole('region', { name: /áreas temáticas/i });
    expect(within(areaNav).getByText('Estudios')).toBeInTheDocument();
    expect(within(areaNav).getByText('Personal')).toBeInTheDocument();

    // Filtra por Estudios
    await user.click(within(areaNav).getByRole('button', { name: /área estudios/i }));
    expect(screen.getByText('Reporte trimestral')).toBeInTheDocument();
    expect(screen.queryByText('Comprar frutas')).not.toBeInTheDocument();

    // Filtra por Personal
    await user.click(within(areaNav).getByRole('button', { name: /área personal/i }));
    expect(screen.queryByText('Reporte trimestral')).not.toBeInTheDocument();
    expect(screen.getByText('Comprar frutas')).toBeInTheDocument();

    // Filtra por Todas las áreas
    await user.click(within(areaNav).getByRole('button', { name: /todas las áreas/i }));
    expect(screen.getAllByText('Reporte trimestral')[0]).toBeInTheDocument();
    expect(screen.getByText('Comprar frutas')).toBeInTheDocument();
  });

  it('permite marcar tarea como en_progreso y filtrar por estado en progreso', async () => {
    const user = userEvent.setup();
    const areas = StorageService.getAreas(profileId);

    StorageService.saveTodo({
      id: 't-prog',
      profileId,
      title: 'Escribir artículo',
      areaId: areas[0].id,
      priority: 'alta',
      status: 'pendiente',
      createdAt: '2026-10-10',
    });

    render(<TodoView profileId={profileId} />);

    const statusPill = screen.getByRole('button', { name: /estado: pendiente/i });
    await user.click(statusPill);

    expect(screen.getByRole('button', { name: /estado: en progreso/i })).toBeInTheDocument();
    expect(StorageService.getTodos(profileId)[0].status).toBe('en_progreso');

    // Filtro "En progreso"
    const statusFilters = screen.getByRole('region', { name: /filtro de estados/i });
    const progFilter = within(statusFilters).getByRole('button', { name: /en progreso/i });
    await user.click(progFilter);
    expect(screen.getAllByText('Escribir artículo')[0]).toBeInTheDocument();

    // Filtro "Pendientes" no la debe mostrar en lista detallada
    const pendFilter = within(statusFilters).getByRole('button', { name: /pendientes/i });
    await user.click(pendFilter);
    const detailedSection = screen.getByText(/tareas que importan/i).closest('div')!;
    expect(within(detailedSection).queryByText('Escribir artículo')).not.toBeInTheDocument();
  });

  it('permite asignar fecha de vencimiento al crear y editarla en la tarjeta', async () => {
    const user = userEvent.setup();
    render(<TodoView profileId={profileId} />);

    const input = screen.getByPlaceholderText(/¿qué tienes pendiente\?/i);
    await user.type(input, 'Pagar cuentas');

    const dateInput = screen.getByLabelText(/fecha de vencimiento/i);
    await user.type(dateInput, '2026-10-25');

    const addBtn = screen.getByRole('button', { name: /añadir/i });
    await user.click(addBtn);

    expect(screen.getByText('Pagar cuentas')).toBeInTheDocument();
    const todo = StorageService.getTodos(profileId).find(t => t.title === 'Pagar cuentas');
    expect(todo?.dueDate).toBe('2026-10-25');

    // Píldora de vencimiento en la tarjeta
    const duePill = screen.getByRole('button', { name: /vencimiento: 2026-10-25/i });
    expect(duePill).toBeInTheDocument();
  });

  it('permite crear una nueva área temática desde el modal de gestión', async () => {
    const user = userEvent.setup();
    render(<TodoView profileId={profileId} />);

    const newAreaBtn = screen.getByRole('button', { name: /crear área/i });
    await user.click(newAreaBtn);

    const dialog = screen.getByRole('dialog', { name: /nueva área temática/i });
    expect(dialog).toBeInTheDocument();

    const nameInput = within(dialog).getByLabelText(/nombre del área/i);
    await user.type(nameInput, 'Nutrición');

    const saveBtn = within(dialog).getByRole('button', { name: /guardar área/i });
    await user.click(saveBtn);

    const areaNav = screen.getByRole('region', { name: /áreas temáticas/i });
    expect(within(areaNav).getByText('Nutrición')).toBeInTheDocument();
    expect(StorageService.getAreas(profileId).some(a => a.name === 'Nutrición')).toBe(true);
  });

  it('mantiene estricto aislamiento de áreas y tareas entre dos perfiles', () => {
    StorageService.getAreas('perfil-1');
    StorageService.saveArea({
      id: 'a-excl',
      profileId: 'perfil-1',
      name: 'Solo Perfil 1',
      color: '#ff0000',
      createdAt: '2026-10-10',
    });
    StorageService.saveTodo({
      id: 't-p1',
      profileId: 'perfil-1',
      title: 'Tarea confidencial 1',
      areaId: 'a-excl',
      priority: 'alta',
      status: 'pendiente',
      createdAt: '2026-10-10',
    });

    render(<TodoView profileId="perfil-2" />);

    expect(screen.queryByText('Solo Perfil 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Tarea confidencial 1')).not.toBeInTheDocument();
  });

  describe('Agenda Asociada y Energía Diaria en TodoView', () => {
    it('conecta Agenda Asociada a los eventos reales del perfil y elimina eventos estáticos de mock', () => {
      StorageService.saveEvent({
        id: 'ev-real-1',
        profileId,
        title: 'Revisión Técnica de Vehículo',
        date: toLocalDateStr(new Date()),
        startTime: '10:00',
        endTime: '11:00',
        category: 'personal',
      });

      render(<TodoView profileId={profileId} />);

      expect(screen.getByText('Revisión Técnica de Vehículo')).toBeInTheDocument();
      expect(screen.queryByText(/Simulacro Conaset & Práctica en Calle/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Sesión Terapia Clínica Presencial/i)).not.toBeInTheDocument();
    });

    it('no muestra en Próximos hitos los eventos que ya pasaron', () => {
      StorageService.saveEvent({ id: 'ev-pasado', profileId, title: 'Evento de la semana pasada', date: '2000-01-05' });

      render(<TodoView profileId={profileId} />);

      expect(screen.queryByText('Evento de la semana pasada')).not.toBeInTheDocument();
      expect(screen.getByText(/sin eventos agendados próximamente/i)).toBeInTheDocument();
    });

    it('el enlace a la vista semanal navega a Agenda', async () => {
      const user = userEvent.setup();
      const onNavigate = vi.fn();
      render(<TodoView profileId={profileId} onNavigate={onNavigate} />);

      await user.click(screen.getByRole('button', { name: /ver vista semanal extendida en agenda/i }));

      expect(onNavigate).toHaveBeenCalledWith('agenda');
    });

    it('persiste el nivel de energía diario seleccionado en StorageService', async () => {
      const { toLocalDateStr } = await import('../../src/utils/localDate');
      const user = userEvent.setup();
      render(<TodoView profileId={profileId} />);

      const sunBtn = screen.getByRole('button', { name: /nivel plena/i });
      await user.click(sunBtn);

      const todayStr = toLocalDateStr(new Date());
      expect(StorageService.getTodayMood(profileId, todayStr)).toBe('☀️');
    });

    it('conecta Top Priorities a las tareas críticas reales y elimina mocks de conaset', async () => {
      const user = userEvent.setup();
      StorageService.saveTodo({
        id: 'todo-crit-real',
        profileId,
        areaId: 'default',
        title: 'Presentación Directorio Q4',
        priority: 'alta',
        status: 'pendiente',
        completed: false,
        createdAt: '2026-10-17',
      });

      render(<TodoView profileId={profileId} />);

      expect(screen.getByRole('heading', { level: 4, name: 'Presentación Directorio Q4' })).toBeInTheDocument();
      expect(screen.queryByText(/Estudio Conaset: Repasar señales de prioridad/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Llevar libreta física de desahogo a consulta/i)).not.toBeInTheDocument();

      const checkbox = screen.getByRole('button', { name: /completar prioridad presentación directorio q4/i });
      await user.click(checkbox);

      expect(StorageService.getTodos(profileId).find(t => t.id === 'todo-crit-real')?.completed).toBe(true);
    });

    it('Top Priorities muestra estado limpio cuando no hay tareas críticas pendientes', () => {
      render(<TodoView profileId={profileId} />);
      expect(screen.getByText(/todo al día • ninguna prioridad crítica pendiente/i)).toBeInTheDocument();
      expect(screen.queryByText(/Estudio Conaset/i)).not.toBeInTheDocument();
    });

    it('pone el sello carmín al completar tarea y no conserva grapas ni relleno de ejemplo', () => {
      StorageService.saveTodo({
        id: 'todo-staple-test',
        profileId,
        areaId: 'default',
        title: 'Caligrafía y apunte escolar',
        priority: 'media',
        status: 'completada',
        completed: true,
        createdAt: '2026-10-18',
      });

      const { container } = render(<TodoView profileId={profileId} />);

      for (const ornamento of ['schoolStaplesBar', 'schoolMarginGuide', 'washiTape', 'tornEdge', 'metalClipAccent', 'metalPaperclipCorner']) {
        expect(container.querySelector(`[class*="${ornamento}"]`), ornamento).toBeNull();
      }
      expect(screen.queryByText(/antidistracciones/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/vaciado mental/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/small steps every day/i)).not.toBeInTheDocument();
      expect(container.querySelectorAll('[data-tinte="terracota"]').length).toBeGreaterThanOrEqual(2);
      expect(container.querySelector('[data-tinte="pizarra"]')).not.toBeNull();

      const stamp = container.querySelector('[class*="stampCompletedSeal"]');
      expect(stamp).toBeInTheDocument();
      expect(stamp).toHaveAttribute('aria-hidden', 'true');
      expect(stamp).toHaveTextContent('HECHO');
    });
  });
});
