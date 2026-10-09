# Espiralia Antislop UI & Mobile Hardening Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicar las reglas de antislop-ui y antislop-layoutmobile en la interfaz de Espiralia: reflow móvil responsivo con bottom navigation bar, tap targets de 44px, empty states accionables y contraste WCAG 2.2 AA sin decoraciones artificiales.

**Architecture:** Refactorización orientada a diseño responsivo de componentes React existentes con CSS Modules, media queries fluidas y tokens de diseño oficiales de Claude/Espiralia en `src/index.css`.

**Tech Stack:** React 19, TypeScript, CSS Modules, Vitest, React Testing Library, Lucide React.

**Spec:** `docs/superpowers/specs/2026-10-09-mvp-pages-design.md`, `DESIGN.md` y reglas `antislop-ui` / `antislop-layoutmobile`.

## Global Constraints

- Colores oficiales: `--color-primary: #8E1EA2`, `--color-canvas: #faf9f5`, `--color-ink: #141413`.
- Tap targets interactivos: mínimo 44 x 44 px en cualquier control móvil (R-03).
- Cero scroll horizontal (`overflow-x: hidden`) garantizado en anchos desde 320px hasta desktop (R-03).
- Cero gradientes genéricos, brillos difusos o elementos decorativos sin función semántica (R-01, R-13).
- Commits obligatorios con formato Gitmoji según `AGENTS.md` (`:art:`, `:sparkles:`, `:white_check_mark:`).

## Review Focus

1. **Navegación móvil accesible:** En pantallas móviles (<768px), el usuario debe poder navegar y además cerrar sesión / cambiar de perfil sin depender del sidebar desktop.
2. **Tap targets de calendario:** Cada celda de día en `AgendaView` debe medir al menos 44px de área táctil con espaciado adecuado para evitar pulsaciones erróneas.
3. **Empty states informativos:** Al no haber datos en Agenda, Planner o To-Do, el mensaje debe explicar qué hacer en lugar de mostrar textos genéricos vacíos.
4. **Formularios en móviles:** Los formularios de creación en To-Do y Planner deben apilarse verticalmente en pantallas <640px sin forzar desbordamiento lateral.
5. **Contraste de badges:** Las etiquetas de prioridad deben mantener un contraste mínimo de 4.5:1 con el texto.

---

### Task 1: Reflow Móvil y Botón de Perfil en AppLayout

**Files:**
- Modify: `src/components/AppLayout.tsx`
- Modify: `src/components/AppLayout.module.css`
- Modify: `src/tests/AppLayout.test.tsx`

**Interfaces:**
- Consumes: `Profile`, `ViewType` de `src/types`.
- Produces: `AppLayout` con barra inferior móvil que incluye botón accesible para cambiar de perfil.

- [x] **Step 1: Escribir test para validar botón de perfil accesible en layout**

Actualizar `src/tests/AppLayout.test.tsx` verificando que el botón de cambiar perfil esté presente y sea operable tanto en modo escritorio como móvil.

- [x] **Step 2: Ejecutar test para verificar estado**

Run: `pnpm exec vitest run src/tests/AppLayout.test.tsx`

- [x] **Step 3: Implementar botón de perfil en el header móvil de `AppLayout.tsx` y ajustar CSS**

Añadir en el header superior derecho un botón compacto con el avatar del usuario y tooltip/aria-label "Cambiar perfil" visible en pantallas móviles.

- [x] **Step 4: Ejecutar test y verificar que pasa**

Run: `pnpm exec vitest run src/tests/AppLayout.test.tsx`
Expected: PASS

- [x] **Step 5: Commit con Gitmoji**

```bash
git add src/components/AppLayout* src/tests/AppLayout.test.tsx
git commit -m ":art: style(layout): agregar acceso movil a perfiles y optimizar bottom nav"
```

---

### Task 2: Optimización Móvil y Tap Targets en AgendaView

**Files:**
- Modify: `src/components/AgendaView.module.css`
- Modify: `src/tests/AgendaView.test.tsx`

**Interfaces:**
- Consumes: `profileId: string`.
- Produces: `AgendaView` con cuadrícula de calendario táctil de mínimo 44x44px por celda y reflow de panel en móvil.

