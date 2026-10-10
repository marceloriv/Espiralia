import { describe, it, expect, beforeEach, vi } from 'vitest';
import { sileo } from 'sileo';
import { StorageService } from '../services/storage';
import {
  CROSS_DAY_ERROR,
  SAVE_ERROR,
  commitTimeChange,
  safeDeleteEvent,
  safeSaveEvent,
} from '../components/agenda/eventPersistence';
import type { AgendaEvent } from '../types';

const ev: AgendaEvent = {
  id: 'e1',
  profileId: 'p-1',
  title: 'Clase',
  date: '2026-10-14',
  startTime: '09:00',
  endTime: '10:00',
  category: 'estudio',
};

const quotaError = () => {
  throw new DOMException('lleno', 'QuotaExceededError');
};

// Técnica: tabla de decisión (cambio válido / cruza de día / almacenamiento falla).
describe('eventPersistence', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('guarda un movimiento dentro del mismo día', () => {
    StorageService.saveEvent(ev);
    const revert = vi.fn();
    const success = vi.spyOn(sileo, 'success');

    const ok = commitTimeChange(ev, {
      start: new Date(2026, 9, 15, 11, 0),
      end: new Date(2026, 9, 15, 12, 30),
      allDay: false,
      revert,
    });

    expect(ok).toBe(true);
    expect(revert).not.toHaveBeenCalled();
    expect(StorageService.getEvents('p-1')[0]).toMatchObject({ date: '2026-10-15', startTime: '11:00', endTime: '12:30' });
    expect(success).toHaveBeenCalledWith({ title: 'Evento reprogramado' });
  });

  it('revierte y avisa si el cambio cruza medianoche, sin tocar el almacenamiento', () => {
    StorageService.saveEvent(ev);
    const revert = vi.fn();
    const error = vi.spyOn(sileo, 'error');

    const ok = commitTimeChange(ev, {
      start: new Date(2026, 9, 15, 23, 30),
      end: new Date(2026, 9, 16, 0, 30),
      allDay: false,
      revert,
    });

    expect(ok).toBe(false);
    expect(revert).toHaveBeenCalledOnce();
    expect(error).toHaveBeenCalledWith({ title: CROSS_DAY_ERROR });
    expect(StorageService.getEvents('p-1')[0]).toEqual(ev);
  });

  it('revierte y avisa si el almacenamiento lanza QuotaExceededError', () => {
    vi.spyOn(StorageService, 'saveEvent').mockImplementation(quotaError);
    const revert = vi.fn();
    const error = vi.spyOn(sileo, 'error');

    const ok = commitTimeChange(ev, {
      start: new Date(2026, 9, 15, 11, 0),
      end: new Date(2026, 9, 15, 12, 0),
      allDay: false,
      revert,
    });

    expect(ok).toBe(false);
    expect(revert).toHaveBeenCalledOnce();
    expect(error).toHaveBeenCalledWith({ title: SAVE_ERROR });
  });

  it('safeSaveEvent devuelve false y avisa sin lanzar', () => {
    vi.spyOn(StorageService, 'saveEvent').mockImplementation(quotaError);
    const error = vi.spyOn(sileo, 'error');
    expect(safeSaveEvent(ev)).toBe(false);
    expect(error).toHaveBeenCalledWith({ title: SAVE_ERROR });
  });

  it('safeDeleteEvent borra y devuelve true', () => {
    StorageService.saveEvent(ev);
    expect(safeDeleteEvent('p-1', 'e1')).toBe(true);
    expect(StorageService.getEvents('p-1')).toEqual([]);
  });

  it('safeDeleteEvent devuelve false y avisa sin lanzar', () => {
    vi.spyOn(StorageService, 'deleteEvent').mockImplementation(quotaError);
    const error = vi.spyOn(sileo, 'error');
    expect(safeDeleteEvent('p-1', 'e1')).toBe(false);
    expect(error).toHaveBeenCalledWith({ title: SAVE_ERROR });
  });
});
