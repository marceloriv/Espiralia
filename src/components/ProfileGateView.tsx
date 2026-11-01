import React, { useEffect, useState } from 'react';
import { Plus, ArrowRight } from 'lucide-react';
import { sileo } from 'sileo';
import type { Profile } from '../types';
import { StorageService } from '../services/storage';
import { PIN_PATTERN, isPinProtected, migrateStoredPins, verifyPin } from '../services/pinHash';
import { createNewProfile } from '../services/profileOperations';
import { VaultService } from '../services/vaultService';
import { Pliego } from './common/Pliego';
import { Papel } from './common/Papel';
import { VentanaCarga } from './common/VentanaCarga';
import { downloadFile } from '../utils/downloadFile';
import { useEscapeKey } from '../utils/useEscapeKey';
import styles from './ProfileGateView.module.css';

interface ProfileGateViewProps {
  onSelectProfile: (profile: Profile) => void;
  onNavigateLanding?: () => void;
}

export const ProfileGateView: React.FC<ProfileGateViewProps> = ({
  onSelectProfile,
  onNavigateLanding,
}) => {
  const [profiles, setProfiles] = useState<Profile[]>(() => StorageService.getProfiles());
  const [isCreating, setIsCreating] = useState(false);
  const [selectedProfileForPin, setSelectedProfileForPin] = useState<Profile | null>(() => {
    const initialProfiles = StorageService.getProfiles();
    return initialProfiles.find(isPinProtected) || null;
  });

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

  const executeVerify = React.useCallback(async () => {
    const target = selectedProfileForPin || profiles.find(isPinProtected) || profiles[0] || null;
    if (!target || busy) return;
    setBusy(true);
    const ok = await verifyPin(target, pinInput).catch(() => false);
    setBusy(false);

    if (ok) {
      StorageService.setActiveProfileId(target.id);
      onSelectProfile(target);
    } else {
      setPinError(true);
      sileo.error({ title: 'PIN incorrecto' });
    }
  }, [selectedProfileForPin, profiles, busy, pinInput, onSelectProfile]);

  useEscapeKey(() => setSelectedProfileForPin(null), !!selectedProfileForPin && !isCreating);

  // Un archivo por perfil, en el mismo formato que importa la bóveda del cuaderno (VaultModal).
  const handleExportBackups = async () => {
    if (profiles.length === 0) {
      sileo.info({ title: 'No hay perfiles para respaldar' });
      return;
    }
    // Los respaldos se leen en paralelo (cada perfil es independiente) y se descargan después, en el orden de la lista.
    // Con los PDF de Carpetas si IndexedDB responde; si no, el respaldo de ese perfil sale igual sin ellos.
    const backups = await Promise.all(
      profiles.map(p => VaultService.exportProfileWithFiles(p.id).catch(() => VaultService.exportProfile(p.id))),
    );
    profiles.forEach((p, i) =>
      downloadFile(JSON.stringify(backups[i], null, 2), VaultService.backupFilename(p.name, 'json'), 'application/json'),
    );
    sileo.success({ title: 'Respaldo exportado', description: 'Restáuralo desde dentro del cuaderno, en Bóveda Offline.' });
  };

  const handleVerifyPin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await executeVerify();
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
      {/* PBKDF2 tarda lo suficiente como para notarse: mientras `busy`, la ventana de carga (§7.8) dice qué se está haciendo. */}
      {busy && <VentanaCarga etiqueta={isCreating ? 'Creando tu cuaderno…' : 'Verificando tu PIN…'} />}
      <div className={styles.topStripe} />

      <header className={styles.header}>
        <div className={styles.brandRow}>
          <span className={styles.brandIcon} aria-hidden="true">Es</span>
          <span className={styles.brandName}>Espiralia</span>
        </div>
        <p className={styles.tagline}>TALLER DE ESCRITORIO • CUADERNO PERSONAL</p>
        <div className={styles.secBadge}>
          <span className={styles.secDot} aria-hidden="true" />
          <span>Datos en este navegador • PIN con hash PBKDF2</span>
        </div>
      </header>

      <main className={styles.mainSheet}>
        <Pliego as="div" className={styles.pliegoGate}>
          {/* Columna Izquierda: Cuadernos Registrados */}
          <section className={styles.leftCol}>
            <span className={styles.overlineTag}>CUADERNOS REGISTRADOS</span>
            <h1 className={styles.mainTitle}>Desbloquear Cuaderno.</h1>
            <p className={styles.quote}>
              «Un espacio íntimo donde tus pensamientos no salen jamás de tu dispositivo.»
            </p>

            <h2 className={styles.cardHeading}>Selecciona tu perfil</h2>

            <div className={styles.profileList}>
              {profiles.map(profile => (
                <button
                  type="button"
                  key={profile.id}
                  className={`${styles.profileItem} ${selectedProfileForPin?.id === profile.id ? styles.profileItemActive : ''}`}
                  onClick={() => handleProfileClick(profile)}
                >
                  <div className={styles.avatarBadge} aria-hidden="true">{profile.avatar}</div>
                  <div className={styles.profileInfo}>
                    <div className={styles.profileNameRow}>
                      <span className={styles.profileName}>{profile.name}</span>
                      <span className={styles.activePill}>ACTIVO</span>
                    </div>
                    <div className={styles.profileMeta}>
                      {isPinProtected(profile) ? 'Protegido por PIN' : 'Acceso libre'}
                    </div>
                  </div>
                  {isPinProtected(profile) ? (
                    <div className={styles.brassPadlock} aria-hidden="true">
                      <div className={styles.padlockShackle} />
                      <div className={styles.padlockBody}>
                        <div className={styles.padlockKeyhole} />
                      </div>
                    </div>
                  ) : (
                    <ArrowRight size={18} className={styles.arrowIcon} aria-hidden="true" />
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

            {profiles.length === 0 && <p className={styles.secNote}>Crea un perfil para empezar.</p>}
          </section>

          {/* Columna Derecha: lema y tres datos del cuaderno, cada uno en su papel (DESIGN.md §0.9) */}
          <aside className={styles.rightCol} aria-label="Sobre tu cuaderno">
            <div className={styles.postitNote}>
              <div className={styles.brassClip} aria-hidden="true" />
              <div className={styles.postitText}>Disciplina hoy, paz mañana ♡</div>
              <div className={styles.postitSub}>Escribe sin censura.</div>
            </div>

            <Papel as="div" forma="pieza" tinte="pizarra" className={styles.datoA}>
              <p className={styles.dato}>
                <strong>Todo queda en este navegador</strong>
                Tus perfiles, notas y tareas no salen de tu equipo.
              </p>
            </Papel>
            <Papel as="div" forma="pieza" tinte="rosa" className={styles.datoB}>
              <p className={styles.dato}>
                <strong>PIN opcional por perfil</strong>
                Se guarda como hash con sal, nunca en texto plano.
              </p>
            </Papel>
            <Papel as="div" forma="pieza" tinte="salvia" className={styles.datoC}>
              <p className={styles.dato}>
                <strong>Respalda desde dentro del cuaderno</strong>
                Con cifrado opcional, y restaura en otro equipo.
              </p>
            </Papel>

            <div className={styles.redStamp}>LOCAL</div>
          </aside>
        </Pliego>
      </main>

      <footer className={styles.footerLinks}>
        <button
          type="button"
          className={styles.footerTextBtn}
          onClick={() => sileo.info({ title: 'Espiralia no puede restablecer un PIN: solo guarda su hash en este navegador.' })}
        >
          ¿Olvidaste tu PIN?
        </button>
        <button
          type="button"
          className={styles.footerTextBtn}
          onClick={handleExportBackups}
        >
          Exportar respaldo (.json)
        </button>
        <button
          type="button"
          className={styles.btnBackToLanding}
          onClick={() => {
            if (onNavigateLanding) {
              onNavigateLanding();
            } else {
              window.location.hash = '#/inicio';
            }
          }}
        >
          ← Conoce más sobre Espiralia
        </button>
      </footer>

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
                <button type="submit" className={styles.btnSubmit} disabled={busy}>
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

            {/* Indicador visual de la cerradura de combinación: refleja el input real, 4 casillas y hasta 6. */}
            <div className={styles.combinationLockFrame} aria-hidden="true">
              <div className={styles.tumblerNotchTop} />
              <div className={styles.pinBoxes}>
                {Array.from({ length: Math.min(6, Math.max(4, pinInput.length)) }, (_, i) => (
                  <div key={i} className={styles.pinBox}>
                    {pinInput[i] ? '●' : ''}
                  </div>
                ))}
              </div>
              <div className={styles.tumblerNotchBottom} />
            </div>

            <form onSubmit={handleVerifyPin}>
              <div className={styles.formGroup}>
                <label htmlFor="verify-pin-input" className={styles.formLabel}>
                  PIN de acceso
                </label>
                <input
                  id="verify-pin-input"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  className={styles.formInput}
                  value={pinInput}
                  onChange={e => {
                    setPinInput(e.target.value.replace(/\D/g, '').slice(0, 6));
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
                <button type="submit" className={styles.btnSubmit} disabled={busy}>
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
