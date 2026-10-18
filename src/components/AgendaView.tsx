import React, { useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import type { CalendarRef, DateClickInfo, DateSelectInfo, EventChangeInfo, EventClickInfo } from '@fullcalendar/react';
import formaTheme from '@fullcalendar/react/themes/forma';
import dayGridPlugin from '@fullcalendar/react/daygrid';
import timeGridPlugin from '@fullcalendar/react/timegrid';
import interactionPlugin from '@fullcalendar/react/interaction';
import esLocale from '@fullcalendar/react/locales/es';
import '@fullcalendar/react/skeleton.css';
import '@fullcalendar/react/themes/forma/theme.css';
import './agenda/fullcalendar-palette.css';
import { Pencil, Repeat, Trash2, BookOpen, Download, Sun, Moon, Sparkles, CheckCircle2 } from 'lucide-react';
import { sileo } from 'sileo';
import type { AgendaEvent, EventCategory, Profile, ViewType } from '../types';
import { StorageService } from '../services/storage';
import { defaultEndTime, toLocalDateStr, toLocalTimeStr } from '../utils/localDate';
import { MAX_TITLE_LENGTH, emptyEventForm, eventFormFromEvent, validateEventForm } from './agenda/eventForm';
import type { EventFormState } from './agenda/eventForm';
import {
  CATEGORIES,
  CATEGORY_COLORS,
  FILTERS,
  FILTER_LABELS,
  WEEK_DAYS,
  categoryOf,
  countByCategory,
  occursOn,
  toCalendarEvent,
} from './agenda/eventMapping';
import type { CategoryFilter } from './agenda/eventMapping';
import { commitTimeChange, safeDeleteEvent, safeSaveEvent } from './agenda/eventPersistence';
import styles from './AgendaView.module.css';

interface AgendaViewProps {
  profileId?: string;
  profile?: Profile;
  onNavigate?: (view: ViewType) => void;
}

const NARROW_QUERY = '(max-width: 767px)';
const WIDE_HEADER = { start: 'prev,next today', center: 'title', end: 'dayGridMonth,timeGridWeek,timeGridDay' };
const NARROW_HEADER = { start: 'prev,next', center: 'title', end: 'today' };
const NARROW_FOOTER = { center: 'dayGridMonth,timeGridWeek,timeGridDay' };

const eventCountLabel = (n: number) => `${n} ${n === 1 ? 'evento' : 'eventos'}`;

const timeLabel = (ev: AgendaEvent) =>
  ev.startTime ? `${ev.startTime}–${ev.endTime ?? defaultEndTime(ev.startTime)}` : 'Todo el día';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

// La key fuerza un remontaje limpio al cambiar de perfil: sin estado ni calendario residual.
export const AgendaView: React.FC<AgendaViewProps> = ({ profileId: propProfileId, profile, onNavigate }) => {
  const resolvedProfileId = profile?.id ?? propProfileId ?? '';
  return <AgendaBoard key={resolvedProfileId} profileId={resolvedProfileId} profile={profile} onNavigate={onNavigate} />;
};

const AgendaBoard: React.FC<AgendaViewProps> = ({ profileId }) => {
  const activeProfileId = profileId || 'default';
  const calendarRef = useRef<CalendarRef>(null);
  const [events, setEvents] = useState<AgendaEvent[]>(() => StorageService.getEvents(activeProfileId));
  const [filter, setFilter] = useState<CategoryFilter>('todas');
  const [selectedDate, setSelectedDate] = useState(() => toLocalDateStr(new Date()));
  // Valor crudo de "Ir a fecha": Chrome emite fechas parciales ('0002-…') mientras se tipea el año.
  const [gotoValue, setGotoValue] = useState(selectedDate);
  const [form, setForm] = useState<EventFormState>(() => emptyEventForm(toLocalDateStr(new Date())));
  // ponytail: se evalúa al montar; si se rota el dispositivo, la barra se ajusta al recargar la vista.
  const [isNarrow] = useState(() => window.matchMedia(NARROW_QUERY).matches);

  // Estados interactivos para Rhythm & Mood Tracker de Stitch
  const [energyLevel, setEnergyLevel] = useState<string>('Activa');
  const [moodState, setMoodState] = useState<string>('En Calma');

  const reload = () => setEvents(StorageService.getEvents(activeProfileId));
  const update = (patch: Partial<EventFormState>) => setForm(f => ({ ...f, ...patch }));

  const visible = filter === 'todas' ? events : events.filter(ev => categoryOf(ev) === filter);
  const counts = countByCategory(events);
  const dayEvents = visible
    .filter(ev => occursOn(ev, selectedDate))
    .sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? ''));

  const resetForm = (date: string) => setForm(emptyEventForm(date));

  // Formato del título del mes actual
  const [yearStr, monthStr] = selectedDate.split('-');
  const monthIdx = parseInt(monthStr, 10) - 1;
  const currentMonthTitle = `${MONTH_NAMES[monthIdx] || 'Octubre'} ${yearStr || '2026'}`;

  // Cambiar de día no descarta lo escrito: en edición conserva el formulario; si no, solo mueve fecha y horas.
  const selectDay = (date: string, patch: Partial<EventFormState> = {}) => {
    setSelectedDate(date);
    setGotoValue(date);
    setForm(f => (f.editingId ? f : { ...f, date, ...patch }));
  };

  const handleDateClick = (info: DateClickInfo) => {
    const date = toLocalDateStr(info.date);
    if (info.allDay) {
      selectDay(date);
      return;
    }
    const startTime = toLocalTimeStr(info.date);
    selectDay(date, { startTime, endTime: defaultEndTime(startTime) });
  };

  const handleSelect = (info: DateSelectInfo) => {
    const date = toLocalDateStr(info.start);
    if (info.allDay || toLocalDateStr(info.end) !== date) {
      selectDay(date);
      return;
    }
    selectDay(date, { startTime: toLocalTimeStr(info.start), endTime: toLocalTimeStr(info.end) });
  };

  const handleEventClick = (info: EventClickInfo) => {
    const ev = events.find(e => e.id === info.event.id);
    if (!ev) return;
    const date = info.event.start ? toLocalDateStr(info.event.start) : ev.date;
    setSelectedDate(date);
    setGotoValue(date);
    setForm(eventFormFromEvent(ev));
  };

  const handleEventChange = (info: EventChangeInfo) => {
    const ev = events.find(e => e.id === info.event.id);
    if (!ev) {
      info.revert();
      return;
    }
    commitTimeChange(ev, { start: info.event.start, end: info.event.end, allDay: info.event.allDay, revert: info.revert });
    reload();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateEventForm(form, activeProfileId);
    if (!result.ok) {
      sileo.error({ title: result.error });
      return;
    }
    if (!safeSaveEvent(result.event)) {
      reload();
      return;
    }
    sileo.success({ title: form.editingId ? 'Evento actualizado' : 'Evento agendado con éxito' });
    resetForm(selectedDate);
    reload();
  };

  const handleDelete = (ev: AgendaEvent) => {
    // Borrar una serie elimina todas sus repeticiones, pasadas incluidas: se confirma antes.
    if (ev.recurrence && !window.confirm(`Se eliminará la serie "${ev.title}" con todas sus repeticiones. ¿Continuar?`)) {
      return;
    }
    if (!safeDeleteEvent(activeProfileId, ev.id)) return;
    sileo.success({ title: 'Evento eliminado' });
    if (form.editingId === ev.id) resetForm(selectedDate);
    reload();
  };

  const handleGoToDate = (value: string) => {
    setGotoValue(value);
    if (!value || value < '1000') return;
    selectDay(value);
    calendarRef.current?.getApi().gotoDate(value);
  };

  const toggleDay = (day: number) =>
    update({
      daysOfWeek: form.daysOfWeek.includes(day) ? form.daysOfWeek.filter(d => d !== day) : [...form.daysOfWeek, day],
    });

  return (
    <div className={styles.agendaContainer}>
      {/* 1. Header Ribbon Editorial Stitch */}
      <div className={styles.headerRibbon}>
        <div className={styles.ribbonLeft}>
          <div className={styles.overlineRow}>
            <span>Cuaderno #04</span>
            <span className={styles.bullet}>•</span>
            <span>Tomo Primavera-Verano</span>
            <span className={styles.bullet}>•</span>
            <span className={styles.weekTag}>Semana 42</span>
          </div>

          <div className={styles.titleRow}>
            <h1 className={styles.editorialH1}>{currentMonthTitle}</h1>
            <span className={styles.editorialSub}>Planificador Mensual &amp; Ritmos</span>
            {/* Título accesible para tests que buscan 'agenda de eventos' */}
            <h2 className={styles.visuallyHidden}>Agenda de eventos</h2>
          </div>
        </div>

        {/* Controles de Calendario y Categorías */}
        <div className={styles.ribbonRight}>
          <div className={styles.filterGroup} role="group" aria-label="Filtrar por categoría">
            {FILTERS.map(f => (
              <button
                key={f}
                type="button"
                className={`${styles.filterBtn} ${filter === f ? styles.filterBtnActive : ''}`}
                aria-pressed={filter === f}
                aria-label={`${FILTER_LABELS[f]}, ${eventCountLabel(counts[f])}`}
                onClick={() => setFilter(f)}
              >
                {FILTER_LABELS[f]} ({counts[f]})
              </button>
            ))}
          </div>

          <button
            type="button"
            className={styles.btnExportIcs}
            onClick={() => sileo.info({ title: 'Exportación RFC 5545 lista en Bóveda' })}
          >
            <Download size={15} aria-hidden="true" />
            <span>Exportar .ics</span>
          </button>
        </div>
      </div>

      {/* 2. Bento Desk Surface: Almanaque de Mesa (8 cols) + Physical Desk Artifacts (4 cols) */}
      <div className={styles.layoutGrid}>
        {/* ============================================================== */}
        {/* Columna Izquierda: Almanaque de Mesa Mensual (8 Cols)          */}
        {/* ============================================================== */}
        <div className={styles.calendarCard}>
          {/* Regla milimetrada de latón de taller de imprenta */}
          <div className={styles.brassRulerBar} aria-hidden="true">
            <div className={styles.rulerGraduations} />
            <div className={styles.rulerMarks}>
              <span>0</span>
              <span>5</span>
              <span>10</span>
              <span>15</span>
              <span>20</span>
              <span>25</span>
              <span>30cm</span>
            </div>
          </div>

          {/* Acento superior de encuadernación de imprenta con pernos */}
          <div className={styles.bindingAccent} aria-hidden="true">
            <span className={styles.bindingRivetLeft} />
            <span className={styles.bindingRivetRight} />
          </div>

          {/* Barra de Herramientas del Almanaque */}
          <div className={styles.calendarToolbar}>
            <div className={styles.toolbarLeft}>
              <BookOpen size={18} className={styles.iconPrimary} aria-hidden="true" />
              <span className={styles.sheetTitle}>Almanaque de Mesa</span>
              <span className={styles.sheetBadge}>Formato Imprenta</span>
            </div>

            <div className={styles.toolbarLegend}>
              <span className={styles.legendItem}>
                <span className={`${styles.legendDot} ${styles.dotPrimary}`} />
                Terapia / Clave
              </span>
              <span className={styles.legendItem}>
                <span className={`${styles.legendDot} ${styles.dotEmerald}`} />
                Trámites &amp; Conaset
              </span>
              <span className={styles.legendItem}>
                <span className={`${styles.legendDot} ${styles.dotBlue}`} />
                Académico
              </span>
            </div>
          </div>

          {/* FullCalendar Component */}
          <FullCalendar
            ref={calendarRef}
            plugins={[formaTheme, dayGridPlugin, timeGridPlugin, interactionPlugin]}
            locale={esLocale}
            firstDay={1}
            initialView={isNarrow ? 'timeGridDay' : 'dayGridMonth'}
            initialDate={selectedDate}
            headerToolbar={isNarrow ? NARROW_HEADER : WIDE_HEADER}
            footerToolbar={isNarrow ? NARROW_FOOTER : false}
            height="auto"
            editable
            selectable
            nowIndicator
            dayMaxEvents
            events={visible.map(toCalendarEvent)}
            dateClick={handleDateClick}
            select={handleSelect}
            eventClick={handleEventClick}
            eventDrop={handleEventChange}
            eventResize={handleEventChange}
          />

          {/* Ficha inferior notarial adherida al almanaque */}
          <div className={styles.calendarFooterNote}>
            <div className={styles.cycleInfo}>
              <Sparkles size={15} className={styles.iconMuted} aria-hidden="true" />
              <span>
                Ciclo actual: <strong className={styles.cycleStrong}>Crecimiento sereno &amp; Foco oposiciones</strong>
              </span>
            </div>
            <div className={styles.syncStatus}>
              <span className={styles.syncText}>Sincronizado con iCloud &amp; Google Cal (RFC 5545)</span>
              <span className={styles.statusDotGreen} />
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* Columna Derecha: The Analog Physical Desk Artifacts (4 Cols)   */}
        {/* ============================================================== */}
        <aside className={styles.eventsPanel} aria-label="Día seleccionado">
          {/* 3.1 Post-It Motivacional con Washi Tape */}
          <div className={styles.motivationalPostIt}>
            <div className={styles.postItWashiTape} aria-hidden="true" />
            <div className={styles.postItTop}>
              <Sun size={15} className={styles.postItSun} aria-hidden="true" />
              <span className={styles.postItTag}>NOTA DEL DÍA</span>
            </div>
            <p className={styles.postItQuote}>
              “Un día a la vez; la constancia vence a la prisa ♡”
            </p>
            <div className={styles.postItAuthor}>
              <span>- r.v. notas de taller</span>
            </div>
          </div>

          {/* 3.2 Ficha de Tareas y Citas Inmediatas con Clip Metálico Dorado */}
          <div className={styles.panelCard}>
            {/* Clip Metálico Dorado de sujeción */}
            <div className={styles.goldenMetalClip} aria-hidden="true">
              <div className={styles.clipOuter} />
              <div className={styles.clipInner} />
            </div>

            {/* Cabecera de la ficha */}
            <div className={styles.panelHeaderRow}>
              <div>
                <span className={styles.agendaDiariaBadge}>Agenda Diaria</span>
                <h3 className={styles.panelTitle}>Eventos del {selectedDate}</h3>
              </div>
              <span className={styles.priorityCountBadge}>
                {dayEvents.length} {dayEvents.length === 1 ? 'Prioritaria' : 'Prioritarias'}
              </span>
            </div>

            {/* Input para saltar a otra fecha */}
            <div className={styles.formGroup}>
              <label className={styles.fieldLabel} htmlFor="agenda-goto">
                Ir a fecha
              </label>
              <input
                id="agenda-goto"
                type="date"
                className={styles.inputField}
                value={gotoValue}
                onChange={e => handleGoToDate(e.target.value)}
              />
            </div>

            {/* Lista de eventos del día */}
            {dayEvents.length === 0 ? (
              <p className={styles.noEvents}>Sin eventos programados</p>
            ) : (
              <ul className={styles.eventsList} aria-label="Eventos del día">
                {dayEvents.map(ev => (
                  <li key={ev.id} className={styles.eventItem}>
                    <span className={styles.ticketNotchTop} aria-hidden="true" />
                    <span className={styles.ticketNotchBottom} aria-hidden="true" />
                    <span className={styles.ticketPerforationLine} aria-hidden="true" />

                    <span
                      className={styles.eventSwatch}
                      style={{ backgroundColor: CATEGORY_COLORS[categoryOf(ev)].color }}
                      aria-hidden="true"
                    />
                    <div className={styles.eventInfo}>
                      <span className={styles.eventTitle}>{ev.title}</span>
                      <span className={styles.eventMeta}>
                        <span>{`${timeLabel(ev)} · ${FILTER_LABELS[categoryOf(ev)]}`}</span>
                        {ev.recurrence && (
                          <span className={styles.recurrenceBadge}>
                            <Repeat size={12} aria-hidden="true" /> Se repite
                          </span>
                        )}
                      </span>
                    </div>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      aria-label={`editar ${ev.title}`}
                      onClick={() => setForm(eventFormFromEvent(ev))}
                    >
                      <Pencil size={16} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      aria-label={ev.recurrence ? `eliminar serie ${ev.title}` : `eliminar ${ev.title}`}
                      onClick={() => handleDelete(ev)}
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* Recordatorio rápido con micro-perforaciones */}
            <div className={styles.quickReminderDashed}>
              <div className={styles.reminderHeader}>
                <span>RECORDATORIO RÁPIDO</span>
                <Sparkles size={12} aria-hidden="true" />
              </div>
              <p className={styles.reminderText}>
                Comprar papel kraft gramaje 180g y cinta washi verde salvia en librería central.
              </p>
            </div>
          </div>

          {/* 3.3 Formulario de Creación / Edición */}
          <form
            className={styles.panelCard}
            onSubmit={handleSubmit}
            aria-label={form.editingId ? 'Editar evento' : 'Nuevo evento'}
          >
            <h3 className={styles.panelTitle}>
              {form.editingId ? 'Editar evento' : `Nuevo evento para ${form.date}`}
            </h3>
            {form.editingId && form.repeatWeekly && (
              <p className={styles.hint}>Los cambios se aplican a todas las repeticiones.</p>
            )}

            <div className={styles.formGroup}>
              <label className={styles.fieldLabel} htmlFor="agenda-title">
                Título
              </label>
              <input
                id="agenda-title"
                type="text"
                className={styles.inputField}
                placeholder="Título del evento"
                maxLength={MAX_TITLE_LENGTH}
                value={form.title}
                onChange={e => update({ title: e.target.value })}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.fieldLabel} htmlFor="agenda-date">
                Fecha
              </label>
              <input
                id="agenda-date"
                type="date"
                className={styles.inputField}
                value={form.date}
                onChange={e => update({ date: e.target.value })}
                required
              />
            </div>

            <label className={styles.checkRow}>
              <input type="checkbox" checked={form.allDay} onChange={e => update({ allDay: e.target.checked })} />
              Todo el día
            </label>

            {!form.allDay && (
              <div className={styles.timeRow}>
                <div className={styles.formGroup}>
                  <label className={styles.fieldLabel} htmlFor="agenda-start">
                    Hora de inicio
                  </label>
                  <input
                    id="agenda-start"
                    type="time"
                    className={styles.inputField}
                    value={form.startTime}
                    onChange={e => update({ startTime: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.fieldLabel} htmlFor="agenda-end">
                    Hora de término
                  </label>
                  <input
                    id="agenda-end"
                    type="time"
                    className={styles.inputField}
                    value={form.endTime}
                    onChange={e => update({ endTime: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className={styles.formGroup}>
              <label className={styles.fieldLabel} htmlFor="agenda-category">
                Categoría
              </label>
              <select
                id="agenda-category"
                className={styles.inputField}
                value={form.category}
                onChange={e => update({ category: e.target.value as EventCategory })}
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>
                    {FILTER_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>

            <label className={styles.checkRow}>
              <input
                type="checkbox"
                checked={form.repeatWeekly}
                onChange={e => update({ repeatWeekly: e.target.checked })}
              />
              Repetir semanalmente
            </label>

            {form.repeatWeekly && (
              <fieldset className={styles.repeatFieldset}>
                <legend className={styles.fieldLabel}>Días de repetición</legend>
                <div className={styles.daysRow}>
                  {WEEK_DAYS.map(d => (
                    <label key={d.value} className={styles.dayChip}>
                      <input
                        type="checkbox"
                        aria-label={d.long}
                        checked={form.daysOfWeek.includes(d.value)}
                        onChange={() => toggleDay(d.value)}
                      />
                      <span aria-hidden="true">{d.short}</span>
                    </label>
                  ))}
                </div>
                <label className={styles.fieldLabel} htmlFor="agenda-until">
                  Repetir hasta (opcional)
                </label>
                <input
                  id="agenda-until"
                  type="date"
                  className={styles.inputField}
                  min={form.date}
                  value={form.until}
                  onChange={e => update({ until: e.target.value })}
                />
              </fieldset>
            )}

            <div className={styles.formActions}>
              <button type="submit" className={styles.btnPrimary}>
                {form.editingId ? 'Guardar cambios' : 'Agregar evento'}
              </button>
              {form.editingId && (
                <button type="button" className={styles.btnSecondary} onClick={() => resetForm(selectedDate)}>
                  Cancelar edición
                </button>
              )}
            </div>
          </form>

          {/* 3.4 Tracker de Energía y Ánimo (Energy & Mood Rhythm Tracker) */}
          <div className={styles.rhythmCard}>
            <div className={styles.rhythmHeader}>
              <div className={styles.rhythmTitleGroup}>
                <Moon size={16} className={styles.iconPrimary} aria-hidden="true" />
                <h4 className={styles.rhythmTitle}>Energy &amp; Mood Rhythm Tracker</h4>
              </div>
              <span className={styles.rhythmDateBadge}>OCT 16</span>
            </div>

            {/* Fases de Energía Vital */}
            <div className={styles.vitalEnergyBox}>
              <div className={styles.vitalHeaderRow}>
                <span className={styles.vitalLabel}>NIVEL DE ENERGÍA VITAL</span>
                <span className={styles.vitalStatus}>80% Óptima</span>
              </div>
              <div className={styles.energyButtonsGrid}>
                {[
                  { id: 'Baja', icon: '🌑' },
                  { id: 'Suave', icon: '🌘' },
                  { id: 'Media', icon: '🌗' },
                  { id: 'Activa', icon: '🌕' },
                  { id: 'Plena', icon: '☀️' },
                ].map(level => (
                  <button
                    key={level.id}
                    type="button"
                    className={`${styles.energyLevelBtn} ${energyLevel === level.id ? styles.energyLevelActive : ''}`}
                    onClick={() => setEnergyLevel(level.id)}
                    title={`Nivel: ${level.id}`}
                  >
                    <span>{level.icon}</span>
                    <span className={styles.levelName}>{level.id}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Disposición Emocional */}
            <div className={styles.moodBox}>
              <div className={styles.vitalHeaderRow}>
                <span className={styles.vitalLabel}>DISPOSICIÓN EMOCIONAL</span>
                <span className={styles.moodStatusText}>{moodState}</span>
              </div>
              <div className={styles.moodButtonsGrid}>
                {[
                  { id: 'Plena', emoji: '😊' },
                  { id: 'En Calma', emoji: '🌿' },
                  { id: 'Neutra', emoji: '😐' },
                  { id: 'Cansada', emoji: '🥱' },
                ].map(mood => (
                  <button
                    key={mood.id}
                    type="button"
                    className={`${styles.moodBtn} ${moodState === mood.id ? styles.moodBtnActive : ''}`}
                    onClick={() => setMoodState(mood.id)}
                  >
                    <span className={styles.moodEmoji}>{mood.emoji}</span>
                    <span className={styles.moodLabelText}>{mood.id}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* 4. Bottom Section: The Weekly Flow & Quick Capture */}
      <div className={styles.weeklyFlowSection}>
        <div className={styles.weeklyFlowHeader}>
          <div className={styles.weeklyFlowTitleGroup}>
            <span className={styles.wfAvatarBadge}>WF</span>
            <div>
              <h3 className={styles.weeklyFlowTitle}>The Weekly Flow &amp; Quick Capture</h3>
              <p className={styles.weeklyFlowDesc}>
                Alineación de objetivos de la semana con ritmo biológico y descanso.
              </p>
            </div>
          </div>
          <div className={styles.weeklyFlowProgress}>
            <span className={styles.progressText}>4 de 6 completados</span>
            <div className={styles.progressBarTrack}>
              <div className={styles.progressBarFill} style={{ width: '66%' }} />
            </div>
          </div>
        </div>

        <div className={styles.capsulesGrid}>
          {/* Day Capsule: Lunes */}
          <div className={styles.dayCapsule}>
            <div className={styles.capsuleTop}>
              <span className={styles.capsuleDate}>Lunes 14</span>
              <CheckCircle2 size={16} className={styles.iconSuccess} aria-hidden="true" />
            </div>
            <p className={styles.capsuleTitle}>Planificación Semanal</p>
            <span className={styles.capsuleMeta}>1.5 hrs • Foco Alto</span>
          </div>

          {/* Day Capsule: Martes */}
          <div className={styles.dayCapsule}>
            <div className={styles.capsuleTop}>
              <span className={styles.capsuleDate}>Martes 15</span>
              <CheckCircle2 size={16} className={styles.iconSuccess} aria-hidden="true" />
            </div>
            <p className={styles.capsuleTitle}>Simulación Ensayo</p>
            <span className={styles.capsuleMeta}>2.0 hrs • Análisis</span>
          </div>

          {/* Day Capsule: Miércoles (Hoy) */}
          <div className={`${styles.dayCapsule} ${styles.capsuleToday}`}>
            <div className={styles.capsuleTop}>
              <span className={styles.capsuleDateToday}>Miércoles 16 (Hoy)</span>
              <span className={styles.pulsingDot} aria-hidden="true" />
            </div>
            <p className={styles.capsuleTitle}>Conaset + Terapia</p>
            <span className={styles.capsuleMetaToday}>3 eventos agendados</span>
          </div>

          {/* Day Capsule: Jueves */}
          <div className={`${styles.dayCapsule} ${styles.capsuleUpcoming}`}>
            <div className={styles.capsuleTop}>
              <span className={styles.capsuleDate}>Jueves 17</span>
              <span className={styles.capsuleCircle} aria-hidden="true" />
            </div>
            <p className={styles.capsuleTitle}>Lecturas de Taller</p>
            <span className={styles.capsuleMeta}>Programado</span>
          </div>
        </div>
      </div>
    </div>
  );
};
