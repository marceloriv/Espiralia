/** Mes sinódico medio, en días. */
const MES_SINODICO = 29.530588853;
/** Luna nueva de referencia: 2000-01-06 18:14 UTC. */
const LUNA_NUEVA_REFERENCIA = Date.UTC(2000, 0, 6, 18, 14);
const MS_POR_DIA = 86_400_000;

/** Los cinco dibujos de la tarjeta "Energía y fases" del Dashboard. */
export type IconoLunar = 'nueva' | 'creciente' | 'gibosa' | 'llena' | 'menguante';

const FASES: ReadonlyArray<{ nombre: string; icono: IconoLunar }> = [
  { nombre: 'Luna nueva', icono: 'nueva' },
  { nombre: 'Luna creciente', icono: 'creciente' },
  { nombre: 'Cuarto creciente', icono: 'creciente' },
  { nombre: 'Gibosa creciente', icono: 'gibosa' },
  { nombre: 'Luna llena', icono: 'llena' },
  { nombre: 'Gibosa menguante', icono: 'menguante' },
  { nombre: 'Cuarto menguante', icono: 'menguante' },
  { nombre: 'Luna menguante', icono: 'menguante' },
];

/**
 * Fase lunar de una fecha, en ocho fases centradas en la luna nueva, los cuartos y la llena.
 * ponytail: usa el mes sinódico medio y puede errar un día cerca del cambio de fase; si hace falta precisión, efemérides.
 */
export const moonPhase = (date: Date): { nombre: string; icono: IconoLunar } => {
  const dias = (date.getTime() - LUNA_NUEVA_REFERENCIA) / MS_POR_DIA;
  const fraccion = (((dias / MES_SINODICO) % 1) + 1) % 1;
  return FASES[Math.round(fraccion * 8) % 8];
};
