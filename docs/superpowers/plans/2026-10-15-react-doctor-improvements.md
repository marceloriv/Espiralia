# React Doctor Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Subir la puntuación de salud de React Doctor de 50/100 (Crítico) a >90/100 eliminando los 3 errores de compilador y los 80 warnings en performance, accesibilidad, anti-patrones de estado y ciclo de vida.

**Architecture:** La refactorización ataca las raíces arquitectónicas identificadas por React Doctor: (1) extraer bloques `try/catch/finally` de handlers a helpers fuera de componentes para que React Compiler pueda optimizarlos sin errores `react-hooks-js/todo`; (2) eliminar controles interactivos anidados y etiquetar controles huérfanos para resolver las 20 advertencias de accesibilidad; (3) reemplazar el anti-patrón de reset de formulario vía `useEffect([isOpen])` por renderizado condicional con clave de montaje `{isOpen && <Form ... />}`, eliminando 42 advertencias de `set-state-in-effect` y `no-adjust-state-on-prop-change`; (4) estabilizar listeners de teclado en modales con refs para prevenir re-suscripciones continuas; (5) crear `doctor.config.json` para definir la configuración oficial de CI.

**Tech Stack:** React 19.3, TypeScript 5.8, React Compiler compatibility, Vitest 5.x + Testing Library 16.x, React Doctor CLI

**Spec:** Diagnóstico oficial de React Doctor v0.9 (`npx react-doctor src`): Score 50/100 (3 errores de sintaxis en compilador, 80 warnings en accesibilidad, hooks y estado).

## Global Constraints

- React 19.3 estricto: sin sintaxis incompatible con React Compiler
- Cero regresiones funcionales: los 560 tests de la suite deben continuar pasando
- Conservar contratos de props existentes de cada modal y vista
- Commits siguiendo Gitmoji + Conventional Commits
- `pnpm build` debe compilar limpio sin errores de TypeScript en cada tarea

## Review Focus

1. **`FoldersView.tsx` lista de carpetas:** Al desacoplar el `<div role="button">` que envolvía botones de edición y eliminación, la interacción de clic en la fila de carpeta debe mantenerse intacta para ratón y teclado (Enter/Espacio).
2. **Ciclo de vida de reseteo en modales:** Al remover los `useEffect` que hacían `setName('')`, `setPin('')`, etc. al cambiar `isOpen`, el formulario debe reinicializarse limpiamente cada vez que se abre sin retener datos de la apertura previa.
3. **`AppLayout.tsx` prop mirroring:** Al eliminar el `useEffect` que copiaba `profile` en `currentProfile`, las actualizaciones de perfil desde `ProfileSettingsModal` deben propagarse fluidamente a toda la UI sin desfases.
4. **Listeners de teclado en modales:** Al estabilizar el callback `onClose` mediante refs en los listeners de Escape, presionar Escape debe seguir cerrando el modal activo sin fugas de listeners en `window`.
5. **Backdrop de modales:** La interacción de clic en el fondo para cerrar no debe generar advertencias de `no-static-element-interactions` y debe ser accesible.

---

## File Map

