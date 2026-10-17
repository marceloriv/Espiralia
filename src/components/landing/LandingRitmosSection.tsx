import React from 'react';
import {
  Compass,
  Sunrise,
  Sun,
  Sunset,
  CheckCircle2,
} from 'lucide-react';
import styles from './LandingRitmosSection.module.css';

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
        {/* Momento 01 */}
        <article className={styles.ritmoCard} aria-labelledby="momento-1-title">
          <div>
            <div className={styles.cardHeader}>
              <span className={styles.timeTag}>01 • 07:30 - 09:00</span>
              <div className={styles.iconWrapper} aria-hidden="true">
                <Sunrise size={18} color="var(--color-primary)" />
              </div>
            </div>
            <h3 id="momento-1-title" className={styles.cardTitle}>
              Enfoque Profundo Sin Ruido
            </h3>
            <p className={styles.cardDesc}>
              Dedicado a tu tarea más exigente antes de que el mundo despierte. En este espacio se ataca el estudio riguroso de normas viales o la redacción compleja sin interrupciones.
            </p>
          </div>
          <div className={styles.cardMetric}>
            <CheckCircle2 size={13} color="var(--color-primary)" aria-hidden="true" />
            <span>1 sola prioridad crítica • Modo sin notificaciones</span>
          </div>
        </article>

        {/* Momento 02 */}
        <article className={styles.ritmoCard} aria-labelledby="momento-2-title">
          <div>
            <div className={styles.cardHeader}>
              <span className={styles.timeTag}>02 • 11:00 - 13:00</span>
              <div className={styles.iconWrapper} aria-hidden="true">
                <Sun size={18} color="var(--color-accent-amber, #e8a55a)" />
              </div>
            </div>
            <h3 id="momento-2-title" className={styles.cardTitle}>
              Avance Estratégico & Gestión
            </h3>
            <p className={styles.cardDesc}>
              Expedientes universitarios, revisión documental, llamadas y tareas operativas organizadas en bloques de 30 minutos con pausas conscientes.
            </p>
          </div>
          <div className={styles.cardMetric}>
            <CheckCircle2 size={13} color="var(--color-accent-amber, #e8a55a)" aria-hidden="true" />
            <span>Checklist visible • Cierre antes del mediodía</span>
          </div>
        </article>

        {/* Momento 03 */}
        <article className={styles.ritmoCard} aria-labelledby="momento-3-title">
          <div>
            <div className={styles.cardHeader}>
              <span className={styles.timeTag}>03 • 20:00 - 20:30</span>
              <div className={styles.iconWrapper} aria-hidden="true">
                <Sunset size={18} color="var(--color-accent-teal, #5db8a6)" />
              </div>
            </div>
            <h3 id="momento-3-title" className={styles.cardTitle}>
              Ritual de Vaciado & Gratitud
            </h3>
            <p className={styles.cardDesc}>
              Traspasar pendientes al pliego del día siguiente, registrar estados emocionales en el diario y cerrar la mesa de trabajo con calma mental.
            </p>
          </div>
          <div className={styles.cardMetric}>
            <CheckCircle2 size={13} color="var(--color-accent-teal, #5db8a6)" aria-hidden="true" />
            <span>Cero pantallas tras el cierre • Calma mental</span>
          </div>
        </article>
      </div>
    </section>
  );
};
