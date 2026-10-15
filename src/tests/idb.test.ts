import { describe, it, expect, beforeEach } from 'vitest';
import { EspiraliaIDB } from '../services/idb';

describe('EspiraliaIDB Core Storage', () => {
  const profileId = 'p-idb-test';

  beforeEach(async () => {
    await EspiraliaIDB.clearProfile(profileId);
  });

  it('opera de forma segura incluso si window.indexedDB no está disponible', async () => {
    const item = { id: 'test-1', profileId, data: 'valor seguro' };
    await EspiraliaIDB.put('notes', item);

    const items = await EspiraliaIDB.getAll('notes', profileId);
    expect(items).toContainEqual(item);

    await EspiraliaIDB.delete('notes', 'test-1');
    const afterDelete = await EspiraliaIDB.getAll('notes', profileId);
    expect(afterDelete).toHaveLength(0);
  });

  it('purga todos los registros del perfil al invocar clearProfile', async () => {
    await EspiraliaIDB.put('notes', { id: 'n-1', profileId, title: 'Nota' });
    await EspiraliaIDB.put('folders', { id: 'f-1', profileId, name: 'Carpeta' });

    await EspiraliaIDB.clearProfile(profileId);

    const notes = await EspiraliaIDB.getAll('notes', profileId);
    const folders = await EspiraliaIDB.getAll('folders', profileId);
    expect(notes).toHaveLength(0);
    expect(folders).toHaveLength(0);
  });
});
