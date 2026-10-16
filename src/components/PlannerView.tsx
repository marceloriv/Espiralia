import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { sileo } from 'sileo';
import type { PlannerBlock, DayOfWeek, TimeSlot, Priority } from '../types';
import { StorageService } from '../services/storage';
import { PlannerDayColumn } from './planner/PlannerDayColumn';
import { PlannerBlockModal } from './planner/PlannerBlockModal';
import { GoalsDrawer } from './planner/GoalsDrawer';
import styles from './PlannerView.module.css';

interface PlannerViewProps {
  profileId: string;
}

export const PlannerView: React.FC<PlannerViewProps> = ({ profileId }) => {
  const [blocks, setBlocks] = useState<PlannerBlock[]>(() => StorageService.getPlanner(profileId));
  const [weekOffset, setWeekOffset] = useState(0);
  const [priorityFilter, setPriorityFilter] = useState<'todas' | Priority>('todas');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | undefined>(1);
  const isFirstMount = useRef(true);

  const loadBlocks = useCallback(() => {
    setBlocks(StorageService.getPlanner(profileId));
  }, [profileId]);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    loadBlocks();
  }, [loadBlocks]);

  const { weekDays, weekLabel } = useMemo(() => {
    const now = new Date();
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
      };
    });

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const label = `${monday.getDate()} ${monday.toLocaleString('es-ES', { month: 'short' })} – ${sunday.getDate()} ${sunday.toLocaleString('es-ES', { month: 'short' })} ${sunday.getFullYear()}`;

    return { weekDays: days, weekLabel: label };
  }, [weekOffset]);

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

  const filteredBlocks = priorityFilter === 'todas'
    ? blocks
    : blocks.filter(b => b.priority === priorityFilter);

  const legacyBlocks = filteredBlocks.filter(b => b.dayOfWeek === undefined);

  return (
    <div className={styles.plannerWrapper}>
      <header className={styles.subHeader}>
        <div className={styles.leftGroup}>
          <h2 className={styles.pageTitle}>Planner Semanal</h2>

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

      <div className={styles.mainContent}>
        <main className={styles.gridArea} aria-label="Grilla semanal de bloques">
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
                blocks={filteredBlocks.filter(b => b.dayOfWeek === day.dayOfWeek)}
                onAddBlock={() => handleOpenModal(day.dayOfWeek)}
                onToggleBlock={handleToggleBlock}
                onDeleteBlock={handleDeleteBlock}
              />
            ))}
          </div>
        </main>

        <aside className={styles.drawerArea}>
          <GoalsDrawer profileId={profileId} onGoalsChange={loadBlocks} />
        </aside>
      </div>

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
