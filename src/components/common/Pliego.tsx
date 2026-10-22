import React, { useId } from 'react';
import styles from './Pliego.module.css';

type PliegoTag = 'section' | 'div' | 'article';

interface PliegoProps extends React.HTMLAttributes<HTMLElement> {
  as?: PliegoTag;
}

interface RingsProps {
  side: 'left' | 'top';
  patternId: string;
}

/** Perforaciones y anillas de alambre repetidas cada 28px; el color sale del CSS (tokens), no del SVG. */
const Rings: React.FC<RingsProps> = ({ side, patternId }) => {
  const vertical = side === 'left';
  return (
    <svg className={vertical ? styles.ringsLeft : styles.ringsTop} aria-hidden="true" focusable="false">
      <defs>
        <pattern
          id={patternId}
          width={vertical ? 40 : 28}
          height={vertical ? 28 : 40}
          patternUnits="userSpaceOnUse"
        >
          {vertical ? (
            <>
              <circle className={styles.hole} cx="30" cy="14" r="4" />
              <rect className={styles.wire} x="5" y="10.5" width="27" height="7" rx="3.5" />
            </>
          ) : (
            <>
              <circle className={styles.hole} cx="14" cy="30" r="4" />
              <rect className={styles.wire} x="10.5" y="5" width="7" height="27" rx="3.5" />
            </>
          )}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
};

/**
 * Pliego encuadernado: la superficie firma de Espiralia (DESIGN.md §0.2).
 * Máximo uno por pantalla, el que contiene la tarea principal de la vista.
 */
export const Pliego: React.FC<PliegoProps> = ({ as: Tag = 'section', className, children, ...rest }) => {
  const uid = useId();
  return (
    <Tag className={`${styles.pliego} ${className ?? ''}`.trim()} {...rest}>
      <Rings side="left" patternId={`${uid}-izq`} />
      <Rings side="top" patternId={`${uid}-sup`} />
      {children}
    </Tag>
  );
};
