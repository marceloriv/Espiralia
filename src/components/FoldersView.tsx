import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Folder as FolderIcon, ExternalLink, Pencil, Trash2, Link as LinkIcon, FileText } from 'lucide-react';
import { sileo } from 'sileo';
import type { Folder, LinkItem, Note } from '../types';
import { StorageService } from '../services/storage';
import { FolderModal } from './folders/FolderModal';
import { LinkModal } from './folders/LinkModal';
import styles from './FoldersView.module.css';

interface FoldersViewProps {
  profileId: string;
}

export const FoldersView: React.FC<FoldersViewProps> = ({ profileId }) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // Modals state
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);

  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null);

  const loadData = useCallback(() => {
    const fList = StorageService.getFolders(profileId);
    const lList = StorageService.getLinks(profileId);
    const nList = StorageService.getNotes(profileId);
    setFolders(fList);
    setLinks(lList);
    setNotes(nList);

    // Si la carpeta seleccionada ya no existe o es null y hay carpetas, seleccionar la primera
    if (fList.length > 0) {
      setSelectedFolderId((prev) => {
        if (!prev || !fList.some((f) => f.id === prev)) {
          return fList[0].id;
        }
        return prev;
      });
    } else {
      setSelectedFolderId(null);
    }
  }, [profileId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeFolder = useMemo(() => {
    return folders.find((f) => f.id === selectedFolderId) || null;
  }, [folders, selectedFolderId]);

  // Links y notas asociados a la carpeta activa
  const folderLinks = useMemo(() => {
    if (!activeFolder) return [];
    return links.filter((l) => l.folderId === activeFolder.id);
  }, [links, activeFolder]);

  const folderNotes = useMemo(() => {
    if (!activeFolder) return [];
    return notes.filter((n) => n.folderId === activeFolder.id);
  }, [notes, activeFolder]);

  // Handlers para carpetas
  const handleOpenNewFolder = () => {
    setEditingFolder(null);
    setIsFolderModalOpen(true);
  };

  const handleOpenEditFolder = (folder: Folder, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFolder(folder);
    setIsFolderModalOpen(true);
  };

  const handleSaveFolder = (data: { name: string; color?: string }) => {
    if (editingFolder) {
      const updated: Folder = {
        ...editingFolder,
        name: data.name,
        color: data.color,
      };
      StorageService.saveFolder(updated);
      try {
        sileo.success({ title: 'Carpeta actualizada', description: `Se guardaron los cambios de ${data.name}.` });
      } catch {
        // Ignorar
      }
    } else {
      const newFolder: Folder = {
        id: `folder-${Date.now()}`,
        profileId,
        name: data.name,
        color: data.color,
        createdAt: new Date().toISOString(),
      };
      StorageService.saveFolder(newFolder);
      setSelectedFolderId(newFolder.id);
      try {
        sileo.success({ title: 'Carpeta creada', description: `Se creó la carpeta ${data.name}.` });
      } catch {
        // Ignorar
      }
    }
    loadData();
  };

  const handleDeleteFolder = (folder: Folder, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`¿Seguro que deseas eliminar la carpeta "${folder.name}"? Los vínculos y notas no se borrarán pero quedarán sin carpeta.`)) {
      StorageService.deleteFolder(profileId, folder.id);
      try {
        sileo.info({ title: 'Carpeta eliminada', description: `Se eliminó la carpeta ${folder.name}.` });
      } catch {
        // Ignorar
      }
      loadData();
    }
  };

  // Handlers para vínculos
  const handleOpenNewLink = () => {
    setEditingLink(null);
    setIsLinkModalOpen(true);
  };

  const handleOpenEditLink = (link: LinkItem) => {
    setEditingLink(link);
    setIsLinkModalOpen(true);
  };

  const handleSaveLink = (data: { title: string; url: string; description?: string; folderId?: string }) => {
    if (editingLink) {
      const updated: LinkItem = {
        ...editingLink,
        ...data,
      };
      StorageService.saveLink(updated);
      try {
        sileo.success({ title: 'Vínculo actualizado', description: 'El enlace se ha modificado.' });
      } catch {
        // Ignorar
      }
    } else {
      const newLink: LinkItem = {
        id: `link-${Date.now()}`,
        profileId,
        title: data.title,
        url: data.url,
        description: data.description,
        folderId: data.folderId || activeFolder?.id,
        createdAt: new Date().toISOString(),
      };
      StorageService.saveLink(newLink);
      try {
        sileo.success({ title: 'Vínculo guardado', description: 'Enlace web registrado.' });
      } catch {
        // Ignorar
      }
    }
    loadData();
  };

  const handleDeleteLink = (link: LinkItem) => {
    if (window.confirm(`¿Deseas eliminar el vínculo "${link.title}"?`)) {
      StorageService.deleteLink(profileId, link.id);
      try {
        sileo.info({ title: 'Vínculo eliminado', description: 'Enlace borrado correctamente.' });
      } catch {
        // Ignorar
      }
      loadData();
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h2 className={styles.title}>Carpetas & Vínculos</h2>
          <p className={styles.subtitle}>
            Organización temática de estudio, universidad, licencia de conducir y documentación web
          </p>
        </div>

        <div className={styles.actionsArea}>
          <button
            type="button"
            className={styles.btnAdd}
            onClick={handleOpenNewFolder}
            aria-label="+ Nueva Carpeta"
          >
            <Plus size={18} aria-hidden="true" />
            <span>+ Nueva Carpeta</span>
          </button>
        </div>
      </header>

      {folders.length === 0 ? (
        <div className={styles.emptyState}>
          <FolderIcon size={44} color="var(--color-ink-muted, #888)" />
          <h3 className={styles.emptyTitle}>No tienes carpetas creadas</h3>
          <p className={styles.emptyText}>
            Crea carpetas temáticas para agrupar notas de estudio, enlaces web y postulaciones importantes.
          </p>
          <button type="button" className={styles.btnAdd} onClick={handleOpenNewFolder}>
            <Plus size={16} aria-hidden="true" />
            <span>Crear primera carpeta</span>
          </button>
        </div>
      ) : (
        <div className={styles.layout}>
          {/* Barra lateral de carpetas */}
          <aside className={styles.folderSidebar}>
            <span className={styles.folderListTitle}>Tus Carpetas ({folders.length})</span>
            {folders.map((folder) => {
              const linkCount = links.filter((l) => l.folderId === folder.id).length;
              const noteCount = notes.filter((n) => n.folderId === folder.id).length;
              const totalItems = linkCount + noteCount;
              const isSelected = folder.id === selectedFolderId;

              return (
                <div
                  key={folder.id}
                  className={`${styles.folderItem} ${isSelected ? styles.folderItemActive : ''}`}
                >
                  <button
                    type="button"
                    className={styles.folderSelectBtn}
                    onClick={() => setSelectedFolderId(folder.id)}
                    aria-pressed={isSelected}
                  >
                    <span
                      className={styles.colorDot}
                      style={{ backgroundColor: folder.color || '#3b82f6' }}
                    />
                    <span className={styles.folderItemName}>{folder.name}</span>
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span className={styles.folderBadgeCount}>{totalItems}</span>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      style={{ minHeight: 32, minWidth: 32 }}
                      onClick={(e) => handleOpenEditFolder(folder, e)}
                      aria-label={`Editar carpeta ${folder.name}`}
                    >
                      <Pencil size={13} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      style={{ minHeight: 32, minWidth: 32 }}
                      onClick={(e) => handleDeleteFolder(folder, e)}
                      aria-label={`Eliminar carpeta ${folder.name}`}
                    >
                      <Trash2 size={13} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })}
          </aside>

          {/* Contenido de la carpeta activa */}
          {activeFolder && (
            <main className={styles.contentArea}>
              <div className={styles.activeFolderHeader}>
                <h3 className={styles.activeFolderTitle}>
                  <FolderIcon
                    size={20}
                    color={activeFolder.color || '#3b82f6'}
                    style={{ verticalAlign: 'middle', marginRight: 8 }}
                  />
                  {activeFolder.name}
                </h3>
                <button
                  type="button"
                  className={styles.btnAdd}
                  onClick={handleOpenNewLink}
                  aria-label="+ Agregar Vínculo"
                >
                  <Plus size={16} aria-hidden="true" />
                  <span>+ Agregar Vínculo</span>
                </button>
              </div>

              {/* Sección Vínculos & Documentos Web */}
              <section className={styles.sectionBox}>
                <div className={styles.sectionHeader}>
                  <h4 className={styles.sectionTitle}>
                    <LinkIcon size={18} color="var(--color-accent, #c96442)" />
                    Vínculos & Documentos Web ({folderLinks.length})
                  </h4>
                </div>

                {folderLinks.length === 0 ? (
                  <div className={styles.emptySection}>
                    No hay vínculos web en esta carpeta. Haz clic en "+ Agregar Vínculo" para registrar uno.
                  </div>
                ) : (
                  <div className={styles.linkList}>
                    {folderLinks.map((link) => (
                      <div key={link.id} className={styles.linkCard}>
                        <div className={styles.linkInfo}>
                          <h5 className={styles.linkTitle}>{link.title}</h5>
                          {link.description && (
                            <p className={styles.linkDesc}>{link.description}</p>
                          )}
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.linkAnchor}
                            aria-label={`Abrir ${link.title}`}
                          >
                            <span>{link.url}</span>
                            <ExternalLink size={14} aria-hidden="true" />
                          </a>
                        </div>
                        <div className={styles.linkActions}>
                          <button
                            type="button"
                            className={styles.iconBtn}
                            onClick={() => handleOpenEditLink(link)}
                            aria-label={`Editar vínculo ${link.title}`}
                          >
                            <Pencil size={15} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className={styles.iconBtn}
                            onClick={() => handleDeleteLink(link)}
                            aria-label={`Eliminar vínculo ${link.title}`}
                          >
                            <Trash2 size={15} aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Sección Notas asociadas */}
              <section className={styles.sectionBox}>
                <div className={styles.sectionHeader}>
                  <h4 className={styles.sectionTitle}>
                    <FileText size={18} color="var(--color-accent, #c96442)" />
                    Notas en esta Carpeta ({folderNotes.length})
                  </h4>
                </div>

                {folderNotes.length === 0 ? (
                  <div className={styles.emptySection}>
                    No hay notas asociadas a esta carpeta. Puedes asignar notas a esta carpeta desde la vista de Notas.
                  </div>
                ) : (
                  <div className={styles.notesGrid}>
                    {folderNotes.map((note) => (
                      <div key={note.id} className={styles.noteItem}>
                        <h5 className={styles.noteItemTitle}>{note.title}</h5>
                        <p className={styles.noteItemSnippet}>{note.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </main>
          )}
        </div>
      )}

      <FolderModal
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        onSave={handleSaveFolder}
        initialFolder={editingFolder}
      />

      <LinkModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        onSave={handleSaveLink}
        initialLink={editingLink}
        defaultFolderId={activeFolder?.id}
        folders={folders}
      />
    </div>
  );
};
