import React from 'react';
import type { EventCategory } from '../../types';
import { MAX_TITLE_LENGTH } from './eventForm';
import type { EventFormState } from './eventForm';
import { CATEGORIES, FILTER_LABELS, WEEK_DAYS } from './eventMapping';
import styles from '../AgendaView.module.css';

interface EventFormPanelProps {
  form: EventFormState;
  update: (patch: Partial<EventFormState>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

/** Formulario para crear o editar un evento de Agenda. Separado de AgendaBoard, que solo orquesta estado y calendario. */
export const EventFormPanel: React.FC<EventFormPanelProps> = ({ form, update, onSubmit, onCancel }) => {
  const toggleDay = (day: number) =>
    update({
      daysOfWeek: form.daysOfWeek.includes(day) ? form.daysOfWeek.filter(d => d !== day) : [...form.daysOfWeek, day],
    });

  return (
    <form
      className={styles.panelCard}
      onSubmit={onSubmit}
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
          <button type="button" className={styles.btnSecondary} onClick={onCancel}>
            Cancelar edición
          </button>
        )}
      </div>
    </form>
  );
};
