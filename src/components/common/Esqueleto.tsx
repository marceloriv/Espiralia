import React from 'react';
import styles from './Esqueleto.module.css';

interface EsqueletoProps {
  forma?: 'linea' | 'bloque' | 'circulo';
  /** Cualquier medida CSS (`60%`, `12rem`). Sin valor manda la medida de la forma. */
  ancho?: string;
  alto?: string;
}

/**
 * Pieza de un esqueleto de carga (DESIGN.md §7.6). Es decorativa (`aria-hidden`): quien la usa envuelve el conjunto en un
 * `role="status"` con un texto que diga qué carga, para que un lector de pantalla lo anuncie una sola vez.
 */
export const Esqueleto: React.FC<EsqueletoProps> = ({ forma = 'linea', ancho, alto }) => (
  <span aria-hidden="true" className={`${styles.esqueleto} ${styles[forma]}`} style={{ width: ancho, height: alto }} />
);
