# Refinamientos Visuales de Stitch, Deuda Técnica F2/F3 y Acción Rápida — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrar los elementos del diseño de Stitch postergados en F2 y F3 (botón "+ Acción Rápida" en Sidebar con modal unificado de captura, modal de "Ajustes & PIN" en pie de sidebar, tarjetas de "Áreas Temáticas Clave" en Dashboard) y subsanar las alertas de accesibilidad y consola detectadas con DevTools, manteniendo CSS Modules puro con tokens de diseño.

**Architecture:** Se mantienen CSS Modules y tokens de `src/index.css`. Se crea un componente modular `QuickActionModal` para captura ágil de tareas y eventos desde el sidebar. Se crea `ProfileSettingsModal` para modificar o remover PIN usando `pinHash.ts`. Se extiende `DashboardView` para mostrar el resumen de `Area`s con tareas activas (habilitado tras F4). Se corrigen atributos `inert`, `id`/`name` y labels de accesibilidad en `PlannerView`.

**Tech Stack:** React 19.2, TypeScript, Vite, CSS Modules + tokens de `src/index.css`, `lucide-react`, Web Crypto (PBKDF2 en `pinHash.ts`), Vitest + Testing Library.

**Spec:**
- `docs/superpowers/plans/2026-10-10-stitch-redesign-roadmap.md` (Sección "Deuda técnica registrada")
- `docs/superpowers/specs/2026-10-10-dashboard-stitch-design.md` (Bloque "Áreas temáticas clave")
- Referencias Stitch: `scratchpad/stitch-screens/{dashboard,agenda,planner,todo}.html`

## Global Constraints

- Sin backend. Todo dato en cliente aislado por `profileId` (`StorageService`).
- Estilos exclusivos con CSS Modules (`*.module.css`) y tokens de `src/index.css` / `DESIGN.md`. Prohibido Tailwind o CDN externa.
- Iconografía exclusiva de `lucide-react`. Sin Material Symbols ni fuentes externas no autorizadas.
- Prohibido renderizar textos que afirmen seguridad no implementada ("IndexedDB", "AES").
- WCAG 2.2 AA: touch targets ≥ 44 px, foco visible, contraste ≥ 4.5:1, nombres accesibles sin `undefined`.
- Tests unitarios en `src/tests/` con técnica de prueba declarada en comentario. Cobertura de rama ≥ 80%.
- Commits en español con Gitmoji y Conventional Commits: `:emoji: tipo(alcance): sujeto`, sin firmas de IA/agente.

## Review Focus

1. **Aislamiento entre perfiles en Acción Rápida:** Una tarea o evento creado desde el modal rápido debe persistirse exclusivamente en el `profileId` activo.
2. **Cambio/Remoción de PIN:** Modificar el PIN genera nuevo salt y hash PBKDF2; remover el PIN limpia `pinHash` y `pinSalt` dejando el perfil en acceso libre de forma atómica.
3. **Tarjetas de Áreas en Dashboard sin tareas:** Un área recién creada sin tareas asignadas debe mostrar "0 tareas pendientes" y 0% sin arrojar división por cero ni NaN.
4. **Accesibilidad del modal de Acción Rápida y Ajustes:** Ambos modales deben atrapar el foco, cerrarse con tecla Escape y no dejar atributos booleanos vacíos (`inert={true}` en lugar de `inert=""`).
5. **Corrección de nombres en PlannerView:** El botón de checkbox y eliminación de Planner debe anunciar el contenido del bloque (`block.content`) y nunca `undefined`.

---

