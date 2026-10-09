import type { Profile, AgendaEvent, PlannerBlock, TodoItem } from '../types';

const PROFILES_KEY = 'espiralia_profiles';
const ACTIVE_PROFILE_KEY = 'espiralia_active_profile_id';

const getScopedKey = (profileId: string, domain: string) => `espiralia_${profileId}_${domain}`;

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

  // Todos
  getTodos(profileId: string): TodoItem[] {
    try {
      const data = localStorage.getItem(getScopedKey(profileId, 'todos'));
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveTodo(todo: TodoItem): void {
    const list = this.getTodos(todo.profileId);
    const existingIndex = list.findIndex(t => t.id === todo.id);
    if (existingIndex >= 0) {
      list[existingIndex] = todo;
    } else {
      list.push(todo);
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
      todo.completed = !todo.completed;
      localStorage.setItem(getScopedKey(profileId, 'todos'), JSON.stringify(list));
    }
  },
};
