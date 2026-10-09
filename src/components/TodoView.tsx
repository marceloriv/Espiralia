import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react';
import type { TodoItem, Priority } from '../types';
import { StorageService } from '../services/storage';
import styles from './TodoView.module.css';

interface TodoViewProps {
  profileId: string;
}

type FilterStatus = 'todas' | 'pendientes' | 'completadas';

export const TodoView: React.FC<TodoViewProps> = ({ profileId }) => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [inputTitle, setInputTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('General');
  const [selectedPriority, setSelectedPriority] = useState<Priority>('media');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('todas');

  const loadTodos = () => {
    setTodos(StorageService.getTodos(profileId));
  };

  useEffect(() => {
    loadTodos();
  }, [profileId]);

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
    loadTodos();
  };

  const handleToggleTodo = (id: string) => {
    StorageService.toggleTodo(profileId, id);
    loadTodos();
  };

  const handleDeleteTodo = (id: string) => {
    StorageService.deleteTodo(profileId, id);
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
            value={inputTitle}
            onChange={e => setInputTitle(e.target.value)}
          />

          <select
            className={styles.selectCategory}
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
          <p>No hay tareas en esta sección.</p>
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