## File Structure

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `src/components/PlannerView.tsx` | Modificar | Corregir `aria-label` de checkboxes y botones para usar `block.content` en vez de `block.title`. |
| `src/tests/PlannerView.test.tsx` | Modificar | Validar nombres accesibles reales sin `undefined`. |
| `src/components/dashboard/dashboardData.ts` | Modificar | Agregar función `areaSummaries(areas, todos)` para computar conteos por área temática. |
| `src/tests/dashboardData.test.ts` | Modificar | Tests unitarios para `areaSummaries` (cálculo de pendientes y totales). |
| `src/components/DashboardView.tsx` | Modificar | Renderizar sección "Áreas Temáticas Clave" usando `AreaCard`s con links a `/todo`. |
| `src/components/DashboardView.module.css` | Modificar | Grid y estilos para tarjetas de áreas temáticas según Stitch. |
| `src/tests/DashboardView.test.tsx` | Modificar | Verificar renderizado y navegación de áreas clave en Dashboard. |
| `src/components/quickAction/QuickActionModal.tsx` | Crear | Modal accesible con tabs "Nueva Tarea" y "Nuevo Evento" para captura instantánea. |
| `src/components/quickAction/QuickActionModal.module.css` | Crear | Estilos del modal y formularios de captura rápida. |
| `src/tests/QuickActionModal.test.tsx` | Crear | Pruebas de render, creación de tarea, creación de evento y cierre por Escape. |
| `src/components/profile/ProfileSettingsModal.tsx` | Crear | Modal para cambiar PIN, quitar PIN o ver datos del perfil activo. |
| `src/components/profile/ProfileSettingsModal.module.css` | Crear | Estilos del modal de ajustes de perfil. |
| `src/tests/ProfileSettingsModal.test.tsx` | Crear | Pruebas de cambio de PIN, remoción y validación de 4-6 dígitos. |
| `src/components/AppLayout.tsx` | Modificar | Agregar botón "+ Acción Rápida" en Sidebar y botón "Ajustes & PIN" en pie de sidebar. |
| `src/components/AppLayout.module.css` | Modificar | Estilos para el botón de Acción Rápida y link de Ajustes en Sidebar. |
| `src/tests/AppLayout.test.tsx` | Modificar | Actualizar pruebas de AppLayout verificando presencia y apertura de Acción Rápida y Ajustes. |

---

### Task 1: Corrección de accesibilidad en PlannerView y fixes de consola DevTools

**Files:**
- Modify: `src/components/PlannerView.tsx:120-150`
- Modify: `src/tests/PlannerView.test.tsx:40-70`

**Interfaces:**
- Consumes: `PlannerBlock` (`id`, `profileId`, `content`, `timeSlot`, `priority`, `isCompleted`).
- Produces: Etiquetas `aria-label={`completar ${block.content}`}` y `aria-label={`eliminar ${block.content}`}`.

- [ ] **Step 1: Write the failing test**
In `src/tests/PlannerView.test.tsx`, add a test verifying that checkboxes and delete buttons have accessible labels using `block.content` instead of `undefined`:
```tsx
it('asigna nombres accesibles con el contenido del bloque sin valor undefined', () => {
  render(<PlannerView profileId="p-test" />);
  expect(screen.queryByLabelText(/completar undefined/i)).not.toBeInTheDocument();
  expect(screen.queryByLabelText(/eliminar undefined/i)).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm exec vitest run src/tests/PlannerView.test.tsx`
Expected: FAIL if existing code renders `completar undefined`.

- [ ] **Step 3: Fix `src/components/PlannerView.tsx`**
Replace `aria-label={`completar ${block.title}`}` with `aria-label={`completar ${block.content}`}` and `aria-label={`eliminar ${block.title}`}` with `aria-label={`eliminar ${block.content}`}`. Also ensure form inputs have proper `id` and `name` attributes.

- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm exec vitest run src/tests/PlannerView.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add src/components/PlannerView.tsx src/tests/PlannerView.test.tsx
git commit -m ":bug: fix(planner): corregir nombre accesible de bloques y asociar id a inputs"
```

---

### Task 2: Tarjetas de Áreas Temáticas Clave en Dashboard

**Files:**
- Modify: `src/components/dashboard/dashboardData.ts`
- Modify: `src/tests/dashboardData.test.ts`
- Modify: `src/components/DashboardView.tsx`
- Modify: `src/components/DashboardView.module.css`
- Modify: `src/tests/DashboardView.test.tsx`

**Interfaces:**
- Consumes: `Area` de `src/types`, `TodoItem` de `src/types`, `StorageService.getAreas(profileId)`.
- Produces:
  ```typescript
  export interface AreaSummary {
    area: Area;
    totalTodos: number;
    pendingTodos: number;
    completionPercentage: number;
  }
  export function computeAreaSummaries(areas: Area[], todos: TodoItem[]): AreaSummary[];
  ```

- [ ] **Step 1: Write failing tests for `computeAreaSummaries`**
In `src/tests/dashboardData.test.ts`:
```typescript
describe('computeAreaSummaries', () => {
  it('calcula totales, pendientes y porcentaje de completitud por area', () => {
    const areas = [{ id: 'a1', profileId: 'p1', name: 'Estudios', color: '#8b5cf6', createdAt: '' }];
    const todos = [
      { id: 't1', profileId: 'p1', title: 'T1', areaId: 'a1', priority: 'alta', status: 'completada' as const },
      { id: 't2', profileId: 'p1', title: 'T2', areaId: 'a1', priority: 'media', status: 'pendiente' as const },
    ];
    const summaries = computeAreaSummaries(areas, todos);
    expect(summaries[0].totalTodos).toBe(2);
    expect(summaries[0].pendingTodos).toBe(1);
    expect(summaries[0].completionPercentage).toBe(50);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm exec vitest run src/tests/dashboardData.test.ts`
Expected: FAIL (function not found).

- [ ] **Step 3: Implement `computeAreaSummaries` in `src/components/dashboard/dashboardData.ts`**
Filter tasks by `areaId`, handle 0 total tasks without NaN (`total === 0 ? 0 : Math.round((completed / total) * 100)`).

- [ ] **Step 4: Update `DashboardView.tsx` and `DashboardView.module.css`**
Render section "Áreas Temáticas Clave" between "A un solo clic" and "Eventos de hoy / No olvidar":
- Grid de tarjetas mostrando color del área, nombre, badge de pendientes y botón "Ver área" que llama a `onNavigate('todo')`.
- Si no hay áreas, no rompe.

- [ ] **Step 5: Run tests for Dashboard**
Run: `pnpm exec vitest run src/tests/dashboardData.test.ts src/tests/DashboardView.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**
```bash
git add src/components/dashboard/dashboardData.ts src/components/DashboardView.tsx src/components/DashboardView.module.css src/tests/dashboardData.test.ts src/tests/DashboardView.test.tsx
git commit -m ":sparkles: feat(dashboard): incorporar seccion de areas tematicas clave segun stitch"
```

---

### Task 3: Componente unificado `QuickActionModal` ("+ Acción Rápida")

**Files:**
- Create: `src/components/quickAction/QuickActionModal.tsx`
- Create: `src/components/quickAction/QuickActionModal.module.css`
- Create: `src/tests/QuickActionModal.test.tsx`

**Interfaces:**
- Consumes:
  ```typescript
  interface QuickActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    profileId: string;
    onItemCreated?: (type: 'todo' | 'event') => void;
  }
  ```
- Produces: `StorageService.saveTodo(todo)` y `StorageService.saveEvent(event)` con feedback `sileo.success`.

- [ ] **Step 1: Write failing tests for `QuickActionModal`**
In `src/tests/QuickActionModal.test.tsx`:
- Renderiza diálogo cuando `isOpen` es true.
- Permite crear tarea rápida asignando título y área.
- Permite alternar a tab "Evento" y guardar evento con fecha y hora.
- Cierra con tecla Escape o botón de cancelar.

- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm exec vitest run src/tests/QuickActionModal.test.tsx`
Expected: FAIL (component not found).

- [ ] **Step 3: Implement `QuickActionModal`**
Implement modal with accessible dialog markup (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`), focus trap, tabs "Nueva Tarea" y "Nuevo Evento", CSS Modules with `--color-surface-card` and design tokens.

- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm exec vitest run src/tests/QuickActionModal.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add src/components/quickAction/QuickActionModal.tsx src/components/quickAction/QuickActionModal.module.css src/tests/QuickActionModal.test.tsx
git commit -m ":sparkles: feat(quick-action): implementar modal accesible de accion rapida"
```

---

### Task 4: Componente `ProfileSettingsModal` ("Ajustes & PIN")

**Files:**
- Create: `src/components/profile/ProfileSettingsModal.tsx`
- Create: `src/components/profile/ProfileSettingsModal.module.css`
- Create: `src/tests/ProfileSettingsModal.test.tsx`

**Interfaces:**
- Consumes:
  ```typescript
  interface ProfileSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    profile: Profile;
    onProfileUpdated: (updatedProfile: Profile) => void;
  }
  ```
- Uses: `hashPin(pin)`, `verifyPin(pin, hash, salt)` de `src/services/pinHash.ts`, `StorageService.saveProfile`.

- [ ] **Step 1: Write failing tests for `ProfileSettingsModal`**
In `src/tests/ProfileSettingsModal.test.tsx`:
- Muestra estado actual del perfil (acceso libre o protegido con PIN).
- Permite fijar un PIN nuevo (validando 4-6 dígitos numéricos).
- Si ya tiene PIN, solicita el PIN actual antes de cambiarlo o removerlo.
- Permite remover el PIN para dejar el perfil libre.

- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm exec vitest run src/tests/ProfileSettingsModal.test.tsx`
Expected: FAIL (component not found).

- [ ] **Step 3: Implement `ProfileSettingsModal`**
Implement dialog with safe PBKDF2 hashing, clear errors for mismatched PIN, touch target ≥ 44 px, and success notification.

- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm exec vitest run src/tests/ProfileSettingsModal.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add src/components/profile/ProfileSettingsModal.tsx src/components/profile/ProfileSettingsModal.module.css src/tests/ProfileSettingsModal.test.tsx
git commit -m ":sparkles: feat(perfiles): implementar modal de ajustes y gestion de pin"
```

---

### Task 5: Integración en `AppLayout` (Sidebar con Acción Rápida y Ajustes)

**Files:**
- Modify: `src/components/AppLayout.tsx`
- Modify: `src/components/AppLayout.module.css`
- Modify: `src/tests/AppLayout.test.tsx`

**Interfaces:**
- Consumes: `QuickActionModal`, `ProfileSettingsModal`.
- Produces:
  - Botón prominente `+ Acción Rápida` en Sidebar (debajo del logo/identidad).
  - Botón `Ajustes & PIN` en el footer del Sidebar.
  - Actualización del test en `AppLayout.test.tsx` ("no muestra controles de features que todavía no existen" se ajusta eliminando Acción Rápida y Ajustes de la lista de inexistentes).

- [ ] **Step 1: Update `AppLayout.test.tsx`**
Add tests asserting that clicking "+ Acción Rápida" opens the Quick Action dialog, and clicking "Ajustes & PIN" opens the settings dialog. Remove them from the forbidden list.

- [ ] **Step 2: Run test to verify failure**
Run: `pnpm exec vitest run src/tests/AppLayout.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Update `AppLayout.tsx` & `AppLayout.module.css`**
Wire state `isQuickActionOpen` and `isSettingsOpen`. Render the Stitch-styled "Acción Rápida" button and the "Ajustes & PIN" link in the sidebar footer.

- [ ] **Step 4: Run test to verify passes**
Run: `pnpm exec vitest run src/tests/AppLayout.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add src/components/AppLayout.tsx src/components/AppLayout.module.css src/tests/AppLayout.test.tsx
git commit -m ":sparkles: feat(layout): conectar accion rapida y ajustes de pin en sidebar de stitch"
```

---

### Task 6: Verificación de suite completa, lint y build

**Files:**
- All modified and newly created files.

- [ ] **Step 1: Run complete test suite**
Run: `pnpm exec vitest run`
Expected: 100% tests passing (all suites green).

- [ ] **Step 2: Run TypeScript check**
Run: `pnpm exec tsc -b`
Expected: 0 errors.

- [ ] **Step 3: Run linter**
Run: `pnpm lint`
Expected: 0 errors, 0 warnings.

- [ ] **Step 4: Run production build**
Run: `pnpm build`
Expected: Build passes cleanly with Vite.

- [ ] **Step 5: Update documentation / roadmap debt table**
In `docs/superpowers/plans/2026-10-10-stitch-redesign-roadmap.md`, mark "Acción Rápida" and "Ajustes & PIN" as resolved.
Commit:
```bash
git add docs/superpowers/plans/2026-10-10-stitch-redesign-roadmap.md
git commit -m ":memo: docs(roadmap): actualizar estado de deuda tecnica de stitch resuelta"
```
