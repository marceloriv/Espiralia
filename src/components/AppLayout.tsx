import React, { useState } from 'react';
import { LayoutDashboard, Calendar, Compass, CheckSquare, Lock, LogOut } from 'lucide-react';
import { sileo } from 'sileo';
import type { Profile, ViewType } from '../types';
import { isPinProtected } from '../services/pinHash';
import styles from './AppLayout.module.css';

interface AppLayoutProps {
  profile: Profile;
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onLockProfile: () => void;
  children: React.ReactNode;
}

const layoutDateFormatter = new Intl.DateTimeFormat('es-CL', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const VIEW_TITLES: Record<ViewType, string> = {
  dashboard: 'Dashboard',
  agenda: 'Agenda',
  planner: 'Planner',
  todo: 'To-Do',
};

const NAV_ITEMS: { view: ViewType; label: string; icon: React.ReactNode }[] = [
  { view: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} aria-hidden="true" /> },
  { view: 'agenda', label: 'Agenda', icon: <Calendar size={20} aria-hidden="true" /> },
  { view: 'planner', label: 'Planner', icon: <Compass size={20} aria-hidden="true" /> },
  { view: 'todo', label: 'To-Do', icon: <CheckSquare size={20} aria-hidden="true" /> },
];

export const AppLayout: React.FC<AppLayoutProps> = ({
  profile,
  currentView,
  onViewChange,
  onLockProfile,
  children,
}) => {
  const [currentDate] = useState(() => layoutDateFormatter.format(new Date()));
  const isProtected = isPinProtected(profile);

  const handleLock = () => {
    sileo.info({ title: 'Sesión cerrada' });
    onLockProfile();
  };

  return (
    <div className={styles.appContainer}>
      {/* Enlace para saltar navegación (WCAG 2.4.1) */}
      <a href="#main-content" className={styles.skipLink}>
        Saltar al contenido principal
      </a>

      <aside className={styles.sidebar} aria-label="Barra lateral">
        <div className={styles.brand}>
          <h1 className={styles.brandLogo}>Espiralia</h1>
          <p className={styles.brandCaption}>Cuaderno personal</p>
        </div>

        <nav className={styles.navMenu} aria-label="Navegación principal">
          {NAV_ITEMS.map(item => {
            const isActive = currentView === item.view;
            return (
              <button
                type="button"
                key={item.view}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                onClick={() => onViewChange(item.view)}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.icon}
                <span className={styles.navLabel}>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userCard}>
            <div className={styles.userAvatar} aria-hidden="true">
              {profile.avatar}
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{profile.name}</span>
              <span className={styles.userMeta}>{isProtected ? 'Protegido por PIN' : 'Acceso libre'}</span>
            </div>
          </div>
        </div>
      </aside>

      <div className={styles.mainWrapper}>
        <header className={styles.topHeader}>
          <span className={styles.headerTitle}>{VIEW_TITLES[currentView]}</span>
          <div className={styles.headerRight}>
            <span className={styles.headerDate}>{currentDate}</span>
            <button type="button" className={styles.lockButton} onClick={handleLock}>
              {isProtected ? <Lock size={16} aria-hidden="true" /> : <LogOut size={16} aria-hidden="true" />}
              <span>{isProtected ? 'Bloquear perfil' : 'Cambiar perfil'}</span>
            </button>
          </div>
        </header>

        <main id="main-content" className={styles.contentArea} tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
};