| Archivo | Rol en el plan |
|---------|----------------|
| `src/services/profileOperations.ts` | T1: Helper de operaciones asíncronas con PIN para desacoplar `try/catch` |
| `src/components/ProfileGateView.tsx` | T1: Desacoplar `try/catch` de `handleCreateProfile` |
| `src/components/profile/ProfileSettingsModal.tsx` | T1: Desacoplar `try/catch` de `handleSavePin` y `handleRemovePin`; T2: backdrop accesible |
| `src/components/FoldersView.tsx` | T2: Desanidar botones de carpeta; T3: añadir dependencias faltantes |
| `src/components/TodoView.tsx` | T2: Remover `role="region"` redundante y corregir label de color |
| `src/components/folders/FolderModal.tsx` | T2: Corregir label de color; T4: eliminar reset en `useEffect` |
| `src/components/planner/GoalsDrawer.tsx` | T2: Añadir `aria-label` a botón `+`; T4: eliminar `setState` en effect |
| `src/components/quickAction/QuickActionModal.tsx` | T2: backdrop accesible; T4: eliminar reset en `useEffect` |
| `src/components/AppLayout.tsx` | T3: Eliminar prop mirroring `setCurrentProfile(profile)` |
| `src/components/NotesView.tsx` | T3: Corregir exhaustive-deps en effect |
| `src/components/folders/LinkModal.tsx` | T4: Eliminar reset en `useEffect` |
| `src/components/notes/NoteModal.tsx` | T4: Eliminar reset en `useEffect` |
| `src/components/planner/PlannerBlockModal.tsx` | T4: Eliminar reset en `useEffect` |
| `src/components/search/GlobalSearchModal.tsx` | T4: Eliminar cascada de `setState` en effect |
| `src/components/vault/VaultModal.tsx` | T4: Eliminar cascada de `setState` en effect |
| `doctor.config.json` | T5: Configuración oficial de React Doctor para CI |
| `src/tests/reactDoctorFixes.test.tsx` | Tests de verificación de las refactorizaciones |

---

### Task 1: Desacoplar `try/catch/finally` para React Compiler (Eliminar 3 errores)

**Files:**
- Create: `src/services/profileOperations.ts`
- Modify: `src/components/ProfileGateView.tsx:79-100`
- Modify: `src/components/profile/ProfileSettingsModal.tsx:57-116`
- Create: `src/tests/profileOperations.test.ts`

**Interfaces:**
- Produces:
  ```typescript
  export interface CreateProfileResult {
    success: boolean;
    profile?: Profile;
    error?: string;
  }
  export async function createNewProfile(name: string, pin: string): Promise<CreateProfileResult>;
  export async function updateProfilePin(profile: Profile, newPin: string, currentPin?: string): Promise<{ success: boolean; updated?: Profile; error?: string }>;
  export async function removeProfilePin(profile: Profile, currentPin: string): Promise<{ success: boolean; updated?: Profile; error?: string }>;
  ```
- Consumes: `StorageService`, `hashPin`, `verifyPin`, `PIN_PATTERN`

- [ ] **Step 1: Escribir el test que falla para `profileOperations.ts`**

```typescript
// src/tests/profileOperations.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createNewProfile, updateProfilePin, removeProfilePin } from '../services/profileOperations';
import { StorageService } from '../services/storage';

describe('profileOperations — desacoplamiento de lógica async para React Compiler', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('createNewProfile crea un perfil válido sin PIN', async () => {
    const res = await createNewProfile('Lucía', '');
    expect(res.success).toBe(true);
    expect(res.profile?.name).toBe('Lucía');
    expect(StorageService.getProfiles().length).toBe(1);
  });

  it('createNewProfile crea un perfil con PIN cifrado', async () => {
    const res = await createNewProfile('Marcos', '1234');
    expect(res.success).toBe(true);
    expect(res.profile?.pinHash).toBeDefined();
    expect(res.profile?.pinSalt).toBeDefined();
  });

  it('updateProfilePin valida PIN actual antes de actualizar', async () => {
    const created = await createNewProfile('Elena', '1234');
    const failRes = await updateProfilePin(created.profile!, '5678', '9999');
    expect(failRes.success).toBe(false);
    expect(failRes.error).toMatch(/incorrecto/i);
  });

  it('removeProfilePin elimina el hash de PIN tras verificar', async () => {
    const created = await createNewProfile('Pedro', '1234');
    const res = await removeProfilePin(created.profile!, '1234');
    expect(res.success).toBe(true);
    expect(res.updated?.pinHash).toBeUndefined();
  });
});
```

- [ ] **Step 2: Ejecutar y verificar que falla**

```bash
pnpm exec vitest run src/tests/profileOperations.test.ts
```
Esperado: FAIL — archivo o funciones no definidas.

