import React, { useMemo } from 'react';
import { Chart } from '@tanstack/charts/react';
import { defineChart } from '@tanstack/charts';
import { pie, polar, radialArc } from '@tanstack/charts/polar';
import { BookOpen, Activity, CheckSquare, Lock, CheckCircle2, Circle, Command } from 'lucide-react';
import styles from './LandingDeskPreview.module.css';

export const LandingDeskPreview: React.FC = () => {
  const rhythmChart = useMemo(() => {
    const chartData = [
      { label: 'Estudio Licencia Clase B', hours: 14, color: '#8E1EA2' },
      { label: 'Universidad 2026', hours: 9, color: '#5db8a6' },
      { label: 'Pausa consciente & Diario', hours: 4, color: '#e8a55a' },
      { label: 'Restante semanal', hours: 5, color: '#e6dfd8' },
    ];

    const slices = pie(chartData, { value: d => d.hours });

    return defineChart({
      marks: [
        polar({
          marks: [
            radialArc(slices, {
              innerRadius: ctx => ctx.radius * 0.72,
              outerRadius: ctx => ctx.radius,
              fill: d => d.color,
            }),
          ],
          scales: {
            angle: null,
            radius: null,
          },
        }),
      ],
      scales: {
        x: null,
        y: null,
      },
    });
  }, []);
  return (
    <section className={styles.deskContainer} aria-labelledby="desk-preview-heading">
      <div className={styles.deskHeader}>
        <div className={styles.deskBadge}>
          <BookOpen size={14} aria-hidden="true" />
          <span>Mesa de Trabajo en Vivo</span>
        </div>
        <h2 id="desk-preview-heading" className={styles.deskTitle}>
          La composición de tu mesa de trabajo
        </h2>
        <p className={styles.deskSubtitle}>
          Un espacio unificado donde la reflexión terapéutica, la disciplina de estudio y tus metas de largo aliento conviven en armonía visual.
        </p>
      </div>

      <div className={styles.columnsGrid}>
        {/* Columna 1: Proceso Terapéutico */}
        <article className={styles.columnCard} aria-labelledby="col-terapeutico-title">
          <div>
            <div className={styles.colHeader}>
              <div className={styles.colTitleGroup}>
                <BookOpen size={18} color="var(--color-primary)" aria-hidden="true" />
                <h3 id="col-terapeutico-title" className={styles.colTitle}>Proceso Terapéutico</h3>
              </div>
              <span className={styles.colTag}>Sesión #14</span>
            </div>

            <div className={styles.manuscriptExcerpt}>
              “Ayer sentí una resistencia enorme al sentarme a repasar las preguntas de mecánica. Pero al escribirlo en el cuaderno entendí que el miedo no es al examen, sino a permitirme avanzar y asumir la autonomía que viene con conducir...”
            </div>

            <div className={styles.findingCard}>
              <strong>Hallazgo:</strong> La constancia calma la ansiedad del cambio y abre espacio mental.
            </div>
          </div>

          <div className={styles.colFooter}>
            <span>420 palabras escritas</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Lock size={12} aria-hidden="true" /> Guardado localmente
            </span>
          </div>
        </article>

        {/* Columna 2: Ritmo Semanal */}
        <article className={styles.columnCard} aria-labelledby="col-ritmo-title">
          <div>
            <div className={styles.colHeader}>
              <div className={styles.colTitleGroup}>
                <Activity size={18} color="var(--color-primary)" aria-hidden="true" />
                <h3 id="col-ritmo-title" className={styles.colTitle}>Ritmo Semanal</h3>
              </div>
              <span className={styles.colTag}>Enfoque</span>
            </div>

            <div
              className={styles.circularProgressWrapper}
              role="progressbar"
              aria-label="Avance semanal"
              aria-valuenow={84}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className={styles.chartWrapper}>
                <Chart
                  definition={rhythmChart}
                  ariaLabel="Distribución de ritmo semanal: 84% completado"
                  aspectRatio={1}
                />
              </div>
              <div className={styles.progressLabelGroup} aria-hidden="true">
                <span className={styles.progressNumber}>84%</span>
                <span className={styles.progressLabel}>Completado</span>
              </div>
            </div>

            <div className={styles.legendList}>
              <div className={styles.legendItem}>
                <span>
                  <span className={styles.legendDot} style={{ backgroundColor: 'var(--color-primary)' }} />
                  Estudio Licencia Clase B
                </span>
                <strong>14 hrs</strong>
              </div>
              <div className={styles.legendItem}>
                <span>
                  <span className={styles.legendDot} style={{ backgroundColor: 'var(--color-accent-teal)' }} />
                  Universidad 2026
                </span>
                <strong>9 hrs</strong>
              </div>
              <div className={styles.legendItem}>
                <span>
                  <span className={styles.legendDot} style={{ backgroundColor: 'var(--color-accent-amber)' }} />
                  Pausa consciente & Diario
                </span>
                <strong>4 hrs</strong>
              </div>
            </div>
          </div>

          <div className={styles.daysRow} aria-label="Cumplimiento diario">
            <span className={`${styles.dayPill} ${styles.dayPillActive}`}>L</span>
            <span className={`${styles.dayPill} ${styles.dayPillActive}`}>M</span>
            <span className={`${styles.dayPill} ${styles.dayPillActive}`}>M</span>
            <span className={`${styles.dayPill} ${styles.dayPillActive}`}>J</span>
            <span className={`${styles.dayPill} ${styles.dayPillActive}`}>V</span>
            <span className={`${styles.dayPill} ${styles.dayPillActive}`}>S</span>
            <span className={styles.dayPill}>D</span>
          </div>
        </article>

        {/* Columna 3: Tareas Prioritarias */}
        <article className={styles.columnCard} aria-labelledby="col-tareas-title">
          <div>
            <div className={styles.colHeader}>
              <div className={styles.colTitleGroup}>
                <CheckSquare size={18} color="var(--color-primary)" aria-hidden="true" />
                <h3 id="col-tareas-title" className={styles.colTitle}>Tareas Prioritarias</h3>
              </div>
              <span className={styles.colTag}>Hoy</span>
            </div>

            <div className={styles.taskList}>
              <div className={styles.taskItem}>
                <CheckCircle2 size={16} className={styles.taskCheckbox} aria-hidden="true" />
                <div className={styles.taskContent}>
                  <div className={`${styles.taskTitle} ${styles.taskCompleted}`}>
                    Examen teórico Clase B
                  </div>
                  <span className={styles.taskBadge}>CONASET 33/35</span>
                </div>
              </div>

              <div className={styles.taskItem}>
                <Circle size={16} className={styles.taskCheckbox} aria-hidden="true" />
                <div className={styles.taskContent}>
                  <div className={styles.taskTitle}>
                    Postulación Universidad 2026
                  </div>
                  <span className={styles.taskBadge}>Expediente 6 de 8 docs</span>
                </div>
              </div>

              <div className={styles.taskItem}>
                <Circle size={16} className={styles.taskCheckbox} aria-hidden="true" />
                <div className={styles.taskContent}>
                  <div className={styles.taskTitle}>
                    Práctica en circuito cerrado
                  </div>
                  <span className={styles.taskBadge}>Estacionamiento en retroceso</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.shortcutTip}>
            <Command size={14} aria-hidden="true" />
            <span>Presiona <kbd className={styles.kbd}>⌘N</kbd> para nueva nota o tarea</span>
          </div>
        </article>
      </div>
    </section>
  );
};
