import { sileo } from 'sileo';
import { StorageService } from '../../services/storage';
import type { AgendaEvent } from '../../types';
import { applyTimeChange } from './eventMapping';

export const CROSS_DAY_ERROR = 'Los eventos deben empezar y terminar el mismo día';
export const SAVE_ERROR = 'No se pudo guardar: el almacenamiento del navegador está lleno o no disponible';

export interface TimeChange {
  start: Date | null;
  end: Date | null;
  allDay: boolean;
  revert: () => void;
}

/** Guarda sin propagar excepciones (QuotaExceededError incluido); la vista nunca queda en blanco. */
export const safeSaveEvent = (ev: AgendaEvent): boolean => {
  try {
    StorageService.saveEvent(ev);
    return true;
  } catch {
    sileo.error({ title: SAVE_ERROR });
    return false;
  }
};

export const safeDeleteEvent = (profileId: string, id: string): boolean => {
  try {
    StorageService.deleteEvent(profileId, id);
    return true;
  } catch {
    sileo.error({ title: SAVE_ERROR });
    return false;
  }
};

/** Persiste un arrastre o redimensionado; revierte el calendario si no es válido o si falla el guardado. */
export const commitTimeChange = (ev: AgendaEvent, change: TimeChange): boolean => {
  const updated = applyTimeChange(ev, change.start, change.end, change.allDay);
  if (!updated) {
    change.revert();
    sileo.error({ title: CROSS_DAY_ERROR });
    return false;
  }
  if (!safeSaveEvent(updated)) {
    change.revert();
    return false;
  }
  sileo.success({ title: 'Evento reprogramado' });
  return true;
};
