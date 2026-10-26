import React from 'react';
import styles from './PaperOrnament.module.css';

export type PaperOrnamentVariant =
  | 'clip'
  | 'washi-terracotta'
  | 'washi-orchid'
  | 'washi-sage'
  | 'washi-slate'
  | 'wax-seal'
  | 'hanko-stamp'
  | 'brass-pin';

interface PaperOrnamentProps {
  variant: PaperOrnamentVariant;
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const PaperOrnament: React.FC<PaperOrnamentProps> = ({
  variant,
  label,
  className,
  style,
}) => {
  const variantClass = styles[variant] || '';
  const combinedClass = `${styles.ornament} ${variantClass} ${className || ''}`.trim();

  return (
    <span
      className={combinedClass}
      style={style}
      aria-hidden="true"
    >
      {variant === 'wax-seal' && (
        <span className={styles.sealRing}>
          <span className={styles.sealMonogram}>{label || 'Es'}</span>
        </span>
      )}
      {variant === 'hanko-stamp' && (
        <span className={styles.hankoText}>{label || '済'}</span>
      )}
    </span>
  );
};
