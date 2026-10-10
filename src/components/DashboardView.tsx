import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BarChart2, Calendar, CalendarPlus, Compass, Flag, ListPlus } from 'lucide-react';
import type { Profile, AgendaEvent, PlannerBlock, TodoItem, ViewType } from '../types';
import { StorageService } from '../services/storage';
import { toLocalDateStr } from '../utils/localDate';
import { CATEGORY_COLORS, FILTER_LABELS, categoryOf, occursOn } from './agenda/eventMapping';
import { criticalTodos, dueLabel, greetingFor, isCritical, todayEventsSorted } from './dashboard/dashboardData';
import { TaskCompletionChart } from './charts/TaskCompletionChart';
import { CategoryDistributionChart } from './charts/CategoryDistributionChart';
import styles from './DashboardView.module.css';

interface DashboardViewProps {
  profile: Profile;
  onNavigate: (view: ViewType) => void;
}

const longDateFormatter = new Intl.DateTimeFormat('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });

const countLabel = (n: number, singular: string, plural: string) => `${n} ${n === 1 ? singular : plural}`;

const formatHeroDate = (date: Date): string => {
  const formatted = longDateFormatter.format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

export const DashboardView: React.FC<DashboardViewProps> = ({ profile, onNavigate }) => {
  const [events, setEvents] = useState<AgendaEvent[]>(() => StorageService.getEvents(profile.id));
  const [planner, setPlanner] = useState<PlannerBlock[]>(() => StorageService.getPlanner(profile.id));
  const [todos, setTodos] = useState<TodoItem[]>(() => StorageService.getTodos(profile.id));
  const [now] = useState(() => new Date());
  const isFirstMount = useRef(true);

  const loadData = useCallback(() => {
    setEvents(StorageService.getEvents(profile.id));
    setPlanner(StorageService.getPlanner(profile.id));
    setTodos(StorageService.getTodos(profile.id));
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

  const handleToggleTodo = (id: string) => {
    StorageService.toggleTodo(profile.id, id);
    loadData();
  };

  return (
    <div className={styles.dashboardContainer}>
      <section className={styles.hero} aria-labelledby="dash-greeting">
        <p className={styles.heroDate}>{formatHeroDate(now)}</p>
        <h2 id="dash-greeting" className={styles.heroTitle}>
          {greetingFor(now)}, {profile.name}.
        </h2>
        <p className={styles.heroSubtitle}>Aquí está el pulso de tu día y lo que no puede esperar.</p>
        <ul className={styles.heroChips} aria-label="Resumen">
          <li className={styles.chip}>{countLabel(pendingCount, 'pendiente', 'pendientes')}</li>
          <li className={`${styles.chip} ${styles.chipCritical}`}>{countLabel(criticalCount, 'crítico', 'críticos')}</li>
        </ul>
      </section>

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
        </div>
      </section>

      <div className={styles.cardsGrid}>
        <section className={styles.card} aria-labelledby="dash-events">
          <div className={styles.cardHeader}>
            <h3 id="dash-events" className={styles.cardTitle}>
              <Calendar size={18} aria-hidden="true" />
              <span>Eventos de hoy</span>
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

        <section className={styles.card} aria-labelledby="dash-critical">
          <div className={styles.cardHeader}>
            <h3 id="dash-critical" className={styles.cardTitle}>
              <Flag size={18} aria-hidden="true" />
              <span>No olvidar</span>
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
                    <span className={styles.rowTitle}>{t.title}</span>
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
      </div>

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
