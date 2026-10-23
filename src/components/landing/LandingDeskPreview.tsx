import React, { useState } from 'react';
import {
  PenLine,
  Activity,
  ShieldCheck,
  Check,
} from 'lucide-react';
import styles from './LandingDeskPreview.module.css';

interface DeskTask {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
}

export const LandingDeskPreview: React.FC = () => {
  const [tasks, setTasks] = useState<DeskTask[]>([
    {
      id: 'task-1',
      title: 'Repaso de estudio: 40 preguntas',
      duration: '35m',
      completed: true,
    },
    {
      id: 'task-2',
      title: 'Postulación Universitaria 2026: Expediente y certificados',
      duration: '45m',
      completed: false,
    },
    {
      id: 'task-3',
      title: 'Sesión de Diario: Introspección & Pausa consciente',
      duration: '20m',
      completed: false,
    },
  ]);

  const [activeMood, setActiveMood] = useState<string>('calma');

  const completedCount = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;
  const serenityPercentage = Math.round(60 + (completedCount / totalTasks) * 40);
  const completionPercentage = Math.round((completedCount / totalTasks) * 100);

  const handleToggleTask = (id: string) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  return (
    <section className={styles.deskContainer} aria-labelledby="desk-preview-heading">
      {/* Encabezado editorial */}
      <div className={styles.deskHeader}>
        <div className={styles.deskBadge}>
          <PenLine size={14} aria-hidden="true" />
          <span>Mesa de Trabajo en Vivo</span>
        </div>
        <h2 id="desk-preview-heading" className={styles.deskTitle}>
          La Mesa de Trabajo: Tu Centro de Control Silencioso
        </h2>
        <p className={styles.deskSubtitle}>
          Diseñado como un escritorio físico de papelería fina donde la reflexión introspectiva, el estudio riguroso y tus metas vitales conviven con total serenidad.
        </p>
      </div>

      <div className={styles.deskGrid}>
        {/* Columna Izquierda (7 cols): Pliego A4 Papercraft con Pila de Hojas */}
        <div className={styles.paperSheetWrapper} data-papercraft="paper-stack">
          <div className={styles.paperSheetUnderlay} aria-hidden="true" />

          <article className={styles.paperSheet} aria-labelledby="sheet-title">
            <div className={styles.washiTape} aria-hidden="true" />
            <div
              className={styles.binderClip}
              data-papercraft="binder-clip"
              aria-hidden="true"
            />

            <div className={styles.sheetHeader}>
              <div className={styles.sheetTitleGroup}>
                <h3 id="sheet-title" className={styles.sheetTitle}>
                  PLAN DE FOCO • HOY
                </h3>
                <span className={styles.sheetDate}>Martes, 14 Oct</span>
              </div>
              <span className={styles.sheetWeekBadge}>Semana 42</span>
            </div>

            {/* Prioridades */}
            <div className={styles.sectionBlockTitle}>
              Prioridades del Día (Máximo 3)
            </div>

            <div className={styles.prioritiesList} role="list">
              {tasks.map(task => (
                <label
                  key={task.id}
                  htmlFor={task.id}
                  className={styles.priorityItem}
                >
                  <div className={styles.priorityLabelGroup}>
                    <input
                      type="checkbox"
                      id={task.id}
                      checked={task.completed}
                      onChange={() => handleToggleTask(task.id)}
                      className={styles.priorityCheckbox}
                      aria-label={task.title}
                    />
                    <span
                      className={`${styles.priorityText} ${
                        task.completed ? styles.priorityTextCompleted : ''
                      }`}
                    >
                      {task.title}
                    </span>
                  </div>
                  <span className={styles.priorityDurationBadge}>
                    {task.duration}
                  </span>
                </label>
              ))}
            </div>

            {/* Cronograma Horario */}
            <div className={styles.sectionBlockTitle}>
              Bloques de Atención Profunda
            </div>

            <div className={styles.scheduleList}>
              <div className={styles.scheduleRow}>
                <span className={styles.scheduleTime}>07:30 - 09:00</span>
                <span className={styles.scheduleTitle}>Bloque Alpha: Repaso teórico</span>
                <span className={styles.scheduleTag}>Enfoque Profundo</span>
              </div>
              <div className={`${styles.scheduleRow} ${styles.scheduleRowAmber}`}>
                <span className={styles.scheduleTime}>11:00 - 12:30</span>
                <span className={styles.scheduleTitle}>Documentación Académica & Ensayos</span>
                <span className={styles.scheduleTag}>Estratégico</span>
              </div>
              <div className={`${styles.scheduleRow} ${styles.scheduleRowTeal}`}>
                <span className={styles.scheduleTime}>16:00 - 17:00</span>
                <span className={styles.scheduleTitle}>Práctica guiada y repaso de apuntes</span>
                <span className={styles.scheduleTag}>Acción</span>
              </div>
              <div className={`${styles.scheduleRow} ${styles.scheduleRowNeutral}`}>
                <span className={styles.scheduleTime}>20:00 - 20:30</span>
                <span className={styles.scheduleTitle}>Cierre del día & Reflexión nocturna</span>
                <span className={styles.scheduleTag}>Pausa</span>
              </div>
            </div>

            <footer className={styles.sheetFooter}>
              <span>Papel libre de ácido • 120 gsm • Sincronización local instantánea</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Check size={12} color="var(--color-primary)" aria-hidden="true" />
                <span>Aprobado en Bóveda</span>
              </span>
            </footer>
          </article>
        </div>

        {/* Columna Derecha (5 cols): Bento Biorritmos + Nota Táctil */}
        <div className={styles.bentoStack}>
          {/* Card 1: Estado Vital & Ritmo */}
          <article className={styles.vitalCard} aria-labelledby="vital-heading">
            <div className={styles.vitalHeader}>
              <div className={styles.vitalTitleGroup}>
                <Activity size={18} color="var(--color-primary)" aria-hidden="true" />
                <h3 id="vital-heading" className={styles.vitalTitle}>
                  Estado Vital & Ritmo
                </h3>
              </div>
              <span
                className={styles.vitalBadge}
                role="status"
                aria-live="polite"
                aria-label={`${serenityPercentage}% de serenidad alcanzada`}
              >
                {serenityPercentage}% Serenidad
              </span>
            </div>

            {/* Selector de estado anímico/lunar */}
            <div className={styles.moodSelector} role="radiogroup" aria-label="Estado anímico del día">
              <button
                type="button"
                className={`${styles.moodBtn} ${activeMood === 'calma' ? styles.moodBtnActive : ''}`}
                onClick={() => setActiveMood('calma')}
                role="radio"
                aria-checked={activeMood === 'calma'}
              >
                <span aria-hidden="true">○</span>
                <span>Calma</span>
              </button>
              <button
                type="button"
                className={`${styles.moodBtn} ${activeMood === 'foco' ? styles.moodBtnActive : ''}`}
                onClick={() => setActiveMood('foco')}
                role="radio"
                aria-checked={activeMood === 'foco'}
              >
                <span aria-hidden="true">◑</span>
                <span>Foco</span>
              </button>
              <button
                type="button"
                className={`${styles.moodBtn} ${activeMood === 'fluidez' ? styles.moodBtnActive : ''}`}
                onClick={() => setActiveMood('fluidez')}
                role="radio"
                aria-checked={activeMood === 'fluidez'}
              >
                <span aria-hidden="true">●</span>
                <span>Fluidez</span>
              </button>
            </div>

            {/* Barras de métricas */}
            <div className={styles.metricsList}>
              <div className={styles.metricRow}>
                <div className={styles.metricLabelGroup}>
                  <span className={styles.metricLabel}>Horas de Foco Silencioso</span>
                  <span className={styles.metricValue}>4.5h / 6h</span>
                </div>
                <div className={styles.progressBarTrack} role="progressbar" aria-valuenow={75} aria-valuemin={0} aria-valuemax={100} aria-label="Horas de foco">
                  <div className={styles.progressBarFillPrimary} />
                </div>
              </div>

              <div className={styles.metricRow}>
                <div className={styles.metricLabelGroup}>
                  <span className={styles.metricLabel}>Serenidad Mental</span>
                  <span className={styles.metricValue}>90%</span>
                </div>
                <div className={styles.progressBarTrack} role="progressbar" aria-valuenow={90} aria-valuemin={0} aria-valuemax={100} aria-label="Serenidad mental">
                  <div className={styles.progressBarFillTeal} />
                </div>
              </div>

              <div className={styles.metricRow}>
                <div className={styles.metricLabelGroup}>
                  <span className={styles.metricLabel}>Módulos Completados</span>
                  <span className={styles.metricValue}>
                    {completedCount} de {totalTasks}
                  </span>
                </div>
                <div
                  className={styles.progressBarTrack}
                  role="progressbar"
                  aria-valuenow={completionPercentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Módulos completados"
                >
                  <div
                    className={styles.progressBarFillAmber}
                    style={{ width: `${completionPercentage}%`, transition: 'width 240ms ease' }}
                  />
                </div>
              </div>
            </div>
          </article>

          {/* Card 2: Nota Rápida Táctil */}
          <article className={styles.quickNoteCard} aria-labelledby="note-title">
            <div className={styles.goldenPin} aria-hidden="true" />
            <div className={styles.quickNoteHeader}>
              <h3 id="note-title" className={styles.quickNoteTitle}>
                Captura Rápida
              </h3>
              <span className={styles.quickNoteTag}>Hoy • 11:20 AM</span>
            </div>

            <blockquote className={styles.quickNoteContent}>
              «No confundir movimiento con progreso. La serenidad precede al resultado.»
            </blockquote>

            <div className={styles.quickNoteFooter}>
              <ShieldCheck size={13} aria-hidden="true" />
              <span>Guardado en Bóveda Local • Sin conexión requerida</span>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
};
