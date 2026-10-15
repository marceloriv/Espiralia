import { describe, it, expect } from 'vitest';
import type { Note, Folder, LinkItem, ViewType } from '../types';

describe('Notes, Folders and Links Types', () => {
  it('permite estructurar notas normales y reflexiones terapéuticas extensas', () => {
    const reflection: Note = {
      id: 'note-1',
      profileId: 'p-1',
      title: 'Reflexión de sesión terapéutica',
      content: 'Contenido extenso sobre el proceso de autorregulación...',
      isReflection: true,
      tags: ['terapia', 'proceso'],
      createdAt: '2026-10-14T20:00:00Z',
      updatedAt: '2026-10-14T20:30:00Z',
    };

    expect(reflection.isReflection).toBe(true);
    expect(reflection.tags).toHaveLength(2);
  });

  it('permite asociar carpetas y vínculos web', () => {
    const folder: Folder = {
      id: 'f-1',
      profileId: 'p-1',
      name: 'Conducción Clase B',
      color: '#3b82f6',
      createdAt: '2026-10-14T10:00:00Z',
    };

    const link: LinkItem = {
      id: 'l-1',
      profileId: 'p-1',
      folderId: 'f-1',
      title: 'Simulador Conaset',
      url: 'https://conaset.cl/simulador',
      description: 'Práctica para examen teórico',
      createdAt: '2026-10-14T10:05:00Z',
    };

    expect(link.folderId).toBe(folder.id);
  });

  it('amplía ViewType para incluir notes y folders', () => {
    const v1: ViewType = 'notes';
    const v2: ViewType = 'folders';
    expect(v1).toBe('notes');
    expect(v2).toBe('folders');
  });
});
