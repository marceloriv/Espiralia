# To-Do con estados, áreas temáticas y fecha de vencimiento editable — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar en Espiralia la fase F4 con estados de tarea (`pendiente`, `en_progreso`, `completada`), áreas temáticas como entidad persistente, fecha de vencimiento editable en To-Do y resolución de menores diferidos de accesibilidad y diseño de F1–F3.

**Architecture:** Modificación modular de tipos y capa de persistencia en `StorageService` con migración transparente en lectura y borrado en cascada. Adaptación de consumidores existentes en Dashboard y gráficos. Rediseño de `TodoView` con barra superior de áreas, tarjetas de tarea estilo Stitch con controles accesibles de ≥ 44 px y modal de gestión de áreas.

**Tech Stack:** React 19.2, TypeScript, Vite, CSS Modules + tokens de `src/index.css`, Lucide React, Vitest + React Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-10-todo-areas-design.md`

## Global Constraints

- Sin backend. Todo dato en cliente particionado por `profileId` en `localStorage` (AGENTS.md §10 A01).
- Estilos únicamente con CSS Modules y tokens de `src/index.css` (AGENTS.md §5).
- Iconos exclusivamente de `lucide-react`. Sin dependencias externas adicionales.
- WCAG 2.2 AA: contraste ≥ 4.5:1, touch targets ≥ 44 px, navegable por teclado (AGENTS.md §23).
- Cobertura de rama ≥ 80% en lógica nueva y modificada, tests ubicados solo en `src/tests/` (AGENTS.md §7).
- Commits: Conventional Commits + Gitmoji en español (AGENTS.md §11).

## Review Focus

1. **Migración de esquema legado:** Perfiles existentes con tareas sin `status` ni `areaId` se abren sin error, mapeando `completed: true/false` y `category` de texto sin perder registros.
2. **Aislamiento entre perfiles:** Dos perfiles distintos no comparten áreas ni tareas, y borrar un perfil limpia sus claves `espiralia_${profileId}_areas` y `espiralia_${profileId}_todos` en cascada.
3. **Consumo retrocompatible en Dashboard y gráficos:** `isCritical`, `TaskCompletionChart` y `CategoryDistributionChart` reflejan fielmente las tareas con el nuevo esquema de estados y áreas.
4. **Touch targets y contraste:** Todos los checkboxes y botones en To-Do y Dashboard tienen área de interacción ≥ 44x44 px y textos secundarios con ratio ≥ 4.5:1.
5. **Formato regional de fecha en saludo:** El saludo del Dashboard no capitaliza cada palabra en la fecha ("miércoles, 10 de octubre de 2026" en lugar de "Miércoles, 10 De Octubre De 2026").

---

### Task 1: Modelos y Persistencia de Áreas y Tareas (TDD)

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/services/storage.ts`
- Modify: `src/tests/types.test.ts`
- Modify: `src/tests/storage.test.ts`

- [ ] **Step 1:** Actualizar tipos en `src/types/index.ts` definiendo `TaskStatus`, `Area` y actualizando `TodoItem` con `status`, `areaId` y `completed?`.
- [ ] **Step 2:** Escribir tests en `src/tests/types.test.ts` para verificar la instanciación válida de `Area` y `TodoItem` con estados y áreas.
- [ ] **Step 3:** Escribir tests en `src/tests/storage.test.ts` que fallen (RED):
  - `getAreas`: siembra áreas por defecto (`Trabajo`, `Personal`, `Estudio`, `General`) si está vacío.
  - `saveArea`: guarda y actualiza áreas aisladas por `profileId`.
  - `deleteArea`: borra un área y reasigna tareas huérfanas a la de respaldo.
  - `deleteProfile`: borra en cascada la clave de áreas `espiralia_${profileId}_areas`.
  - `getTodos`: migra tareas legadas con `completed: boolean` a `status: 'pendiente' | 'completada'` y mapea `category` string a `areaId`.
- [ ] **Step 4:** Implementar métodos `getAreas`, `saveArea`, `deleteArea`, cascada en `deleteProfile` y normalización migratoria en `getTodos` dentro de `src/services/storage.ts`.
- [ ] **Step 5:** Ejecutar `pnpm exec vitest run src/tests/storage.test.ts src/tests/types.test.ts` y verificar que pasen en verde (GREEN).
- [ ] **Step 6:** Commit: `:sparkles: feat(storage): agregar persistencia de areas tematicas y migracion de estados de tarea`.

---

### Task 2: Adaptación de Consumidores del Dashboard y Gráficos (TDD)

**Files:**
- Modify: `src/components/dashboard/dashboardData.ts`
- Modify: `src/components/DashboardView.tsx`
- Modify: `src/components/DashboardView.module.css`
- Modify: `src/components/charts/TaskCompletionChart.tsx`
- Modify: `src/components/charts/CategoryDistributionChart.tsx`
- Modify: `src/tests/dashboardData.test.ts`
- Modify: `src/tests/DashboardView.test.tsx`
- Modify: `src/tests/TaskCompletionChart.test.tsx`
- Modify: `src/tests/CategoryDistributionChart.test.tsx`

