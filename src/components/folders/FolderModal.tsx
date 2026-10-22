import React, { useState, useEffect, useRef } from 'react';
import type { Folder } from '../../types';
import styles from './FolderModal.module.css';

const DEFAULT_COLORS = ['#7b8c9e', '#5a826d', '#8e1ea2', '#e8a55a', '#9c4a3b', '#8e8b82'];

interface FolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; color?: string }) => void;
  initialFolder?: Folder | null;
}

const FolderModalContent: React.FC<FolderModalProps> = ({
  onClose,
  onSave,
  initialFolder,
}) => {
  const [name, setName] = useState(() => initialFolder?.name || '');
  const [color, setColor] = useState(() => initialFolder?.color || DEFAULT_COLORS[0]);

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
              placeholder="Ej: Proyectos, Universidad..."
              required
              autoFocus
            />
          </div>

          <div className={styles.formGroup} role="group" aria-labelledby="folder-color-label">
            <span id="folder-color-label" className={styles.label}>Color identificador</span>
            <div className={styles.colorPickerRow}>
              {DEFAULT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`${styles.colorOption} ${color === c ? styles.colorOptionSelected : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                  aria-label={`Color ${c}`}
                  aria-pressed={color === c}
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

export const FolderModal: React.FC<FolderModalProps> = (props) => {
  if (!props.isOpen) return null;
  return <FolderModalContent {...props} key={props.initialFolder?.id || 'new'} />;
};
