import { describe, it, expect, beforeEach } from 'vitest';
import { StorageService } from '../services/storage';
import { isoWeekKey } from '../utils/localDate';
import type { Goal, PlannerBlock } from '../types';

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

  it('clearWeeklyPlanner borra solo los bloques semanales del perfil indicado', () => {
    // Técnica: partición de equivalencia (semanal propio, mensual propio, semanal de otro perfil).
    const block = (id: string, profileId: string, period: PlannerBlock['period']): PlannerBlock => ({
      id, profileId, period, timeSlot: 'mañana', title: id, priority: 'media', completed: false, dayOfWeek: 1,
    });
    StorageService.savePlanner(block('a-sem-1', profileA, 'semanal'));
    StorageService.savePlanner(block('a-sem-2', profileA, 'semanal'));
    StorageService.savePlanner(block('a-mes', profileA, 'mensual'));
    StorageService.savePlanner(block('b-sem', profileB, 'semanal'));

    expect(StorageService.clearWeeklyPlanner(profileA)).toBe(2);
    expect(StorageService.getPlanner(profileA).map(b => b.id)).toEqual(['a-mes']);
    expect(StorageService.getPlanner(profileB).map(b => b.id)).toEqual(['b-sem']);
  });
});

// Bloques y hábitos no tenían semana: la misma semana se repetía siempre y las marcas no se reiniciaban.
describe('StorageService - semanas ISO en bloques y hábitos', () => {
  const profileId = 'p-semanas';
  const semanaActual = isoWeekKey(new Date());

  beforeEach(() => localStorage.clear());

  it('clearWeeklyPlanner borra solo la semana indicada; un bloque sin semana cuenta como de la actual', () => {
    const block = (id: string, weekKey?: string): PlannerBlock => ({
      id, profileId, period: 'semanal', timeSlot: 'mañana', title: id, priority: 'media', completed: false, dayOfWeek: 1, ...(weekKey ? { weekKey } : {}),
    });
    StorageService.savePlanner(block('actual', semanaActual));
    StorageService.savePlanner(block('antiguo'));
    StorageService.savePlanner(block('otra', '1999-W01'));

    expect(StorageService.clearWeeklyPlanner(profileId, semanaActual)).toBe(2);
    expect(StorageService.getPlanner(profileId).map(b => b.id)).toEqual(['otra']);
  });

  it('un hábito marcado otra semana llega vacío y marcarlo lo pasa a la semana actual', () => {
    StorageService.saveHabit({ id: 'h-vieja', profileId, name: 'Leer', weekKey: '1999-W01', daysCompleted: [true, true, false, false, false, false, false] });

    expect(StorageService.getHabits(profileId)[0].daysCompleted).toEqual(Array(7).fill(false));

    StorageService.toggleHabitDay(profileId, 'h-vieja', 3);
    const [habito] = StorageService.getHabits(profileId);
    expect(habito.daysCompleted).toEqual([false, false, false, true, false, false, false]);
    expect(habito.weekKey).toBe(semanaActual);
  });

  it('un hábito guardado sin semana conserva sus marcas en la semana actual', () => {
    StorageService.saveHabit({ id: 'h-antiguo', profileId, name: 'Caminar', daysCompleted: [true, false, false, false, false, false, false] });

    expect(StorageService.getHabits(profileId)[0].daysCompleted[0]).toBe(true);
  });
});
