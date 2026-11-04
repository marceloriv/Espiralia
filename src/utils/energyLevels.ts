import { Cloud, Coffee, Sprout, Flame, Sun, Smile, Leaf, Meh, BatteryLow, type LucideIcon } from 'lucide-react';
import type { Disposition } from '../types';

export interface EnergyLevel {
  /** Valor que se guarda en `daily_energy`. Son los emoji de versiones anteriores: NO cambiar, hay datos guardados. */
  value: string;
  label: string;
  icon: LucideIcon;
}

export const ENERGY_LEVELS: ReadonlyArray<EnergyLevel> = [
  { value: '☁️', label: 'Baja', icon: Cloud },
  { value: '☕', label: 'Suave', icon: Coffee },
  { value: '🌱', label: 'Media', icon: Sprout },
  { value: '✨', label: 'Alta', icon: Flame },
  { value: '☀️', label: 'Plena', icon: Sun },
];

export const energyLabel = (value: string | undefined): string =>
  ENERGY_LEVELS.find(level => level.value === value)?.label ?? 'Sin registrar';

/** Ánimo del día: lo eligen el Dashboard y la Agenda y se guarda en `moods` (campo `disposition`). */
export const DISPOSITIONS: ReadonlyArray<{ value: Disposition; label: string; icon: LucideIcon }> = [
  { value: 'plena', label: 'Plena', icon: Smile },
  { value: 'calma', label: 'En calma', icon: Leaf },
  { value: 'neutra', label: 'Neutra', icon: Meh },
  { value: 'cansada', label: 'Cansada', icon: BatteryLow },
];

export const dispositionLabel = (value: Disposition | undefined): string =>
  DISPOSITIONS.find(d => d.value === value)?.label ?? 'Sin registrar';
