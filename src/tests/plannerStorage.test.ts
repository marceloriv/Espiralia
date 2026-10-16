import { describe, it, expect, beforeEach } from 'vitest';
import { StorageService } from '../services/storage';
import type { Goal } from '../types';

describe('StorageService - Goals & Planner persistence', () => {
  const profileA = 'p-alpha';
  const profileB = 'p-beta';

  beforeEach(() => {
    localStorage.clear();
  });

  it('guarda, recupera y elimina metas con aislamiento estricto por perfil', () => {
    const goalA: Goal = {
      id: 'g-1',
      profileId: profileA,
      title: 'Meta Perfil A',
      period: 'semanal',
      items: [{ id: 'sub-1', title: 'Paso 1', completed: false }],
      createdAt: '2026-10-14',
    };

    StorageService.saveGoal(goalA);

    expect(StorageService.getGoals(profileA)).toHaveLength(1);
    expect(StorageService.getGoals(profileB)).toHaveLength(0);

    // Actualizar sub-item
    const updatedGoal: Goal = {
      ...goalA,
      items: [{ id: 'sub-1', title: 'Paso 1', completed: true }],
    };
    StorageService.saveGoal(updatedGoal);
    expect(StorageService.getGoals(profileA)[0].items[0].completed).toBe(true);

    // Eliminar meta
    StorageService.deleteGoal(profileA, 'g-1');
    expect(StorageService.getGoals(profileA)).toHaveLength(0);
  });

  it('borra metas y bloques en cascada al eliminar un perfil', () => {
    StorageService.saveGoal({
      id: 'g-cascade',
      profileId: profileA,
      title: 'Meta a borrar',
      period: 'semanal',
      items: [],
      createdAt: '2026-10-14',
    });

    StorageService.savePlanner({
      id: 'pb-cascade',
      profileId: profileA,
      period: 'semanal',
      timeSlot: 'mañana',
      title: 'Bloque a borrar',
      priority: 'alta',
      completed: false,
      dayOfWeek: 1,
    });

    StorageService.deleteProfile(profileA);

    expect(StorageService.getGoals(profileA)).toHaveLength(0);
    expect(StorageService.getPlanner(profileA)).toHaveLength(0);
  });
});
