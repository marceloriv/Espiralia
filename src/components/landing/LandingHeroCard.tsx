import React from 'react';
import styles from './LandingHeroCard.module.css';

export const LandingHeroCard: React.FC = () => {
  return (
    <div className={styles.heroVignetteContainer}>
      <aside className={styles.stickyNote} aria-label="Aforismo Matutino de Autor">
        <div className={styles.brassClip} aria-hidden="true" />
        <div className={styles.washiTapeMagenta} aria-hidden="true" />
        <div className={styles.noteHeader}>
          <span>Aforismo Matutino</span>
          <span className={styles.noteNumber}>№ 042</span>
        </div>
        <blockquote className={styles.quoteText}>
          «small steps every day lead to big results ♡»
        </blockquote>
        <div className={styles.noteFooter}>
          <span>Tinta ferrogalorresistente</span>
          <time dateTime="08:30">08:30 AM · En calma</time>
        </div>
      </aside>

      <div className={styles.indexCard} aria-label="Biorritmo Hoy">
        <div className={styles.indexCardHeader}>
          <span className={styles.indexCardTitle}>Biorritmo Hoy</span>
          <span className={styles.stampSeal}>En Foco</span>
        </div>
        <div className={styles.clarityRow}>
          <span>Claridad mental:</span>
          <span className={styles.clarityValue}>88%</span>
        </div>
        <div
          className={styles.progressBarBg}
          role="progressbar"
          aria-valuenow={88}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Claridad mental"
        >
          <div className={styles.progressBarFill} style={{ width: '88%' }} />
        </div>
        <p className={styles.indexCardDesc}>
          Fase ideal para escritura profunda y diseño de estructuras.
        </p>
      </div>
    </div>
  );
};
