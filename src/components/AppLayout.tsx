import React, { useState, useEffect, useRef } from 'react';
import { ThemeToggle } from './common/ThemeToggle';
import { LayoutDashboard, Calendar, Compass, CheckSquare, Lock, LogOut, Plus, Settings, BookOpen, Folder, Shield, Search, Share2, MoreHorizontal } from 'lucide-react';
import { useEscapeKey } from '../utils/useEscapeKey';
import { sileo } from 'sileo';
import type { Profile, ViewType } from '../types';
import { isPinProtected } from '../services/pinHash';
import { StorageService } from '../services/storage';
import { QuickActionModal } from './quickAction/QuickActionModal';
import { ProfileSettingsModal } from './profile/ProfileSettingsModal';
import { NoteModal } from './notes/NoteModal';
import { VaultModal } from './vault/VaultModal';
import { GlobalSearchModal } from './search/GlobalSearchModal';
import { OrigamiHoja } from './common/OrigamiHoja';
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
  integrations: 'Integraciones',
};

// `secondary`: en la barra inferior móvil estos destinos van dentro del botón "Más" (siete no caben a 375px).
const NAV_ITEMS: { view: ViewType; label: string; icon: React.ReactNode; secondary?: boolean }[] = [
  { view: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} aria-hidden="true" /> },
  { view: 'agenda', label: 'Agenda', icon: <Calendar size={20} aria-hidden="true" /> },
  { view: 'planner', label: 'Planner', icon: <Compass size={20} aria-hidden="true" /> },
  { view: 'todo', label: 'To-Do', icon: <CheckSquare size={20} aria-hidden="true" /> },
  { view: 'notes', label: 'Notas', icon: <BookOpen size={20} aria-hidden="true" />, secondary: true },
  { view: 'folders', label: 'Carpetas', icon: <Folder size={20} aria-hidden="true" />, secondary: true },
  { view: 'integrations', label: 'Integraciones', icon: <Share2 size={20} aria-hidden="true" />, secondary: true },
];

const SECONDARY_ITEMS = NAV_ITEMS.filter(item => item.secondary);

export const AppLayout: React.FC<AppLayoutProps> = ({
  profile,
  currentView,
  onViewChange,
  onLockProfile,
  onProfileUpdated,
  children,
}) => {
  const [currentDate] = useState(() => layoutDateFormatter.format(new Date()));
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  useEscapeKey(() => setIsMoreOpen(false), isMoreOpen);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNewNoteOpen, setIsNewNoteOpen] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
        return;
      }

      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement | null;
        const tagName = target?.tagName;
        const isEditable = target?.isContentEditable;
        if (tagName !== 'INPUT' && tagName !== 'TEXTAREA' && !isEditable) {
          e.preventDefault();
          setIsSearchOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isProtected = isPinProtected(profile);
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
      profileId: profile.id,
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
          <div className={styles.brandHeader}>
            <div className={styles.monogram}>Es</div>
            <div className={styles.brandText}>
              <h1 className={styles.brandLogo}>Espiralia</h1>
              <p className={styles.brandCaption}>Taller de Escritorio</p>
            </div>
          </div>
        </div>

        <div className={styles.quickActionWrapper}>
          <button
            type="button"
            className={styles.quickActionButton}
            onClick={() => setIsQuickActionOpen(true)}
            aria-label="+ Acción Rápida"
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
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ''} ${item.secondary ? styles.navItemSecondary : ''}`}
                onClick={() => onViewChange(item.view)}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.icon}
                <span className={styles.navLabel}>{item.label}</span>
              </button>
            );
          })}

          <div className={styles.moreWrapper}>
            <button
              type="button"
              className={`${styles.navItem} ${SECONDARY_ITEMS.some(i => i.view === currentView) ? styles.navItemActive : ''}`}
              aria-haspopup="menu"
              aria-expanded={isMoreOpen}
              onClick={() => setIsMoreOpen(open => !open)}
            >
              <MoreHorizontal size={20} aria-hidden="true" />
              <span className={styles.navLabel}>Más</span>
            </button>
            {isMoreOpen && (
              <div role="menu" aria-label="Más secciones" className={styles.moreMenu}>
                {SECONDARY_ITEMS.map(item => (
                  <button
                    type="button"
                    role="menuitem"
                    key={item.view}
                    className={styles.moreMenuItem}
                    onClick={() => {
                      onViewChange(item.view);
                      setIsMoreOpen(false);
                    }}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <OrigamiHoja />
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.localDbBadge}>
            <span className={styles.localDbStatus}>
              <span className={styles.localDbDot} aria-hidden="true" />
              Guardado en este navegador
            </span>
          </div>

          <div className={styles.sidebarFooterActions}>
            <button
              type="button"
              className={styles.settingsButton}
              onClick={() => setIsSettingsOpen(true)}
            >
              <Settings size={16} aria-hidden="true" />
              <span>Ajustes & PIN</span>
            </button>
            <button
              type="button"
              className={styles.vaultButton}
              onClick={() => setIsVaultOpen(true)}
            >
              <Shield size={16} aria-hidden="true" />
              <span>Bóveda Offline</span>
            </button>
          </div>

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
          <h2 className={styles.headerTitle}>{VIEW_TITLES[currentView]}</h2>
          <div className={styles.headerRight}>
            <button
              ref={searchTriggerRef}
              type="button"
              className={styles.searchTrigger}
              onClick={() => setIsSearchOpen(true)}
            >
              <Search size={15} aria-hidden="true" />
              <span className={styles.searchPlaceholder}>Buscar en Espiralia...</span>{' '}
              <kbd className={styles.searchShortcut}>Ctrl+K</kbd>
            </button>
            <span className={styles.headerDate}>{currentDate}</span>
            <button
              type="button"
              className={styles.newNoteButton}
              onClick={() => setIsNewNoteOpen(true)}
              aria-label="+ Nueva Nota"
            >
              <Plus size={16} aria-hidden="true" />
              <span className={styles.newNoteLabel}>Nueva Nota</span>
            </button>
            <ThemeToggle />
            <button
              type="button"
              className={styles.lockButton}
              onClick={handleLock}
              aria-label={`${lockText} (${profile.name})`}
            >
              <span className={styles.headerAvatar} aria-hidden="true">
                {profile.avatar}
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
        profileId={profile.id}
      />

      <ProfileSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profile={profile}
        onProfileUpdated={(updated) => {
          onProfileUpdated?.(updated);
        }}
        onProfileDeleted={() => onLockProfile()}
      />

      <NoteModal
        isOpen={isNewNoteOpen}
        onClose={() => setIsNewNoteOpen(false)}
        onSave={handleSaveNewNote}
        folders={StorageService.getFolders(profile.id)}
      />

      <VaultModal
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
        profile={profile}
        onProfileRestored={(restored) => {
          onProfileUpdated?.(restored);
        }}
      />

      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => {
          setIsSearchOpen(false);
          searchTriggerRef.current?.focus();
        }}
        onNavigate={(view) => {
          onViewChange(view);
          searchTriggerRef.current?.focus();
        }}
        profileId={profile.id}
      />
    </div>
  );
};
