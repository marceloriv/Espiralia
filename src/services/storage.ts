import type { Profile, AgendaEvent, PlannerBlock, TodoItem, Area, TaskStatus, Priority, Goal, Note, Folder, LinkItem, HabitTrackerItem, MoodEntry } from '../types';

const PROFILES_KEY = 'espiralia_profiles';
const ACTIVE_PROFILE_KEY = 'espiralia_active_profile_id';

const getScopedKey = (profileId: string, domain: string) => `espiralia_${profileId}_${domain}`;

export const STORAGE_ERROR_EVENT = 'espiralia:storage-error';

/** Cuota típica de localStorage por origen en navegadores de escritorio y móvil. */
export const LOCALSTORAGE_QUOTA_BYTES = 5 * 1024 * 1024;

/** Escribe en localStorage sin lanzar: ante QuotaExceededError avisa con STORAGE_ERROR_EVENT y devuelve false. */
function writeItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    window.dispatchEvent(new CustomEvent(STORAGE_ERROR_EVENT, { detail: { key } }));
    return false;
  }
}

// ponytail: persistencia directa y sincrónica en localStorage. Si un perfil excede 5MB (QuotaExceeded), migrar a IndexedDB asíncrono.
function getScopedList<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveScopedItem<T extends { id: string }>(key: string, item: T): void {
  const list = getScopedList<T>(key);
  const existingIndex = list.findIndex(i => i.id === item.id);
  if (existingIndex >= 0) {
    list[existingIndex] = item;
  } else {
    list.push(item);
  }
  writeItem(key, JSON.stringify(list));
}

function deleteScopedItem<T extends { id: string }>(key: string, id: string): void {
  const list = getScopedList<T>(key).filter(i => i.id !== id);
  writeItem(key, JSON.stringify(list));
}

function getScopedData<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

const DEFAULT_AREAS = [
  { name: 'Estudios', color: '#7b8c9e' },
  { name: 'Personal', color: '#5a826d' },
  { name: 'Universidad', color: '#8b5cf6' },
  { name: 'General', color: '#6b7280' },
];

