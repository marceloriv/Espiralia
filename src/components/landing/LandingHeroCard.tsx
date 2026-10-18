import React from 'react';
import styles from './LandingHeroCard.module.css';

export const LandingHeroCard: React.FC = () => {
  return (
    <div
      className={styles.heroVignetteContainer}
      data-interactive-stack="true"
      tabIndex={0}
      aria-label="Bodegón de papelería interactivo: Dossier, Biorritmo y Aforismo"
    >
      {/* 1. Capa Fondo: Carpeta Dossier Manila de Expediente Analógico */}
      <div className={styles.dossierFolder} aria-label="Expediente analógico Santuario">
        <div className={styles.dossierTab}>
          <span className={styles.dossierTabDot} aria-hidden="true" />
          <span className={styles.dossierTabLabel}>EXP. 2026 / SANTUARIO</span>
          <span className={styles.dossierTabSub}>• Bóveda Documental</span>
        </div>
        <div className={styles.dossierSeal} aria-hidden="true">
          ARCHIVADOR CONFIDENCIAL • 100% LOCAL
        </div>
      </div>

      {/* 2. Capa Intermedia: Pliego Rasgado de Biorritmo con Clip de Latón */}
      <div className={styles.tornPaperSlip} aria-label="Biorritmo Hoy">
        <div className={styles.paperClipBrass} aria-hidden="true" />
        <div className={styles.washiTapeSlate} aria-hidden="true" />

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

      {/* 3. Capa Superior: Nota Adhesiva Rotada con Clip y Washi Tape */}
      <aside className={styles.stickyNote} aria-label="Aforismo Matutino de Autor">
        <div className={styles.brassClip} aria-hidden="true" />
        <div className={styles.washiTapeMagenta} aria-hidden="true" />
        <div className={styles.noteHeader}>
          <span>Aforismo Matutino</span>
          <span className={styles.noteNumber}>№ 042</span>
        </div>
        <blockquote className={styles.quoteText}>
          «Cada página escrita con calma sostiene el día que viene.»
        </blockquote>
        <div className={styles.noteFooter}>
          <span>Tinta ferrogalorresistente</span>
          <time dateTime="08:30">08:30 AM · En calma</time>
        </div>
      </aside>
    </div>
  );
};
