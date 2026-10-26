import React from 'react';
import { Plus } from 'lucide-react';
import type { PlannerBlock } from '../../types';
import { PlannerBlockCard } from './PlannerBlockCard';
import styles from './PlannerDayColumn.module.css';

interface PlannerDayColumnProps {
  dayName: string;
  dateLabel: string;
  /** La columna del día de hoy se marca con color y con la etiqueta "Hoy" (el color solo no basta). */
  isToday?: boolean;
  blocks: PlannerBlock[];
  onAddBlock: () => void;
  onToggleBlock: (block: PlannerBlock) => void;
  onDeleteBlock: (id: string) => void;
}

export const PlannerDayColumn: React.FC<PlannerDayColumnProps> = ({
  dayName,
  dateLabel,
  isToday = false,
  blocks,
  onAddBlock,
  onToggleBlock,
  onDeleteBlock,
}) => {
  // Con hora primero (de la más temprana a la más tardía); sin hora al final, en el orden en que se guardaron.
  const ordered = [...blocks].sort((a, b) => (a.time ?? '99:99').localeCompare(b.time ?? '99:99'));

  return (
    <section
      className={`${styles.dayColumn} ${isToday ? styles.todayColumn : ''}`}
      aria-label={`Columna ${dayName}`}
      aria-current={isToday ? 'date' : undefined}
    >
      {/* Pestaña técnica de archivador con código de cuadrícula */}
      <div className={styles.technicalTab} aria-hidden="true">
        <span className={styles.tabGridRef}>{`SEC-${dayName.slice(0, 3).toUpperCase()}`}</span>
      </div>

      <div className={styles.columnHeader}>
        <div className={styles.dayInfo}>
          <h3 className={styles.dayName}>{dayName}</h3>
          <span className={styles.dateLabel}>
            {dateLabel}
            {isToday && <span className={styles.todayTag}>Hoy</span>}
          </span>
        </div>
        <span className={styles.countBadge}>
          {blocks.length} {blocks.length === 1 ? 'Bloque' : 'Bloques'}
        </span>
      </div>

      <button
        type="button"
        className={styles.addBlockBtn}
        onClick={onAddBlock}
        aria-label={`Agregar bloque ${dayName}`}
      >
        <Plus size={14} aria-hidden="true" />
        <span>+ Bloque</span>
      </button>

      <div className={styles.blocksContainer}>
        {blocks.length === 0 ? (
          <p className={styles.emptyDayText}>Sin bloques</p>
        ) : (
          ordered.map(block => (
            <PlannerBlockCard
              key={block.id}
              block={block}
              onToggle={onToggleBlock}
              onDelete={onDeleteBlock}
            />
          ))
        )}
      </div>
    </section>
  );
};
