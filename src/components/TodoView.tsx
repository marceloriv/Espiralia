import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { sileo } from 'sileo';
import type { TodoItem, Priority } from '../types';
import { StorageService } from '../services/storage';
import styles from './TodoView.module.css';

interface TodoViewProps {
  profileId: string;
}

type FilterStatus = 'todas' | 'pendientes' | 'completadas';

export const TodoView: React.FC<TodoViewProps> = ({ profileId }) => {
  const [todos, setTodos] = useState<TodoItem[]>(() => StorageService.getTodos(profileId));
  const [inputTitle, setInputTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('General');
  const [selectedPriority, setSelectedPriority] = useState<Priority>('media');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('todas');

  const loadTodos = useCallback(() => {
    setTodos(StorageService.getTodos(profileId));
  }, [profileId]);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputTitle.trim()) return;

    const newTodo: TodoItem = {
      id: `t-${Date.now()}`,
      profileId,
      title: inputTitle.trim(),
      category: selectedCategory,
      priority: selectedPriority,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    StorageService.saveTodo(newTodo);
    setInputTitle('');
    sileo.success('Tarea agregada exitosamente');
    loadTodos();
  };

  const handleToggleTodo = (id: string) => {
    const target = todos.find(t => t.id === id);
    StorageService.toggleTodo(profileId, id);
    if (target) {
      sileo.info(target.completed ? 'Tarea reabierta' : 'Tarea completada');
    }
    loadTodos();
  };

  const handleDeleteTodo = (id: string) => {
    StorageService.deleteTodo(profileId, id);
    sileo.success('Tarea eliminada');
    loadTodos();
  };

  const filteredTodos = todos.filter(t => {
    if (filterStatus === 'pendientes') return !t.completed;
    if (filterStatus === 'completadas') return t.completed;
    return true;
  });

  const getPriorityClass = (priority: Priority) => {
    if (priority === 'alta') return styles.badgePriorityAlta;
    if (priority === 'media') return styles.badgePriorityMedia;
    return styles.badgePriorityBaja;
  };

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
    if (filterStatus === 'completadas') {
      return {
        title: 'Sin tareas completadas aún',
        description: 'Marca las tareas pendientes a medida que las termines para ver tu avance aquí.',
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
      <div className={styles.headingRow}>
        <h2 className={styles.pageTitle}>Mis tareas</h2>
      </div>

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

          <select
            className={styles.selectCategory}
            aria-label="Categoría de la tarea"
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
          >
            <option value="General">General</option>
            <option value="Trabajo">Trabajo</option>
            <option value="Personal">Personal</option>
            <option value="Estudio">Estudio</option>
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

          <button type="submit" className={styles.btnAdd}>
            <Plus size={18} />
            <span>Añadir</span>
          </button>
        </form>
      </div>

      {/* Barra de filtros */}
      <div className={styles.filterBar}>
        {(['todas', 'pendientes', 'completadas'] as FilterStatus[]).map(status => (
          <button
            key={status}
            className={`${styles.filterBtn} ${filterStatus === status ? styles.filterBtnActive : ''}`}
            onClick={() => setFilterStatus(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Lista de tareas */}
      {filteredTodos.length === 0 ? (
        <div className={styles.emptyState}>
          <CheckCircle2 size={36} color="var(--color-primary-soft)" style={{ marginBottom: 12 }} />
          <h3 className={styles.emptyTitle}>{emptyContent.title}</h3>
          <p className={styles.emptySubtitle}>{emptyContent.description}</p>
        </div>
      ) : (
        <div className={styles.todoList}>
          {filteredTodos.map(todo => (
            <div key={todo.id} className={styles.todoItem}>
              <input
                type="checkbox"
                id={`todo-${todo.id}`}
                aria-label={`completar ${todo.title}`}
                className={styles.todoCheckbox}
                checked={todo.completed}
                onChange={() => handleToggleTodo(todo.id)}
              />

              <span
                className={`${styles.todoTitle} ${todo.completed ? styles.todoCompleted : ''}`}
              >
                {todo.title}
              </span>

              <span className={styles.badgeCategory}>{todo.category}</span>
              <span className={getPriorityClass(todo.priority)}>
                {todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)}
              </span>

              <button
                type="button"
                className={styles.btnDelete}
                aria-label={`eliminar ${todo.title}`}
                onClick={() => handleDeleteTodo(todo.id)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
