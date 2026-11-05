import React from 'react';

/** Archivos de identidad en `public/` y su tamaño intrínseco (viewBox), para reservar el espacio antes de que carguen. */
const MARCA = {
  monograma: { archivo: '01-monograma-Es.svg', ancho: 435, alto: 410 },
  logotipo: { archivo: '02-logotipo-Espiralia.svg', ancho: 1320, alto: 315 },
  mascota: { archivo: '03-mascota-Nautilus.svg', ancho: 640, alto: 460 },
} as const;

export type MarcaVariante = keyof typeof MARCA;

interface MarcaProps {
  variante: MarcaVariante;
  /** Vacío (defecto) la declara decorativa: el nombre ya está en el texto vecino. Con texto, la anuncia. */
  alt?: string;
  className?: string;
}

/**
 * Identidad gráfica de Espiralia (monograma, logotipo, mascota Nautilus). Se sirve como archivo estático para no sumar
 * los SVG al bundle inicial (presupuesto de AGENTS.md §17.1); `BASE_URL` respeta el `base: './'` del despliegue.
 */
export const Marca: React.FC<MarcaProps> = ({ variante, alt = '', className }) => {
  const { archivo, ancho, alto } = MARCA[variante];
  return (
    <img
      src={`${import.meta.env.BASE_URL}${archivo}`}
      width={ancho}
      height={alto}
      alt={alt}
      aria-hidden={alt === '' ? true : undefined}
      className={className}
      decoding="async"
    />
  );
};
