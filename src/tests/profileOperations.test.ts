import { describe, it, expect, beforeEach } from 'vitest';
import { createNewProfile, updateProfilePin, removeProfilePin } from '../services/profileOperations';
import { StorageService } from '../services/storage';

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
});
