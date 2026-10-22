import React, { useEffect, useState } from 'react';
import { Plus, ArrowRight, BookOpen } from 'lucide-react';
import { sileo } from 'sileo';
import type { Profile } from '../types';
import { StorageService } from '../services/storage';
import { PIN_PATTERN, isPinProtected, migrateStoredPins, verifyPin } from '../services/pinHash';
import { createNewProfile } from '../services/profileOperations';
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
  const [activeKey, setActiveKey] = useState<string | null>(null);
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

  const handleVerifyPin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await executeVerify();
  };

  // Listener de teclado físico restringido a dígitos numéricos y feedback táctil
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const triggerActiveKey = (key: string) => {
      setActiveKey(key);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setActiveKey(null), 160);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Sin panel de PIN visible o con el modal de crear perfil abierto, las teclas no se capturan
      if (isCreating || !selectedProfileForPin) {
        return;
      }

      const activeEl = document.activeElement;
      if (
        (activeEl instanceof HTMLInputElement && activeEl.id !== 'verify-pin-input') ||
        activeEl instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        triggerActiveKey(e.key);
        setPinInput(prev => (prev.length < 6 ? prev + e.key : prev));
        setPinError(false);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        triggerActiveKey('Backspace');
        setPinInput(prev => prev.slice(0, -1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        triggerActiveKey('Enter');
        executeVerify();
      } else if (e.key === 'Escape') {
        setPinInput('');
        setPinError(false);
      } else if (
        !['Tab', 'Shift', 'Control', 'Alt', 'Meta', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)
      ) {
        // Bloquear cualquier otra tecla alfabética o símbolo
        if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key.length === 1) {
          e.preventDefault();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (
        activeKey === e.key ||
        (e.key === 'Backspace' && activeKey === 'Backspace') ||
        (e.key === 'Enter' && activeKey === 'Enter')
      ) {
        setActiveKey(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (timer) clearTimeout(timer);
    };
  }, [executeVerify, activeKey, isCreating, selectedProfileForPin]);

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
      <div className={styles.topStripe} />

      <header className={styles.header}>
        <div className={styles.brandRow}>
          <BookOpen size={20} className={styles.brandIcon} aria-hidden="true" />
          <span className={styles.brandName}>Espiralia</span>
        </div>
        <p className={styles.tagline}>TALLER DE ESCRITORIO • CUADERNO PERSONAL</p>
        <div className={styles.secBadge}>
          <span className={styles.secDot} aria-hidden="true" />
          <span>Datos en este navegador • PIN con hash PBKDF2</span>
        </div>
      </header>

      <main className={styles.mainSheet}>
        <div className={styles.washiCorner} aria-hidden="true" />

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

          <p className={styles.secNote}>
            ✓ PIN protegido con hash PBKDF2 (100.000 iteraciones)
          </p>
        </section>

        {/* Columna Derecha: Teclado táctil y Post-it */}
        <section className={styles.rightCol}>
          <div className={styles.postitNote}>
            <div className={styles.brassClip} aria-hidden="true" />
            <div className={styles.postitText}>discipline today, peace tomorrow ♡</div>
            <div className={styles.postitSub}>Escribe sin censura.</div>
          </div>

          <div className={styles.redStamp}>LOCAL</div>

          {selectedProfileForPin && (
          <div className={styles.pinPanel}>
            <span className={styles.pinOverline}>ACCESO A CUADERNO PERSONAL</span>
            <h2 className={styles.pinTitle}>Introduce tu PIN Maestro</h2>

            {/* Cajas de dígitos PIN enmarcadas en cilindro de combinación de latón */}
            <div className={styles.combinationLockFrame} aria-hidden="true">
              <div className={styles.tumblerNotchTop} />
              <div className={styles.pinBoxes}>
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className={styles.pinBox}>
                    {pinInput[i] ? '●' : ''}
                  </div>
                ))}
              </div>
              <div className={styles.tumblerNotchBottom} />
            </div>

            {/* Teclado numérico táctil 3x4 */}
            <div className={styles.keypadGrid}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(digit => (
                <button
                  type="button"
                  key={digit}
                  className={`${styles.keypadBtn} ${activeKey === digit ? styles.keypadBtnPressed : ''}`}
                  onClick={() => {
                    if (pinInput.length < 6) {
                      setPinInput(prev => prev + digit);
                      setPinError(false);
                    }
                  }}
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                className={`${styles.keypadBtn} ${activeKey === 'Backspace' ? styles.keypadBtnPressed : ''}`}
                aria-label="Borrar dígito"
                onClick={() => setPinInput(prev => prev.slice(0, -1))}
              >
                ⌫
              </button>
              <button
                type="button"
                className={`${styles.keypadBtn} ${activeKey === '0' ? styles.keypadBtnPressed : ''}`}
                onClick={() => {
                  if (pinInput.length < 6) {
                    setPinInput(prev => prev + '0');
                    setPinError(false);
                  }
                }}
              >
                0
              </button>
              <button
                type="button"
                className={`${styles.keypadBtn} ${styles.keypadSubmit} ${activeKey === 'Enter' ? styles.keypadSubmitPressed : ''}`}
                aria-label="Confirmar PIN"
                onClick={handleVerifyPin}
                disabled={busy}
              >
                ➔
              </button>
            </div>

            <p className={styles.keypadHint}>
              Ingresa los 4 dígitos o pulsa las teclas del teclado
            </p>
          </div>
          )}
        </section>
      </main>

      <footer className={styles.footerLinks}>
        <button
          type="button"
          className={styles.footerTextBtn}
          onClick={() => sileo.info({ title: 'Para restablecer tu PIN, exporta y restaura tu bóveda local.' })}
        >
          ¿Olvidaste tu PIN?
        </button>
        <button
          type="button"
          className={styles.footerTextBtn}
          onClick={() => {
            const data = StorageService.exportVault();
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `espiralia-boveda-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          Exportar Bóveda Local (.json)
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
