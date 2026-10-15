import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Calendar, Compass, CheckSquare, Lock, LogOut, Plus, Settings, BookOpen, Folder } from 'lucide-react';
import { sileo } from 'sileo';
import type { Profile, ViewType } from '../types';
import { isPinProtected } from '../services/pinHash';
import { StorageService } from '../services/storage';
import { QuickActionModal } from './quickAction/QuickActionModal';
import { ProfileSettingsModal } from './profile/ProfileSettingsModal';
import { NoteModal } from './notes/NoteModal';
import styles from './AppLayout.module.css';

interface AppLayoutProps {
  profile: Profile;
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onLockProfile: () => void;
  onProfileUpdated?: (updatedProfile: Profile) => void;
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
  notes: 'Notas',
  folders: 'Carpetas',
};

const NAV_ITEMS: { view: ViewType; label: string; icon: React.ReactNode }[] = [
  { view: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} aria-hidden="true" /> },
  { view: 'agenda', label: 'Agenda', icon: <Calendar size={20} aria-hidden="true" /> },
  { view: 'planner', label: 'Planner', icon: <Compass size={20} aria-hidden="true" /> },
  { view: 'todo', label: 'To-Do', icon: <CheckSquare size={20} aria-hidden="true" /> },
  { view: 'notes', label: 'Notas', icon: <BookOpen size={20} aria-hidden="true" /> },
  { view: 'folders', label: 'Carpetas', icon: <Folder size={20} aria-hidden="true" /> },
];

export const AppLayout: React.FC<AppLayoutProps> = ({
  profile,
  currentView,
  onViewChange,
  onLockProfile,
  onProfileUpdated,
  children,
}) => {
  const [currentDate] = useState(() => layoutDateFormatter.format(new Date()));
  const [currentProfile, setCurrentProfile] = useState<Profile>(profile);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNewNoteOpen, setIsNewNoteOpen] = useState(false);

  useEffect(() => {
    setCurrentProfile(profile);
  }, [profile]);

  const isProtected = isPinProtected(currentProfile);
  const lockText = isProtected ? 'Bloquear perfil' : 'Cambiar perfil';

  const handleLock = () => {
    sileo.info({ title: 'Sesión cerrada' });
    onLockProfile();
  };

  const handleSaveNewNote = (noteData: {
    title: string;
    content: string;
    isReflection: boolean;
    folderId?: string;
    tags: string[];
  }) => {
    const now = new Date().toISOString();
    const newNote = {
      id: `note-${Date.now()}`,
      profileId: currentProfile.id,
      ...noteData,
      createdAt: now,
      updatedAt: now,
    };
    StorageService.saveNote(newNote);
    try {
      sileo.success({ title: 'Nota creada', description: 'La nota se guardó correctamente.' });
    } catch {
      // Ignorar
    }
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

        <div className={styles.quickActionWrapper}>
          <button
            type="button"
            className={styles.quickActionButton}
            onClick={() => setIsQuickActionOpen(true)}
          >
            <Plus size={18} aria-hidden="true" />
            <span>+ Acción Rápida</span>
          </button>
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
          <div className={styles.sidebarFooterActions}>
            <button
              type="button"
              className={styles.settingsButton}
              onClick={() => setIsSettingsOpen(true)}
            >
              <Settings size={16} aria-hidden="true" />
              <span>Ajustes & PIN</span>
            </button>
          </div>

          <div className={styles.userCard}>
            <div className={styles.userAvatar} aria-hidden="true">
              {currentProfile.avatar}
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{currentProfile.name}</span>
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
            <button
              type="button"
              className={styles.newNoteButton}
              onClick={() => setIsNewNoteOpen(true)}
              aria-label="+ Nueva Nota"
            >
              <Plus size={16} aria-hidden="true" />
              <span>+ Nueva Nota</span>
            </button>
            <button
              type="button"
              className={styles.lockButton}
              onClick={handleLock}
              aria-label={`${lockText} (${currentProfile.name})`}
            >
              <span className={styles.headerAvatar} aria-hidden="true">
                {currentProfile.avatar}
              </span>
              {isProtected ? <Lock size={16} aria-hidden="true" /> : <LogOut size={16} aria-hidden="true" />}
              <span className={styles.lockLabel}>{lockText}</span>
            </button>
          </div>
        </header>

        <main id="main-content" className={styles.contentArea} tabIndex={-1}>
          {children}
        </main>
      </div>

      <QuickActionModal
        isOpen={isQuickActionOpen}
        onClose={() => setIsQuickActionOpen(false)}
        profileId={currentProfile.id}
      />

      <ProfileSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profile={currentProfile}
        onProfileUpdated={(updated) => {
          setCurrentProfile(updated);
          onProfileUpdated?.(updated);
        }}
      />

      <NoteModal
        isOpen={isNewNoteOpen}
        onClose={() => setIsNewNoteOpen(false)}
        onSave={handleSaveNewNote}
        folders={StorageService.getFolders(currentProfile.id)}
      />
    </div>
  );
};