export const StorageService = {
  // Profiles
  getProfiles(): Profile[] {
    return getScopedList<Profile>(PROFILES_KEY);
  },

  saveProfile(profile: Profile): void {
    saveScopedItem(PROFILES_KEY, profile);
  },

  deleteProfile(id: string): void {
    deleteScopedItem<Profile>(PROFILES_KEY, id);

    // Cascade delete profile data
    const domains = ['events', 'planner', 'goals', 'todos', 'areas', 'notes', 'folders', 'links', 'habits', 'moods', 'distractions', 'daily_energy'];
    for (const d of domains) {
      localStorage.removeItem(getScopedKey(id, d));
    }
    // Los PDF de Carpetas viven en IndexedDB; import() para no cargar fileStore en el arranque.
    void import('./fileStore').then(m => m.deleteProfileFiles(id)).catch(() => {});

    if (this.getActiveProfileId() === id) {
      this.clearActiveProfileId();
    }
  },

  /** Bytes que ocupa un perfil en localStorage (UTF-16: 2 bytes por carácter de clave y valor). */
  getProfileStorageBytes(profileId: string): number {
    const prefix = `espiralia_${profileId}_`;
    let chars = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix)) chars += key.length + (localStorage.getItem(key)?.length ?? 0);
    }
    return chars * 2;
  },

  getActiveProfileId(): string | null {
    return localStorage.getItem(ACTIVE_PROFILE_KEY);
  },

  setActiveProfileId(id: string): void {
    writeItem(ACTIVE_PROFILE_KEY, id);
  },

  clearActiveProfileId(): void {
    localStorage.removeItem(ACTIVE_PROFILE_KEY);
  },

  // Agenda Events
  getEvents(profileId: string): AgendaEvent[] {
    return getScopedList<AgendaEvent>(getScopedKey(profileId, 'events'));
  },

  saveEvent(event: AgendaEvent): void {
    saveScopedItem(getScopedKey(event.profileId, 'events'), event);
  },

  deleteEvent(profileId: string, eventId: string): void {
    deleteScopedItem<AgendaEvent>(getScopedKey(profileId, 'events'), eventId);
  },

  // Planner
  getPlanner(profileId: string): PlannerBlock[] {
    return getScopedList<PlannerBlock>(getScopedKey(profileId, 'planner'));
  },

  savePlanner(block: PlannerBlock): void {
    saveScopedItem(getScopedKey(block.profileId, 'planner'), block);
  },

  deletePlanner(profileId: string, blockId: string): void {
    deleteScopedItem<PlannerBlock>(getScopedKey(profileId, 'planner'), blockId);
  },
  /** Borra los bloques semanales del perfil y devuelve cuántos borró; los de otros periodos se conservan. */
  clearWeeklyPlanner(profileId: string): number {
    const key = getScopedKey(profileId, 'planner');
    const list = getScopedList<PlannerBlock>(key);
    const kept = list.filter(b => b.period !== 'semanal');
    writeItem(key, JSON.stringify(kept));
    return list.length - kept.length;
  },

  // Goals
  getGoals(profileId: string): Goal[] {
    return getScopedList<Goal>(getScopedKey(profileId, 'goals'));
  },

  saveGoal(goal: Goal): void {
    saveScopedItem(getScopedKey(goal.profileId, 'goals'), goal);
  },

  deleteGoal(profileId: string, goalId: string): void {
    deleteScopedItem<Goal>(getScopedKey(profileId, 'goals'), goalId);
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
      writeItem(getScopedKey(profileId, 'areas'), JSON.stringify(seeded));
      return seeded;
    } catch {
      return [];
    }
  },

  saveArea(area: Area): void {
    saveScopedItem(getScopedKey(area.profileId, 'areas'), area);
  },

  deleteArea(profileId: string, areaId: string): void {
    const list = this.getAreas(profileId).filter(a => a.id !== areaId);
    writeItem(getScopedKey(profileId, 'areas'), JSON.stringify(list));

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
        writeItem(getScopedKey(profileId, 'todos'), JSON.stringify(todos));
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
    writeItem(getScopedKey(todo.profileId, 'todos'), JSON.stringify(list));
  },

  deleteTodo(profileId: string, todoId: string): void {
    deleteScopedItem<TodoItem>(getScopedKey(profileId, 'todos'), todoId);
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
      writeItem(getScopedKey(profileId, 'todos'), JSON.stringify(list));
    }
  },

  setTodoStatus(profileId: string, todoId: string, status: TaskStatus): void {
    const list = this.getTodos(profileId);
    const todo = list.find(t => t.id === todoId);
    if (todo) {
      todo.status = status;
      todo.completed = status === 'completada';
      writeItem(getScopedKey(profileId, 'todos'), JSON.stringify(list));
    }
  },

  // Notes
  getNotes(profileId: string): Note[] {
    return getScopedList<Note>(getScopedKey(profileId, 'notes'));
  },

  saveNote(note: Note): void {
    saveScopedItem(getScopedKey(note.profileId, 'notes'), note);
  },

  deleteNote(profileId: string, noteId: string): void {
    deleteScopedItem<Note>(getScopedKey(profileId, 'notes'), noteId);
  },

  // Folders
  getFolders(profileId: string): Folder[] {
    return getScopedList<Folder>(getScopedKey(profileId, 'folders'));
  },

  saveFolder(folder: Folder): void {
    saveScopedItem(getScopedKey(folder.profileId, 'folders'), folder);
  },

  deleteFolder(profileId: string, folderId: string): void {
    deleteScopedItem<Folder>(getScopedKey(profileId, 'folders'), folderId);
  },

  // Links
  getLinks(profileId: string): LinkItem[] {
    return getScopedList<LinkItem>(getScopedKey(profileId, 'links'));
  },

  saveLink(link: LinkItem): void {
    saveScopedItem(getScopedKey(link.profileId, 'links'), link);
  },

  deleteLink(profileId: string, linkId: string): void {
    deleteScopedItem<LinkItem>(getScopedKey(profileId, 'links'), linkId);
  },

  // Habits
  getHabits(profileId: string): HabitTrackerItem[] {
    return getScopedList<HabitTrackerItem>(getScopedKey(profileId, 'habits'));
  },

  saveHabit(habit: HabitTrackerItem): void {
    saveScopedItem(getScopedKey(habit.profileId, 'habits'), habit);
  },

  deleteHabit(profileId: string, habitId: string): void {
    deleteScopedItem<HabitTrackerItem>(getScopedKey(profileId, 'habits'), habitId);
  },

  toggleHabitDay(profileId: string, habitId: string, dayIndex: number): void {
    const habits = this.getHabits(profileId);
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const days = [...(habit.daysCompleted ?? [false, false, false, false, false, false, false])];
    while (days.length < 7) {
      days.push(false);
    }
    days[dayIndex] = !days[dayIndex];
    this.saveHabit({ ...habit, daysCompleted: days });
  },

  // Distractions
  getDistractions(profileId: string): string[] {
    return getScopedData<string[]>(getScopedKey(profileId, 'distractions'), []);
  },

  saveDistractions(profileId: string, items: string[]): void {
    writeItem(getScopedKey(profileId, 'distractions'), JSON.stringify(items));
  },

  // Moods
  getMoods(profileId: string): MoodEntry[] {
    return getScopedList<MoodEntry>(getScopedKey(profileId, 'moods'));
  },

  saveMood(mood: MoodEntry): void {
    saveScopedItem(getScopedKey(mood.profileId, 'moods'), mood);
  },

  getTodayMood(profileId: string, dateStr: string): string | undefined {
    const data = getScopedData<Record<string, string>>(getScopedKey(profileId, 'daily_energy'), {});
    return data[dateStr];
  },

  setTodayMood(profileId: string, dateStr: string, energy: string): void {
    const key = getScopedKey(profileId, 'daily_energy');
    const data = getScopedData<Record<string, string>>(key, {});
    data[dateStr] = energy;
    writeItem(key, JSON.stringify(data));
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

    const currentHabits = this.getHabits(profileId);
    if (currentHabits.length === 0) {
      const initialHabits: HabitTrackerItem[] = [
        {
          id: `habit-seed-1`,
          profileId,
          name: 'Lectura diaria (20 min)',
          category: estudiosArea.name,
          daysCompleted: [true, true, false, true, false, false, false],
        },
        {
          id: `habit-seed-2`,
          profileId,
          name: 'Práctica de enfoque / Pomodoro',
          category: estudiosArea.name,
          daysCompleted: [true, false, true, true, false, false, false],
        },
        {
          id: `habit-seed-3`,
          profileId,
          name: 'Caminata y desconexión',
          category: personalArea.name,
          daysCompleted: [false, true, true, true, false, false, false],
        },
      ];
      for (const h of initialHabits) {
        this.saveHabit(h);
      }
    }

    const currentDistractions = this.getDistractions(profileId);
    if (currentDistractions.length === 0) {
      const initialDistractions = [
        'Teléfono en otra habitación durante bloques de enfoque',
        'Cerrar pestañas secundarias y redes sociales',
        'Silenciar notificaciones innecesarias',
      ];
      this.saveDistractions(profileId, initialDistractions);
    }
  },
};
