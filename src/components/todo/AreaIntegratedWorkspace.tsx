import React, { useState, useEffect, useCallback } from 'react';
import { focusOnMount } from '../../utils/useDialogFocus';
import {
  Calendar,
  CheckSquare,
  Plus,
  Trash2,
  ExternalLink,
  BookOpen,
  CalendarPlus,
} from 'lucide-react';
import { sileo } from 'sileo';
import type { Area, TodoItem, AgendaEvent, Note, LinkItem, EventCategory } from '../../types';
import { StorageService } from '../../services/storage';
import { toLocalDateStr } from '../../utils/localDate';
import styles from './AreaIntegratedWorkspace.module.css';

export interface AreaIntegratedWorkspaceProps {
  area: Area;
  profileId: string;
  onNavigateAgenda?: () => void;
  onNavigateNotes?: () => void;
  onNavigateFolders?: () => void;
  onDataChanged?: () => void;
}

export const AreaIntegratedWorkspace: React.FC<AreaIntegratedWorkspaceProps> = ({
  area,
  profileId,
  onDataChanged,
}) => {
  const [todos, setTodos] = useState<TodoItem[]>(() =>
    StorageService.getTodos(profileId).filter(t => t.areaId === area.id)
  );
  const [events, setEvents] = useState<AgendaEvent[]>(() =>
    StorageService.getEvents(profileId).filter(e => {
      const cat = e.category?.toLowerCase();
      const areaName = area.name.toLowerCase();
      return cat === areaName || (areaName.startsWith('estudio') && cat === 'estudio');
    })
  );
  const [notes, setNotes] = useState<Note[]>(() =>
    StorageService.getNotes(profileId).filter(n => n.areaId === area.id)
  );
  const [links, setLinks] = useState<LinkItem[]>(() =>
    StorageService.getLinks(profileId).filter(l => l.areaId === area.id)
  );

  const [inputTitle, setInputTitle] = useState('');
  const [quickEventTitle, setQuickEventTitle] = useState('');
  const [isAddingEvent, setIsAddingEvent] = useState(false);

  const loadData = useCallback(() => {
    setTodos(StorageService.getTodos(profileId).filter(t => t.areaId === area.id));
    setEvents(
      StorageService.getEvents(profileId).filter(e => {
        const cat = e.category?.toLowerCase();
        const areaName = area.name.toLowerCase();
        return cat === areaName || (areaName.startsWith('estudio') && cat === 'estudio');
      })
    );
    setNotes(StorageService.getNotes(profileId).filter(n => n.areaId === area.id));
    setLinks(StorageService.getLinks(profileId).filter(l => l.areaId === area.id));
  }, [profileId, area.id, area.name]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputTitle.trim();
    if (!trimmed) return;

    const newTodo: TodoItem = {
      id: `todo-${Date.now()}`,
      profileId,
      title: trimmed,
      areaId: area.id,
      category: area.name,
      priority: 'media',
      status: 'pendiente',
      completed: false,
      createdAt: new Date().toISOString(),
    };

    StorageService.saveTodo(newTodo);
    setInputTitle('');
    sileo.success({ title: `Tarea agregada a ${area.name}` });
    loadData();
    onDataChanged?.();
  };

  const handleToggleTodo = (id: string) => {
    StorageService.toggleTodo(profileId, id);
    loadData();
    onDataChanged?.();
  };

  const handleDeleteTodo = (id: string) => {
    StorageService.deleteTodo(profileId, id);
    sileo.info({ title: 'Tarea eliminada' });
    loadData();
    onDataChanged?.();
  };

  const handleQuickAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = quickEventTitle.trim();
    if (!trimmed) return;

    let cat: EventCategory = 'estudio';
    if (area.name.toLowerCase() === 'personal') cat = 'personal';
    else if (area.name.toLowerCase() === 'universidad') cat = 'universidad';

    const newEvent: AgendaEvent = {
      id: `ev-${Date.now()}`,
      profileId,
      title: trimmed,
      date: toLocalDateStr(new Date()),
      startTime: '10:00',
      endTime: '11:00',
      category: cat,
    };

    StorageService.saveEvent(newEvent);
    setQuickEventTitle('');
    setIsAddingEvent(false);
    sileo.success({ title: `Evento agendado para ${area.name}` });
    loadData();
  };

  return (
    <div className={styles.workspaceContainer}>
      <header className={styles.workspaceHeader}>
        <div className={styles.headerInfo}>
          <span className={styles.areaDotLarge} style={{ backgroundColor: area.color }} aria-hidden="true" />
          <h2 className={styles.areaTitle}>Espacio de {area.name}</h2>
          <span className={styles.areaBadge}>Vista Integrada</span>
        </div>
      </header>

      <div className={styles.columnsGrid}>
        {/* Columna 1: Tareas */}
        <section className={styles.columnCard} aria-labelledby={`todo-heading-${area.id}`}>
          <div className={styles.columnHeader}>
            <div className={styles.columnTitleRow}>
              <CheckSquare size={18} style={{ color: area.color }} aria-hidden="true" />
              <h3 id={`todo-heading-${area.id}`} className={styles.columnTitle}>
                Tareas de {area.name}
              </h3>
            </div>
            <span className={styles.columnCount}>{todos.filter(t => !t.completed).length} pendientes</span>
          </div>

          <form className={styles.todoInputForm} onSubmit={handleAddTodo}>
            <input
              type="text"
              className={styles.todoInput}
              placeholder={`Nueva tarea para ${area.name}...`}
              value={inputTitle}
              onChange={e => setInputTitle(e.target.value)}
            />
            <button type="submit" className={styles.btnAddTodo} aria-label="Agregar tarea">
              <Plus size={16} aria-hidden="true" />
            </button>
          </form>

          {todos.length === 0 ? (
            <p className={styles.emptyNotice}>No hay tareas asignadas a {area.name}.</p>
          ) : (
            <ul className={styles.todosList} aria-label={`Lista de tareas de ${area.name}`}>
              {todos.map(t => (
                <li key={t.id} className={styles.todoItemRow}>
                  <label className={styles.checkboxHit}>
                    <input
                      type="checkbox"
                      className={styles.todoCheckbox}
                      checked={t.status === 'completada' || t.completed}
                      onChange={() => handleToggleTodo(t.id)}
                      aria-label={`Completar ${t.title}`}
                    />
                  </label>
                  <span className={`${styles.todoTitle} ${t.status === 'completada' || t.completed ? styles.todoTitleDone : ''}`}>
                    {t.title}
                  </span>
                  <button
                    type="button"
                    className={styles.btnDeleteTask}
                    onClick={() => handleDeleteTodo(t.id)}
                    aria-label={`Eliminar ${t.title}`}
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Columna 2: Agenda Contextual */}
        <section className={styles.columnCard} aria-labelledby={`agenda-heading-${area.id}`}>
          <div className={styles.columnHeader}>
            <div className={styles.columnTitleRow}>
              <Calendar size={18} style={{ color: area.color }} aria-hidden="true" />
              <h3 id={`agenda-heading-${area.id}`} className={styles.columnTitle}>
                Agenda de {area.name}
              </h3>
            </div>
            <span className={styles.columnCount}>{events.length} eventos</span>
          </div>

          {isAddingEvent ? (
            <form onSubmit={handleQuickAddEvent} style={{ display: 'flex', gap: 6 }}>
              <input
                type="text"
                className={styles.todoInput}
                placeholder="Título del evento..."
                value={quickEventTitle}
                onChange={e => setQuickEventTitle(e.target.value)}
                ref={focusOnMount}
              />
              <button type="submit" className={styles.btnAddTodo}>Guardar</button>
              <button type="button" className={styles.btnDeleteTask} onClick={() => setIsAddingEvent(false)}>✕</button>
            </form>
          ) : (
            <button
              type="button"
              className={styles.quickAddEventBtn}
              onClick={() => setIsAddingEvent(true)}
            >
              <CalendarPlus size={16} aria-hidden="true" />
              <span>+ Agendar compromiso para {area.name}</span>
            </button>
          )}

          {events.length === 0 ? (
            <p className={styles.emptyNotice}>Sin compromisos programados para {area.name}.</p>
          ) : (
            <ul className={styles.eventsList} aria-label={`Eventos de ${area.name}`}>
              {events.map(ev => (
                <li key={ev.id} className={styles.eventItemRow}>
                  <div className={styles.eventTop}>
                    <span className={styles.eventTimeTag}>{ev.startTime || 'Todo el día'}</span>
                    <span className={styles.eventDateTag}>{ev.date}</span>
                  </div>
                  <h4 className={styles.eventTitle}>{ev.title}</h4>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Columna 3: Notas, Diario y Recursos */}
        <section className={styles.columnCard} aria-labelledby={`resources-heading-${area.id}`}>
          <div className={styles.columnHeader}>
            <div className={styles.columnTitleRow}>
              <BookOpen size={18} style={{ color: area.color }} aria-hidden="true" />
              <h3 id={`resources-heading-${area.id}`} className={styles.columnTitle}>
                Notas &amp; Recursos de {area.name}
              </h3>
            </div>
          </div>

          {/* Subsección: Notas */}
          <div className={styles.resourceSubSection}>
            <h4 className={styles.resourceSubTitle}>Notas &amp; Bitácora</h4>
            {notes.length === 0 ? (
              <p className={styles.emptyNotice}>Sin notas registradas en esta área.</p>
            ) : (
              <ul className={styles.resourceList}>
                {notes.map(n => (
                  <li key={n.id} className={styles.resourceItem}>
                    <span className={styles.resourceTitle}>{n.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Subsección: Vínculos */}
          <div className={styles.resourceSubSection} style={{ marginTop: 12 }}>
            <h4 className={styles.resourceSubTitle}>Carpetas &amp; Enlaces</h4>
            {links.length === 0 ? (
              <p className={styles.emptyNotice}>Sin enlaces vinculados a esta área.</p>
            ) : (
              <ul className={styles.resourceList}>
                {links.map(l => (
                  <li key={l.id} className={styles.resourceItem}>
                    <span className={styles.resourceTitle}>{l.title}</span>
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.resourceLink}
                      aria-label={`Abrir ${l.title}`}
                    >
                      <ExternalLink size={14} aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
