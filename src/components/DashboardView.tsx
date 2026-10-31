import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  BarChart2,
  BookOpen,
  CalendarPlus,
  Compass,
  Link as LinkIcon,
  ListPlus,
  Quote,
  Heart,
  Zap,
  Target,
  Leaf,
  Cloud,
  BatteryLow,
  CheckCircle,
  Coffee,
  Check,
  Clock,
  Bell,
  ShieldCheck,
  Edit,
  ArrowRight,
  X,
} from 'lucide-react';
import type { Profile, AgendaEvent, PlannerBlock, TodoItem, Area, ViewType, HabitTrackerItem, Note, DayOfWeek } from '../types';
import { StorageService } from '../services/storage';
import { sileo } from 'sileo';
import { isoWeekNumber, semesterLabel, toLocalDateStr } from '../utils/localDate';
import { categoryOf } from './agenda/eventMapping';
import {
  criticalTodos,
  dueLabel,
  greetingFor,
  isCritical,
  todayEventsSorted,
  computeAreaSummaries,
  computeHabitStreak,
  computeNetFocusHours,
  computeTaskPerformance,
  computeHabitsCompliance,
  computeWeekHabitDays,
  deriveFocus,
} from './dashboard/dashboardData';
import { TaskCompletionChart } from './charts/TaskCompletionChart';
import { CategoryDistributionChart } from './charts/CategoryDistributionChart';
import { HabitModal } from './habits/HabitModal';
import { Pliego } from './common/Pliego';
import { Papel } from './common/Papel';
import { TINTE_DE_MODULO } from './common/tintes';
import { FocusBanner, MetricsStrip } from './dashboard/DashboardParts';
import { useEscapeKey } from '../utils/useEscapeKey';
import { focusOnMount } from '../utils/useDialogFocus';
import { occurrenceKeys } from '../utils/occurrenceKeys';
import styles from './DashboardView.module.css';

interface DashboardViewProps {
  profile: Profile;
  onNavigate: (view: ViewType) => void;
  onOpenReflection?: () => void;
  onOpenLink?: () => void;
}

// Índice = `dayOfWeek` (0 = domingo), igual que el Planner.
const WEEK_DAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const getHabitIcon = (category?: string) => {
  const cat = (category || '').toLowerCase();
  if (cat.includes('estudio') || cat.includes('lectura')) return BookOpen;
  if (cat.includes('salud') || cat.includes('bienestar')) return Heart;
  if (cat.includes('pausa') || cat.includes('descanso')) return Coffee;
  if (cat.includes('enfoque') || cat.includes('pomodoro')) return Target;
  return CheckCircle;
};

