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
import { Pencil, Repeat, Trash2 } from 'lucide-react';
import { sileo } from 'sileo';
import type { AgendaEvent, EventCategory } from '../types';
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
  profileId: string;
}

const NARROW_QUERY = '(max-width: 767px)';
const WIDE_HEADER = { start: 'prev,next today', center: 'title', end: 'dayGridMonth,timeGridWeek,timeGridDay' };
const NARROW_HEADER = { start: 'prev,next', center: 'title', end: 'today' };
const NARROW_FOOTER = { center: 'dayGridMonth,timeGridWeek,timeGridDay' };

const eventCountLabel = (n: number) => `${n} ${n === 1 ? 'evento' : 'eventos'}`;

const timeLabel = (ev: AgendaEvent) =>
  ev.startTime ? `${ev.startTime}–${ev.endTime ?? defaultEndTime(ev.startTime)}` : 'Todo el día';

// La key fuerza un remontaje limpio al cambiar de perfil: sin estado ni calendario residual.
export const AgendaView: React.FC<AgendaViewProps> = ({ profileId }) => (
  <AgendaBoard key={profileId} profileId={profileId} />
);

const AgendaBoard: React.FC<AgendaViewProps> = ({ profileId }) => {
  const calendarRef = useRef<CalendarRef>(null);
  const [events, setEvents] = useState<AgendaEvent[]>(() => StorageService.getEvents(profileId));
  const [filter, setFilter] = useState<CategoryFilter>('todas');
  const [selectedDate, setSelectedDate] = useState(() => toLocalDateStr(new Date()));
  // Valor crudo de "Ir a fecha": Chrome emite fechas parciales ('0002-…') mientras se tipea el año.
  const [gotoValue, setGotoValue] = useState(selectedDate);
  const [form, setForm] = useState<EventFormState>(() => emptyEventForm(toLocalDateStr(new Date())));
  // ponytail: se evalúa al montar; si se rota el dispositivo, la barra se ajusta al recargar la vista.
  const [isNarrow] = useState(() => window.matchMedia(NARROW_QUERY).matches);

  const reload = () => setEvents(StorageService.getEvents(profileId));
  const update = (patch: Partial<EventFormState>) => setForm(f => ({ ...f, ...patch }));

  const visible = filter === 'todas' ? events : events.filter(ev => categoryOf(ev) === filter);
  const counts = countByCategory(events);
  const dayEvents = visible
    .filter(ev => occursOn(ev, selectedDate))
    .sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? ''));

  const resetForm = (date: string) => setForm(emptyEventForm(date));

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
    const result = validateEventForm(form, profileId);
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
    if (!safeDeleteEvent(profileId, ev.id)) return;
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
      <div className={styles.headingRow}>
        <h2 className={styles.pageTitle}>Agenda de eventos</h2>
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
      </div>

      <div className={styles.layoutGrid}>
        <div className={styles.calendarCard}>
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
        </div>

        <aside className={styles.eventsPanel} aria-label="Día seleccionado">
          <div className={styles.panelCard}>
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
            <h3 className={styles.panelTitle}>Eventos del {selectedDate}</h3>
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
                          <span>
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
          </div>

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
        </aside>
      </div>
    </div>
  );
};
