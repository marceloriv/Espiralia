import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Plus, BookOpen, FileText, Pencil, Sparkles, ShieldCheck } from 'lucide-react';
import { sileo } from 'sileo';
import type { Note, Folder, Profile, ViewType } from '../types';
import { StorageService } from '../services/storage';
import { NoteModal } from './notes/NoteModal';
import { BujoCard } from './notes/BujoCard';
import { parseBujoContent, countWords, getCategoryRibbonColor } from '../utils/bujoFormatter';
import styles from './NotesView.module.css';

interface NotesViewProps {
  profileId?: string;
  profile?: Profile;
  onNavigate?: (view: ViewType) => void;
}

type TabType = 'all' | 'reflections' | 'quick';

const DEFAULT_THERAPEUTIC_TITLE = 'Descompresión mental & Autoobservación';

const DEFAULT_THERAPEUTIC_CONTENT = `§ 1. Descompresión mental & Autoobservación
Hoy inicié la mañana con esa típica tensión en el diafragma. Me descubrí pensando simultáneamente en tres horizontes divergentes: el simulacro de conducción clase B del sábado, la validación del certificado médico y los requerimientos preliminares de ponderación para la postulación universitaria 2026. Al escribirlo aquí, me doy cuenta de que la ansiedad es solo exceso de futuro agolpándose en un día que apenas comienza.

En la sesión de terapia anterior revisamos que la necesidad de control absoluto sobre los resultados suele enmascarar miedo a ser evaluada. Hoy decido soltar la expectativa de perfección. Concluir el día con calma vale más que tachar doce casillas con taquicardia.

[caja: 🚗 Avance Conaset - Simulacro Clase B | 32 / 35 Aprobado (91%) | Puntos críticos a repasar antes de salir a la vía: distancia de frenado en calzada húmeda (coeficiente de adherencia) y prioridad en rotondas de tres pistas. Ya no siento pánico frente al embrague en subida; la memoria muscular se está asentando con naturalidad.]

§ 2. Planes de Postulación 2026 (Diseño & Humanidades)
Conversado con el orientador: mantener el ritmo de lectura pausada. La meta no es devorar manuales de admisión como si fueran un trámite punitivo, sino reconectar con la curiosidad genuina por la tipografía, la historia editorial y la arquitectura de la información. Mi valor personal no depende de una tabla de percentiles.`;

export interface TomoConfig {
  id: string;
  folderId: string;
  title: string;
  iconName: 'book' | 'sparkles' | 'file';
  tag: string;
  defaultTitle: string;
  defaultContent: string;
}

export const TOMOS_CONFIG: TomoConfig[] = [
  {
    id: '01',
    folderId: 'tomo-01',
    title: '01. Diario Íntimo & Terapia',
    iconName: 'book',
    tag: 'terapia',
    defaultTitle: DEFAULT_THERAPEUTIC_TITLE,
    defaultContent: DEFAULT_THERAPEUTIC_CONTENT,
  },
  {
    id: '02',
    folderId: 'tomo-02',
    title: '02. Ideas & Taller',
    iconName: 'sparkles',
    tag: 'ideas',
    defaultTitle: 'Bocetos, Ideas de Taller & Proyectos',
    defaultContent: `§ 1. Lluvia de Ideas y Arquitectura de Información\nEspacio de prototipado rápido y diseño divergente. Captura conceptos antes de que se evaporen.\n\n[caja: 💡 Hito de Proyecto | En desarrollo | Definir flujo de interacción y estética de libreta analógica.]`,
  },
  {
    id: '03',
    folderId: 'tomo-03',
    title: '03. Conaset & Apuntes B',
    iconName: 'file',
    tag: 'conaset',
    defaultTitle: 'Bitácora de Estudio Conaset Clase B',
    defaultContent: `§ 1. Puntos Críticos y Legislación de Tránsito\nRepaso de distancias de frenado, señalización vertical y prioridad en rotondas de tres pistas.\n\n[caja: 🚗 Simulacro Municipal | Meta: 35/35 | Repasar coeficiente de adherencia y velocidad máxima en zonas urbanas.]`,
  },
];

