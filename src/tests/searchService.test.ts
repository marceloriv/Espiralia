import { describe, it, expect, beforeEach } from 'vitest';
import { SearchService, normalizeSearchText } from '../services/searchService';
import { StorageService } from '../services/storage';

describe('SearchService (Motor de Búsqueda Local)', () => {
  const profileA = 'p-search-a';
  const profileB = 'p-search-b';

  beforeEach(() => {
    localStorage.clear();
    // Perfil A con datos variados
    StorageService.saveProfile({ id: profileA, name: 'Perfil A', avatar: 'A', createdAt: '2026-10-15' });
    StorageService.saveTodo({ id: 't-1', profileId: profileA, title: 'Revisión médica anual', priority: 'alta', status: 'pendiente', areaId: 'a-1', createdAt: '2026-10-15' });
    StorageService.saveEvent({ id: 'e-1', profileId: profileA, title: 'Sesión de Terapia', date: '2026-10-20', startTime: '15:00', endTime: '16:00', category: 'personal' });
    StorageService.saveNote({ id: 'n-1', profileId: profileA, title: 'Reflexión sobre el descanso', content: 'Es crucial dormir 8 horas y desconectar pantallas.', createdAt: '2026-10-15', updatedAt: '2026-10-15' });
    StorageService.saveGoal({ id: 'g-1', profileId: profileA, title: 'Aprender TypeScript Avanzado', period: 'semanal', items: [{ id: 'gi-1', title: 'Leer sobre Template Literals', completed: false }], createdAt: '2026-10-15' });
    StorageService.savePlanner({ id: 'b-1', profileId: profileA, title: 'Bloque de estudio matutino', period: 'semanal', timeSlot: 'mañana', priority: 'media', dayOfWeek: 1, completed: false });
    StorageService.saveLink({ id: 'l-1', profileId: profileA, title: 'Portal de Documentación React', url: 'https://react.dev', description: 'Referencia oficial de hooks', createdAt: '2026-10-15' });

    // Perfil B para validar aislamiento
    StorageService.saveProfile({ id: profileB, name: 'Perfil B', avatar: 'B', createdAt: '2026-10-15' });
    StorageService.saveTodo({ id: 't-b', profileId: profileB, title: 'Revisión médica oculta', priority: 'baja', status: 'pendiente', areaId: 'a-b', createdAt: '2026-10-15' });
  });

  it('normaliza texto eliminando acentos, espacios y convirtiendo a minúsculas', () => {
    expect(normalizeSearchText('  ¡Canción de Éxito!  ')).toBe('¡cancion de exito!');
    expect(normalizeSearchText('TERAPIA')).toBe('terapia');
  });

  it('retorna resultados vacíos si la consulta tiene menos de 2 caracteres', () => {
    const results = SearchService.search(profileA, 'a');
    expect(results.totalCount).toBe(0);
    expect(results.todos).toHaveLength(0);
  });

  it('encuentra tareas por coincidencia en título independientemente de tildes y mayúsculas', () => {
    const results = SearchService.search(profileA, 'revision medica');
    expect(results.todos).toHaveLength(1);
    expect(results.todos[0].title).toBe('Revisión médica anual');
    expect(results.todos[0].targetView).toBe('todo');
  });

  it('encuentra eventos de agenda y asigna targetView agenda', () => {
    const results = SearchService.search(profileA, 'terapia');
    expect(results.events).toHaveLength(1);
    expect(results.events[0].title).toBe('Sesión de Terapia');
    expect(results.events[0].targetView).toBe('agenda');
  });

  it('encuentra notas tanto por título como por contenido interior', () => {
    const byTitle = SearchService.search(profileA, 'descanso');
    expect(byTitle.notes).toHaveLength(1);

    const byContent = SearchService.search(profileA, 'dormir 8 horas');
    expect(byContent.notes).toHaveLength(1);
    expect(byContent.notes[0].targetView).toBe('notes');
  });

  it('encuentra metas y bloques de planner asignando sus vistas respectivas', () => {
    const goalRes = SearchService.search(profileA, 'typescript');
    expect(goalRes.goals).toHaveLength(1);
    expect(goalRes.goals[0].targetView).toBe('planner');

    const blockRes = SearchService.search(profileA, 'estudio');
    expect(blockRes.planner).toHaveLength(1);
    expect(blockRes.planner[0].targetView).toBe('planner');
  });

  it('encuentra vínculos web por título o descripción', () => {
    const linkRes = SearchService.search(profileA, 'react');
    expect(linkRes.links).toHaveLength(1);
    expect(linkRes.links[0].targetView).toBe('folders');
  });

  it('respeta aislamiento estricto y jamás retorna datos de otro perfil', () => {
    const results = SearchService.search(profileA, 'revision');
    expect(results.todos).toHaveLength(1);
    expect(results.todos[0].id).toBe('t-1');
    expect(results.todos.some(t => t.id === 't-b')).toBe(false);
  });
});
