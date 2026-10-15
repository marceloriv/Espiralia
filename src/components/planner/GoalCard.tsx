import React from 'react';
import { Trash2 } from 'lucide-react';
import type { Goal } from '../../types';
import styles from './GoalCard.module.css';

interface GoalCardProps {
  goal: Goal;
  onToggleSubItem: (goalId: string, subId: string) => void;
  onDeleteGoal: (goalId: string) => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({ goal, onToggleSubItem, onDeleteGoal }) => {
  const total = goal.items.length;
  const completed = goal.items.filter(i => i.completed).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <article className={styles.goalCard} aria-labelledby={`goal-title-${goal.id}`}>
      <div className={styles.headerRow}>
        {goal.category && <span className={styles.categoryBadge}>{goal.category}</span>}
        <button
          type="button"
          className={styles.deleteBtn}
          onClick={() => onDeleteGoal(goal.id)}
          aria-label={`Eliminar meta ${goal.title}`}
        >
          <Trash2 size={16} aria-hidden="true" />
        </button>
      </div>

      <h4 id={`goal-title-${goal.id}`} className={styles.goalTitle}>{goal.title}</h4>
      {goal.description && <p className={styles.goalDescription}>{goal.description}</p>}

      <div className={styles.progressSection}>
        <div className={styles.progressHeader}>
          <span>Progreso:</span>
          <span className={styles.progressValue}>
            {completed} / {total} ({percentage}%)
          </span>
        </div>
        <div className={styles.progressBarBg} role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}>
          <div className={styles.progressBarFill} style={{ width: `${percentage}%` }} />
        </div>
      </div>

      {total > 0 && (
        <div className={styles.itemsList}>
          {goal.items.map(item => (
            <label key={item.id} className={styles.subItemLabel}>
              <input
                type="checkbox"
                className={styles.subItemCheckbox}
                checked={item.completed}
                onChange={() => onToggleSubItem(goal.id, item.id)}
                aria-label={item.title}
              />
              <span className={item.completed ? styles.completedText : undefined}>
                {item.title}
              </span>
            </label>
          ))}
        </div>
      )}
    </article>
  );
};
