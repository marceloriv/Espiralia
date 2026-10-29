import { describe, it, expect, beforeEach } from 'vitest';
import { StorageService, LOCALSTORAGE_QUOTA_BYTES } from '../services/storage';
import { formatBytes } from '../utils/formatBytes';

describe('StorageService.getProfileStorageBytes', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('es 0 para un perfil sin datos', () => {
    expect(StorageService.getProfileStorageBytes('p-vacio')).toBe(0);
  });

  it('crece al guardar una tarea y no cuenta datos de otros perfiles', () => {
    StorageService.saveTodo({
      id: 't-1',
      profileId: 'p-uso',
      title: 'Tarea de prueba',
      areaId: 'area-1',
      priority: 'media',
      status: 'pendiente',
      createdAt: '2026-10-22',
    });

    expect(StorageService.getProfileStorageBytes('p-uso')).toBeGreaterThan(0);
    expect(StorageService.getProfileStorageBytes('p-otro')).toBe(0);
  });

  it('expone la cuota de localStorage en 5 MB', () => {
    expect(LOCALSTORAGE_QUOTA_BYTES).toBe(5 * 1024 * 1024);
  });
});

describe('formatBytes', () => {
  it.each([
    [0, '0 KB'],
    [393, '1 KB'],
    [43008, '42 KB'],
    [1468006, '1.4 MB'],
  ])('formatBytes(%i) devuelve %s', (bytes, expected) => {
    expect(formatBytes(bytes)).toBe(expected);
  });
});
