import React, { useState, useEffect } from 'react';
import { Lock, Shield, ShieldAlert, ShieldCheck, Unlock, X } from 'lucide-react';
import { sileo } from 'sileo';
import type { Profile } from '../../types';
import { PIN_PATTERN, isPinProtected } from '../../services/pinHash';
import { updateProfilePin, removeProfilePin } from '../../services/profileOperations';
import styles from './ProfileSettingsModal.module.css';

export interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
  onProfileUpdated: (updatedProfile: Profile) => void;
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  onProfileUpdated,
}) => {
  const protectedPin = isPinProtected(profile);

  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [removeCurrentPin, setRemoveCurrentPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSetOrChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!PIN_PATTERN.test(newPin)) {
      sileo.error({ title: 'El PIN debe tener entre 4 y 6 dígitos numéricos' });
      return;
    }

    if (newPin !== confirmPin) {
      sileo.error({ title: 'La confirmación del PIN no coincide' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await updateProfilePin(profile, newPin, protectedPin ? currentPin : undefined);
      if (!res.success || !res.updated) {
        sileo.error({ title: res.error || 'Error al procesar el PIN criptográfico' });
        return;
      }

      sileo.success({ title: protectedPin ? 'PIN actualizado con éxito' : 'PIN configurado con éxito' });
      onProfileUpdated(res.updated);
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemovePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!removeCurrentPin) {
      sileo.error({ title: 'Ingresa tu PIN actual para confirmar' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await removeProfilePin(profile, removeCurrentPin);
      if (!res.success || !res.updated) {
        sileo.error({ title: res.error || 'Error al remover el PIN' });
        return;
      }

      sileo.success({ title: 'PIN eliminado. Perfil ahora en acceso libre' });
      onProfileUpdated(res.updated);
      setRemoveCurrentPin('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.backdrop} onClick={e => e.target === e.currentTarget && onClose()}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-settings-modal-title"
      >
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <span className={styles.iconWrap} aria-hidden="true">
              <Shield size={18} />
            </span>
            <h2 id="profile-settings-modal-title" className={styles.title}>
              Ajustes de Perfil & PIN
            </h2>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Cerrar ventana de ajustes"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.profileCard}>
            <div className={styles.avatar}>{profile.avatar || profile.name.charAt(0).toUpperCase()}</div>
            <div className={styles.profileMeta}>
              <span className={styles.profileName}>{profile.name}</span>
              <span className={`${styles.statusBadge} ${protectedPin ? styles.statusProtected : styles.statusFree}`}>
                {protectedPin ? (
                  <>
                    <ShieldCheck size={14} aria-hidden="true" />
                    <span>Protegido con PIN local</span>
                  </>
                ) : (
                  <>
                    <Unlock size={14} aria-hidden="true" />
                    <span>Acceso libre (sin PIN)</span>
                  </>
                )}
              </span>
            </div>
          </div>

          <section className={styles.section} aria-labelledby="settings-pin-form-title">
            <h3 id="settings-pin-form-title" className={styles.sectionTitle}>
              {protectedPin ? 'Modificar PIN de acceso' : 'Proteger perfil con PIN'}
            </h3>
            <form onSubmit={handleSetOrChangePin} className={styles.form}>
              {protectedPin && (
                <div className={styles.field}>
                  <label htmlFor="settings-current-pin" className={styles.label}>
                    PIN actual
                  </label>
                  <input
                    id="settings-current-pin"
                    name="settingsCurrentPin"
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    className={styles.input}
                    placeholder="••••"
                    value={currentPin}
                    onChange={e => setCurrentPin(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className={styles.field}>
                <label htmlFor="settings-new-pin" className={styles.label}>
                  Nuevo PIN (4 a 6 dígitos)
                </label>
                <input
                  id="settings-new-pin"
                  name="settingsNewPin"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  className={styles.input}
                  placeholder="••••"
                  value={newPin}
                  onChange={e => setNewPin(e.target.value)}
                  required
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="settings-confirm-pin" className={styles.label}>
                  Confirmar nuevo PIN
                </label>
                <input
                  id="settings-confirm-pin"
                  name="settingsConfirmPin"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  className={styles.input}
                  placeholder="••••"
                  value={confirmPin}
                  onChange={e => setConfirmPin(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                <Lock size={16} aria-hidden="true" />
                <span>{protectedPin ? 'Actualizar PIN' : 'Fijar PIN'}</span>
              </button>
            </form>
          </section>

          {protectedPin && (
            <section className={styles.dangerSection} aria-labelledby="settings-danger-title">
              <h3 id="settings-danger-title" className={styles.sectionTitle}>
                Remover protección
              </h3>
              <form onSubmit={handleRemovePin} className={styles.form}>
                <div className={styles.field}>
                  <label htmlFor="settings-remove-pin" className={styles.label}>
                    PIN actual para confirmar
                  </label>
                  <input
                    id="settings-remove-pin"
                    name="settingsRemovePin"
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    className={styles.input}
                    placeholder="••••"
                    value={removeCurrentPin}
                    onChange={e => setRemoveCurrentPin(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className={styles.dangerBtn} disabled={isSubmitting}>
                  <ShieldAlert size={16} aria-hidden="true" />
                  <span>Quitar PIN y dejar acceso libre</span>
                </button>
              </form>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
