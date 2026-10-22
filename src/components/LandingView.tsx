import React from 'react';
import {
  Feather,
  Lock,
  Check,
} from 'lucide-react';
import { LandingDeskPreview } from './landing/LandingDeskPreview';
import { LandingIntentionWidget } from './landing/LandingIntentionWidget';
import { LandingHeroCard } from './landing/LandingHeroCard';
import { LandingFolderCards } from './landing/LandingFolderCards';
import { LandingRitmosSection } from './landing/LandingRitmosSection';
import { LandingManifestoSection } from './landing/LandingManifestoSection';
import styles from './LandingView.module.css';

export interface LandingViewProps {
  onNavigateLogin: () => void;
  onNavigateDashboard?: () => void;
  hasActiveProfile?: boolean;
}

// HashRouter usa el hash como ruta: un <a href="#id"> cambiaría la ruta y redirigiría. La navegación interna es por scroll.
const scrollToSection = (id: string): void => {
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  document.getElementById(id)?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
};

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
          <div className={styles.logoMonogram} aria-hidden="true">Es</div>
          <button
            type="button"
            className={styles.logoTitle}
            aria-label="Espiralia, volver arriba"
            onClick={() => window.scrollTo({ top: 0 })}
          >
            Espiralia
          </button>
        </div>

        <nav className={styles.navLinks} aria-label="Navegación editorial">
          <button type="button" className={styles.navLink} onClick={() => scrollToSection('manifiesto')}>Manifiesto</button>
          <button type="button" className={styles.navLink} onClick={() => scrollToSection('cuaderno')}>Cuaderno</button>
          <button type="button" className={styles.navLink} onClick={() => scrollToSection('ritmos')}>Ritmos</button>
          <button type="button" className={styles.navLink} onClick={() => scrollToSection('pilares')}>Metodología</button>
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
            <span>Crear mi cuaderno</span>
          </button>
        </div>
      </header>

      <main>
        {/* 2. Hero Section */}
        <section className={styles.heroSection} aria-labelledby="hero-title">
          <div className={styles.heroGrid}>
            <div className={styles.heroContent}>
              <h1 id="hero-title" className={styles.heroHeading}>
                Organiza tu semana en un cuaderno que{' '}
                <span className={styles.heroHeadingItalic}>guarda todo en tu navegador</span>.
              </h1>

              <p className={styles.heroSubtitle}>
                Agenda, planner, tareas y notas por perfil, con PIN opcional. Sin cuenta y sin servidor: todo se guarda en tu navegador.
              </p>

              <div className={styles.heroActions}>
                <button
                  type="button"
                  className={styles.primaryCtaBtn}
                  onClick={handlePrimaryCta}
                >
                  <Feather size={16} aria-hidden="true" />
                  <span>Crear mi cuaderno</span>
                </button>
                <button
                  type="button"
                  className={styles.heroSecondaryLink}
                  onClick={() => scrollToSection('cuaderno')}
                >
                  <span>Ver la mesa de trabajo</span>
                </button>
              </div>

              <div className={styles.heroMicroSpecs}>
                <div className={styles.microSpecItem}>
                  <Check size={13} color="var(--color-primary)" aria-hidden="true" />
                  <span>Datos en tu navegador</span>
                </div>
                <div className={styles.microSpecItem}>
                  <Check size={13} color="var(--color-primary)" aria-hidden="true" />
                  <span>Exporta la agenda a .ics</span>
                </div>
              </div>
            </div>

            <LandingHeroCard />
          </div>
        </section>

        {/* 3. Mesa de Trabajo (Showcase Vivo) */}
        <div id="cuaderno" className={styles.anchorSection}>
          <LandingDeskPreview />
        </div>

        {/* 4. Tres Pilares de Enfoque */}
        <section id="pilares" className={`${styles.pilaresSection} ${styles.anchorSection}`} aria-labelledby="pilares-heading">
          <div className={styles.sectionHeader}>
            <h2 id="pilares-heading" className={styles.sectionTitle}>
              Tres pilares de enfoque soberano
            </h2>
            <p className={styles.sectionSubtitle}>
              Estructurado como los tres cuadernos esenciales de una vida reflexiva y dirigida con propósito.
            </p>
          </div>

          <LandingFolderCards />
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
              © 2026 Espiralia. Agenda, planner y notas que se quedan en tu navegador.
            </div>
          </div>

          <div className={styles.footerLinks}>
            <button type="button" className={styles.footerLink} onClick={() => scrollToSection('cuaderno')}>Cuaderno</button>
            <button type="button" className={styles.footerLink} onClick={() => scrollToSection('pilares')}>Pilares</button>
            <button type="button" className={styles.footerLink} onClick={() => scrollToSection('manifiesto')}>Manifiesto</button>
            <button type="button" className={styles.footerLink} onClick={onNavigateLogin}>
              Acceder a Bóveda
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
