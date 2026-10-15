import { describe, it, expect } from 'vitest';
import { encryptBackup, decryptBackup, isVaultEnvelope, type ProfileBackup } from '../services/vaultCrypto';

describe('Vault Crypto (AES-GCM & PBKDF2)', () => {
  const mockBackup: ProfileBackup = {
    version: 1,
    createdAt: '2026-10-15T10:00:00Z',
    profile: { id: 'p-test', name: 'Usuario Prueba', avatar: 'U', createdAt: '2026-10-15' },
    events: [],
    planner: [],
    goals: [],
    todos: [{ id: 't-1', profileId: 'p-test', title: 'Tarea confidencial', priority: 'alta', status: 'pendiente', createdAt: '2026-10-15' }],
    areas: [],
    notes: [{ id: 'n-1', profileId: 'p-test', title: 'Reflexión secreta', content: 'Contenido privado', createdAt: '2026-10-15', updatedAt: '2026-10-15' }],
    folders: [],
    links: [],
  };

  it('cifra y descifra correctamente un respaldo con la contraseña adecuada', async () => {
    const password = 'clave-secreta-123';
    const encrypted = await encryptBackup(mockBackup, password);

    expect(isVaultEnvelope(encrypted)).toBe(true);
    expect(encrypted.type).toBe('espiralia_vault');
    expect(encrypted.algorithm).toBe('AES-GCM');
    expect(encrypted.iterations).toBe(100000);

    const decrypted = await decryptBackup(encrypted, password);
    expect(decrypted.version).toBe(1);
    expect(decrypted.profile.name).toBe('Usuario Prueba');
    expect(decrypted.notes[0].title).toBe('Reflexión secreta');
  });

  it('falla con error al intentar descifrar con contraseña incorrecta', async () => {
    const encrypted = await encryptBackup(mockBackup, 'clave-correcta');
    await expect(decryptBackup(encrypted, 'clave-equivocada')).rejects.toThrow(/contraseña incorrecta o archivo de respaldo dañado/i);
  });

  it('detecta si el ciphertext ha sido manipulado o corrompido', async () => {
    const encrypted = await encryptBackup(mockBackup, 'mi-password');
    // Alterar el último carácter del ciphertext
    const tampered = {
      ...encrypted,
      ciphertext: encrypted.ciphertext.slice(0, -2) + (encrypted.ciphertext.endsWith('0') ? '1' : '0'),
    };
    await expect(decryptBackup(tampered, 'mi-password')).rejects.toThrow();
  });
});
