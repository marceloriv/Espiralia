import React from 'react';
import { BookOpen, Feather } from 'lucide-react';
import type { BujoBlock } from '../../utils/bujoFormatter';
import { occurrenceKeys } from '../../utils/occurrenceKeys';
import styles from '../NotesView.module.css';

interface PliegoMetaProps {
  /** Título de la nota abierta, o null si el pliego muestra el texto de un tomo vacío. */
  noteTitle: string | null;
  wordCount: number;
}

/** Datos de la nota abierta junto a la fecha del pliego: insignia, título y palabras (estas dos solo con nota). */
export const PliegoMeta: React.FC<PliegoMetaProps> = ({ noteTitle, wordCount }) => (
  <div className={styles.metaDetailsGroup}>
    {noteTitle !== null && <span className={styles.activePliegoBadge}>Pliego Activo de Trabajo</span>}
    <span className={styles.metaItem}>
      <Feather size={14} className={styles.iconTeal} aria-hidden="true" />
      <span>{noteTitle ?? 'Nueva nota'}</span>
    </span>
    {noteTitle !== null && (
      <span className={styles.metaItem}>
        <BookOpen size={14} className={styles.iconPrimary} aria-hidden="true" />
        <span>{`${wordCount} palabras`}</span>
      </span>
    )}
  </div>
);

/** Lectura del pliego: cada bloque bujo (sección, caja o párrafo) con su marcado. */
export const BujoBlocksView: React.FC<{ blocks: BujoBlock[] }> = ({ blocks }) => (
  <div className={styles.bujoTextContent}>
    {occurrenceKeys(blocks.map((b) => JSON.stringify(b))).map((blockKey, idx) => {
      const block = blocks[idx];
      if (block.type === 'heading') {
        return (
          <div key={blockKey} className={styles.journalSection}>
            <h3 className={styles.sectionHeading}>
              <span className={styles.sectionSymbol}>{block.symbol}</span>
              <span>{block.title}</span>
            </h3>
          </div>
        );
      }
      if (block.type === 'callout') {
        return (
          <div key={blockKey} className={styles.conasetEmbeddedBox}>
            <div className={styles.conasetHeader}>
              <span className={styles.conasetTitle}>
                {block.icon && <span className={styles.conasetIcon}>{block.icon}</span>}
                {block.title}
              </span>
              {block.badge && <span className={styles.conasetBadge}>{block.badge}</span>}
            </div>
            {block.text && <p className={styles.conasetText}>{block.text}</p>}
          </div>
        );
      }
      return (
        <p key={blockKey} className={styles.journalParagraph}>
          {block.text}
        </p>
      );
    })}
  </div>
);
