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
});
