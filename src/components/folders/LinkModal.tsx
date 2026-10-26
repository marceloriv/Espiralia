import React, { useState, useEffect, useRef } from 'react';
import type { LinkItem, Folder } from '../../types';
import styles from './FolderModal.module.css';

interface LinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { title: string; url: string; description?: string; folderId?: string }) => void;
  initialLink?: LinkItem | null;
  defaultFolderId?: string;
  folders?: Folder[];
}

const LinkModalContent: React.FC<LinkModalProps> = ({
  onClose,
  onSave,
  initialLink,
  defaultFolderId,
  folders = [],
}) => {
  const [title, setTitle] = useState(() => initialLink?.title || '');
  const [url, setUrl] = useState(() => initialLink?.url || '');
  const [description, setDescription] = useState(() => initialLink?.description || '');
  const [folderId, setFolderId] = useState<string>(
    () => initialLink?.folderId || defaultFolderId || ''
  );

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
    if (!title.trim() || !url.trim()) return;

    let sanitizedUrl = url.trim();
    if (!/^https?:\/\//i.test(sanitizedUrl)) {
      sanitizedUrl = `https://${sanitizedUrl}`;
    }

    onSave({
      title: title.trim(),
      url: sanitizedUrl,
      description: description.trim() || undefined,
      folderId: folderId || undefined,
    });
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose} role="presentation">
      <div
        className={styles.modalBox}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="link-modal-title"
      >
        <h3 id="link-modal-title" className={styles.modalTitle}>
          {initialLink ? 'Editar Vínculo' : 'Nuevo Vínculo o Documento Web'}
        </h3>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="link-title" className={styles.label}>
              Título del enlace
            </label>
            <input
              id="link-title"
              type="text"
              className={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Portal de la universidad, Recursos de estudio..."
              required
              autoFocus
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="link-url" className={styles.label}>
              Dirección URL
            </label>
            <input
              id="link-url"
              type="text"
              className={styles.input}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://ejemplo.cl"
              required
            />
          </div>

          {folders.length > 0 && (
            <div className={styles.formGroup}>
              <label htmlFor="link-folder" className={styles.label}>
                Carpeta asociada
              </label>
              <select
                id="link-folder"
                className={styles.input}
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
            <label htmlFor="link-desc" className={styles.label}>
              Descripción (opcional)
            </label>
            <input
              id="link-desc"
              type="text"
              className={styles.input}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles sobre el uso o contenido de este link..."
            />
          </div>

          <div className={styles.modalActions}>
            <button type="button" className={styles.btnCancel} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className={styles.btnSave}>
              Guardar Vínculo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const LinkModal: React.FC<LinkModalProps> = (props) => {
  if (!props.isOpen) return null;
  return <LinkModalContent {...props} key={props.initialLink?.id || 'new'} />;
};
