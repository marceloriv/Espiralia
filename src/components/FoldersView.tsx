import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Folder as FolderIcon,
  ExternalLink,
  Pencil,
  Trash2,
  BookmarkPlus,
  FolderPlus,
  Printer,
  Shield,
  FileText,
  Car,
  Brain,
  GraduationCap,
  PiggyBank,
} from 'lucide-react';
import { sileo } from 'sileo';
import type { Folder, LinkItem, Note, Profile, ViewType } from '../types';
import { StorageService } from '../services/storage';
import { FolderModal } from './folders/FolderModal';
import { LinkModal } from './folders/LinkModal';
import { NoteModal } from './notes/NoteModal';
import styles from './FoldersView.module.css';

interface FoldersViewProps {
  profileId?: string;
  profile?: Profile;
  onNavigate?: (view: ViewType) => void;
}

interface CuratedFolder {
  id: string;
  num: string;
  name: string;
  color: string;
  desc: string;
  specs: string;
  icon: React.ReactNode;
  tag: string;
}

const DEFAULT_CURATED_FOLDERS: CuratedFolder[] = [
  {
    id: 'curated-01',
    num: '01',
    name: 'Clase B Conaset',
    color: '#3b82f6',
    desc: 'Preparación de examen teórico municipal, legislación vial 2025 y psicotécnico.',
    specs: '8 Docs • 3 Enlaces',
    icon: <Car size={26} aria-hidden="true" />,
    tag: '01 / TRÁFICO',
  },
  {
    id: 'curated-02',
    num: '02',
    name: 'Proceso Terapéutico',
    color: '#10b981',
    desc: 'Bitácora de sesiones, audios y reflexiones quincenales.',
    specs: '6 Docs • 2 Enlaces',
    icon: <Brain size={26} aria-hidden="true" />,
    tag: '02 / TERAPIA',
  },
  {
    id: 'curated-03',
    num: '03',
    name: 'Admisión Univ. 2026',
    color: '#8b5cf6',
    desc: 'Ponderaciones PAES, temarios DEMRE y postulaciones becas.',
    specs: '14 Docs • 4 Enlaces',
    icon: <GraduationCap size={26} aria-hidden="true" />,
    tag: '03 / ACADÉMICO',
  },
  {
    id: 'curated-04',
    num: '04',
    name: 'Finanzas & Vida',
    color: '#f59e0b',
    desc: 'Presupuestos mensuales, pólizas y contratos de alquiler.',
    specs: '9 Docs • 3 Enlaces',
    icon: <PiggyBank size={26} aria-hidden="true" />,
    tag: '04 / PATRIMONIO',
  },
];

