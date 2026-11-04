import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { Area, Priority, TodoItem } from '../../types';
import { useEscapeKey } from '../../utils/useEscapeKey';
import styles from '../TodoView.module.css';

interface TodoEditModalProps {
  todo: TodoItem;
  areas: Area[];
  onClose: () => void;
  onSave: (todo: TodoItem) => void;
}

/** Edita título, área, prioridad y vencimiento de una tarea. Usa el mismo diálogo que la gestión de áreas de To-Do. */
export const TodoEditModal: React.FC<TodoEditModalProps> = ({ todo, areas, onClose, onSave }) => {
  const [title, setTitle] = useState(todo.title);
  const [areaId, setAreaId] = useState(todo.areaId);
  const [priority, setPriority] = useState<Priority>(todo.priority);
  const [dueDate, setDueDate] = useState(todo.dueDate ?? '');
  useEscapeKey(onClose, true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onSave({ ...todo, title: trimmed, areaId, priority, dueDate: dueDate || undefined });
  };

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="Editar tarea">
      <div className={styles.modalCard}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Editar tarea</h3>
          <button type="button" className={styles.modalCloseBtn} aria-label="Cerrar modal" onClick={onClose}>
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <label className={styles.formLabel} htmlFor="todo-edit-title">
            Título
          </label>
          <input
            id="todo-edit-title"
            type="text"
            className={styles.formInput}
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            autoFocus
          />

          <label className={styles.formLabel} htmlFor="todo-edit-area">
            Área
          </label>
          <select id="todo-edit-area" className={styles.formInput} value={areaId} onChange={e => setAreaId(e.target.value)}>
            {areas.map(a => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>

          <label className={styles.formLabel} htmlFor="todo-edit-priority">
            Prioridad
          </label>
          <select
            id="todo-edit-priority"
            className={styles.formInput}
            value={priority}
            onChange={e => setPriority(e.target.value as Priority)}
          >
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>

          <label className={styles.formLabel} htmlFor="todo-edit-due">
            Fecha de vencimiento
          </label>
          <input
            id="todo-edit-due"
            type="date"
            className={styles.formInput}
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
          />

          <div className={styles.modalActions}>
            <button type="button" className={styles.btnSecondary} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className={styles.btnPrimary}>
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
