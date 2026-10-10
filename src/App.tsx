import { useState } from 'react';
import { HashRouter } from 'react-router-dom';
import { Toaster, sileo } from 'sileo';
import 'sileo/styles.css';
import { StorageService } from './services/storage';
import { AppRoutes } from './routes';
import type { Profile } from './types';

export function App() {
  const [activeProfile, setActiveProfile] = useState<Profile | null>(() => {
    const activeId = StorageService.getActiveProfileId();
    if (!activeId) return null;
    return StorageService.getProfiles().find(p => p.id === activeId) || null;
  });

  const handleSelectProfile = (profile: Profile) => {
    StorageService.setActiveProfileId(profile.id);
    setActiveProfile(profile);
    sileo.success(`Sesión iniciada: ¡Hola, ${profile.name}!`);
  };

  const handleLockProfile = () => {
    StorageService.clearActiveProfileId();
    setActiveProfile(null);
  };

  return (
    <HashRouter>
      <Toaster position="top-right" />
      <AppRoutes
        activeProfile={activeProfile}
        onSelectProfile={handleSelectProfile}
        onLockProfile={handleLockProfile}
      />
    </HashRouter>
  );
}

export default App;
