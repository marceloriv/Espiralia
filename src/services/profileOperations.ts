import type { Profile } from '../types';
import { StorageService } from './storage';
import { hashPin, verifyPin } from './pinHash';

export interface CreateProfileResult {
  success: boolean;
  profile?: Profile;
  error?: string;
}

export interface UpdateProfilePinResult {
  success: boolean;
  updated?: Profile;
  error?: string;
}

export async function createNewProfile(name: string, pin: string): Promise<CreateProfileResult> {
  const trimmedName = name.trim();
  const trimmedPin = pin.trim();
  if (!trimmedName) {
    return { success: false, error: 'El nombre es obligatorio' };
  }

  try {
    const pinData = trimmedPin ? await hashPin(trimmedPin) : {};
    const newProfile: Profile = {
      id: `p-${Date.now()}`,
      name: trimmedName,
      avatar: trimmedName.charAt(0).toUpperCase(),
      createdAt: new Date().toISOString(),
      ...pinData,
    };

    StorageService.saveProfile(newProfile);
    StorageService.setActiveProfileId(newProfile.id);
    return { success: true, profile: newProfile };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo crear el perfil',
    };
  }
}

export async function updateProfilePin(
  profile: Profile,
  newPin: string,
  currentPin?: string
): Promise<UpdateProfilePinResult> {
  try {
    const isProtected = Boolean(profile.pinHash || profile.pin);
    if (isProtected) {
      if (!currentPin) {
        return { success: false, error: 'Ingresa tu PIN actual' };
      }
      const isValidCurrent = await verifyPin(profile, currentPin);
      if (!isValidCurrent) {
        return { success: false, error: 'El PIN actual es incorrecto' };
      }
    }

    const { pinHash, pinSalt } = await hashPin(newPin);
    const updated: Profile = {
      ...profile,
      pinHash,
      pinSalt,
    };
    delete updated.pin;

    StorageService.saveProfile(updated);
    return { success: true, updated };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al procesar el PIN criptográfico',
    };
  }
}

export async function removeProfilePin(
  profile: Profile,
  currentPin: string
): Promise<UpdateProfilePinResult> {
  try {
    if (!currentPin) {
      return { success: false, error: 'Ingresa tu PIN actual para confirmar' };
    }
    const isValid = await verifyPin(profile, currentPin);
    if (!isValid) {
      return { success: false, error: 'El PIN actual es incorrecto' };
    }

    const updated: Profile = {
      ...profile,
      pinHash: undefined,
      pinSalt: undefined,
    };
    delete updated.pin;

    StorageService.saveProfile(updated);
    return { success: true, updated };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al remover el PIN',
    };
  }
}
