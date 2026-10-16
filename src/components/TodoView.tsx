import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Trash2, CheckCircle2, Calendar, Clock, FolderPlus, X } from 'lucide-react';
import { sileo } from 'sileo';
import type { TodoItem, Priority, Area, TaskStatus } from '../types';
import { StorageService } from '../services/storage';
import { toLocalDateStr } from '../utils/localDate';
import { dueLabel } from './dashboard/dashboardData';
import { AreaIntegratedWorkspace } from './todo/AreaIntegratedWorkspace';
import styles from './TodoView.module.css';

interface TodoViewProps {
  profileId: string;
}

type FilterStatus = 'todas' | 'pendientes' | 'en_progreso' | 'completadas';

const COLOR_PALETTE = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#6b7280'];

export const TodoView: React.FC<TodoViewProps> = ({ profileId }) => {
  const [areas, setAreas] = useState<Area[]>(() => StorageService.getAreas(profileId));
  const [todos, setTodos] = useState<TodoItem[]>(() => StorageService.getTodos(profileId));
  const [selectedAreaId, setSelectedAreaId] = useState<string>('todas');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('todas');

  // Formulario de nueva tarea
  const [inputTitle, setInputTitle] = useState('');
  const [selectedAreaForNew, setSelectedAreaForNew] = useState(() => areas[0]?.id || '');
  const [selectedPriority, setSelectedPriority] = useState<Priority>('media');
  const [inputDueDate, setInputDueDate] = useState('');

  // Modal de nueva área
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaColor, setNewAreaColor] = useState(COLOR_PALETTE[0]);

  // Edición rápida de fecha en fila
  const [editingDueDateId, setEditingDueDateId] = useState<string | null>(null);

  const isFirstMount = useRef(true);
  const todayStr = toLocalDateStr(new Date());

  const loadData = useCallback(() => {
    setAreas(StorageService.getAreas(profileId));
    setTodos(StorageService.getTodos(profileId));
  }, [profileId]);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    loadData();
  }, [loadData]);

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputTitle.trim()) return;

    const areaIdToUse = selectedAreaForNew || (areas[0]?.id ?? 'default');
    const newTodo: TodoItem = {
      id: `t-${Date.now()}`,
      profileId,
      title: inputTitle.trim(),
      areaId: areaIdToUse,
      priority: selectedPriority,
      status: 'pendiente',
      completed: false,
      dueDate: inputDueDate || undefined,
      createdAt: new Date().toISOString(),
    };

    StorageService.saveTodo(newTodo);
    setInputTitle('');
    setInputDueDate('');
    sileo.success({ title: 'Tarea agregada exitosamente' });
    loadData();
  };

  const handleToggleTodo = (id: string) => {
    const target = todos.find(t => t.id === id);
    StorageService.toggleTodo(profileId, id);
    if (target) {
      const willBeCompleted = target.status !== 'completada';
      sileo.info({ title: willBeCompleted ? 'Tarea completada' : 'Tarea reabierta' });
    }
    loadData();
  };

  const handleToggleStatus = (id: string) => {
    const target = todos.find(t => t.id === id);
    if (!target) return;
    const nextStatus: TaskStatus = target.status === 'en_progreso' ? 'pendiente' : 'en_progreso';
    StorageService.setTodoStatus(profileId, id, nextStatus);
    sileo.info({ title: nextStatus === 'en_progreso' ? 'Tarea en progreso' : 'Tarea pendiente' });
    loadData();
  };

  const handleDeleteTodo = (id: string) => {
    StorageService.deleteTodo(profileId, id);
    sileo.success({ title: 'Tarea eliminada' });
    loadData();
  };

  const handleSaveDueDate = (id: string, date: string) => {
    const target = todos.find(t => t.id === id);
    if (!target) return;
    StorageService.saveTodo({
      ...target,
      dueDate: date || undefined,
    });
    setEditingDueDateId(null);
    loadData();
  };

  const handleCreateArea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAreaName.trim()) return;

    const newArea: Area = {
      id: `area-${Date.now()}`,
      profileId,
      name: newAreaName.trim(),
      color: newAreaColor,
      createdAt: new Date().toISOString(),
    };

    StorageService.saveArea(newArea);
    setNewAreaName('');
    setIsAreaModalOpen(false);
    sileo.success({ title: 'Área temática creada' });
    loadData();
  };

  // Filtrado
  const areaFilteredTodos = todos.filter(t => {
    if (selectedAreaId === 'todas') return true;
    return t.areaId === selectedAreaId;
  });

  const filteredTodos = areaFilteredTodos.filter(t => {
    if (filterStatus === 'pendientes') return t.status === 'pendiente';
    if (filterStatus === 'en_progreso') return t.status === 'en_progreso';
    if (filterStatus === 'completadas') return t.status === 'completada';
    return true;
  });

  // Conteos
  const totalCompleted = areaFilteredTodos.filter(t => t.status === 'completada').length;
  const countPending = areaFilteredTodos.filter(t => t.status === 'pendiente').length;
  const countInProgress = areaFilteredTodos.filter(t => t.status === 'en_progreso').length;
  const countDone = totalCompleted;

  const getPriorityClass = (priority: Priority) => {
    if (priority === 'alta') return styles.badgePriorityAlta;
    if (priority === 'media') return styles.badgePriorityMedia;
    return styles.badgePriorityBaja;
  };

  const getAreaById = (id: string): Area | undefined => areas.find(a => a.id === id);
  const activeArea = areas.find(a => a.id === selectedAreaId);

  const getEmptyStateContent = () => {
    if (todos.length === 0) {
      return {
        title: 'Aún no has agregado tareas',
        description: 'Usa el formulario superior para crear tu primera tarea y organizar tu día.',
      };
    }
    if (filterStatus === 'pendientes') {
      return {
        title: '¡Todo al día!',
        description: 'No tienes tareas pendientes por completar. ¡Excelente progreso!',
      };
    }
    if (filterStatus === 'en_progreso') {
      return {
        title: 'Sin tareas en curso',
        description: 'Marca tareas como "En progreso" cuando estés trabajando activamente en ellas.',
      };
    }
    if (filterStatus === 'completadas') {
      return {
        title: 'Sin tareas completadas aún',
        description: 'Marca las tareas a medida que las termines para ver tu avance aquí.',
      };
    }
    return {
      title: 'No hay tareas',
      description: 'No se encontraron tareas para el filtro actual.',
    };
  };

  const emptyContent = getEmptyStateContent();

  return (
    <div className={styles.todoContainer}>
      {/* Cabecera y Resumen de Avance */}
      <div className={styles.headingRow}>
        <div>
          <h2 className={styles.pageTitle}>Mis tareas</h2>
          <p className={styles.pageSubtitle}>
            Gestión integral por flujo y áreas temáticas
          </p>
        </div>
        <div className={styles.completionSummary}>
          <span className={styles.completionBadge}>
            {totalCompleted} de {areaFilteredTodos.length} completadas
          </span>
        </div>
      </div>

      {/* Barra de Áreas Temáticas (Diseño Stitch) */}
      <section className={styles.areasSection} aria-label="Áreas temáticas">
        <div className={styles.areasHeader}>
          <span className={styles.areasLabel}>Áreas temáticas</span>
          <button
            type="button"
            className={styles.btnAddArea}
            aria-label="Crear área"
            onClick={() => setIsAreaModalOpen(true)}
          >
            <FolderPlus size={16} aria-hidden="true" />
            <span>+ Área</span>
          </button>
        </div>

        <div className={styles.areasList}>
          <button
            type="button"
            className={`${styles.areaCard} ${selectedAreaId === 'todas' ? styles.areaCardActive : ''}`}
            onClick={() => setSelectedAreaId('todas')}
            aria-label="Todas las áreas"
            aria-pressed={selectedAreaId === 'todas'}
          >
            <span className={styles.areaDot} style={{ backgroundColor: 'var(--color-primary)' }} />
            <span className={styles.areaCardName}>Todas</span>
            <span className={styles.areaCardCount}>
              {todos.filter(t => t.status !== 'completada').length}
            </span>
          </button>

          {areas.map(area => {
            const openCount = todos.filter(t => t.areaId === area.id && t.status !== 'completada').length;
            const isSelected = selectedAreaId === area.id;
            return (
              <button
                key={area.id}
                type="button"
                className={`${styles.areaCard} ${isSelected ? styles.areaCardActive : ''}`}
                onClick={() => setSelectedAreaId(area.id)}
                aria-label={`Área ${area.name}`}
                aria-pressed={isSelected}
              >
                <span className={styles.areaDot} style={{ backgroundColor: area.color }} />
                <span className={styles.areaCardName}>{area.name}</span>
                <span className={styles.areaCardCount}>{openCount}</span>
              </button>
            );
          })}
        </div>
      </section>

      {activeArea && selectedAreaId !== 'todas' ? (
        <AreaIntegratedWorkspace
          area={activeArea}
          profileId={profileId}
          onDataChanged={loadData}
        />
      ) : (
        <>
          {/* Formulario de creación rápida */}
          <div className={styles.createCard}>
        <form onSubmit={handleAddTodo} className={styles.createForm}>
          <input
            type="text"
            className={styles.inputTask}
            placeholder="¿Qué tienes pendiente?"
            aria-label="¿Qué tienes pendiente?"
            value={inputTitle}
            onChange={e => setInputTitle(e.target.value)}
          />

          <div className={styles.createControls}>
            <select
              className={styles.selectArea}
              aria-label="Área de la tarea"
              value={selectedAreaForNew}
              onChange={e => setSelectedAreaForNew(e.target.value)}
            >
              {areas.map(area => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </select>

            <select
              className={styles.selectPriority}
              aria-label="Prioridad de la tarea"
              value={selectedPriority}
              onChange={e => setSelectedPriority(e.target.value as Priority)}
            >
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>

            <input
              type="date"
              className={styles.inputDate}
              aria-label="Fecha de vencimiento"
              value={inputDueDate}
              onChange={e => setInputDueDate(e.target.value)}
            />

            <button type="submit" className={styles.btnAdd}>
              <Plus size={18} aria-hidden="true" />
              <span>Añadir</span>
            </button>
          </div>
        </form>
      </div>

      {/* Barra de filtros de estado */}
      <div className={styles.filterBar} role="region" aria-label="Filtro de estados">
        {(
          [
            { id: 'todas', label: 'Todas', count: areaFilteredTodos.length },
            { id: 'pendientes', label: 'Pendientes', count: countPending },
            { id: 'en_progreso', label: 'En progreso', count: countInProgress },
            { id: 'completadas', label: 'Completadas', count: countDone },
          ] as const
        ).map(({ id, label, count }) => (
          <button
            key={id}
            type="button"
            className={`${styles.filterBtn} ${filterStatus === id ? styles.filterBtnActive : ''}`}
            onClick={() => setFilterStatus(id)}
            aria-pressed={filterStatus === id}
          >
            <span>{label}</span>
            <span className={styles.filterBadge}>{count}</span>
          </button>
        ))}
      </div>

      {/* Lista de tareas */}
      {filteredTodos.length === 0 ? (
        <div className={styles.emptyState}>
          <CheckCircle2 size={36} color="var(--color-primary-soft)" aria-hidden="true" style={{ marginBottom: 12 }} />
          <h3 className={styles.emptyTitle}>{emptyContent.title}</h3>
          <p className={styles.emptySubtitle}>{emptyContent.description}</p>
        </div>
      ) : (
        <div className={styles.todoList}>
          {filteredTodos.map(todo => {
            const area = getAreaById(todo.areaId);
            const isDone = todo.status === 'completada';
            const inProgress = todo.status === 'en_progreso';
            const dueText = dueLabel(todo.dueDate, todayStr);

            return (
              <div key={todo.id} className={`${styles.todoItem} ${isDone ? styles.todoItemDone : ''}`}>
                {/* Touch target envolvente para checkbox */}
                <label className={styles.checkboxTouchTarget} htmlFor={`todo-${todo.id}`}>
                  <input
                    type="checkbox"
                    id={`todo-${todo.id}`}
                    aria-label={`completar ${todo.title}`}
                    className={styles.todoCheckbox}
                    checked={isDone}
                    onChange={() => handleToggleTodo(todo.id)}
                  />
                </label>

                <div className={styles.todoContent}>
                  <span className={`${styles.todoTitle} ${isDone ? styles.todoCompleted : ''}`}>
                    {todo.title}
                  </span>

                  <div className={styles.todoMeta}>
                    {/* Badge de Área */}
                    {area && (
                      <span className={styles.badgeArea}>
                        <span className={styles.badgeAreaDot} style={{ backgroundColor: area.color }} />
                        <span>{area.name}</span>
                      </span>
                    )}

                    {/* Chip de Estado interactivo */}
                    <button
                      type="button"
                      className={`${styles.statusPill} ${
                        inProgress ? styles.statusPillInProgress : isDone ? styles.statusPillDone : styles.statusPillPending
                      }`}
                      aria-label={`estado: ${todo.status === 'en_progreso' ? 'en progreso' : todo.status}`}
                      onClick={() => handleToggleStatus(todo.id)}
                    >
                      <Clock size={12} aria-hidden="true" />
                      <span>{todo.status === 'en_progreso' ? 'En progreso' : isDone ? 'Completada' : 'Pendiente'}</span>
                    </button>

                    {/* Chip de Vencimiento interactivo */}
                    {editingDueDateId === todo.id ? (
                      <div className={styles.inlineDateEditor}>
                        <input
                          type="date"
                          defaultValue={todo.dueDate || ''}
                          className={styles.inlineDateInput}
                          aria-label={`editar fecha de ${todo.title}`}
                          onChange={e => handleSaveDueDate(todo.id, e.target.value)}
                        />
                        <button
                          type="button"
                          className={styles.btnCancelDate}
                          aria-label="cancelar fecha"
                          onClick={() => setEditingDueDateId(null)}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className={`${styles.duePill} ${todo.dueDate ? styles.duePillActive : ''}`}
                        aria-label={todo.dueDate ? `vencimiento: ${todo.dueDate}` : `asignar vencimiento a ${todo.title}`}
                        onClick={() => setEditingDueDateId(todo.id)}
                      >
                        <Calendar size={12} aria-hidden="true" />
                        <span>{dueText || '+ Vence'}</span>
                      </button>
                    )}

                    {/* Badge de Prioridad */}
                    <span className={getPriorityClass(todo.priority)}>
                      {todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className={styles.btnDelete}
                  aria-label={`eliminar ${todo.title}`}
                  onClick={() => handleDeleteTodo(todo.id)}
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </div>
      )}
        </>
      )}

      {/* Modal para Crear Nueva Área Temática */}
      {isAreaModalOpen && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="Nueva área temática">
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Nueva área temática</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                aria-label="Cerrar modal"
                onClick={() => setIsAreaModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateArea} className={styles.modalForm}>
              <label className={styles.formLabel} htmlFor="area-name-input">
                Nombre del área
              </label>
              <input
                id="area-name-input"
                type="text"
                className={styles.formInput}
                placeholder="Ej. Finanzas, Proyectos..."
                aria-label="Nombre del área"
                value={newAreaName}
                onChange={e => setNewAreaName(e.target.value)}
                autoFocus
              />

              <div role="group" aria-labelledby="todo-color-label">
                <span id="todo-color-label" className={styles.formLabel}>Color identificador</span>
                <div className={styles.colorPalette}>
                  {COLOR_PALETTE.map(color => (
                    <button
                      key={color}
                      type="button"
                      className={`${styles.colorCircle} ${newAreaColor === color ? styles.colorCircleActive : ''}`}
                      style={{ backgroundColor: color }}
                      aria-label={`color ${color}`}
                      aria-pressed={newAreaColor === color}
                      onClick={() => setNewAreaColor(color)}
                    />
                  ))}
                </div>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setIsAreaModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className={styles.btnPrimary}>
                  Guardar área
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
