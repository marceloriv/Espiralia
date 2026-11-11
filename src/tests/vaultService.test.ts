import { describe, it, expect, beforeEach } from 'vitest';
import { VaultService } from '../services/vaultService';
import { StorageService } from '../services/storage';

describe('VaultService', () => {
  const profileId = 'p-vault-source';

  beforeEach(() => {
    localStorage.clear();
    StorageService.saveProfile({ id: profileId, name: 'Perfil Origen', avatar: 'O', createdAt: '2026-10-15' });
    StorageService.saveTodo({ id: 't-src', profileId, areaId: 'area-1', title: 'Comprar libro', priority: 'media', status: 'pendiente', createdAt: '2026-10-15' });
    StorageService.saveNote({ id: 'n-src', profileId, title: 'Nota fuente', content: 'Info', createdAt: '2026-10-15', updatedAt: '2026-10-15' });
  });

  it('exporta todos los datos del perfil activo en un objeto estructurado', () => {
    const backup = VaultService.exportProfile(profileId);
    expect(backup.version).toBe(1);
    expect(backup.profile.id).toBe(profileId);
    expect(backup.todos).toHaveLength(1);
    expect(backup.notes).toHaveLength(1);
  });

  it('valida rigurosamente esquemas válidos y rechaza entradas malformadas', () => {
    const valid = VaultService.exportProfile(profileId);
    expect(VaultService.validateBackup(valid)).toBe(true);

    expect(VaultService.validateBackup(null)).toBe(false);
    // files es opcional (respaldos anteriores a los PDF), pero si viene debe ser lista.
    expect(VaultService.validateBackup({ ...valid, files: [] })).toBe(true);
    expect(VaultService.validateBackup({ ...valid, files: 'no-es-lista' })).toBe(false);
    expect(VaultService.validateBackup({ version: 2 })).toBe(false);
    expect(VaultService.validateBackup({ version: 1, profile: null })).toBe(false);
    expect(VaultService.validateBackup({ version: 1, profile: {}, todos: 'no-es-array' })).toBe(false);
  });

  it('restaura sobrescribiendo el perfil existente', () => {
    const backup = VaultService.exportProfile(profileId);
    // Cambiar datos en el respaldo
    backup.todos = [{ id: 't-new', profileId, areaId: 'area-1', title: 'Tarea restaurada', priority: 'alta', status: 'completada', createdAt: '2026-10-15' }];

    const result = VaultService.restoreProfile(backup, 'overwrite', profileId);
    expect(result.profile.id).toBe(profileId);

    const todos = StorageService.getTodos(profileId);
    expect(todos).toHaveLength(1);
    expect(todos[0].title).toBe('Tarea restaurada');
  });

  it('restaura como nuevo perfil generando nuevo ID sin tocar el origen', () => {
    const backup = VaultService.exportProfile(profileId);
    backup.profile.name = 'Perfil Clonado';

    const result = VaultService.restoreProfile(backup, 'new_profile');
    expect(result.profile.id).not.toBe(profileId);
    expect(result.profile.name).toBe('Perfil Clonado');

    // El perfil original permanece intacto
    expect(StorageService.getTodos(profileId)).toHaveLength(1);
    // El nuevo perfil tiene sus propias copias
    expect(StorageService.getTodos(result.profile.id)).toHaveLength(1);
    expect(StorageService.getProfiles()).toHaveLength(2);
  });

  it('restaura hábitos, compromisos, energía, ánimo y foco en un perfil nuevo', () => {
    StorageService.saveHabit({ id: 'h-1', profileId, name: 'Leer', daysCompleted: [true, false, false, false, false, false, false] });
    StorageService.saveDistractions(profileId, ['Sin redes hasta las 18h']);
    StorageService.setTodayMood(profileId, '2026-11-03', '☀️');
    StorageService.setTodayDisposition(profileId, '2026-11-03', 'calma');
    StorageService.setTodayFocus(profileId, '2026-11-03', 't-src');

    // Ida y vuelta por el JSON del archivo descargado, que las vistas escriben con JSON.stringify(backup, null, 2).
    // No es una copia: structuredClone conservaría undefined, Date o Map, que el archivo pierde.
    const archivo = JSON.stringify(VaultService.exportProfile(profileId), null, 2);
    const backup = JSON.parse(archivo);
    const { profile } = VaultService.restoreProfile(backup, 'new_profile');

    expect(StorageService.getHabits(profile.id).map(h => [h.name, h.daysCompleted[0]])).toEqual([['Leer', true]]);
    expect(StorageService.getDistractions(profile.id)).toEqual(['Sin redes hasta las 18h']);
    expect(StorageService.getTodayMood(profile.id, '2026-11-03')).toBe('☀️');
    expect(StorageService.getTodayDisposition(profile.id, '2026-11-03')).toBe('calma');
    expect(StorageService.getTodayFocus(profile.id, '2026-11-03')).toBe('t-src');
  });

  it('un respaldo anterior a estos campos restaura y conserva los hábitos al sobrescribir', () => {
    StorageService.saveHabit({ id: 'h-1', profileId, name: 'Leer', daysCompleted: Array(7).fill(false) });
    const antiguo = VaultService.exportProfile(profileId);
    delete antiguo.habits;
    delete antiguo.distractions;
    delete antiguo.dailyEnergy;
    delete antiguo.moods;
    delete antiguo.dailyFocus;

    expect(VaultService.validateBackup(antiguo)).toBe(true);
    VaultService.restoreProfile(antiguo, 'overwrite', profileId);
    expect(StorageService.getHabits(profileId)).toHaveLength(1);
  });

  it('al sobrescribir, las áreas del respaldo reemplazan a las del perfil', () => {
    const backup = VaultService.exportProfile(profileId);
    StorageService.saveArea({ id: 'area-extra', profileId, name: 'Creada después', color: '#6b7280', createdAt: '2026-11-01' });

    VaultService.restoreProfile(backup, 'overwrite', profileId);
    expect(StorageService.getAreas(profileId).map(a => a.name)).not.toContain('Creada después');
  });
});