- [ ] **Step 3: Implementar `src/services/profileOperations.ts`**

Crear el módulo con las funciones `createNewProfile`, `updateProfilePin` y `removeProfilePin` encapsulando los bloques `try/catch` fuera de los componentes React.

- [ ] **Step 4: Refactorizar `ProfileGateView.tsx` y `ProfileSettingsModal.tsx`**

En `ProfileGateView.tsx`:
`handleCreateProfile` invoca `createNewProfile(trimmedName, trimmedPin)` usando promesa limpia `.then/.catch` o `await` simple sin bloque `try/catch` interno en el render del componente.

En `ProfileSettingsModal.tsx`:
`handleSavePin` invoca `updateProfilePin(profile, newPin, currentPin)` y `handleRemovePin` invoca `removeProfilePin(profile, removeCurrentPin)` sin sentencias `try` anidadas en el cuerpo del componente.

- [ ] **Step 5: Ejecutar los tests de profileOperations y la suite de PIN**

```bash
pnpm exec vitest run src/tests/profileOperations.test.ts src/tests/pinHash.test.ts src/tests/ProfileSettingsModal.test.tsx
```
Esperado: PASS en todos los tests.

- [ ] **Step 6: Verificar con React Doctor que los 3 errores desaparecieron**

```bash
npx react-doctor src
```
Esperado: 0 errors (de 3 a 0).

- [ ] **Step 7: Commit**

```bash
git add src/services/profileOperations.ts src/components/ProfileGateView.tsx src/components/profile/ProfileSettingsModal.tsx src/tests/profileOperations.test.ts
git commit -m ":recycle: refactor(perfiles): extraer logica async de PIN para compatibilidad con React Compiler"
```

---

### Task 2: Corregir controles interactivos anidados y accesibilidad HTML

**Files:**
- Modify: `src/components/FoldersView.tsx:225-268`
- Modify: `src/components/TodoView.tsx:215,480-492`
- Modify: `src/components/folders/FolderModal.tsx:88-98`
- Modify: `src/components/planner/GoalsDrawer.tsx:189-197`
- Modify: `src/components/profile/ProfileSettingsModal.tsx:120-135`
- Modify: `src/components/quickAction/QuickActionModal.tsx:115-130`
- Create: `src/tests/reactDoctorA11y.test.tsx`

**Interfaces:**
- Produces: Árbol DOM válido (sin botones anidados dentro de botones/elementos con rol botón), labels con controles asociados, botones de icono con nombre accesible.

- [ ] **Step 1: Escribir el test que falla para verificar estructura accesible**

