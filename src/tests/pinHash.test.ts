import { describe, it, expect } from 'vitest';
import { PIN_PATTERN, hashPin, isPinProtected, migrateLegacyPins, verifyPin } from '../services/pinHash';
import type { Profile } from '../types';

const base: Profile = { id: 'p-1', name: 'Ana', avatar: 'A', createdAt: '2026-10-10' };

describe('PIN_PATTERN', () => {
  // Técnica: valores límite sobre longitud (3, 4, 6, 7) y partición sobre caracteres.
  it.each([
    ['123', false],
    ['1234', true],
    ['123456', true],
    ['1234567', false],
    ['12a4', false],
    ['', false],
  ])('%s → %s', (pin, ok) => {
    expect(PIN_PATTERN.test(pin)).toBe(ok);
  });
});

describe('hashPin', () => {
  it('devuelve hash y sal en hex sin contener el PIN', async () => {
    const { pinHash, pinSalt } = await hashPin('2468');
    expect(pinHash).toMatch(/^[0-9a-f]{64}$/);
    expect(pinSalt).toMatch(/^[0-9a-f]{32}$/);
    expect(pinHash).not.toContain('2468');
  });

  it('es determinista con la misma sal', async () => {
    const first = await hashPin('2468');
    const second = await hashPin('2468', first.pinSalt);
    expect(second).toEqual(first);
  });

  it('genera sales distintas en cada llamada sin sal', async () => {
    const a = await hashPin('2468');
    const b = await hashPin('2468');
    expect(a.pinSalt).not.toBe(b.pinSalt);
    expect(a.pinHash).not.toBe(b.pinHash);
  });
});

describe('verifyPin', () => {
  // Técnica: tabla de decisión (hash/legado/sin PIN × correcto/incorrecto).
  it('acepta el PIN correcto y rechaza el incorrecto con hash', async () => {
    const profile: Profile = { ...base, ...(await hashPin('2468')) };
    expect(await verifyPin(profile, '2468')).toBe(true);
    expect(await verifyPin(profile, '2469')).toBe(false);
  });

  it('acepta el PIN correcto y rechaza el incorrecto en perfiles legados', async () => {
    const profile: Profile = { ...base, pin: '4321' };
    expect(await verifyPin(profile, '4321')).toBe(true);
    expect(await verifyPin(profile, '0000')).toBe(false);
  });

  it('acepta cualquier entrada en un perfil sin PIN', async () => {
    expect(await verifyPin(base, '')).toBe(true);
  });
});

describe('isPinProtected', () => {
  it('detecta PIN con hash, legado o ausencia', async () => {
    expect(isPinProtected({ ...base, ...(await hashPin('2468')) })).toBe(true);
    expect(isPinProtected({ ...base, pin: '4321' })).toBe(true);
    expect(isPinProtected(base)).toBe(false);
  });
});

describe('migrateLegacyPins', () => {
  it('reemplaza el PIN en texto plano por hash y conserva el resto', async () => {
    const [migrated] = await migrateLegacyPins([{ ...base, pin: '4321' }]);
    expect(migrated).not.toHaveProperty('pin');
    expect(migrated).toMatchObject({ id: 'p-1', name: 'Ana', avatar: 'A', createdAt: '2026-10-10' });
    expect(await verifyPin(migrated, '4321')).toBe(true);
  });

  // Review Focus 2: idempotencia ante una migración interrumpida y reejecutada.
  it('no toca perfiles ya migrados ni sin PIN', async () => {
    const hashed: Profile = { ...base, id: 'p-2', ...(await hashPin('2468')) };
    const free: Profile = { ...base, id: 'p-3' };
    expect(await migrateLegacyPins([hashed, free])).toEqual([hashed, free]);
  });
});
