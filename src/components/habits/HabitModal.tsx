import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Trash2, X } from 'lucide-react';
import type { HabitTrackerItem } from '../../types';
import styles from './HabitModal.module.css';

export interface HabitModalProps {
  isOpen: boolean;
  habit?: HabitTrackerItem | null;
  onClose: () => void;
  onSave: (data: { id?: string; name: string; category?: string }) => void;
  onDelete?: (habitId: string) => void;
}

const CATEGORY_OPTIONS = [
  'General',
  'Estudios',
  'Personal',
  'Universidad',
  'Salud & Bienestar',
  'Lectura & Enfoque',
];

export const HabitModal: React.FC<HabitModalProps> = ({
  isOpen,
  habit,
  onClose,
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('General');
  const nameInputRef = useRef<HTMLInputElement>(null);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (isOpen) {
      setName(habit?.name ?? '');
      setCategory(habit?.category ?? 'General');
      // Foco accesible al abrir
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, habit]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    onSave({
      id: habit?.id,
      name: trimmed,
      category,
    });
  };

  const handleDelete = () => {
    if (habit?.id && onDelete) {
      onDelete(habit.id);
    }
  };

  return (
    <div
      className={styles.backdrop}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className={styles.modalWrap}>
        <div className={styles.washiTape} aria-hidden="true" />
        <div
          className={styles.modal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="habit-modal-title"
        >
          <div className={styles.header}>
            <div className={styles.titleGroup}>
              <span className={styles.iconWrap} aria-hidden="true">
                <CheckCircle2 size={18} />
              </span>
              <h2 id="habit-modal-title" className={styles.title}>
                {habit ? 'Editar Hábito' : 'Nuevo Hábito'}
              </h2>
            </div>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Cerrar ventana de hábitos"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>

          <div className={styles.body}>
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label htmlFor="habit-name-input" className={styles.label}>
                  Nombre del hábito
                </label>
                <input
                  id="habit-name-input"
                  ref={nameInputRef}
                  type="text"
                  className={styles.input}
                  placeholder="Ej. Lectura diaria 20 min"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="habit-category-select" className={styles.label}>
                  Categoría
                </label>
                <select
                  id="habit-category-select"
                  className={styles.select}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.actions}>
                {habit?.id && onDelete ? (
                  <button
                    type="button"
                    className={styles.btnDanger}
                    onClick={handleDelete}
                    aria-label="Eliminar hábito"
                  >
                    <Trash2 size={15} aria-hidden="true" />
                    <span>Eliminar</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className={styles.actionsRight}>
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={onClose}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className={styles.btnPrimary}>
                    <span>Guardar Hábito</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
