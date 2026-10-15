import type { ViewType } from '../types';
import { StorageService } from './storage';

export type SearchResultType = 'todo' | 'event' | 'note' | 'goal' | 'planner' | 'link';

export interface SearchResultItem {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  badge?: string;
  dateInfo?: string;
  targetView: ViewType;
  score: number;
}

export interface GroupedSearchResults {
  todos: SearchResultItem[];
  events: SearchResultItem[];
  notes: SearchResultItem[];
  goals: SearchResultItem[];
  planner: SearchResultItem[];
  links: SearchResultItem[];
  totalCount: number;
}

export function normalizeSearchText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function calculateScore(
  tokens: string[],
  normalizedQuery: string,
  title: string,
  meta: string,
  content: string
): number | null {
  const normTitle = normalizeSearchText(title);
  const normMeta = normalizeSearchText(meta);
  const normContent = normalizeSearchText(content);
  const fullText = `${normTitle} ${normMeta} ${normContent}`;

  // Todos los tokens deben coincidir en el texto completo
  const allMatch = tokens.every(token => fullText.includes(token));
  if (!allMatch) return null;

  let score = 0;
  if (normTitle === normalizedQuery) {
    score += 20;
  } else if (normTitle.startsWith(normalizedQuery)) {
    score += 15;
  } else if (tokens.every(token => normTitle.includes(token))) {
    score += 10;
  } else if (tokens.some(token => normTitle.includes(token))) {
    score += 5;
  }

  if (tokens.some(token => normMeta.includes(token))) {
    score += 3;
  }

  if (tokens.some(token => normContent.includes(token))) {
    score += 1;
  }

  return score;
}

export const SearchService = {
  search(profileId: string, rawQuery: string): GroupedSearchResults {
    const emptyResult: GroupedSearchResults = {
      todos: [],
      events: [],
      notes: [],
      goals: [],
      planner: [],
      links: [],
      totalCount: 0,
    };

    const trimmed = rawQuery.trim();
    if (trimmed.length < 2) {
      return emptyResult;
    }

    const normalizedQuery = normalizeSearchText(trimmed);
    const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) {
      return emptyResult;
    }

    // Datos del perfil activo
    const todos = StorageService.getTodos(profileId);
    const events = StorageService.getEvents(profileId);
    const notes = StorageService.getNotes(profileId);
    const goals = StorageService.getGoals(profileId);
    const planner = StorageService.getPlanner(profileId);
    const links = StorageService.getLinks(profileId);
    const areas = StorageService.getAreas(profileId);
    const folders = StorageService.getFolders(profileId);

    const areaMap = new Map(areas.map(a => [a.id, a.name]));
    const folderMap = new Map(folders.map(f => [f.id, f.name]));

    // 1. Tareas
    const matchingTodos: SearchResultItem[] = [];
    for (const todo of todos) {
      const areaName = areaMap.get(todo.areaId) || todo.category || 'General';
      const meta = `${areaName} ${todo.priority} ${todo.status}`;
      const content = todo.notes || '';
      const score = calculateScore(tokens, normalizedQuery, todo.title, meta, content);
      if (score !== null) {
        matchingTodos.push({
          id: todo.id,
          type: 'todo',
          title: todo.title,
          subtitle: todo.notes || `Prioridad: ${todo.priority} · Estado: ${todo.status}`,
          badge: areaName,
          dateInfo: todo.dueDate,
          targetView: 'todo',
          score,
        });
      }
    }

    // 2. Eventos
    const matchingEvents: SearchResultItem[] = [];
    for (const ev of events) {
      const category = ev.category || 'general';
      const meta = `${category} ${ev.startTime || ''} ${ev.endTime || ''}`;
      const content = ev.notes || '';
      const score = calculateScore(tokens, normalizedQuery, ev.title, meta, content);
      if (score !== null) {
        matchingEvents.push({
          id: ev.id,
          type: 'event',
          title: ev.title,
          subtitle: ev.notes || (ev.startTime ? `${ev.startTime} - ${ev.endTime || ''}` : undefined),
          badge: category,
          dateInfo: ev.date,
          targetView: 'agenda',
          score,
        });
      }
    }

    // 3. Notas
    const matchingNotes: SearchResultItem[] = [];
    for (const note of notes) {
      const folderName = note.folderId ? folderMap.get(note.folderId) : undefined;
      const meta = `${folderName || ''} ${(note.tags || []).join(' ')}`;
      const score = calculateScore(tokens, normalizedQuery, note.title, meta, note.content);
      if (score !== null) {
        matchingNotes.push({
          id: note.id,
          type: 'note',
          title: note.title,
          subtitle: note.content.slice(0, 100),
          badge: folderName || 'Reflexión',
          dateInfo: note.updatedAt || note.createdAt,
          targetView: 'notes',
          score,
        });
      }
    }

    // 4. Metas
    const matchingGoals: SearchResultItem[] = [];
    for (const goal of goals) {
      const subItemTitles = goal.items.map(i => i.title).join(' ');
      const meta = `${goal.period} ${subItemTitles}`;
      const content = goal.description || '';
      const score = calculateScore(tokens, normalizedQuery, goal.title, meta, content);
      if (score !== null) {
        const completedCount = goal.items.filter(i => i.completed).length;
        matchingGoals.push({
          id: goal.id,
          type: 'goal',
          title: goal.title,
          subtitle: goal.description || `${completedCount}/${goal.items.length} sub-tareas completadas`,
          badge: `Meta ${goal.period}`,
          dateInfo: goal.deadline,
          targetView: 'planner',
          score,
        });
      }
    }

    // 5. Planner
    const matchingPlanner: SearchResultItem[] = [];
    for (const block of planner) {
      const meta = `${block.timeSlot} ${block.priority || ''} ${block.period}`;
      const content = block.time || '';
      const score = calculateScore(tokens, normalizedQuery, block.title, meta, content);
      if (score !== null) {
        matchingPlanner.push({
          id: block.id,
          type: 'planner',
          title: block.title,
          subtitle: `Franja: ${block.timeSlot}${block.time ? ` (${block.time})` : ''}`,
          badge: block.priority ? `Prioridad ${block.priority}` : 'Bloque',
          targetView: 'planner',
          score,
        });
      }
    }

    // 6. Vínculos
    const matchingLinks: SearchResultItem[] = [];
    for (const link of links) {
      const folderName = link.folderId ? folderMap.get(link.folderId) : undefined;
      const meta = `${folderName || ''} ${link.url}`;
      const content = link.description || '';
      const score = calculateScore(tokens, normalizedQuery, link.title, meta, content);
      if (score !== null) {
        matchingLinks.push({
          id: link.id,
          type: 'link',
          title: link.title,
          subtitle: link.description || link.url,
          badge: folderName || 'Vínculo',
          targetView: 'folders',
          score,
        });
      }
    }

    // Ordenar cada grupo por score descendente
    const sortByScore = (a: SearchResultItem, b: SearchResultItem) => b.score - a.score;
    matchingTodos.sort(sortByScore);
    matchingEvents.sort(sortByScore);
    matchingNotes.sort(sortByScore);
    matchingGoals.sort(sortByScore);
    matchingPlanner.sort(sortByScore);
    matchingLinks.sort(sortByScore);

    const totalCount =
      matchingTodos.length +
      matchingEvents.length +
      matchingNotes.length +
      matchingGoals.length +
      matchingPlanner.length +
      matchingLinks.length;

    return {
      todos: matchingTodos,
      events: matchingEvents,
      notes: matchingNotes,
      goals: matchingGoals,
      planner: matchingPlanner,
      links: matchingLinks,
      totalCount,
    };
  },
};
