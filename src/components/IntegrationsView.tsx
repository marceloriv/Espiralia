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
  CalendarCheck,
} from 'lucide-react';
import { sileo } from 'sileo';
import type { Profile, AgendaEvent, Area, ViewType } from '../types';
import { StorageService, LOCALSTORAGE_QUOTA_BYTES } from '../services/storage';
import { formatBytes } from '../utils/formatBytes';
import { toLocalDateStr } from '../utils/localDate';
import { IcsService } from '../services/icsService';
import { VaultService } from '../services/vaultService';
import { Papel, TINTE_DE_MODULO } from './common/Papel';
import styles from './IntegrationsView.module.css';

export interface IntegrationsViewProps {
  profile?: Profile;
  profileId?: string;
  onNavigate?: (view: ViewType) => void;
}

export const IntegrationsView: React.FC<IntegrationsViewProps> = ({ profile: propProfile, profileId }) => {
  const profile = propProfile ?? (profileId ? StorageService.getProfiles().find(p => p.id === profileId) : null) ?? {
    id: profileId || 'default',
    name: 'Usuario',
    avatar: 'U',
    createdAt: new Date().toISOString(),
  };
  const storageBytes = StorageService.getProfileStorageBytes(profile.id);
  const todayStr = toLocalDateStr(new Date());
  const [events, setEvents] = useState<AgendaEvent[]>(() => StorageService.getEvents(profile.id));
  const [areas, setAreas] = useState<Area[]>(() => StorageService.getAreas(profile.id));
  const upcomingEvents = events
    .filter(ev => ev.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 2);
  const [selectedArea, setSelectedArea] = useState('todas');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  // Mismo respaldo que el del Acceso y el de Bóveda Offline, así que se puede restaurar.
  const handleExportFullVault = () => {
    const blob = new Blob([JSON.stringify(VaultService.exportProfile(profile.id), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = VaultService.backupFilename(profile.name, 'json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    try {
      sileo.success({ title: 'Copia completa descargada', description: 'Restáurala desde Bóveda Offline.' });
    } catch {
      // Ignorar
    }
  };

  const formatGoogleCalendarUrl = (
    title: string,
    dateStr: string,
    timeStr = '10:00',
    details = ''
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
            <span className={styles.postitAuthor}>Bóveda local de Espiralia</span>
          </div>
        </aside>

        {/* 1. Cabecera Editorial */}
        <header className={styles.header}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Integraciones &amp; Enlace Externo</h1>
          </div>

          <p className={styles.subtitle}>
            Exporta e importa tu agenda en archivos .ics, sin servidores intermediarios ni cuentas en la nube. Tus datos viven en este navegador.
          </p>
        </header>

        {/* Workspace Layout */}
        <div className={styles.workspaceLayout}>
          {/* Right Workbench Content */}
          <div className={styles.workbenchContent}>
            {/* 2. Banner de Auditoría y Privacidad */}
            <section className={styles.privacyBanner} aria-label="Auditoría de Privacidad">
              <div className={styles.bannerLeft}>
                <div className={styles.bannerIcon} aria-hidden="true">
                  <CloudOff size={24} />
                </div>
                <div>
                  <div className={styles.bannerHeadingRow}>
                    <h2 className={styles.bannerTitle}>Datos solo en este navegador</h2>
                  </div>
                  <p className={styles.bannerText}>
                    Los datos viven en el localStorage de este navegador. Los archivos .ics siguen el formato RFC 5545 y abren en Google Calendar y Apple Calendario.
                  </p>
                </div>
              </div>
            </section>

            {/* 3. Bento Grid */}
            <div className={styles.bentoGrid}>
              {/* Columna Izquierda: Google Calendar & iCal (.ics) */}
              <Papel as="article" tinte={TINTE_DE_MODULO.integraciones} aria-labelledby="gcal-heading">
                <div className={styles.cardLeft}>

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
                        Formato estándar RFC 5545 • Exporta e importa archivos
                      </p>
                    </div>
                  </div>
                  <span className={styles.tagNoOAuth}>Sin OAuth requerido</span>
                </div>

                {/* Opción A: Exportar */}
                <div className={styles.optionSection}>
                  <div className={styles.optionHeaderRow}>
                    <div className={styles.optionLabel}>
                      <span className={styles.optionDot} style={{ backgroundColor: 'var(--color-primary)' }} />
                      <span>Opción A: Generar Archivo de Exportación (.ics)</span>
                    </div>
                  </div>
                  <p className={styles.optionDesc}>
                    Genera un archivo universal descargable de inmediato. Puedes arrastrarlo o abrirlo directamente en Google Calendar web o cualquier gestor de calendario sin sincronizar credenciales.
                  </p>

                  <div className={styles.controlsGrid}>
                    <div className={styles.controlField}>
                      <label htmlFor={areaSelectId} className={styles.controlLabel}>Filtro por Área Temática</label>
                      <select
                        id={areaSelectId}
                        className={styles.selectInput}
                        value={selectedArea}
                        onChange={(e) => setSelectedArea(e.target.value)}
                      >
                        <option value="todas">Todas las áreas ({areas.length})</option>
                        {areas.map((a) => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className={styles.exportActionRow}>
                    <button type="button" className={styles.btnPrimary} onClick={handleExportIcs}>
                      <CalendarCheck size={18} aria-hidden="true" />
                      <span>Descargar archivo .ics</span>
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
                    style={{ borderColor: isDragging ? 'var(--color-primary)' : undefined }}
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
                      <span style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>
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
                  </div>
                  <p className={styles.optionDesc}>
                    Añade tus hitos más críticos a Google Calendar en una pestaña nueva sin conceder permisos de acceso ni login a tu cuenta personal.
                  </p>

                  <div className={styles.quickLinksList}>
                    {upcomingEvents.length === 0 ? (
                      <p className={styles.optionDesc}>Aún no tienes eventos próximos para añadir. Crea uno en Agenda.</p>
                    ) : (
                      upcomingEvents.map(ev => (
                        <div key={ev.id} className={styles.quickLinkCard}>
                          <div className={styles.quickLinkInfo}>
                            <span className={styles.optionDot} style={{ backgroundColor: 'var(--color-primary)' }} />
                            <div>
                              <p className={styles.quickLinkTitle}>{ev.title}</p>
                              <p className={styles.quickLinkMeta}>
                                {ev.date}
                                {ev.startTime ? ` • ${ev.startTime} hrs` : ''}
                              </p>
                            </div>
                          </div>
                          <a
                            className={styles.btnSecondaryAction}
                            href={formatGoogleCalendarUrl(ev.title, ev.date, ev.startTime ?? '09:00', ev.notes ?? '')}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <span>Añadir a Google</span>
                            <ExternalLink size={14} aria-hidden="true" />
                          </a>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                </div>
              </Papel>

              {/* Columna Derecha: Gmail & Auditoría (5 Cols) */}
              <div className={styles.rightColumn}>
                {/* Tarjeta 2: Gmail & Plantillas */}
                <Papel as="article" tinte={TINTE_DE_MODULO.integraciones} aria-labelledby="gmail-heading">
                <div className={styles.cardRight}>

                  <div className={styles.cardHeader}>
                    <div className={styles.cardHeaderIdentity}>
                      <div className={styles.cardIconWrapper} aria-hidden="true">
                        <Mail size={22} />
                      </div>
                      <div>
                        <h2 id="gmail-heading" className={styles.cardTitle}>
                          Correo &amp; Plantillas
                        </h2>
                        <p className={styles.cardSubtitle}>
                          Borrador de correo con un enlace mailto:
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={styles.securityCallout}>
                    <div className={styles.calloutTitle}>
                      <Shield size={16} aria-hidden="true" />
                      <span>¿Por qué no requiere API Key ni login?</span>
                    </div>
                    <p className={styles.calloutText}>
                      Espiralia arma un enlace mailto: con el asunto y el texto. Tu programa de correo lo abre; Espiralia no envía nada.
                    </p>
                  </div>

                  <div className={styles.templateCard}>
                    <div className={styles.templateHeader}>
                      <span className={`${styles.templateTag} ${styles.templateTagPersonal}`}>Personal</span>
                    </div>
                    <h3 className={styles.templateSubject}>Recordatorio por correo</h3>
                    <p className={styles.templatePreview}>
                      Abre un borrador de correo con un recordatorio listo para editar y enviar.
                    </p>
                    <a
                      className={styles.btnFullWidth}
                      href="mailto:?subject=Recordatorio%20de%20Espiralia"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Send size={16} aria-hidden="true" />
                      <span>Redactar recordatorio</span>
                    </a>
                  </div>
                </div>
                </Papel>

                {/* Tarjeta 3: Registro de Auditoría Local */}
                <Papel as="article" tinte={TINTE_DE_MODULO.integraciones} aria-labelledby="audit-heading">
                <div className={styles.cardRight}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardHeaderIdentity}>
                      <div className={styles.cardIconWrapper} style={{ color: '#3f7a4e' }} aria-hidden="true">
                        <FileCheck2 size={22} />
                      </div>
                      <div>
                        <h3 id="audit-heading" className={styles.cardTitle}>
                          Copia completa
                        </h3>
                        <p className={styles.cardSubtitle}>
                          Respaldo de este perfil en un archivo JSON
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={styles.btnDownloadFullVault}
                    onClick={handleExportFullVault}
                  >
                    <Download size={16} color="var(--color-primary)" aria-hidden="true" />
                    <span>Descargar copia completa (.json)</span>
                  </button>
                  <p className={styles.vaultSubhint}>
                    Es el mismo respaldo de Bóveda Offline: úsalo ahí para restaurar el perfil, con cifrado opcional.
                  </p>
                </div>
                </Papel>
              </div>
            </div>
          </div>
        </div>

        {/* Sheet Bottom Editorial Mantra */}
        <div className={styles.sheetBottomMantra}>
          <div className={styles.mantraStorage}>
            <span className={styles.greenDot}></span>
            <span>Almacenamiento Local: <strong style={{ color: 'var(--color-ink)' }}>{formatBytes(storageBytes)} de ~{formatBytes(LOCALSTORAGE_QUOTA_BYTES)}</strong> (localStorage)</span>
          </div>
        </div>
      </article>

    </div>
  );
};
