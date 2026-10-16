export type Priority = 'alta' | 'media' | 'baja';

export type EventCategory = 'trabajo' | 'personal' | 'urgente' | 'estudio';

export type PlannerPeriod = 'semanal' | 'mensual';

export type TimeSlot = 'mañana' | 'tarde' | 'noche' | 'meta';

export type ViewType = 'dashboard' | 'agenda' | 'planner' | 'todo' | 'notes' | 'folders';

export interface Profile {
  id: string;
  name: string;
  avatar: string;
  /** Legado: PIN en texto plano. Se migra a pinHash/pinSalt al abrir la pantalla de perfiles. */
  pin?: string;
  pinHash?: string; // PBKDF2-SHA-256, hex de 32 bytes
  pinSalt?: string; // hex de 16 bytes
  createdAt: string;
}

export interface EventRecurrence {
  daysOfWeek: number[]; // 0 = domingo … 6 = sábado
  until?: string; // YYYY-MM-DD inclusive
}

export interface AgendaEvent {
  id: string;
  profileId: string;
  title: string;
  date: string; // YYYY-MM-DD hora local; en recurrentes = inicio de la serie
  startTime?: string; // HH:mm; ausente = todo el día
  endTime?: string; // HH:mm; ausente con startTime = 1 h
  category?: EventCategory;
  notes?: string;
  recurrence?: EventRecurrence;
}

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado

export interface PlannerBlock {
  id: string;
  profileId: string;
  period: PlannerPeriod;
  timeSlot: TimeSlot;
  title: string;
  priority: Priority;
  notes?: string;
  completed: boolean;
  dayOfWeek?: DayOfWeek;
  time?: string;
}

export interface GoalSubItem {
  id: string;
  title: string;
  completed: boolean;
}

export interface Goal {
  id: string;
  profileId: string;
  title: string;
  description?: string;
  category?: string;
  period: PlannerPeriod;
  items: GoalSubItem[];
  createdAt: string;
}

export type TaskStatus = 'pendiente' | 'en_progreso' | 'completada';

export interface Area {
  id: string;
  profileId: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface TodoItem {
  id: string;
  profileId: string;
  title: string;
  areaId: string;
  category?: string;
  priority: Priority;
  status: TaskStatus;
  completed?: boolean;
  dueDate?: string; // YYYY-MM-DD hora local
  createdAt: string;
}

export interface Folder {
  id: string;
  profileId: string;
  name: string;
  color?: string;
  createdAt: string;
}

export interface Note {
  id: string;
  profileId: string;
  folderId?: string;
  areaId?: string;
  title: string;
  content: string;
  isReflection?: boolean;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LinkItem {
  id: string;
  profileId: string;
  folderId?: string;
  title: string;
  url: string;
  description?: string;
  createdAt: string;
}
