import React, { useState } from 'react';
import { Sparkles, Target, Compass, Heart } from 'lucide-react';
import styles from './LandingIntentionWidget.module.css';

export type IntentionType = 'calma' | 'foco' | 'claridad' | 'gratitud';

interface IntentionStep {
  num: string;
  title: string;
  desc: string;
}

interface IntentionData {
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  quote: string;
  author: string;
  steps: IntentionStep[];
}

const INTENTIONS: Record<IntentionType, IntentionData> = {
  calma: {
    label: 'Calma mental',
    icon: Sparkles,
    quote: '“No tienes que resolver toda tu vida hoy. Solo necesitas habitar con serenidad este instante presente y dar el siguiente paso honesto.”',
    author: 'Cuaderno de Calma • Espiralia',
    steps: [
      { num: '01. Pausa', title: '01. Pausa', desc: 'Detén todo dos minutos y respira conscientemente.' },
      { num: '02. Descarga', title: '02. Descarga', desc: 'Apunta en tu cuaderno lo que pesa en tu cabeza sin juzgarlo.' },
      { num: '03. Un solo paso', title: '03. Un solo paso', desc: 'Elige una única acción pequeña que te devuelva la tranquilidad.' },
    ],
  },
  foco: {
    label: 'Enfoque profundo',
    icon: Target,
    quote: '“La concentración profunda es el acto de amor más grande hacia tus proyectos. Cierra el ruido del mundo para escuchar tu maestría.”',
    author: 'Bloque de Enfoque • Espiralia',
    steps: [
      { num: '01. Mesa limpia', title: '01. Mesa limpia', desc: 'Elimina toda pestaña, notificación y objeto fuera de tu tarea.' },
      { num: '02. Bloque continuo', title: '02. Bloque continuo', desc: 'Protege 50 minutos ininterrumpidos en tu planner.' },
      { num: '03. Cierre nítido', title: '03. Cierre nítido', desc: 'Verifica el avance y deja la mesa lista para mañana.' },
    ],
  },
  claridad: {
    label: 'Claridad de metas',
    icon: Compass,
    quote: '“Cuando el horizonte es nítido, hasta el camino más escarpado se transita con ligereza y dirección firme.”',
    author: 'Estrategia Cotidiana • Espiralia',
    steps: [
      { num: '01. Destino claro', title: '01. Destino claro', desc: 'Define qué significa victoria al final de esta jornada.' },
      { num: '02. Filtro radical', title: '02. Filtro radical', desc: 'Distingue lo urgente de lo verdaderamente trascendente.' },
      { num: '03. Tres prioridades', title: '03. Tres prioridades', desc: 'Establece tus tres hitos innegociables.' },
    ],
  },
  gratitud: {
    label: 'Gratitud & Reflexión',
    icon: Heart,
    quote: '“El progreso reside en valorar lo que ya sostienes mientras das el siguiente paso con calma.”',
    author: 'Pausa Contemplativa • Espiralia',
    steps: [
      { num: '01. Reconocimiento', title: '01. Reconocimiento', desc: 'Agradece un logro o aprendizaje reciente.' },
      { num: '02. Observación', title: '02. Observación', desc: 'Escribe cómo te sientes en el diario sin prisas.' },
      { num: '03. Soltar carga', title: '03. Soltar carga', desc: 'Perdona los pendientes y reconoce tu esfuerzo honesto.' },
    ],
  },
};

export const LandingIntentionWidget: React.FC = () => {
  const [activeKey, setActiveKey] = useState<IntentionType>('calma');
  const activeIntention = INTENTIONS[activeKey];

  return (
    <section className={styles.widgetContainer} aria-labelledby="intention-heading">
      <div className={styles.widgetHeader}>
        <h2 id="intention-heading" className={styles.title}>
          Elige tu intención para hoy
        </h2>
        <p className={styles.subtitle}>
          Alinea tu energía antes de abrir tus tareas. Un cuaderno se abre con propósito, no con prisa.
        </p>
      </div>

      <div className={styles.buttonsGrid} role="group" aria-label="Selector de intenciones">
        {(Object.keys(INTENTIONS) as IntentionType[]).map((key) => {
          const item = INTENTIONS[key];
          const isSelected = activeKey === key;
          const IconComponent = item.icon;

          return (
            <button
              key={key}
              type="button"
              className={`${styles.intentionBtn} ${isSelected ? styles.intentionBtnActive : ''}`}
              aria-pressed={isSelected}
              onClick={() => setActiveKey(key)}
            >
              <IconComponent size={16} aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <div
        className={styles.activePanel}
        role="region"
        aria-label="Panel de intención activa"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className={styles.quoteWrapper}>
          <blockquote className={styles.quoteText}>{activeIntention.quote}</blockquote>
          <span className={styles.quoteAuthor}>{activeIntention.author}</span>
        </div>

        <div className={styles.stepsGrid}>
          {activeIntention.steps.map((step) => (
            <div key={step.num} className={styles.stepCard}>
              <div className={styles.stepTitle}>{step.title}</div>
              <p className={styles.stepDesc}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
