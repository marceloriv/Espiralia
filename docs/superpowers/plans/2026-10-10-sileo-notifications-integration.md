# Sileo Notifications Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrar el sistema de notificaciones toast fluidas con `sileo` en todas las interacciones críticas de Espiralia (perfiles, tareas, planner, agenda y sesión) para brindar feedback interactivo visual inmediato.

**Architecture:** Se monta un componente raíz `<Toaster position="top-right" />` en `src/App.tsx` con sus estilos globales `"sileo/styles.css"`. Las vistas (`ProfileGateView`, `TodoView`, `PlannerView`, `AgendaView`, `AppLayout`) disparan notificaciones imperativas tipadas (`sileo.success`, `sileo.error`, `sileo.info`) en cada acción de mutación del usuario.

**Tech Stack:** React 19, TypeScript, `sileo` (con `motion` de fondo), CSS Modules, Vitest + Testing Library.

**Spec:** `Feedback.txt` y requerimientos de feedback visual interactivo en cliente para Espiralia.

## Global Constraints

- Gestor de paquetes: `pnpm` exclusivamente.
- Sin backend ni dependencias de red: las alertas son 100% locales al cliente.
- Convenciones de commits: Conventional Commits con Gitmoji obligatorio (`AGENTS.md`) sin firmas de IA.
- Suite de pruebas unificada: Todos los tests deben permanecer en `src/tests/` y pasar al 100% en verde (`pnpm exec vitest run`).
- Conservar score 100/100 en `react-doctor` (sin dependencias omitidas en hooks, con accesibilidad y lazy state intactos).

## Review Focus

1. **JSDOM Animation Safety**: `sileo` depende de `motion`; en entorno de test JSDOM, los mocks controlados de `sileo` (`sileo.success`, `sileo.error`, `sileo.info`) deben asegurar que las llamadas se validen sin romper por APIs de layout no implementadas.
2. **Quota / Error Handling**: Si una operación en `StorageService` o entrada de usuario falla, disparar `sileo.error` informativo en lugar de silenciar el fallo.
3. **Frecuencia de Notificaciones**: Al alternar completado de una tarea o bloque, no acumular toasts duplicados en ráfaga.
4. **Contraste y Estilos**: Importar `"sileo/styles.css"` en la raíz para que el contenedor renderice con la tipografía y tokens de Espiralia sin desfasar el layout.
5. **Aislamiento por Perfil**: Los eventos de notificación ocurren en el contexto de la acción activa y no dejan residuos al cambiar o bloquear de perfil.

---

### Task 1: Instalar `sileo`, Configurar `<Toaster />` y Tokens CSS en `src/index.css`

**Files:**
- Modify: `package.json`
- Modify: `src/index.css`
- Modify: `src/App.tsx:1-36`
- Test: `src/tests/App.test.tsx`

**Interfaces:**
- Consumes: `pnpm add sileo`, tokens de Espiralia en `src/index.css`
- Produces: `<Toaster position="top-right" />` montado en `src/App.tsx`, tokens de estado de `sileo` (`--sileo-state-*`, `--sileo-width`, `--sileo-height`, `--sileo-duration`) en `src/index.css` armonizados con la paleta de Espiralia/Claude, y notificación de bienvenida `sileo.success` en `handleSelectProfile`.

- [ ] **Step 1: Instalar dependencia de producción**
Run: `pnpm add sileo`
Expected: paquete agregado a `dependencies` en `package.json` y `pnpm-lock.yaml` actualizado.

- [ ] **Step 2: Configurar tokens CSS de Sileo en `src/index.css`**
Agregar a `:root` en `src/index.css`:
```css
  /* Sileo Toast Design Tokens */
  --sileo-state-success: var(--color-success); /* oklch(0.723 0.219 142.136) / #5db872 */
  --sileo-state-loading: var(--color-muted);
  --sileo-state-error: var(--color-error); /* oklch(0.637 0.237 25.331) / #c64545 */
  --sileo-state-warning: var(--color-warning); /* oklch(0.795 0.184 86.047) / #d4a017 */
  --sileo-state-info: var(--color-primary); /* Espiralia violet brand #8E1EA2 */
  --sileo-state-action: var(--color-primary-active);

  /* Dimensions & animation */
  --sileo-width: 350px;
  --sileo-height: 40px;
  --sileo-duration: 600ms;
```

- [ ] **Step 3: Escribir prueba para presencia de Toaster y notificación al iniciar sesión**
En `src/tests/App.test.tsx`, espiar `sileo.success` y verificar que al invocar `handleSelectProfile` se dispare el toast de bienvenida y que `App` monte `Toaster` sin errores.

