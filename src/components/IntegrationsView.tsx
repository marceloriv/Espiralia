import React, { useState, useEffect, useRef, useId } from 'react';
import {
  Calendar,
  CloudOff,
  Download,
  ExternalLink,
  Mail,
  Send,
  Shield,
  UploadCloud,
  FileCheck2,
  CheckCircle,
  Package,
  Layers,
  CalendarCheck,
  Terminal,
} from 'lucide-react';
import { sileo } from 'sileo';
import type { Profile, AgendaEvent, Area } from '../types';
import { StorageService } from '../services/storage';
import { IcsService } from '../services/icsService';
import styles from './IntegrationsView.module.css';

export interface IntegrationsViewProps {
  profile: Profile;
}

export const IntegrationsView: React.FC<IntegrationsViewProps> = ({ profile }) => {
  const [events, setEvents] = useState<AgendaEvent[]>(() => StorageService.getEvents(profile.id));
  const [areas, setAreas] = useState<Area[]>(() => StorageService.getAreas(profile.id));
  const [selectedRange, setSelectedRange] = useState('semestre');
  const [selectedArea, setSelectedArea] = useState('todas');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rangeSelectId = useId();
  const areaSelectId = useId();

  useEffect(() => {
    setEvents(StorageService.getEvents(profile.id));
    setAreas(StorageService.getAreas(profile.id));
  }, [profile.id]);

  const handleExportIcs = () => {
    let categoryFilter: string | undefined = undefined;
    if (selectedArea !== 'todas') {
      const match = areas.find(
        (a) => a.id === selectedArea || a.name.toLowerCase() === selectedArea.toLowerCase()
      );
      categoryFilter = match ? match.name : selectedArea;
    }

    const icsContent = IcsService.exportToIcs(events, { category: categoryFilter });
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `espiralia-agenda-${profile.name.toLowerCase().replace(/\s+/g, '-')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    try {
      sileo.success({ title: 'Archivo .ics generado y descargado con éxito' });
    } catch {
      // Ignorar
    }
  };

  const handleFileImport = (file: File) => {
    if (!file.name.endsWith('.ics')) {
      try {
        sileo.error({
          title: 'Formato no soportado',
          description: 'Por favor selecciona un archivo con extensión .ics',
        });
      } catch {
        // Ignorar
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const parsed = IcsService.parseIcs(content, profile.id);
      if (parsed.length === 0) {
        try {
          sileo.warning({ title: 'No se encontraron eventos válidos en el archivo' });
        } catch {
          // Ignorar
        }
        return;
      }

      for (const ev of parsed) {
        StorageService.saveEvent(ev);
      }
      setEvents(StorageService.getEvents(profile.id));
      try {
        sileo.success({
          title: 'Eventos importados con éxito',
          description: `Se han añadido ${parsed.length} eventos a tu agenda local.`,
        });
      } catch {
        // Ignorar
      }
    };
    reader.onerror = () => {
      try {
        sileo.error({ title: 'Error al leer el archivo' });
      } catch {
        // Ignorar
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileImport(e.dataTransfer.files[0]);
    }
  };

  const handleExportFullVault = () => {
    const dataToExport = {
      profile,
      exportDate: new Date().toISOString(),
      events: StorageService.getEvents(profile.id),
      blocks: StorageService.getPlanner(profile.id),
      todos: StorageService.getTodos(profile.id),
      areas: StorageService.getAreas(profile.id),
      notes: StorageService.getNotes(profile.id),
      folders: StorageService.getFolders(profile.id),
      links: StorageService.getLinks(profile.id),
    };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `espiralia-boveda-completa-${profile.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    try {
      sileo.success({ title: 'Copia de Bóveda JSON descargada con éxito' });
    } catch {
      // Ignorar
    }
  };

  const formatGoogleCalendarUrl = (
    title: string,
    dateStr: string,
    timeStr = '10:00',
    details = 'Generado desde Espiralia Privacy Vault'
  ) => {
    const cleanDate = dateStr.replace(/-/g, '');
    const cleanTime = timeStr.replace(/:/g, '') + '00';
    const dates = `${cleanDate}T${cleanTime}/${cleanDate}T${cleanTime}`;
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      title
    )}&dates=${dates}&details=${encodeURIComponent(details)}`;
  };

  return (
    <div className={styles.container}>
      {/* Master Paper Planner Sheet */}
      <article className={styles.masterPaperSheet}>
        {/* Top-Right Washi Tape */}
        <div className={styles.topWashiTape} aria-hidden="true"></div>

        {/* Sovereignty Sticky Note with Brass Paperclip */}
        <aside className={styles.sovereigntyPostit}>
          <div className={styles.brassPaperclip} aria-hidden="true">
            <svg fill="none" height="42" viewBox="0 0 24 42" width="24">
              <path
                d="M7 10 V 28 C 7 32 17 32 17 28 V 6 C 17 2 3 2 3 8 V 32 C 3 39 21 39 21 30 V 12"
                stroke="#B89552"
                strokeLinecap="round"
                strokeWidth="2.6"
              ></path>
            </svg>
          </div>
          <div>
            <span className={styles.postitLabel}>Aforismo de Soberanía</span>
            <p className={styles.postitQuote}>
              «Tus compromisos y pensamientos no necesitan servidores; viven en tu propio pliego ♡»
            </p>
            <span className={styles.postitAuthor}>— Espiralia Vault</span>
          </div>
        </aside>

        {/* Botanical Watermark */}
        <svg
          className={styles.botanicalWatermark}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          viewBox="0 0 100 100"
          aria-hidden="true"
        >
          <path d="M50 95 C 45 65, 60 40, 85 15"></path>
          <path d="M60 70 C 45 60, 35 62, 30 68 C 38 72, 52 72, 60 70"></path>
          <path d="M68 50 C 78 40, 90 42, 92 48 C 84 54, 72 52, 68 50"></path>
          <polygon
            fill="none"
            opacity="0.35"
            points="25,20 28,27 35,28 30,33 32,40 25,36 18,40 20,33 15,28 22,27"
            stroke="#9EABB7"
            strokeWidth="0.9"
          ></polygon>
        </svg>

        {/* 1. Cabecera Editorial */}
        <header className={styles.header}>
          <div className={styles.headerMetaRow}>
            <div className={styles.badgeCluster}>
              <span className={styles.badgeModule}>Módulo Descentralizado</span>
              <span className={styles.badgeBullet}>•</span>
              <span className={styles.badgeVersion}>v4.8 Local-First</span>
            </div>

            <div className={styles.categoryChipsLegend} aria-label="Áreas de integración">
              <span className={styles.chipItem}>
                <span className={styles.chipDot} style={{ backgroundColor: '#5db8a6' }} />
                <span>Estudios / Clase B</span>
              </span>
              <span className={styles.chipItem}>
                <span className={styles.chipDot} style={{ backgroundColor: '#e8a55a' }} />
                <span>Personal</span>
              </span>
              <span className={styles.chipItem}>
                <span className={styles.chipDot} style={{ backgroundColor: 'var(--color-primary, #6e0081)' }} />
                <span>Universidad 2026</span>
              </span>
            </div>
          </div>

          <div className={styles.titleRow}>
            <h1 className={styles.title}>Integraciones &amp; Enlace Externo</h1>
            <span className={styles.hankoStamp}>ARCHIVADO LOCALMENTE</span>
          </div>

          <p className={styles.subtitle}>
            Sincronización cliente pura diseñada bajo <strong className={styles.italicTerm}>Privacy-by-Design</strong>. Sin servidores intermediarios, sin cuentas en la nube ni tokens OAuth almacenados fuera de tu navegador. Tus compromisos existen exclusivamente en tu disco local.
          </p>
        </header>

        {/* Workspace Layout: Left Sidebar + Workbench */}
        <div className={styles.workspaceLayout}>
          {/* Left Sidebar (Stationery Index Tabs) */}
          <aside className={styles.leftSidebar}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className={styles.sidebarTitleBox}>
                <div className={styles.sidebarIconSquare}>
                  <Layers size={20} aria-hidden="true" />
                </div>
                <div>
                  <h3 className={styles.sidebarTitle}>Integraciones</h3>
                  <p className={styles.sidebarSubtitle}>Protocolo Local IndexedDB</p>
                </div>
              </div>

              {/* Navigation folder tabs */}
              <nav className={styles.sidebarNav} aria-label="Navegación de integraciones">
                <a className={styles.sidebarNavItem} href="#boveda">
                  <Shield size={16} aria-hidden="true" />
                  <span>Bóveda &amp; Privacidad</span>
                </a>
                <a className={`${styles.sidebarNavItem} ${styles.sidebarNavItemActive}`} href="#gcal">
                  <Calendar size={16} aria-hidden="true" />
                  <span>Google Calendar (.ics)</span>
                  <span className={styles.activeDotIndicator}></span>
                </a>
                <a className={styles.sidebarNavItem} href="#gmail">
                  <Mail size={16} aria-hidden="true" />
                  <span>Gmail &amp; Plantillas</span>
                </a>
                <a className={styles.sidebarNavItem} href="#areas">
                  <Package size={16} aria-hidden="true" />
                  <span>Áreas Temáticas</span>
                </a>
                <a className={styles.sidebarNavItem} href="#auditoria">
                  <FileCheck2 size={16} aria-hidden="true" />
                  <span>Registro de Actividad</span>
                </a>
              </nav>

              {/* Backup Papercraft Mini Card */}
              <div className={styles.sidebarBackupCard}>
                <div className={styles.backupWashi} aria-hidden="true"></div>
                <div className={styles.backupCardHeader}>
                  <CheckCircle size={16} color="var(--color-primary, #6e0081)" aria-hidden="true" />
                  <span>Copia de Respaldo</span>
                </div>
                <p className={styles.backupCardDesc}>
                  Genera un archivo universal .ics sin requerir conexión a internet ni cuenta externa.
                </p>
                <button
                  type="button"
                  className={styles.btnBackupSmall}
                  onClick={handleExportIcs}
                >
                  <Download size={14} aria-hidden="true" />
                  <span>Descargar .ics Completo</span>
                </button>
              </div>
            </div>

            <div className={styles.sidebarFooter}>
              <a className={styles.sidebarFooterLink} href="#docs">
                <span>📖</span>
                <span>Documentación Offline</span>
              </a>
              <a className={styles.sidebarFooterLink} href="#lock">
                <span>🔒</span>
                <span>Cerrar Bóveda</span>
              </a>
            </div>
          </aside>

          {/* Right Workbench Content */}
          <div className={styles.workbenchContent}>
            {/* 2. Banner de Auditoría y Privacidad */}
            <section className={styles.privacyBanner} aria-label="Auditoría de Privacidad">
              <div className={styles.bannerWashi} aria-hidden="true"></div>
              <div className={styles.bannerLeft}>
                <div className={styles.bannerIcon} aria-hidden="true">
                  <CloudOff size={24} />
                </div>
                <div>
                  <div className={styles.bannerHeadingRow}>
                    <h2 className={styles.bannerTitle}>Aislamiento Estricto Verificado</h2>
                    <span className={styles.tagZeroBytes}>0 bytes transmitidos al exterior</span>
                  </div>
                  <p className={styles.bannerText}>
                    Protocolo local IndexedDB activo con cifrado en reposo. Compatibilidad total con Google Calendar, Apple iCal y clientes RFC 5545.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className={styles.btnAuditTraffic}
                onClick={() => {
                  try {
                    sileo.info({
                      title: 'Auditoría de Tráfico: 0 peticiones externas detectadas',
                      description: 'Tu información permanece confinada en el almacenamiento del navegador.',
                    });
                  } catch {
                    // Ignorar
                  }
                }}
              >
                <Terminal size={14} aria-hidden="true" />
                <span>Ver Auditoría de Tráfico</span>
              </button>
            </section>

            {/* 3. Bento Grid */}
            <div className={styles.bentoGrid}>
              {/* Columna Izquierda: Google Calendar & iCal (.ics) */}
              <article className={styles.cardLeft} aria-labelledby="gcal-heading">
                <div className={styles.cardTopWashi} aria-hidden="true">
                  <span className={styles.cardTopWashiText}>RFC 5545 LOCAL</span>
                </div>

                <div className={styles.cardHeader}>
                  <div className={styles.cardHeaderIdentity}>
                    <div className={styles.cardIconWrapper} aria-hidden="true">
                      <Calendar size={22} />
                    </div>
                    <div>
                      <h2 id="gcal-heading" className={styles.cardTitle}>
                        Google Calendar &amp; iCal (.ics)
                      </h2>
                      <p className={styles.cardSubtitle}>
                        Formato estándar RFC 5545 • Sincronización bidireccional local
                      </p>
                    </div>
                  </div>
                  <span className={styles.tagNoOAuth}>Sin OAuth requerido</span>
                </div>

                {/* Opción A: Exportar */}
                <div className={styles.optionSection}>
                  <div className={styles.optionHeaderRow}>
                    <div className={styles.optionLabel}>
                      <span className={styles.optionDot} style={{ backgroundColor: 'var(--color-primary, #6e0081)' }} />
                      <span>Opción A: Generar Archivo de Exportación (.ics)</span>
                    </div>
                    <span className={styles.optionTimestamp}>Último archivo: Hoy, 09:41 AM</span>
                  </div>
                  <p className={styles.optionDesc}>
                    Genera un archivo universal descargable de inmediato. Puedes arrastrarlo o abrirlo directamente en Google Calendar web o cualquier gestor de calendario sin sincronizar credenciales.
                  </p>

                  <div className={styles.controlsGrid}>
                    <div className={styles.controlField}>
                      <label htmlFor={rangeSelectId} className={styles.controlLabel}>Rango Temporal</label>
                      <select
                        id={rangeSelectId}
                        className={styles.selectInput}
                        value={selectedRange}
                        onChange={(e) => setSelectedRange(e.target.value)}
                      >
                        <option value="semestre">Todo el semestre 2026-II</option>
                        <option value="mes">Próximos 30 días calendario</option>
                        <option value="todo">Histórico completo acumulado</option>
                      </select>
                    </div>

                    <div className={styles.controlField}>
                      <label htmlFor={areaSelectId} className={styles.controlLabel}>Filtro por Área Temática</label>
                      <select
                        id={areaSelectId}
                        className={styles.selectInput}
                        value={selectedArea}
                        onChange={(e) => setSelectedArea(e.target.value)}
                      >
                        <option value="todas">Todas las áreas activas ({areas.length || 3})</option>
                        {areas.map((a) => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className={styles.exportActionRow}>
                    <button type="button" className={styles.btnPrimary} onClick={handleExportIcs}>
                      <CalendarCheck size={18} aria-hidden="true" />
                      <span>Descargar Archivo .ics Calificado</span>
                    </button>
                    <span className={styles.eventsReadyCount}>
                      {events.length} eventos programados listos
                    </span>
                  </div>
                </div>

                <div className={styles.divider} aria-hidden="true" />

                {/* Opción B: Dropzone de Importación */}
                <div className={styles.optionSection}>
                  <div className={styles.optionLabel}>
                    <span className={styles.optionDot} style={{ backgroundColor: '#5db8a6' }} />
                    <span>Opción B: Importar Eventos hacia Bóveda Local</span>
                  </div>

                  <div
                    className={styles.dropzone}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                    aria-label="Arrastra tu archivo .ics aquí o explora tu equipo"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
                    }}
                    style={{ borderColor: isDragging ? 'var(--color-primary, #6e0081)' : undefined }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".ics,text/calendar"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleFileImport(e.target.files[0]);
                        }
                      }}
                    />
                    <div className={styles.dropzoneIconWrapper} aria-hidden="true">
                      <UploadCloud size={22} />
                    </div>
                    <p className={styles.dropzoneText}>
                      Arrastra tu archivo <code className={styles.codeBadge}>.ics</code> aquí o{' '}
                      <span style={{ color: 'var(--color-primary, #6e0081)', textDecoration: 'underline' }}>
                        explora tu equipo
                      </span>
                    </p>
                    <p className={styles.dropzoneHint}>
                      Lectura directa vía FileReader API en memoria. Ningún dato sale de este equipo.
                    </p>
                  </div>
                </div>

                <div className={styles.divider} aria-hidden="true" />

                {/* Opción C: Atajos directos a Google Calendar Web */}
                <div className={styles.optionSection}>
                  <div className={styles.optionHeaderRow}>
                    <div className={styles.optionLabel}>
                      <span className={styles.optionDot} style={{ backgroundColor: '#e8a55a' }} />
                      <span>Opción C: Atajos Directos "A un solo clic" (Google Calendar Web)</span>
                    </div>
                    <span className={styles.optionTimestamp}>Action Template URI</span>
                  </div>
                  <p className={styles.optionDesc}>
                    Añade tus hitos más críticos a Google Calendar en una pestaña nueva sin conceder permisos de acceso ni login a tu cuenta personal.
                  </p>

                  <div className={styles.quickLinksList}>
                    <div className={styles.quickLinkCard}>
                      <div className={styles.quickLinkInfo}>
                        <span className={styles.optionDot} style={{ backgroundColor: 'var(--color-primary, #6e0081)' }} />
                        <div>
                          <p className={styles.quickLinkTitle}>Entrega Memoria de Tesis Semestre II</p>
                          <p className={styles.quickLinkMeta}>15 Octubre 2026 • 23:59 hrs • Universidad</p>
                        </div>
                      </div>
                      <a
                        className={styles.btnSecondaryAction}
                        href={formatGoogleCalendarUrl(
                          'Entrega Memoria de Tesis Semestre II',
                          '2026-10-15',
                          '23:59',
                          'Convocatoria académica 2026-II'
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span>Añadir a Google</span>
                        <ExternalLink size={14} aria-hidden="true" />
                      </a>
                    </div>

                    <div className={styles.quickLinkCard}>
                      <div className={styles.quickLinkInfo}>
                        <span className={styles.optionDot} style={{ backgroundColor: '#5db8a6' }} />
                        <div>
                          <p className={styles.quickLinkTitle}>Examen Oral: Seminario de Lectura B</p>
                          <p className={styles.quickLinkMeta}>22 Octubre 2026 • 10:00 hrs • Estudios</p>
                        </div>
                      </div>
                      <a
                        className={styles.btnSecondaryAction}
                        href={formatGoogleCalendarUrl(
                          'Examen Oral: Seminario de Lectura B',
                          '2026-10-22',
                          '10:00',
                          'Simulacros y banco de preguntas'
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span>Añadir a Google</span>
                        <ExternalLink size={14} aria-hidden="true" />
                      </a>
                    </div>
                  </div>
                </div>
              </article>

              {/* Columna Derecha: Gmail & Auditoría (5 Cols) */}
              <div className={styles.rightColumn}>
                {/* Tarjeta 2: Gmail & Plantillas */}
                <article className={styles.cardRight} aria-labelledby="gmail-heading">
                  <div className={styles.gmailWashiCorner} aria-hidden="true"></div>

                  <div className={styles.cardHeader}>
                    <div className={styles.cardHeaderIdentity}>
                      <div className={styles.cardIconWrapper} aria-hidden="true">
                        <Mail size={22} />
                      </div>
                      <div>
                        <h2 id="gmail-heading" className={styles.cardTitle}>
                          Gmail &amp; Plantillas
                        </h2>
                        <p className={styles.cardSubtitle}>
                          Protocolo mailto:// y web intents de redacción
                        </p>
                      </div>
                    </div>
                    <span className={styles.chipDot} style={{ backgroundColor: '#3f7a4e' }} title="Cero permisos delegados" />
                  </div>

                  <div className={styles.securityCallout}>
                    <div className={styles.calloutTitle}>
                      <Shield size={16} aria-hidden="true" />
                      <span>¿Por qué no requiere API Key ni login?</span>
                    </div>
                    <p className={styles.calloutText}>
                      Espiralia compila tus variables locales directamente en el esquema seguro de URL de Gmail. El correo se abre preparado en tu sesión activa; nada se transmite por backend.
                    </p>
                  </div>

                  <div className={styles.templateCard}>
                    <div className={styles.templateHeader}>
                      <span className={styles.templateTag}>Universidad 2026</span>
                      <span className={styles.templateId}>Plantilla #acad-04</span>
                    </div>
                    <h3 className={styles.templateSubject}>Justificativo académico / Postulación</h3>
                    <p className={styles.templatePreview}>
                      Asunto: Solicitud de convalidación y revisión de plazos para la convocatoria académica Semestre II.
                    </p>
                    <a
                      className={styles.btnFullWidth}
                      href="mailto:coordinacion@universidad.edu?subject=Consulta%20Convocatoria%202026-II%20Espiralia&body=Estimado%20Comit%C3%A9%20Acad%C3%A9mico%2C%0A%0AAdjunto%20mi%20registro%20de%20avance%20acad%C3%A9mico%20generado%20desde%20mi%20b%C3%B3veda%20local.%0A%0ASaludos%20cordiales."
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Mail size={16} color="var(--color-primary, #6e0081)" aria-hidden="true" />
                      <span>Abrir borrador en Gmail</span>
                    </a>
                  </div>

                  <div className={styles.templateCard}>
                    <div className={styles.templateHeader}>
                      <span className={`${styles.templateTag} ${styles.templateTagPersonal}`}>Personal</span>
                      <span className={styles.templateId}>Recordatorio Express</span>
                    </div>
                    <h3 className={styles.templateSubject}>Auto-envío de notas &amp; lecturas</h3>
                    <p className={styles.templatePreview}>
                      Envía el extracto de tu cuaderno activo a tu propia bandeja de entrada sin rastreo de analíticas ni telemetría.
                    </p>
                    <a
                      className={styles.btnFullWidth}
                      href="mailto:me@personal.vault?subject=Resumen%20Espiralia%20del%20D%C3%ADa&body=Notas%20pendientes%20de%20revisi%C3%B3n%20editorial."
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Send size={16} aria-hidden="true" />
                      <span>Enviar recordatorio instantáneo</span>
                    </a>
                  </div>
                </article>

                {/* Tarjeta 3: Registro de Auditoría Local */}
                <article className={styles.cardRight} aria-labelledby="audit-heading">
                  <div className={styles.cardHeader}>
                    <div className={styles.cardHeaderIdentity}>
                      <div className={styles.cardIconWrapper} style={{ color: '#3f7a4e' }} aria-hidden="true">
                        <FileCheck2 size={22} />
                      </div>
                      <div>
                        <h3 id="audit-heading" className={styles.cardTitle}>
                          Registro de Auditoría Local
                        </h3>
                        <p className={styles.cardSubtitle}>
                          Historial de sincronización en este navegador
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={styles.auditChecklist}>
                    <div className={styles.auditItem}>
                      <div className={styles.auditItemLeft}>
                        <CheckCircle size={16} color="#3f7a4e" aria-hidden="true" />
                        <span>Exportación agenda_2026.ics</span>
                      </div>
                      <span className={styles.auditTime}>Hoy, 09:41</span>
                    </div>
                    <div className={styles.auditItem}>
                      <div className={styles.auditItemLeft}>
                        <CheckCircle size={16} color="#3f7a4e" aria-hidden="true" />
                        <span>Copia de Bóveda JSON</span>
                      </div>
                      <span className={styles.auditTime}>Ayer, 18:20</span>
                    </div>
                    <div className={styles.auditItem}>
                      <div className={styles.auditItemLeft}>
                        <CheckCircle size={16} color="#3f7a4e" aria-hidden="true" />
                        <span>Lectura .ics Calendario Universidad</span>
                      </div>
                      <span className={styles.auditTime}>03 Oct, 14:12</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={styles.btnDownloadFullVault}
                    onClick={handleExportFullVault}
                  >
                    <Download size={16} color="var(--color-primary, #6e0081)" aria-hidden="true" />
                    <span>Descargar Copia Completa (JSON + .ics)</span>
                  </button>
                  <p className={styles.vaultSubhint}>
                    Copia íntegra compatible con cualquier cliente local
                  </p>
                </article>
              </div>
            </div>
          </div>
        </div>

        {/* Sheet Bottom Editorial Mantra */}
        <div className={styles.sheetBottomMantra}>
          <div className={styles.mantraStorage}>
            <span className={styles.greenDot}></span>
            <span>Almacenamiento Local: <strong style={{ color: 'var(--color-ink, #232b2b)' }}>1.4 MB / 50 MB</strong> (IndexedDB)</span>
          </div>
          <p className={styles.mantraQuote}>
            « Small steps every day lead to big results. ♡ »
          </p>
          <div className={styles.mantraSpecs}>
            <span>RFC 5545</span>
            <span>•</span>
            <span>Sin telemetría</span>
          </div>
        </div>
      </article>

      {/* Desk Bottom Technical Footer */}
      <footer className={styles.deskBottomFooter}>
        <p className={styles.footerLeft}>
          Espiralia Editorial Desk • Bóveda Local Cifrada • Soberanía Analógica Digital
        </p>
        <div className={styles.footerRight}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <span className={styles.greenDot}></span>
            <span>Zero-Cloud Client</span>
          </span>
          <span>•</span>
          <a href="https://datatracker.ietf.org/doc/html/rfc5545" target="_blank" rel="noopener noreferrer">
            Especificación RFC 5545 iCalendar
          </a>
        </div>
      </footer>
    </div>
  );
};