```tsx
// src/tests/reactDoctorA11y.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FoldersView } from '../components/FoldersView';
import { GoalsDrawer } from '../components/planner/GoalsDrawer';
import { StorageService } from '../services/storage';

describe('React Doctor A11y & HTML validation', () => {
  beforeEach(() => {
    localStorage.clear();
    StorageService.saveFolder({
      id: 'f-1',
      profileId: 'p-test',
      name: 'Estudios',
      color: '#3b82f6',
      createdAt: new Date().toISOString(),
    });
  });

  it('FoldersView no anida botones interactivos dentro de otro elemento button', () => {
    const { container } = render(<FoldersView profileId="p-test" />);
    // Ningún botón debe ser descendiente de un elemento con role="button" o etiqueta <button>
    const nestedButtons = container.querySelectorAll('button button, [role="button"] button');
    expect(nestedButtons.length).toBe(0);
  });

  it('GoalsDrawer tiene nombre accesible en el botón + de sub-tareas', () => {
    render(
      <GoalsDrawer
        isOpen={true}
        onClose={() => {}}
        profileId="p-test"
      />
    );
    const addSubTaskBtn = screen.getByRole('button', { name: /agregar sub-tarea/i });
    expect(addSubTaskBtn).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Ejecutar y verificar que falla**

```bash
pnpm exec vitest run src/tests/reactDoctorA11y.test.tsx
```
Esperado: FAIL — `nestedButtons.length` es > 0 y no se encuentra botón con nombre "agregar sub-tarea".

- [ ] **Step 3: Implementar correcciones de accesibilidad**

1. **`FoldersView.tsx`:**
   En lugar de envolver todo el elemento con `role="button" tabIndex={0}`, estructurar cada fila como:
   ```tsx
   <div className={styles.folderRow}>
     <button
       type="button"
       className={styles.folderSelectBtn}
       onClick={() => setSelectedFolderId(folder.id)}
       aria-pressed={isSelected}
     >
       <span className={styles.colorDot} style={{ backgroundColor: folder.color }} />
       <span className={styles.folderItemName}>{folder.name}</span>
     </button>
     <div className={styles.folderActions}>
       <span className={styles.folderBadgeCount}>{totalItems}</span>
       <button type="button" aria-label={`Editar carpeta ${folder.name}`} onClick={(e) => handleOpenEditFolder(folder, e)}>...</button>
       <button type="button" aria-label={`Eliminar carpeta ${folder.name}`} onClick={(e) => handleDeleteFolder(folder, e)}>...</button>
     </div>
   </div>
   ```

2. **`GoalsDrawer.tsx:189`:**
   Añadir `aria-label="Agregar sub-tarea"` al botón `+`.

3. **`TodoView.tsx`:**
   - Línea 215: Eliminar `role="region"` redundante en `<section className={styles.areasSection} aria-label="Áreas temáticas">`.
   - Línea 480: Reemplazar `<label className={styles.formLabel}>Color identificador</label>` por `<div role="group" aria-labelledby="todo-color-label"><span id="todo-color-label" className={styles.formLabel}>Color identificador</span>...</div>`.

4. **`FolderModal.tsx:89`:**
   Reemplazar `<label className={styles.label}>Color</label>` por `<div role="group" aria-labelledby="folder-color-label"><span id="folder-color-label" className={styles.label}>Color</span>...</div>`.

5. **`ProfileSettingsModal.tsx:126` y `QuickActionModal.tsx:120`:**
   El backdrop con `onClick={onClose}` debe tener `role="presentation"` o `aria-hidden="true"`, o ser un botón transparente de cierre de backdrop con `aria-label="Cerrar modal"`.

- [ ] **Step 4: Ejecutar tests y verificar que pasan**

```bash
pnpm exec vitest run src/tests/reactDoctorA11y.test.tsx src/tests/FoldersView.test.tsx
```
Esperado: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/FoldersView.tsx src/components/TodoView.tsx src/components/folders/FolderModal.tsx src/components/planner/GoalsDrawer.tsx src/components/profile/ProfileSettingsModal.tsx src/components/quickAction/QuickActionModal.tsx src/tests/reactDoctorA11y.test.tsx
git commit -m ":wheelchair: style(a11y): desanidar controles interactivos y corregir labels y roles segun estandar HTML"
```

---

### Task 3: Eliminar prop-mirroring y corregir dependencias en hooks

**Files:**
- Modify: `src/components/AppLayout.tsx:57-67`
- Modify: `src/components/FoldersView.tsx:40-52`
- Modify: `src/components/NotesView.tsx:25-32`
- Create: `src/tests/reactDoctorHooks.test.tsx`

**Interfaces:**
- Produces: `AppLayout` consume `profile` como fuente de verdad directa sin `useEffect` que haga espejo de props. `FoldersView` y `NotesView` con arreglos de dependencias exhaustivos.

- [ ] **Step 1: Escribir el test que valida propagación de perfil en `AppLayout`**

