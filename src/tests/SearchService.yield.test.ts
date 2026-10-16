import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SearchService } from '../services/searchService';
import * as StorageModule from '../services/storage';
import * as SchedulerModule from '../utils/scheduler';

// Genera N tareas con el mismo título para forzar iteraciones
const makeTodos = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    id: `t${i}`,
    profileId: 'p-test',
    title: `tarea de prueba ${i}`,
    priority: 'media' as const,
    status: 'pendiente' as const,
    category: 'General',
    areaId: '',
    dueDate: '',
    completed: false,
    createdAt: '',
  }));

describe('SearchService – chunking async yields', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    // Stub StorageService para devolver sólo todos, sin el resto
    vi.spyOn(StorageModule.StorageService, 'getTodos').mockReturnValue(makeTodos(500));
    vi.spyOn(StorageModule.StorageService, 'getEvents').mockReturnValue([]);
    vi.spyOn(StorageModule.StorageService, 'getNotes').mockReturnValue([]);
    vi.spyOn(StorageModule.StorageService, 'getGoals').mockReturnValue([]);
    vi.spyOn(StorageModule.StorageService, 'getPlanner').mockReturnValue([]);
    vi.spyOn(StorageModule.StorageService, 'getLinks').mockReturnValue([]);
    vi.spyOn(StorageModule.StorageService, 'getAreas').mockReturnValue([]);
    vi.spyOn(StorageModule.StorageService, 'getFolders').mockReturnValue([]);
  });

  it('llama yieldNow al menos una vez por item de cada colección', async () => {
    const yieldSpy = vi.spyOn(SchedulerModule, 'yieldNow');

    await SearchService.search('p-test', 'tarea');

    // 500 todos × 1 yield c/u = 500 llamadas mínimas
    expect(yieldSpy).toHaveBeenCalledTimes(500);
  });

  it('retorna resultados correctos a pesar del chunking', async () => {
    const result = await SearchService.search('p-test', 'tarea');
    expect(result.todos.length).toBeGreaterThan(0);
    expect(result.totalCount).toBe(result.todos.length);
  });

  it('retorna vacío con query corta sin llamar yieldNow', async () => {
    const yieldSpy = vi.spyOn(SchedulerModule, 'yieldNow');
    const result = await SearchService.search('p-test', 'x');
    expect(result.totalCount).toBe(0);
    expect(yieldSpy).not.toHaveBeenCalled();
  });
});
