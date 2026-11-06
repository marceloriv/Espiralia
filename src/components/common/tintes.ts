export type PapelTinte = 'arena' | 'pizarra' | 'salvia' | 'terracota' | 'ambar' | 'rosa' | 'turquesa';

/**
 * El color codifica el módulo (DESIGN.md §0.4): el mismo tinte significa lo mismo en toda la app.
 * Vive aparte de Papel.tsx para que ese archivo solo exporte componentes y Fast Refresh conserve su estado.
 */
export const TINTE_DE_MODULO = {
  dashboard: 'arena',
  agenda: 'pizarra',
  planner: 'salvia',
  todo: 'terracota',
  notas: 'ambar',
  carpetas: 'rosa',
  integraciones: 'turquesa',
} as const satisfies Record<string, PapelTinte>;
