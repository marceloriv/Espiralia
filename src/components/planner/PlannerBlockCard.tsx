import React from 'react';
import { Trash2, Sun, Sunset, Moon, Target } from 'lucide-react';
import type { PlannerBlock, TimeSlot, Priority } from '../../types';
import styles from './PlannerBlockCard.module.css';

interface PlannerBlockCardProps {
  block: PlannerBlock;
  onToggle: (block: PlannerBlock) => void;
  onDelete: (id: string) => void;
}

const slotIcons: Record<TimeSlot, React.ReactNode> = {
  mañana: <Sun size={13} aria-hidden="true" />,
  tarde: <Sunset size={13} aria-hidden="true" />,
  noche: <Moon size={13} aria-hidden="true" />,
  meta: <Target size={13} aria-hidden="true" />,
};

const slotClasses: Record<TimeSlot, string> = {
  mañana: styles.slotMañana,
  tarde: styles.slotTarde,
  noche: styles.slotNoche,
  meta: styles.slotMeta,
};

const priorityClasses: Record<Priority, string> = {
  alta: styles.priorityAlta,
  media: styles.priorityMedia,
  baja: styles.priorityBaja,
};

export const PlannerBlockCard: React.FC<PlannerBlockCardProps> = ({ block, onToggle, onDelete }) => {
  const priorityLabel = block.priority.charAt(0).toUpperCase() + block.priority.slice(1);

  return (
    <div className={`${styles.blockCard} ${slotClasses[block.timeSlot] || ''}`}>
      <div className={styles.topRow}>
        <span className={styles.slotInfo}>
          {slotIcons[block.timeSlot]}
          <span>{block.timeSlot}</span>
        </span>
        {block.time && <span className={styles.timeText}>{block.time}</span>}
      </div>

      <p className={`${styles.title} ${block.completed ? styles.completedTitle : ''}`}>
        {block.title}
      </p>

      <div className={styles.bottomRow}>
        <span className={`${styles.priorityBadge} ${priorityClasses[block.priority]}`}>
          {priorityLabel}
        </span>

        <div className={styles.actionsGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              className={styles.checkboxInput}
              checked={block.completed}
              onChange={() => onToggle(block)}
              aria-label={`Completar ${block.title}`}
            />
          </label>
          <button
            type="button"
            className={styles.deleteBtn}
            onClick={() => onDelete(block.id)}
            aria-label={`Eliminar ${block.title}`}
          >
            <Trash2 size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};
