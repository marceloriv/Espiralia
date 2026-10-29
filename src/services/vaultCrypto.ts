import type { Profile, AgendaEvent, PlannerBlock, Goal, TodoItem, Area, Note, Folder, LinkItem } from '../types';
import { toHex, fromHex } from '../utils/hex';
import type { FileBackup } from './fileStore';

export interface ProfileBackup {
  version: 1;
  createdAt: string;
  profile: Profile;
  events: AgendaEvent[];
  planner: PlannerBlock[];
  goals: Goal[];
  todos: TodoItem[];
  areas: Area[];
  notes: Note[];
  folders: Folder[];
  links: LinkItem[];
  /** PDFs de Carpetas en base64. Opcional: los respaldos anteriores a la subida de archivos no lo traen. */
  files?: FileBackup[];
}

export interface EncryptedVaultEnvelope {
  version: 1;
  type: 'espiralia_vault';
  algorithm: 'AES-GCM';
  kdf: 'PBKDF2';
  hash: 'SHA-256';
  iterations: number;
  salt: string; // hex de 16 bytes
  iv: string;   // hex de 12 bytes
  ciphertext: string; // hex
}

export const isVaultEnvelope = (data: unknown): data is EncryptedVaultEnvelope => {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return (
    obj.version === 1 &&
    obj.type === 'espiralia_vault' &&
    obj.algorithm === 'AES-GCM' &&
    typeof obj.salt === 'string' &&
    typeof obj.iv === 'string' &&
    typeof obj.ciphertext === 'string'
  );
};

const deriveKey = async (passphrase: string, salt: Uint8Array, iterations: number): Promise<CryptoKey> => {
  const rawKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations,
      hash: 'SHA-256',
    },
    rawKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
};

export const encryptBackup = async (
  backup: ProfileBackup,
  passphrase: string,
): Promise<EncryptedVaultEnvelope> => {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const iterations = 100000;

  const key = await deriveKey(passphrase, salt, iterations);
  const plaintext = new TextEncoder().encode(JSON.stringify(backup));
  const encryptedBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    plaintext,
  );

  return {
    version: 1,
    type: 'espiralia_vault',
    algorithm: 'AES-GCM',
    kdf: 'PBKDF2',
    hash: 'SHA-256',
    iterations,
    salt: toHex(salt),
    iv: toHex(iv),
    ciphertext: toHex(encryptedBuf),
  };
};

export const decryptBackup = async (
  envelope: EncryptedVaultEnvelope,
  passphrase: string,
): Promise<ProfileBackup> => {
  try {
    const salt = fromHex(envelope.salt);
    const iv = fromHex(envelope.iv);
    const ciphertext = fromHex(envelope.ciphertext);

    const key = await deriveKey(passphrase, salt, envelope.iterations || 100000);
    const decryptedBuf = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as BufferSource },
      key,
      ciphertext as BufferSource,
    );

    const jsonStr = new TextDecoder().decode(decryptedBuf);
    return JSON.parse(jsonStr) as ProfileBackup;
  } catch {
    throw new Error('Contraseña incorrecta o archivo de respaldo dañado');
  }
};
