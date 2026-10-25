import React, { useState, useEffect, useRef } from 'react';
import { Download, Upload, X, Lock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { sileo } from 'sileo';
import type { Profile } from '../../types';
import { VaultService } from '../../services/vaultService';
import { downloadFile } from '../../utils/downloadFile';
import { useDialogFocus } from '../../utils/useDialogFocus';
import { encryptBackup, decryptBackup, isVaultEnvelope, type ProfileBackup, type EncryptedVaultEnvelope } from '../../services/vaultCrypto';
import styles from './VaultModal.module.css';

interface VaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
  onProfileRestored?: (profile: Profile) => void;
}

type TabType = 'export' | 'import';

const VaultModalContent: React.FC<VaultModalProps> = ({
  onClose,
  profile,
  onProfileRestored,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('export');

  // Export State
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [exportStats] = useState<ProfileBackup | null>(() => {
    try {
      return VaultService.exportProfile(profile.id);
    } catch {
      return null;
    }
  });

  // Import State
  const [loadedBackup, setLoadedBackup] = useState<ProfileBackup | null>(null);
  const [pendingEnvelope, setPendingEnvelope] = useState<EncryptedVaultEnvelope | null>(null);
  const [decryptPassphrase, setDecryptPassphrase] = useState('');
  const [restoreMode, setRestoreMode] = useState<'overwrite' | 'new_profile'>('overwrite');
  const [importError, setImportError] = useState<string | null>(null);

  const dialogRef = useDialogFocus();
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exportStats) return;

    if (isEncrypted) {
      if (passphrase.length < 6) {
        alert('La contraseña debe tener al menos 6 caracteres');
        return;
      }
      if (passphrase !== confirmPassphrase) {
        alert('Las contraseñas no coinciden');
        return;
      }

      try {
        const envelope = await encryptBackup(exportStats, passphrase);
        const filename = VaultService.backupFilename(profile.name, 'vault');
        downloadFile(JSON.stringify(envelope, null, 2), filename, 'application/json');
        sileo.success({ title: 'Respaldo cifrado descargado', description: filename });
        onClose();
      } catch (err) {
        alert('Error al cifrar el respaldo: ' + (err as Error).message);
      }
    } else {
      const filename = VaultService.backupFilename(profile.name, 'json');
      downloadFile(JSON.stringify(exportStats, null, 2), filename, 'application/json');
      sileo.success({ title: 'Respaldo plano descargado', description: filename });
      onClose();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    setLoadedBackup(null);
    setPendingEnvelope(null);

    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (isVaultEnvelope(parsed)) {
        setPendingEnvelope(parsed);
      } else if (VaultService.validateBackup(parsed)) {
        setLoadedBackup(parsed);
      } else {
        setImportError('El archivo seleccionado no es un respaldo válido de Espiralia.');
      }
    } catch {
      setImportError('No se pudo leer el archivo. Asegúrate de que sea un JSON válido.');
    }
  };

  const handleDecrypt = async () => {
    if (!pendingEnvelope || !decryptPassphrase) return;
    setImportError(null);

    try {
      const decrypted = await decryptBackup(pendingEnvelope, decryptPassphrase);
      if (VaultService.validateBackup(decrypted)) {
        setLoadedBackup(decrypted);
        setPendingEnvelope(null);
        sileo.success({ title: 'Archivo descifrado con éxito' });
      } else {
        setImportError('El archivo descifrado no contiene un esquema de respaldo válido.');
      }
    } catch (err) {
      setImportError((err as Error).message);
    }
  };

  const handleRestore = () => {
    if (!loadedBackup) return;

    try {
      const result = VaultService.restoreProfile(loadedBackup, restoreMode, profile.id);
      sileo.success({
        title: 'Restauración completada',
        description: `Se importaron datos para ${result.profile.name}.`,
      });
      onProfileRestored?.(result.profile);
      onClose();
    } catch (err) {
      setImportError((err as Error).message);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalWrap} onClick={(e) => e.stopPropagation()}>
        <div className={styles.washiTape} aria-hidden="true" />
        <div
          ref={dialogRef}
          className={styles.modalBox}
          role="dialog"
          aria-modal="true"
          aria-labelledby="vault-modal-title"
        >
        <div className={styles.modalHeader}>
          <div>
            <h3 id="vault-modal-title" className={styles.modalTitle}>
              Bóveda Offline
            </h3>
            <p className={styles.modalSubtitle}>
              Exportación, restauración y cifrado seguro de datos personales
            </p>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Cerrar modal de bóveda"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className={styles.tabs} role="tablist">
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'export' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('export')}
          >
            <Download size={16} aria-hidden="true" />
            <span>Exportar Respaldo</span>
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'import' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('import')}
          >
            <Upload size={16} aria-hidden="true" />
            <span>Restaurar / Importar</span>
          </button>
        </div>

        {activeTab === 'export' ? (
          <form onSubmit={handleExport} className={styles.tabContent}>
            <div className={styles.infoCard}>
              <strong>Respaldo de datos de {profile.name}</strong>
              <div className={styles.infoGrid}>
                <span>Eventos: {exportStats?.events.length ?? 0}</span>
                <span>Bloques planner: {exportStats?.planner.length ?? 0}</span>
                <span>Metas semanales: {exportStats?.goals.length ?? 0}</span>
                <span>Tareas To-Do: {exportStats?.todos.length ?? 0}</span>
                <span>Notas & Reflexiones: {exportStats?.notes.length ?? 0}</span>
                <span>Carpetas temáticas: {exportStats?.folders.length ?? 0}</span>
                <span>Vínculos web: {exportStats?.links.length ?? 0}</span>
              </div>
            </div>

            <div className={styles.checkboxGroup}>
              <input
                id="vault-encrypt-toggle"
                type="checkbox"
                className={styles.checkbox}
                checked={isEncrypted}
                onChange={(e) => setIsEncrypted(e.target.checked)}
              />
              <label htmlFor="vault-encrypt-toggle" className={styles.label}>
                Cifrar archivo con contraseña (AES-GCM)
              </label>
            </div>

            {isEncrypted && (
              <>
                <div className={styles.formGroup}>
                  <label htmlFor="vault-passphrase" className={styles.label}>
                    Contraseña de cifrado
                  </label>
                  <input
                    id="vault-passphrase"
                    type="password"
                    className={styles.input}
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="Mínimo 6 caracteres..."
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="vault-confirm-passphrase" className={styles.label}>
                    Confirmar contraseña
                  </label>
                  <input
                    id="vault-confirm-passphrase"
                    type="password"
                    className={styles.input}
                    value={confirmPassphrase}
                    onChange={(e) => setConfirmPassphrase(e.target.value)}
                    placeholder="Repite la contraseña..."
                    required
                  />
                </div>
              </>
            )}

            <button type="submit" className={styles.btnPrimary}>
              <Download size={16} aria-hidden="true" />
              <span>Descargar Respaldo</span>
            </button>
          </form>
        ) : (
          <div className={styles.tabContent}>
            <div className={styles.formGroup}>
              <label htmlFor="vault-file-input" className={styles.label}>
                Seleccionar archivo de respaldo (.json o .vault)
              </label>
              <input
                id="vault-file-input"
                type="file"
                accept=".json,.vault"
                className={styles.input}
                onChange={handleFileChange}
              />
            </div>

            {importError && (
              <div className={styles.alertBox}>
                <AlertTriangle size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                <span>{importError}</span>
              </div>
            )}

            {pendingEnvelope && (
              <div className={styles.infoCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Lock size={16} color="var(--color-primary)" />
                  <strong>Archivo cifrado detectado</strong>
                </div>
                <p style={{ margin: '0 0 10px', fontSize: '0.8125rem' }}>
                  Este respaldo está protegido con AES-GCM. Ingresa la contraseña con la que fue creado:
                </p>
                <div className={styles.formGroup} style={{ marginBottom: 10 }}>
                  <input
                    type="password"
                    className={styles.input}
                    placeholder="Contraseña del respaldo..."
                    value={decryptPassphrase}
                    onChange={(e) => setDecryptPassphrase(e.target.value)}
                    aria-label="Contraseña del respaldo cifrado"
                  />
                </div>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  style={{ width: '100%' }}
                  onClick={handleDecrypt}
                >
                  Descifrar y Cargar Datos
                </button>
              </div>
            )}

            {loadedBackup && (
              <div className={styles.infoCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <CheckCircle2 size={16} color="var(--color-success)" />
                  <strong>Respaldo válido: {loadedBackup.profile.name}</strong>
                </div>
                <div className={styles.infoGrid} style={{ marginBottom: 12 }}>
                  <span>Eventos: {loadedBackup.events.length}</span>
                  <span>Tareas: {loadedBackup.todos.length}</span>
                  <span>Notas: {loadedBackup.notes.length}</span>
                  <span>Carpetas: {loadedBackup.folders.length}</span>
                </div>

                <div className={styles.formGroup} style={{ gap: 8 }}>
                  <span className={styles.label}>Estrategia de restauración:</span>

                  <label className={styles.radioOption}>
                    <input
                      type="radio"
                      name="restore-mode"
                      value="overwrite"
                      checked={restoreMode === 'overwrite'}
                      onChange={() => setRestoreMode('overwrite')}
                    />
                    <div>
                      <div className={styles.radioOptionTitle}>
                        Sobrescribir datos en perfil actual ({profile.name})
                      </div>
                      <div className={styles.radioOptionDesc}>
                        Reemplaza los registros de este perfil con los datos contenidos en el respaldo.
                      </div>
                    </div>
                  </label>

                  <label className={styles.radioOption}>
                    <input
                      type="radio"
                      name="restore-mode"
                      value="new_profile"
                      checked={restoreMode === 'new_profile'}
                      onChange={() => setRestoreMode('new_profile')}
                    />
                    <div>
                      <div className={styles.radioOptionTitle}>
                        Importar como nuevo perfil independiente
                      </div>
                      <div className={styles.radioOptionDesc}>
                        Crea un nuevo perfil en la lista manteniendo el perfil actual intacto.
                      </div>
                    </div>
                  </label>
                </div>

                <button
                  type="button"
                  className={styles.btnPrimary}
                  style={{ width: '100%', marginTop: 12 }}
                  onClick={handleRestore}
                >
                  Restaurar Datos Ahora
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  </div>
);
};

export const VaultModal: React.FC<VaultModalProps> = (props) => {
  if (!props.isOpen) return null;
  return <VaultModalContent {...props} />;
};
