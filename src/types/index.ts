export type Priority = 'alta' | 'media' | 'baja';

export type EventCategory = 'trabajo' | 'personal' | 'urgente' | 'estudio';

export type PlannerPeriod = 'semanal' | 'mensual';

export type TimeSlot = 'mañana' | 'tarde' | 'noche' | 'meta';

export type ViewType = 'dashboard' | 'agenda' | 'planner' | 'todo';

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

export interface PlannerBlock {
  id: string;
  profileId: string;
  period: PlannerPeriod;
  timeSlot: TimeSlot;
  title: string;
  priority: Priority;
  notes?: string;
  completed: boolean;
}

export interface TodoItem {
  id: string;
  profileId: string;
  title: string;
  category: string;
  priority: Priority;
  completed: boolean;
  dueDate?: string;
  createdAt: string;
}
