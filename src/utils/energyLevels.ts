import { Cloud, Coffee, Sprout, Flame, Sun, type LucideIcon } from 'lucide-react';

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

export const DEFAULT_ENERGY_VALUE = '✨';

export const energyLabel = (value: string | undefined): string =>
  ENERGY_LEVELS.find(level => level.value === value)?.label ?? 'Sin registrar';
