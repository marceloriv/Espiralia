import { describe, it, expect } from 'vitest';
import type { Profile, AgendaEvent, PlannerBlock, TodoItem, ViewType, Area, TaskStatus } from '../types';

describe('Domain types contract', () => {
  it('instantiates valid Profile', () => {
    const profile: Profile = {
      id: 'p-1',
      name: 'María',
      avatar: 'M',
      pin: '1234',
      createdAt: new Date().toISOString(),
    };
    expect(profile.name).toBe('María');
    expect(profile.pin).toBe('1234');
  });

  it('instantiates valid AgendaEvent', () => {
    const event: AgendaEvent = {
      id: 'e-1',
      profileId: 'p-1',
      title: 'Reunión de equipo',
      date: '2026-10-10',
      startTime: '10:00',
      endTime: '11:00',
      category: 'trabajo',
    };
    expect(event.category).toBe('trabajo');
  });

  it('instantiates valid PlannerBlock', () => {
    const block: PlannerBlock = {
      id: 'pb-1',
      profileId: 'p-1',
      period: 'semanal',
      timeSlot: 'mañana',
      title: 'Enfoque profundo',
      priority: 'alta',
      completed: false,
    };
    expect(block.priority).toBe('alta');
  });

  it('instantiates valid Area', () => {
    const area: Area = {
      id: 'a-1',
      profileId: 'p-1',
      name: 'Trabajo',
      color: '#4f46e5',
      createdAt: new Date().toISOString(),
    };
    expect(area.name).toBe('Trabajo');
    expect(area.color).toBe('#4f46e5');
  });

  it('instantiates valid TodoItem con status y areaId', () => {
    const todo: TodoItem = {
      id: 't-1',
      profileId: 'p-1',
      title: 'Comprar café',
      areaId: 'a-1',
      priority: 'media',
      status: 'en_progreso',
      completed: false,
      dueDate: '2026-10-15',
      createdAt: new Date().toISOString(),
    };
    expect(todo.status).toBe('en_progreso');
    expect(todo.areaId).toBe('a-1');
  });

  it('supports allowed ViewType values', () => {
    const views: ViewType[] = ['dashboard', 'agenda', 'planner', 'todo'];
    expect(views).toHaveLength(4);
  });
});
