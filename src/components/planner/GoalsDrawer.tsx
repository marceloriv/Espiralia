import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Target, Plus, X } from 'lucide-react';
import { sileo } from 'sileo';
import { useEscapeKey } from '../../utils/useEscapeKey';
import type { Goal, GoalSubItem } from '../../types';
import { StorageService } from '../../services/storage';
import { GoalCard } from './GoalCard';
import { Papel, TINTE_DE_MODULO } from '../common/Papel';
import styles from './GoalsDrawer.module.css';

interface GoalsDrawerProps {
  profileId: string;
  onGoalsChange?: () => void;
}

export const GoalsDrawer: React.FC<GoalsDrawerProps> = ({ profileId, onGoalsChange }) => {
  const [goals, setGoals] = useState<Goal[]>(() => StorageService.getGoals(profileId));
  const [isModalOpen, setIsModalOpen] = useState(false);
  useEscapeKey(() => setIsModalOpen(false), isModalOpen);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Metas Académicas');
  const [description, setDescription] = useState('');
  const [subItemInput, setSubItemInput] = useState('');
  const [subItems, setSubItems] = useState<GoalSubItem[]>([]);

  const loadGoals = useCallback(() => {
    const list = StorageService.getGoals(profileId);
    setGoals(list);
    onGoalsChange?.();
  }, [profileId, onGoalsChange]);

  const isFirstMount = useRef(true);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    setGoals(StorageService.getGoals(profileId));
  }, [profileId]);

  const handleToggleSubItem = (goalId: string, subId: string) => {
    const targetGoal = goals.find(g => g.id === goalId);
    if (!targetGoal) return;

    const updatedGoal: Goal = {
      ...targetGoal,
      items: targetGoal.items.map(item =>
        item.id === subId ? { ...item, completed: !item.completed } : item
      ),
    };

    StorageService.saveGoal(updatedGoal);
    loadGoals();
  };

  const handleDeleteGoal = (goalId: string) => {
    StorageService.deleteGoal(profileId, goalId);
    sileo.info({ title: 'Meta eliminada' });
    loadGoals();
  };

  const handleAddSubItem = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    if (!subItemInput.trim()) return;

    const newItem: GoalSubItem = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      title: subItemInput.trim(),
      completed: false,
    };

    setSubItems(prev => [...prev, newItem]);
    setSubItemInput('');
  };

  const handleRemoveSubItem = (id: string) => {
    setSubItems(prev => prev.filter(item => item.id !== id));
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newGoal: Goal = {
      id: `goal-${Date.now()}`,
      profileId,
      title: title.trim(),
      category: category.trim() || undefined,
      description: description.trim() || undefined,
      period: 'semanal',
      items: subItems,
      createdAt: new Date().toISOString(),
    };

    StorageService.saveGoal(newGoal);
    sileo.success({ title: 'Meta semanal guardada' });
    setIsModalOpen(false);
    setTitle('');
    setDescription('');
    setSubItems([]);
    loadGoals();
  };

  return (
    <aside className={styles.drawerContainer} aria-label="Panel de metas semanales">
      <Papel as="div" tinte={TINTE_DE_MODULO.planner}>
      <div className={styles.drawerHeader}>
        <div className={styles.titleArea}>
          <span className={styles.subHeading}>Objetivos de Horizonte</span>
          <h3 className={styles.mainHeading}>Metas Semanales</h3>
        </div>
        <button
          type="button"
          className={styles.addGoalBtn}
          onClick={() => setIsModalOpen(true)}
          aria-label="+ Nueva meta"
        >
          <Plus size={16} aria-hidden="true" />
          <span>Nueva Meta</span>
        </button>
      </div>

      <div className={styles.goalsList}>
        {goals.length === 0 ? (
          <div className={styles.emptyState}>
            <Target size={32} aria-hidden="true" style={{ margin: '0 auto 0.5rem auto', opacity: 0.4 }} />
            <p>Sin metas registradas para esta semana</p>
          </div>
        ) : (
          goals.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onToggleSubItem={handleToggleSubItem}
              onDeleteGoal={handleDeleteGoal}
            />
          ))
        )}
      </div>
      </Papel>

      {isModalOpen && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="modal-goal-title">
          <div className={styles.modalBox}>
            <h3 id="modal-goal-title" className={styles.modalTitle}>Nueva Meta Semanal</h3>
            <form onSubmit={handleSaveGoal}>
              <div className={styles.formGroup}>
                <label htmlFor="goal-title-input" className={styles.label}>Título de la meta</label>
                <input
                  id="goal-title-input"
                  type="text"
                  className={styles.input}
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ej. Avanzar módulos del curso"
                  required
                  autoFocus
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="goal-category-select" className={styles.label}>Categoría</label>
                <input
                  id="goal-category-select"
                  type="text"
                  className={styles.input}
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  placeholder="Ej. Metas Académicas, Metas Personales"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="goal-desc-input" className={styles.label}>Descripción (opcional)</label>
                <input
                  id="goal-desc-input"
                  type="text"
                  className={styles.input}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Detalles u objetivo clave"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="goal-subitem-input" className={styles.label}>Sub-tareas / Checklist</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    id="goal-subitem-input"
                    type="text"
                    className={styles.input}
                    style={{ flex: 1 }}
                    value={subItemInput}
                    onChange={e => setSubItemInput(e.target.value)}
                    onKeyDown={handleAddSubItem}
                    placeholder="Agregar sub-tarea o paso..."
                  />
                  <button
                    type="button"
                    onClick={handleAddSubItem}
                    className={styles.addGoalBtn}
                    style={{ padding: '0.5rem 0.75rem' }}
                    aria-label="Agregar sub-tarea"
                  >
                    +
                  </button>
                </div>

                {subItems.length > 0 && (
                  <div className={styles.subItemsContainer}>
                    {subItems.map(item => (
                      <div key={item.id} className={styles.subItemChip}>
                        <span>{item.title}</span>
                        <button
                          type="button"
                          className={styles.removeSubBtn}
                          onClick={() => handleRemoveSubItem(item.id)}
                          aria-label={`Quitar ${item.title}`}
                        >
                          <X size={14} aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className={styles.saveBtn}>
                  Guardar Meta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
};
