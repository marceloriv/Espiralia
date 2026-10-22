import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StorageService, STORAGE_ERROR_EVENT } from '../services/storage';
import type { TodoItem } from '../types';

const todo: TodoItem = {
  id: 't-quota',
  profileId: 'p-quota',
  title: 'Tarea de prueba',
  areaId: 'area-1',
  priority: 'media',
  status: 'pendiente',
  createdAt: '2026-10-22',
};

const fillStorage = () =>
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('full', 'QuotaExceededError');
  });

describe('StorageService con almacenamiento lleno', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('saveTodo no lanza y despacha espiralia:storage-error', () => {
    const listener = vi.fn();
    window.addEventListener(STORAGE_ERROR_EVENT, listener);
    fillStorage();

    expect(() => StorageService.saveTodo(todo)).not.toThrow();
    expect(listener).toHaveBeenCalled();

    window.removeEventListener(STORAGE_ERROR_EVENT, listener);
  });

  it('toggleTodo no lanza cuando no puede guardar', () => {
    StorageService.saveTodo(todo);
    fillStorage();

    expect(() => StorageService.toggleTodo(todo.profileId, todo.id)).not.toThrow();
  });

  it('getAreas devuelve las áreas por defecto aunque no pueda guardarlas', () => {
    fillStorage();

    expect(StorageService.getAreas('p-quota')).toHaveLength(4);
  });
});
