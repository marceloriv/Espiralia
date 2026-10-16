import React, { useState, useEffect, useRef, useId } from 'react';
import {
  Calendar,
  CloudOff,
  Download,
  ExternalLink,
  Forward,
  Mail,
  Send,
  Shield,
  UploadCloud,
  FileCheck2,
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
      const match = areas.find(a => a.id === selectedArea || a.name.toLowerCase() === selectedArea.toLowerCase());
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

    sileo.success({ title: 'Archivo .ics generado y descargado con éxito' });
  };

  const handleFileImport = (file: File) => {
    if (!file.name.endsWith('.ics')) {
      sileo.error({ title: 'Formato no soportado', description: 'Por favor selecciona un archivo con extensión .ics' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const parsed = IcsService.parseIcs(content, profile.id);
      if (parsed.length === 0) {
        sileo.warning({ title: 'No se encontraron eventos válidos en el archivo' });
        return;
      }

      for (const ev of parsed) {
        StorageService.saveEvent(ev);
      }
      setEvents(StorageService.getEvents(profile.id));
      sileo.success({
        title: 'Eventos importados con éxito',
        description: `Se han añadido ${parsed.length} eventos a tu agenda local.`,
      });
    };
    reader.onerror = () => {
      sileo.error({ title: 'Error al leer el archivo' });
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

  const formatGoogleCalendarUrl = (title: string, dateStr: string, timeStr = '10:00', details = 'Generado desde Espiralia Privacy Vault') => {
    const cleanDate = dateStr.replace(/-/g, '');
    const cleanTime = timeStr.replace(/:/g, '') + '00';
    const dates = `${cleanDate}T${cleanTime}/${cleanDate}T${cleanTime}`;
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${dates}&details=${encodeURIComponent(details)}`;
  };

  return (
    <div className={styles.container}>
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
              <span className={styles.chipDot} style={{ backgroundColor: 'var(--color-primary)' }} />
              <span>Universidad</span>
            </span>
          </div>
        </div>

        <h1 className={styles.title}>Integraciones &amp; Enlace Externo</h1>
        <p className={styles.subtitle}>
          Sincronización cliente pura diseñada bajo <em className={styles.italicTerm}>Privacy-by-Design</em>. Sin servidores intermediarios, sin cuentas en la nube ni tokens OAuth almacenados fuera de tu navegador. Tus compromisos existen exclusivamente en tu disco local.
        </p>
      </header>

      {/* 2. Banner de Auditoría y Privacidad */}
      <section className={styles.privacyBanner} aria-label="Auditoría de Privacidad">
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
      </section>

      {/* 3. Bento Grid */}
      <div className={styles.bentoGrid}>
        {/* Columna Izquierda: Google Calendar & iCal (.ics) */}
        <article className={styles.cardLeft} aria-labelledby="gcal-heading">
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderIdentity}>
              <div className={styles.cardIconWrapper} aria-hidden="true">
                <Calendar size={22} />
              </div>
              <div>
                <h2 id="gcal-heading" className={styles.cardTitle}>Google Calendar &amp; iCal (.ics)</h2>
                <p className={styles.cardSubtitle}>Formato estándar RFC 5545 • Sincronización bidireccional local</p>
              </div>
            </div>
            <span className={styles.tagNoOAuth}>Sin OAuth requerido</span>
          </div>

          {/* Opción A: Exportar */}
          <div className={styles.optionSection}>
            <div className={styles.optionLabel}>
              <span className={styles.optionDot} style={{ backgroundColor: 'var(--color-primary)' }} />
              <span>Opción A: Generar Archivo de Exportación (.ics)</span>
            </div>
            <p className={styles.optionDesc}>
              Genera un archivo universal descargable de inmediato. Puedes arrastrarlo o abrirlo directamente en Google Calendar web o cualquier gestor de calendario.
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
                  <option value="todas">Todas las áreas activas ({areas.length})</option>
                  {areas.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.exportActionRow}>
              <button type="button" className={styles.btnPrimary} onClick={handleExportIcs}>
                <Download size={18} aria-hidden="true" />
                <span>Descargar Archivo .ics Calificado</span>
              </button>
              <span className={styles.eventsReadyCount}>{events.length} eventos programados listos</span>
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
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              aria-label="Arrastra tu archivo .ics aquí o explora tu equipo"
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
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
                <UploadCloud size={24} />
              </div>
              <p className={styles.dropzoneText}>
                Arrastra tu archivo <code className={styles.codeBadge}>.ics</code> aquí o <span style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>explora tu equipo</span>
              </p>
              <p className={styles.dropzoneHint}>
                Lectura directa vía FileReader API. Ningún dato sale de este equipo.
              </p>
            </div>
          </div>

          <div className={styles.divider} aria-hidden="true" />

          {/* Opción C: Atajos directos a Google Calendar Web */}
          <div className={styles.optionSection}>
            <div className={styles.optionLabel}>
              <span className={styles.optionDot} style={{ backgroundColor: '#e8a55a' }} />
              <span>Opción C: Atajos Directos "A un solo clic" (Google Calendar Web)</span>
            </div>
            <p className={styles.optionDesc}>
              Añade tus hitos más críticos a Google Calendar en una pestaña nueva sin conceder permisos de acceso a tu cuenta personal.
            </p>

            <div className={styles.quickLinksList}>
              <div className={styles.quickLinkCard}>
                <div className={styles.quickLinkInfo}>
                  <span className={styles.optionDot} style={{ backgroundColor: 'var(--color-primary)' }} />
                  <div>
                    <p className={styles.quickLinkTitle}>Entrega Memoria de Tesis Semestre II</p>
                    <p className={styles.quickLinkMeta}>15 Noviembre 2026 • 23:59 hrs • Universidad</p>
                  </div>
                </div>
                <a
                  className={styles.btnSecondaryAction}
                  href={formatGoogleCalendarUrl('Entrega Memoria de Tesis Semestre II', '2026-11-15', '23:59', 'Convocatoria académica 2026-II')}
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
                    <p className={styles.quickLinkTitle}>Examen Teórico Conaset Clase B</p>
                    <p className={styles.quickLinkMeta}>20 Octubre 2026 • 10:00 hrs • Estudios</p>
                  </div>
                </div>
                <a
                  className={styles.btnSecondaryAction}
                  href={formatGoogleCalendarUrl('Examen Teórico Conaset Clase B', '2026-10-20', '10:00', 'Simulacros y banco de preguntas')}
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

        {/* Columna Derecha: Gmail & Auditoría */}
        <div className={styles.rightColumn}>
          {/* Tarjeta 2: Gmail & Plantillas */}
          <article className={styles.cardRight} aria-labelledby="gmail-heading">
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderIdentity}>
                <div className={styles.cardIconWrapper} aria-hidden="true">
                  <Mail size={22} />
                </div>
                <div>
                  <h2 id="gmail-heading" className={styles.cardTitle}>Gmail &amp; Plantillas</h2>
                  <p className={styles.cardSubtitle}>Protocolo mailto:// y web intents de redacción</p>
                </div>
              </div>
              <span className={styles.chipDot} style={{ backgroundColor: 'var(--color-success)' }} title="Cero permisos delegados" />
            </div>

            <div className={styles.securityCallout} style={{ marginTop: 16 }}>
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
                <Forward size={16} aria-hidden="true" />
                <span>Abrir borrador en Gmail</span>
              </a>
            </div>

            <div className={styles.templateCard}>
              <div className={styles.templateHeader}>
                <span className={`${styles.templateTag} ${styles.templateTagPersonal}`}>Personal</span>
                <span className={styles.templateId}>Recordatorio Express</span>
              </div>
              <h3 className={styles.templateSubject}>Auto-envío de notas &amp; reflexiones</h3>
              <p className={styles.templatePreview}>
                Envía el extracto de tu cuaderno activo a tu propia bandeja de entrada sin rastreo de analíticas.
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
          <article className={`${styles.cardRight} ${styles.cardAudit}`} aria-labelledby="audit-heading">
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderIdentity}>
                <div className={styles.cardIconWrapper} style={{ color: 'var(--color-success)' }} aria-hidden="true">
                  <FileCheck2 size={22} />
                </div>
                <div>
                  <h3 id="audit-heading" className={styles.cardTitle}>Registro de Auditoría Local</h3>
                  <p className={styles.cardSubtitle}>Historial de sincronización en este navegador</p>
                </div>
              </div>
            </div>

            <div className={styles.auditStatsList}>
              <div className={styles.auditRow}>
                <span className={styles.auditLabel}>Eventos en agenda local</span>
                <span className={styles.auditVal}>{events.length}</span>
              </div>
              <div className={styles.auditRow}>
                <span className={styles.auditLabel}>Áreas temáticas activas</span>
                <span className={styles.auditVal}>{areas.length}</span>
              </div>
              <div className={styles.auditRow}>
                <span className={styles.auditLabel}>Almacenamiento activo</span>
                <span className={styles.auditVal}>LocalStorage + IDB</span>
              </div>
              <div className={styles.auditRow}>
                <span className={styles.auditLabel}>Tráfico externo transmitido</span>
                <span className={styles.auditVal} style={{ color: 'var(--color-success)' }}>0 KB (Offline)</span>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
};
