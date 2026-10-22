import React from 'react';
import {
  Feather,
  ShieldCheck,
  Cpu,
  Lock,
  ArrowRight,
  Share2,
} from 'lucide-react';
import styles from './LandingManifestoSection.module.css';

export interface LandingManifestoSectionProps {
  onAction: () => void;
}

export const LandingManifestoSection: React.FC<LandingManifestoSectionProps> = ({
  onAction,
}) => {
  return (
    <section
      id="manifiesto"
      className={styles.nocturnoWrapper}
      aria-labelledby="manifiesto-heading"
    >
      <div className={styles.nocturnoContent}>
        {/* 1. Manifiesto Display Quote */}
        <div className={styles.manifestoCard}>
          <div className={styles.notarySeal} aria-hidden="true">
            §
          </div>
          <div className={styles.manifestoBadge}>
            <Feather size={14} aria-hidden="true" />
            <span id="manifiesto-heading">Manifiesto de Soberanía Personal</span>
          </div>

          <blockquote className={styles.manifestoQuote}>
            “Tu tiempo te pertenece: cada hora es el espacio donde decides qué construir.”
          </blockquote>

          <div className={styles.manifestoAuthor}>
            Cuaderno Espiralia • Principios Fundacionales & Serenidad Cotidiana
          </div>
        </div>

        {/* 2. Certificado de Soberanía Local-First */}
        <article
          className={styles.certificateCard}
          aria-labelledby="cert-title"
        >
          {/* Esquinas grabadas de orla estilo imprenta clásica */}
          <div className={`${styles.cornerOrnament} ${styles.cornerTopLeft}`} aria-hidden="true" />
          <div className={`${styles.cornerOrnament} ${styles.cornerTopRight}`} aria-hidden="true" />
          <div className={`${styles.cornerOrnament} ${styles.cornerBottomLeft}`} aria-hidden="true" />
          <div className={`${styles.cornerOrnament} ${styles.cornerBottomRight}`} aria-hidden="true" />

          <div className={styles.certificateHeader}>
            <div className={styles.certTitleGroup}>
              <ShieldCheck size={24} color="var(--color-accent-teal, #5db8a6)" aria-hidden="true" />
              <h3 id="cert-title" className={styles.certTitle}>
                Tus datos se quedan en tu navegador
              </h3>
            </div>
            <span className={styles.certBadge}>Sin servidor ni telemetría</span>
          </div>

          <div className={styles.certGrid}>
            <div className={styles.certPillar}>
              <div className={styles.pillarIcon} aria-hidden="true">
                <Cpu size={20} />
              </div>
              <h4 className={styles.pillarTitle}>100% Client-Side</h4>
              <p className={styles.pillarDesc}>
                Sin backend remoto ni servidores intermediarios. Todo el cómputo y renderizado se ejecutan en tu propio procesador.
              </p>
            </div>

            <div className={styles.certPillar}>
              <div className={styles.pillarIcon} aria-hidden="true">
                <Lock size={20} />
              </div>
              <h4 className={styles.pillarTitle}>Datos locales</h4>
              <p className={styles.pillarDesc}>
                Se guardan en el localStorage de tu navegador. El PIN opcional bloquea el perfil. El respaldo exportable se cifra con tu contraseña (PBKDF2 y AES-GCM).
              </p>
            </div>

            <div className={styles.certPillar}>
              <div className={styles.pillarIcon} aria-hidden="true">
                <Share2 size={20} />
              </div>
              <h4 className={styles.pillarTitle}>Agenda exportable</h4>
              <p className={styles.pillarDesc}>
                Exporta tu agenda a un archivo .ics, formato abierto (RFC 5545).
              </p>
            </div>
          </div>

        </article>

        {/* 3. Banner de Cierre */}
        <div className={styles.closingBanner}>
          <div className={styles.washiAccentTop} aria-hidden="true" />
          <h3 className={styles.closingTitle}>Tu Cuaderno te Espera</h3>
          <p className={styles.closingSubtitle}>
            Comienza hoy a registrar tus días con la calma de la papelería editorial y tus datos guardados en tu navegador.
          </p>

          <div className={styles.closingActions}>
            <button
              type="button"
              className={styles.primaryCtaBtn}
              onClick={onAction}
            >
              <span>Comenzar Cuaderno</span>
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