- [x] **Step 1: Escribir test de accesibilidad táctil y apilamiento en `AgendaView.test.tsx`**

Verificar que los botones de navegación de mes y selección de día tengan atributos de accesibilidad y nombres legibles.

- [x] **Step 2: Implementar estilos móviles en `AgendaView.module.css`**

Ajustar `min-height: 44px; min-width: 44px` en `.dayCell`, agregar `touch-action: manipulation` y asegurar que `.layoutGrid` colapse ordenadamente en pantallas menores a 768px.

- [x] **Step 3: Ejecutar test y verificar que pasa**

Run: `pnpm exec vitest run src/tests/AgendaView.test.tsx`
Expected: PASS

- [x] **Step 4: Commit con Gitmoji**

```bash
git add src/components/AgendaView.module.css src/tests/AgendaView.test.tsx
git commit -m ":art: style(agenda): asegurar tap targets de 44px y reflow apilado en calendario"
```

---

### Task 3: Empty States Accionables y Contraste de Badges en TodoView

**Files:**
- Modify: `src/components/TodoView.tsx`
- Modify: `src/components/TodoView.module.css`
- Modify: `src/tests/TodoView.test.tsx`

**Interfaces:**
- Consumes: `TodoItem` de `src/types`.
- Produces: `TodoView` con mensajes de estado vacío contextuales y colores de badge con contraste verificado.

- [x] **Step 1: Escribir test en `src/tests/TodoView.test.tsx` para validar empty states accionables**

Verificar que cuando no haya tareas pendientes o completadas, el mensaje explique claramente la acción sugerida.

- [x] **Step 2: Implementar mejoras en `TodoView.tsx` y `TodoView.module.css`**

Reemplazar mensaje estático por mensajes dinámicos según el filtro activo ("No tienes tareas pendientes. ¡Buen trabajo!" o "Aún no has agregado tareas. Usa el formulario arriba para empezar"). Ajustar colores de texto y fondo de badges para asegurar contraste 4.5:1.

- [x] **Step 3: Ejecutar test y verificar que pasa**

Run: `pnpm exec vitest run src/tests/TodoView.test.tsx`
Expected: PASS

- [x] **Step 4: Commit con Gitmoji**

```bash
git add src/components/TodoView* src/tests/TodoView.test.tsx
git commit -m ":sparkles: feat(tareas): incorporar empty states accionables y alto contraste"
```

---

### Task 4: Empty States y Adaptabilidad Móvil en PlannerView

**Files:**
- Modify: `src/components/PlannerView.tsx`
- Modify: `src/components/PlannerView.module.css`
- Modify: `src/tests/PlannerView.test.tsx`

**Interfaces:**
- Consumes: `PlannerBlock` de `src/types`.
- Produces: `PlannerView` con soporte touch optimizado y mensajes de ayuda por franja horaria.

- [x] **Step 1: Escribir test en `src/tests/PlannerView.test.tsx`**

Verificar renderizado correcto de empty states interactivos por cada sección de tiempo.

- [x] **Step 2: Implementar mejoras en `PlannerView.tsx` y `PlannerView.module.css`**

Optimizar botones de selector semanal/mensual con tamaño táctil adecuado y texto explicativo en franjas sin bloques.

- [x] **Step 3: Ejecutar test y verificar que pasa**

Run: `pnpm exec vitest run src/tests/PlannerView.test.tsx`
Expected: PASS

- [x] **Step 4: Commit con Gitmoji**

```bash
git add src/components/PlannerView* src/tests/PlannerView.test.tsx
git commit -m ":art: style(planner): optimizar controles tactiles y estados vacios por franja"
```

---

### Task 5: Verificación Integral de Suite y Build de Producción

**Files:**
- Verify: Toda la suite de `src/tests/`
- Verify: `pnpm build`

- [x] **Step 1: Ejecutar la suite completa de pruebas**

Run: `pnpm exec vitest run`
Expected: 100% de suites pasando.

- [x] **Step 2: Ejecutar el build de producción**

Run: `pnpm build`
Expected: Generación de bundle limpio en `dist/` sin advertencias.

- [x] **Step 3: Commit final con Gitmoji si hubo ajustes**

```bash
git commit --allow-empty -m ":white_check_mark: test: verificar suite completa y build de produccion tras endurecimiento ui"
```
