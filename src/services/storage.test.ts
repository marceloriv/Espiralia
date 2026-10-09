import { describe, it, expect, beforeEach } from 'vitest';
import { StorageService } from './storage';
import type { Profile, AgendaEvent, PlannerBlock, TodoItem } from '../types';

describe('StorageService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Profiles', () => {
    it('saves and retrieves profiles', () => {
      expect(StorageService.getProfiles()).toEqual([]);

      const p: Profile = {
        id: 'p-test',
        name: 'Andrés',
        avatar: 'A',
        createdAt: '2026-10-09T00:00:00.000Z',
      };
      StorageService.saveProfile(p);

      const profiles = StorageService.getProfiles();
      expect(profiles).toHaveLength(1);
      expect(profiles[0].name).toBe('Andrés');
    });

    it('deletes profile and cascades delete of its scoped data', () => {
      const p1: Profile = { id: 'p-1', name: 'User 1', avatar: '1', createdAt: '2026-10-09' };
      const p2: Profile = { id: 'p-2', name: 'User 2', avatar: '2', createdAt: '2026-10-09' };
      StorageService.saveProfile(p1);
      StorageService.saveProfile(p2);

      StorageService.saveEvent({ id: 'e-1', profileId: 'p-1', title: 'Ev 1', date: '2026-10-10' });
      StorageService.saveTodo({
        id: 't-1',
        profileId: 'p-1',
        title: 'Task 1',
        category: 'Work',
        priority: 'alta',
        completed: false,
        createdAt: '2026-10-09',
      });
      StorageService.saveEvent({ id: 'e-2', profileId: 'p-2', title: 'Ev 2', date: '2026-10-10' });

      StorageService.deleteProfile('p-1');

      expect(StorageService.getProfiles().map(p => p.id)).toEqual(['p-2']);
      expect(StorageService.getEvents('p-1')).toEqual([]);
      expect(StorageService.getTodos('p-1')).toEqual([]);
      expect(StorageService.getEvents('p-2')).toHaveLength(1);
    });
  });

  describe('Agenda Events', () => {
    it('isolates events per profile', () => {
      const ev1: AgendaEvent = { id: 'e-1', profileId: 'p-1', title: 'Ev 1', date: '2026-10-10' };
      const ev2: AgendaEvent = { id: 'e-2', profileId: 'p-2', title: 'Ev 2', date: '2026-10-10' };

      StorageService.saveEvent(ev1);
      StorageService.saveEvent(ev2);

      expect(StorageService.getEvents('p-1')).toHaveLength(1);
      expect(StorageService.getEvents('p-1')[0].title).toBe('Ev 1');
      expect(StorageService.getEvents('p-2')).toHaveLength(1);
      expect(StorageService.getEvents('p-2')[0].title).toBe('Ev 2');

      StorageService.deleteEvent('p-1', 'e-1');
      expect(StorageService.getEvents('p-1')).toEqual([]);
      expect(StorageService.getEvents('p-2')).toHaveLength(1);
    });
  });

  describe('Planner Blocks', () => {
    it('saves and deletes planner blocks per profile', () => {
      const block: PlannerBlock = {
        id: 'pb-1',
        profileId: 'p-1',
        period: 'semanal',
        timeSlot: 'mañana',
        title: 'Bloque 1',
        priority: 'alta',
        completed: false,
      };

      StorageService.savePlanner(block);
      expect(StorageService.getPlanner('p-1')).toHaveLength(1);

      StorageService.deletePlanner('p-1', 'pb-1');
      expect(StorageService.getPlanner('p-1')).toEqual([]);
    });
  });

  describe('Todos', () => {
    it('toggles and deletes todos per profile', () => {
      const todo: TodoItem = {
        id: 't-1',
        profileId: 'p-1',
        title: 'Limpiar código',
        category: 'Dev',
        priority: 'alta',
        completed: false,
        createdAt: '2026-10-09',
      };

      StorageService.saveTodo(todo);
      expect(StorageService.getTodos('p-1')[0].completed).toBe(false);

      StorageService.toggleTodo('p-1', 't-1');
      expect(StorageService.getTodos('p-1')[0].completed).toBe(true);

      StorageService.deleteTodo('p-1', 't-1');
      expect(StorageService.getTodos('p-1')).toEqual([]);
    });
  });
});
