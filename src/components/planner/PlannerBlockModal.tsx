import React, { useState, useEffect, useRef } from 'react';
import type { DayOfWeek, TimeSlot, Priority } from '../../types';
import styles from './PlannerBlockModal.module.css';

interface PlannerBlockModalProps {
  isOpen: boolean;
  initialDay?: DayOfWeek;
  onClose: () => void;
  onSave: (blockData: {
    title: string;
    dayOfWeek?: DayOfWeek;
    timeSlot: TimeSlot;
    priority: Priority;
    time?: string;
    notes?: string;
  }) => void;
}

const PlannerBlockModalContent: React.FC<PlannerBlockModalProps> = ({
  initialDay,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState<string>(
    () => (initialDay !== undefined ? String(initialDay) : 'none')
  );
  const [timeSlot, setTimeSlot] = useState<TimeSlot>('mañana');
  const [priority, setPriority] = useState<Priority>('alta');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      dayOfWeek: dayOfWeek === 'none' ? undefined : (Number(dayOfWeek) as DayOfWeek),
      timeSlot,
      priority,
      time: time.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="modal-block-title">
      <div className={styles.modalBox}>
        <h3 id="modal-block-title" className={styles.modalTitle}>Nuevo Bloque de Enfoque</h3>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="block-title" className={styles.label}>Título del bloque</label>
            <input
              id="block-title"
              type="text"
              className={styles.input}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ej. Foco profundo: Conducción Clase B"
              required
              autoFocus
            />
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label htmlFor="block-day" className={styles.label}>Día de la semana</label>
              <select
                id="block-day"
                className={styles.select}
                value={dayOfWeek}
                onChange={e => setDayOfWeek(e.target.value)}
              >
                <option value="1">Lunes</option>
                <option value="2">Martes</option>
                <option value="3">Miércoles</option>
                <option value="4">Jueves</option>
                <option value="5">Viernes</option>
                <option value="6">Sábado</option>
                <option value="0">Domingo</option>
                <option value="none">Sin día asignado</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="block-slot" className={styles.label}>Franja horaria</label>
              <select
                id="block-slot"
                className={styles.select}
                value={timeSlot}
                onChange={e => setTimeSlot(e.target.value as TimeSlot)}
              >
                <option value="mañana">Mañana</option>
                <option value="tarde">Tarde</option>
                <option value="noche">Noche</option>
                <option value="meta">Meta</option>
              </select>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label htmlFor="block-time" className={styles.label}>Hora (opcional)</label>
              <input
                id="block-time"
                type="time"
                className={styles.input}
                value={time}
                onChange={e => setTime(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="block-priority" className={styles.label}>Prioridad</label>
              <select
                id="block-priority"
                className={styles.select}
                value={priority}
                onChange={e => setPriority(e.target.value as Priority)}
              >
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja</option>
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="block-notes" className={styles.label}>Notas adicionales</label>
            <input
              id="block-notes"
              type="text"
              className={styles.input}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Detalles u observaciones"
            />
          </div>

          <div className={styles.modalActions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className={styles.saveBtn}>
              Guardar Bloque
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const PlannerBlockModal: React.FC<PlannerBlockModalProps> = (props) => {
  if (!props.isOpen) return null;
  return <PlannerBlockModalContent {...props} key={props.initialDay !== undefined ? String(props.initialDay) : 'none'} />;
};
