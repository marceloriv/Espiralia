import React from 'react';
import { LayoutDashboard, Calendar, Compass, CheckSquare, LogOut } from 'lucide-react';
import { sileo } from 'sileo';
import type { Profile, ViewType } from '../types';
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

export const AppLayout: React.FC<AppLayoutProps> = ({
  profile,
  currentView,
  onViewChange,
  onLockProfile,
  children,
}) => {
  const currentDate = layoutDateFormatter.format(new Date());

  const handleLock = () => {
    sileo.info('Sesión cerrada');
    onLockProfile();
  };

  const navItems: { view: ViewType; label: string; icon: React.ReactNode }[] = [
    { view: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { view: 'agenda', label: 'Agenda', icon: <Calendar size={20} /> },
    { view: 'planner', label: 'Planner', icon: <Compass size={20} /> },
    { view: 'todo', label: 'To-Do', icon: <CheckSquare size={20} /> },
  ];

  return (
    <div className={styles.appContainer}>
      {/* Sidebar persistente */}
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <h1 className={styles.brandLogo}>Espiralia</h1>
        </div>

        <nav className={styles.navMenu}>
          {navItems.map(item => {
            const isActive = currentView === item.view;
            return (
              <button
                key={item.view}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                onClick={() => onViewChange(item.view)}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userCard}>
            <div className={styles.userAvatar}>{profile.avatar}</div>
            <div className={styles.userName}>{profile.name}</div>
          </div>
          <button className={styles.lockButton} onClick={handleLock}>
            <LogOut size={16} />
            <span>Cambiar perfil</span>
          </button>
        </div>
      </aside>

      {/* Área principal */}
      <div className={styles.mainWrapper}>
        <header className={styles.topHeader}>
          <h2 className={styles.headerTitle}>{currentView}</h2>
          <div className={styles.headerRight}>
            <span className={styles.headerDate}>{currentDate}</span>
            <button
              type="button"
              className={styles.mobileProfileBtn}
              onClick={handleLock}
              aria-label={`Cambiar perfil (${profile.name})`}
              title="Cambiar perfil"
            >
              <div className={styles.userAvatarSm}>{profile.avatar}</div>
              <LogOut size={16} />
            </button>
          </div>
        </header>

        <main className={styles.contentArea}>{children}</main>
      </div>
    </div>
  );
};
