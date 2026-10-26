import { describe, it, expect, beforeEach } from 'vitest';
import { createNewProfile, updateProfilePin, removeProfilePin, deleteProfileData } from '../services/profileOperations';
import { StorageService } from '../services/storage';
import type { TodoItem } from '../types';

function guardarTarea(profileId: string, title: string): void {
  const todo: TodoItem = {
    id: `t-${profileId}`,
    profileId,
    title,
    areaId: 'a-1',
    priority: 'media',
    status: 'pendiente',
    createdAt: '2026-10-23',
  };
  StorageService.saveTodo(todo);
}

describe('profileOperations — desacoplamiento de lógica async para React Compiler', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('createNewProfile crea un perfil válido sin PIN', async () => {
    const res = await createNewProfile('Lucía', '');
    expect(res.success).toBe(true);
    expect(res.profile?.name).toBe('Lucía');
    expect(StorageService.getProfiles().length).toBe(1);
  });

  it('createNewProfile crea un perfil con PIN cifrado', async () => {
    const res = await createNewProfile('Marcos', '1234');
    expect(res.success).toBe(true);
    expect(res.profile?.pinHash).toBeDefined();
    expect(res.profile?.pinSalt).toBeDefined();
  });

  it('updateProfilePin valida PIN actual antes de actualizar', async () => {
    const created = await createNewProfile('Elena', '1234');
    const failRes = await updateProfilePin(created.profile!, '5678', '9999');
    expect(failRes.success).toBe(false);
    expect(failRes.error).toMatch(/incorrecto/i);
  });

  it('removeProfilePin elimina el hash de PIN tras verificar', async () => {
    const created = await createNewProfile('Pedro', '1234');
    const res = await removeProfilePin(created.profile!, '1234');
    expect(res.success).toBe(true);
    expect(res.updated?.pinHash).toBeUndefined();
  });

  it('deleteProfileData borra un perfil sin PIN y sus datos', async () => {
    const created = await createNewProfile('Ana', '');
    const id = created.profile!.id;
    guardarTarea(id, 'Tarea de Ana');

    const res = await deleteProfileData(created.profile!);

    expect(res.success).toBe(true);
    expect(StorageService.getProfiles()).toHaveLength(0);
    expect(localStorage.getItem(`espiralia_${id}_todos`)).toBeNull();
  });

  it('deleteProfileData no toca los datos de otro perfil', async () => {
    const ana = await createNewProfile('Ana', '');
    // Id fijo: dos createNewProfile en el mismo milisegundo comparten `p-${Date.now()}`.
    const beto = { id: 'p-beto', name: 'Beto', avatar: 'B', createdAt: '2026-10-23' };
    StorageService.saveProfile(beto);
    guardarTarea(ana.profile!.id, 'Tarea de Ana');
    guardarTarea(beto.id, 'Tarea de Beto');

    await deleteProfileData(ana.profile!);

    expect(StorageService.getProfiles().map(p => p.id)).toEqual([beto.id]);
    expect(StorageService.getTodos(beto.id).map(t => t.title)).toEqual(['Tarea de Beto']);
  });

  it('deleteProfileData exige el PIN en un perfil protegido', async () => {
    const created = await createNewProfile('Carla', '1234');

    const res = await deleteProfileData(created.profile!);

    expect(res.success).toBe(false);
    expect(res.error).toBe('Ingresa tu PIN actual para confirmar');
    expect(StorageService.getProfiles()).toHaveLength(1);
  });

  it('deleteProfileData rechaza un PIN erróneo', async () => {
    const created = await createNewProfile('Diego', '1234');
    guardarTarea(created.profile!.id, 'Tarea de Diego');

    const res = await deleteProfileData(created.profile!, '0000');

    expect(res.success).toBe(false);
    expect(res.error).toBe('El PIN actual es incorrecto');
    expect(StorageService.getProfiles()).toHaveLength(1);
    expect(StorageService.getTodos(created.profile!.id)).toHaveLength(1);
  });

  it('deleteProfileData borra con el PIN correcto y limpia el perfil activo', async () => {
    const created = await createNewProfile('Elisa', '1234');
    expect(StorageService.getActiveProfileId()).toBe(created.profile!.id);

    const res = await deleteProfileData(created.profile!, '1234');

    expect(res.success).toBe(true);
    expect(StorageService.getProfiles()).toHaveLength(0);
    expect(StorageService.getActiveProfileId()).toBeNull();
  });
});
