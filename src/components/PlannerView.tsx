import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Trash2, Sun, Sunset, Moon, Target } from 'lucide-react';
import { sileo } from 'sileo';
import type { PlannerBlock, PlannerPeriod, TimeSlot, Priority } from '../types';
import { StorageService } from '../services/storage';
import styles from './PlannerView.module.css';

interface PlannerViewProps {
  profileId: string;
}

export const PlannerView: React.FC<PlannerViewProps> = ({ profileId }) => {
  const [period, setPeriod] = useState<PlannerPeriod>('semanal');
  const [blocks, setBlocks] = useState<PlannerBlock[]>(() => StorageService.getPlanner(profileId));
  const [title, setTitle] = useState('');
  const [timeSlot, setTimeSlot] = useState<TimeSlot>('mañana');
  const [priority, setPriority] = useState<Priority>('alta');
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

  const handleAddBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newBlock: PlannerBlock = {
      id: `pb-${Date.now()}`,
      profileId,
      period,
      timeSlot,
      title: title.trim(),
      priority,
      completed: false,
    };

    StorageService.savePlanner(newBlock);
    setTitle('');
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

  const currentPeriodBlocks = blocks.filter(b => b.period === period);

  const slotIcons: Record<TimeSlot, React.ReactNode> = {
    mañana: <Sun size={18} color="var(--color-primary)" aria-hidden="true" />,
    tarde: <Sunset size={18} color="var(--color-primary-active)" aria-hidden="true" />,
    noche: <Moon size={18} color="var(--color-ink)" aria-hidden="true" />,
    meta: <Target size={18} color="var(--color-primary-soft)" aria-hidden="true" />,
  };

  const slots: TimeSlot[] = ['mañana', 'tarde', 'noche', 'meta'];

  return (
    <div className={styles.plannerContainer}>
      <div className={styles.headingRow}>
        <h2 className={styles.pageTitle}>Planner y objetivos</h2>

        <div className={styles.periodToggle}>
          <button
            type="button"
            className={`${styles.toggleBtn} ${period === 'semanal' ? styles.toggleBtnActive : ''}`}
            onClick={() => setPeriod('semanal')}
            aria-pressed={period === 'semanal'}
          >
            Semanal
          </button>
          <button
            type="button"
            className={`${styles.toggleBtn} ${period === 'mensual' ? styles.toggleBtnActive : ''}`}
            onClick={() => setPeriod('mensual')}
            aria-pressed={period === 'mensual'}
          >
            Mensual
          </button>
        </div>
      </div>

      <div className={styles.createCard}>
        <form onSubmit={handleAddBlock} className={styles.createForm}>
          <input
            type="text"
            id="planner-title-input"
            name="plannerTitle"
            className={styles.inputTitle}
            placeholder="Objetivo o bloque de enfoque"
            aria-label="Objetivo o bloque de enfoque"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />

          <select
            id="planner-slot-select"
            name="plannerSlot"
            className={styles.selectSlot}
            aria-label="Momento del día o meta"
            value={timeSlot}
            onChange={e => setTimeSlot(e.target.value as TimeSlot)}
          >
            <option value="mañana">Mañana</option>
            <option value="tarde">Tarde</option>
            <option value="noche">Noche</option>
            <option value="meta">Meta principal</option>
          </select>

          <select
            id="planner-priority-select"
            name="plannerPriority"
            className={styles.selectPriority}
            aria-label="Prioridad del bloque"
            value={priority}
            onChange={e => setPriority(e.target.value as Priority)}
          >
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>

          <button type="submit" className={styles.btnAdd}>
            <Plus size={18} aria-hidden="true" />
            <span>Agregar bloque</span>
          </button>
        </form>
      </div>

      <div className={styles.slotsGrid}>
        {slots.map(slot => {
          const slotBlocks = currentPeriodBlocks.filter(b => b.timeSlot === slot);
          return (
            <div key={slot} className={styles.slotColumn}>
              <h3 className={styles.slotTitle}>
                {slotIcons[slot]}
                <span>{slot}</span>
              </h3>

              {slotBlocks.length === 0 ? (
                <div className={styles.emptySlot}>
                  Sin bloques para {slot}. Agrega un objetivo de enfoque arriba.
                </div>
              ) : (
                <div className={styles.blocksList}>
                  {slotBlocks.map(block => {
                    const blockText = block.title || (block as unknown as { content?: string }).content || 'bloque';
                    return (
                      <div key={block.id} className={styles.blockItem}>
                        <input
                          type="checkbox"
                          id={`block-${block.id}`}
                          aria-label={`completar ${blockText}`}
                          className={styles.blockCheckbox}
                          checked={block.completed}
                          onChange={() => handleToggleBlock(block)}
                        />
                        <span className={`${styles.blockTitle} ${block.completed ? styles.blockCompleted : ''}`}>
                          {blockText}
                        </span>
                        <button
                          type="button"
                          className={styles.btnDelete}
                          aria-label={`eliminar ${blockText}`}
                          onClick={() => handleDeleteBlock(block.id)}
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
