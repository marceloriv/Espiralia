# TanStack Charts Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar la infraestructura de visualización de datos de `DashboardView` desde `chart.js` / `react-chartjs-2` a `@tanstack/charts` (v1.1.0) para asegurar longevidad arquitectónica, soporte SVG nativo y tipado TypeScript estricto.

**Architecture:** Reemplazar el motor imperativo Canvas de Chart.js por la gramática declarativa de `@tanstack/charts` renderizada en SVG. Encapsular la configuración de marcas y escalas en utilidades modulares dentro de `src/components/charts/`, actualizando `TaskCompletionChart` (pie/donut de progreso de tareas) y `CategoryDistributionChart` (barras agrupadas por categoría). Actualizar la configuración de bundling en `vite.config.ts` (`vendor-charts` con `@tanstack/charts` y submódulos D3) y remover dependencias obsoletas.

**Tech Stack:** React 19.2, TypeScript 5.8, Vite 8.3, `@tanstack/charts` (v1.1.0), Vitest 5.0, `@testing-library/react`.

**Spec:** Especificación de arquitectura a largo plazo acordada en sesión de brainstorming (`brainstorming: TanStack Charts migration in Espiralia`).

## Global Constraints

- Rama Git Flow: `feature/tanstack-charts-migration` nacida desde `develop` (o branch actual).
- Convención de commits: Conventional Commits v1.0.0 + Gitmoji obligatorio (`:sparkles:`, `:art:`, `:recycle:`, `:wrench:`, `:white_check_mark:`, `:fire:`).
- Ubicación de tests: exclusivamente en `src/tests/` (prohibido tests dispersos en `src/components/`).
- Calidad: 100% pruebas en verde con Vitest (`pnpm exec vitest run`), TypeScript build sin errores (`pnpm build`), linter limpio (`pnpm lint`).
- Cero regresiones visuales o de a11y: mantener títulos, `aria-label`, empty states (`sin tareas para graficar`, `sin actividades categorizadas`) y badges de porcentaje intactos.
- Rendimiento y bundle: aislar `@tanstack/charts` y dependencias `d3-*` en el chunk `vendor-charts` en `vite.config.ts`.

## Review Focus

1. **Empty States idénticos:** Cuando no hay tareas ni bloques en el perfil, los componentes deben renderizar el layout accesible de aviso sin inicializar instancias innecesarias de gráficos.
2. **Compatibilidad con React 19 y React Compiler:** Las definiciones de gráficos y datos deben ser puras y estables (memoizadas o derivadas dentro del render sin mutaciones impuras).
3. **Renderizado SVG en JSDOM:** `@tanstack/charts` renderiza nodos SVG reales en el DOM; verificar que los tests unitarios en Vitest encuentran los contenedores, etiquetas aria y elementos gráficos sin fallos de renderizado.
4. **Desinstalación limpia:** Eliminar `chart.js`, `react-chartjs-2` y `src/components/charts/chartSetup.ts` sin dejar imports huérfanos ni referencias en `setup.ts`.
5. **Aislamiento por perfil:** Al cambiar de `profileId`, los datos calculados de categorías y progreso deben reaccionar inmediatamente y redibujarse sin retener estado del perfil anterior.

---

### Task 1: Instalar `@tanstack/charts`, desinstalar dependencias anteriores y configurar Vite

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts:11-14`

**Interfaces:**
- Consumes: `@tanstack/charts` en dependencias de producción.
- Produces: chunk Rollup `vendor-charts` enfocado en `@tanstack/charts` y `d3-`.

- [ ] **Step 1: Instalar `@tanstack/charts` y remover `chart.js` + `react-chartjs-2`**

Ejecutar:
```bash
pnpm add @tanstack/charts
pnpm remove chart.js react-chartjs-2
```

- [ ] **Step 2: Actualizar `vite.config.ts` para agrupar `@tanstack/charts` y módulos `d3-` en `vendor-charts`**

Modificar `vite.config.ts`:
```ts
if (id.includes('node_modules/@tanstack/charts') || id.includes('node_modules/d3-')) {
  return 'vendor-charts';
}
```

- [ ] **Step 3: Verificar que el build compila y resuelve dependencias**

Run: `pnpm exec tsc -b`
Expected: PASS (o solo errores en archivos de gráficos existentes que aún importan `chart.js`).

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml vite.config.ts
git commit -m ":wrench: chore(charts): instalar @tanstack/charts y actualizar configuracion de vendor chunks en vite"
```

---

### Task 2: Migrar `TaskCompletionChart` a `@tanstack/charts` y actualizar sus tests

**Files:**
- Modify: `src/components/charts/TaskCompletionChart.tsx`
- Modify: `src/tests/TaskCompletionChart.test.tsx`

**Interfaces:**
- Consumes: `TodoItem` de `src/types`, `@tanstack/charts/react`, `@tanstack/charts/svg` o primitivas de `@tanstack/charts`.
- Produces: `<TaskCompletionChart todos={todos} />` exportado como React FC.

- [ ] **Step 1: Escribir tests actualizados en `src/tests/TaskCompletionChart.test.tsx`**

