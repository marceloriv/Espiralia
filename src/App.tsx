import { useEffect, useState } from 'react';
import { HashRouter } from 'react-router-dom';
import { Toaster, sileo } from 'sileo';
import 'sileo/styles.css';
import { StorageService, STORAGE_ERROR_EVENT } from './services/storage';
import { migrateStoredPins } from './services/pinHash';
import { AppRoutes } from './routes';
import type { Profile } from './types';

export function App() {
  const [activeProfile, setActiveProfile] = useState<Profile | null>(() => {
    const activeId = StorageService.getActiveProfileId();
    if (!activeId) return null;
    return StorageService.getProfiles().find(p => p.id === activeId) || null;
  });

  // Una sesión activa salta la pantalla de perfiles: los PIN legados se migran también al arrancar (§10 A04).
  useEffect(() => {
    migrateStoredPins().catch(() => {
      // ponytail: sin Web Crypto el PIN legado queda intacto y se reintenta en la próxima carga.
    });
  }, []);

  // QuotaExceededError al guardar: avisa en lugar de perder datos en silencio (§10 A10).
  useEffect(() => {
    let lastShown = 0;
    const onStorageError = () => {
      // Una acción puede fallar en varias escrituras seguidas: un solo aviso cada 3 s.
      if (Date.now() - lastShown < 3000) return;
      lastShown = Date.now();
      sileo.error({ title: 'No se pudo guardar: el almacenamiento del navegador está lleno. Exporta un respaldo desde Bóveda Offline.' });
    };
    window.addEventListener(STORAGE_ERROR_EVENT, onStorageError);
    return () => window.removeEventListener(STORAGE_ERROR_EVENT, onStorageError);
  }, []);

  const handleSelectProfile = (profile: Profile) => {
    StorageService.setActiveProfileId(profile.id);
    setActiveProfile(profile);
    sileo.success({ title: `Sesión iniciada: ¡Hola, ${profile.name}!` });
  };

  const handleLockProfile = () => {
    StorageService.clearActiveProfileId();
    setActiveProfile(null);
  };

  const handleProfileUpdated = (updated: Profile) => {
    setActiveProfile(updated);
  };

  return (
    <HashRouter>
      <Toaster position="top-center" />
      <AppRoutes
        activeProfile={activeProfile}
        onSelectProfile={handleSelectProfile}
        onLockProfile={handleLockProfile}
        onProfileUpdated={handleProfileUpdated}
      />
    </HashRouter>
  );
}

export default App;
