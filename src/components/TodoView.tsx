import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Trash2, CheckCircle2, Calendar, Clock, FolderPlus, X, Star, Flag, Check, ShieldCheck } from 'lucide-react';
import { sileo } from 'sileo';
import { useEscapeKey } from '../utils/useEscapeKey';
import { ENERGY_LEVELS, DEFAULT_ENERGY_VALUE, energyLabel } from '../utils/energyLevels';
import type { TodoItem, Priority, Area, TaskStatus, Profile, ViewType, AgendaEvent } from '../types';
import { StorageService } from '../services/storage';
import { isoWeekNumber, toLocalDateStr } from '../utils/localDate';
import { dueLabel, criticalTodos } from './dashboard/dashboardData';
import { AreaIntegratedWorkspace } from './todo/AreaIntegratedWorkspace';
import { Papel, TINTE_DE_MODULO } from './common/Papel';
import styles from './TodoView.module.css';

interface TodoViewProps {
  profileId?: string;
  profile?: Profile;
  onNavigate?: (view: ViewType) => void;
}

type FilterStatus = 'todas' | 'pendientes' | 'en_progreso' | 'completadas';

const COLOR_PALETTE = ['#e8a55a', '#8e1ea2', '#5db8a6', '#7b8c9e', '#5a826d', '#9c4a3b'];

const getEventDayParts = (dateStr?: string) => {
  if (!dateStr) return { dayName: 'HOY', dayNum: '--' };
  const [y, m, d] = dateStr.split('-').map(Number);
  const dObj = new Date(y, m - 1, d);
  const dayName = dObj.toLocaleDateString('es-CL', { weekday: 'short' }).toUpperCase().replace('.', '');
  return { dayName, dayNum: String(d).padStart(2, '0') };
};

