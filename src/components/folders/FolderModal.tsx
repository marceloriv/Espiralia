import React, { useState, useEffect } from 'react';
import type { Folder } from '../../types';
import styles from './FolderModal.module.css';

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#6b7280'];

interface FolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; color?: string }) => void;
  initialFolder?: Folder | null;
}

export const FolderModal: React.FC<FolderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialFolder,
}) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState(DEFAULT_COLORS[0]);

  useEffect(() => {
    if (isOpen) {
      if (initialFolder) {
        setName(initialFolder.name);
        setColor(initialFolder.color || DEFAULT_COLORS[0]);
      } else {
        setName('');
        setColor(DEFAULT_COLORS[0]);
      }
    }
  }, [isOpen, initialFolder]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      color,
    });
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modalBox}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="folder-modal-title"
      >
        <h3 id="folder-modal-title" className={styles.modalTitle}>
          {initialFolder ? 'Editar Carpeta' : 'Nueva Carpeta'}
        </h3>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="folder-name" className={styles.label}>
              Nombre de la carpeta
            </label>
            <input
              id="folder-name"
              type="text"
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Conducción Clase B, Universidad..."
              required
              autoFocus
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Color identificador</label>
            <div className={styles.colorPickerRow}>
              {DEFAULT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`${styles.colorOption} ${color === c ? styles.colorOptionSelected : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>

          <div className={styles.modalActions}>
            <button type="button" className={styles.btnCancel} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className={styles.btnSave}>
              Guardar Carpeta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
