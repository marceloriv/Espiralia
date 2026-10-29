import React from 'react';
import { Star } from 'lucide-react';
import { LOCALSTORAGE_QUOTA_BYTES } from '../../services/storage';
import { formatBytes } from '../../utils/formatBytes';
import { dueLabel } from './dashboardData';
import type { FocusSummary, NetFocusResult, TaskPerformanceResult } from './dashboardData';
import styles from '../DashboardView.module.css';

interface MetricsStripProps {
  habitStreak: number;
  netFocus: NetFocusResult;
  storageBytes: number;
  taskPerf: TaskPerformanceResult;
}

/** Franja de cuatro indicadores del Dashboard: racha, foco neto, almacenamiento y rendimiento. */
export const MetricsStrip: React.FC<MetricsStripProps> = ({ habitStreak, netFocus, storageBytes, taskPerf }) => (
  <section className={styles.kpiStrip} aria-label="Métricas de serenidad">
        <div className={styles.metricQuadTile}>
          <span className={styles.metricTileLabel}>Racha Serena</span>
          <div className={styles.metricTileValueBox}>
            <span className={styles.metricTileValAccent}>{habitStreak}</span>
            <span className={styles.metricTileUnit}>días</span>
          </div>
          <span className={styles.metricTileSub}>{habitStreak > 0 ? 'Hábitos al día' : 'Marca un hábito para empezarla'}</span>
        </div>

        <div className={styles.metricQuadTile}>
          <span className={styles.metricTileLabel}>Foco Neto Hoy</span>
          <div className={styles.metricTileValueBox}>
            <span className={styles.metricTileVal}>{netFocus.hours}</span>
            <span className={styles.metricTileUnit}>horas</span>
          </div>
          <span className={styles.metricTileSub}>
            {netFocus.count > 0 ? `${netFocus.count} actividades hoy` : 'Día libre de foco'}
          </span>
        </div>

        <div className={styles.metricQuadTile}>
          <span className={styles.metricTileLabel}>Almacenamiento</span>
          <div className={styles.metricTileValueBox}>
            <span className={styles.metricTileValTeal}>{formatBytes(storageBytes)}</span>
          </div>
          <span className={styles.metricTileSub}>de ~{formatBytes(LOCALSTORAGE_QUOTA_BYTES)} en este navegador</span>
        </div>

        <div className={styles.metricQuadTile}>
          <span className={styles.metricTileLabel}>Rendimiento</span>
          <div className={styles.metricTileValueBox}>
            <span className={styles.metricTileValPurple}>
              {taskPerf.percentage === null ? 'Sin datos' : `${taskPerf.percentage}%`}
            </span>
          </div>
          {taskPerf.percentage !== null && (
            <div
              className={styles.metricTileBar}
              role="progressbar"
              aria-label="Rendimiento de tareas"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={taskPerf.percentage}
            >
              <div className={styles.metricTileBarFill} style={{ width: `${taskPerf.percentage}%` }} />
            </div>
          )}
          <span className={styles.metricTileSub}>
            {taskPerf.total > 0 ? `${taskPerf.completed} de ${taskPerf.total} tareas logradas` : 'Sin tareas registradas'}
          </span>
        </div>
      </section>
);

interface FocusBannerProps {
  focus: FocusSummary;
  /** Hay más de una tarea pendiente entre las que elegir. */
  canChangeFocus: boolean;
  todayStr: string;
  onChangeFocus: () => void;
  onToggleTodo: (id: string) => void;
  onPlanFocus: () => void;
}

/** Banner "Foco principal de hoy": la tarea elegida con su área, prioridad y plazo, o la invitación a fijar una. */
export const FocusBanner: React.FC<FocusBannerProps> = ({
  focus,
  canChangeFocus,
  todayStr,
  onChangeFocus,
  onToggleTodo,
  onPlanFocus,
}) => {
  const { todo } = focus;
  return (
    <div className={styles.focusBanner}>
          <div className={styles.focusHeaderRow}>
            <div className={styles.washiTapeBadge} aria-hidden="true">
              <Star size={14} />
              <span>FOCO PRINCIPAL DE HOY</span>
            </div>
            {canChangeFocus && (
              <button
                type="button"
                className={styles.changeFocusBtn}
                onClick={onChangeFocus}
                aria-label="Cambiar foco del día"
              >
                Cambiar Foco
              </button>
            )}
          </div>

          {todo ? (
            <div className={styles.focusInnerCard}>
              <label className={styles.focusCheckboxHit} htmlFor="main-focus-checkbox">
                <input
                  type="checkbox"
                  id="main-focus-checkbox"
                  className={styles.focusCheckbox}
                  checked={focus.isDone}
                  onChange={() => onToggleTodo(todo.id)}
                  aria-label="Marcar foco principal completado"
                />
              </label>
              <div className={styles.focusDetails}>
                <h3 className={`${styles.focusTitle} ${focus.isDone ? styles.rowTitleDone : ''}`}>
                  {todo.title}
                </h3>
                <div className={styles.focusChipsRow}>
                  <span className={styles.focusChipArea}>
                    <span className={styles.focusChipDot} />
                    <span>Área: {focus.areaName}</span>
                  </span>
                  <span className={styles.metaDot}>•</span>
                  <span className={styles.priorityHighBadge}>{focus.priorityLabel}</span>
                  {todo.dueDate && (
                    <>
                      <span className={styles.metaDot}>•</span>
                      <span>Plazo: {dueLabel(todo.dueDate, todayStr) || todo.dueDate}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.focusInnerCard} style={{ justifyContent: 'center', textAlign: 'center', padding: '24px' }}>
              <div>
                <p style={{ margin: '0 0 10px 0', color: 'var(--color-muted)' }}>Sin tareas pendientes en el cuaderno</p>
                <button
                  type="button"
                  className={styles.addHabitBtn}
                  onClick={onPlanFocus}
                  aria-label="Fijar foco del día"
                >
                  + Fijar foco del día
                </button>
              </div>
            </div>
          )}
        </div>
  );
};