Asegurar cobertura de:
1. Renderizado de empty state cuando `todos.length === 0`.
2. Renderizado del ratio accesible (`cumplimiento de tareas: 1 de 2 completadas (50%)`) y badge de 50%.
3. Renderizado de 100% cuando todas las tareas están completadas.
4. Presencia del contenedor SVG generado por `@tanstack/charts`.

- [ ] **Step 2: Ejecutar test para verificar fallo previo a la reimplementación**

Run: `pnpm exec vitest run src/tests/TaskCompletionChart.test.tsx`
Expected: FAIL (imports obsoletos de `react-chartjs-2`).

- [ ] **Step 3: Reimplementar `TaskCompletionChart.tsx` con `@tanstack/charts`**

- Usar la definición declarativa de gráfico de `@tanstack/charts` (donut/pie mark) con renderer SVG.
- Conservar clases CSS de `TaskCompletionChart.module.css` (`chartCard`, `chartHeader`, `chartWrapper`, `percentageBadge`).
- Asignar colores Claude/Espiralia (`#5db872` completadas, `#e8a55a` pendientes).
- Mantener atributo `aria-label` en la tarjeta contenedora para accesibilidad óptima.

- [ ] **Step 4: Ejecutar test para verificar que pasa**

Run: `pnpm exec vitest run src/tests/TaskCompletionChart.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/charts/TaskCompletionChart.tsx src/tests/TaskCompletionChart.test.tsx
git commit -m ":sparkles: feat(charts): migrar TaskCompletionChart a @tanstack/charts con renderizado svg"
```

---

### Task 3: Migrar `CategoryDistributionChart` a `@tanstack/charts` y actualizar sus tests

**Files:**
- Modify: `src/components/charts/CategoryDistributionChart.tsx`
- Modify: `src/tests/CategoryDistributionChart.test.tsx`

**Interfaces:**
- Consumes: `TodoItem`, `PlannerBlock` de `src/types`, `@tanstack/charts` (bar mark, scales).
- Produces: `<CategoryDistributionChart todos={todos} planner={planner} />` exportado como React FC.

- [ ] **Step 1: Escribir tests actualizados en `src/tests/CategoryDistributionChart.test.tsx`**

Asegurar cobertura de:
1. Empty state cuando no hay actividades (`sin actividades categorizadas`).
2. Cálculo de actividades combinadas entre tareas y planner (`3 actividades`).
3. Cálculo cuando solo hay tareas (`1 actividad`).
4. Presencia de etiquetas y atributos de accesibilidad.

- [ ] **Step 2: Ejecutar test para verificar fallo**

Run: `pnpm exec vitest run src/tests/CategoryDistributionChart.test.tsx`
Expected: FAIL (imports de `react-chartjs-2`).

- [ ] **Step 3: Reimplementar `CategoryDistributionChart.tsx` con `@tanstack/charts`**

- Agrupar datos por categoría (`General`, `Trabajo`, `Planner`, etc.).
- Definir gráfico de barras con marcas `barY` y escalas de banda/lineales de `@tanstack/charts`.
- Conservar paleta de color (`#8E1EA2` tareas, `#5db8a6` planner).
- Preservar `aria-label` descriptivo en el contenedor.

- [ ] **Step 4: Ejecutar test para verificar que pasa**

Run: `pnpm exec vitest run src/tests/CategoryDistributionChart.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/charts/CategoryDistributionChart.tsx src/tests/CategoryDistributionChart.test.tsx
git commit -m ":sparkles: feat(charts): migrar CategoryDistributionChart a @tanstack/charts"
```

---

### Task 4: Limpieza de código obsoleto de Chart.js y verificación de suite completa

**Files:**
- Delete: `src/components/charts/chartSetup.ts`
- Delete: `src/tests/chartSetup.test.ts`
- Modify: `src/components/DashboardView.tsx:195-207` (actualizar comentarios y referencias a librerías)

**Interfaces:**
- Consumes: Nuevos componentes `TaskCompletionChart` y `CategoryDistributionChart`.
- Produces: Repositorio limpio sin código muerto de Chart.js.

- [ ] **Step 1: Eliminar archivos de setup de Chart.js**

Eliminar:
- `src/components/charts/chartSetup.ts`
- `src/tests/chartSetup.test.ts`

- [ ] **Step 2: Actualizar `src/components/DashboardView.tsx`**

Actualizar comentarios de la sección de métricas para reflejar `@tanstack/charts`.

- [ ] **Step 3: Ejecutar suite de pruebas completa en Vitest**

Run: `pnpm exec vitest run`
Expected: PASS (todos los tests de la suite en verde, sin regresiones).

- [ ] **Step 4: Ejecutar verificación de build y linter**

Run: `pnpm build && pnpm lint`
Expected: Build exitoso en `dist/`, tipos TypeScript 100% conformes, linter sin errores.

- [ ] **Step 5: Commit**

```bash
git add src/components/charts/chartSetup.ts src/tests/chartSetup.test.ts src/components/DashboardView.tsx
git commit -m ":fire: chore(charts): eliminar configuracion obsoleta de chartjs y verificar suite completa"
```
