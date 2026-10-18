import React from 'react';
import {
  Compass,
  Sunrise,
  Sun,
  Sunset,
  CheckCircle2,
} from 'lucide-react';
import styles from './LandingRitmosSection.module.css';

interface RitmoMomento {
  id: string;
  num: string;
  horario: string;
  titulo: string;
  desc: string;
  metrica: string;
  icon: React.ReactNode;
  washiClass: string;
  ticketClass: string;
}

const MOMENTOS: RitmoMomento[] = [
  {
    id: 'momento-1',
    num: '01',
    horario: '01 • 07:30 - 09:00',
    titulo: 'Enfoque Profundo Sin Ruido',
    desc: 'Dedicado a tu tarea más exigente antes de que el mundo despierte. En este espacio se ataca el estudio riguroso de normas viales o la redacción compleja sin interrupciones.',
    metrica: '1 sola prioridad crítica • Modo sin notificaciones',
    icon: <Sunrise size={18} color="var(--color-primary)" aria-hidden="true" />,
    washiClass: styles.washiMagenta,
    ticketClass: styles.ticketTiltLeft,
  },
  {
    id: 'momento-2',
    num: '02',
    horario: '02 • 11:00 - 13:00',
    titulo: 'Avance Estratégico & Gestión',
    desc: 'Expedientes universitarios, revisión documental, llamadas y tareas operativas organizadas en bloques de 30 minutos con pausas conscientes.',
    metrica: 'Checklist visible • Cierre antes del mediodía',
    icon: <Sun size={18} color="var(--color-accent-amber, #e8a55a)" aria-hidden="true" />,
    washiClass: styles.washiAmber,
    ticketClass: styles.ticketTiltStraight,
  },
  {
    id: 'momento-3',
    num: '03',
    horario: '03 • 20:00 - 20:30',
    titulo: 'Ritual de Vaciado & Gratitud',
    desc: 'Traspasar pendientes al pliego del día siguiente, registrar estados emocionales en el diario y cerrar la mesa de trabajo con calma mental.',
    metrica: 'Cero pantallas tras el cierre • Calma mental',
    icon: <Sunset size={18} color="var(--color-accent-teal, #5db8a6)" aria-hidden="true" />,
    washiClass: styles.washiTeal,
    ticketClass: styles.ticketTiltRight,
  },
];

export const LandingRitmosSection: React.FC = () => {
  return (
    <section className={styles.ritmosSection} aria-labelledby="ritmos-heading">
      <div className={styles.sectionHeader}>
        <div className={styles.sectionBadge}>
          <Compass size={14} aria-hidden="true" />
          <span>Cadencia Vital</span>
        </div>
        <h2 id="ritmos-heading" className={styles.sectionTitle}>
          Una Cadencia Vital que Respeta tus Límites
        </h2>
        <p className={styles.sectionSubtitle}>
          No más listas infinitas ni sobrecarga cognitiva. Estructura tu jornada en tres momentos cardinales inspirados en la sobriedad del cuaderno clásico.
        </p>
      </div>

      <div className={styles.ritmosGrid}>
        {MOMENTOS.map(momento => (
          <article
            key={momento.id}
            className={`${styles.ritmoTicket} ${momento.ticketClass}`}
            data-papercraft="ticket-stub"
            aria-labelledby={`${momento.id}-title`}
          >
            {/* Cinta washi tape decorativa en la cabecera */}
            <div
              className={`${styles.ticketWashiTape} ${momento.washiClass}`}
              data-papercraft="washi-tape"
              aria-hidden="true"
            />

            <div>
              <div className={styles.cardHeader}>
                <span className={styles.timeTag}>{momento.horario}</span>
                <div className={styles.iconWrapper}>
                  {momento.icon}
                </div>
              </div>
              <h3 id={`${momento.id}-title`} className={styles.cardTitle}>
                {momento.titulo}
              </h3>
              <p className={styles.cardDesc}>{momento.desc}</p>
              <div className={styles.ticketSerial} aria-hidden="true">
                SERIE {momento.num} • REGISTRO DIARIO
              </div>
            </div>

            {/* Divisor perforado con muescas laterales */}
            <div className={styles.perforatedLine} aria-hidden="true" />

            <div className={styles.cardMetric}>
              <CheckCircle2 size={13} color="var(--color-primary)" aria-hidden="true" />
              <span>{momento.metrica}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
