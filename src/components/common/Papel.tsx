import React from 'react';
import styles from './Papel.module.css';

export type PapelTinte = 'arena' | 'pizarra' | 'salvia' | 'terracota' | 'ambar' | 'rosa' | 'turquesa';
type PapelTag = 'div' | 'section' | 'article' | 'aside' | 'span';

/** El color codifica el módulo (DESIGN.md §0.4): el mismo tinte significa lo mismo en toda la app. */
export const TINTE_DE_MODULO = {
  dashboard: 'arena',
  agenda: 'pizarra',
  planner: 'salvia',
  todo: 'terracota',
  notas: 'ambar',
  carpetas: 'rosa',
  integraciones: 'turquesa',
} as const satisfies Record<string, PapelTinte>;

interface PapelProps extends React.HTMLAttributes<HTMLElement> {
  as?: PapelTag;
  tinte?: PapelTinte;
  /** `tarjeta`: superficie de lectura con cuadrícula bujo. `pieza`: etiqueta, pestaña u hoja pequeña. */
  forma?: 'tarjeta' | 'pieza';
}

/**
 * Papel rasgado de lectura (DESIGN.md §0.3). El contenedor exterior lleva la sombra, el giro, la clase y los atributos;
 * el interior lleva el recorte irregular, el tinte y el contenido. Presupuesto por vista: 4 tarjetas y 3 piezas.
 */
export const Papel: React.FC<PapelProps> = ({
  as: Tag = 'div',
  tinte = 'arena',
  forma = 'tarjeta',
  className,
  children,
  ...rest
}) => {
  const Inner = Tag === 'span' ? 'span' : 'div';
  return (
    <Tag className={`${styles.sombra} ${className ?? ''}`.trim()} data-forma={forma} {...rest}>
      <Inner className={styles.papel} data-forma={forma} data-tinte={tinte}>
        {children}
      </Inner>
    </Tag>
  );
};
