import React, { useState, useEffect } from 'react';
import { Calendar, Compass, CheckSquare, Clock } from 'lucide-react';
import type { Profile, AgendaEvent, PlannerBlock, TodoItem, ViewType } from '../types';
import { StorageService } from '../services/storage';
import styles from './DashboardView.module.css';

interface DashboardViewProps {
  profile: Profile;
  onNavigate: (view: ViewType) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ profile, onNavigate }) => {
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [planner, setPlanner] = useState<PlannerBlock[]>([]);
  const [todos, setTodos] = useState<TodoItem[]>([]);

  const loadData = () => {
    setEvents(StorageService.getEvents(profile.id));
    setPlanner(StorageService.getPlanner(profile.id));
    setTodos(StorageService.getTodos(profile.id));
  };

  useEffect(() => {
    loadData();
  }, [profile.id]);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayEvents = events.filter(e => e.date === todayStr);
  const pendingTodos = todos.filter(t => !t.completed);
  const completedTodosCount = todos.filter(t => t.completed).length;

  const handleToggleTodo = (id: string) => {
    StorageService.toggleTodo(profile.id, id);
    loadData();
  };

  return (
    <div className={styles.dashboardContainer}>
      {/* Tarjeta de bienvenida */}
      <div className={styles.welcomeSection}>
        <div>
          <h2 className={styles.welcomeTitle}>¡Hola, {profile.name}!</h2>
          <p className={styles.welcomeSubtitle}>
            Este es el resumen centralizado de tus actividades para hoy.
          </p>
        </div>
        <div className={styles.statsBar}>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>{pendingTodos.length}</div>
            <div className={styles.statLabel}>Pendientes</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>{completedTodosCount}</div>
            <div className={styles.statLabel}>Completadas</div>
          </div>
        </div>
      </div>

      {/* Grid de 3 widgets */}
      <div className={styles.widgetsGrid}>
        {/* Widget Agenda */}
        <div className={styles.widgetCard}>
          <div className={styles.widgetHeader}>
            <h3 className={styles.widgetTitle}>
              <Calendar size={18} color="var(--color-primary)" />
              <span>Agenda de hoy</span>
            </h3>
            <span style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>
              {todayEvents.length} eventos
            </span>
          </div>

          <div className={styles.widgetList}>
            {todayEvents.length === 0 ? (
              <p className={styles.emptyNotice}>No hay eventos para hoy</p>
            ) : (
              todayEvents.slice(0, 4).map(e => (
                <div key={e.id} className={styles.widgetItem}>
                  <Clock size={14} color="var(--color-muted)" />
                  <span className={styles.widgetItemTitle}>{e.title}</span>
                  <span className={styles.widgetItemTime}>{e.startTime || 'Todo el día'}</span>
                </div>
              ))
            )}
          </div>

          <div className={styles.widgetFooter}>
            <button
              type="button"
              className={styles.widgetActionBtn}
              onClick={() => onNavigate('agenda')}
            >
              Ver agenda completa
            </button>
          </div>
        </div>

        {/* Widget Planner */}
        <div className={styles.widgetCard}>
          <div className={styles.widgetHeader}>
            <h3 className={styles.widgetTitle}>
              <Compass size={18} color="var(--color-primary-active)" />
              <span>Planner semanal</span>
            </h3>
            <span style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>
              {planner.length} bloques
            </span>
          </div>

          <div className={styles.widgetList}>
            {planner.length === 0 ? (
              <p className={styles.emptyNotice}>Sin bloques planificados</p>
            ) : (
              planner.slice(0, 4).map(b => (
                <div key={b.id} className={styles.widgetItem}>
                  <span
                    className={`${styles.widgetItemTitle} ${b.completed ? styles.widgetItemCompleted : ''}`}
                  >
                    {b.title}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 600 }}>
                    {b.timeSlot}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className={styles.widgetFooter}>
            <button
              type="button"
              className={styles.widgetActionBtn}
              onClick={() => onNavigate('planner')}
            >
              Ver planner completo
            </button>
          </div>
        </div>

        {/* Widget To-Do */}
        <div className={styles.widgetCard}>
          <div className={styles.widgetHeader}>
            <h3 className={styles.widgetTitle}>
              <CheckSquare size={18} color="var(--color-primary)" />
              <span>Tareas principales</span>
            </h3>
            <span style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>
              {pendingTodos.length} restantes
            </span>
          </div>

          <div className={styles.widgetList}>
            {todos.length === 0 ? (
              <p className={styles.emptyNotice}>No hay tareas pendientes</p>
            ) : (
              todos.slice(0, 4).map(t => (
                <div key={t.id} className={styles.widgetItem}>
                  <input
                    type="checkbox"
                    id={`dash-todo-${t.id}`}
                    aria-label={`completar ${t.title}`}
                    className={styles.widgetItemCheckbox}
                    checked={t.completed}
                    onChange={() => handleToggleTodo(t.id)}
                  />
                  <span
                    className={`${styles.widgetItemTitle} ${t.completed ? styles.widgetItemCompleted : ''}`}
                  >
                    {t.title}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className={styles.widgetFooter}>
            <button
              type="button"
              className={styles.widgetActionBtn}
              onClick={() => onNavigate('todo')}
            >
              Ver todas las tareas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