- [ ] **Step 4: Ejecutar prueba para verificar falla**
Run: `pnpm exec vitest run src/tests/App.test.tsx`
Expected: FAIL antes de integrar `sileo`.

- [ ] **Step 5: Configurar `Toaster`, estilos y bienvenida en `src/App.tsx`**
```tsx
import { Toaster, sileo } from 'sileo';
import 'sileo/styles.css';

// En handleSelectProfile:
const handleSelectProfile = (profile: Profile) => {
  StorageService.setActiveProfileId(profile.id);
  setActiveProfile(profile);
  sileo.success(`Sesión iniciada: ¡Hola, ${profile.name}!`);
};
```
Agregar `<Toaster position="top-right" />` dentro de `HashRouter`.

- [ ] **Step 6: Ejecutar prueba para confirmar verde**
Run: `pnpm exec vitest run src/tests/App.test.tsx`
Expected: PASS

- [ ] **Step 7: Commit**
```bash
git add package.json pnpm-lock.yaml src/index.css src/App.tsx src/tests/App.test.tsx
git commit -m ":sparkles: feat: integrar toaster de sileo con tokens de diseno personalizados y bienvenida al login"
```

---

### Task 2: Notificaciones en `ProfileGateView` (Creación, Validación de PIN y Eliminación)

**Files:**
- Modify: `src/components/ProfileGateView.tsx`
- Test: `src/tests/ProfileGateView.test.tsx`

**Interfaces:**
- Consumes: `sileo.success(msg)`, `sileo.error(msg)`, `sileo.info(msg)` desde `'sileo'`.
- Produces: Feedback toast ante creación de perfil (`sileo.success`), rechazo de PIN incorrecto (`sileo.error`) y eliminación de perfil (`sileo.info`).

- [ ] **Step 1: Escribir pruebas unitarias con espía de `sileo`**
En `src/tests/ProfileGateView.test.tsx`, espiar `sileo.success`, `sileo.error` y `sileo.info` para verificar que se invocan al crear perfil, al ingresar PIN erróneo y al eliminar un perfil.

- [ ] **Step 2: Ejecutar prueba para verificar falla**
Run: `pnpm exec vitest run src/tests/ProfileGateView.test.tsx`
Expected: FAIL porque `sileo` aún no se invoca en `ProfileGateView`.

- [ ] **Step 3: Implementar llamadas `sileo` en `src/components/ProfileGateView.tsx`**
- Al crear perfil: `sileo.success(`Perfil "${name.trim()}" creado`);`
- Al fallar PIN en verificación de login: `sileo.error('PIN incorrecto');`
- Al eliminar perfil: `sileo.info('Perfil eliminado');`

- [ ] **Step 4: Ejecutar prueba para confirmar verde**
Run: `pnpm exec vitest run src/tests/ProfileGateView.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/components/ProfileGateView.tsx src/tests/ProfileGateView.test.tsx
git commit -m ":sparkles: feat(perfiles): agregar notificaciones toast en creacion y autenticacion con pin"
```

---

### Task 3: Notificaciones en `TodoView` (Creación, Estado y Eliminación de Tareas)

**Files:**
- Modify: `src/components/TodoView.tsx`
- Test: `src/tests/TodoView.test.tsx`

**Interfaces:**
- Consumes: `sileo.success`, `sileo.info` desde `'sileo'`.
- Produces: Feedback toast al agregar tarea (`sileo.success`), al marcar completada/pendiente (`sileo.info`) y al eliminarla (`sileo.success`).

- [ ] **Step 1: Escribir pruebas unitarias con espías en `src/tests/TodoView.test.tsx`**
Validar que agregar y eliminar tareas invoca `sileo.success`.

- [ ] **Step 2: Ejecutar prueba para verificar falla**
Run: `pnpm exec vitest run src/tests/TodoView.test.tsx`
Expected: FAIL antes de integrar `sileo`.

- [ ] **Step 3: Implementar llamadas `sileo` en `src/components/TodoView.tsx`**
- `handleCreateTodo`: `sileo.success('Tarea agregada exitosamente');`
- `handleToggleComplete`: `sileo.info(target.completed ? 'Tarea reabierta' : 'Tarea completada');`
- `handleDeleteTodo`: `sileo.success('Tarea eliminada');`

- [ ] **Step 4: Ejecutar prueba para confirmar verde**
Run: `pnpm exec vitest run src/tests/TodoView.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/components/TodoView.tsx src/tests/TodoView.test.tsx
git commit -m ":sparkles: feat(tareas): agregar notificaciones toast al crear completar y eliminar tareas"
```

---

