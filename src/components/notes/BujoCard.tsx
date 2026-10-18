import React, { useMemo } from 'react';
import { Pencil, Trash2, Folder as FolderIcon } from 'lucide-react';
import type { Note, Folder } from '../../types';
import { parseBujoContent, countWords, getCategoryRibbonColor } from '../../utils/bujoFormatter';
import styles from './BujoCard.module.css';

export interface BujoCardProps {
  note: Note;
  folder?: Folder;
  isActive?: boolean;
  onSelect: (note: Note) => void;
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => void;
}

export const BujoCard: React.FC<BujoCardProps> = ({
  note,
  folder,
  isActive = false,
  onSelect,
  onEdit,
  onDelete,
}) => {
  const ribbonColor = getCategoryRibbonColor(note.isReflection, note.tags);
  const wordCount = countWords(note.content);

  const formattedDate = useMemo(() => {
    const rawDate = note.updatedAt || note.createdAt;
    if (!rawDate) return '';
    try {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('es-CL');
      }
    } catch {
      // Fallback a cadena vacía si la fecha es inválida
    }
    return '';
  }, [note.updatedAt, note.createdAt]);

  const blocks = useMemo(() => parseBujoContent(note.content, note.title), [note.content, note.title]);

  const previewText = useMemo(() => {
    const textBlocks = blocks.filter((b) => b.type === 'paragraph' || b.type === 'callout');
    if (textBlocks.length === 0) {
      return note.content;
    }
    return textBlocks
      .map((b) => {
        if (b.type === 'paragraph') return b.text;
        const prefix = b.icon ? `${b.icon} ` : '';
        const titlePart = b.title ? `${b.title}: ` : '';
        return `${prefix}${titlePart}${b.text}`;
      })
      .join('\n\n');
  }, [blocks, note.content]);

  const handleCardClick = () => {
    onSelect(note);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onSelect(note);
    }
  };

  return (
    <article
      className={`${styles.card} ${isActive ? styles.cardActive : ''}`}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-selected={isActive}
    >
      {isActive && (
        <div className={styles.activeCornerClip} aria-hidden="true">
          <div className={styles.activeClipLoop} />
        </div>
      )}
      <div
        className={styles.ribbon}
        style={{ backgroundColor: ribbonColor }}
        data-testid="bujo-ribbon"
        aria-hidden="true"
      />

      <div className={styles.cardHeader}>
        <div className={styles.cardTopRow}>
          <h3 className={styles.cardTitle}>
            <span className={styles.sectionSymbol}>§</span>
            <span className={styles.titleText}>{note.title}</span>
          </h3>
          {note.isReflection && (
            <span className={`${styles.badge} ${styles.reflectionBadge}`}>
              Reflexión
            </span>
          )}
        </div>

        {folder && (
          <span className={styles.folderBadge}>
            <FolderIcon size={12} aria-hidden="true" />
            {folder.name}
          </span>
        )}
      </div>

      <div className={styles.cardContent}>
        <p className={styles.previewParagraph}>{previewText}</p>
      </div>

      {note.tags && note.tags.length > 0 && (
        <div className={styles.tagList}>
          {note.tags.map((tag) => (
            <span key={tag} className={styles.tag}>
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className={styles.cardFooter}>
        <div className={styles.metaGroup}>
          <span className={styles.wordBadge}>
            {wordCount} {wordCount === 1 ? 'palabra' : 'palabras'}
          </span>
          {formattedDate && <span className={styles.dateInfo}>{formattedDate}</span>}
        </div>

        <div className={styles.cardActions}>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(note);
            }}
            aria-label={`Editar nota ${note.title}`}
          >
            <Pencil size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(note);
            }}
            aria-label={`Eliminar nota ${note.title}`}
          >
            <Trash2 size={15} aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
};