- [ ] **Step 1:** Escribir tests en `src/tests/dashboardData.test.ts` y `src/tests/DashboardView.test.tsx` que fallen (RED) para:
  - Tareas críticas identificadas con `status !== 'completada' && priority === 'alta'`.
  - Formato de fecha del saludo en minúsculas naturales en español ("miércoles, 10 de octubre de 2026").
  - Checkbox de crítico en Dashboard con touch target accesible de ≥ 44 px.
- [ ] **Step 2:** Actualizar `isCritical` en `src/components/dashboard/dashboardData.ts` para considerar `status !== 'completada'` (y fallback `!todo.completed`).
- [ ] **Step 3:** Actualizar el formateador de fecha de cabecera en `src/components/DashboardView.tsx` para evitar `replace(/\b\w/g, ...)` forzado y garantizar minúsculas en días/meses según gramática española.
- [ ] **Step 4:** Ajustar estilos de la casilla de completado en `src/components/DashboardView.module.css` para garantizar touch target de al menos 44 px.
- [ ] **Step 5:** Actualizar `TaskCompletionChart.tsx` para calcular completadas considerando `status === 'completada' || t.completed`.
- [ ] **Step 6:** Actualizar `CategoryDistributionChart.tsx` para resolver el nombre del área o categoría asociada a cada tarea.
- [ ] **Step 7:** Ejecutar tests de dashboard y gráficos (`pnpm exec vitest run src/tests/dashboardData.test.ts src/tests/DashboardView.test.tsx src/tests/TaskCompletionChart.test.tsx src/tests/CategoryDistributionChart.test.tsx`) y verificar que pasen en verde.
- [ ] **Step 8:** Commit: `:recycle: refactor(dashboard): adaptar criticos y graficos al esquema de estados y corregir fecha y touch target`.

---

### Task 3: Componente TodoView: Áreas, Estados, Vencimiento y Accesibilidad (TDD)

**Files:**
- Modify: `src/components/TodoView.tsx`
- Modify: `src/components/TodoView.module.css`
- Modify: `src/tests/TodoView.test.tsx`

- [ ] **Step 1:** Escribir tests en `src/tests/TodoView.test.tsx` que fallen (RED):
  - Renderizado de chips/tarjetas de áreas superiores con conteo de tareas activas.
  - Filtrado por área seleccionada y por estado (`Todas`, `Pendientes`, `En Progreso`, `Completadas`).
  - Creación de tarea asignando área, prioridad y fecha de vencimiento (`dueDate`).
  - Alternancia rápida de estado entre `pendiente` y `completada` usando el checkbox accesible (≥ 44 px).
  - Marcado de tarea como `en_progreso` al interactuar con el chip de estado.
  - Edición / asignación / eliminación de fecha de vencimiento desde la fila de tarea.
  - Apertura de modal para crear nueva área temática con nombre y color, persistiendo en el perfil activo.
  - Aislamiento entre dos perfiles diferentes.
- [ ] **Step 2:** Implementar la interfaz y lógica en `src/components/TodoView.tsx`:
  - Estado local de áreas (`StorageService.getAreas(profileId)`).
  - Filtro activo por área y por estado de tarea.
  - Formulario de creación rápida con campos de área, prioridad y fecha de vencimiento.
  - Renderizado de tarjetas de tarea estilo Stitch:
    - Contenedor de checkbox de 44x44 px.
    - Pill de estado con clic para cambiar a `en_progreso` o alternar.
    - Pill de fecha de vencimiento interactiva.
    - Badge de prioridad.
  - Modal accesible para crear y gestionar áreas.
- [ ] **Step 3:** Actualizar `src/components/TodoView.module.css` con tokens de `src/index.css`:
  - Touch targets de 44 px en checkboxes y botones interactivos.
  - Ratios de contraste ≥ 4.5:1 en textos secundarios y badges.
  - Animaciones y transiciones sutiles según diseño Stitch.
- [ ] **Step 4:** Ejecutar `pnpm exec vitest run src/tests/TodoView.test.tsx` y verificar que todos los tests pasen en verde (GREEN).
- [ ] **Step 5:** Commit: `:sparkles: feat(todo): rediseñar todoview con areas tematicas estados vencimiento y accesibilidad`.

---

### Task 4: Verificación Integral, Build y Cobertura (AAA)

**Files:**
- Run: `src/tests/` (suite completa)
- Check: `pnpm build` (typecheck y tamaño de bundle)

- [ ] **Step 1:** Ejecutar suite completa con `pnpm exec vitest run`. Verificar 0 fallos.
- [ ] **Step 2:** Ejecutar `pnpm build` para validar chequeo estricto de TypeScript y verificar que el build de producción genere bundle sin errores.
- [ ] **Step 3:** Commit final: `:white_check_mark: test(todo): verificar suite completa y build de produccion para f4`.
