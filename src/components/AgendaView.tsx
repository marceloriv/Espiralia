import React, { useRef, useState } from 'react';
import { useHoy } from '../utils/useHoy';
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
import { Pencil, Repeat, Trash2, BookOpen, Download, Sun, Moon, CalendarMinus } from 'lucide-react';
import { DISPOSITIONS, ENERGY_LEVELS, dispositionLabel, energyLabel } from '../utils/energyLevels';
import { sileo } from 'sileo';
import type { AgendaEvent, Disposition, Profile, ViewType } from '../types';
import { StorageService } from '../services/storage';
import { IcsService } from '../services/icsService';
import { downloadFile } from '../utils/downloadFile';
import { defaultEndTime, isoWeekNumber, toLocalDateStr, toLocalTimeStr } from '../utils/localDate';
import { emptyEventForm, eventFormFromEvent, validateEventForm } from './agenda/eventForm';
import type { EventFormState } from './agenda/eventForm';
import {
  CATEGORIES,
  CATEGORY_COLORS,
  FILTERS,
  FILTER_LABELS,
  categoryOf,
  countByCategory,
  occursOn,
  removeOccurrence,
  toCalendarEvent,
} from './agenda/eventMapping';
import type { CategoryFilter } from './agenda/eventMapping';
import { commitTimeChange, safeDeleteEvent, safeSaveEvent } from './agenda/eventPersistence';
import { Papel } from './common/Papel';
import { TINTE_DE_MODULO } from './common/tintes';
import { Pliego } from './common/Pliego';
import { EventFormPanel } from './agenda/EventFormPanel';
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
  const hoy = useHoy();
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

  // Energía y ánimo del día: los mismos registros que To-Do, Planner, Notas y el Dashboard.
  const todayStr = toLocalDateStr(hoy);
  const [energyLevel, setEnergyLevel] = useState(() => StorageService.getTodayMood(activeProfileId, todayStr) ?? '');
  const [disposition, setDisposition] = useState(() => StorageService.getTodayDisposition(activeProfileId, todayStr));

  const handleSelectEnergy = (value: string) => {
    setEnergyLevel(value);
    StorageService.setTodayMood(activeProfileId, todayStr, value);
  };

  const handleSelectDisposition = (value: Disposition) => {
    setDisposition(value);
    StorageService.setTodayDisposition(activeProfileId, todayStr, value);
  };

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
  const monthIdx = Number.parseInt(monthStr, 10) - 1;
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

  // Quitar un día parte la serie en dos (removeOccurrence); si la primera parte no queda, se borra la serie original.
  const quitarDiaDeSerie = (serie: AgendaEvent, date: string): boolean => {
    // Sufijo aleatorio: el evento suelto de "Cambiar solo este día" se crea en el mismo milisegundo.
    const quedan = removeOccurrence(serie, date, () => `e-${Date.now()}-${crypto.getRandomValues(new Uint32Array(1))[0].toString(36)}`);
    if (!quedan.some(parte => parte.id === serie.id) && !safeDeleteEvent(activeProfileId, serie.id)) return false;
    return quedan.every(parte => safeSaveEvent(parte));
  };

  const handleRemoveOccurrence = (ev: AgendaEvent) => {
    if (!window.confirm(`¿Quitar el ${selectedDate} de la serie "${ev.title}"? Las demás repeticiones se mantienen.`)) return;
    if (!quitarDiaDeSerie(ev, selectedDate)) {
      reload();
      return;
    }
    sileo.success({ title: 'Día quitado de la serie' });
    if (form.editingId === ev.id) resetForm(selectedDate);
    reload();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.editingId && form.soloDia) {
      const serie = events.find(ev => ev.id === form.editingId);
      const suelto = validateEventForm({ ...form, editingId: undefined, repeatWeekly: false, date: form.soloDia }, activeProfileId);
      if (!suelto.ok) {
        sileo.error({ title: suelto.error });
        return;
      }
      if (!serie || !quitarDiaDeSerie(serie, form.soloDia) || !safeSaveEvent(suelto.event)) {
        reload();
        return;
      }
      sileo.success({ title: `Cambio guardado solo para el ${form.soloDia}` });
      resetForm(selectedDate);
      reload();
      return;
    }
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

  // Exporta lo que el filtro deja ver: el mismo .ics que Integraciones, sin salir de la Agenda.
  const handleExportIcs = () => {
    downloadFile(IcsService.exportToIcs(visible), `espiralia-agenda-${todayStr}.ics`, 'text/calendar;charset=utf-8');
    sileo.success({ title: `${eventCountLabel(visible.length)} ${visible.length === 1 ? 'exportado' : 'exportados'}` });
  };

  const handleGoToDate = (value: string) => {
    setGotoValue(value);
    if (!value || value < '1000') return;
    selectDay(value);
    calendarRef.current?.getApi().gotoDate(value);
  };

  return (
    <div className={styles.agendaContainer}>
      {/* 1. Header Ribbon Editorial Stitch */}
      <div className={styles.headerRibbon}>
        <div className={styles.ribbonLeft}>
          <div className={styles.overlineRow}>
            <Papel as="span" forma="pieza" tinte={TINTE_DE_MODULO.agenda} className={styles.weekTag}>
              Semana {isoWeekNumber(hoy)}
            </Papel>
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
            onClick={handleExportIcs}
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
        <Pliego as="div" className={styles.calendarCard}>
          {/* Barra de Herramientas del Almanaque */}
          <div className={styles.calendarToolbar}>
            <div className={styles.toolbarLeft}>
              <BookOpen size={18} className={styles.iconPrimary} aria-hidden="true" />
              <span className={styles.sheetTitle}>Almanaque de Mesa</span>
            </div>

            <div className={styles.toolbarLegend} role="group" aria-label="Colores por categoría">
              {CATEGORIES.map(c => (
                <span key={c} className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ backgroundColor: CATEGORY_COLORS[c].color }} aria-hidden="true" />
                  {FILTER_LABELS[c]}
                </span>
              ))}
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
            <div className={styles.syncStatus}>
              <span className={styles.syncText}>Exportable a .ics para Google Calendar y Apple Calendario (RFC 5545)</span>
            </div>
          </div>
        </Pliego>

        {/* ============================================================== */}
        {/* Columna Derecha: The Analog Physical Desk Artifacts (4 Cols)   */}
        {/* ============================================================== */}
        <aside className={styles.eventsPanel} aria-label="Día seleccionado">
          {/* 3.1 Post-It Motivacional: lleva el único clip de la pantalla */}
          <div className={styles.motivationalPostIt}>
            <div className={styles.goldenMetalClip} aria-hidden="true">
              <div className={styles.clipOuter} />
              <div className={styles.clipInner} />
            </div>
            <div className={styles.postItTop}>
              <Sun size={15} className={styles.postItSun} aria-hidden="true" />
              <span className={styles.postItTag}>NOTA DEL DÍA</span>
            </div>
            <p className={styles.postItQuote}>
              “Un día a la vez; la constancia vence a la prisa ♡”
            </p>
          </div>

          {/* 3.2 Resumen del día: papel pizarra, el tinte de la Agenda */}
          <Papel as="section" tinte={TINTE_DE_MODULO.agenda} aria-labelledby="agenda-day-title">
            <div className={styles.panelBody}>
            {/* Cabecera de la ficha */}
            <div className={styles.panelHeaderRow}>
              <h3 id="agenda-day-title" className={styles.panelTitle}>Eventos del {selectedDate}</h3>
              <Papel as="span" forma="pieza" tinte={TINTE_DE_MODULO.agenda} className={styles.priorityCountBadge}>
                {eventCountLabel(dayEvents.length)}
              </Papel>
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
                    {ev.recurrence && (
                      <button
                        type="button"
                        className={styles.iconBtn}
                        aria-label={`quitar ${ev.title} del ${selectedDate}`}
                        title="Quitar este día de la serie"
                        onClick={() => handleRemoveOccurrence(ev)}
                      >
                        <CalendarMinus size={16} aria-hidden="true" />
                      </button>
                    )}
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
            </div>
          </Papel>

          {/* 3.3 Formulario de Creación / Edición */}
          <EventFormPanel
            form={form}
            update={update}
            onSubmit={handleSubmit}
            onCancel={() => resetForm(selectedDate)}
            selectedDate={selectedDate}
          />

          {/* 3.4 Tracker de Energía y Ánimo (Energy & Mood Rhythm Tracker) */}
          <div className={styles.rhythmCard}>
            <div className={styles.rhythmHeader}>
              <div className={styles.rhythmTitleGroup}>
                <Moon size={16} className={styles.iconPrimary} aria-hidden="true" />
                <h4 className={styles.rhythmTitle}>Ritmo de energía y ánimo</h4>
              </div>
              <span className={styles.rhythmDateBadge}>
                {hoy.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' }).toUpperCase()}
              </span>
            </div>

            {/* Fases de Energía Vital */}
            <div className={styles.vitalEnergyBox}>
              <div className={styles.vitalHeaderRow}>
                <span className={styles.vitalLabel}>NIVEL DE ENERGÍA VITAL</span>
                <span className={styles.vitalStatus}>{energyLabel(energyLevel)}</span>
              </div>
              <div className={styles.energyButtonsGrid} role="group" aria-label="Nivel de energía">
                {ENERGY_LEVELS.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    className={`${styles.energyLevelBtn} ${energyLevel === value ? styles.energyLevelActive : ''}`}
                    onClick={() => handleSelectEnergy(value)}
                    title={`Nivel: ${label}`}
                    aria-pressed={energyLevel === value}
                  >
                    <Icon size={18} aria-hidden="true" />
                    <span className={styles.levelName}>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Disposición Emocional */}
            <div className={styles.moodBox}>
              <div className={styles.vitalHeaderRow}>
                <span className={styles.vitalLabel}>DISPOSICIÓN EMOCIONAL</span>
                <span className={styles.moodStatusText}>{dispositionLabel(disposition)}</span>
              </div>
              <div className={styles.moodButtonsGrid} role="group" aria-label="Disposición emocional">
                {DISPOSITIONS.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    className={`${styles.moodBtn} ${disposition === value ? styles.moodBtnActive : ''}`}
                    onClick={() => handleSelectDisposition(value)}
                    aria-pressed={disposition === value}
                  >
                    <Icon size={18} className={styles.moodEmoji} aria-hidden="true" />
                    <span className={styles.moodLabelText}>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
