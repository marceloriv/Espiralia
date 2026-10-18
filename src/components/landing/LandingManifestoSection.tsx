import React from 'react';
import {
  Feather,
  ShieldCheck,
  Cpu,
  Lock,
  ArrowRight,
  Download,
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
                Soberanía Digital Certificada
              </h3>
            </div>
            <span className={styles.certBadge}>0% Telemetría • 100% Autónomo</span>
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
              <h4 className={styles.pillarTitle}>Bóveda Cifrada</h4>
              <p className={styles.pillarDesc}>
                Almacenamiento local aislado en IndexedDB con protección por PIN opcional. Tus reflexiones nunca abandonan tu máquina.
              </p>
            </div>

            <div className={styles.certPillar}>
              <div className={styles.pillarIcon} aria-hidden="true">
                <Share2 size={20} />
              </div>
              <h4 className={styles.pillarTitle}>Interoperabilidad Total</h4>
              <p className={styles.pillarDesc}>
                Exporta tus notas y cronogramas en Markdown estándar (.md) y calendarios abiertos (.ics). Sin ataduras propietarias.
              </p>
            </div>
          </div>

          {/* Pie de Certificado con Firma y Sello Notarial */}
          <div className={styles.certificateFooter}>
            <div className={styles.certSignatureGroup}>
              <span className={styles.certSignatureLabel}>Garantía Fundacional</span>
              <span className={styles.certSignatureScript}>«Cifrado en cliente • Sin nubes ajenas»</span>
            </div>
            <div className={styles.certSealTag} aria-hidden="true">
              <span>BÓVEDA SOBERANA</span>
              <span className={styles.certSealSerial}>EXP. 2026 / PRIVACIDAD ABSOLUTA</span>
            </div>
          </div>
        </article>

        {/* 3. Banner de Cierre */}
        <div className={styles.closingBanner}>
          <div className={styles.washiAccentTop} aria-hidden="true" />
          <h3 className={styles.closingTitle}>Tu Cuaderno te Espera</h3>
          <p className={styles.closingSubtitle}>
            Comienza hoy a registrar tus días con la calma de la papelería editorial y la solidez de una bóveda digital cifrada en tu disco.
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

            <button
              type="button"
              className={styles.secondaryOutlineBtn}
              onClick={() => {
                window.print();
              }}
            >
              <Download size={16} aria-hidden="true" />
              <span>Descargar Plantillas Imprimibles (PDF)</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