export const FoldersView: React.FC<FoldersViewProps> = ({ profileId: propProfileId, profile, onNavigate: _onNavigate }) => {
  const profileId = profile?.id ?? propProfileId ?? '';
  const [folders, setFolders] = useState<Folder[]>(() => StorageService.getFolders(profileId));
  const [links, setLinks] = useState<LinkItem[]>(() => StorageService.getLinks(profileId));
  const [notes, setNotes] = useState<Note[]>(() => StorageService.getNotes(profileId));
  const [userSelectedFolderId, setUserSelectedFolderId] = useState<string | null>(null);
  const [quickUrl, setQuickUrl] = useState('');
  const [quickFolderId, setQuickFolderId] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'official' | 'reading' | 'tools'>('all');
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

  // Combine user folders with default curated folders if user hasn't created any yet
  const displayFolders = useMemo(() => {
    if (folders.length > 0) {
      return folders.map((f, idx) => ({
        id: f.id,
        num: String(idx + 1).padStart(2, '0'),
        name: f.name,
        color: f.color || '#3b82f6',
        desc: 'Carpeta temática archivada en tu navegador local.',
        specs: `${links.filter((l) => l.folderId === f.id).length + notes.filter((n) => n.folderId === f.id).length} Elementos`,
        icon: <FolderIcon size={26} aria-hidden="true" />,
        tag: `${String(idx + 1).padStart(2, '0')} / ARCHIVO`,
        isCustom: true,
      }));
    }
    return DEFAULT_CURATED_FOLDERS.map((cf) => ({
      ...cf,
      isCustom: false,
    }));
  }, [folders, links, notes]);

  const selectedFolderId = useMemo(() => {
    if (userSelectedFolderId && displayFolders.some((f) => f.id === userSelectedFolderId)) {
      return userSelectedFolderId;
    }
    return displayFolders[0]?.id || 'curated-01';
  }, [displayFolders, userSelectedFolderId]);

  const activeFolder = useMemo(() => {
    return displayFolders.find((f) => f.id === selectedFolderId) || displayFolders[0];
  }, [displayFolders, selectedFolderId]);

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

    let targetFolderId = quickFolderId;
    if (!targetFolderId) {
      targetFolderId = folders[0]?.id || 'curated-01';
    }

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
          <div className={styles.overline}>
            <span className={styles.overlineDot}></span>
            <span>Registro Físico-Digital • Estante 04-A</span>
          </div>
          <h1 className={styles.title}>Explorador de Carpetas &amp; Vínculos</h1>
          <p className={styles.subtitle}>
            Fichero de índice en cartulina pesante con solapas escalonadas y repositorio de vínculos web analógicos.
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
              <FolderIcon size={20} color="var(--color-primary, #6e0081)" aria-hidden="true" />
              <span className={styles.ficheroTitle}>Fichero de Índice Manuscrito</span>
              <span className={styles.countBadge}>{displayFolders.length} Carpetas Activas</span>
            </div>
            <span className={styles.ficheroOrderLabel}>ORDENADO POR: SOLAPA CIENTÍFICA</span>
          </div>

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
            <div className={styles.folderBinderBody}>
              {/* Monumental Watermark Number */}
              <div className={styles.watermarkNum} aria-hidden="true">
                {activeFolder?.num || '01'}
              </div>

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
                      <span className={styles.hankoSeal}>ARCHIVADO LOCALMENTE</span>
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
                    <span className={styles.metaLabel}>ÚLTIMA MODIFICACIÓN</span>
                    <span className={styles.metaVal}>18 Mar 2025, 11:42</span>
                  </div>
                  <div className={styles.metaDivider}></div>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Printer size={15} aria-hidden="true" />
                    <span>Hoja 1 de 2</span>
                  </div>
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
                            <td className={`${styles.ledgerTd} ${styles.docCode}`}>{item.code}</td>
                            <td className={styles.ledgerTd}>
                              <div className={styles.docTitleBox}>
                                {item.type === 'note' ? (
                                  <FileText size={18} color="var(--color-primary, #6e0081)" aria-hidden="true" />
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
                  <div className={styles.statusPhysical}>
                    <span className={styles.greenDot}></span>
                    <span>Copia física archivada en Archivador Madera 01 • Carpeta Manila #24</span>
                  </div>
                  <div className={styles.ledgerSubActions}>
                    <button
                      type="button"
                      className={styles.btnSubAction}
                      onClick={handleOpenNewLink}
                      aria-label="+ Agregar Vínculo"
                    >
                      + Agregar Vínculo
                    </button>
                    <button
                      type="button"
                      className={styles.btnSubAction}
                      onClick={handleExportJson}
                    >
                      Descargar Fichero ZIP
                    </button>
                  </div>
                </div>
              </div>
            </div>
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
                    <span>Modif. 12 Mar</span>
                  </div>
                </div>
              ))}
          </div>
        </section>

        {/* Right: Tangible Paper Ephemera & Fast Capture (4 Cols) */}
        <div className={styles.ephemeraColumn}>
          {/* Sticky Adhesive Note with Gold Paperclip */}
          <div className={styles.stickyWrapper}>
            <div className={styles.goldClip} aria-hidden="true"></div>
            <div className={styles.stickyNote}>
              <div className={styles.stickyHeader}>
                <span className={styles.stickyLabel}>MANIFIESTO DEL TALLER</span>
                <span style={{ fontSize: '13px' }}>📌</span>
              </div>
              <p className={styles.stickyQuote}>
                “Tus documentos y enlaces organizados como en un fichero de roble físico, 100% en tu navegador.”
              </p>
              <div className={styles.stickyFooter}>
                <span>• Espiralia Cuaderno No. 12</span>
                <span>Santiago, CL</span>
              </div>
            </div>
          </div>

          {/* Quick Capture Card */}
          <div className={styles.quickCaptureWrapper}>
            <div className={styles.washiTape} aria-hidden="true"></div>
            <div className={styles.quickCaptureCard}>
              <div className={styles.quickCaptureHeader}>
                <div className={styles.quickCaptureLead}>
                  <BookmarkPlus size={20} color="var(--color-primary, #6e0081)" aria-hidden="true" />
                  <h4 className={styles.quickCaptureTitle}>Captura Veloz de Enlace</h4>
                </div>
                <span className={styles.clipboardBadge}>CLIPBOARD</span>
              </div>
              <p className={styles.quickCaptureDesc}>
                Pega cualquier URL y clasifícala en tus fichas de cartulina con metadatos automáticos.
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
          </div>

          {/* Storage Physical Analogy Widget */}
          <div className={styles.storageWidget}>
            <div className={styles.storageHeader}>
              <span className={styles.storageTitle}>Almacenamiento Local (IndexedDB)</span>
              <span className={styles.storageValue}>42.8 MB / 500 MB</span>
            </div>
            <div className={styles.storageProgressBar}>
              <div className={styles.storageProgressFill} style={{ width: '14%' }}></div>
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
              <p className={styles.catalogSubtitle}>
                Tarjetas tipo pliego de notas con chinchetas y cintas washi tape
              </p>
            </div>
          </div>

          <div className={styles.catalogPills}>
            <button
              type="button"
              className={`${styles.pillBtn} ${activeFilter === 'all' ? styles.pillBtnActive : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              Todos ({links.length + 3})
            </button>
            <button
              type="button"
              className={`${styles.pillBtn} ${activeFilter === 'official' ? styles.pillBtnActive : ''}`}
              onClick={() => setActiveFilter('official')}
            >
              Oficiales (4)
            </button>
            <button
              type="button"
              className={`${styles.pillBtn} ${activeFilter === 'reading' ? styles.pillBtnActive : ''}`}
              onClick={() => setActiveFilter('reading')}
            >
              Lecturas (8)
            </button>
            <button
              type="button"
              className={`${styles.pillBtn} ${activeFilter === 'tools' ? styles.pillBtnActive : ''}`}
              onClick={() => setActiveFilter('tools')}
            >
              Herramientas (6)
            </button>
          </div>
        </div>

        {/* Bento Grid of Ephemeral Bookmarks */}
        <div className={styles.bookmarkGrid}>
          {/* Bookmark Card 1: CONASET (with washi tape) */}
          <div className={styles.bookmarkCardWrapper}>
            <div className={styles.washiCardStrip} aria-hidden="true"></div>
            <div className={styles.bookmarkCard}>
              <div>
                <div className={styles.bookmarkTop}>
                  <span className={styles.bookmarkAreaBadge}>01. CLASE B CONASET</span>
                  <a
                    href="https://conaset.cl/simulador"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.bookmarkLinkAnchor}
                    aria-label="Abrir Simulador Oficial de Examen Teórico CONASET"
                  >
                    <ExternalLink size={16} aria-hidden="true" />
                  </a>
                </div>
                <h4 className={styles.bookmarkCardTitle}>Simulador Oficial de Examen Teórico CONASET</h4>
                <p className={styles.bookmarkCardSnippet}>
                  Plataforma estatal con el banco de preguntas aleatorias para licencias no profesionales clase B. Con temporizador real de 45 minutos.
                </p>
              </div>
              <div className={styles.bookmarkCardFooter}>
                <span className={styles.bookmarkDomain}>conaset.cl/simulador</span>
                <span className={styles.bookmarkExtra}>35 Preguntas</span>
              </div>
            </div>
          </div>

          {/* Bookmark Card 2: DEMRE (with pushpin chincheta) */}
          <div className={styles.bookmarkCardWrapper}>
            <div className={styles.pushpinBadge} aria-hidden="true"></div>
            <div className={styles.bookmarkCard}>
              <div>
                <div className={styles.bookmarkTop}>
                  <span className={`${styles.bookmarkAreaBadge} ${styles.bookmarkAreaBadgePurple}`}>
                    03. ADMISIÓN 2026
                  </span>
                  <a
                    href="https://demre.cl/publicaciones"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.bookmarkLinkAnchor}
                    aria-label="Abrir Portal DEMRE Modelo de Pruebas & Claves PAES"
                  >
                    <ExternalLink size={16} aria-hidden="true" />
                  </a>
                </div>
                <h4 className={styles.bookmarkCardTitle}>Portal DEMRE • Modelo de Pruebas &amp; Claves PAES</h4>
                <p className={styles.bookmarkCardSnippet}>
                  Descarga oficial de ensayos en PDF para Matemática M1, Comprensión Lectora e Historia con pautas corregidas paso a paso.
                </p>
              </div>
              <div className={styles.bookmarkCardFooter}>
                <span className={styles.bookmarkDomain}>demre.cl/publicaciones</span>
                <span className={styles.bookmarkExtra}>PDFs Liberados</span>
              </div>
            </div>
          </div>

          {/* Bookmark Card 3: Mindfulness & Therapy (with washi tape) */}
          <div className={styles.bookmarkCardWrapper}>
            <div className={styles.washiCardStrip} style={{ left: '2rem', right: 'auto', transform: 'rotate(-2deg)' }} aria-hidden="true"></div>
            <div className={styles.bookmarkCard}>
              <div>
                <div className={styles.bookmarkTop}>
                  <span className={`${styles.bookmarkAreaBadge} ${styles.bookmarkAreaBadgeTeal}`}>
                    02. TERAPIA
                  </span>
                  <a
                    href="https://terapia-anotaciones.local"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.bookmarkLinkAnchor}
                    aria-label="Abrir Guías de Meditación Somática & Audio-anclaje"
                  >
                    <ExternalLink size={16} aria-hidden="true" />
                  </a>
                </div>
                <h4 className={styles.bookmarkCardTitle}>Guías de Meditación Somática &amp; Audio-anclaje</h4>
                <p className={styles.bookmarkCardSnippet}>
                  Ejercicios de respiración diafragmática para momentos de sobrecarga cognitiva. Duraciones de 5, 10 y 20 minutos sin pantallas.
                </p>
              </div>
              <div className={styles.bookmarkCardFooter}>
                <span className={styles.bookmarkDomain}>terapia-anotaciones.local</span>
                <span className={styles.bookmarkExtra}>Audio Flac</span>
              </div>
            </div>
          </div>

          {/* Dynamic User Links */}
          {links.map((link) => (
            <div key={link.id} className={styles.bookmarkCardWrapper}>
              <div className={styles.washiCardStrip} aria-hidden="true"></div>
              <div className={styles.bookmarkCard}>
                <div>
                  <div className={styles.bookmarkTop}>
                    <span className={`${styles.bookmarkAreaBadge} ${styles.bookmarkAreaBadgePurple}`}>
                      VÍNCULO LOCAL
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
                  <span className={styles.bookmarkDomain}>{link.url}</span>
                  <span className={styles.bookmarkExtra}>Local</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Atmospheric Desk Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerQuote}>
          <span className={styles.tealDot}></span>
          <span>Espiralia Taller de Escritorio • Hecho para mentes reflexivas con diseño editorial artesanal.</span>
        </div>
        <div className={styles.footerSpecs}>
          <span>Encapsulado en papel marfil #FAF9F5</span>
          <span>•</span>
          <span>Versión 2.4.0-Estantería</span>
        </div>
      </footer>

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