### Task 4: Notificaciones en `PlannerView` (Bloques de Tiempo)

**Files:**
- Modify: `src/components/PlannerView.tsx`
- Test: `src/tests/PlannerView.test.tsx`

**Interfaces:**
- Consumes: `sileo.success`, `sileo.info` desde `'sileo'`.
- Produces: Notificaciones toast ante creación de bloque, toggle completado y eliminación.

- [ ] **Step 1: Escribir pruebas unitarias en `src/tests/PlannerView.test.tsx`**
Verificar invocación de `sileo.success` al guardar bloque de planificación y al eliminar bloque.

- [ ] **Step 2: Ejecutar prueba para verificar falla**
Run: `pnpm exec vitest run src/tests/PlannerView.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implementar llamadas `sileo` en `src/components/PlannerView.tsx`**
- Al crear bloque: `sileo.success('Bloque de enfoque guardado');`
- Al toggle completado: `sileo.info(target.completed ? 'Bloque reabierto' : 'Bloque completado');`
- Al eliminar bloque: `sileo.success('Bloque eliminado');`

- [ ] **Step 4: Ejecutar prueba para confirmar verde**
Run: `pnpm exec vitest run src/tests/PlannerView.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/components/PlannerView.tsx src/tests/PlannerView.test.tsx
git commit -m ":sparkles: feat(planner): agregar notificaciones toast al gestionar bloques de enfoque"
```

---

### Task 5: Notificaciones en `AgendaView` (Eventos del Calendario)

**Files:**
- Modify: `src/components/AgendaView.tsx`
- Test: `src/tests/AgendaView.test.tsx`

**Interfaces:**
- Consumes: `sileo.success` desde `'sileo'`.
- Produces: Notificaciones toast ante creación y eliminación de eventos en la agenda.

- [ ] **Step 1: Escribir pruebas unitarias en `src/tests/AgendaView.test.tsx`**
Verificar invocación de `sileo.success` al agendar evento y al eliminarlo.

- [ ] **Step 2: Ejecutar prueba para verificar falla**
Run: `pnpm exec vitest run src/tests/AgendaView.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implementar llamadas `sileo` en `src/components/AgendaView.tsx`**
- `handleAddEvent`: `sileo.success('Evento agendado con éxito');`
- `handleDeleteEvent`: `sileo.success('Evento eliminado');`

- [ ] **Step 4: Ejecutar prueba para confirmar verde**
Run: `pnpm exec vitest run src/tests/AgendaView.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/components/AgendaView.tsx src/tests/AgendaView.test.tsx
git commit -m ":sparkles: feat(agenda): agregar notificaciones toast al agendar y eliminar eventos"
```

---

### Task 6: Notificaciones en `AppLayout` (Sesión y Bloqueo de Perfil)

**Files:**
- Modify: `src/components/AppLayout.tsx`
- Test: `src/tests/AppLayout.test.tsx`

**Interfaces:**
- Consumes: `sileo.info` desde `'sileo'`.
- Produces: Notificación toast cuando el usuario cambia de perfil o bloquea su sesión.

- [ ] **Step 1: Escribir pruebas unitarias en `src/tests/AppLayout.test.tsx`**
Verificar llamada a `sileo.info` al accionar el bloqueo de perfil o cambio de perfil.

- [ ] **Step 2: Ejecutar prueba para verificar falla**
Run: `pnpm exec vitest run src/tests/AppLayout.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implementar en `src/components/AppLayout.tsx`**
Disparar `sileo.info('Sesión cerrada');` en `onLockProfile`.

- [ ] **Step 4: Ejecutar prueba para confirmar verde**
Run: `pnpm exec vitest run src/tests/AppLayout.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/components/AppLayout.tsx src/tests/AppLayout.test.tsx
git commit -m ":sparkles: feat(layout): notificar cierre de sesion con toast informativa"
```

---

### Task 7: Verificación Global de la Suite, Compilación y React Doctor

**Files:**
- Verification: Todos los archivos modificados.

- [ ] **Step 1: Ejecutar suite unificada de pruebas**
Run: `pnpm exec vitest run`
Expected: 100% de tests en verde (mínimo 33+ pruebas pasando).

- [ ] **Step 2: Ejecutar compilación de bundle de producción**
Run: `pnpm build`
Expected: Build exitoso sin errores de tipos TypeScript ni advertencias de Vite.

- [ ] **Step 3: Ejecutar auditoría de React Doctor**
Run: `npx --yes react-doctor@latest -y --verbose`
Expected: Score de 100/100 mantenido.

- [ ] **Step 4: Integración en Git Flow**
Fusionar la rama de feature en `develop` con `--no-ff`.
