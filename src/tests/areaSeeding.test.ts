import { describe, it, expect, beforeEach } from 'vitest';
import { StorageService } from '../services/storage';

describe('Area Seeding', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('siembra las 3 áreas clave solicitadas (Estudios, Personal, Universidad) más General', () => {
    const areas = StorageService.getAreas('p-test');
    const names = areas.map(a => a.name);
    expect(names).toContain('Estudios');
    expect(names).toContain('Personal');
    expect(names).toContain('Universidad');
    expect(names).toContain('General');
  });

  it('siembra datos contextuales de inicio para el perfil nuevo', () => {
    StorageService.seedInitialProfileData('p-test');
    const todos = StorageService.getTodos('p-test');
    const links = StorageService.getLinks('p-test');
    const notes = StorageService.getNotes('p-test');
    expect(todos.some(t => t.title.includes('Conaset'))).toBe(true);
    expect(todos.some(t => t.title.includes('2026-II'))).toBe(true);
    expect(links.some(l => l.url.includes('conaset.cl'))).toBe(true);
    expect(notes.some(n => n.isReflection)).toBe(true);
  });
});