const longDateFormatter = new Intl.DateTimeFormat('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });

const weekdayFormatter = new Intl.DateTimeFormat('es-CL', { weekday: 'long' });
const monthFormatter = new Intl.DateTimeFormat('es-CL', { month: 'long' });

const countLabel = (n: number, singular: string, plural: string) => `${n} ${n === 1 ? singular : plural}`;

const formatHeroDate = (date: Date): string => {
  const formatted = longDateFormatter.format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

/** Clase de un botón de energía; el elegido lleva además el resaltado. */
const energyBtnClass = (isActive: boolean) => (isActive ? `${styles.energyBtn} ${styles.energyBtnActive}` : styles.energyBtn);

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
  const [habits, setHabits] = useState<HabitTrackerItem[]>(() => StorageService.getHabits(profile.id));
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<HabitTrackerItem | null>(null);
  const [pinnedFocusTodoId, setPinnedFocusTodoId] = useState<string | null>(null);
  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false);
  const focusCloseBtnRef = useRef<HTMLButtonElement>(null);
  useEscapeKey(() => setIsFocusModalOpen(false), isFocusModalOpen);
  useEffect(() => {
    if (isFocusModalOpen) focusCloseBtnRef.current?.focus();
  }, [isFocusModalOpen]);
  const [distractions, setDistractions] = useState<string[]>(() => StorageService.getDistractions(profile.id));
  const [newDistractionText, setNewDistractionText] = useState('');
  const distractionInputRef = useRef<HTMLInputElement>(null);
  const [editingDistractionIdx, setEditingDistractionIdx] = useState<number | null>(null);
  const [editingDistractionText, setEditingDistractionText] = useState('');
  const [notes, setNotes] = useState<Note[]>(() => StorageService.getNotes(profile.id));
  const [now] = useState(() => new Date());
  const [energyState, setEnergyState] = useState<'calma' | 'plena' | 'neutra' | 'cansada'>('calma');
  const [reflection1, setReflection1] = useState('');
  const [reflection2, setReflection2] = useState('');
  const [reflection3, setReflection3] = useState('');
  const isFirstMount = useRef(true);

  const loadData = useCallback(() => {
    setEvents(StorageService.getEvents(profile.id));
    setPlanner(StorageService.getPlanner(profile.id));
    setTodos(StorageService.getTodos(profile.id));
    setAreas(StorageService.getAreas(profile.id));
    setHabits(StorageService.getHabits(profile.id));
    setDistractions(StorageService.getDistractions(profile.id));
    setNotes(StorageService.getNotes(profile.id));
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
  const pendingCount = todos.filter(t => (t.status ? t.status !== 'completada' : !t.completed)).length;
  const criticalCount = todos.filter(isCritical).length;
  const critical = criticalTodos(todos);
  const pendingTodosList = todos.filter(t => (t.status ? t.status !== 'completada' : !t.completed));
  const { todo: activeFocusTodo, isDone: isFocusDone, areaName: focusAreaName, priorityLabel: focusPriorityLabel } =
    deriveFocus(todos, areas, pinnedFocusTodoId);
  const allWeekBlocks = planner.filter(b => b.period === 'semanal');
  // Lunes primero y domingo al final: antes se tomaban los 4 primeros por orden de creación y los del domingo quedaban fuera.
  const weekDayRank = (d?: DayOfWeek) => (d === undefined ? 8 : d === 0 ? 7 : d);
  const weekBlocks = [...allWeekBlocks].sort((a, b) => weekDayRank(a.dayOfWeek) - weekDayRank(b.dayOfWeek));
  const areaSummaries = computeAreaSummaries(areas, todos);

  const todayDayOfWeek = now.getDay() as DayOfWeek;
  const todayPlannerBlocks = planner.filter(b => b.dayOfWeek === todayDayOfWeek);
  const todayHabitIdx = (todayDayOfWeek + 6) % 7;
  const habitStreak = computeHabitStreak(habits, todayHabitIdx);
  const netFocus = computeNetFocusHours(events, planner, todayStr, todayDayOfWeek);
  const taskPerf = computeTaskPerformance(todos);
  interface ScheduleItem {
    id: string;
    time: string;
    title: string;
    source: 'event' | 'planner';
    category?: string;
    completed: boolean;
  }
  const todayScheduleItems: ScheduleItem[] = [
    ...todayEvents.map(e => ({
      id: e.id,
      time: e.startTime || '09:00',
      title: e.title,
      source: 'event' as const,
      category: categoryOf(e),
      completed: false,
    })),
    ...todayPlannerBlocks.map(b => ({
      id: b.id,
      time: b.time || '12:00',
      title: b.title,
      source: 'planner' as const,
      category: undefined,
      completed: Boolean(b.completed),
    })),
  ].sort((a, b) => a.time.localeCompare(b.time));

  const reminderTodos = todos
    .filter(t => !t.completed && (t.status ? t.status !== 'completada' : true) && Boolean(t.dueDate))
    .sort((a, b) => (a.dueDate! > b.dueDate! ? 1 : -1))
    .slice(0, 4);

  const sortedNotes = [...notes].sort((a, b) => {
    const dateA = a.updatedAt || a.createdAt || '';
    const dateB = b.updatedAt || b.createdAt || '';
    return dateB.localeCompare(dateA);
  });
  const latestNote = sortedNotes[0] ?? null;

  // Compute week of the year
  const currentWeekNumber = isoWeekNumber(now);
  const semester = semesterLabel(now);
  const storageBytes = StorageService.getProfileStorageBytes(profile.id);

  const handleToggleTodo = (id: string) => {
    StorageService.toggleTodo(profile.id, id);
    loadData();
  };

  const handleAddDistraction = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newDistractionText.trim();
    // Con el campo vacío, el "+" lleva a escribir en vez de verse bloqueado.
    if (!trimmed) {
      distractionInputRef.current?.focus();
      return;
    }
    const updated = [...distractions, trimmed];
    StorageService.saveDistractions(profile.id, updated);
    setDistractions(updated);
    setNewDistractionText('');
  };

  const handleSaveDistractionEdit = () => {
    if (editingDistractionIdx === null) return;
    const trimmed = editingDistractionText.trim();
    // Vaciar el texto no borra el compromiso: para eso está la X.
    if (trimmed) {
      const updated = distractions.map((item, idx) => (idx === editingDistractionIdx ? trimmed : item));
      StorageService.saveDistractions(profile.id, updated);
      setDistractions(updated);
    }
    setEditingDistractionIdx(null);
  };

  const handleRemoveDistraction = (index: number) => {
    // La edición se ubica por índice (los compromisos son strings sin id): borrar desplaza los índices, así que se cierra.
    setEditingDistractionIdx(null);
    const updated = distractions.filter((_, idx) => idx !== index);
    StorageService.saveDistractions(profile.id, updated);
    setDistractions(updated);
  };

  const handleSaveReflection = () => {
    const hasText = reflection1.trim() || reflection2.trim() || reflection3.trim();
    if (!hasText) {
      sileo.error({ title: 'Escribe al menos una línea en la reflexión antes de guardar' });
      return;
    }

    const lines: string[] = [];
    if (reflection1.trim()) {
      lines.push('### ¿Qué salió bien hoy?');
      lines.push(reflection1.trim());
    }
    if (reflection2.trim()) {
      lines.push('### ¿Qué puedo mejorar?');
      lines.push(reflection2.trim());
    }
    if (reflection3.trim()) {
      lines.push('### ¿Cuál será mi primer paso mañana?');
      lines.push(reflection3.trim());
    }

    const newNote: Note = {
      id: `note-${Date.now()}-${crypto.getRandomValues(new Uint32Array(1))[0].toString(36).slice(0, 5)}`,
      profileId: profile.id,
      title: `Reflexión diaria: ${formatHeroDate(now)}`,
      content: lines.join('\n\n'),
      tags: ['reflexion-diaria', 'cierre-jornada'],
      isReflection: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    StorageService.saveNote(newNote);
    setNotes(StorageService.getNotes(profile.id));
    setReflection1('');
    setReflection2('');
    setReflection3('');
    sileo.success({ title: 'Pliego reflexivo guardado en tu cuaderno de notas' });
  };

  const habitsComplianceRate = computeHabitsCompliance(habits);

  const handleToggleHabitDay = (habitId: string, dayIndex: number) => {
    StorageService.toggleHabitDay(profile.id, habitId, dayIndex);
    setHabits(StorageService.getHabits(profile.id));
  };

  const handleOpenAddHabit = () => {
    setEditingHabit(null);
    setIsHabitModalOpen(true);
  };

  const handleOpenEditHabit = (h: HabitTrackerItem) => {
    setEditingHabit(h);
    setIsHabitModalOpen(true);
  };

  const handleSaveHabit = (data: { id?: string; name: string; category?: string }) => {
    if (data.id) {
      const existing = habits.find(h => h.id === data.id);
      if (existing) {
        StorageService.saveHabit({ ...existing, name: data.name, category: data.category });
      }
    } else {
      const newHabit: HabitTrackerItem = {
        id: `habit-${Date.now()}`,
        profileId: profile.id,
        name: data.name,
        category: data.category || 'General',
        daysCompleted: [false, false, false, false, false, false, false],
      };
      StorageService.saveHabit(newHabit);
    }
    setHabits(StorageService.getHabits(profile.id));
    setIsHabitModalOpen(false);
  };

  const handleDeleteHabit = (habitId: string) => {
    StorageService.deleteHabit(profile.id, habitId);
    setHabits(StorageService.getHabits(profile.id));
    setIsHabitModalOpen(false);
  };

  return (
    <div className={styles.dashboardContainer}>
      {/* =====================================================================
          1. CABECERA EDITORIAL & POST-IT ARTESANAL (Hero Card)
          ===================================================================== */}
      <section className={styles.heroCard} aria-labelledby="dash-greeting">
        <div className={styles.heroGrid}>
          {/* Left Column: fecha como hoja de calendario (DESIGN.md §0.5) */}
          <div className={styles.heroLeftCol}>
            {/* Encabezado esencial: en móvil es lo único del hero que va antes de las tareas */}
            <div className={styles.heroHead}>
              <div className={styles.fechaBloque}>
                <Papel as="div" forma="pieza" tinte="arena" className={styles.fechaHoja} aria-hidden="true">
                  <span className={styles.fechaNumero}>{now.getDate()}</span>
                </Papel>
                <div className={styles.fechaTexto}>
                  <p className={styles.metaSemana}>Semana {currentWeekNumber} · Semestre {semester}</p>
                  <h1 className={styles.heroDate} aria-label={formatHeroDate(now)}>
                    {weekdayFormatter.format(now)} de {monthFormatter.format(now)}
                  </h1>
                  <span className={styles.fechaSubrayado} aria-hidden="true" />
                </div>
              </div>
              <h2 id="dash-greeting" className={styles.heroTitle}>
                {greetingFor(now)}, {profile.name}.
              </h2>
              <p className={styles.heroSubtitle}>
                <em>ordena tu mente. cuida tu energía.</em> Aquí está el pulso de tu día y lo que no puede esperar.
              </p>
              <ul className={styles.heroChips} aria-label="Resumen">
                <li className={styles.chip}>{countLabel(pendingCount, 'pendiente', 'pendientes')}</li>
                <li className={`${styles.chip} ${styles.chipCritical}`}>{countLabel(criticalCount, 'crítico', 'críticos')}</li>
              </ul>
            </div>

            <blockquote className={styles.heroAphorism}>
              <Quote className={styles.aphorismQuoteIcon} size={22} aria-hidden="true" />
              <p className={styles.aphorismText}>
                «El orden no es una restricción, es el espacio donde florecen tus ideas y tu calma. Un renglón a la vez, sin prisa pero sin pausa.»
              </p>
            </blockquote>
          </div>

          {/* Right Column: Tactile Post-it Note taped with Brass Paperclip */}
          <div className={styles.heroRightCol}>
            <div className={styles.tactilePostIt}>
              {/* Dual ring brass paperclip */}
              <div className={styles.brassPaperclip} aria-hidden="true">
                <div className={styles.brassInnerLoop} />
              </div>
              <div className={styles.postItContent}>
                <span className={styles.postItMottoLabel}>lema del día</span>
                <p className={styles.postItHandwriting}>
                  Disciplina hoy,<br />paz mañana.
                </p>
                <div className={styles.postItFooter}>
                  <Heart size={14} className={styles.postItHeart} aria-hidden="true" />
                  <span className={styles.postItState}>espíritu calmado</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de 4 Acciones Instantáneas ('A un solo clic') */}
        <div className={styles.quickSection} aria-labelledby="dash-quick">
          <div className={styles.quickHeader}>
            <h3 id="dash-quick" className={styles.sectionLabel}>
              <Zap size={16} className={styles.quickHeaderIcon} aria-hidden="true" />
              <span>A un solo clic</span>
            </h3>
            <span className={styles.quickSubtext}>Respaldado en memoria local</span>
          </div>

          <div className={styles.quickGrid}>
            <button type="button" className={`${styles.quickBtn} ${styles.quickBtnTask}`} onClick={() => onNavigate('todo')}>
              <div className={`${styles.quickIconBox} ${styles.quickIconTask}`} aria-hidden="true">
                <ListPlus size={20} />
              </div>
              <div className={styles.quickText}>
                <span className={styles.quickTitle}>Nueva tarea</span>
                <span className={styles.quickHint}>To-Do inmediato</span>
              </div>
            </button>

            <button type="button" className={`${styles.quickBtn} ${styles.quickBtnEvent}`} onClick={() => onNavigate('agenda')}>
              <div className={`${styles.quickIconBox} ${styles.quickIconEvent}`} aria-hidden="true">
                <CalendarPlus size={20} />
              </div>
              <div className={styles.quickText}>
                <span className={styles.quickTitle}>Nuevo evento</span>
                <span className={styles.quickHint}>Horarios y citas</span>
              </div>
            </button>

            <button
              type="button"
              className={`${styles.quickBtn} ${styles.quickBtnNote}`}
              onClick={() => (onOpenReflection ? onOpenReflection() : onNavigate('notes'))}
            >
              <div className={`${styles.quickIconBox} ${styles.quickIconNote}`} aria-hidden="true">
                <BookOpen size={20} />
              </div>
              <div className={styles.quickText}>
                <span className={styles.quickTitle}>Nueva reflexión</span>
                <span className={styles.quickHint}>Bitácora y calma</span>
              </div>
            </button>

            <button
              type="button"
              className={`${styles.quickBtn} ${styles.quickBtnLink}`}
              onClick={() => (onOpenLink ? onOpenLink() : onNavigate('folders'))}
            >
              <div className={`${styles.quickIconBox} ${styles.quickIconLink}`} aria-hidden="true">
                <LinkIcon size={20} />
              </div>
              <div className={styles.quickText}>
                <span className={styles.quickTitle}>Nuevo enlace / doc</span>
                <span className={styles.quickHint}>Recursos y vínculos</span>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* =====================================================================
          1b. FRANJA DE MÉTRICAS DE SERENIDAD (cuatro indicadores en una fila)
          ===================================================================== */}
      <MetricsStrip
        habitStreak={habitStreak}
        netFocus={netFocus}
        storageBytes={storageBytes}
        taskPerf={taskPerf}
        weekHabitDays={computeWeekHabitDays(habits)}
        todayHabitIdx={todayHabitIdx}
      />

      {/* =====================================================================
          2. BENTO TRILOGÍA DE SERENIDAD & ENERGY PHASES
          ===================================================================== */}
      <section className={styles.bentoTrio}>
        {/* Card 1: Energy Check & Fases */}
        <div className={styles.bentoCard}>
          <div className={styles.bentoCardHeader}>
            <span className={styles.bentoTag}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.4 5.4 0 0 1-4.4 2.26 5.4 5.4 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z" />
              </svg>
              <span>Energía y fases</span>
            </span>
            <span className={styles.bentoBadge}>Luna Creciente</span>
          </div>

          <div className={styles.lunarCycleVisualizer} aria-label="Fases lunares">
            <svg viewBox="0 0 24 24" className={styles.moonVector} aria-hidden="true">
              <title>Nueva</title>
              <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
            </svg>
            <svg viewBox="0 0 24 24" className={styles.moonVector} aria-hidden="true">
              <title>Creciente</title>
              <path d="M12 4a8 8 0 1 0 8 8c0-.4-.04-.8-.1-1.2a4.8 4.8 0 0 1-3.9 2 4.8 4.8 0 0 1-2.8-8.7c-.4-.06-.8-.1-1.2-.1z" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <svg viewBox="0 0 24 24" className={`${styles.moonVector} ${styles.moonVectorActive}`} aria-hidden="true">
              <title>Gibosa Creciente (Hoy)</title>
              <path d="M12 3a9 9 0 0 1 9 9 9 9 0 0 1-9 9 9 9 0 0 1-9-9 9 9 0 0 1 9-9z" fill="var(--color-primary-soft)" opacity="0.35" />
              <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.4 5.4 0 0 1-4.4 2.26 5.4 5.4 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z" fill="var(--color-primary)" />
              <circle cx="12" cy="12" r="9" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" />
            </svg>
            <svg viewBox="0 0 24 24" className={styles.moonVector} aria-hidden="true">
              <title>Luna Llena</title>
              <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
              <circle cx="12" cy="12" r="3.5" fill="currentColor" opacity="0.3" />
            </svg>
            <svg viewBox="0 0 24 24" className={styles.moonVector} aria-hidden="true">
              <title>Menguante</title>
              <path d="M12 4a8 8 0 0 1-8 8c0 .4.04.8.1 1.2a4.8 4.8 0 0 0 3.9 2 4.8 4.8 0 0 0 2.8-8.7c.4-.06.8-.1 1.2-.1z" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>

          <p className={styles.clarityQuestion}>¿Cómo está tu nivel de claridad hoy?</p>

          <div className={styles.energySelector}>
            <button
              type="button"
              className={energyBtnClass(energyState === 'plena')}
              onClick={() => setEnergyState('plena')}
            >
              <Leaf size={18} className={styles.energyEmoji} aria-hidden="true" />
              <span className={styles.energyLabel}>Plena</span>
            </button>
            <button
              type="button"
              className={energyBtnClass(energyState === 'calma')}
              onClick={() => setEnergyState('calma')}
            >
              <Coffee size={18} className={styles.energyEmoji} aria-hidden="true" />
              <span className={styles.energyLabel}>En Calma</span>
            </button>
            <button
              type="button"
              className={energyBtnClass(energyState === 'neutra')}
              onClick={() => setEnergyState('neutra')}
            >
              <Cloud size={18} className={styles.energyEmoji} aria-hidden="true" />
              <span className={styles.energyLabel}>Neutra</span>
            </button>
            <button
              type="button"
              className={energyBtnClass(energyState === 'cansada')}
              onClick={() => setEnergyState('cansada')}
            >
              <BatteryLow size={18} className={styles.energyEmoji} aria-hidden="true" />
              <span className={styles.energyLabel}>Cansada</span>
            </button>
          </div>

          <div className={styles.bentoCardFooter}>
            <span>Registro mental diario</span>
            <span className={styles.statusStable}>
              <span className={styles.statusStableDot} />
              <span>Estable</span>
            </span>
          </div>
        </div>

        {/* Card 3: Hábitos Semanales */}
        <div className={styles.bentoCard}>
          <div className={styles.bentoCardHeader}>
            <span className={styles.bentoTag}>
              <CheckCircle size={16} aria-hidden="true" />
              <span>Hábitos Semanales</span>
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                className={styles.addHabitBtn}
                onClick={handleOpenAddHabit}
                aria-label="Añadir nuevo hábito"
              >
                + Hábito
              </button>
            </div>
          </div>

          <div className={styles.habitRowsList}>
            {habits.length === 0 ? (
              <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--color-muted)' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: 'var(--text-body-sm)' }}>Sin hábitos registrados aún</p>
                <button
                  type="button"
                  className={styles.addHabitBtn}
                  onClick={handleOpenAddHabit}
                  aria-label="Añadir primer hábito"
                >
                  + Añadir primer hábito
                </button>
              </div>
            ) : (
              habits.map((h) => {
                const HabitIcon = getHabitIcon(h.category);
                return (
                  <div key={h.id} className={styles.habitRowItem}>
                    <div className={styles.habitInfo}>
                      <button
                        type="button"
                        className={styles.habitEditBtn}
                        onClick={() => handleOpenEditHabit(h)}
                        title="Editar hábito"
                        aria-label={`Editar hábito ${h.name}`}
                      >
                        <HabitIcon size={15} className={styles.habitIcon} aria-hidden="true" />
                        <span className={styles.habitTitle}>{h.name}</span>
                      </button>
                    </div>
                    <div className={styles.habitPillsRow}>
                      {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((dayLetter, dayIdx) => {
                        const isCompleted = Boolean(h.daysCompleted?.[dayIdx]);
                        return (
                          <button
                            key={dayIdx}
                            type="button"
                            className={isCompleted ? styles.habitPillChecked : styles.habitPillEmpty}
                            onClick={() => handleToggleHabitDay(h.id, dayIdx)}
                            aria-label={`Marcar ${dayLetter} para ${h.name}`}
                          >
                            {isCompleted ? '✓' : dayLetter}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className={styles.bentoCardFooter}>
            <span>Cumplimiento: {habitsComplianceRate}%</span>
            <span className={styles.statusSuccess}>Semana #{currentWeekNumber} en curso</span>
          </div>
        </div>
      </section>

      {/* =====================================================================
          3. MAIN LAYOUT GRID (7 cols / 5 cols)
          ===================================================================== */}
      <div className={styles.mainLayoutGrid}>
        {/* Columna Izquierda: Foco, Prioridades, Distracciones (7 cols) */}
        <div className={styles.mainLeftCol}>
          {/* Banner Today's Main Focus */}
          <FocusBanner
            focus={{ todo: activeFocusTodo, isDone: isFocusDone, areaName: focusAreaName, priorityLabel: focusPriorityLabel }}
            canChangeFocus={pendingTodosList.length > 0}
            todayStr={todayStr}
            onChangeFocus={() => setIsFocusModalOpen(true)}
            onToggleTodo={handleToggleTodo}
            onPlanFocus={() => onNavigate('todo')}
          />

          {/* Top Priorities no negociables */}
          <Pliego aria-labelledby="dash-critical">
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}>
                <h3 id="dash-critical" className={styles.cardTitle}>
                  <span>Prioridades de hoy</span>
                </h3>
                <Papel as="span" forma="pieza" tinte={TINTE_DE_MODULO.todo}>
                  <span className={styles.pestanaTexto}>No negociables</span>
                </Papel>
              </div>
              <div className={styles.cardHeaderRight}>
                <span className={styles.cardMeta}>{countLabel(criticalCount, 'crítico', 'críticos')}</span>
              </div>
            </div>

            {critical.length === 0 ? (
              <div className={styles.emptyPrioritiesState}>
                <CheckCircle size={22} className={styles.emptyPrioritiesIcon} aria-hidden="true" />
                <p className={styles.emptyPrioritiesTitle}>Todo al día • Ninguna tarea crítica pendiente</p>
                <p className={styles.emptyPrioritiesSub}>Excelente momento para avanzar en tareas secundarias o tomar una pausa consciente.</p>
                <button
                  type="button"
                  className={styles.addHabitBtn}
                  onClick={() => onNavigate('todo')}
                  aria-label="Registrar pendiente en To-Do"
                >
                  + Nueva Tarea
                </button>
              </div>
            ) : (
              <ul className={styles.list} aria-label="No olvidar">
                {critical.map((t, idx) => {
                  const due = dueLabel(t.dueDate, todayStr);
                  return (
                    <li key={t.id} className={styles.criticalRow}>
                      <span className={styles.priorityNum}>{String(idx + 1).padStart(2, '0')}.</span>
                      <input
                        type="checkbox"
                        id={`dash-todo-${t.id}`}
                        className={styles.checkbox}
                        aria-label={`completar ${t.title}`}
                        checked={t.completed}
                        onChange={() => handleToggleTodo(t.id)}
                      />
                      <div className={styles.criticalTextCol}>
                        <span className={`${styles.rowTitle} ${t.completed ? styles.rowTitleDone : ''}`}>{t.title}</span>
                        {due && <span className={styles.dueTag}>{due}</span>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <button type="button" className={styles.cardLink} onClick={() => onNavigate('todo')}>
              Ver todas las tareas →
            </button>
          </Pliego>

          {/* Compromisos sin distracciones: cartulina lisa, es lo que la persona edita */}
          <div className={styles.distractionBox}>
            <div className={styles.distractionHeader}>
              <h4 className={styles.distractionTitle}>Compromisos sin distracciones</h4>
              <span className={styles.distractionCommitment}>Compromisos ({distractions.length})</span>
            </div>
            <ul className={styles.distractionList}>
              {distractions.length === 0 ? (
                <li style={{ color: 'var(--color-muted)', fontStyle: 'italic', padding: '6px 0' }}>
                  Sin compromisos registrados. Agrega uno abajo.
                </li>
              ) : (
                occurrenceKeys(distractions).map((itemKey, idx) => {
                  const item = distractions[idx];
                  return (
                  <li key={itemKey} className={styles.distractionListItem}>
                    <span className={styles.distractionDot} />
                    {editingDistractionIdx === idx ? (
                      <input
                        ref={focusOnMount}
                        type="text"
                        className={styles.distractionInput}
                        value={editingDistractionText}
                        onChange={(e) => setEditingDistractionText(e.target.value)}
                        onBlur={handleSaveDistractionEdit}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveDistractionEdit();
                          if (e.key === 'Escape') {
                            e.stopPropagation();
                            setEditingDistractionIdx(null);
                          }
                        }}
                        aria-label={`Editar compromiso: ${item.toLowerCase()}`}
                      />
                    ) : (
                      <button
                        type="button"
                        className={styles.distractionText}
                        onClick={() => {
                          setEditingDistractionIdx(idx);
                          setEditingDistractionText(item);
                        }}
                        title="Pulsa para editar"
                      >
                        {item}
                      </button>
                    )}
                    <button
                      type="button"
                      className={styles.distractionDelBtn}
                      onClick={() => handleRemoveDistraction(idx)}
                      aria-label={`Eliminar compromiso: ${item.toLowerCase()}`}
                    >
                      <X size={14} aria-hidden="true" />
                    </button>
                  </li>
                  );
                })
              )}
            </ul>
            <form onSubmit={handleAddDistraction} className={styles.distractionForm}>
              <input
                ref={distractionInputRef}
                type="text"
                className={styles.distractionInput}
                placeholder="Nuevo compromiso (ej. Sin redes hasta las 18h)"
                aria-label="Nuevo compromiso"
                value={newDistractionText}
                onChange={(e) => setNewDistractionText(e.target.value)}
              />
              <button
                type="submit"
                className={styles.distractionAddBtn}
                aria-label="Agregar compromiso"
              >
                +
              </button>
            </form>
          </div>
        </div>

        {/* Columna Lateral Derecha: Horario, Mini Reminders y Planner (5 cols) */}
        <div className={styles.mainRightCol}>
          {/* Focus Schedule de Hoy (Eventos de hoy + Bloques de planner) */}
          <Papel as="section" tinte={TINTE_DE_MODULO.agenda} aria-labelledby="dash-events">
            <div className={styles.cardHeader}>
              <h3 id="dash-events" className={styles.cardTitle}>
                <Clock size={18} aria-hidden="true" />
                <span>Horario de hoy</span>
              </h3>
              <span className={styles.cardMeta}>{countLabel(todayScheduleItems.length, 'actividad', 'actividades')}</span>
            </div>

            {todayScheduleItems.length === 0 ? (
              <div className={styles.emptyPrioritiesState} style={{ padding: '24px 16px' }}>
                <Clock size={20} className={styles.emptyPrioritiesIcon} aria-hidden="true" />
                <p className={styles.emptyPrioritiesTitle}>Día despejado • Sin eventos agendados para hoy</p>
                <p className={styles.emptyPrioritiesSub}>Puedes planificar una franja horaria de enfoque en la Agenda.</p>
                <button
                  type="button"
                  className={styles.addHabitBtn}
                  onClick={() => onNavigate('agenda')}
                  aria-label="Abrir agenda"
                >
                  + Agendar Evento
                </button>
              </div>
            ) : (
              <ul className={styles.routineTimeline} aria-label="Eventos de hoy">
                {todayScheduleItems.map((item) => (
                  <li key={item.id} className={item.completed ? styles.routineSlotDone : styles.routineSlotPending}>
                    <span className={styles.routineTime}>{item.time}</span>
                    <span className={item.completed ? styles.routineDotDone : styles.routineDotTeal} />
                    <span className={item.completed ? styles.routineTitleDone : styles.routineTitle}>
                      {item.title}
                    </span>
                    <span className={item.source === 'event' ? styles.routineStatusTag : styles.routineMutedTag}>
                      {item.category ? item.category.charAt(0).toUpperCase() + item.category.slice(1) : (item.source === 'event' ? 'Evento' : 'Bloque')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <button type="button" className={styles.cardLink} onClick={() => onNavigate('agenda')}>
              Ver agenda completa →
            </button>
          </Papel>

          {/* Recordatorios: papel del módulo To-Do */}
          <Papel tinte={TINTE_DE_MODULO.todo}>
            <div className={styles.cardHeader} style={{ marginBottom: 6 }}>
              <h4 className={styles.cardTitle} style={{ fontSize: 16 }}>
                <Bell size={16} style={{ color: 'var(--color-accent-amber)' }} aria-hidden="true" />
                <span>Recordatorios</span>
              </h4>
              <span className={styles.cardMeta}>Recordatorios ({reminderTodos.length})</span>
            </div>
            {reminderTodos.length === 0 ? (
              <p style={{ margin: 0, padding: '12px 0', fontSize: 'var(--text-body-sm)', color: 'var(--color-muted)' }}>
                Sin recordatorios con fecha próxima. Asigna fecha a tus tareas para verlas aquí.
              </p>
            ) : (
              <div className={styles.remindersList}>
                {reminderTodos.map(t => {
                  const label = dueLabel(t.dueDate, todayStr) || t.dueDate;
                  const isUrgent = label?.toLowerCase().includes('hoy') || label?.toLowerCase().includes('mañana');
                  return (
                    <div key={t.id} className={styles.reminderItem}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                        {t.title}
                      </span>
                      <span className={isUrgent ? styles.reminderDatePill : styles.reminderDatePillMuted}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Papel>

          {/* Planner de la semana */}
          <Papel as="section" tinte={TINTE_DE_MODULO.planner} aria-labelledby="dash-planner">
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
                    <span className={styles.dayTag}>{b.dayOfWeek === undefined ? 'Sin día' : WEEK_DAY_SHORT[b.dayOfWeek]}</span>
                    <span className={`${styles.rowTitle} ${b.completed ? styles.rowTitleDone : ''}`}>{b.title}</span>
                    <span className={styles.slotTag}>{b.timeSlot}</span>
                  </li>
                ))}
              </ul>
            )}
            <button type="button" className={styles.cardLink} onClick={() => onNavigate('planner')}>
              Ver planner completo →
            </button>
          </Papel>
        </div>
      </div>

      {/* =====================================================================
          4. PROGRESO POR ÁREAS TEMÁTICAS (Solapas Folder Tabs - FULL WIDTH!)
          ===================================================================== */}
      {areas.length > 0 && (
        <section
          className={styles.areasSection}
          aria-label="Áreas temáticas clave"
        >
          <div className={styles.areasHeader}>
            <div>
              <h2 id="dash-areas" className={styles.cardTitle}>
                Progreso por Áreas Temáticas
              </h2>
              <p className={styles.areasSubTitle}>
                Carpetas activas de vida y proyectos en curso (Plan {semester})
              </p>
            </div>
            <div className={styles.areasHeaderRight}>
              <span className={styles.areasMeta}>
                {countLabel(areas.length, 'área activa', 'áreas activas')}
              </span>
              <button
                type="button"
                className={styles.manageAreasBtn}
                onClick={() => onNavigate('todo')}
              >
                + Gestionar Áreas
              </button>
            </div>
          </div>

          {todos.length === 0 && (
            <p className={styles.areasEmpty}>Aún no hay tareas por área. Crea la primera en To-Do.</p>
          )}

          <div className={styles.areasGrid}>
            {(todos.length === 0 ? [] : areaSummaries).map((s, idx) => {
              const areaTodos = todos.filter(t => t.areaId === s.area.id);
              const pendingAreaTodos = areaTodos.filter(t => (t.status ? t.status !== 'completada' : !t.completed));
              const milestone1 = areaTodos[0]?.title ?? 'Sin tareas asignadas en esta carpeta';
              const milestone2 = areaTodos[1]?.title ?? 'Espacio disponible para nuevos hitos';
              const dueDates = pendingAreaTodos
                .filter(t => Boolean(t.dueDate))
                .map(t => t.dueDate!)
                .sort((a, b) => a.localeCompare(b));
              const deadline = dueDates.length > 0 ? `Plazo: ${dueDates[0]}` : 'Sin fecha límite fijada';
              const actionLabel = `Ver área`;
              const displayTitle = s.area.name;
              const displayDesc = 'Área activa de enfoque personal y seguimiento de proyectos.';

              return (
                <div key={s.area.id} className={styles.areaFolderCard}>
                  {/* Protruding Folder Tab Top Edge */}
                  <div className={styles.folderTabTop}>
                    Carpeta #{String(idx + 1).padStart(2, '0')}
                  </div>

                  <div className={styles.areaFolderBody}>
                    <div className={styles.areaFolderTopRow}>
                      <span className={styles.areaCategoryBadge} style={{
                        backgroundColor: `${s.area.color}25`,
                        // El color del área como texto baja de 4.5:1 (ámbar: 1.8:1); mezclado al 55 % con la tinta pasa con toda la paleta.
                        color: `color-mix(in srgb, ${s.area.color} 55%, var(--color-ink))`,
                      }}>
                        {s.area.name}
                      </span>
                      <span className={styles.areaPercent}>{s.completionPercentage}%</span>
                    </div>

                    <h3 className={styles.areaFolderName}>
                      {displayTitle}
                    </h3>
                    <p className={styles.areaFolderDesc}>
                      {displayDesc}
                    </p>

                    {/* Progress Bar */}
                    <div className={styles.progressBarBg} aria-hidden="true">
                      <div
                        className={styles.progressBarFill}
                        style={{ width: `${s.completionPercentage}%`, backgroundColor: s.area.color }}
                      />
                    </div>

                    {/* Milestones Checklist */}
                    <div className={styles.areaMilestones}>
                      <div className={styles.milestoneItem}>
                        {areaTodos[0] && (areaTodos[0].status === 'completada' || areaTodos[0].completed) ? (
                          <Check size={15} className={styles.milestoneCheckIcon} aria-hidden="true" />
                        ) : (
                          <span className={styles.milestonePendingDot} aria-hidden="true" />
                        )}
                        <span>{milestone1}</span>
                      </div>
                      <div className={styles.milestoneItem}>
                        {areaTodos[1] && (areaTodos[1].status === 'completada' || areaTodos[1].completed) ? (
                          <Check size={15} className={styles.milestoneCheckIcon} aria-hidden="true" />
                        ) : (
                          <span className={styles.milestonePendingDot} aria-hidden="true" />
                        )}
                        <span>{milestone2}</span>
                      </div>
                    </div>
                  </div>

                  {/* Folder Card Bottom */}
                  <div className={styles.areaFolderBottom}>
                    <div className={styles.areaMetaDetails}>
                      <span className={styles.areaDeadlineText}>{deadline}</span>
                      <span className={styles.areaPendingPill}>
                        {countLabel(s.pendingTodos, 'pendiente', 'pendientes')}
                      </span>
                    </div>

                    {/* Preserves .areaActionBtn with min-height: 44px for accessibility and tests */}
                    <button
                      type="button"
                      className={styles.areaActionBtn}
                      onClick={() => onNavigate('todo')}
                      aria-label={`Ver tareas del área ${s.area.name}`}
                    >
                      <span>{actionLabel}</span>
                      <ArrowRight size={14} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* =====================================================================
          5. NOTES / BRAIN DUMP (Parchment Paper Grid - FULL WIDTH!)
          ===================================================================== */}
      <section className={styles.notesSection} aria-labelledby="dash-notes">
        {/* Washi tape topper */}
        <div className={styles.notesWashiSlate} aria-hidden="true" />

        <div className={styles.notesCardHeader}>
          <div className={styles.notesTitleBox}>
            <h3 id="dash-notes" className={styles.notesCardTitle}>
              Notas y vaciado mental
            </h3>
            <span className={styles.notesCardTag}>Cuadrícula libre de ideas espontáneas</span>
          </div>
          <Edit size={18} className={styles.notesHeaderIcon} aria-hidden="true" />
        </div>

        <div className={styles.paperGridContainer}>
          {latestNote ? (
            <div>
              <strong style={{ display: 'block', marginBottom: '0.35rem', fontFamily: 'var(--font-heading)', color: 'var(--color-ink-primary)' }}>
                {latestNote.title}
              </strong>
              <p className={styles.notesHandwriting}>
                {latestNote.content}
              </p>
            </div>
          ) : (
            <p className={styles.notesHandwriting}>
              «Cuaderno en blanco. Pulsa + Nueva Anotación Rápida para registrar pensamientos espontáneos o notas de paso.»
            </p>
          )}
          <div className={styles.autoSaveIndicator}>
            <Check size={14} aria-hidden="true" />
            <span>Guardado automáticamente</span>
          </div>
        </div>

        <button
          type="button"
          className={styles.notesCardBtn}
          onClick={() => (onOpenReflection ? onOpenReflection() : onNavigate('notes'))}
        >
          + Nueva Anotación Rápida
        </button>
      </section>

      {/* =====================================================================
          6. CIERRE DE PLIEGO REFLEXIVO (End of day reflection ♡ - FULL WIDTH!)
          ===================================================================== */}
      <section className={styles.reflectionSection} aria-labelledby="dash-reflection">
        <div className={styles.reflectionHeader}>
          <div className={styles.reflectionTitleBox}>
            <h3 id="dash-reflection" className={styles.reflectionTitle}>
              Reflexión del día <span className={styles.reflectionHeart}>♡</span>
            </h3>
            <span className={styles.reflectionSubtext}>• Balance de la jornada</span>
          </div>
          <span className={styles.reflectionNotice}>Completar al anochecer</span>
        </div>

        {/* 3-Column Ruled Lines Grid */}
        <div className={styles.reflectionGrid3Col}>
          <div className={styles.reflectionField}>
            <label className={styles.reflectionLabel} htmlFor="reflexion-salio-bien">¿Qué salió bien hoy?</label>
            <textarea
              id="reflexion-salio-bien"
              className={styles.reflectionTextarea}
              placeholder="Escribe aquí los momentos de calma, avances o pequeñas victorias..."
              rows={3}
              value={reflection1}
              onChange={(e) => setReflection1(e.target.value)}
            />
          </div>

          <div className={styles.reflectionField}>
            <label className={styles.reflectionLabel} htmlFor="reflexion-mejorar">¿Qué puedo mejorar?</label>
            <textarea
              id="reflexion-mejorar"
              className={styles.reflectionTextarea}
              placeholder="Reconoce tropiezos con amabilidad y sin juzgarte con dureza..."
              rows={3}
              value={reflection2}
              onChange={(e) => setReflection2(e.target.value)}
            />
          </div>

          <div className={styles.reflectionField}>
            <label className={styles.reflectionLabel} htmlFor="reflexion-primer-paso">¿Cuál será mi primer paso mañana?</label>
            <textarea
              id="reflexion-primer-paso"
              className={styles.reflectionTextarea}
              placeholder="Define la primera acción precisa de las 08:00 AM..."
              rows={3}
              value={reflection3}
              onChange={(e) => setReflection3(e.target.value)}
            />
          </div>
        </div>

        {/* Closing Motto & Sovereignty Stamp */}
        <div className={styles.reflectionFooterRow}>
          <p className={styles.closingMotto}>
            « Cada paso firme de hoy construye la calma de mañana. »
          </p>

          <div className={styles.sovereigntyStamp}>
            <ShieldCheck size={16} className={styles.sovereigntyIcon} aria-hidden="true" />
            <span>Datos guardados en este navegador</span>
          </div>
        </div>

        <button
          type="button"
          className={styles.saveReflectionBtn}
          onClick={handleSaveReflection}
        >
          Guardar Pliego
        </button>
      </section>

      {/* =====================================================================
          7. MÉTRICAS Y RENDIMIENTO (FULL WIDTH!)
          ===================================================================== */}
      <section className={styles.metricsSection} aria-labelledby="dash-metrics">
        <h3 id="dash-metrics" className={styles.cardTitle}>
          <BarChart2 size={18} aria-hidden="true" />
          <span>Métricas y Rendimiento</span>
        </h3>
        <div className={styles.metricsGrid}>
          <TaskCompletionChart todos={todos} areas={areas} />
          <CategoryDistributionChart todos={todos} planner={planner} />
        </div>
      </section>

      <HabitModal
        isOpen={isHabitModalOpen}
        habit={editingHabit}
        onClose={() => setIsHabitModalOpen(false)}
        onSave={handleSaveHabit}
        onDelete={handleDeleteHabit}
      />

      {isFocusModalOpen && (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsFocusModalOpen(false);
          }}
        >
          <div className={styles.focusModalCard} role="dialog" aria-modal="true" aria-labelledby="focus-select-title">
            <div className={styles.focusModalHeader}>
              <h3 id="focus-select-title" className={styles.focusModalTitle}>Seleccionar Foco del Día</h3>
              <button
                ref={focusCloseBtnRef}
                type="button"
                className={styles.closeBtn}
                onClick={() => setIsFocusModalOpen(false)}
                aria-label="Cerrar selector de foco"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <div className={styles.focusModalBody}>
              <p className={styles.focusModalDesc}>Elige la tarea en la que volcarás tu mayor energía durante la jornada:</p>
              <div className={styles.focusModalList}>
                <button
                  type="button"
                  className={`${styles.focusModalItem} ${!pinnedFocusTodoId ? styles.focusModalItemActive : ''}`}
                  onClick={() => {
                    setPinnedFocusTodoId(null);
                    setIsFocusModalOpen(false);
                  }}
                >
                  <Target size={16} aria-hidden="true" />
                  <span>Foco automático (tarea más urgente de la lista)</span>
                </button>
                {pendingTodosList.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`${styles.focusModalItem} ${pinnedFocusTodoId === t.id ? styles.focusModalItemActive : ''}`}
                    onClick={() => {
                      setPinnedFocusTodoId(t.id);
                      setIsFocusModalOpen(false);
                    }}
                  >
                    <CheckCircle size={16} aria-hidden="true" />
                    <span style={{ textAlign: 'left', flex: 1 }}>{t.title}</span>
                    <span className={styles.priorityHighBadge} style={{ fontSize: '10px' }}>{t.priority}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
