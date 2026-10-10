import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Clock, Trash2 } from 'lucide-react';
import { sileo } from 'sileo';
import type { AgendaEvent, EventCategory } from '../types';
import { StorageService } from '../services/storage';
import styles from './AgendaView.module.css';

interface AgendaViewProps {
  profileId: string;
}

const agendaMonthFormatter = new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric' });

export const AgendaView: React.FC<AgendaViewProps> = ({ profileId }) => {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [todayStr] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedDateStr, setSelectedDateStr] = useState(() => new Date().toISOString().split('T')[0]);
  const [events, setEvents] = useState<AgendaEvent[]>(() => StorageService.getEvents(profileId));
  const isFirstMount = useRef(true);

  // Form states
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [category, setCategory] = useState<EventCategory>('personal');

  const loadEvents = useCallback(() => {
    setEvents(StorageService.getEvents(profileId));
  }, [profileId]);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    loadEvents();
  }, [loadEvents]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthName = agendaMonthFormatter.format(currentDate);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleSelectDay = (day: number) => {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDateStr(dStr);
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newEvent: AgendaEvent = {
      id: `e-${Date.now()}`,
      profileId,
      title: title.trim(),
      date: selectedDateStr,
      startTime,
      category,
    };

    StorageService.saveEvent(newEvent);
    setTitle('');
    sileo.success({ title: 'Evento agendado con éxito' });
    loadEvents();
  };

  const handleDeleteEvent = (id: string) => {
    StorageService.deleteEvent(profileId, id);
    sileo.success({ title: 'Evento eliminado' });
    loadEvents();
  };

  const selectedDateEvents = events.filter(e => e.date === selectedDateStr);

  const weekdays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <div className={styles.agendaContainer}>
      <div className={styles.headingRow}>
        <h2 className={styles.pageTitle}>Agenda de eventos</h2>
      </div>

      <div className={styles.layoutGrid}>
        {/* Calendario */}
        <div className={styles.calendarCard}>
          <div className={styles.calendarNav}>
            <button type="button" className={styles.navBtn} onClick={handlePrevMonth} aria-label="mes anterior">
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <h3 className={styles.monthLabel}>{monthName}</h3>
            <button type="button" className={styles.navBtn} onClick={handleNextMonth} aria-label="mes siguiente">
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>

          <div className={styles.weekdaysGrid}>
            {weekdays.map(d => (
              <span key={d}>{d}</span>
            ))}
          </div>

          <div className={styles.daysGrid}>
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className={styles.dayEmpty} />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = dateStr === selectedDateStr;
              const isToday = dateStr === todayStr;
              const hasEvents = events.some(e => e.date === dateStr);

              return (
                <button
                  key={`day-${day}`}
                  type="button"
                  className={`${styles.dayCell} ${isSelected ? styles.daySelected : ''} ${isToday ? styles.dayToday : ''}`}
                  onClick={() => handleSelectDay(day)}
                  aria-label={`Día ${day}`}
                  aria-pressed={isSelected}
                >
                  <span>{day}</span>
                  {hasEvents && <div className={styles.hasEventDot} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Panel lateral: Crear y lista del día */}
        <div className={styles.eventsPanel}>
          <div className={styles.formCard}>
            <h4 className={styles.formTitle}>Nuevo evento para {selectedDateStr}</h4>
            <form onSubmit={handleAddEvent}>
              <div className={styles.formGroup}>
                <input
                  type="text"
                  className={styles.inputField}
                  placeholder="Título del evento"
                  aria-label="Título del evento"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <input
                  type="time"
                  className={styles.inputField}
                  aria-label="Hora de inicio"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <select
                  className={styles.selectField}
                  aria-label="Categoría del evento"
                  value={category}
                  onChange={e => setCategory(e.target.value as EventCategory)}
                >
                  <option value="personal">Personal</option>
                  <option value="trabajo">Trabajo</option>
                  <option value="urgente">Urgente</option>
                  <option value="estudio">Estudio</option>
                </select>
              </div>

              <button type="submit" className={styles.btnAddEvent}>
                Agregar evento
              </button>
            </form>
          </div>

          <div className={styles.eventsListCard}>
            <h4 className={styles.eventsListTitle}>Eventos del día</h4>
            {selectedDateEvents.length === 0 ? (
              <p className={styles.noEvents}>Sin eventos programados</p>
            ) : (
              <div className={styles.eventsList}>
                {selectedDateEvents.map(ev => (
                  <div key={ev.id} className={styles.eventItem}>
                    <div className={styles.eventInfo}>
                      <span className={styles.eventTitle}>{ev.title}</span>
                      <span className={styles.eventTime}>
                        <Clock size={12} aria-hidden="true" style={{ display: 'inline', marginRight: 4 }} />
                        {ev.startTime || 'Todo el día'} · {ev.category}
                      </span>
                    </div>
                    <button
                      type="button"
                      className={styles.btnDeleteEvent}
                      aria-label={`eliminar ${ev.title}`}
                      onClick={() => handleDeleteEvent(ev.id)}
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
