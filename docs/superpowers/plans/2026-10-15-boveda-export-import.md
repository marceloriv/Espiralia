# Bóveda Offline: Exportar/Importar Perfil y Cifrado AES-GCM — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar una solución completa y segura de respaldo offline para perfiles de Espiralia (eventos, planner, metas, tareas, áreas, notas, carpetas y enlaces web), permitiendo exportar en JSON plano o cifrado con contraseña mediante Web Crypto (AES-GCM + PBKDF2), e importar con validación estricta de esquema y selección de estrategia de restauración.

**Architecture:** Módulo criptográfico aislado en `src/services/vaultCrypto.ts` con primitivas estándar W3C Web Crypto. Capa de exportación, validación y restauración en `src/services/vaultService.ts` conectada a `StorageService`. Modal accesible `VaultModal` en `src/components/vault/` integrado en la barra lateral de `AppLayout`.

**Tech Stack:** TypeScript 5.8, React 19.2, Web Crypto API (`window.crypto.subtle`), CSS Modules con tokens oficiales de Claude/Espiralia, Lucide React, Vitest 3.x y Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-15-boveda-export-import-design.md`

## Global Constraints

- 100% en cliente sin servidores remotos ni telemetría (AGENTS.md §1, §10).
- Cero dependencias npm criptográficas externas: usar exclusivamente `window.crypto.subtle` (§17.2 A.8.24).
- Validación exhaustiva de inputs en importación para evitar prototype pollution o datos corruptos (§10 A08).
- Touch target ≥ 44 px en todos los botones y campos interactivos (WCAG 2.2 AA).
- Commits en formato Conventional Commits + Gitmoji en español sin firmas de autoría de IA.

## Review Focus

1. **Seguridad criptográfica:** Clave derivada con PBKDF2 (100.000 iteraciones, HMAC-SHA-256) y cifrado autenticado AES-GCM (12 bytes de IV aleatorio por cifrado, sal aleatoria de 16 bytes).
2. **Rechazo seguro de contraseñas incorrectas:** Si la contraseña es inválida o el archivo fue manipulado, AES-GCM detecta la discrepancia de autenticación y aborta sin corromper el estado de la aplicación.
3. **Validación estricta de esquema:** Archivos JSON no estructurados según `ProfileBackup` son rechazados antes de cualquier inserción en el almacenamiento.
4. **Restauración aislada:** La restauración en modo "nuevo perfil" genera un `profileId` independiente y remapea las referencias sin mezclar datos con perfiles existentes.
5. **Accesibilidad en `VaultModal`:** Soporte completo de teclado (Escape, Tab trap), contraste de color conforme a WCAG AA y etiquetas semánticas claras.

---

### Task 1: Tipos y Motor Criptográfico Web Crypto AES-GCM (`src/services/vaultCrypto.ts`)

**Files:**
- Create: `src/services/vaultCrypto.ts`
- Create: `src/tests/vaultCrypto.test.ts`

**Interfaces:**
- Produces: `ProfileBackup`, `EncryptedVaultEnvelope`, `encryptBackup(backup, passphrase)`, `decryptBackup(envelope, passphrase)`, `isVaultEnvelope(data)`.

- [ ] **Step 1: Escribir pruebas unitarias para cifrado, descifrado y validación criptográfica**

Crear `src/tests/vaultCrypto.test.ts`:
```typescript
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
```

- [ ] **Step 2: Ejecutar prueba para verificar fallo**

Ejecutar: `corepack pnpm exec vitest run src/tests/vaultCrypto.test.ts`  
Resultado esperado: FAIL por módulo inexistente.

- [ ] **Step 3: Implementar `src/services/vaultCrypto.ts`**

Implementar interfaces `ProfileBackup`, `EncryptedVaultEnvelope` y funciones `encryptBackup`, `decryptBackup`, `isVaultEnvelope` usando `window.crypto.subtle`.

- [ ] **Step 4: Ejecutar prueba para verificar que pasa**

Ejecutar: `corepack pnpm exec vitest run src/tests/vaultCrypto.test.ts`  
Resultado esperado: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/vaultCrypto.ts src/tests/vaultCrypto.test.ts
git commit -m ":sparkles: feat(vault): implementar motor criptografico AES-GCM y PBKDF2 para respaldos"
```

