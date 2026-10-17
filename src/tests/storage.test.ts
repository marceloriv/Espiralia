import { describe, it, expect, beforeEach } from 'vitest';
import { StorageService } from '../services/storage';
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
        areaId: 'area-1',
        category: 'Work',
        priority: 'alta',
        status: 'pendiente',
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

  describe('Areas', () => {
    it('siembra áreas por defecto cuando el perfil no tiene áreas', () => {
      const areas = StorageService.getAreas('p-1');
      expect(areas).toHaveLength(4);
      expect(areas.map(a => a.name)).toEqual(['Estudios', 'Personal', 'Universidad', 'General']);
      expect(areas[0].profileId).toBe('p-1');
    });

    it('aísla áreas entre diferentes perfiles', () => {
      StorageService.getAreas('p-1');
      StorageService.saveArea({
        id: 'a-custom-1',
        profileId: 'p-1',
        name: 'Proyectos P1',
        color: '#4f46e5',
        createdAt: '2026-10-10',
      });

      const areasP2 = StorageService.getAreas('p-2');
      expect(areasP2.find(a => a.name === 'Proyectos P1')).toBeUndefined();
    });

    it('guarda y actualiza un área', () => {
      const area = {
        id: 'a-nueva',
        profileId: 'p-1',
        name: 'Salud',
        color: '#10b981',
        createdAt: '2026-10-10',
      };
      StorageService.saveArea(area);
      const list = StorageService.getAreas('p-1');
      expect(list.find(a => a.id === 'a-nueva')?.name).toBe('Salud');

      StorageService.saveArea({ ...area, name: 'Salud y Bienestar' });
      expect(StorageService.getAreas('p-1').find(a => a.id === 'a-nueva')?.name).toBe('Salud y Bienestar');
    });

    it('elimina un área y reasigna tareas huérfanas al área General', () => {
      const areas = StorageService.getAreas('p-1');
      const estudiosArea = areas.find(a => a.name === 'Estudios')!;
      const generalArea = areas.find(a => a.name === 'General')!;

      StorageService.saveTodo({
        id: 't-1',
        profileId: 'p-1',
        title: 'Informe mensual',
        areaId: estudiosArea.id,
        priority: 'alta',
        status: 'pendiente',
        createdAt: '2026-10-10',
      });

      StorageService.deleteArea('p-1', estudiosArea.id);
      expect(StorageService.getAreas('p-1').find(a => a.id === estudiosArea.id)).toBeUndefined();

      const todos = StorageService.getTodos('p-1');
      expect(todos[0].areaId).toBe(generalArea.id);
    });
  });

  describe('Todos con estados y migración', () => {
    it('toggles y deletes todos con status y compatibilidad de completed', () => {
      const areas = StorageService.getAreas('p-1');
      const generalArea = areas.find(a => a.name === 'General')!;

      const todo: TodoItem = {
        id: 't-1',
        profileId: 'p-1',
        title: 'Limpiar código',
        areaId: generalArea.id,
        priority: 'alta',
        status: 'pendiente',
        completed: false,
        createdAt: '2026-10-09',
      };

      StorageService.saveTodo(todo);
      expect(StorageService.getTodos('p-1')[0].status).toBe('pendiente');
      expect(StorageService.getTodos('p-1')[0].completed).toBe(false);

      StorageService.toggleTodo('p-1', 't-1');
      expect(StorageService.getTodos('p-1')[0].status).toBe('completada');
      expect(StorageService.getTodos('p-1')[0].completed).toBe(true);

      StorageService.toggleTodo('p-1', 't-1');
      expect(StorageService.getTodos('p-1')[0].status).toBe('pendiente');
      expect(StorageService.getTodos('p-1')[0].completed).toBe(false);

      StorageService.deleteTodo('p-1', 't-1');
      expect(StorageService.getTodos('p-1')).toEqual([]);
    });

    it('migra tareas legadas con completed boolean y category string sin perder datos', () => {
      // Simular almacenamiento legado directo sin status ni areaId
      const legacyTodos = [
        {
          id: 'leg-1',
          profileId: 'p-1',
          title: 'Tarea completada vieja',
          category: 'Trabajo',
          priority: 'media',
          completed: true,
          createdAt: '2026-10-08',
        },
        {
          id: 'leg-2',
          profileId: 'p-1',
          title: 'Tarea pendiente vieja',
          category: 'Personal',
          priority: 'alta',
          completed: false,
          createdAt: '2026-10-08',
        },
      ];
      localStorage.setItem('espiralia_p-1_todos', JSON.stringify(legacyTodos));

      const migrated = StorageService.getTodos('p-1');
      expect(migrated).toHaveLength(2);
      expect(migrated[0].status).toBe('completada');
      expect(migrated[0].completed).toBe(true);
      expect(migrated[0].areaId).toBeDefined();

      expect(migrated[1].status).toBe('pendiente');
      expect(migrated[1].completed).toBe(false);
      expect(migrated[1].areaId).toBeDefined();
    });

    it('borrado de perfil en cascada elimina también espiralia_{profileId}_areas', () => {
      StorageService.saveProfile({ id: 'p-del', name: 'User', avatar: 'U', createdAt: '2026-10-10' });
      StorageService.getAreas('p-del');
      expect(localStorage.getItem('espiralia_p-del_areas')).not.toBeNull();

      StorageService.deleteProfile('p-del');
      expect(localStorage.getItem('espiralia_p-del_areas')).toBeNull();
    });
  });

  describe('Notes & Folders persistence', () => {
    it('saves and isolates notes and folders per profile and cascades on deleteProfile', () => {
      StorageService.saveNote({
        id: 'n-1',
        profileId: 'p-1',
        title: 'Reflexión nocturna',
        content: 'Avance sólido hoy',
        updatedAt: '2026-10-17',
        createdAt: '2026-10-17',
      });
      StorageService.saveFolder({
        id: 'f-1',
        profileId: 'p-1',
        name: 'Universidad & Admisión',
        createdAt: '2026-10-17',
      });

      expect(StorageService.getNotes('p-1')).toHaveLength(1);
      expect(StorageService.getFolders('p-1')).toHaveLength(1);

      StorageService.deleteProfile('p-1');
      expect(StorageService.getNotes('p-1')).toEqual([]);
      expect(StorageService.getFolders('p-1')).toEqual([]);
    });
  });
});