```tsx
// src/tests/reactDoctorHooks.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import type { Profile } from '../types';

const initialProfile: Profile = {
  id: 'p-1',
  name: 'Original',
  avatar: 'O',
  createdAt: new Date().toISOString(),
};

const updatedProfile: Profile = {
  ...initialProfile,
  name: 'Modificado',
  avatar: 'M',
};

describe('AppLayout — prop mirroring fix', () => {
  it('actualiza el nombre renderizado cuando cambia la prop profile sin desfase de effect', () => {
    const { rerender } = render(
      <MemoryRouter>
        <AppLayout
          profile={initialProfile}
          currentView="dashboard"
          onViewChange={() => {}}
          onLockProfile={() => {}}
        >
          <div />
        </AppLayout>
      </MemoryRouter>
    );

    expect(screen.getByText('Original')).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <AppLayout
          profile={updatedProfile}
          currentView="dashboard"
          onViewChange={() => {}}
          onLockProfile={() => {}}
        >
          <div />
        </AppLayout>
      </MemoryRouter>
    );

    expect(screen.getByText('Modificado')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Ejecutar y verificar estado inicial**

```bash
pnpm exec vitest run src/tests/reactDoctorHooks.test.tsx
```

- [ ] **Step 3: Refactorizar `AppLayout.tsx`**

Eliminar:
```tsx
const [currentProfile, setCurrentProfile] = useState<Profile>(profile);
useEffect(() => {
  setCurrentProfile(profile);
}, [profile]);
```
Sustituir por:
- Usar `profile` directamente en la UI.
- Si un modal notifica `onProfileUpdated(updated)`, invocar `onProfileUpdated?.(updated)` hacia el padre para mantener un único flujo unidireccional de datos en React.

- [ ] **Step 4: Corregir `exhaustive-deps` en `FoldersView.tsx` y `NotesView.tsx`**

En `FoldersView.tsx` y `NotesView.tsx`, envolver las funciones de recarga (`loadData`) en `useCallback` con sus dependencias reales o moverlas dentro del `useEffect` correspondiente para satisfacer las reglas de exhaustividad de hooks.

- [ ] **Step 5: Ejecutar la suite de tests**

```bash
pnpm exec vitest run src/tests/reactDoctorHooks.test.tsx src/tests/App.test.tsx
```
Esperado: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/AppLayout.tsx src/components/FoldersView.tsx src/components/NotesView.tsx src/tests/reactDoctorHooks.test.tsx
git commit -m ":recycle: refactor(hooks): eliminar prop-mirroring en AppLayout y asegurar dependencias exhaustivas"
```

---

### Task 4: Reemplazar `setState-in-effect` en modales con renderizado condicional

**Files:**
- Modify: `src/components/folders/FolderModal.tsx`
- Modify: `src/components/folders/LinkModal.tsx`
- Modify: `src/components/notes/NoteModal.tsx`
- Modify: `src/components/planner/PlannerBlockModal.tsx`
- Modify: `src/components/quickAction/QuickActionModal.tsx`
- Modify: `src/components/search/GlobalSearchModal.tsx`
- Modify: `src/components/vault/VaultModal.tsx`
- Create: `src/tests/reactDoctorModals.test.tsx`

**Interfaces:**
- Produces: Modales que no ejecutan cascada de `setState` dentro de `useEffect` al abrir/cerrar.

- [ ] **Step 1: Escribir el test que verifica la apertura limpia de modales**

```tsx
// src/tests/reactDoctorModals.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FolderModal } from '../components/folders/FolderModal';

describe('Modal form lifecycle sin setState en useEffect', () => {
  it('inicializa limpio al abrir y permite guardar', async () => {
    const user = userEvent.setup();
    const handleSave = vi.fn();

    render(
      <FolderModal
        isOpen={true}
        onClose={() => {}}
        onSave={handleSave}
      />
    );

    const input = screen.getByRole('textbox', { name: /nombre de la carpeta/i });
    await user.type(input, 'Carpeta Nueva');

    const submitBtn = screen.getByRole('button', { name: /guardar|crear/i });
    await user.click(submitBtn);

    expect(handleSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'Carpeta Nueva' }));
  });
});
```