---

### Task 2: Servicio de Validación y Gestión de Bóveda (`src/services/vaultService.ts`)

**Files:**
- Create: `src/services/vaultService.ts`
- Create: `src/tests/vaultService.test.ts`

**Interfaces:**
- Consumes: `StorageService`, `ProfileBackup`.
- Produces: `VaultService.exportProfile`, `VaultService.validateBackup`, `VaultService.restoreProfile`.

- [ ] **Step 1: Escribir pruebas unitarias de exportación, validación y restauración**

Crear `src/tests/vaultService.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { VaultService } from '../services/vaultService';
import { StorageService } from '../services/storage';
import type { ProfileBackup } from '../services/vaultCrypto';

describe('VaultService', () => {
  const profileId = 'p-vault-source';

  beforeEach(() => {
    localStorage.clear();
    StorageService.saveProfile({ id: profileId, name: 'Perfil Origen', avatar: 'O', createdAt: '2026-10-15' });
    StorageService.saveTodo({ id: 't-src', profileId, title: 'Comprar libro', priority: 'media', status: 'pendiente', createdAt: '2026-10-15' });
    StorageService.saveNote({ id: 'n-src', profileId, title: 'Nota fuente', content: 'Info', createdAt: '2026-10-15', updatedAt: '2026-10-15' });
  });

  it('exporta todos los datos del perfil activo en un objeto estructurado', () => {
    const backup = VaultService.exportProfile(profileId);
    expect(backup.version).toBe(1);
    expect(backup.profile.id).toBe(profileId);
    expect(backup.todos).toHaveLength(1);
    expect(backup.notes).toHaveLength(1);
  });

  it('valida rigurosamente esquemas válidos y rechaza entradas malformadas', () => {
    const valid = VaultService.exportProfile(profileId);
    expect(VaultService.validateBackup(valid)).toBe(true);

    expect(VaultService.validateBackup(null)).toBe(false);
    expect(VaultService.validateBackup({ version: 2 })).toBe(false);
    expect(VaultService.validateBackup({ version: 1, profile: null })).toBe(false);
    expect(VaultService.validateBackup({ version: 1, profile: {}, todos: 'no-es-array' })).toBe(false);
  });

  it('restaura sobrescribiendo el perfil existente', () => {
    const backup = VaultService.exportProfile(profileId);
    // Cambiar datos en el respaldo
    backup.todos = [{ id: 't-new', profileId, title: 'Tarea restaurada', priority: 'alta', status: 'completada', createdAt: '2026-10-15' }];

    const result = VaultService.restoreProfile(backup, 'overwrite', profileId);
    expect(result.profile.id).toBe(profileId);

    const todos = StorageService.getTodos(profileId);
    expect(todos).toHaveLength(1);
    expect(todos[0].title).toBe('Tarea restaurada');
  });

  it('restaura como nuevo perfil generando nuevo ID sin tocar el origen', () => {
    const backup = VaultService.exportProfile(profileId);
    backup.profile.name = 'Perfil Clonado';

    const result = VaultService.restoreProfile(backup, 'new_profile');
    expect(result.profile.id).not.toBe(profileId);
    expect(result.profile.name).toBe('Perfil Clonado');

    // El perfil original permanece intacto
    expect(StorageService.getTodos(profileId)).toHaveLength(1);
    // El nuevo perfil tiene sus propias copias
    expect(StorageService.getTodos(result.profile.id)).toHaveLength(1);
    expect(StorageService.getProfiles()).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Ejecutar prueba para verificar fallo**

Ejecutar: `corepack pnpm exec vitest run src/tests/vaultService.test.ts`  
Resultado esperado: FAIL por módulo inexistente.

- [ ] **Step 3: Implementar `src/services/vaultService.ts`**

Implementar métodos:
- `exportProfile(profileId: string): ProfileBackup`
- `validateBackup(data: unknown): data is ProfileBackup`
- `restoreProfile(backup: ProfileBackup, mode: 'overwrite' | 'new_profile', targetProfileId?: string): { profile: Profile; counts: Record<string, number> }`

- [ ] **Step 4: Ejecutar prueba para verificar que pasa**

Ejecutar: `corepack pnpm exec vitest run src/tests/vaultService.test.ts`  
Resultado esperado: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/vaultService.ts src/tests/vaultService.test.ts
git commit -m ":sparkles: feat(vault): implementar servicio de exportacion, validacion y restauracion de perfiles"
```

