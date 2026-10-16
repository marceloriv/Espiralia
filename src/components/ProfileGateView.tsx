import React, { useEffect, useState } from 'react';
import { Lock, Plus, ArrowRight } from 'lucide-react';
import { sileo } from 'sileo';
import type { Profile } from '../types';
import { StorageService } from '../services/storage';
import { PIN_PATTERN, isPinProtected, migrateStoredPins, verifyPin } from '../services/pinHash';
import { createNewProfile } from '../services/profileOperations';
import styles from './ProfileGateView.module.css';

interface ProfileGateViewProps {
  onSelectProfile: (profile: Profile) => void;
}

export const ProfileGateView: React.FC<ProfileGateViewProps> = ({ onSelectProfile }) => {
  const [profiles, setProfiles] = useState<Profile[]>(() => StorageService.getProfiles());
  const [isCreating, setIsCreating] = useState(false);
  const [selectedProfileForPin, setSelectedProfileForPin] = useState<Profile | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [createPinError, setCreatePinError] = useState(false);
  const [busy, setBusy] = useState(false);

  // Migra PIN en texto plano a hash apenas se abre la pantalla (§10 A04).
  useEffect(() => {
    let cancelled = false;
    migrateStoredPins()
      .then(changed => {
        if (changed && !cancelled) setProfiles(StorageService.getProfiles());
      })
      .catch(() => {
        // ponytail: sin Web Crypto (contexto no seguro) el PIN legado queda intacto y se reintenta en la próxima carga.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleProfileClick = (profile: Profile) => {
    if (isPinProtected(profile)) {
      setSelectedProfileForPin(profile);
      setPinInput('');
      setPinError(false);
    } else {
      StorageService.setActiveProfileId(profile.id);
      onSelectProfile(profile);
    }
  };

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfileForPin || busy) return;
    setBusy(true);
    const ok = await verifyPin(selectedProfileForPin, pinInput).catch(() => false);
    setBusy(false);

    if (ok) {
      StorageService.setActiveProfileId(selectedProfileForPin.id);
      onSelectProfile(selectedProfileForPin);
    } else {
      setPinError(true);
      sileo.error({ title: 'PIN incorrecto' });
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedPin = pin.trim();
    if (!trimmedName || busy) return;
    if (trimmedPin && !PIN_PATTERN.test(trimmedPin)) {
      setCreatePinError(true);
      sileo.error({ title: 'El PIN debe tener entre 4 y 6 dígitos' });
      return;
    }

    setBusy(true);
    createNewProfile(trimmedName, trimmedPin)
      .then(res => {
        setBusy(false);
        if (!res.success || !res.profile) {
          sileo.error({ title: res.error || 'No se pudo crear el perfil' });
          return;
        }

        setProfiles(StorageService.getProfiles());
        setIsCreating(false);
        sileo.success({ title: `Perfil "${res.profile.name}" creado` });
        onSelectProfile(res.profile);
      })
      .catch(() => {
        setBusy(false);
        sileo.error({ title: 'No se pudo crear el perfil' });
      });
  };

  return (
    <div className={styles.gateContainer}>
      <div className={styles.brandHeader}>
        <h1 className={styles.brandTitle}>Espiralia</h1>
        <p className={styles.brandSubtitle}>Agenda, Planner y Tareas en un solo lugar</p>
      </div>

      <div className={styles.profilesCard}>
        <h2 className={styles.cardHeading}>Selecciona tu perfil</h2>

        <div className={styles.profileList}>
          {profiles.map(profile => (
            <button
              type="button"
              key={profile.id}
              className={styles.profileItem}
              onClick={() => handleProfileClick(profile)}
            >
              <div className={styles.avatarBadge} aria-hidden="true">{profile.avatar}</div>
              <div className={styles.profileInfo}>
                <div className={styles.profileName}>{profile.name}</div>
                <div className={styles.profileMeta}>
                  {isPinProtected(profile) ? 'Protegido por PIN' : 'Acceso libre'}
                </div>
              </div>
              {isPinProtected(profile) ? (
                <Lock size={18} color="var(--color-muted)" aria-hidden="true" />
              ) : (
                <ArrowRight size={18} color="var(--color-primary)" aria-hidden="true" />
              )}
            </button>
          ))}
        </div>

        <button
          type="button"
          className={styles.btnPrimary}
          onClick={() => {
            setIsCreating(true);
            setName('');
            setPin('');
            setCreatePinError(false);
          }}
        >
          <Plus size={18} aria-hidden="true" />
          <span>Nuevo perfil</span>
        </button>
      </div>

      {/* Modal crear perfil */}
      {isCreating && (
        <div
          className={styles.modalBackdrop}
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-profile-title"
        >
          <div className={styles.modalBox}>
            <h3 id="create-profile-title" className={styles.cardHeading}>Crear perfil</h3>
            <form onSubmit={handleCreateProfile}>
              <div className={styles.formGroup}>
                <label htmlFor="create-profile-name" className={styles.formLabel}>
                  Nombre
                </label>
                <input
                  id="create-profile-name"
                  type="text"
                  className={styles.formInput}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ej. Valentina"
                  autoFocus
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="create-profile-pin" className={styles.formLabel}>
                  PIN opcional (4 a 6 dígitos)
                </label>
                <input
                  id="create-profile-pin"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  className={styles.formInput}
                  value={pin}
                  onChange={e => {
                    setPin(e.target.value);
                    setCreatePinError(false);
                  }}
                  aria-invalid={createPinError ? 'true' : 'false'}
                  aria-describedby={createPinError ? 'create-pin-error' : undefined}
                  placeholder="Dejar vacío si no requieres PIN"
                />
                {createPinError && (
                  <p id="create-pin-error" className={styles.errorMessage} role="alert">
                    El PIN debe tener entre 4 y 6 dígitos.
                  </p>
                )}
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setIsCreating(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className={styles.btnPrimary} style={{ flex: 1 }} disabled={busy}>
                  Crear perfil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal PIN */}
      {selectedProfileForPin && (
        <div
          className={styles.modalBackdrop}
          role="dialog"
          aria-modal="true"
          aria-labelledby="verify-pin-title"
        >
          <div className={styles.modalBox}>
            <h3 id="verify-pin-title" className={styles.cardHeading}>Ingresa tu PIN</h3>
            <p className={styles.brandSubtitle} style={{ textAlign: 'center', marginBottom: 16 }}>
              Perfil: {selectedProfileForPin.name}
            </p>
            <form onSubmit={handleVerifyPin}>
              <div className={styles.formGroup}>
                <label htmlFor="verify-pin-input" className={styles.formLabel}>
                  PIN de acceso
                </label>
                <input
                  id="verify-pin-input"
                  type="password"
                  inputMode="numeric"
                  className={styles.formInput}
                  value={pinInput}
                  onChange={e => {
                    setPinInput(e.target.value);
                    setPinError(false);
                  }}
                  aria-invalid={pinError ? 'true' : 'false'}
                  aria-describedby={pinError ? 'pin-error-alert' : undefined}
                  autoFocus
                  required
                />
                {pinError && (
                  <p id="pin-error-alert" className={styles.errorMessage} role="alert">
                    PIN incorrecto. Inténtalo de nuevo.
                  </p>
                )}
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setSelectedProfileForPin(null)}
                >
                  Cancelar
                </button>
                <button type="submit" className={styles.btnPrimary} style={{ flex: 1 }} disabled={busy}>
                  Desbloquear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
