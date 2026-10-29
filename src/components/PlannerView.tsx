import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useHoy } from '../utils/useHoy';
import { ChevronLeft, ChevronRight, Eraser, Plus } from 'lucide-react';
import { sileo } from 'sileo';
import type { PlannerBlock, DayOfWeek, TimeSlot, Priority, Profile, ViewType, HabitTrackerItem } from '../types';
import { StorageService } from '../services/storage';
import { PlannerDayColumn } from './planner/PlannerDayColumn';
import { PlannerBlockModal } from './planner/PlannerBlockModal';
import { GoalsDrawer } from './planner/GoalsDrawer';
import { HabitModal } from './habits/HabitModal';
import { Papel } from './common/Papel';
import { TINTE_DE_MODULO } from './common/tintes';
import { Pliego } from './common/Pliego';
import { isoWeekNumber, toLocalDateStr } from '../utils/localDate';
import { ENERGY_LEVELS, DEFAULT_ENERGY_VALUE, energyLabel } from '../utils/energyLevels';
import styles from './PlannerView.module.css';

// Mismo orden que `daysCompleted` de los hábitos: lunes a domingo.
const HABIT_DAYS = [
  { letter: 'L', name: 'lunes' },
  { letter: 'M', name: 'martes' },
  { letter: 'X', name: 'miércoles' },
  { letter: 'J', name: 'jueves' },
  { letter: 'V', name: 'viernes' },
  { letter: 'S', name: 'sábado' },
  { letter: 'D', name: 'domingo' },
];

interface PlannerViewProps {
  profileId?: string;
  profile?: Profile;
  onNavigate?: (view: ViewType) => void;
}

