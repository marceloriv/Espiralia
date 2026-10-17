import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BarChart2, BookOpen, Calendar, CalendarPlus, Compass, Flag, Link as LinkIcon, ListPlus } from 'lucide-react';
import type { Profile, AgendaEvent, PlannerBlock, TodoItem, Area, ViewType } from '../types';
import { StorageService } from '../services/storage';
import { toLocalDateStr } from '../utils/localDate';
import { CATEGORY_COLORS, FILTER_LABELS, categoryOf, occursOn } from './agenda/eventMapping';
import { criticalTodos, dueLabel, greetingFor, isCritical, todayEventsSorted, computeAreaSummaries } from './dashboard/dashboardData';
import { TaskCompletionChart } from './charts/TaskCompletionChart';
import { CategoryDistributionChart } from './charts/CategoryDistributionChart';
import styles from './DashboardView.module.css';

interface DashboardViewProps {
  profile: Profile;
  onNavigate: (view: ViewType) => void;
  onOpenReflection?: () => void;
  onOpenLink?: () => void;
}

const longDateFormatter = new Intl.DateTimeFormat('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });

const countLabel = (n: number, singular: string, plural: string) => `${n} ${n === 1 ? singular : plural}`;

const formatHeroDate = (date: Date): string => {
  const formatted = longDateFormatter.format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  profile,
  onNavigate,
  onOpenReflection,
  onOpenLink,
}) => {
  const [events, setEvents] = useState<AgendaEvent[]>(() => StorageService.getEvents(profile.id));
  const [planner, setPlanner] = useState<PlannerBlock[]>(() => StorageService.getPlanner(profile.id));
  const [todos, setTodos] = useState<TodoItem[]>(() => StorageService.getTodos(profile.id));
  const [areas, setAreas] = useState<Area[]>(() => StorageService.getAreas(profile.id));
  const [now] = useState(() => new Date());
  const isFirstMount = useRef(true);

  const loadData = useCallback(() => {
    setEvents(StorageService.getEvents(profile.id));
    setPlanner(StorageService.getPlanner(profile.id));
    setTodos(StorageService.getTodos(profile.id));
    setAreas(StorageService.getAreas(profile.id));
  }, [profile.id]);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    loadData();
  }, [loadData]);

  const todayStr = toLocalDateStr(now);
  const todayEvents = todayEventsSorted(events, todayStr);
  const todayEventsTotal = events.filter(e => occursOn(e, todayStr)).length;
  const pendingCount = todos.filter(t => (t.status ? t.status !== 'completada' : !t.completed)).length;
  const criticalCount = todos.filter(isCritical).length;
  const critical = criticalTodos(todos);
  const allWeekBlocks = planner.filter(b => b.period === 'semanal');
  const weekBlocks = allWeekBlocks.slice(0, 4);
  const areaSummaries = computeAreaSummaries(areas, todos);

  const handleToggleTodo = (id: string) => {
    StorageService.toggleTodo(profile.id, id);
    loadData();
  };

  return (
    <div className={styles.dashboardContainer}>
      {/* Cabecera Editorial Atelier */}
      <section className={styles.hero} aria-labelledby="dash-greeting">
        <p className={styles.atelierOverline}>ESPIRALIA ATELIER • HOY EN EL ESCRITORIO</p>
        <h1 className={styles.heroDate}>{formatHeroDate(now)}</h1>
        <h2 id="dash-greeting" className={styles.heroTitle}>
          {greetingFor(now)}, {profile.name}.
        </h2>
        <p className={styles.heroSubtitle}>Aquí está el pulso de tu día y lo que no puede esperar.</p>
        <blockquote className={styles.heroAphorism}>
          <div className={styles.brassClip} aria-hidden="true" />
          <p className={styles.aphorismText}>
            “El orden no es una restricción, es el espacio donde florecen tus ideas y tu calma.”
          </p>
        </blockquote>
        <ul className={styles.heroChips} aria-label="Resumen">
          <li className={styles.chip}>{countLabel(pendingCount, 'pendiente', 'pendientes')}</li>
          <li className={`${styles.chip} ${styles.chipCritical}`}>{countLabel(criticalCount, 'crítico', 'críticos')}</li>
        </ul>
      </section>

      {/* A un solo clic */}
      <section className={styles.quickSection} aria-labelledby="dash-quick">
        <h3 id="dash-quick" className={styles.sectionLabel}>
          A un solo clic
        </h3>
        <div className={styles.quickGrid}>
          <button type="button" className={styles.quickBtn} onClick={() => onNavigate('todo')}>
            <span className={`${styles.quickIcon} ${styles.quickIconTask}`} aria-hidden="true">
              <ListPlus size={18} />
            </span>
            <span className={styles.quickText}>
              <span className={styles.quickTitle}>Nueva tarea</span>
              <span className={styles.quickHint}>To-Do inmediato</span>
            </span>
          </button>
          <button type="button" className={styles.quickBtn} onClick={() => onNavigate('agenda')}>
            <span className={`${styles.quickIcon} ${styles.quickIconEvent}`} aria-hidden="true">
              <CalendarPlus size={18} />
            </span>
            <span className={styles.quickText}>
              <span className={styles.quickTitle}>Nuevo evento</span>
              <span className={styles.quickHint}>Horarios y citas</span>
            </span>
          </button>
          <button
            type="button"
            className={styles.quickBtn}
            onClick={() => (onOpenReflection ? onOpenReflection() : onNavigate('notes'))}
          >
            <span className={`${styles.quickIcon} ${styles.quickIconNote}`} aria-hidden="true">
              <BookOpen size={18} />
            </span>
            <span className={styles.quickText}>
              <span className={styles.quickTitle}>Nueva reflexión</span>
              <span className={styles.quickHint}>Bitácora y calma</span>
            </span>
          </button>
          <button
            type="button"
            className={styles.quickBtn}
            onClick={() => (onOpenLink ? onOpenLink() : onNavigate('folders'))}
          >
            <span className={`${styles.quickIcon} ${styles.quickIconLink}`} aria-hidden="true">
              <LinkIcon size={18} />
            </span>
            <span className={styles.quickText}>
              <span className={styles.quickTitle}>Nuevo enlace / doc</span>
              <span className={styles.quickHint}>Recursos y vínculos</span>
            </span>
          </button>
        </div>
      </section>

      {/* Bento Trilogía de Serenidad */}
      <div className={styles.bentoTrio}>
        <div className={styles.bentoCard}>
          <div className={styles.bentoCardHeader}>
            <span className={styles.bentoTag}>ENERGÍA Y CLARIDAD</span>
            <span className={styles.bentoBadge}>Ritmo Óptimo</span>
          </div>
          <div className={styles.bentoScore}>85%</div>
          <p className={styles.bentoHint}>Tu mejor ventana cognitiva es de 09:30 a 12:30.</p>
        </div>
        <div className={styles.bentoCard}>
          <div className={styles.bentoCardHeader}>
            <span className={styles.bentoTag}>TIEMPO EN PLANIFICADOR</span>
            <span className={styles.bentoBadge}>{allWeekBlocks.length} semanales</span>
          </div>
          <div className={styles.bentoScore}>4.5 hrs</div>
          <p className={styles.bentoHint}>Enfoque semanal programado con calma.</p>
        </div>
        <div className={styles.bentoCard}>
          <div className={styles.bentoCardHeader}>
            <span className={styles.bentoTag}>COMPROMISOS CLAVE</span>
            <span className={styles.bentoBadge}>{criticalCount === 0 ? 'Al día' : 'Atención'}</span>
          </div>
          <div className={styles.bentoScore}>{pendingCount} tareas</div>
          <p className={styles.bentoHint}>{criticalCount} asuntos prioritarios pendientes.</p>
        </div>
      </div>

      {/* Grid Principal de Pliego Stitch */}
      <div className={styles.mainLayoutGrid}>
        {/* Columna Izquierda: Foco, Prioridades, Horario y Áreas */}
        <div className={styles.mainLeftCol}>
          {/* Banner Today's Main Focus */}
          <div className={styles.focusBanner}>
            <div className={styles.washiTape} aria-hidden="true">ENFOQUE CARDINAL</div>
            <h3 className={styles.focusTitle}>TODAY'S MAIN FOCUS</h3>
            <p className={styles.focusSubtitle}>Mesa de trabajo y foco principal • Protege tu energía</p>
          </div>

          {/* Top Priorities no negociables */}
          <section className={styles.card} aria-labelledby="dash-critical">
            <div className={styles.cardHeader}>
              <h3 id="dash-critical" className={styles.cardTitle}>
                <Flag size={18} aria-hidden="true" />
                <span>TOP PRIORITIES no negociables</span>
              </h3>
              <span className={styles.cardMeta}>{countLabel(criticalCount, 'crítico', 'críticos')}</span>
            </div>
            {critical.length === 0 ? (
              <p className={styles.emptyNotice}>Nada crítico pendiente</p>
            ) : (
              <ul className={styles.list} aria-label="No olvidar">
                {critical.map(t => {
                  const due = dueLabel(t.dueDate, todayStr);
                  return (
                    <li key={t.id} className={styles.criticalRow}>
                      <input
                        type="checkbox"
                        id={`dash-todo-${t.id}`}
                        className={styles.checkbox}
                        aria-label={`completar ${t.title}`}
                        checked={t.completed}
                        onChange={() => handleToggleTodo(t.id)}
                      />
                      <span className={`${styles.rowTitle} ${t.completed ? styles.rowTitleDone : ''}`}>{t.title}</span>
                      {due && <span className={styles.dueTag}>{due}</span>}
                    </li>
                  );
                })}
              </ul>
            )}
            <button type="button" className={styles.cardLink} onClick={() => onNavigate('todo')}>
              Ver todas las tareas
            </button>
          </section>

          {/* Eliminate Distractions Box */}
          <div className={styles.distractionBox}>
            <div className={styles.paperclipIcon} aria-hidden="true" />
            <h4 className={styles.distractionTitle}>ELIMINATE DISTRACTIONS</h4>
            <ul className={styles.distractionList}>
              <li>Silencia notificaciones irrelevantes durante tus bloques de estudio.</li>
              <li>Mantén una única pestaña activa para evitar dispersión cognitiva.</li>
              <li>Respeta tus pausas de agua, postura y respiración consciente.</li>
            </ul>
          </div>

          {/* Focus Schedule de Hoy */}
          <section className={styles.card} aria-labelledby="dash-events">
            <div className={styles.cardHeader}>
              <h3 id="dash-events" className={styles.cardTitle}>
                <Calendar size={18} aria-hidden="true" />
                <span>Focus Schedule de Hoy (08:00 - 20:00)</span>
              </h3>
              <span className={styles.cardMeta}>{countLabel(todayEventsTotal, 'evento', 'eventos')}</span>
            </div>
            {todayEvents.length === 0 ? (
              <p className={styles.emptyNotice}>No hay eventos para hoy</p>
            ) : (
              <ul className={styles.list} aria-label="Eventos de hoy">
                {todayEvents.map(ev => {
                  const category = categoryOf(ev);
                  return (
                    <li key={ev.id} className={styles.eventRow}>
                      <span className={styles.timeBlock}>{ev.startTime ?? 'Todo el día'}</span>
                      <div className={styles.rowBody}>
                        <span className={styles.rowTitle}>{ev.title}</span>
                        <span
                          className={styles.badge}
                          style={{ backgroundColor: CATEGORY_COLORS[category].color, color: CATEGORY_COLORS[category].textColor }}
                        >
                          {FILTER_LABELS[category]}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <button type="button" className={styles.cardLink} onClick={() => onNavigate('agenda')}>
              Ver agenda completa
            </button>
          </section>

          {/* Progreso por Áreas Temáticas */}
          {areas.length > 0 && (
            <section
              className={styles.areasSection}
              role="region"
              aria-label="Áreas temáticas clave"
            >
              <div className={styles.areasHeader}>
                <h3 id="dash-areas" className={styles.sectionLabel}>
                  Progreso por Áreas Temáticas
                </h3>
                <span className={styles.areasMeta}>
                  {countLabel(areas.length, 'área en seguimiento', 'áreas en seguimiento')}
                </span>
              </div>
              <div className={styles.areasGrid}>
                {areaSummaries.map(s => (
                  <div key={s.area.id} className={styles.areaCard}>
                    <div className={styles.areaTop}>
                      <div className={styles.areaIdentity}>
                        <span className={styles.areaDot} style={{ backgroundColor: s.area.color }} aria-hidden="true" />
                        <h4 className={styles.areaName}>{s.area.name}</h4>
                      </div>
                      <span className={styles.areaPercent}>{s.completionPercentage}%</span>
                    </div>
                    <div className={styles.progressBarBg} aria-hidden="true">
                      <div
                        className={styles.progressBarFill}
                        style={{ width: `${s.completionPercentage}%`, backgroundColor: s.area.color }}
                      />
                    </div>
                    <div className={styles.areaBottom}>
                      <span className={styles.areaPendingCount}>
                        {countLabel(s.pendingTodos, 'pendiente', 'pendientes')}
                      </span>
                      <button
                        type="button"
                        className={styles.areaActionBtn}
                        onClick={() => onNavigate('todo')}
                        aria-label={`Ver tareas del área ${s.area.name}`}
                      >
                        Ver área →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Columna Lateral Derecha: Planner, Notes Bujo y Reflexión */}
        <div className={styles.mainRightCol}>
          {/* Planner de la semana */}
          <section className={styles.card} aria-labelledby="dash-planner">
            <div className={styles.cardHeader}>
              <h3 id="dash-planner" className={styles.cardTitle}>
                <Compass size={18} aria-hidden="true" />
                <span>Planner de la semana</span>
              </h3>
              <span className={styles.cardMeta}>{countLabel(allWeekBlocks.length, 'bloque', 'bloques')}</span>
            </div>
            {weekBlocks.length === 0 ? (
              <p className={styles.emptyNotice}>Sin bloques esta semana</p>
            ) : (
              <ul className={styles.list} aria-label="Planner de la semana">
                {weekBlocks.map(b => (
                  <li key={b.id} className={styles.plannerRow}>
                    <span className={`${styles.rowTitle} ${b.completed ? styles.rowTitleDone : ''}`}>{b.title}</span>
                    <span className={styles.slotTag}>{b.timeSlot}</span>
                  </li>
                ))}
              </ul>
            )}
            <button type="button" className={styles.cardLink} onClick={() => onNavigate('planner')}>
              Ver planner completo
            </button>
          </section>

          {/* NOTES / BRAIN DUMP card */}
          <div className={styles.notesCard}>
            <div className={styles.notesCardHeader}>
              <h4 className={styles.notesCardTitle}>NOTES / BRAIN DUMP</h4>
              <span className={styles.notesCardTag}>Bujo Dot Grid</span>
            </div>
            <p className={styles.notesHandwriting}>
              Anota aquí pensamientos fugaces, ideas de taller o recordatorios rápidos antes de que se disuelvan.
            </p>
            <button
              type="button"
              className={styles.notesCardBtn}
              onClick={() => (onOpenReflection ? onOpenReflection() : onNavigate('notes'))}
            >
              + Nueva Anotación Rápida
            </button>
          </div>

          {/* End of day reflection ♡ */}
          <div className={styles.reflectionCard}>
            <h4 className={styles.reflectionTitle}>End of day reflection ♡</h4>
            <div className={styles.reflectionField}>
              <label className={styles.reflectionLabel}>¿Qué fluyó con calma hoy?</label>
              <textarea className={styles.reflectionTextarea} placeholder="Un momento de claridad..." rows={2} />
            </div>
            <div className={styles.reflectionField}>
              <label className={styles.reflectionLabel}>¿Qué fricción superé?</label>
              <textarea className={styles.reflectionTextarea} placeholder="Una distracción disuelta..." rows={2} />
            </div>
            <div className={styles.reflectionField}>
              <label className={styles.reflectionLabel}>Intención para mañana:</label>
              <textarea className={styles.reflectionTextarea} placeholder="Una sola prioridad cardinal..." rows={2} />
            </div>
            <button
              type="button"
              className={styles.saveReflectionBtn}
              onClick={() => onNavigate('notes')}
            >
              Guardar Pliego
            </button>
          </div>
        </div>
      </div>

      {/* Métricas y Rendimiento */}
      <section className={styles.metricsSection} aria-labelledby="dash-metrics">
        <h3 id="dash-metrics" className={styles.cardTitle}>
          <BarChart2 size={18} aria-hidden="true" />
          <span>Métricas y Rendimiento</span>
        </h3>
        <div className={styles.metricsGrid}>
          <TaskCompletionChart todos={todos} />
          <CategoryDistributionChart todos={todos} planner={planner} />
        </div>
      </section>
    </div>
  );
};
