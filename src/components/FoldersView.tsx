import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Folder as FolderIcon,
  ExternalLink,
  Pencil,
  Trash2,
  BookmarkPlus,
  FolderPlus,
  Shield,
  FileText,
  Pin,
} from 'lucide-react';
import { sileo } from 'sileo';
import type { Folder, LinkItem, Note, Profile, ViewType } from '../types';
import { StorageService, LOCALSTORAGE_QUOTA_BYTES } from '../services/storage';
import { formatBytes } from '../utils/formatBytes';
import { FolderModal } from './folders/FolderModal';
import { LinkModal } from './folders/LinkModal';
import { NoteModal } from './notes/NoteModal';
import { Papel, TINTE_DE_MODULO } from './common/Papel';
import styles from './FoldersView.module.css';

interface FoldersViewProps {
  profileId?: string;
  profile?: Profile;
  onNavigate?: (view: ViewType) => void;
}

export const FoldersView: React.FC<FoldersViewProps> = ({ profileId: propProfileId, profile, onNavigate: _onNavigate }) => {
  const profileId = profile?.id ?? propProfileId ?? '';
  const [folders, setFolders] = useState<Folder[]>(() => StorageService.getFolders(profileId));
  const [links, setLinks] = useState<LinkItem[]>(() => StorageService.getLinks(profileId));
  const [notes, setNotes] = useState<Note[]>(() => StorageService.getNotes(profileId));
  const [userSelectedFolderId, setUserSelectedFolderId] = useState<string | null>(null);
  const [quickUrl, setQuickUrl] = useState('');
  const [quickFolderId, setQuickFolderId] = useState('');
  const isFirstMount = useRef(true);

  // Modals state
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);

  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null);

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const loadData = useCallback(() => {
    setFolders(StorageService.getFolders(profileId));
    setLinks(StorageService.getLinks(profileId));
    setNotes(StorageService.getNotes(profileId));
  }, [profileId]);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    loadData();
  }, [loadData]);

  const displayFolders = useMemo(
    () =>
      folders.map((f, idx) => ({
        id: f.id,
        num: String(idx + 1).padStart(2, '0'),
        name: f.name,
        color: f.color || '#7b8c9e',
        desc: 'Carpeta temática archivada en tu navegador local.',
        specs: `${links.filter((l) => l.folderId === f.id).length + notes.filter((n) => n.folderId === f.id).length} Elementos`,
        icon: <FolderIcon size={26} aria-hidden="true" />,
        tag: `${String(idx + 1).padStart(2, '0')} / ARCHIVO`,
        isCustom: true,
      })),
    [folders, links, notes],
  );

  const selectedFolderId = useMemo(() => {
    if (userSelectedFolderId && displayFolders.some((f) => f.id === userSelectedFolderId)) {
      return userSelectedFolderId;
    }
    return displayFolders[0]?.id ?? '';
  }, [displayFolders, userSelectedFolderId]);

  const activeFolder = useMemo(() => {
    return displayFolders.find((f) => f.id === selectedFolderId) || displayFolders[0];
  }, [displayFolders, selectedFolderId]);

  const storageBytes = StorageService.getProfileStorageBytes(profileId);

  // Notas asociadas a la carpeta activa
  const folderNotes = useMemo(() => {
    if (!activeFolder) return [];
    return notes.filter((n) => n.folderId === activeFolder.id);
  }, [notes, activeFolder]);

  // Enlaces asociados a la carpeta activa
  const folderLinks = useMemo(() => {
    if (!activeFolder) return [];
    return links.filter((l) => l.folderId === activeFolder.id);
  }, [links, activeFolder]);

  // Elementos unificados para la tabla de fichas
  const folderItems = useMemo(() => {
    const items: Array<
      | { type: 'note'; id: string; code: string; title: string; format: string; date: string; note: Note }
      | { type: 'link'; id: string; code: string; title: string; format: string; date: string; link: LinkItem }
    > = [];

    folderNotes.forEach((n, idx) => {
      const dateStr = n.updatedAt || n.createdAt || '';
      const dateFormatted = dateStr ? dateStr.slice(0, 10) : 'Hoy';
      items.push({
        type: 'note',
        id: n.id,
        code: `DOC-N.${idx + 1}`,
        title: n.title || 'Nota sin título',
        format: n.isReflection ? 'Pliego Reflexivo' : 'Nota de Bitácora',
        date: dateFormatted,
        note: n,
      });
    });

    folderLinks.forEach((l, idx) => {
      const dateStr = l.createdAt || '';
      const dateFormatted = dateStr ? dateStr.slice(0, 10) : 'Hoy';
      items.push({
        type: 'link',
        id: l.id,
        code: `LNK-${idx + 1}`,
        title: l.title || l.url,
        format: 'Vínculo Web',
        date: dateFormatted,
        link: l,
      });
    });

    return items;
  }, [folderNotes, folderLinks]);

  const handleOpenNewNote = () => {
    setEditingNote(null);
    setIsNoteModalOpen(true);
  };

  const handleOpenViewNote = (note: Note) => {
    setEditingNote(note);
    setIsNoteModalOpen(true);
  };

  const handleOpenViewLink = (link: LinkItem) => {
    if (link.url) {
      window.open(link.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleSaveNote = (noteData: {
    title: string;
    content: string;
    isReflection: boolean;
    folderId?: string;
    tags: string[];
  }) => {
    if (editingNote) {
      const updated: Note = {
        ...editingNote,
        ...noteData,
        updatedAt: new Date().toISOString(),
      };
      StorageService.saveNote(updated);
      try {
        sileo.success({ title: 'Nota actualizada', description: `Se guardaron los cambios en ${noteData.title}` });
      } catch {}
    } else {
      const newNote: Note = {
        id: `note-${Date.now()}`,
        profileId,
        folderId: noteData.folderId || activeFolder?.id,
        ...noteData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      StorageService.saveNote(newNote);
      try {
        sileo.success({ title: 'Nota creada', description: `Se creó la nota ${noteData.title}` });
      } catch {}
    }
    setIsNoteModalOpen(false);
    loadData();
  };

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
      setUserSelectedFolderId(newFolder.id);
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

  const handleQuickCapture = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickUrl.trim()) return;

    // Sin carpetas el enlace se guarda sin carpeta, nunca con un id inventado.
    const targetFolderId = quickFolderId || folders[0]?.id;

    const cleanTitle = quickUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const newLink: LinkItem = {
      id: `link-${Date.now()}`,
      profileId,
      title: cleanTitle,
      url: quickUrl.startsWith('http') ? quickUrl : `https://${quickUrl}`,
      description: 'Enlace archivado velozmente desde portapapeles.',
      folderId: targetFolderId,
      createdAt: new Date().toISOString(),
    };
    StorageService.saveLink(newLink);
    setQuickUrl('');
    loadData();
    try {
      sileo.success({ title: 'Vínculo archivado', description: `Se guardó ${cleanTitle}.` });
    } catch {
      // Ignorar
    }
  };

  const handleExportJson = () => {
    const dataToExport = {
      profileId,
      exportDate: new Date().toISOString(),
      folders: StorageService.getFolders(profileId),
      links: StorageService.getLinks(profileId),
      notes: StorageService.getNotes(profileId),
    };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `espiralia-carpetas-${profileId}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.container}>
      {/* Accessible hidden header for legacy test assertions */}
      <h2 className={styles.visuallyHidden}>Carpetas &amp; Vínculos</h2>

      {/* Top Header & Stationery Actions */}
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>Explorador de Carpetas &amp; Vínculos</h1>
          <p className={styles.subtitle}>
            Tus carpetas, notas y enlaces guardados en este navegador.
          </p>
        </div>

        <div className={styles.actionsArea}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={handleOpenNewLink}
            aria-label="+ Guardar Enlace"
          >
            <BookmarkPlus size={18} aria-hidden="true" />
            <span>+ Guardar Enlace</span>
          </button>
          <button
            type="button"
            className={styles.btnAdd}
            onClick={handleOpenNewFolder}
            aria-label="+ Nueva Carpeta"
          >
            <FolderPlus size={18} aria-hidden="true" />
            <span>+ Nueva Carpeta</span>
          </button>
        </div>
      </header>

      {/* Hero Desk Stage: Folders & Sticky Ephemera */}
      <div className={styles.deskStage}>
        {/* Left: Stepped Solapas Cabinet (8 Cols) */}
        <section className={styles.ficheroSection}>
          <div className={styles.ficheroTopBar}>
            <div className={styles.ficheroBrand}>
              <FolderIcon size={20} color="var(--color-primary)" aria-hidden="true" />
              <span className={styles.ficheroTitle}>Fichero de Índice Manuscrito</span>
              <span className={styles.countBadge}>{displayFolders.length} Carpetas Activas</span>
            </div>
          </div>

          {displayFolders.length === 0 ? (
            <div className={styles.emptyFolders}>
              <FolderPlus size={32} aria-hidden="true" />
              <h3 className={styles.emptyFoldersTitle}>Aún no tienes carpetas</h3>
              <p className={styles.emptyFoldersText}>
                Crea una para ordenar tus notas y enlaces. También puedes guardar enlaces sin carpeta.
              </p>
              <button type="button" className={styles.btnAdd} onClick={handleOpenNewFolder}>
                <FolderPlus size={18} aria-hidden="true" />
                <span>Crear mi primera carpeta</span>
              </button>
            </div>
          ) : (
            <>
          {/* Stepped Tabbed File Cabinet System */}
          <div style={{ paddingTop: '0.5rem', position: 'relative' }}>
            {/* Flat Modern Folder Tabs */}
            <div className={styles.flatFoldersRow} role="tablist" aria-label="Solapas de carpetas">
              {displayFolders.map((df) => {
                const isActive = df.id === selectedFolderId;
                const folderColor = df.color || '#E5B23E';

                return (
                  <button
                    key={df.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={`${styles.flatFolderTab} ${isActive ? styles.flatFolderActive : ''}`}
                    onClick={() => setUserSelectedFolderId(df.id)}
                    style={{
                      ['--folder-color' as any]: folderColor,
                    }}
                  >
                    <div className={styles.flatBackFlap} aria-hidden="true" />
                    <div className={styles.flatSheets} data-testid="folder-flat-sheets" aria-hidden="true">
                      <div className={`${styles.sheetFlatLine} ${styles.sheetFlatAccent}`} />
                      <div className={styles.sheetFlatLine} />
                    </div>
                    <div className={styles.flatFrontFlap} data-front-flap="true">
                      <div className={styles.flatFolderTitle}>
                        <span className={styles.flatTabNum}>{df.num}</span>
                        <span>{df.name}</span>
                      </div>
                      <span className={styles.flatCountPill}>
                        {df.specs.split(' ')[0]}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Main File Folder Body (Heavy Cartulina Paper) */}
            <Papel as="div" tinte={TINTE_DE_MODULO.carpetas}>
              {/* Folder Header Details */}
              <div className={styles.folderHeaderDetails}>
                <div className={styles.folderLead}>
                  <div className={styles.folderIconBox}>
                    {activeFolder?.icon}
                  </div>
                  <div className={styles.folderTitleGroup}>
                    <div className={styles.folderTitleRow}>
                      <h3 className={styles.folderTitle}>
                        {activeFolder?.num}. {activeFolder?.name}
                      </h3>
                      {activeFolder?.isCustom && (
                        <div style={{ display: 'inline-flex', gap: 6, marginLeft: 8 }}>
                          <button
                            type="button"
                            className={styles.btnActionTable}
                            onClick={(e) => {
                              const found = folders.find((f) => f.id === activeFolder.id);
                              if (found) handleOpenEditFolder(found, e);
                            }}
                            title="Editar Carpeta"
                          >
                            <Pencil size={13} aria-hidden="true" style={{ marginRight: 4 }} />
                            Editar
                          </button>
                          <button
                            type="button"
                            className={styles.btnActionTable}
                            onClick={(e) => {
                              const found = folders.find((f) => f.id === activeFolder.id);
                              if (found) handleDeleteFolder(found, e);
                            }}
                            title="Eliminar Carpeta"
                          >
                            <Trash2 size={13} aria-hidden="true" style={{ marginRight: 4 }} />
                            Eliminar
                          </button>
                        </div>
                      )}
                    </div>
                    <p className={styles.folderDesc}>{activeFolder?.desc}</p>
                  </div>
                </div>

                {/* Folder Meta Specs */}
                <div className={styles.folderMetaSpecs}>
                  <div className={styles.metaCol}>
                    <span className={styles.metaLabel}>INVENTARIO</span>
                    <span className={styles.metaValAccent}>{activeFolder?.specs}</span>
                  </div>
                </div>
              </div>

              {/* Inner Folder Filing Grid: Documents & Ledger Items */}
              <div className={styles.ledgerContainer}>
                <div className={styles.ledgerSubheader}>
                  <span>Fichas &amp; Manuscritos en esta Carpeta</span>
                </div>

                {/* Ledger Table Layout */}
                <div className={styles.ledgerTableWrapper}>
                  <table className={styles.ledgerTable}>
                    <thead className={styles.ledgerThead}>
                      <tr>
                        <th className={styles.ledgerTh}>CÓDIGO</th>
                        <th className={styles.ledgerTh}>TÍTULO DEL DOCUMENTO</th>
                        <th className={styles.ledgerTh}>TIPO / FORMATO</th>
                        <th className={styles.ledgerTh}>REGISTRO</th>
                        <th className={styles.ledgerTh} style={{ textAlign: 'right' }}>ACCIÓN</th>
                      </tr>
                    </thead>
                    <tbody>
                      {folderItems.length === 0 ? (
                        <tr>
                          <td colSpan={5} className={styles.emptyTableTd}>
                            <div className={styles.emptyTableBox}>
                              <p className={styles.emptyTableText}>
                                Esta carpeta no contiene notas ni enlaces vinculados todavía.
                              </p>
                              <div className={styles.emptyTableActions}>
                                <button
                                  type="button"
                                  className={styles.emptyTableBtn}
                                  onClick={handleOpenNewNote}
                                >
                                  + Nueva Nota
                                </button>
                                <button
                                  type="button"
                                  className={styles.emptyTableBtn}
                                  onClick={handleOpenNewLink}
                                >
                                  + Nuevo Enlace
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        folderItems.map((item) => (
                          <tr key={item.id} className={styles.ledgerRow}>
                            <td className={`${styles.ledgerTd} ${styles.docCode}`}>
                              <span className={styles.catalogRodHole} aria-hidden="true" />
                              <span>{item.code}</span>
                            </td>
                            <td className={styles.ledgerTd}>
                              <div className={styles.docTitleBox}>
                                {item.type === 'note' ? (
                                  <FileText size={18} color="var(--color-primary)" aria-hidden="true" />
                                ) : (
                                  <ExternalLink size={18} color="var(--color-accent-teal, #5db8a6)" aria-hidden="true" />
                                )}
                                <span className={styles.docTitle}>{item.title}</span>
                              </div>
                            </td>
                            <td className={styles.ledgerTd}>
                              <span className={styles.docFormatPill}>{item.format}</span>
                            </td>
                            <td className={`${styles.ledgerTd} ${styles.docDate}`}>{item.date}</td>
                            <td className={styles.ledgerTd} style={{ textAlign: 'right' }}>
                              <button
                                type="button"
                                className={styles.btnActionTable}
                                onClick={() => {
                                  if (item.type === 'note') {
                                    handleOpenViewNote(item.note);
                                  } else {
                                    handleOpenViewLink(item.link);
                                  }
                                }}
                                aria-label={`Ver ficha ${item.title}`}
                              >
                                Ver Ficha
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Index Footnote & Quick Sub-Actions */}
                <div className={styles.ledgerFootnote}>
                  <div className={styles.ledgerSubActions}>
                    <button
                      type="button"
                      className={styles.btnSubAction}
                      onClick={handleOpenNewLink}
                      aria-label="+ Agregar Vínculo"
                    >
                      + Agregar Vínculo
                    </button>
                  </div>
                </div>
              </div>
            </Papel>
          </div>

          {/* Inactive Folders as Stacked Preview Strip */}
          <div className={styles.stackedPreviewGrid}>
            {displayFolders
              .filter((f) => f.id !== selectedFolderId)
              .slice(0, 3)
              .map((df) => (
                <div
                  key={df.id}
                  className={styles.miniFolderCard}
                  onClick={() => setUserSelectedFolderId(df.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setUserSelectedFolderId(df.id);
                    }
                  }}
                  aria-label={`Seleccionar carpeta ${df.name}`}
                >
                  <span className={styles.miniWatermark} aria-hidden="true">{df.num}</span>
                  <div className={styles.miniHeader}>
                    <span className={styles.miniTag}>{df.tag}</span>
                    <span style={{ color: 'var(--color-ink-muted, #6c6a64)' }}>{df.icon}</span>
                  </div>
                  <h4 className={styles.miniTitle}>{df.name}</h4>
                  <p className={styles.miniDesc}>{df.desc}</p>
                  <div className={styles.miniFooter}>
                    <span>{df.specs}</span>
                  </div>
                </div>
              ))}
          </div>
            </>
          )}
        </section>

        {/* Right: Tangible Paper Ephemera & Fast Capture (4 Cols) */}
        <div className={styles.ephemeraColumn}>
          {/* Sticky Adhesive Note with Gold Paperclip */}
          <div className={styles.stickyWrapper}>
            <div className={styles.goldClip} aria-hidden="true"></div>
            <div className={styles.stickyNote}>
              <div className={styles.stickyHeader}>
                <span className={styles.stickyLabel}>MANIFIESTO DEL TALLER</span>
                <Pin size={13} aria-hidden="true" />
              </div>
              <p className={styles.stickyQuote}>
                “Tus documentos y enlaces organizados como en un fichero de roble físico, 100% en tu navegador.”
              </p>
            </div>
          </div>

          {/* Quick Capture Card */}
          <Papel as="section" tinte={TINTE_DE_MODULO.carpetas} aria-label="Captura veloz de enlace">
            <div className={styles.quickCaptureCard}>
              <div className={styles.quickCaptureHeader}>
                <div className={styles.quickCaptureLead}>
                  <BookmarkPlus size={20} color="var(--color-primary)" aria-hidden="true" />
                  <h4 className={styles.quickCaptureTitle}>Captura Veloz de Enlace</h4>
                </div>
              </div>
              <p className={styles.quickCaptureDesc}>
                Pega una URL y elige la carpeta donde guardarla.
              </p>
              <form onSubmit={handleQuickCapture} className={styles.quickCaptureForm}>
                <input
                  type="url"
                  className={styles.inputUrl}
                  placeholder="https://..."
                  value={quickUrl}
                  onChange={(e) => setQuickUrl(e.target.value)}
                  aria-label="URL para captura veloz"
                />
                <div className={styles.quickCaptureRow}>
                  <select
                    className={styles.selectFolder}
                    value={quickFolderId}
                    onChange={(e) => setQuickFolderId(e.target.value)}
                    aria-label="Carpeta de destino"
                  >
                    {displayFolders.length === 0 && <option value="">Sin carpeta</option>}
                    {displayFolders.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.num}. {f.name}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className={styles.btnArchivar}>
                    Archivar
                  </button>
                </div>
              </form>
            </div>
          </Papel>

          {/* Storage Physical Analogy Widget */}
          <div className={styles.storageWidget}>
            <div className={styles.storageHeader}>
              <span className={styles.storageTitle}>Almacenamiento Local (localStorage)</span>
              <span className={styles.storageValue}>{formatBytes(storageBytes)} de ~{formatBytes(LOCALSTORAGE_QUOTA_BYTES)}</span>
            </div>
            <div className={styles.storageProgressBar}>
              <div
                className={styles.storageProgressFill}
                style={{ width: `${Math.min(100, (storageBytes / LOCALSTORAGE_QUOTA_BYTES) * 100)}%` }}
              ></div>
            </div>
            <div className={styles.storageFooter}>
              <span className={styles.shieldText}>
                <Shield size={14} color="#5db872" aria-hidden="true" />
                <span>Sin telemetría externa</span>
              </span>
              <button
                type="button"
                className={styles.btnBackupLink}
                onClick={handleExportJson}
              >
                Hacer Respaldo .JSON
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Catálogo de Vínculos & Recursos Web */}
      <section className={styles.catalogSection}>
        <div className={styles.catalogHeaderRow}>
          <div className={styles.catalogLead}>
            <div className={styles.catalogIconBox}>
              <BookmarkPlus size={20} aria-hidden="true" />
            </div>
            <div>
              <h3 className={styles.catalogTitle}>Catálogo de Vínculos &amp; Recursos Web</h3>
            </div>
          </div>

        </div>

        {/* Bento Grid of Ephemeral Bookmarks */}
        <div className={styles.bookmarkGrid}>
          {links.length === 0 ? (
            <div
              style={{
                gridColumn: '1 / -1',
                padding: '36px 20px',
                textAlign: 'center',
                backgroundColor: 'var(--color-surface-card)',
                borderRadius: 'var(--radius-md)',
                border: '1px dashed var(--color-hairline)',
                color: 'var(--color-ink-muted)',
              }}
            >
              <BookmarkPlus size={32} style={{ margin: '0 auto 12px auto', opacity: 0.6 }} aria-hidden="true" />
              <p style={{ margin: '0 0 6px 0', fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-ink)' }}>
                Sin marcadores guardados todavía
              </p>
              <p style={{ margin: '0 0 16px 0', fontSize: '0.8125rem' }}>
                Guarda tus enlaces y referencias web para tenerlos a mano en tu escritorio.
              </p>
              <button
                type="button"
                className={styles.pillBtn}
                style={{ margin: '0 auto' }}
                onClick={() => {
                  setEditingLink(null);
                  setIsLinkModalOpen(true);
                }}
              >
                + Guardar Enlace
              </button>
            </div>
          ) : (
            links.map((link) => {
              const folder = folders.find(f => f.id === link.folderId);
              const badgeText = folder ? folder.name.toUpperCase() : 'VÍNCULO LOCAL';
              const domain = link.url.replace(/^https?:\/\//, '').split('/')[0];

              return (
                <Papel key={link.id} as="article" tinte={TINTE_DE_MODULO.carpetas} className={styles.bookmarkCardWrapper}>
                  <div className={styles.bookmarkCard}>
                    <div>
                      <div className={styles.bookmarkTop}>
                        <span className={`${styles.bookmarkAreaBadge} ${styles.bookmarkAreaBadgePurple}`}>
                          {badgeText}
                        </span>
                        <div className={styles.userLinkActions}>
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.bookmarkLinkAnchor}
                            aria-label={`Abrir ${link.title}`}
                          >
                            <ExternalLink size={16} aria-hidden="true" />
                          </a>
                          <button
                            type="button"
                            className={styles.iconBtn}
                            onClick={() => handleOpenEditLink(link)}
                            aria-label={`Editar vínculo ${link.title}`}
                          >
                            <Pencil size={14} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className={styles.iconBtn}
                            onClick={() => handleDeleteLink(link)}
                            aria-label={`Eliminar vínculo ${link.title}`}
                          >
                            <Trash2 size={14} aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                      <h4 className={styles.bookmarkCardTitle}>{link.title}</h4>
                      <p className={styles.bookmarkCardSnippet}>
                        {link.description || 'Vínculo web guardado en tu cartulina local.'}
                      </p>
                    </div>
                    <div className={styles.bookmarkCardFooter}>
                      <span className={styles.bookmarkDomain}>{domain}</span>
                      <span className={styles.bookmarkExtra}>{folder ? folder.name : 'Local'}</span>
                    </div>
                  </div>
                </Papel>
              );
            })
          )}
        </div>
      </section>

      {/* Modals for Folder & Link Creation */}
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

      <NoteModal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        onSave={handleSaveNote}
        initialNote={editingNote}
        folders={folders}
      />
    </div>
  );
};
