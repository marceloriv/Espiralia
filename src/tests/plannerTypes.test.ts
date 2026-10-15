import { describe, it, expect } from 'vitest';
import type { PlannerBlock, Goal, DayOfWeek } from '../types';

describe('Planner and Goals Types', () => {
  it('permite definir bloques con día de la semana y bloques legados sin día', () => {
    const modernBlock: PlannerBlock = {
      id: 'pb-1',
      profileId: 'p-1',
      period: 'semanal',
      timeSlot: 'mañana',
      title: 'Foco matutino',
      priority: 'alta',
      completed: false,
      dayOfWeek: 1 as DayOfWeek, // Lunes
      time: '08:00',
    };

    const legacyBlock: PlannerBlock = {
      id: 'pb-legacy',
      profileId: 'p-1',
      period: 'semanal',
      timeSlot: 'tarde',
      title: 'Bloque antiguo',
      priority: 'media',
      completed: true,
    };

    expect(modernBlock.dayOfWeek).toBe(1);
    expect(legacyBlock.dayOfWeek).toBeUndefined();
  });

  it('permite estructurar metas con checklist de sub-items', () => {
    const goal: Goal = {
      id: 'goal-1',
      profileId: 'p-1',
      title: 'Aprobar examen teórico',
      category: 'Metas Académicas',
      period: 'semanal',
      items: [
        { id: 'sub-1', title: 'Módulo 1: Señalética', completed: true },
        { id: 'sub-2', title: 'Módulo 2: Velocidades', completed: false },
      ],
      createdAt: '2026-10-14',
    };

    expect(goal.items).toHaveLength(2);
    expect(goal.items[0].completed).toBe(true);
  });
});
