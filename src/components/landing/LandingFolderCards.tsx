import React from 'react';
import { ListChecks, Feather, GraduationCap } from 'lucide-react';
import styles from './LandingFolderCards.module.css';

interface PillarFolder {
  id: string;
  num: string;
  tabLabel: string;
  tabPosition: 'left' | 'center' | 'right';
  title: string;
  desc: string;
  metricIcon: React.ReactNode;
  metricText: string;
  accentClass: string;
  decorType: 'clip' | 'washi-tape';
}

const PILLARS: PillarFolder[] = [
  {
    id: 'pilar-01',
    num: '01',
    tabLabel: '01 / ESTUDIOS',
    tabPosition: 'left',
    title: '1. Estudios & Foco Práctico',
    desc: 'Tareas, bloques de estudio y enlaces a tus recursos de preparación.',
    metricIcon: <ListChecks size={14} color="var(--color-primary)" aria-hidden="true" />,
    metricText: 'Tareas y bloques por área',
    accentClass: styles.accentSlate,
    decorType: 'clip',
  },
  {
    id: 'pilar-02',
    num: '02',
    tabLabel: '02 / DIARIO',
    tabPosition: 'center',
    title: '2. Introspección & Diario',
    desc: 'Escritura reflexiva, registro de estados emocionales y diario de sesiones sin límites ni juicios. Lo que escribes queda únicamente en tu disco.',
    metricIcon: <Feather size={14} color="var(--color-primary)" aria-hidden="true" />,
    metricText: 'Sin límites de caracteres • Privacidad total',
    accentClass: styles.accentSage,
    decorType: 'washi-tape',
  },
  {
    id: 'pilar-03',
    num: '03',
    tabLabel: '03 / HORIZONTE',
    tabPosition: 'right',
    title: '3. Horizonte & Universidad',
    desc: 'Planificación estratégica de postulaciones universitarias 2026, expediente documental, plazos innegociables y seguimiento de requisitos.',
    metricIcon: <GraduationCap size={14} color="var(--color-primary)" aria-hidden="true" />,
    metricText: 'Expediente de postulación y plazos',
    accentClass: styles.accentAmber,
    decorType: 'clip',
  },
];

export const LandingFolderCards: React.FC = () => {
  return (
    <ul className={styles.folderCardsGrid} aria-label="Tres pilares esenciales de enfoque">
      {PILLARS.map(pilar => {
        const tabPosClass =
          pilar.tabPosition === 'left'
            ? styles.tabLeft
            : pilar.tabPosition === 'center'
            ? styles.tabCenter
            : styles.tabRight;

        return (
          <li
            key={pilar.id}
            className={`${styles.folderCard} ${pilar.accentClass}`}
            aria-labelledby={`${pilar.id}-title`}
          >
            {/* Solapa Superior de Archivador */}
            <div className={`${styles.folderTab} ${tabPosClass}`}>
              <span className={styles.tabDot} aria-hidden="true" />
              <span className={styles.tabLabel}>{pilar.tabLabel}</span>
            </div>

            {/* Hoja interior de expediente que asoma sutilmente al interactuar */}
            <div className={styles.innerSheet} aria-hidden="true" />

            {/* Accesorio decorativo físico (Clip o Washi tape) */}
            {pilar.decorType === 'clip' ? (
              <div
                className={styles.goldClip}
                data-papercraft="clip"
                aria-hidden="true"
              />
            ) : (
              <div
                className={styles.washiTapeStrip}
                data-papercraft="washi-tape"
                aria-hidden="true"
              />
            )}

            {/* Número Monumental de Agua de Fondo */}
            <span
              className={styles.watermarkNumber}
              data-watermark={pilar.num}
              aria-hidden="true"
            >
              {pilar.num}
            </span>

            {/* Contenido Editorial */}
            <div className={styles.cardBody}>
              <div className={styles.cardHeader}>
                <span className={styles.moduleBadge}>Módulo {pilar.num}</span>
                <span className={styles.archivalTag}>EXP. 2026 // CLASIFICADO</span>
              </div>
              <h3 id={`${pilar.id}-title`} className={styles.cardTitle}>
                {pilar.title}
              </h3>
              <p className={styles.cardText}>{pilar.desc}</p>
            </div>

            {/* Recuadro de Métrica Ficha Técnica */}
            <div className={styles.metricBox}>
              {pilar.metricIcon}
              <span>{pilar.metricText}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
};
