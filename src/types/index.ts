export type Priority = 'alta' | 'media' | 'baja';

export type EventCategory = 'trabajo' | 'personal' | 'urgente' | 'estudio';

export type PlannerPeriod = 'semanal' | 'mensual';

export type TimeSlot = 'mañana' | 'tarde' | 'noche' | 'meta';

export type ViewType = 'dashboard' | 'agenda' | 'planner' | 'todo';

export interface Profile {
  id: string;
  name: string;
  avatar: string;
  pin?: string;
  createdAt: string;
}

export interface AgendaEvent {
  id: string;
  profileId: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  category?: EventCategory;
  notes?: string;
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