- [ ] **Step 2: Ejecutar y verificar estado**

```bash
pnpm exec vitest run src/tests/reactDoctorModals.test.tsx
```

- [ ] **Step 3: Refactorizar el patrón de reseteo en los 7 modales**

Para cada modal (`FolderModal`, `LinkModal`, `NoteModal`, `PlannerBlockModal`, `QuickActionModal`, `GlobalSearchModal`, `VaultModal`):
1. Si `!isOpen`, retornar `null` inmediatamente (early return) antes de instanciar estados innecesarios o envolver el diálogo en un componente interno que se monta solo cuando `isOpen === true`.
2. Al montarse solo cuando `isOpen === true`, las llamadas `useState(initialValue)` ya tienen el valor inicial correcto, eliminando por completo:
   ```tsx
   // ❌ ELIMINAR ESTE ANTI-PATRÓN:
   useEffect(() => {
     if (isOpen) {
       setName(initialName || '');
       setColor(initialColor || '#...');
     }
   }, [isOpen]);
   ```
3. Estabilizar listeners de teclado `keydown` (Escape) usando una referencia `useRef(onClose)` para evitar re-suscripciones continuas (`prefer-use-effect-event`).

- [ ] **Step 4: Ejecutar toda la suite de tests de modales**

```bash
pnpm exec vitest run src/tests/QuickActionModal.test.tsx src/tests/VaultModal.test.tsx src/tests/PlannerModals.test.tsx src/tests/GlobalSearchModal.test.tsx src/tests/reactDoctorModals.test.tsx
```
Esperado: PASS en todos los modales.

- [ ] **Step 5: Commit**

```bash
git add src/components/folders/FolderModal.tsx src/components/folders/LinkModal.tsx src/components/notes/NoteModal.tsx src/components/planner/PlannerBlockModal.tsx src/components/quickAction/QuickActionModal.tsx src/components/search/GlobalSearchModal.tsx src/components/vault/VaultModal.tsx src/tests/reactDoctorModals.test.tsx
git commit -m ":recycle: refactor(modales): eliminar cascadas de setState en useEffect mediante montaje condicional"
```

---

### Task 5: Configuración oficial de React Doctor y verificación de salud

**Files:**
- Create: `doctor.config.json`
- Test: Ejecución completa de `npx react-doctor src`

- [ ] **Step 1: Crear `doctor.config.json`**

```json
{
  "$schema": "https://react.doctor/config.json",
  "ignore": [
    "dist/**",
    "node_modules/**",
    ".worktrees/**",
    "scratchpad/**",
    "src/tests/**"
  ],
  "rules": {
    "prefer-html-dialog": "off"
  }
}
```
*Nota:* `prefer-html-dialog` se desactiva explícitamente porque Espiralia utiliza modales accesibles con backdrop difuminado y focus trap (`role="dialog"` + `aria-modal="true"`) según el diseño Claude/Espiralia acordado en `DESIGN.md`.

- [ ] **Step 2: Ejecutar React Doctor y comprobar que la puntuación supera 90/100 con 0 errores**

```bash
npx react-doctor src
```
Esperado: 0 errores, Score ≥ 90 / 100.

- [ ] **Step 3: Ejecutar la suite de pruebas completa del proyecto**

```bash
pnpm exec vitest run src/tests/
```
Esperado: 100% tests en verde (84+ suites).

- [ ] **Step 4: Validar compilación de producción**

```bash
pnpm build
```
Esperado: Build exitoso sin errores de TypeScript.

- [ ] **Step 5: Commit**

```bash
git add doctor.config.json
git commit -m ":wrench: chore(config): configurar doctor.config.json y alcanzar estandar de salud React Doctor"
```

---

## Verificación final de entrega

- [ ] `npx react-doctor src` reporta 0 errores y Score ≥ 90/100
- [ ] `pnpm exec vitest run src/tests/` pasa sin fallos
- [ ] `pnpm build` compila limpio
