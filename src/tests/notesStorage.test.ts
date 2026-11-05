import { describe, it, expect, beforeEach } from 'vitest';
import { StorageService } from '../services/storage';
import type { Note, Folder, LinkItem } from '../types';

describe('StorageService - Notes, Folders & Links', () => {
  const profileId = 'p-notes-test';

  beforeEach(() => {
    localStorage.clear();
  });

  it('guarda, recupera y elimina notas con aislamiento por perfil', () => {
    const note: Note = {
      id: 'n-1',
      profileId,
      title: 'Nota 1',
      content: 'Contenido de prueba',
      createdAt: '2026-10-14',
      updatedAt: '2026-10-14',
    };

    StorageService.saveNote(note);
    expect(StorageService.getNotes(profileId)).toHaveLength(1);
    expect(StorageService.getNotes('otro-perfil')).toHaveLength(0);

    StorageService.deleteNote(profileId, 'n-1');
    expect(StorageService.getNotes(profileId)).toHaveLength(0);
  });

  it('gestiona carpetas y vínculos asociados', () => {
    const folder: Folder = {
      id: 'f-1',
      profileId,
      name: 'Estudios',
      createdAt: '2026-10-14',
    };
    StorageService.saveFolder(folder);
    expect(StorageService.getFolders(profileId)).toHaveLength(1);

    const link: LinkItem = {
      id: 'l-1',
      profileId,
      folderId: 'f-1',
      title: 'Portal Universidad',
      url: 'https://universidad.cl',
      createdAt: '2026-10-14',
    };
    StorageService.saveLink(link);
    expect(StorageService.getLinks(profileId)).toHaveLength(1);
  });

  it('borra notas, carpetas y enlaces al eliminar el perfil', () => {
    StorageService.saveNote({
      id: 'n-del',
      profileId,
      title: 'Nota a borrar',
      content: '...',
      createdAt: '2026-10-14',
      updatedAt: '2026-10-14',
    });
    StorageService.saveFolder({ id: 'f-del', profileId, name: 'Carpeta a borrar', createdAt: '2026-10-14' });
    StorageService.saveLink({ id: 'l-del', profileId, title: 'Link', url: 'https://test.com', createdAt: '2026-10-14' });

    StorageService.deleteProfile(profileId);

    expect(StorageService.getNotes(profileId)).toHaveLength(0);
    expect(StorageService.getFolders(profileId)).toHaveLength(0);
    expect(StorageService.getLinks(profileId)).toHaveLength(0);
  });

  // El aviso dice que notas y vínculos quedan sin carpeta, pero seguían apuntando a una carpeta borrada.
  it('borrar una carpeta deja sus notas y vínculos sin carpeta y no toca los tomos de Notas', () => {
    StorageService.saveFolder({ id: 'f-borrar', profileId, name: 'Temporal', createdAt: '2026-11-01' });
    StorageService.saveNote({ id: 'n-en', profileId, folderId: 'f-borrar', title: 'En carpeta', content: '', createdAt: '2026-11-01', updatedAt: '2026-11-01' });
    StorageService.saveNote({ id: 'n-tomo', profileId, folderId: 'tomo-02', title: 'En tomo', content: '', createdAt: '2026-11-01', updatedAt: '2026-11-01' });
    StorageService.saveLink({ id: 'l-en', profileId, folderId: 'f-borrar', title: 'Enlace', url: 'https://example.com', createdAt: '2026-11-01' });

    StorageService.deleteFolder(profileId, 'f-borrar');

    const notas = StorageService.getNotes(profileId);
    expect(notas.find(n => n.id === 'n-en')?.folderId).toBeUndefined();
    expect(notas.find(n => n.id === 'n-tomo')?.folderId).toBe('tomo-02');
    expect(StorageService.getLinks(profileId)[0].folderId).toBeUndefined();
  });
});
