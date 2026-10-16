import type { Profile } from '../types';
import { StorageService } from './storage';
import { toHex, fromHex } from '../utils/hex';

export const PIN_PATTERN = /^\d{4,6}$/;
export const PBKDF2_ITERATIONS = 100000;

/** PBKDF2-SHA-256 con Web Crypto. Sin saltHex genera una sal aleatoria de 16 bytes. */
export const hashPin = async (pin: string, saltHex?: string): Promise<{ pinHash: string; pinSalt: string }> => {
  const salt = saltHex ? fromHex(saltHex) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    key,
    256,
  );
  return { pinHash: toHex(bits), pinSalt: toHex(salt) };
};

const constantTimeEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};

export const isPinProtected = (profile: Profile): boolean => Boolean(profile.pinHash || profile.pin);

export const verifyPin = async (profile: Profile, pin: string): Promise<boolean> => {
  if (profile.pinHash) {
    // Sin sal válida hashPin usa una aleatoria: la comparación falla cerrada en vez de aceptar cualquier PIN.
    const { pinHash } = await hashPin(pin, profile.pinSalt || undefined);
    return constantTimeEqual(pinHash, profile.pinHash);
  }
  if (profile.pin !== undefined) return constantTimeEqual(pin, profile.pin);
  return true;
};

/** Reemplaza PIN en texto plano por hash. Idempotente: perfiles migrados o sin PIN se devuelven tal cual. */
export const migrateLegacyPins = (profiles: Profile[]): Promise<Profile[]> =>
  Promise.all(
    profiles.map(async profile => {
      if (profile.pin === undefined || profile.pinHash) return profile;
      const migrated: Profile = { ...profile, ...(await hashPin(profile.pin)) };
      delete migrated.pin;
      return migrated;
    }),
  );

/** Migra y persiste los PIN legados guardados. Devuelve true si hubo cambios; rechaza si Web Crypto no está disponible. */
export const migrateStoredPins = async (): Promise<boolean> => {
  const stored = StorageService.getProfiles();
  if (!stored.some(p => p.pin !== undefined && !p.pinHash)) return false;
  const migrated = await migrateLegacyPins(stored);
  migrated.forEach(p => StorageService.saveProfile(p));
  return true;
};