export const PlannerView: React.FC<PlannerViewProps> = ({ profileId: propProfileId, profile }) => {
  const hoy = useHoy();
  const profileId = profile?.id ?? propProfileId ?? '';
  const [blocks, setBlocks] = useState<PlannerBlock[]>(() => StorageService.getPlanner(profileId));
  const weekPriorities = StorageService.getTodos(profileId)
    .filter(t => t.status !== 'completada' && t.priority === 'alta')
    .slice(0, 3);
  const [weekOffset, setWeekOffset] = useState(0);
  const [priorityFilter, setPriorityFilter] = useState<'todas' | Priority>('todas');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | undefined>(1);
  const isFirstMount = useRef(true);
  const todayStr = toLocalDateStr(hoy);
  const [energyLevel, setEnergyLevel] = useState<string>(() => StorageService.getTodayMood(profileId, todayStr) || DEFAULT_ENERGY_VALUE);
  const [habits, setHabits] = useState<HabitTrackerItem[]>(() => StorageService.getHabits(profileId));
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<HabitTrackerItem | null>(null);

  const loadBlocks = useCallback(() => {
    setBlocks(StorageService.getPlanner(profileId));
    setHabits(StorageService.getHabits(profileId));
  }, [profileId]);

  const handleToggleHabitDay = (habitId: string, dayIndex: number) => {
    StorageService.toggleHabitDay(profileId, habitId, dayIndex);
    setHabits(StorageService.getHabits(profileId));
  };

  const handleOpenHabit = (habit: HabitTrackerItem | null) => {
    setEditingHabit(habit);
    setIsHabitModalOpen(true);
  };

  const handleSaveHabit = (data: { id?: string; name: string; category?: string }) => {
    const existing = data.id ? habits.find(h => h.id === data.id) : undefined;
    if (existing) {
      StorageService.saveHabit({ ...existing, name: data.name, category: data.category });
    } else {
      StorageService.saveHabit({
        id: `habit-${Date.now()}`,
        profileId,
        name: data.name,
        category: data.category || 'General',
        daysCompleted: [false, false, false, false, false, false, false],
      });
    }
    setHabits(StorageService.getHabits(profileId));
    setIsHabitModalOpen(false);
  };

  const handleDeleteHabit = (habitId: string) => {
    StorageService.deleteHabit(profileId, habitId);
    setHabits(StorageService.getHabits(profileId));
    setIsHabitModalOpen(false);
  };

  const handleSelectEnergy = (value: string) => {
    setEnergyLevel(value);
    StorageService.setTodayMood(profileId, todayStr, value);
  };

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    loadBlocks();
  }, [loadBlocks]);

  const { weekDays, weekLabel } = useMemo(() => {
    const now = hoy;
    const currentDay = now.getDay();
    const distToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(now);
    monday.setDate(now.getDate() + distToMonday + weekOffset * 7);

    const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const dayNums: DayOfWeek[] = [1, 2, 3, 4, 5, 6, 0];

    const days = dayNums.map((dayOfWeek, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      const dayNum = d.getDate();
      const monthShort = d.toLocaleString('es-ES', { month: 'short' });
      return {
        dayOfWeek,
        name: dayNames[idx],
        dateLabel: `${dayNum} ${monthShort}`,
        isToday: d.toDateString() === now.toDateString(),
      };
    });

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const label = `${monday.getDate()} ${monday.toLocaleString('es-ES', { month: 'short' })} – ${sunday.getDate()} ${sunday.toLocaleString('es-ES', { month: 'short' })} ${sunday.getFullYear()}`;

    return { weekDays: days, weekLabel: label };
  }, [weekOffset, hoy]);

  const totalBlocks = blocks.length;
  const completedBlocks = blocks.filter(b => b.completed).length;
  const fulfillment = totalBlocks > 0 ? Math.round((completedBlocks / totalBlocks) * 100) : 0;

  const handleOpenModal = (day?: DayOfWeek) => {
    setSelectedDay(day);
    setIsModalOpen(true);
  };

  const handleSaveBlock = (data: {
    title: string;
    dayOfWeek?: DayOfWeek;
    timeSlot: TimeSlot;
    priority: Priority;
    time?: string;
    notes?: string;
  }) => {
    const newBlock: PlannerBlock = {
      id: `pb-${Date.now()}`,
      profileId,
      period: 'semanal',
      timeSlot: data.timeSlot,
      title: data.title,
      priority: data.priority,
      completed: false,
      dayOfWeek: data.dayOfWeek,
      time: data.time,
      notes: data.notes,
    };

    StorageService.savePlanner(newBlock);
    sileo.success({ title: 'Bloque de enfoque guardado' });
    loadBlocks();
  };

  const handleToggleBlock = (block: PlannerBlock) => {
    StorageService.savePlanner({
      ...block,
      completed: !block.completed,
    });
    sileo.info({ title: block.completed ? 'Bloque reabierto' : 'Bloque completado' });
    loadBlocks();
  };

  const handleDeleteBlock = (id: string) => {
    StorageService.deletePlanner(profileId, id);
    sileo.success({ title: 'Bloque eliminado' });
    loadBlocks();
  };

  const handleClearWeek = () => {
    const weeklyCount = blocks.filter(b => b.period === 'semanal').length;
    if (weeklyCount === 0) {
      sileo.info({ title: 'No hay bloques que limpiar' });
      return;
    }
    if (!window.confirm(`Se borrarán los ${weeklyCount} bloques de la semana. ¿Continuar?`)) return;
    StorageService.clearWeeklyPlanner(profileId);
    sileo.success({ title: 'Semana limpia' });
    loadBlocks();
  };

  const filteredBlocks = priorityFilter === 'todas'
    ? blocks
    : blocks.filter(b => b.priority === priorityFilter);

  const legacyBlocks = filteredBlocks.filter(b => b.dayOfWeek === undefined);

  return (
    <div className={styles.plannerWrapper}>
      {/* Cabecera Editorial Stitch */}
      <div className={styles.editorialHeader}>
        <div className={styles.headerLeft}>
          <Papel as="span" forma="pieza" tinte={TINTE_DE_MODULO.planner} className={styles.weekTag}>
            Semana {isoWeekNumber(hoy)}
          </Papel>
          <h1 className={styles.plannerMainHeading}>plan de enfoque y agenda semanal.</h1>
          <h2 className={styles.pageTitle}>Planner Semanal</h2>
        </div>

        {/* Post-it manuscrito con chincheta */}
        <div className={styles.stickyAphorism}>
          <div className={styles.brassPin} aria-hidden="true" />
          <p className={styles.stickyText}>Disciplina hoy, paz mañana.</p>
        </div>
      </div>

      {/* Píldoras de Filtro por Área y Botón Principal */}
      <div className={styles.areaFilterBar}>
        <div className={styles.areaTagsGroup}>
          <span className={styles.areaPillAmber}>01. Estudios</span>
          <span className={styles.areaPillEmerald}>02. Personal</span>
          <span className={styles.areaPillViolet}>03. Universidad</span>
        </div>

        <div className={styles.heroActions}>
          <button type="button" className={styles.clearWeekBtn} onClick={handleClearWeek}>
            <Eraser size={16} aria-hidden="true" />
            <span>Limpiar semana</span>
          </button>
          <button
            type="button"
            className={styles.addBlockHeroBtn}
            onClick={() => handleOpenModal(1)}
          >
            <Plus size={16} aria-hidden="true" />
            <span>+ Agregar Bloque de Enfoque</span>
          </button>
        </div>
      </div>

      {/* Subheader con Navegación, Cinta Marcapáginas y Filtros */}
      <header className={styles.subHeader}>
        <div className={styles.leftGroup}>
          <div className={styles.weekNavGroup}>
            <button
              type="button"
              className={styles.navBtn}
              onClick={() => setWeekOffset(prev => prev - 1)}
              aria-label="Semana anterior"
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={styles.todayBtn}
              onClick={() => setWeekOffset(0)}
              aria-label="Hoy"
            >
              Hoy
            </button>
            <span className={styles.weekLabel}>{weekLabel}</span>
            <button
              type="button"
              className={styles.navBtn}
              onClick={() => setWeekOffset(prev => prev + 1)}
              aria-label="Semana siguiente"
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>

          <div className={styles.priorityGroup} role="group" aria-label="Filtro de prioridades">
            <button
              type="button"
              className={`${styles.priorityPill} ${priorityFilter === 'todas' ? styles.priorityPillActive : ''}`}
              onClick={() => setPriorityFilter('todas')}
              aria-pressed={priorityFilter === 'todas'}
              aria-label="Todas las prioridades"
            >
              Todas
            </button>
            <button
              type="button"
              className={`${styles.priorityPill} ${priorityFilter === 'alta' ? styles.priorityPillActive : ''}`}
              onClick={() => setPriorityFilter('alta')}
              aria-pressed={priorityFilter === 'alta'}
              aria-label="Prioridad Alta"
            >
              Alta
            </button>
            <button
              type="button"
              className={`${styles.priorityPill} ${priorityFilter === 'media' ? styles.priorityPillActive : ''}`}
              onClick={() => setPriorityFilter('media')}
              aria-pressed={priorityFilter === 'media'}
              aria-label="Prioridad Media"
            >
              Media
            </button>
            <button
              type="button"
              className={`${styles.priorityPill} ${priorityFilter === 'baja' ? styles.priorityPillActive : ''}`}
              onClick={() => setPriorityFilter('baja')}
              aria-pressed={priorityFilter === 'baja'}
              aria-label="Prioridad Baja"
            >
              Baja
            </button>
          </div>
        </div>

        <div className={styles.rightGroup}>
          <div className={styles.fulfillmentCard}>
            <span className={styles.fulfillmentLabel}>Cumplimiento:</span>
            <div className={styles.fulfillmentBarBg} role="progressbar" aria-valuenow={fulfillment} aria-valuemin={0} aria-valuemax={100}>
              <div className={styles.fulfillmentBarFill} style={{ width: `${fulfillment}%` }} />
            </div>
            <span className={styles.fulfillmentScore}>{fulfillment}%</span>
          </div>
        </div>
      </header>

      {/* Grid Principal & Barra Lateral Stitch */}
      <div className={styles.mainContent}>
        <section className={styles.gridArea} aria-label="Grilla semanal de bloques">
          <Pliego as="div" className={styles.weekPliego}>
          <div className={styles.weeklyGrid}>
            {legacyBlocks.length > 0 && (
              <PlannerDayColumn
                key="col-legacy"
                dayName="Sin día asignado"
                dateLabel="Legado"
                blocks={legacyBlocks}
                onAddBlock={() => handleOpenModal(undefined)}
                onToggleBlock={handleToggleBlock}
                onDeleteBlock={handleDeleteBlock}
              />
            )}

            {weekDays.map(day => (
              <PlannerDayColumn
                key={day.dayOfWeek}
                dayName={day.name}
                dateLabel={day.dateLabel}
                isToday={day.isToday}
                blocks={filteredBlocks.filter(b => b.dayOfWeek === day.dayOfWeek)}
                onAddBlock={() => handleOpenModal(day.dayOfWeek)}
                onToggleBlock={handleToggleBlock}
                onDeleteBlock={handleDeleteBlock}
              />
            ))}
          </div>
          </Pliego>
        </section>

        <aside className={styles.drawerArea}>
          {/* Top Priorities con clip dorado */}
          <div className={styles.topPrioritiesCard}>
            <h3 className={styles.topPrioritiesTitle}>PRIORIDADES DE LA SEMANA</h3>
            <ul className={styles.prioritiesList}>
              {weekPriorities.length === 0 ? (
                <li className={styles.priorityItem}>
                  <span>Sin prioridades registradas. Agrégalas en To-Do.</span>
                </li>
              ) : (
                weekPriorities.map((t, idx) => (
                  <li key={t.id} className={styles.priorityItem}>
                    <span className={styles.priorityBox}>{String(idx + 1).padStart(2, '0')}</span>
                    <span>{t.title}</span>
                  </li>
                ))
              )}
            </ul>
          </div>

          {/* Hábitos: los mismos que el Dashboard (clave `habits`) */}
          <div className={styles.habitTrackerCard}>
            <div className={styles.habitHeader}>
              <h3 className={styles.habitTrackerTitle}>HÁBITOS DE LA SEMANA</h3>
              <button
                type="button"
                className={styles.addHabitBtn}
                onClick={() => handleOpenHabit(null)}
                aria-label="Añadir hábito"
              >
                <Plus size={16} aria-hidden="true" />
              </button>
            </div>
            {habits.length === 0 ? (
              <p className={styles.habitEmpty}>Sin hábitos registrados. Añade el primero con el botón +.</p>
            ) : (
              habits.map(habit => (
                <div key={habit.id} className={styles.habitRow}>
                  <button
                    type="button"
                    className={styles.habitName}
                    onClick={() => handleOpenHabit(habit)}
                    aria-label={`Editar hábito ${habit.name}`}
                  >
                    {habit.name}
                  </button>
                  <div className={styles.daysCircles}>
                    {HABIT_DAYS.map((day, idx) => {
                      const done = Boolean(habit.daysCompleted?.[idx]);
                      return (
                        <button
                          key={day.letter + idx}
                          type="button"
                          className={`${styles.dayCircle} ${done ? styles.dayCircleChecked : ''}`}
                          onClick={() => handleToggleHabitDay(habit.id, idx)}
                          aria-pressed={done}
                          aria-label={`${habit.name}: ${day.name}`}
                        >
                          <span className={styles.dayDot}>{day.letter}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Energía del día: la misma que To-Do (clave `daily_energy`) */}
          <div className={styles.moodCard}>
            <h4 className={styles.moodTitle}>ENERGÍA DE HOY · {energyLabel(energyLevel).toUpperCase()}</h4>
            <div className={styles.moodIcons}>
              {ENERGY_LEVELS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  className={`${styles.moodBtn} ${energyLevel === value ? styles.moodBtnActive : ''}`}
                  onClick={() => handleSelectEnergy(value)}
                  aria-label={`Energía ${label}`}
                  aria-pressed={energyLevel === value}
                >
                  <Icon size={16} aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>

          {/* Goals Drawer preservado */}
          <GoalsDrawer profileId={profileId} onGoalsChange={loadBlocks} />
        </aside>
      </div>

      <HabitModal
        isOpen={isHabitModalOpen}
        habit={editingHabit}
        onClose={() => setIsHabitModalOpen(false)}
        onSave={handleSaveHabit}
        onDelete={handleDeleteHabit}
      />

      {isModalOpen && (
        <PlannerBlockModal
          key={`${selectedDay ?? 'none'}`}
          isOpen={isModalOpen}
          initialDay={selectedDay}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveBlock}
        />
      )}
    </div>
  );
};