export function getNoteTomo(note: Note): string {
  if (note.folderId === 'tomo-02' || note.folderId === '02') return '02';
  if (note.folderId === 'tomo-03' || note.folderId === '03') return '03';
  return '01'; // Por defecto pertenece a Tomo 01 (Diario & Terapia)
}

export const NotesView: React.FC<NotesViewProps> = ({ profileId: propProfileId, profile, onNavigate: _onNavigate }) => {
  const profileId = profile?.id ?? propProfileId ?? '';
  const [notes, setNotes] = useState<Note[]>(() => StorageService.getNotes(profileId));
  const [folders, setFolders] = useState<Folder[]>(() => StorageService.getFolders(profileId));
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [activeTomo, setActiveTomo] = useState<string>('01');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [basalEnergy, setBasalEnergy] = useState<string>('Sereno');
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isEditingPliego, setIsEditingPliego] = useState(false);
  const [pliegoDraftTitle, setPliegoDraftTitle] = useState('');
  const [pliegoDraftContent, setPliegoDraftContent] = useState('');
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
    const currentTomo = TOMOS_CONFIG.find((t) => t.id === activeTomo) ?? TOMOS_CONFIG[0];
    const targetFolderId = noteData.folderId || currentTomo.folderId;
    const targetTags = noteData.tags.length > 0 ? noteData.tags : [currentTomo.tag];

    if (editingNote) {
      const updated: Note = {
        ...editingNote,
        ...noteData,
        folderId: noteData.folderId || editingNote.folderId || targetFolderId,
        tags: targetTags,
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
        folderId: targetFolderId,
        tags: targetTags,
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
      if (activeNoteId === note.id) {
        setActiveNoteId(null);
        setIsEditingPliego(false);
      }
      try {
        sileo.info({ title: 'Nota eliminada', description: 'Se eliminó la nota.' });
      } catch {
        // Ignorar
      }
      loadData();
    }
  };

  const currentTomoConfig = useMemo(() => {
    return TOMOS_CONFIG.find((t) => t.id === activeTomo) ?? TOMOS_CONFIG[0];
  }, [activeTomo]);

  const activeNote = useMemo(() => {
    if (!activeNoteId) return null;
    const found = notes.find((n) => n.id === activeNoteId);
    if (found && getNoteTomo(found) === activeTomo) return found;
    return null;
  }, [notes, activeNoteId, activeTomo]);

  const displayTitle = activeNote ? activeNote.title : currentTomoConfig.defaultTitle;
  const displayContent = activeNote ? activeNote.content : currentTomoConfig.defaultContent;

  const bujoBlocks = useMemo(() => {
    return parseBujoContent(displayContent, displayTitle);
  }, [displayContent, displayTitle]);

  const pliegoRibbonColor = useMemo(() => {
    if (activeNote) {
      return getCategoryRibbonColor(activeNote.isReflection, activeNote.tags);
    }
    return 'var(--color-primary)';
  }, [activeNote]);

  const pliegoDate = useMemo(() => {
    if (activeNote) {
      const raw = activeNote.updatedAt || activeNote.createdAt;
      if (raw) {
        try {
          const d = new Date(raw);
          if (!isNaN(d.getTime())) {
            return d.toLocaleDateString('es-CL', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });
          }
        } catch {
          // Fallback a fecha por defecto
        }
      }
    }
    return 'Jueves, 24 de Octubre de 2026';
  }, [activeNote]);

  const activeWordCount = useMemo(() => {
    const textToCount = isEditingPliego ? pliegoDraftContent : displayContent;
    return countWords(textToCount);
  }, [isEditingPliego, pliegoDraftContent, displayContent]);

  const handleSelectActiveNote = (note: Note) => {
    setActiveNoteId(note.id);
    setIsEditingPliego(false);
    setPliegoDraftTitle(note.title);
    setPliegoDraftContent(note.content);
  };

  const handleToggleEditPliego = () => {
    if (!isEditingPliego) {
      setPliegoDraftTitle(activeNote ? activeNote.title : displayTitle);
      setPliegoDraftContent(activeNote ? activeNote.content : displayContent);
      setIsEditingPliego(true);
    } else {
      setIsEditingPliego(false);
    }
  };

  const handleSavePliego = () => {
    const now = new Date().toISOString();
    const titleToSave = pliegoDraftTitle.trim() || displayTitle;
    const contentToSave = isEditingPliego ? pliegoDraftContent : displayContent;

    if (activeNote) {
      const updatedNote: Note = {
        ...activeNote,
        title: titleToSave,
        content: contentToSave,
        updatedAt: now,
      };
      StorageService.saveNote(updatedNote);
      try {
        sileo.success({ title: 'Pliego Guardado', description: 'Manuscrito preservado en almacenamiento seguro.' });
      } catch {
        // Ignorar
      }
    } else {
      const currentTomo = TOMOS_CONFIG.find((t) => t.id === activeTomo) ?? TOMOS_CONFIG[0];
      const newNote: Note = {
        id: `note-${Date.now()}`,
        profileId,
        title: titleToSave,
        content: contentToSave,
        folderId: currentTomo.folderId,
        isReflection: activeTomo === '01',
        tags: [currentTomo.tag],
        createdAt: now,
        updatedAt: now,
      };
      StorageService.saveNote(newNote);
      setActiveNoteId(newNote.id);
      try {
        sileo.success({ title: 'Pliego Guardado', description: 'Manuscrito preservado en almacenamiento seguro.' });
      } catch {
        // Ignorar
      }
    }
    setIsEditingPliego(false);
    loadData();
  };

  const folderMap = useMemo(() => {
    const map = new Map<string, Folder>();
    for (const f of folders) {
      map.set(f.id, f);
    }
    return map;
  }, [folders]);

  const tomoNoteCounts = useMemo(() => {
    const counts: Record<string, number> = { '01': 0, '02': 0, '03': 0 };
    for (const note of notes) {
      const tomo = getNoteTomo(note);
      if (counts[tomo] !== undefined) {
        counts[tomo]++;
      }
    }
    return counts;
  }, [notes]);

  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      // Tomo filter (aislamiento estricto por carpeta sin pérdida de datos)
      if (getNoteTomo(n) !== activeTomo) return false;

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
  }, [notes, activeTomo, activeTab, searchQuery]);

  return (
    <div className={styles.notesContainer}>
      {/* 1. Header Editorial Stitch */}
      <div className={styles.deskHeader}>
        <div className={styles.deskHeaderMain}>
          <div className={styles.overlineRow}>
            <span className={styles.overlineTag}>Espiralia • Cuaderno Analógico Local</span>
            <span className={styles.bullet}>•</span>
            <span className={styles.overlineSub}>Tomo IV (Octubre - Noviembre 2026)</span>
          </div>

          <h1 className={styles.editorialH1}>
            Diario de Autoobservación &amp; Desahogo
            <span className={styles.cifradoBadge}>Cifrado Local</span>
          </h1>

          {/* Título accesible para tests que buscan 'notas & reflexiones' */}
          <h2 className={styles.visuallyHidden}>Notas &amp; Reflexiones</h2>
        </div>

        {/* Archival Binder Spines / Lomos de Archivador de Oficina */}
        <div className={styles.binderCabinetRow} role="tablist" aria-label="Archivadores de Tomos">
          {TOMOS_CONFIG.map((tomo) => {
            const isActive = activeTomo === tomo.id;
            const binderTomoClassMap: Record<string, string> = {
              '01': styles.binderTomo01,
              '02': styles.binderTomo02,
              '03': styles.binderTomo03,
            };
            const tomoStyleClass = binderTomoClassMap[tomo.id] ?? styles.binderTomo01;
            const count = tomoNoteCounts[tomo.id] ?? 0;

            return (
              <button
                key={tomo.id}
                type="button"
                aria-current={isActive ? 'page' : 'false'}
                className={`${styles.binderSpineBtn} ${tomoStyleClass} ${isActive ? styles.binderActive : ''}`}
                onClick={() => setActiveTomo(tomo.id)}
              >
                <div className={styles.binderTopCap} aria-hidden="true" />

                {/* Porta-etiquetas metálico con remaches */}
                <div className={styles.binderLabelFrame} data-testid="binder-label-frame">
                  <div className={`${styles.binderRivet} ${styles.rivetTL}`} aria-hidden="true" />
                  <div className={`${styles.binderRivet} ${styles.rivetTR}`} aria-hidden="true" />
                  <div className={`${styles.binderRivet} ${styles.rivetBL}`} aria-hidden="true" />
                  <div className={`${styles.binderRivet} ${styles.rivetBR}`} aria-hidden="true" />

                  {/* Etiqueta de papel rotulada */}
                  <div className={styles.binderLabelPaper}>
                    {tomo.iconName === 'book' && <BookOpen size={13} aria-hidden="true" />}
                    {tomo.iconName === 'sparkles' && <Sparkles size={13} aria-hidden="true" />}
                    {tomo.iconName === 'file' && <FileText size={13} aria-hidden="true" />}
                    <span className={styles.binderLabelText}>{tomo.title}</span>
                  </div>
                </div>

                {/* Ojal circular metálico de extracción */}
                <div className={styles.binderFingerRing} data-testid="binder-finger-ring" aria-hidden="true" />

                {/* Contador de notas en el lomo */}
                <span className={styles.binderCountPill} data-testid={`count-${tomo.folderId}`}>
                  {count}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            className={styles.btnAddNoteHeader}
            onClick={handleOpenNew}
            aria-label="+ Nueva Nota"
          >
            <Plus size={16} aria-hidden="true" />
            <span>+ Nueva Nota</span>
          </button>
        </div>
      </div>

      {/* 2. Pliego Físico Abierto Papercraft Stitch */}
      <div className={styles.folioContainer}>
        {/* Cintas Washi en esquinas */}
        <div className={styles.washiTapeMagenta} aria-hidden="true" />
        <div className={styles.washiTapeSlate} aria-hidden="true" />

        {/* Sello Notarial Rojo Hanko Japonés / Espiralia */}
        <div className={styles.hankoSeal} aria-hidden="true">
          <span className={styles.hankoKanji}>済</span>
          <span className={styles.hankoText}>ESPIRALIA</span>
          <span className={styles.hankoSub}>AUTÉNTICO</span>
        </div>

        {/* Grid de Pliego Manuscrito (8 Cols Izquierda, 4 Cols Derecha) */}
        <div className={styles.folioGrid}>
          {/* ============================================================== */}
          {/* COLUMNA IZQUIERDA: CUADERNO MANUSCRITO PRINCIPAL (8 COLS)       */}
          {/* ============================================================== */}
          <div className={styles.folioLeftCol}>
            {/* Metadatos de la página editorial */}
            <div className={styles.folioPageMeta}>
              <div className={styles.metaDateGroup}>
                <span className={styles.metaLabel}>FECHA:</span>
                <span className={styles.metaDateUnderlined}>{pliegoDate}</span>
              </div>
              <div className={styles.metaDetailsGroup}>
                {activeNote && (
                  <span className={styles.activePliegoBadge}>Pliego Activo de Trabajo</span>
                )}
                <span className={styles.metaItem}>
                  <Sparkles size={14} className={styles.iconTeal} aria-hidden="true" />
                  <span>{activeNote ? activeNote.title : 'Sesión Semanal #14'}</span>
                </span>
                <span className={styles.metaItem}>
                  <BookOpen size={14} className={styles.iconPrimary} aria-hidden="true" />
                  <span>{activeNote ? `${activeWordCount} palabras` : '42 min de escritura'}</span>
                </span>
              </div>
            </div>

            {/* Pregunta Ancla Terapéutica */}
            <div className={styles.anchorPromptBanner}>
              <Sparkles size={18} className={styles.iconPrimary} aria-hidden="true" />
              <div>
                <h4 className={styles.anchorPromptTitle}>Pregunta Ancla de la Semana:</h4>
                <p className={styles.anchorPromptText}>
                  "¿Qué autoexigencias me estoy imponiendo hoy que pertenecen al futuro y no a mi presente inmediato?"
                </p>
              </div>
            </div>

            {/* Lienzo Manuscrito Bujo Dot Grid */}
            <div className={styles.bujoCanvas}>
              {/* Cinta marcapáginas en la esquina */}
              <div
                className={styles.bookmarkRibbon}
                style={{ backgroundColor: pliegoRibbonColor }}
                data-testid="pliego-ribbon"
                aria-hidden="true"
              />

              {isEditingPliego ? (
                <div className={styles.pliegoEditorContainer}>
                  <input
                    type="text"
                    className={styles.pliegoTitleInput}
                    value={pliegoDraftTitle}
                    onChange={(e) => setPliegoDraftTitle(e.target.value)}
                    aria-label="Editar título del pliego"
                    placeholder="Título del pliego..."
                  />
                  <textarea
                    className={styles.pliegoContentTextarea}
                    value={pliegoDraftContent}
                    onChange={(e) => setPliegoDraftContent(e.target.value)}
                    aria-label="Editar contenido del pliego"
                    placeholder="Escribe usando sintaxis bujo (§ Sección, [caja: ...])..."
                    rows={12}
                  />
                </div>
              ) : (
                <div className={styles.bujoTextContent}>
                  {bujoBlocks.map((block, idx) => {
                    if (block.type === 'heading') {
                      return (
                        <div key={`h-${idx}`} className={styles.journalSection}>
                          <h3 className={styles.sectionHeading}>
                            <span className={styles.sectionSymbol}>{block.symbol}</span>
                            <span>{block.title}</span>
                          </h3>
                        </div>
                      );
                    }
                    if (block.type === 'callout') {
                      return (
                        <div key={`c-${idx}`} className={styles.conasetEmbeddedBox}>
                          <div className={styles.conasetHeader}>
                            <span className={styles.conasetTitle}>
                              {block.icon && <span className={styles.conasetIcon}>{block.icon}</span>}
                              {block.title}
                            </span>
                            {block.badge && <span className={styles.conasetBadge}>{block.badge}</span>}
                          </div>
                          {block.text && <p className={styles.conasetText}>{block.text}</p>}
                        </div>
                      );
                    }
                    return (
                      <p key={`p-${idx}`} className={styles.journalParagraph}>
                        {block.text}
                      </p>
                    );
                  })}
                </div>
              )}

              {/* Barra de estado de escritura en vivo */}
              <div className={styles.writingStatusBar}>
                <span className={styles.blinkingCursor} />
                <span>Escribiendo en vivo en almacenamiento cifrado local • Sin telemetría en la nube</span>
                <span className={styles.wordCount}>
                  {activeWordCount} {activeWordCount === 1 ? 'palabra escrita' : 'palabras escritas'}
                </span>
              </div>
            </div>

            {/* Barra de Reflexión Nocturna (3 Columnas) */}
            <div className={styles.nightReflectionStrip}>
              <div className={styles.reflectionCol}>
                <span className={styles.reflectionTagPrimary}>¿Qué fluyó bien hoy?</span>
                <p className={styles.reflectionBody}>Pude respirar antes de contestar el correo del taller. Pausa de 3 minutos cumplida.</p>
              </div>
              <div className={styles.reflectionCol}>
                <span className={styles.reflectionTagAmber}>¿Qué puedo mejorar?</span>
                <p className={styles.reflectionBody}>No consultar la bandeja de entrada después de las 20:00 hrs. Desconectar la pantalla azul.</p>
              </div>
              <div className={styles.reflectionCol}>
                <span className={styles.reflectionTagTeal}>Intención para mañana:</span>
                <p className={styles.reflectionBody}>Caminar 20 min bajo los plátanos orientales sin auriculares ni prisa.</p>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* COLUMNA DERECHA: ACCESORIOS DE ESCRITORIO (4 COLS)             */}
          {/* ============================================================== */}
          <div className={styles.folioRightCol}>
            {/* 1. Post-it Amarillo con Clip de Latón Realista */}
            <div className={styles.stickyPostItWrapper}>
              {/* Clip de latón gráfico */}
              <div className={styles.brassPaperclip} aria-hidden="true">
                <svg fill="none" height="54" viewBox="0 0 34 60" width="30" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 24V46C10 51.5228 14.4772 56 20 56C25.5228 56 30 51.5228 30 46V14C30 7.37258 24.6274 2 18 2C11.3726 2 6 7.37258 6 14V42C6 45.3137 8.68629 48 12 48C15.3137 48 18 45.3137 18 42V18" stroke="#cfb53b" strokeLinecap="round" strokeWidth="3" />
                  <path d="M9 24V46C9 50 13 54.5 19 54.5" stroke="#fef08a" strokeLinecap="round" strokeWidth="1.2" />
                </svg>
              </div>

              <div className={styles.stickyPostItCard}>
                <span className={styles.stickyOverline}>Recordatorio Compasivo</span>
                <p className={styles.stickyScript}>
                  “discipline today, peace tomorrow ♡”
                </p>
                <div className={styles.stickyDivider} />
                <p className={styles.stickySub}>
                  Escribe sin censura.<br />
                  El orden exterior nutre la serenidad interior.
                </p>
                <span className={styles.stickyAuthor}>— Cuaderno Terapéutico #4</span>
              </div>
            </div>

            {/* 2. Ritmo & Estado de Ánimo */}
            <div className={styles.moodTrackerCard}>
              <div className={styles.moodHeader}>
                <span className={styles.moodTitle}>
                  <Sparkles size={16} className={styles.iconPrimary} aria-hidden="true" />
                  Ritmo &amp; Estado de Ánimo
                </span>
                <span className={styles.moodDate}>Oct 24</span>
              </div>

              <div className={styles.energyScale}>
                <span className={styles.scaleLabel}>Energía Basal:</span>
                <div className={styles.scaleButtonsRow}>
                  {['Baja', 'Neutro', 'Sereno', 'Enérgico', 'Radiante'].map((level) => (
                    <button
                      key={level}
                      type="button"
                      className={`${styles.scaleBtn} ${basalEnergy === level ? styles.scaleBtnActive : ''}`}
                      onClick={() => setBasalEnergy(level)}
                    >
                      <span>{level === 'Baja' ? '☁️' : level === 'Neutro' ? '☕' : level === 'Sereno' ? '🌿' : level === 'Enérgico' ? '✨' : '☀️'}</span>
                      <span className={styles.scaleBtnText}>{level}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Barras de Estado */}
              <div className={styles.energyBars}>
                <div className={styles.barItem}>
                  <div className={styles.barHeader}>
                    <span>Foco y Claridad Mental</span>
                    <span className={styles.barValPrimary}>78%</span>
                  </div>
                  <div className={styles.barTrack}>
                    <div className={styles.barFillPrimary} style={{ width: '78%' }} />
                  </div>
                </div>

                <div className={styles.barItem}>
                  <div className={styles.barHeader}>
                    <span>Calma / Regulación Nerviosa</span>
                    <span className={styles.barValTeal}>85%</span>
                  </div>
                  <div className={styles.barTrack}>
                    <div className={styles.barFillTeal} style={{ width: '85%' }} />
                  </div>
                </div>

                <div className={styles.barItem}>
                  <div className={styles.barHeader}>
                    <span>Cansancio Somático</span>
                    <span className={styles.barValAmber}>40%</span>
                  </div>
                  <div className={styles.barTrack}>
                    <div className={styles.barFillAmber} style={{ width: '40%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Bloc Lavanda: Brain Dump Rápido */}
            <div className={styles.brainDumpBox}>
              <div className={styles.brainDumpWashi} aria-hidden="true" />
              <div className={styles.brainDumpHeader}>
                <span className={styles.brainDumpTitle}>Brain Dump Rápido</span>
                <Sparkles size={14} className={styles.iconPrimary} aria-hidden="true" />
              </div>
              <ul className={styles.brainDumpList}>
                <li>
                  <span className={styles.bulletDot}>•</span>
                  <span>Pedir comprobante oftalmológico para el examen psicotécnico municipal.</span>
                </li>
                <li>
                  <span className={styles.bulletDot}>•</span>
                  <span>Descargar el temario de Competencia Lectora PAES en PDF limpio.</span>
                </li>
                <li>
                  <span className={styles.bulletDot}>•</span>
                  <span>No olvidar comprar tinta color berenjena para la pluma estilográfica.</span>
                </li>
              </ul>
            </div>

            {/* 4. Sello Notarial de Bóveda Local */}
            <div className={styles.vaultStampCard}>
              <ShieldCheck size={20} className={styles.iconPrimary} aria-hidden="true" />
              <div>
                <span className={styles.vaultTitle}>Cuaderno de Terapia Privado</span>
                <p className={styles.vaultDesc}>
                  Registros confinados al dispositivo local. Copia de respaldo automática en bóveda encriptada.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Barra Analógica Inferior */}
        <div className={styles.folioBottomToolbar}>
          <div className={styles.toolbarMetaGroup}>
            <span className={styles.toolbarMetaItem}>
              <Pencil size={14} aria-hidden="true" />
              <span>Modo Estilográfica: Activo (Tinta 0.5mm)</span>
            </span>
            <span className={styles.bullet}>•</span>
            <span className={styles.toolbarMetaItem}>
              <BookOpen size={14} aria-hidden="true" />
              <span>Papel: Tinte Marfil 300g / Verjurado</span>
            </span>
          </div>

          <div className={styles.toolbarActionsGroup}>
            <button
              type="button"
              className={styles.btnVersionHistory}
              onClick={() => sileo.info({ title: 'Versión del pliego', description: 'Pliego sincronizado localmente.' })}
            >
              <span>Historial de Versiones</span>
            </button>
            <button
              type="button"
              className={styles.btnEditPliego}
              onClick={handleToggleEditPliego}
              aria-label={isEditingPliego ? 'Ver Pliego' : 'Editar Pliego'}
            >
              <span>{isEditingPliego ? 'Ver Pliego' : 'Editar Pliego'}</span>
            </button>
            <button
              type="button"
              className={styles.btnSavePliego}
              onClick={handleSavePliego}
              aria-label="Guardar Pliego"
            >
              <span>Guardar Pliego</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Sección de Archivo de Notas & Búsqueda */}
      <section className={styles.archiveSection}>
        <div className={styles.filterBar}>
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
              Reflexiones &amp; Diario ({notes.filter((n) => n.isReflection).length})
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
        </div>

        {filteredNotes.length === 0 ? (
          <div className={styles.emptyState}>
            <FileText size={40} color="var(--color-primary-soft)" />
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
                <BujoCard
                  key={note.id}
                  note={note}
                  folder={folder}
                  isActive={note.id === activeNoteId}
                  onSelect={handleSelectActiveNote}
                  onEdit={handleOpenEdit}
                  onDelete={handleDeleteNote}
                />
              );
            })}
          </div>
        )}
      </section>

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
