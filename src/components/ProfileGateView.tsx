import React, { useState, useEffect } from 'react';
import { User, Lock, Plus, ArrowRight } from 'lucide-react';
import type { Profile } from '../types';
import { StorageService } from '../services/storage';
import styles from './ProfileGateView.module.css';

interface ProfileGateViewProps {
  onSelectProfile: (profile: Profile) => void;
}

export const ProfileGateView: React.FC<ProfileGateViewProps> = ({ onSelectProfile }) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedProfileForPin, setSelectedProfileForPin] = useState<Profile | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  useEffect(() => {
    setProfiles(StorageService.getProfiles());
  }, []);

  const handleProfileClick = (profile: Profile) => {
    if (profile.pin) {
      setSelectedProfileForPin(profile);
      setPinInput('');
      setPinError(false);
    } else {
      StorageService.setActiveProfileId(profile.id);
      onSelectProfile(profile);
    }
  };

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfileForPin) return;

    if (pinInput === selectedProfileForPin.pin) {
      StorageService.setActiveProfileId(selectedProfileForPin.id);
      onSelectProfile(selectedProfileForPin);
    } else {
      setPinError(true);
    }
  };

  const handleCreateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newProfile: Profile = {
      id: `p-${Date.now()}`,
      name: name.trim(),
      avatar: name.trim().charAt(0).toUpperCase(),
      pin: pin.trim() ? pin.trim() : undefined,
      createdAt: new Date().toISOString(),
    };

    StorageService.saveProfile(newProfile);
    StorageService.setActiveProfileId(newProfile.id);
    setProfiles(StorageService.getProfiles());
    setIsCreating(false);
    onSelectProfile(newProfile);
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
              key={profile.id}
              className={styles.profileItem}
              onClick={() => handleProfileClick(profile)}
            >
              <div className={styles.avatarBadge}>{profile.avatar}</div>
              <div className={styles.profileInfo}>
                <div className={styles.profileName}>{profile.name}</div>
                <div className={styles.profileMeta}>
                  {profile.pin ? 'Protegido por PIN' : 'Acceso libre'}
                </div>
              </div>
              {profile.pin ? (
                <Lock size={18} color="var(--color-muted)" />
              ) : (
                <ArrowRight size={18} color="var(--color-primary)" />
              )}
            </button>
          ))}
        </div>

        <button
          className={styles.btnPrimary}
          onClick={() => {
            setIsCreating(true);
            setName('');
            setPin('');
          }}
        >
          <Plus size={18} />
          <span>Nuevo perfil</span>
        </button>
      </div>

      {/* Modal crear perfil */}
      {isCreating && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalBox}>
            <h3 className={styles.cardHeading}>Crear perfil</h3>
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
                  PIN opcional (4 dígitos)
                </label>
                <input
                  id="create-profile-pin"
                  type="password"
                  maxLength={6}
                  className={styles.formInput}
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  placeholder="Dejar vacío si no requieres PIN"
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setIsCreating(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className={styles.btnPrimary} style={{ flex: 1 }}>
                  Crear perfil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal PIN */}
      {selectedProfileForPin && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalBox}>
            <h3 className={styles.cardHeading}>Ingresa tu PIN</h3>
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
                  className={styles.formInput}
                  value={pinInput}
                  onChange={e => {
                    setPinInput(e.target.value);
                    setPinError(false);
                  }}
                  autoFocus
                  required
                />
                {pinError && <p className={styles.errorMessage}>PIN incorrecto. Inténtalo de nuevo.</p>}
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setSelectedProfileForPin(null)}
                >
                  Cancelar
                </button>
                <button type="submit" className={styles.btnPrimary} style={{ flex: 1 }}>
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
