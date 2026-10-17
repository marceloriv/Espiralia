import React from 'react';
import {
  Feather,
  ArrowRight,
  BookOpen,
  GraduationCap,
  Sparkles,
  Lock,
  Check,
} from 'lucide-react';
import { LandingDeskPreview } from './landing/LandingDeskPreview';
import { LandingIntentionWidget } from './landing/LandingIntentionWidget';
import { LandingHeroCard } from './landing/LandingHeroCard';
import { LandingRitmosSection } from './landing/LandingRitmosSection';
import { LandingManifestoSection } from './landing/LandingManifestoSection';
import styles from './LandingView.module.css';

export interface LandingViewProps {
  onNavigateLogin: () => void;
  onNavigateDashboard?: () => void;
  hasActiveProfile?: boolean;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onNavigateLogin,
  onNavigateDashboard,
  hasActiveProfile = false,
}) => {
  const handlePrimaryCta = () => {
    if (hasActiveProfile && onNavigateDashboard) {
      onNavigateDashboard();
    } else {
      onNavigateLogin();
    }
  };

  return (
    <div className={styles.landingWrapper}>
      {/* 1. Top App Bar */}
      <header className={styles.topBar}>
        <div className={styles.brandGroup}>
          <div className={styles.logoMonogram} aria-hidden="true">☲</div>
          <a href="#root" className={styles.logoTitle} aria-label="Espiralia Inicio">
            Espiralia
          </a>
          <span className={styles.editionBadge}>v2.4 Papelería</span>
        </div>

        <nav className={styles.navLinks} aria-label="Navegación editorial">
          <a href="#manifiesto" className={styles.navLink}>Manifiesto</a>
          <a href="#cuaderno" className={`${styles.navLink} ${styles.navLinkActive}`}>Cuaderno</a>
          <a href="#ritmos" className={styles.navLink}>Ritmos</a>
          <a href="#pilares" className={styles.navLink}>Metodología</a>
        </nav>

        <div className={styles.actionButtons}>
          <button
            type="button"
            className={styles.loginBtn}
            onClick={onNavigateLogin}
          >
            <Lock size={14} aria-hidden="true" />
            <span>Acceder</span>
          </button>
          <button
            type="button"
            className={styles.primaryCtaBtn}
            onClick={handlePrimaryCta}
          >
            <span>Comenzar Cuaderno</span>
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </header>

      <main>
        {/* 2. Hero Section */}
        <section className={styles.heroSection} aria-labelledby="hero-title">
          <div className={styles.heroGrid}>
            <div className={styles.heroContent}>
              <div className={styles.heroInsignia}>
                <span className={styles.heroInsigniaDot} aria-hidden="true" />
                <span>100% Client-Side • Sin Rastreo • Almacenamiento Local</span>
              </div>

              <h1 id="hero-title" className={styles.heroHeading}>
                El arte de organizar tu vida con{' '}
                <span className={styles.heroHeadingItalic}>serenidad cotidiana</span>.
              </h1>

              <p className={styles.heroSubtitle}>
                Un santuario táctil para tu atención. Diseñado con la nobleza de la papelería editorial japonesa y la soberanía de una bóveda local cifrada. Sin nubes ajenas, sin suscripciones, sin distracciones.
              </p>

              <div className={styles.heroActions}>
                <button
                  type="button"
                  className={styles.primaryCtaBtn}
                  onClick={handlePrimaryCta}
                >
                  <Feather size={16} aria-hidden="true" />
                  <span>Abrir Cuaderno Inmediato</span>
                </button>
                <a href="#cuaderno" className={styles.heroSecondaryLink}>
                  <span>Explorar Mesa de Trabajo</span>
                  <ArrowRight size={14} aria-hidden="true" />
                </a>
              </div>

              <div className={styles.heroMicroSpecs}>
                <div className={styles.microSpecItem}>
                  <Check size={13} color="var(--color-primary)" aria-hidden="true" />
                  <span>IndexedDB cifrado</span>
                </div>
                <div className={styles.microSpecItem}>
                  <Check size={13} color="var(--color-primary)" aria-hidden="true" />
                  <span>Exporta a .MD & .ICS</span>
                </div>
                <div className={styles.microSpecItem}>
                  <Check size={13} color="var(--color-primary)" aria-hidden="true" />
                  <span>Listo para imprenta A4/A5</span>
                </div>
              </div>
            </div>

            <LandingHeroCard onAction={handlePrimaryCta} />
          </div>
        </section>

        {/* 3. Mesa de Trabajo (Showcase Vivo) */}
        <div id="cuaderno" className={styles.anchorSection}>
          <LandingDeskPreview />
        </div>

        {/* 4. Tres Pilares de Enfoque */}
        <section id="pilares" className={`${styles.pilaresSection} ${styles.anchorSection}`} aria-labelledby="pilares-heading">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionBadge}>
              <BookOpen size={14} aria-hidden="true" />
              <span>Arquitectura de Vida</span>
            </div>
            <h2 id="pilares-heading" className={styles.sectionTitle}>
              Tres pilares de enfoque soberano
            </h2>
            <p className={styles.sectionSubtitle}>
              Estructurado como los tres cuadernos esenciales de una vida reflexiva y dirigida con propósito.
            </p>
          </div>

          <div className={styles.pilaresGrid}>
            <article className={styles.pilarCard} aria-labelledby="pilar-1-title">
              <div>
                <div className={styles.pilarHeader}>
                  <span className={styles.pilarBadge}>Módulo 01</span>
                </div>
                <h3 id="pilar-1-title" className={styles.pilarTitle}>1. Estudios & Foco Práctico</h3>
                <p className={styles.pilarText}>
                  Preparación intensiva para Licencia Clase B con banco de preguntas oficial CONASET, simuladores cronometrados y métricas de retención real.
                </p>
              </div>
              <div className={styles.pilarMetricBox}>
                <Sparkles size={14} color="var(--color-primary)" aria-hidden="true" />
                <span>92% de éxito en simulaciones</span>
              </div>
            </article>

            <article className={styles.pilarCard} aria-labelledby="pilar-2-title">
              <div>
                <div className={styles.pilarHeader}>
                  <span className={styles.pilarBadge}>Módulo 02</span>
                </div>
                <h3 id="pilar-2-title" className={styles.pilarTitle}>2. Introspección & Diario</h3>
                <p className={styles.pilarText}>
                  Escritura reflexiva, registro de estados emocionales y diario de sesiones sin límites ni juicios. Lo que escribes queda únicamente en tu disco.
                </p>
              </div>
              <div className={styles.pilarMetricBox}>
                <Feather size={14} color="var(--color-primary)" aria-hidden="true" />
                <span>Sin límites de caracteres • Privacidad total</span>
              </div>
            </article>

            <article className={styles.pilarCard} aria-labelledby="pilar-3-title">
              <div>
                <div className={styles.pilarHeader}>
                  <span className={styles.pilarBadge}>Módulo 03</span>
                </div>
                <h3 id="pilar-3-title" className={styles.pilarTitle}>3. Horizonte & Universidad</h3>
                <p className={styles.pilarText}>
                  Planificación estratégica de postulaciones universitarias 2026, expediente documental, plazos innegociables y seguimiento de requisitos.
                </p>
              </div>
              <div className={styles.pilarMetricBox}>
                <GraduationCap size={14} color="var(--color-primary)" aria-hidden="true" />
                <span>6 de 8 documentos verificados</span>
              </div>
            </article>
          </div>
        </section>

        {/* 5. Cadencia Vital & Ritmos */}
        <div id="ritmos" className={styles.anchorSection}>
          <LandingRitmosSection />
          <LandingIntentionWidget />
        </div>

        {/* 6. Pliego Nocturno: Manifiesto, Certificado Soberanía y Banner de Cierre */}
        <div id="manifiesto" className={styles.anchorSection}>
          <LandingManifestoSection onAction={handlePrimaryCta} />
        </div>
      </main>

      {/* Footer */}
      <footer className={styles.footer} role="contentinfo">
        <div className={styles.footerContent}>
          <div>
            <div className={styles.footerBrand}>Espiralia</div>
            <div className={styles.footerCopy}>
              © 2026 Espiralia. Santuario de orden personal y soberanía local.
            </div>
          </div>

          <div className={styles.footerLinks}>
            <a href="#cuaderno" className={styles.footerLink}>Cuaderno</a>
            <a href="#pilares" className={styles.footerLink}>Pilares</a>
            <a href="#manifiesto" className={styles.footerLink}>Manifiesto</a>
            <button
              type="button"
              className={styles.footerLink}
              style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}
              onClick={onNavigateLogin}
            >
              Acceder a Bóveda
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
