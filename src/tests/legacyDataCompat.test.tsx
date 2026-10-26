import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StorageService } from '../services/storage';
import { TodoView } from '../components/TodoView';
import { NotesView } from '../components/NotesView';
import { DashboardView } from '../components/DashboardView';
import type { Profile } from '../types';

// Hay personas usando la app: ningún cambio de UI puede cambiar claves, formas ni valores guardados.
// Estos datos tienen el formato que escribían versiones anteriores.
const profile = { id: 'p-legacy-data', name: 'Rosa' } as Profile;
const key = (domain: string) => `espiralia_${profile.id}_${domain}`;

const seedLegacy = () => {
  localStorage.clear();
  StorageService.saveProfile(profile);
  localStorage.setItem(
    key('areas'),
    JSON.stringify([{ id: 'area-1', profileId: profile.id, name: 'Estudios', color: '#3b82f6', createdAt: '2026-09-01' }]),
  );
  // Tarea sin areaId ni status, con la categoría como texto (forma más antigua).
  localStorage.setItem(
    key('todos'),
    JSON.stringify([{ id: 't-old', profileId: profile.id, title: 'Tarea guardada antes', category: 'Estudios', priority: 'alta', completed: true, createdAt: '2026-09-02' }]),
  );
  localStorage.setItem(
    key('notes'),
    JSON.stringify([
      { id: 'n-old', profileId: profile.id, title: 'Nota guardada antes', content: 'Texto de la nota', tags: ['terapia'], folderId: 'tomo-01', createdAt: '2026-09-03' },
    ]),
  );
  // El estado de ánimo/energía se guarda como emoji.
  localStorage.setItem(key('daily_energy'), JSON.stringify({ '2026-10-22': '☀️' }));
};

describe('Datos guardados por versiones anteriores', () => {
  beforeEach(seedLegacy);

  it('los servicios devuelven los datos con sus claves y valores originales', () => {
    expect(StorageService.getAreas(profile.id)[0].color).toBe('#3b82f6');
    expect(StorageService.getTodos(profile.id)[0]).toMatchObject({ id: 't-old', status: 'completada', completed: true });
    expect(StorageService.getNotes(profile.id)[0]).toMatchObject({ folderId: 'tomo-01', tags: ['terapia'] });
    expect(StorageService.getTodayMood(profile.id, '2026-10-22')).toBe('☀️');
  });

  it('TodoView muestra la tarea antigua sin perder el color del área', () => {
    render(<TodoView profileId={profile.id} />);

    expect(screen.getByText('Tarea guardada antes')).toBeInTheDocument();
    expect(StorageService.getAreas(profile.id)[0].color).toBe('#3b82f6');
  });

  it('NotesView muestra la nota antigua dentro de su tomo', () => {
    render(<NotesView profileId={profile.id} />);

    expect(screen.getByText('Nota guardada antes')).toBeInTheDocument();
  });

  it('DashboardView renderiza con datos antiguos y no los modifica', async () => {
    const beforeMap = new Map<string, string>(Object.entries(localStorage));
    render(<DashboardView profile={profile} onNavigate={() => {}} />);

    expect(await screen.findByText(/1 de 1 tareas logradas/i)).toBeInTheDocument();
    // Solo pueden aparecer claves nuevas; ninguna clave existente cambia de valor.
    for (const [k, v] of Object.entries(localStorage)) {
      if (beforeMap.has(k)) expect(v, k).toBe(beforeMap.get(k));
    }
  });
});