export const TodoView: React.FC<TodoViewProps> = ({ profileId: propProfileId, profile, onNavigate }) => {
  const profileId = profile?.id ?? propProfileId ?? '';
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
  useEscapeKey(() => setIsAreaModalOpen(false), isAreaModalOpen);
  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaColor, setNewAreaColor] = useState(COLOR_PALETTE[0]);

  // Edición rápida de fecha en fila
  const [editingDueDateId, setEditingDueDateId] = useState<string | null>(null);

  const todayStr = toLocalDateStr(new Date());

  // Nivel de energía en tarjeta mini reminders
  const [energyLevel, setEnergyLevel] = useState<string>(() => StorageService.getTodayMood(profileId, todayStr) || DEFAULT_ENERGY_VALUE);
  const [events, setEvents] = useState<AgendaEvent[]>(() => StorageService.getEvents(profileId));

  const isFirstMount = useRef(true);

  const loadData = useCallback(() => {
    setAreas(StorageService.getAreas(profileId));
    setTodos(StorageService.getTodos(profileId));
    setEvents(StorageService.getEvents(profileId));
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

  const handleSelectEnergy = (icon: string) => {
    setEnergyLevel(icon);
    StorageService.setTodayMood(profileId, todayStr, icon);
  };

  const upcomingEvents = events
    .filter(e => Boolean(e.date))
    .sort((a, b) => {
      const cmpDate = (a.date ?? '').localeCompare(b.date ?? '');
      if (cmpDate !== 0) return cmpDate;
      return (a.startTime ?? '').localeCompare(b.startTime ?? '');
    })
    .slice(0, 3);

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

  const criticalList = criticalTodos(todos, 3);

  return (
    <div className={styles.todoContainer}>
      {/* 1. Cabecera Editorial Papercraft Stitch */}
      <section className={styles.stationeryBanner}>
        <div className={styles.bannerGrid}>
          {/* Columna Izquierda: Titular y Propósito */}
          <div className={styles.bannerMain}>
            <div className={styles.overlineRow}>
              <Papel as="span" forma="pieza" tinte={TINTE_DE_MODULO.todo} className={styles.weekTag}>
                Semana {isoWeekNumber(new Date())}
              </Papel>
            </div>

            <h1 className={styles.editorialH1}>
              to-do &amp; áreas integradas<span className={styles.purpleDot}>.</span>
            </h1>

            <p className={styles.editorialLead}>
              <span className={styles.leadItalic}>Ordena tu mente. Cuida tu energía.</span> Un espacio unificado donde convergen tus tareas diarias, tus sesiones agendadas y tus notas vivas organizadas por áreas de vida.
            </p>

            <div className={styles.metaRow}>
              <span className={styles.metaItem}>
                <Flag size={15} className={styles.iconAmber} aria-hidden="true" />
                <span>{criticalList.length} {criticalList.length === 1 ? 'prioridad capital' : 'prioridades capitales'}</span>
              </span>
              <span className={styles.bullet}>•</span>
              <span className={styles.metaItem}>
                <ShieldCheck size={15} className={styles.iconTeal} aria-hidden="true" />
                <span>{countPending} pendientes para hoy</span>
              </span>
              <span className={styles.bullet}>•</span>
              <span className={styles.metaItem}>
                <span className={styles.enfoqueLabel}>
                  Enfoque: {criticalList[0]?.title || (todos.length > 0 ? todos[0].title : 'Claridad y presencia')}
                </span>
              </span>
              <span className={styles.bullet}>•</span>
              <span className={styles.completionBadge}>
                {totalCompleted} de {areaFilteredTodos.length} completadas
              </span>
            </div>
          </div>

          {/* Columna Derecha: Post-it Manila con Chincheta Dorada */}
          <div className={styles.bannerPostItCol}>
            <div className={styles.pinnedPostIt}>
              {/* Golden pushpin */}
              <div className={styles.goldenPushpin} aria-hidden="true">
                <div className={styles.pushpinShine} />
              </div>

              <div className={styles.postItContent}>
                <p className={styles.postItScript}>
                  Disciplina hoy,<br />paz mañana.
                </p>
                <div className={styles.postItDivider} />
                <p className={styles.postItSub}>♡ todo en un solo lugar</p>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* 2. Barra de Áreas Temáticas (Archivador Manila Cromático) & Filtros */}
      <section className={styles.areasSection} aria-label="Áreas temáticas">
        <div className={styles.areasHeader}>
          <div className={styles.folderTabsRow}>
            {/* Folder Tab 0: Todas las Áreas */}
            <button
              type="button"
              className={`${styles.folderTab} ${selectedAreaId === 'todas' ? styles.folderTabActive : ''}`}
              onClick={() => setSelectedAreaId('todas')}
              aria-label="Todas las áreas"
              aria-pressed={selectedAreaId === 'todas'}
            >
              <span className={styles.folderTabName}>Todas las Áreas</span>
              <span className={styles.folderTabCount}>
                {todos.filter(t => t.status !== 'completada').length}
              </span>
            </button>

            {/* Folder Tabs 1..N por cada área */}
            {areas.map((area, idx) => {
              const openCount = todos.filter(t => t.areaId === area.id && t.status !== 'completada').length;
              const isSelected = selectedAreaId === area.id;
              const numStr = String(idx + 1).padStart(2, '0');

              return (
                <button
                  key={area.id}
                  type="button"
                  className={`${styles.folderTab} ${isSelected ? styles.folderTabActive : ''}`}
                  onClick={() => setSelectedAreaId(area.id)}
                  aria-label={`Área ${area.name}`}
                  aria-pressed={isSelected}
                >
                  <span className={styles.tabWatermark} aria-hidden="true">{numStr}</span>
                  <span className={styles.areaDot} style={{ backgroundColor: area.color }} />
                  <span className={styles.areaCardName}>
                    <span className={styles.areaIndex}>{numStr}.</span> {area.name}
                  </span>
                  <span className={styles.folderTabCount}>{openCount}</span>
                </button>
              );
            })}

            {/* Botón Añadir Área */}
            <button
              type="button"
              className={styles.btnAddAreaTab}
              aria-label="Crear área"
              title="Añadir nueva área de vida"
              onClick={() => setIsAreaModalOpen(true)}
            >
              <FolderPlus size={16} aria-hidden="true" />
              <span>+ Área</span>
            </button>
          </div>

          {/* Filtros de Estado */}
          <div className={styles.filterBar} role="region" aria-label="Filtro de estados">
            <span className={styles.filterLabel}>Filtrar:</span>
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
        </div>
      </section>

      {/* 3. Pliego de Contenido Integrado */}
      {activeArea && selectedAreaId !== 'todas' ? (
        <AreaIntegratedWorkspace
          area={activeArea}
          profileId={profileId}
          onDataChanged={loadData}
        />
      ) : (
        <div className={styles.workspaceGrid}>
          {/* Columna Principal / Izquierda (Tareas & Entrada Rápida) */}
          <div className={styles.leftColumn}>
            {/* 3.1 Entrada Rápida al Taller con Clip de Latón */}
            <Papel as="section" tinte={TINTE_DE_MODULO.todo} aria-label="Entrada rápida">

              <div className={styles.quickAddBody}>
                <div className={styles.quickAddHeader}>
                  <span className={styles.quickAddTitle}>
                    <Plus size={16} className={styles.iconPrimary} aria-hidden="true" />
                    Entrada rápida
                  </span>
                  <span className={styles.quickAddAreaPill}>
                    Área: {areas[0]?.name || 'General'}
                  </span>
                </div>

                <form onSubmit={handleAddTodo} className={styles.createForm}>
                  <input
                    type="text"
                    className={styles.inputTask}
                    placeholder="¿Qué tienes pendiente? (Ej. Revisar informe, enviar correo, preparar reunión)..."
                    aria-label="¿Qué tienes pendiente?"
                    value={inputTitle}
                    onChange={e => setInputTitle(e.target.value)}
                  />

                  <div className={styles.createControls}>
                    <div className={styles.selectGroup}>
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
                        <option value="alta">Prioridad: Alta</option>
                        <option value="media">Prioridad: Media</option>
                        <option value="baja">Prioridad: Baja</option>
                      </select>

                      <input
                        type="date"
                        className={styles.inputDate}
                        aria-label="Fecha de vencimiento"
                        value={inputDueDate}
                        onChange={e => setInputDueDate(e.target.value)}
                      />
                    </div>

                    <button type="submit" className={styles.btnAdd}>
                      <Plus size={16} aria-hidden="true" />
                      <span>Añadir</span>
                    </button>
                  </div>
                </form>
              </div>
            </Papel>

            {/* 3.2 TOP PRIORITIES Manila Card */}
            <Papel as="section" tinte={TINTE_DE_MODULO.todo} aria-label="Prioridades clave">

              <div className={styles.topPrioritiesBody}>
                <div className={styles.topPrioritiesHeader}>
                  <div className={styles.topPrioritiesTitleGroup}>
                    <span className={styles.topPrioritiesBadge}>PRIORIDADES CLAVE</span>
                    <span className={styles.topPrioritiesSub}>no negociables del día</span>
                  </div>
                  <Star size={18} className={styles.iconStar} aria-hidden="true" />
                </div>

                {criticalList.length === 0 ? (
                  <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--color-ink-muted)' }}>
                    <p style={{ margin: '0 0 6px 0', fontSize: '0.875rem', fontWeight: 500 }}>
                      Todo al día • Ninguna prioridad crítica pendiente
                    </p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>
                      Tus tareas de alta prioridad no negociables aparecerán destacadas aquí.
                    </p>
                  </div>
                ) : (
                  <div className={styles.topPrioritiesList}>
                    {criticalList.map((t, idx) => {
                      const area = areas.find(a => a.id === t.areaId);
                      const isDone = t.status === 'completada' || Boolean(t.completed);
                      const due = dueLabel(t.dueDate, todayStr);
                      return (
                        <div key={t.id} className={styles.priorityItem}>
                          <span className={styles.priorityIndex}>{String(idx + 1).padStart(2, '0')}.</span>
                          <button
                            type="button"
                            className={`${styles.roundCheckbox} ${isDone ? styles.roundCheckboxChecked : ''}`}
                            onClick={() => handleToggleTodo(t.id)}
                            aria-label={`Completar prioridad ${t.title}`}
                          >
                            {isDone && <Check size={12} strokeWidth={3} />}
                          </button>
                          <div className={styles.priorityContent}>
                            <div className={styles.priorityTitleRow}>
                              <h4 className={`${styles.priorityTitle} ${isDone ? styles.titleDone : ''}`}>
                                {t.title}
                              </h4>
                              <span className={`${styles.badgePriority} ${styles.badgePriorityAlta}`}>
                                {t.priority.toUpperCase()}
                              </span>
                            </div>
                            <div className={styles.priorityMeta}>
                              <span className={styles.priorityAreaTag}>
                                <span className={styles.tinyDot} style={{ backgroundColor: area?.color || '#e8a55a' }} />
                                {area?.name || t.category || 'General'}
                              </span>
                              {due && (
                                <>
                                  <span>•</span>
                                  <span>Plazo: {due}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Papel>

            {/* 3.3 Libreta Escolar de Tareas (Cuaderno Rayado con Grapas y Margen) */}
            <div className={styles.detailedTasksSection}>
              <div className={styles.detailedHeader}>
                <h3 className={styles.detailedTitle}>
                  <span>Tareas que importan</span>
                  <span className={styles.detailedSub}>· Ordenadas por impacto</span>
                </h3>
                <span className={styles.showingCount}>
                  Mostrando {filteredTodos.length} tareas
                </span>
              </div>

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
                        {/* Checkbox circular táctil */}
                        <label className={styles.checkboxTouchTarget} htmlFor={`todo-${todo.id}`}>
                          <input
                            type="checkbox"
                            id={`todo-${todo.id}`}
                            aria-label={`completar ${todo.title}`}
                            className={styles.todoCheckbox}
                            checked={isDone}
                            onChange={() => handleToggleTodo(todo.id)}
                          />
                          <span className={styles.customCheckbox} aria-hidden="true">
                            {isDone && <Check size={12} strokeWidth={3} />}
                          </span>
                        </label>

                        <div className={styles.todoContent}>
                          <div className={styles.todoMainRow}>
                            <span className={`${styles.todoTitle} ${isDone ? styles.titleDone : ''}`}>
                              {todo.title}
                            </span>
                          </div>

                          <div className={styles.todoMetaRow}>
                            {/* Píldora de Área */}
                            {area && (
                              <span className={styles.badgeArea} style={{ borderColor: area.color }}>
                                <span className={styles.badgeAreaDot} style={{ backgroundColor: area.color }} />
                                {area.name}
                              </span>
                            )}

                            {/* Píldora de Prioridad */}
                            <span className={`${styles.badgePriority} ${getPriorityClass(todo.priority)}`}>
                              {todo.priority}
                            </span>

                            {/* Píldora de Estado (alternable) */}
                            <button
                              type="button"
                              className={`${styles.statusPill} ${inProgress ? styles.statusPillInProgress : styles.statusPillPending}`}
                              onClick={() => handleToggleStatus(todo.id)}
                              aria-label={`estado: ${todo.status.replace('_', ' ')}`}
                            >
                              <Clock size={12} aria-hidden="true" />
                              <span>{todo.status.replace('_', ' ')}</span>
                            </button>

                            {/* Píldora de Fecha de Vencimiento editable */}
                            {editingDueDateId === todo.id ? (
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <input
                                  type="date"
                                  className={styles.editDateInput}
                                  aria-label={`cambiar fecha ${todo.title}`}
                                  defaultValue={todo.dueDate || ''}
                                  onBlur={e => handleSaveDueDate(todo.id, e.target.value)}
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  className={styles.btnCancelDate}
                                  aria-label="cancelar fecha"
                                  onClick={() => setEditingDueDateId(null)}
                                >
                                  <X size={14} aria-hidden="true" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className={styles.badgeDue}
                                onClick={() => setEditingDueDateId(todo.id)}
                                aria-label={`vencimiento: ${todo.dueDate || 'sin fecha'}`}
                              >
                                <Calendar size={12} aria-hidden="true" />
                                <span>{dueText}</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Sello de tinta carmín cuando la tarea está completada */}
                        {isDone && (
                          <div className={styles.stampCompletedSeal} aria-hidden="true">
                            <span className={styles.stampText}>HECHO</span>
                          </div>
                        )}

                        {/* Botón Eliminar Tarea */}
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
            </div>

          </div>

          {/* Columna Lateral / Derecha (Agenda, Bujo & Energía) */}
          <div className={styles.rightColumn}>
            {/* 3.5 Agenda Asociada */}
            <Papel as="section" tinte={TINTE_DE_MODULO.agenda} aria-label="Agenda asociada">
              <div className={styles.associatedAgendaCard}>
              <div className={styles.agendaCardHeader}>
                <div className={styles.agendaCardTitleGroup}>
                  <Calendar size={18} className={styles.iconPrimary} aria-hidden="true" />
                  <h3 className={styles.agendaCardTitle}>Agenda Asociada</h3>
                </div>
                <span className={styles.agendaCardSubtitle}>Próximos hitos</span>
              </div>

              <div className={styles.associatedEventsList}>
                {upcomingEvents.length === 0 ? (
                  <p style={{ padding: '0.75rem 0', fontStyle: 'italic', fontSize: '0.8125rem', color: 'var(--color-ink-muted)' }}>
                    Sin eventos agendados próximamente.
                  </p>
                ) : (
                  upcomingEvents.map(event => {
                    const { dayName, dayNum } = getEventDayParts(event.date);
                    const cat = event.category || 'personal';
                    const categoryLabel = cat.charAt(0).toUpperCase() + cat.slice(1);
                    const categoryColor = cat === 'urgente' ? 'var(--color-error)' : cat === 'trabajo' ? 'var(--color-accent-teal)' : '#e8a55a';
                    const timeMeta = `${event.startTime ? `${event.startTime}${event.endTime ? ` - ${event.endTime}` : ''} hrs` : 'Todo el día'}${event.notes ? ` · ${event.notes}` : ''}`;

                    return (
                      <div key={event.id} className={styles.eventItem} style={{ borderLeftColor: categoryColor }}>
                        <div className={styles.eventDateCol}>
                          <span className={styles.eventDayName} style={{ color: categoryColor }}>{dayName}</span>
                          <span className={styles.eventDayNum}>{dayNum}</span>
                        </div>
                        <div className={styles.eventInfo}>
                          <h4 className={styles.eventTitle}>{event.title}</h4>
                          <p className={styles.eventMeta}>{timeMeta}</p>
                          <span className={styles.eventAreaTag}>{categoryLabel}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className={styles.agendaCardFooter}>
                <button
                  type="button"
                  className={styles.agendaFooterLink}
                  onClick={() => onNavigate?.('agenda')}
                >
                  Ver vista semanal extendida en Agenda →
                </button>
              </div>
              </div>
            </Papel>

            {/* 3.7 Mini Reminders & Energy Check */}
            <div className={styles.miniRemindersCard}>
              <div className={styles.miniRemindersHeader}>
                <h3 className={styles.miniRemindersTitle}>Energía de hoy</h3>
              </div>

              <div className={styles.energyMeterBox}>
                <div className={styles.energyMeterHeader}>
                  <span className={styles.energyLabel}>Nivel de Energía / Presencia:</span>
                  <span className={styles.energyStatus}>{energyLabel(energyLevel)}</span>
                </div>
                <div className={styles.energyButtonsRow}>
                  {ENERGY_LEVELS.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      className={`${styles.energyBtn} ${energyLevel === value ? styles.energyBtnActive : ''}`}
                      onClick={() => handleSelectEnergy(value)}
                      title={`Nivel ${label}`}
                      aria-label={`Nivel ${label}`}
                      aria-pressed={energyLevel === value}
                    >
                      <Icon size={18} aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Footer Editorial de Privacidad */}
      <footer className={styles.editorialFooter}>
        <div className={styles.footerMeta}>
          <span className={styles.footerPill}>
            <span className={styles.footerGreenDot} />
            100% en tu navegador
          </span>
          <span className={styles.bullet}>·</span>
          <span>localStorage</span>
          <span className={styles.bullet}>·</span>
          <span>Datos particionados por perfil</span>
        </div>
      </footer>

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
