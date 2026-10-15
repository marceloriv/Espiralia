import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  CheckSquare,
  Calendar,
  FileText,
  Target,
  Clock,
  ExternalLink,
  X,
} from 'lucide-react';
import type { ViewType } from '../../types';
import { SearchService, type SearchResultItem } from '../../services/searchService';
import styles from './GlobalSearchModal.module.css';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: ViewType) => void;
  profileId: string;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  profileId,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(-1);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, onClose]);

  const results = useMemo(() => {
    if (!isOpen) {
      return {
        todos: [],
        events: [],
        notes: [],
        goals: [],
        planner: [],
        links: [],
        totalCount: 0,
      };
    }
    return SearchService.search(profileId, query);
  }, [isOpen, profileId, query]);

  const flatResults = useMemo<SearchResultItem[]>(() => {
    return [
      ...results.todos,
      ...results.events,
      ...results.notes,
      ...results.goals,
      ...results.planner,
      ...results.links,
    ];
  }, [results]);

  useEffect(() => {
    setSelectedIndex(flatResults.length > 0 ? 0 : -1);
  }, [flatResults]);

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }

    if (flatResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % flatResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + flatResults.length) % flatResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = flatResults[selectedIndex >= 0 ? selectedIndex : 0];
      if (target) {
        onNavigate(target.targetView);
        onClose();
      }
    }
  };

  const handleItemClick = (item: SearchResultItem) => {
    onNavigate(item.targetView);
    onClose();
  };

  const renderGroup = (
    title: string,
    icon: React.ReactNode,
    items: SearchResultItem[]
  ) => {
    if (items.length === 0) return null;

    return (
      <div className={styles.groupSection}>
        <div className={styles.groupHeader}>
          {icon}
          <span>{title} ({items.length})</span>
        </div>
        <ul className={styles.resultList} role="listbox" aria-label={title}>
          {items.map(item => {
            const itemIndex = flatResults.findIndex(r => r.id === item.id && r.type === item.type);
            const isSelected = itemIndex === selectedIndex;

            return (
              <li key={`${item.type}-${item.id}`} role="none">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`${styles.resultItem} ${isSelected ? styles.resultItemActive : ''}`}
                  onClick={() => handleItemClick(item)}
                  onMouseEnter={() => setSelectedIndex(itemIndex)}
                >
                  <div className={styles.itemContent}>
                    <span className={styles.itemTitle}>{item.title}</span>
                    {item.subtitle && (
                      <span className={styles.itemSubtitle}>{item.subtitle}</span>
                    )}
                  </div>
                  <div className={styles.itemMeta}>
                    {item.dateInfo && (
                      <span className={styles.itemDate}>{item.dateInfo}</span>
                    )}
                    {item.badge && (
                      <span className={styles.itemBadge}>{item.badge}</span>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  const statusMessage =
    query.trim().length < 2
      ? ''
      : results.totalCount === 0
        ? `No se encontraron resultados para "${query}"`
        : results.totalCount === 1
          ? 'Se encontró 1 resultado'
          : `Se encontraron ${results.totalCount} resultados`;

  return (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label="Búsqueda global"
        onKeyDown={handleKeyDown}
      >
        <div className={styles.searchHeader}>
          <Search size={18} className={styles.searchIcon} aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            role="searchbox"
            className={styles.searchInput}
            placeholder="Buscar eventos, tareas, notas, metas o enlaces..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Buscar en toda la aplicación"
            aria-controls="search-results-region"
          />
          {query.length > 0 && (
            <button
              type="button"
              className={styles.clearButton}
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              aria-label="Limpiar búsqueda"
            >
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </div>

        <div
          id="search-results-region"
          className={styles.resultsBody}
        >
          {/* Región de anuncio accesible */}
          <div role="status" aria-live="polite" className={styles.srOnly}>
            {statusMessage}
          </div>

          {query.trim().length < 2 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>Búsqueda rápida en Espiralia</p>
              <p className={styles.emptySubtitle}>
                Escribe al menos 2 letras para buscar en todas tus tareas, eventos, notas, metas y vínculos.
              </p>
            </div>
          ) : results.totalCount === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>
                No se encontraron resultados para &ldquo;{query}&rdquo;
              </p>
              <p className={styles.emptySubtitle}>
                Intenta con palabras más cortas o revisa la ortografía.
              </p>
            </div>
          ) : (
            <>
              {renderGroup('Tareas To-Do', <CheckSquare size={14} aria-hidden="true" />, results.todos)}
              {renderGroup('Eventos de Agenda', <Calendar size={14} aria-hidden="true" />, results.events)}
              {renderGroup('Notas & Reflexiones', <FileText size={14} aria-hidden="true" />, results.notes)}
              {renderGroup('Metas', <Target size={14} aria-hidden="true" />, results.goals)}
              {renderGroup('Planner', <Clock size={14} aria-hidden="true" />, results.planner)}
              {renderGroup('Vínculos Web', <ExternalLink size={14} aria-hidden="true" />, results.links)}
            </>
          )}
        </div>

        <div className={styles.footer}>
          <div className={styles.footerShortcuts}>
            <span><kbd>↑</kbd><kbd>↓</kbd> navegar</span>
            <span><kbd>↵</kbd> abrir</span>
            <span><kbd>esc</kbd> salir</span>
          </div>
          <span>Búsqueda instantánea 100% offline</span>
        </div>
      </div>
    </div>
  );
};