---

### Task 3: Componente `VaultModal` para Exportación e Importación (`src/components/vault/VaultModal.tsx`)

**Files:**
- Create: `src/components/vault/VaultModal.tsx`
- Create: `src/components/vault/VaultModal.module.css`
- Create: `src/tests/VaultModal.test.tsx`

**Interfaces:**
- Consumes: `VaultService`, `vaultCrypto`, `Profile`.
- Produces: `VaultModal` con pestañas para exportar (plano / cifrado) e importar (archivo, preview, estrategia).

- [ ] **Step 1: Escribir pruebas unitarias e interacción de `VaultModal`**

Crear `src/tests/VaultModal.test.tsx`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VaultModal } from '../components/vault/VaultModal';
import { StorageService } from '../services/storage';
import type { Profile } from '../types';

describe('VaultModal', () => {
  const mockProfile: Profile = {
    id: 'p-modal-test',
    name: 'Francisca',
    avatar: 'F',
    createdAt: '2026-10-15',
  };

  beforeEach(() => {
    localStorage.clear();
    StorageService.saveProfile(mockProfile);
  });

  it('renderiza diálogo accesible con pestañas Exportar e Importar', () => {
    render(<VaultModal isOpen={true} onClose={vi.fn()} profile={mockProfile} />);

    expect(screen.getByRole('dialog', { name: /bóveda offline/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /exportar respaldo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /restaurar \/ importar/i })).toBeInTheDocument();
  });

  it('permite alternar el checkbox de cifrado con contraseña', async () => {
    const user = userEvent.setup();
    render(<VaultModal isOpen={true} onClose={vi.fn()} profile={mockProfile} />);

    const encryptCheckbox = screen.getByLabelText(/cifrar archivo con contraseña/i);
    expect(encryptCheckbox).not.toBeChecked();

    await user.click(encryptCheckbox);
    expect(encryptCheckbox).toBeChecked();

    expect(screen.getByLabelText(/contraseña de cifrado/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Ejecutar prueba para verificar fallo**

Ejecutar: `corepack pnpm exec vitest run src/tests/VaultModal.test.tsx`  
Resultado esperado: FAIL por componente inexistente.

- [ ] **Step 3: Implementar `VaultModal.module.css` y `VaultModal.tsx`**

Implementar modal accesible con:
- Pestaña Exportar:
  - Resumen de lo que se exportará (tareas, notas, eventos, etc.).
  - Checkbox para cifrado opcional con contraseña y confirmación.
  - Botón de descarga de archivo (`.json` o `.vault`).
- Pestaña Importar / Restaurar:
  - Input file para cargar archivo.
  - Detección de respaldo cifrado y solicitud de contraseña.
  - Vista previa de datos cargados.
  - Selección de estrategia de restauración ("Sobrescribir en perfil actual" o "Crear nuevo perfil").
  - Confirmación y cierre.

- [ ] **Step 4: Ejecutar prueba para verificar que pasa**

Ejecutar: `corepack pnpm exec vitest run src/tests/VaultModal.test.tsx`  
Resultado esperado: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/vault/* src/tests/VaultModal.test.tsx
git commit -m ":sparkles: feat(vault): implementar componente accesible VaultModal para exportar e importar"
```

---

### Task 4: Integración de "Bóveda Offline" en `AppLayout` y Deuda Técnica

**Files:**
- Modify: `src/components/AppLayout.tsx`
- Modify: `src/components/AppLayout.module.css`
- Modify: `src/tests/AppLayout.test.tsx`

**Interfaces:**
- Consumes: `VaultModal`, `Shield` icon de `lucide-react`.
- Produces: Botón "Bóveda Offline" accesible en pie de barra lateral, apertura de modal y actualización de tests de deuda técnica.

- [ ] **Step 1: Actualizar `src/tests/AppLayout.test.tsx` para verificar el botón "Bóveda Offline"**

Actualizar lista esperada de botones en `it('no muestra controles de features que todavía no existen')`:
- Agregar `'Bóveda Offline'`.
- Remover `/bóveda/i` de la lista de términos prohibidos.
- Agregar prueba:
```typescript
it('abre el modal de Bóveda Offline al hacer click en el botón del sidebar', async () => {
  const user = userEvent.setup();
  renderLayout();

  const vaultBtn = screen.getByRole('button', { name: /bóveda offline/i });
  await user.click(vaultBtn);

  expect(screen.getByRole('dialog', { name: /bóveda offline/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Ejecutar prueba para verificar fallo**

Ejecutar: `corepack pnpm exec vitest run src/tests/AppLayout.test.tsx`  
Resultado esperado: FAIL por ausencia de botón "Bóveda Offline".

- [ ] **Step 3: Implementar botón y modal en `src/components/AppLayout.tsx` y estilos en `AppLayout.module.css`**

- Agregar botón en `sidebarFooterActions`:
```tsx
<button
  type="button"
  className={styles.vaultButton}
  onClick={() => setIsVaultOpen(true)}
>
  <Shield size={16} aria-hidden="true" />
  <span>Bóveda Offline</span>
</button>
```
- Renderizar `<VaultModal isOpen={isVaultOpen} onClose={() => setIsVaultOpen(false)} profile={currentProfile} onProfileRestored={...} />`.

- [ ] **Step 4: Ejecutar prueba para verificar que pasa**

Ejecutar: `corepack pnpm exec vitest run src/tests/AppLayout.test.tsx`  
Resultado esperado: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/AppLayout* src/tests/AppLayout.test.tsx
git commit -m ":sparkles: feat(layout): conectar boton Boveda Offline y modal en barra lateral"
```

---

### Task 5: Verificación Integral de Suite, Build y Actualización de Roadmap

**Files:**
- Test: Toda la suite en `src/tests/`
- Modify: `docs/superpowers/plans/2026-10-10-stitch-redesign-roadmap.md`

- [ ] **Step 1: Ejecutar suite completa de pruebas unitarias y de integración**

Ejecutar: `corepack pnpm exec vitest run`  
Resultado esperado: Todos los tests pasan sin regresiones.

- [ ] **Step 2: Ejecutar compilación de producción para validar tipos y bundle**

Ejecutar: `corepack pnpm build`  
Resultado esperado: Build exitoso sin errores de TypeScript ni advertencias.

- [ ] **Step 3: Actualizar roadmap en `docs/superpowers/plans/2026-10-10-stitch-redesign-roadmap.md`**

Marcar la fase F7 como completada en la documentación del roadmap maestro y registrar el estado de la siguiente fase (F8 Búsqueda Global).

- [ ] **Step 4: Commit de documentación de release F7**

```bash
git add docs/superpowers/plans/2026-10-10-stitch-redesign-roadmap.md
git commit -m ":memo: docs(roadmap): actualizar estado de fase F7 a completada"
```
