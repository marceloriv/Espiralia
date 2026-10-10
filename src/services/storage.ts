import type { Profile, AgendaEvent, PlannerBlock, TodoItem, Area, TaskStatus } from '../types';

const PROFILES_KEY = 'espiralia_profiles';
const ACTIVE_PROFILE_KEY = 'espiralia_active_profile_id';

const getScopedKey = (profileId: string, domain: string) => `espiralia_${profileId}_${domain}`;

const DEFAULT_AREAS = [
  { name: 'Trabajo', color: '#3b82f6' },
  { name: 'Personal', color: '#10b981' },
  { name: 'Estudio', color: '#8b5cf6' },
  { name: 'General', color: '#6b7280' },
];

export const StorageService = {
  // Profiles
  getProfiles(): Profile[] {
    try {
      const data = localStorage.getItem(PROFILES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveProfile(profile: Profile): void {
    const list = this.getProfiles();
    const existingIndex = list.findIndex(p => p.id === profile.id);
    if (existingIndex >= 0) {
      list[existingIndex] = profile;
    } else {
      list.push(profile);
    }
    localStorage.setItem(PROFILES_KEY, JSON.stringify(list));
  },

  deleteProfile(id: string): void {
    const list = this.getProfiles().filter(p => p.id !== id);
    localStorage.setItem(PROFILES_KEY, JSON.stringify(list));

    // Cascade delete profile data
    localStorage.removeItem(getScopedKey(id, 'events'));
    localStorage.removeItem(getScopedKey(id, 'planner'));
    localStorage.removeItem(getScopedKey(id, 'todos'));
    localStorage.removeItem(getScopedKey(id, 'areas'));

    if (this.getActiveProfileId() === id) {
      this.clearActiveProfileId();
    }
  },

  getActiveProfileId(): string | null {
    return localStorage.getItem(ACTIVE_PROFILE_KEY);
  },

  setActiveProfileId(id: string): void {
    localStorage.setItem(ACTIVE_PROFILE_KEY, id);
  },

  clearActiveProfileId(): void {
    localStorage.removeItem(ACTIVE_PROFILE_KEY);
  },

  // Agenda Events
  getEvents(profileId: string): AgendaEvent[] {
    try {
      const data = localStorage.getItem(getScopedKey(profileId, 'events'));
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveEvent(event: AgendaEvent): void {
    const list = this.getEvents(event.profileId);
    const existingIndex = list.findIndex(e => e.id === event.id);
    if (existingIndex >= 0) {
      list[existingIndex] = event;
    } else {
      list.push(event);
    }
    localStorage.setItem(getScopedKey(event.profileId, 'events'), JSON.stringify(list));
  },

  deleteEvent(profileId: string, eventId: string): void {
    const list = this.getEvents(profileId).filter(e => e.id !== eventId);
    localStorage.setItem(getScopedKey(profileId, 'events'), JSON.stringify(list));
  },

  // Planner
  getPlanner(profileId: string): PlannerBlock[] {
    try {
      const data = localStorage.getItem(getScopedKey(profileId, 'planner'));
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  savePlanner(block: PlannerBlock): void {
    const list = this.getPlanner(block.profileId);
    const existingIndex = list.findIndex(b => b.id === block.id);
    if (existingIndex >= 0) {
      list[existingIndex] = block;
    } else {
      list.push(block);
    }
    localStorage.setItem(getScopedKey(block.profileId, 'planner'), JSON.stringify(list));
  },

  deletePlanner(profileId: string, blockId: string): void {
    const list = this.getPlanner(profileId).filter(b => b.id !== blockId);
    localStorage.setItem(getScopedKey(profileId, 'planner'), JSON.stringify(list));
  },

  // Areas
  getAreas(profileId: string): Area[] {
    try {
      const data = localStorage.getItem(getScopedKey(profileId, 'areas'));
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      const seeded: Area[] = DEFAULT_AREAS.map((def, idx) => ({
        id: `area-${idx + 1}-${Date.now()}`,
        profileId,
        name: def.name,
        color: def.color,
        createdAt: new Date().toISOString(),
      }));
      localStorage.setItem(getScopedKey(profileId, 'areas'), JSON.stringify(seeded));
      return seeded;
    } catch {
      return [];
    }
  },

  saveArea(area: Area): void {
    const list = this.getAreas(area.profileId);
    const existingIndex = list.findIndex(a => a.id === area.id);
    if (existingIndex >= 0) {
      list[existingIndex] = area;
    } else {
      list.push(area);
    }
    localStorage.setItem(getScopedKey(area.profileId, 'areas'), JSON.stringify(list));
  },

  deleteArea(profileId: string, areaId: string): void {
    const list = this.getAreas(profileId).filter(a => a.id !== areaId);
    localStorage.setItem(getScopedKey(profileId, 'areas'), JSON.stringify(list));

    // Reasignar tareas huérfanas al área General o la primera disponible
    const fallbackArea = list.find(a => a.name.toLowerCase() === 'general') ?? list[0];
    if (fallbackArea) {
      const todos = this.getTodos(profileId);
      let changed = false;
      for (const t of todos) {
        if (t.areaId === areaId) {
          t.areaId = fallbackArea.id;
          changed = true;
        }
      }
      if (changed) {
        localStorage.setItem(getScopedKey(profileId, 'todos'), JSON.stringify(todos));
      }
    }
  },

  // Todos
  getTodos(profileId: string): TodoItem[] {
    try {
      const data = localStorage.getItem(getScopedKey(profileId, 'todos'));
      const rawList: any[] = data ? JSON.parse(data) : [];
      if (!Array.isArray(rawList)) return [];

      const areas = this.getAreas(profileId);
      const defaultArea = areas.find(a => a.name.toLowerCase() === 'general') ?? areas[0];

      return rawList.map(raw => {
        const status: TaskStatus = raw.status ?? (raw.completed ? 'completada' : 'pendiente');
        let areaId = raw.areaId;
        if (!areaId && raw.category) {
          const match = areas.find(a => a.name.toLowerCase() === String(raw.category).toLowerCase());
          areaId = match ? match.id : defaultArea?.id;
        }
        if (!areaId && defaultArea) {
          areaId = defaultArea.id;
        }

        return {
          ...raw,
          status,
          completed: status === 'completada',
          areaId: areaId ?? 'default',
        };
      });
    } catch {
      return [];
    }
  },

  saveTodo(todo: TodoItem): void {
    const list = this.getTodos(todo.profileId);
    const status: TaskStatus = todo.status ?? (todo.completed ? 'completada' : 'pendiente');
    const normalized: TodoItem = {
      ...todo,
      status,
      completed: status === 'completada',
    };
    const existingIndex = list.findIndex(t => t.id === todo.id);
    if (existingIndex >= 0) {
      list[existingIndex] = normalized;
    } else {
      list.push(normalized);
    }
    localStorage.setItem(getScopedKey(todo.profileId, 'todos'), JSON.stringify(list));
  },

  deleteTodo(profileId: string, todoId: string): void {
    const list = this.getTodos(profileId).filter(t => t.id !== todoId);
    localStorage.setItem(getScopedKey(profileId, 'todos'), JSON.stringify(list));
  },

  toggleTodo(profileId: string, todoId: string): void {
    const list = this.getTodos(profileId);
    const todo = list.find(t => t.id === todoId);
    if (todo) {
      if (todo.status === 'completada') {
        todo.status = 'pendiente';
        todo.completed = false;
      } else {
        todo.status = 'completada';
        todo.completed = true;
      }
      localStorage.setItem(getScopedKey(profileId, 'todos'), JSON.stringify(list));
    }
  },

  setTodoStatus(profileId: string, todoId: string, status: TaskStatus): void {
    const list = this.getTodos(profileId);
    const todo = list.find(t => t.id === todoId);
    if (todo) {
      todo.status = status;
      todo.completed = status === 'completada';
      localStorage.setItem(getScopedKey(profileId, 'todos'), JSON.stringify(list));
    }
  },
};

