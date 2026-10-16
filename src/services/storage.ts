import type { Profile, AgendaEvent, PlannerBlock, TodoItem, Area, TaskStatus, Priority, Goal, Note, Folder, LinkItem } from '../types';
import { EspiraliaIDB } from './idb';

const PROFILES_KEY = 'espiralia_profiles';
const ACTIVE_PROFILE_KEY = 'espiralia_active_profile_id';

const getScopedKey = (profileId: string, domain: string) => `espiralia_${profileId}_${domain}`;

const DEFAULT_AREAS = [
  { name: 'Estudios', color: '#3b82f6' },
  { name: 'Personal', color: '#10b981' },
  { name: 'Universidad', color: '#8b5cf6' },
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
    localStorage.removeItem(getScopedKey(id, 'goals'));
    localStorage.removeItem(getScopedKey(id, 'todos'));
    localStorage.removeItem(getScopedKey(id, 'areas'));
    localStorage.removeItem(getScopedKey(id, 'notes'));
    localStorage.removeItem(getScopedKey(id, 'folders'));
    localStorage.removeItem(getScopedKey(id, 'links'));
    void EspiraliaIDB.clearProfile(id);

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

  // Goals
  getGoals(profileId: string): Goal[] {
    try {
      const data = localStorage.getItem(getScopedKey(profileId, 'goals'));
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveGoal(goal: Goal): void {
    const list = this.getGoals(goal.profileId);
    const existingIndex = list.findIndex(g => g.id === goal.id);
    if (existingIndex >= 0) {
      list[existingIndex] = goal;
    } else {
      list.push(goal);
    }
    localStorage.setItem(getScopedKey(goal.profileId, 'goals'), JSON.stringify(list));
  },

  deleteGoal(profileId: string, goalId: string): void {
    const list = this.getGoals(profileId).filter(g => g.id !== goalId);
    localStorage.setItem(getScopedKey(profileId, 'goals'), JSON.stringify(list));
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
      const rawList: Array<Record<string, unknown>> = data ? JSON.parse(data) : [];
      if (!Array.isArray(rawList)) return [];

      const areas = this.getAreas(profileId);
      const defaultArea = areas.find(a => a.name.toLowerCase() === 'general') ?? areas[0];

      return rawList.map(raw => {
        const status: TaskStatus = (raw.status as TaskStatus) ?? (raw.completed ? 'completada' : 'pendiente');
        let areaId = typeof raw.areaId === 'string' ? raw.areaId : undefined;
        if (!areaId && raw.category) {
          const match = areas.find(a => a.name.toLowerCase() === String(raw.category).toLowerCase());
          areaId = match ? match.id : defaultArea?.id;
        }
        if (!areaId && defaultArea) {
          areaId = defaultArea.id;
        }

        return {
          id: String(raw.id ?? `todo-${Date.now()}`),
          profileId: String(raw.profileId ?? profileId),
          title: String(raw.title ?? ''),
          priority: (raw.priority as Priority) ?? 'media',
          createdAt: String(raw.createdAt ?? new Date().toISOString()),
          dueDate: typeof raw.dueDate === 'string' ? raw.dueDate : undefined,
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

  // Notes
  getNotes(profileId: string): Note[] {
    try {
      const data = localStorage.getItem(getScopedKey(profileId, 'notes'));
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveNote(note: Note): void {
    const list = this.getNotes(note.profileId);
    const existingIndex = list.findIndex(n => n.id === note.id);
    if (existingIndex >= 0) {
      list[existingIndex] = note;
    } else {
      list.push(note);
    }
    localStorage.setItem(getScopedKey(note.profileId, 'notes'), JSON.stringify(list));
    void EspiraliaIDB.put('notes', note);
  },

  deleteNote(profileId: string, noteId: string): void {
    const list = this.getNotes(profileId).filter(n => n.id !== noteId);
    localStorage.setItem(getScopedKey(profileId, 'notes'), JSON.stringify(list));
    void EspiraliaIDB.delete('notes', noteId);
  },

  // Folders
  getFolders(profileId: string): Folder[] {
    try {
      const data = localStorage.getItem(getScopedKey(profileId, 'folders'));
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveFolder(folder: Folder): void {
    const list = this.getFolders(folder.profileId);
    const existingIndex = list.findIndex(f => f.id === folder.id);
    if (existingIndex >= 0) {
      list[existingIndex] = folder;
    } else {
      list.push(folder);
    }
    localStorage.setItem(getScopedKey(folder.profileId, 'folders'), JSON.stringify(list));
    void EspiraliaIDB.put('folders', folder);
  },

  deleteFolder(profileId: string, folderId: string): void {
    const list = this.getFolders(profileId).filter(f => f.id !== folderId);
    localStorage.setItem(getScopedKey(profileId, 'folders'), JSON.stringify(list));
    void EspiraliaIDB.delete('folders', folderId);
  },

  // Links
  getLinks(profileId: string): LinkItem[] {
    try {
      const data = localStorage.getItem(getScopedKey(profileId, 'links'));
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveLink(link: LinkItem): void {
    const list = this.getLinks(link.profileId);
    const existingIndex = list.findIndex(l => l.id === link.id);
    if (existingIndex >= 0) {
      list[existingIndex] = link;
    } else {
      list.push(link);
    }
    localStorage.setItem(getScopedKey(link.profileId, 'links'), JSON.stringify(list));
    void EspiraliaIDB.put('links', link);
  },

  deleteLink(profileId: string, linkId: string): void {
    const list = this.getLinks(profileId).filter(l => l.id !== linkId);
    localStorage.setItem(getScopedKey(profileId, 'links'), JSON.stringify(list));
    void EspiraliaIDB.delete('links', linkId);
  },

  seedInitialProfileData(profileId: string): void {
    const areas = this.getAreas(profileId);
    const estudiosArea = areas.find(a => a.name.toLowerCase().startsWith('estudio')) ?? areas[0];
    const personalArea = areas.find(a => a.name.toLowerCase() === 'personal') ?? areas[0];
    const universidadArea = areas.find(a => a.name.toLowerCase() === 'universidad') ?? areas[0];

    const currentTodos = this.getTodos(profileId);
    if (currentTodos.length === 0) {
      const initialTodos: TodoItem[] = [
        {
          id: `todo-seed-1`,
          profileId,
          title: 'Preparación teórica licencia Clase B: Banco de preguntas Conaset',
          areaId: estudiosArea.id,
          category: estudiosArea.name,
          priority: 'alta',
          status: 'pendiente',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: `todo-seed-2`,
          profileId,
          title: 'Simulacro de examen y práctica de manejo',
          areaId: estudiosArea.id,
          category: estudiosArea.name,
          priority: 'media',
          status: 'pendiente',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: `todo-seed-3`,
          profileId,
          title: 'Escritura de bitácora semanal y proceso terapéutico',
          areaId: personalArea.id,
          category: personalArea.name,
          priority: 'media',
          status: 'pendiente',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: `todo-seed-4`,
          profileId,
          title: 'Postulaciones semestre 2026-II: Entrega de portafolio y becas',
          areaId: universidadArea.id,
          category: universidadArea.name,
          priority: 'alta',
          status: 'pendiente',
          completed: false,
          createdAt: new Date().toISOString(),
        },
      ];
      for (const t of initialTodos) {
        this.saveTodo(t);
      }
    }

    const currentLinks = this.getLinks(profileId);
    if (currentLinks.length === 0) {
      const initialLinks: LinkItem[] = [
        {
          id: `link-seed-1`,
          profileId,
          areaId: estudiosArea.id,
          title: 'Simulador Oficial Conaset',
          url: 'https://conaset.cl/simulador',
          description: 'Práctica teórica y banco de preguntas de tránsito Clase B',
          createdAt: new Date().toISOString(),
        },
        {
          id: `link-seed-2`,
          profileId,
          areaId: universidadArea.id,
          title: 'Portal de Postulaciones Semestre 2026-II',
          url: 'https://universidad.edu/postulaciones',
          description: 'Envío de portafolio, cartas de recomendación y becas',
          createdAt: new Date().toISOString(),
        },
      ];
      for (const l of initialLinks) {
        this.saveLink(l);
      }
    }

    const currentNotes = this.getNotes(profileId);
    if (currentNotes.length === 0) {
      const initialNote: Note = {
        id: `note-seed-1`,
        profileId,
        areaId: personalArea.id,
        title: 'Espacio de Bitácora y Proceso Terapéutico',
        content: 'Espacio de introspección para el proceso terapéutico con escritura de bitácora y reflexiones extendidas sin límite de espacio.',
        isReflection: true,
        tags: ['terapia', 'introspección', 'personal'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.saveNote(initialNote);
    }
  },
};

