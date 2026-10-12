import React, { useState, useEffect, useRef } from 'react';
import { CalendarPlus, CheckSquare, ListPlus, X, Zap } from 'lucide-react';
import { sileo } from 'sileo';
import type { Area, EventCategory, Priority, TaskStatus } from '../../types';
import { StorageService } from '../../services/storage';
import { toLocalDateStr } from '../../utils/localDate';
import styles from './QuickActionModal.module.css';

export interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileId: string;
  onItemCreated?: (type: 'todo' | 'event') => void;
}

type TabType = 'todo' | 'event';

export const QuickActionModal: React.FC<QuickActionModalProps> = ({
  isOpen,
  onClose,
  profileId,
  onItemCreated,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('todo');
  const [areas, setAreas] = useState<Area[]>([]);

  // Task form state
  const [todoTitle, setTodoTitle] = useState('');
  const [todoAreaId, setTodoAreaId] = useState('');
  const [todoPriority, setTodoPriority] = useState<Priority>('media');
  const [todoDueDate, setTodoDueDate] = useState('');

  // Event form state
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState(() => toLocalDateStr(new Date()));
  const [eventStartTime, setEventStartTime] = useState('');
  const [eventEndTime, setEventEndTime] = useState('');
  const [eventCategory, setEventCategory] = useState<EventCategory>('personal');

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const loadedAreas = StorageService.getAreas(profileId);
      setAreas(loadedAreas);
      if (loadedAreas.length > 0 && !todoAreaId) {
        setTodoAreaId(loadedAreas[0].id);
      }
      setEventDate(toLocalDateStr(new Date()));
    }
  }, [isOpen, profileId, todoAreaId]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCreateTodo = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = todoTitle.trim();
    if (!trimmed) return;

    const area = areas.find(a => a.id === todoAreaId) || areas[0];
    const newTodo = {
      id: `todo-${Date.now()}`,
      profileId,
      title: trimmed,
      areaId: area ? area.id : 'area-default',
      category: area ? area.name : 'General',
      priority: todoPriority,
      status: 'pendiente' as TaskStatus,
      completed: false,
      dueDate: todoDueDate || undefined,
      createdAt: new Date().toISOString(),
    };

    StorageService.saveTodo(newTodo);
    sileo.success({ title: 'Tarea creada con éxito' });
    setTodoTitle('');
    setTodoDueDate('');
    onItemCreated?.('todo');
    onClose();
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = eventTitle.trim();
    if (!trimmed) return;

    const newEvent = {
      id: `event-${Date.now()}`,
      profileId,
      title: trimmed,
      date: eventDate,
      startTime: eventStartTime || undefined,
      endTime: eventEndTime || undefined,
      category: eventCategory,
    };

    StorageService.saveEvent(newEvent);
    sileo.success({ title: 'Evento creado con éxito' });
    setEventTitle('');
    setEventStartTime('');
    setEventEndTime('');
    onItemCreated?.('event');
    onClose();
  };

  return (
    <div className={styles.backdrop} onClick={e => e.target === e.currentTarget && onClose()}>
      <div
        ref={modalRef}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-action-modal-title"
      >
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <span className={styles.iconWrap} aria-hidden="true">
              <Zap size={18} />
            </span>
            <h2 id="quick-action-modal-title" className={styles.title}>
              Acción Rápida
            </h2>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Cerrar ventana de acción rápida"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className={styles.tabList} role="tablist" aria-label="Tipo de elemento rápido">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'todo'}
            className={`${styles.tab} ${activeTab === 'todo' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('todo')}
          >
            <CheckSquare size={16} aria-hidden="true" />
            <span>Nueva Tarea</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'event'}
            className={`${styles.tab} ${activeTab === 'event' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('event')}
          >
            <CalendarPlus size={16} aria-hidden="true" />
            <span>Nuevo Evento</span>
          </button>
        </div>

        <div className={styles.body}>
          {activeTab === 'todo' ? (
            <form onSubmit={handleCreateTodo} className={styles.form}>
              <div className={styles.field}>
                <label htmlFor="qa-todo-title" className={styles.label}>
                  Título de la tarea
                </label>
                <input
                  id="qa-todo-title"
                  name="qaTodoTitle"
                  type="text"
                  className={styles.input}
                  placeholder="¿Qué necesitas registrar?"
                  value={todoTitle}
                  onChange={e => setTodoTitle(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label htmlFor="qa-todo-area" className={styles.label}>
                    Área Temática
                  </label>
                  <select
                    id="qa-todo-area"
                    name="qaTodoArea"
                    className={styles.select}
                    value={todoAreaId}
                    onChange={e => setTodoAreaId(e.target.value)}
                  >
                    {areas.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.field}>
                  <label htmlFor="qa-todo-priority" className={styles.label}>
                    Prioridad
                  </label>
                  <select
                    id="qa-todo-priority"
                    name="qaTodoPriority"
                    className={styles.select}
                    value={todoPriority}
                    onChange={e => setTodoPriority(e.target.value as Priority)}
                  >
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="qa-todo-due" className={styles.label}>
                  Fecha de vencimiento (opcional)
                </label>
                <input
                  id="qa-todo-due"
                  name="qaTodoDueDate"
                  type="date"
                  className={styles.input}
                  value={todoDueDate}
                  onChange={e => setTodoDueDate(e.target.value)}
                />
              </div>

              <div className={styles.actions}>
                <button type="button" className={styles.cancelBtn} onClick={onClose}>
                  Cancelar
                </button>
                <button type="submit" className={styles.submitBtn}>
                  <ListPlus size={16} aria-hidden="true" />
                  <span>Crear Tarea</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleCreateEvent} className={styles.form}>
              <div className={styles.field}>
                <label htmlFor="qa-event-title" className={styles.label}>
                  Título del evento
                </label>
                <input
                  id="qa-event-title"
                  name="qaEventTitle"
                  type="text"
                  className={styles.input}
                  placeholder="Título del evento"
                  value={eventTitle}
                  onChange={e => setEventTitle(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label htmlFor="qa-event-date" className={styles.label}>
                    Fecha
                  </label>
                  <input
                    id="qa-event-date"
                    name="qaEventDate"
                    type="date"
                    className={styles.input}
                    value={eventDate}
                    onChange={e => setEventDate(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="qa-event-category" className={styles.label}>
                    Categoría
                  </label>
                  <select
                    id="qa-event-category"
                    name="qaEventCategory"
                    className={styles.select}
                    value={eventCategory}
                    onChange={e => setEventCategory(e.target.value as EventCategory)}
                  >
                    <option value="trabajo">Trabajo</option>
                    <option value="personal">Personal</option>
                    <option value="estudio">Estudio</option>
                    <option value="salud">Salud</option>
                    <option value="general">General</option>
                  </select>
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label htmlFor="qa-event-start" className={styles.label}>
                    Hora inicio (opcional)
                  </label>
                  <input
                    id="qa-event-start"
                    name="qaEventStartTime"
                    type="time"
                    className={styles.input}
                    value={eventStartTime}
                    onChange={e => setEventStartTime(e.target.value)}
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="qa-event-end" className={styles.label}>
                    Hora fin (opcional)
                  </label>
                  <input
                    id="qa-event-end"
                    name="qaEventEndTime"
                    type="time"
                    className={styles.input}
                    value={eventEndTime}
                    onChange={e => setEventEndTime(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.actions}>
                <button type="button" className={styles.cancelBtn} onClick={onClose}>
                  Cancelar
                </button>
                <button type="submit" className={styles.submitBtn}>
                  <CalendarPlus size={16} aria-hidden="true" />
                  <span>Crear Evento</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
