import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Plus, BookOpen, FileText, Pencil, Trash2, Folder as FolderIcon } from 'lucide-react';
import { sileo } from 'sileo';
import type { Note, Folder } from '../types';
import { StorageService } from '../services/storage';
import { NoteModal } from './notes/NoteModal';
import styles from './NotesView.module.css';

interface NotesViewProps {
  profileId: string;
}

type TabType = 'all' | 'reflections' | 'quick';

export const NotesView: React.FC<NotesViewProps> = ({ profileId }) => {
  const [notes, setNotes] = useState<Note[]>(() => StorageService.getNotes(profileId));
  const [folders, setFolders] = useState<Folder[]>(() => StorageService.getFolders(profileId));
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const isFirstMount = useRef(true);

  const loadData = useCallback(() => {
    setNotes(StorageService.getNotes(profileId));
    setFolders(StorageService.getFolders(profileId));
  }, [profileId]);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    loadData();
  }, [loadData]);

  const handleOpenNew = () => {
    setEditingNote(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (note: Note) => {
    setEditingNote(note);
    setIsModalOpen(true);
  };

  const handleSaveNote = (noteData: {
    title: string;
    content: string;
    isReflection: boolean;
    folderId?: string;
    tags: string[];
  }) => {
    const now = new Date().toISOString();
    if (editingNote) {
      const updated: Note = {
        ...editingNote,
        ...noteData,
        updatedAt: now,
      };
      StorageService.saveNote(updated);
      try {
        sileo.success({ title: 'Nota actualizada', description: 'Los cambios se han guardado.' });
      } catch {
        // Ignorar si sileo no está disponible
      }
    } else {
      const newNote: Note = {
        id: `note-${Date.now()}`,
        profileId,
        ...noteData,
        createdAt: now,
        updatedAt: now,
      };
      StorageService.saveNote(newNote);
      try {
        sileo.success({ title: 'Nota creada', description: 'La nota se guardó correctamente.' });
      } catch {
        // Ignorar
      }
    }
    loadData();
  };

  const handleDeleteNote = (note: Note) => {
    if (window.confirm(`¿Seguro que deseas eliminar "${note.title}"?`)) {
      StorageService.deleteNote(profileId, note.id);
      try {
        sileo.info({ title: 'Nota eliminada', description: 'Se eliminó la nota.' });
      } catch {
        // Ignorar
      }
      loadData();
    }
  };

  const folderMap = useMemo(() => {
    const map = new Map<string, Folder>();
    for (const f of folders) {
      map.set(f.id, f);
    }
    return map;
  }, [folders]);

  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      // Tab filter
      if (activeTab === 'reflections' && !n.isReflection) return false;
      if (activeTab === 'quick' && n.isReflection) return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = n.title.toLowerCase().includes(query);
        const matchesContent = n.content.toLowerCase().includes(query);
        const matchesTags = (n.tags || []).some((t) => t.toLowerCase().includes(query));
        if (!matchesTitle && !matchesContent && !matchesTags) return false;
      }

      return true;
    });
  }, [notes, activeTab, searchQuery]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h2 className={styles.title}>Notas & Reflexiones</h2>
          <p className={styles.subtitle}>
            Cuaderno digital sin límites para autorregulación terapéutica y estudio
          </p>
        </div>

        <div className={styles.actionsArea}>
          <button
            type="button"
            className={styles.btnAdd}
            onClick={handleOpenNew}
            aria-label="+ Nueva Nota"
          >
            <Plus size={18} aria-hidden="true" />
            <span>+ Nueva Nota</span>
          </button>
        </div>
      </header>

      <section className={styles.filterBar}>
        <div className={styles.tabs} aria-label="Filtro de notas">
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'all' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('all')}
          >
            Todas ({notes.length})
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'reflections' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('reflections')}
          >
            <BookOpen size={16} aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Reflexiones & Diario ({notes.filter((n) => n.isReflection).length})
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'quick' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('quick')}
          >
            <FileText size={16} aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Notas Rápidas ({notes.filter((n) => !n.isReflection).length})
          </button>
        </div>

        <div style={{ position: 'relative' }}>
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Buscar por título, contenido o tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Buscar notas"
          />
        </div>
      </section>

      {filteredNotes.length === 0 ? (
        <div className={styles.emptyState}>
          <FileText size={40} color="var(--color-ink-muted, #888)" />
          <h3 className={styles.emptyTitle}>No hay notas para mostrar</h3>
          <p className={styles.emptyText}>
            {searchQuery
              ? 'No se encontraron notas que coincidan con la búsqueda.'
              : activeTab === 'reflections'
              ? 'Aún no has registrado reflexiones de diario para autorregulación.'
              : 'Empieza agregando tu primera nota o reflexión haciendo clic en "+ Nueva Nota".'}
          </p>
          <button type="button" className={styles.btnAdd} onClick={handleOpenNew}>
            <Plus size={16} aria-hidden="true" />
            <span>Crear nota ahora</span>
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredNotes.map((note) => {
            const folder = note.folderId ? folderMap.get(note.folderId) : undefined;
            return (
              <article
                key={note.id}
                className={`${styles.card} ${note.isReflection ? styles.cardReflection : ''}`}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.cardTopRow}>
                    <h3 className={styles.cardTitle}>{note.title}</h3>
                    {note.isReflection && (
                      <span className={`${styles.badge} ${styles.reflectionBadge}`}>
                        Reflexión
                      </span>
                    )}
                  </div>
                  {folder && (
                    <span className={`${styles.badge} ${styles.folderBadge}`}>
                      <FolderIcon size={12} style={{ marginRight: 4 }} />
                      {folder.name}
                    </span>
                  )}
                </div>

                <div className={styles.cardContent}>{note.content}</div>

                {note.tags && note.tags.length > 0 && (
                  <div className={styles.tagList}>
                    {note.tags.map((tag) => (
                      <span key={tag} className={styles.tag}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className={styles.cardFooter}>
                  <span className={styles.dateInfo}>
                    {note.updatedAt
                      ? new Date(note.updatedAt).toLocaleDateString('es-CL')
                      : ''}
                  </span>
                  <div className={styles.cardActions}>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      onClick={() => handleOpenEdit(note)}
                      aria-label={`Editar nota ${note.title}`}
                    >
                      <Pencil size={16} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      onClick={() => handleDeleteNote(note)}
                      aria-label={`Eliminar nota ${note.title}`}
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <NoteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveNote}
        initialNote={editingNote}
        folders={folders}
      />
    </div>
  );
};
