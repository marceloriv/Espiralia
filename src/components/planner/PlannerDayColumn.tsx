import React from 'react';
import { Plus } from 'lucide-react';
import type { PlannerBlock } from '../../types';
import { PlannerBlockCard } from './PlannerBlockCard';
import styles from './PlannerDayColumn.module.css';

interface PlannerDayColumnProps {
  dayName: string;
  dateLabel: string;
  blocks: PlannerBlock[];
  onAddBlock: () => void;
  onToggleBlock: (block: PlannerBlock) => void;
  onDeleteBlock: (id: string) => void;
}

export const PlannerDayColumn: React.FC<PlannerDayColumnProps> = ({
  dayName,
  dateLabel,
  blocks,
  onAddBlock,
  onToggleBlock,
  onDeleteBlock,
}) => {
  return (
    <section className={styles.dayColumn} aria-label={`Columna ${dayName}`}>
      {/* Pestaña técnica de archivador con código de cuadrícula */}
      <div className={styles.technicalTab} aria-hidden="true">
        <span className={styles.tabGridRef}>{`SEC-${dayName.slice(0, 3).toUpperCase()}`}</span>
      </div>

      <div className={styles.columnHeader}>
        <div className={styles.dayInfo}>
          <h3 className={styles.dayName}>{dayName}</h3>
          <span className={styles.dateLabel}>{dateLabel}</span>
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
          blocks.map(block => (
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
