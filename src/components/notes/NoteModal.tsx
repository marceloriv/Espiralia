import React, { useState, useEffect, useRef } from 'react';
import type { Note, Folder } from '../../types';
import styles from './NoteModal.module.css';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (noteData: {
    title: string;
    content: string;
    isReflection: boolean;
    folderId?: string;
    tags: string[];
  }) => void;
  initialNote?: Note | null;
  folders?: Folder[];
}

const NoteModalContent: React.FC<NoteModalProps> = ({
  onClose,
  onSave,
  initialNote,
  folders = [],
}) => {
  const [title, setTitle] = useState(() => initialNote?.title || '');
  const [content, setContent] = useState(() => initialNote?.content || '');
  const [isReflection, setIsReflection] = useState(() => Boolean(initialNote?.isReflection));
  const [folderId, setFolderId] = useState<string>(() => initialNote?.folderId || '');
  const [tagsStr, setTagsStr] = useState(() => (initialNote?.tags || []).join(', '));

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

    const tags = tagsStr
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    onSave({
      title: title.trim(),
      content,
      isReflection,
      folderId: folderId || undefined,
      tags,
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
        aria-labelledby="note-modal-title"
      >
        <h3 id="note-modal-title" className={styles.modalTitle}>
          {initialNote ? 'Editar Nota' : 'Nueva Nota o Reflexión'}
        </h3>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="note-title" className={styles.label}>
              Título
            </label>
            <input
              id="note-title"
              type="text"
              className={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Reflexión sobre sesión o apunte de clase..."
              required
              autoFocus
            />
          </div>

          <div className={styles.checkboxGroup}>
            <input
              id="note-is-reflection"
              type="checkbox"
              className={styles.checkbox}
              checked={isReflection}
              onChange={(e) => setIsReflection(e.target.checked)}
            />
            <label htmlFor="note-is-reflection" className={styles.checkboxLabel}>
              Marcar como reflexión de diario (para proceso terapéutico y autorregulación)
            </label>
          </div>

          {folders.length > 0 && (
            <div className={styles.formGroup}>
              <label htmlFor="note-folder" className={styles.label}>
                Carpeta temática (opcional)
              </label>
              <select
                id="note-folder"
                className={styles.select}
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
              >
                <option value="">Sin carpeta</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="note-content" className={styles.label}>
              Contenido
            </label>
            <textarea
              id="note-content"
              className={styles.textarea}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escribe tus pensamientos, notas de estudio o reflexiones aquí sin límite de longitud..."
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="note-tags" className={styles.label}>
              Etiquetas (opcional, separadas por coma)
            </label>
            <input
              id="note-tags"
              type="text"
              className={styles.input}
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              placeholder="ansiedad, respiración, universidad"
            />
          </div>

          <div className={styles.modalActions}>
            <button
              type="button"
              className={styles.btnCancel}
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.btnSave}
            >
              Guardar Nota
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const NoteModal: React.FC<NoteModalProps> = (props) => {
  if (!props.isOpen) return null;
  return <NoteModalContent {...props} key={props.initialNote?.id || 'new'} />;
};
