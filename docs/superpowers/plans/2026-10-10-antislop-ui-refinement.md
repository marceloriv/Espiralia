# Antislop-UI Polish & Elevation Tokens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unificar el sistema de elevaciones y sombras en tokens de diseño centralizados, eliminar estilos huérfanos y enriquecer los estados vacíos y de foco según las directrices de `antislop-ui` sin alterar la lógica de negocio ni romper tests existentes.

**Architecture:** Centralizar tokens de sombra y foco en `src/index.css` (`--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--focus-ring`), reemplazar valores `rgba` arbitrarios en CSS Modules (`AppLayout`, `ProfileGateView`, `PlannerView`, `TodoView`), remover el archivo muerto `src/App.css`, hacer que los empty states de gráficos orienten al usuario a la acción inmediata (R-27), y proteger la animación de carga contra `prefers-reduced-motion`.

**Tech Stack:** React 19.2, TypeScript 5.8, CSS Modules, Vitest 3.x, `@testing-library/react`.

**Spec:** Directrices visuales y de diseño de `antislop-ui` (R-11 bordes, R-12 elevación y sombras, R-19/R-28 movimiento, R-27 estados vacíos contextuales, R-38 eliminación de artefactos no utilizados).

## Global Constraints

- Cero cambios en la API pública de `StorageService` ni en los tipos de dominio (`Area`, `TodoItem`, `AgendaEvent`, `PlannerBlock`, `Profile`).
- No introducir dependencias externas nuevas (reutilizar tokens CSS y Lucide React).
- Toda sombra debe provenir de tokens CSS de `src/index.css`.
- Preservar WCAG 2.2 AA: contraste de texto ≥ 4.5:1, objetivos táctiles ≥ 44 px, `prefers-reduced-motion` respetado.
- La suite completa de pruebas debe permanecer en 100% verde (≥ 193 tests).
- Commits siguiendo Conventional Commits + Gitmoji en español (AGENTS.md §11.2) sin firmas de IA.

## Review Focus

- `src/App.css` huérfano eliminado sin romper importaciones en runtime ni builds de Vite.
- Foco visible en selector de áreas y filtros de estado operable completamente por teclado.
- Empty states en gráficos de TanStack proporcionan guía de acción clara sin romper selectores accesibles de tests existentes.
- Spinner de carga en `RouteLoadingFallback` respeta `prefers-reduced-motion: reduce`.
- Tokens de sombra funcionan de forma idéntica en fondos claros y superficies elevadas.

---

### Task 1: Tokens Centralizados de Elevación y Limpieza de Código Muerto

**Files:**
- Modify: `src/index.css:35-50`
- Delete: `src/App.css`
- Test: `src/tests/antislopTokens.test.ts`

**Interfaces:**
- Produces: CSS custom properties `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--focus-ring` en `:root`.

- [ ] **Step 1: Escribir el test que valida presencia de tokens en index.css y ausencia de App.css**

```typescript
// src/tests/antislopTokens.test.ts
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Antislop UI design tokens contract', () => {
  it('define tokens de elevación y foco en index.css', () => {
    const cssPath = path.resolve(__dirname, '../index.css');
    const content = fs.readFileSync(cssPath, 'utf-8');

    expect(content).toContain('--shadow-sm');
    expect(content).toContain('--shadow-md');
    expect(content).toContain('--shadow-lg');
    expect(content).toContain('--focus-ring');
  });

  it('no contiene archivo huérfano App.css', () => {
    const appCssPath = path.resolve(__dirname, '../App.css');
    expect(fs.existsSync(appCssPath)).toBe(false);
  });
});
```

- [ ] **Step 2: Ejecutar el test para comprobar que falla**

Run: `pnpm exec vitest run src/tests/antislopTokens.test.ts`
Expected: FAIL (`--shadow-sm` not found o `App.css` exists).

- [ ] **Step 3: Declarar tokens en `src/index.css` y eliminar `src/App.css`**

En `:root` de `src/index.css`, añadir:
```css
  /* Elevación y sombras antislop (R-12) */
  --shadow-sm: 0 1px 3px rgba(20, 20, 19, 0.06);
  --shadow-md: 0 4px 12px rgba(20, 20, 19, 0.08);
  --shadow-lg: 0 12px 32px rgba(20, 20, 19, 0.14);
  --focus-ring: 0 0 0 2px var(--color-bg), 0 0 0 4px var(--color-primary);
```
Eliminar `src/App.css`.

- [ ] **Step 4: Ejecutar test para comprobar que pasa**

Run: `pnpm exec vitest run src/tests/antislopTokens.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/index.css src/tests/antislopTokens.test.ts
git rm src/App.css
git commit -m ":art: style(tokens): unificar tokens de elevacion y eliminar estilos huerfanos"
```

---

### Task 2: Migración de Sombras y Enfoque Accesible en Componentes

**Files:**
- Modify: `src/components/AppLayout.module.css:15-30,90-105`
- Modify: `src/components/ProfileGateView.module.css:30-40,130-145`
- Modify: `src/components/PlannerView.module.css:40-50`
- Modify: `src/components/TodoView.module.css:120-135,570-590`
- Test: `src/tests/antislopTokens.test.ts`

**Interfaces:**
- Consumes: `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--focus-ring` desde `src/index.css`.
- Produces: estilos CSS Modules libres de `box-shadow` con `rgba(...)` arbitrarios.

- [ ] **Step 1: Escribir test que verifique el consumo de tokens en los módulos de estilo**

En `src/tests/antislopTokens.test.ts`, añadir:
```typescript
  it('componentes principales consumen tokens de elevación en vez de sombras arbitrarias', () => {
    const modules = [
      '../components/AppLayout.module.css',
      '../components/ProfileGateView.module.css',
      '../components/PlannerView.module.css',
      '../components/TodoView.module.css',
    ];

    for (const relPath of modules) {
      const fullPath = path.resolve(__dirname, relPath);
      const content = fs.readFileSync(fullPath, 'utf-8');
      expect(content).not.toMatch(/box-shadow:\s*0\s+\d+px\s+\d+px\s+rgba/);
    }
  });
```

- [ ] **Step 2: Ejecutar test para verificar que falla**

Run: `pnpm exec vitest run src/tests/antislopTokens.test.ts`
Expected: FAIL (detecta valores arbitrarios en los archivos CSS Modules).

- [ ] **Step 3: Reemplazar sombras arbitrarias por tokens en los 4 módulos CSS**

- En `AppLayout.module.css`: reemplazar `box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15)` por `box-shadow: var(--shadow-md)`.
- En `ProfileGateView.module.css`: reemplazar sombras por `var(--shadow-sm)` y `var(--shadow-lg)`.
- En `PlannerView.module.css`: reemplazar `box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06)` por `var(--shadow-sm)`.
- En `TodoView.module.css`: reemplazar `box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18)` por `var(--shadow-lg)` en el modal dialog.

- [ ] **Step 4: Ejecutar test para verificar que pasa**

Run: `pnpm exec vitest run src/tests/antislopTokens.test.ts`
Expected: PASS.

- [ ] **Step 5: Ejecutar suite de componentes visuales para asegurar cero regresiones**

Run: `pnpm exec vitest run src/tests/AppLayout.test.tsx src/tests/ProfileGateView.test.tsx src/tests/PlannerView.test.tsx src/tests/TodoView.test.tsx`
Expected: PASS (todos en verde).

- [ ] **Step 6: Commit**

```bash
git add src/components/*.module.css src/tests/antislopTokens.test.ts
git commit -m ":recycle: refactor(styles): migrar sombras de componentes a tokens de elevacion"
```

---

### Task 3: Enriquecimiento de Empty States y Reducción de Movimiento

**Files:**
- Modify: `src/components/charts/CategoryDistributionChart.tsx:12-25`
- Modify: `src/components/charts/TaskCompletionChart.tsx:10-22`
- Modify: `src/components/RouteLoadingFallback.module.css:15-30`
- Test: `src/tests/CategoryDistributionChart.test.tsx`
- Test: `src/tests/TaskCompletionChart.test.tsx`
- Test: `src/tests/antislopTokens.test.ts`

**Interfaces:**
- Consumes: props existentes `todos` y `planner`.
- Produces: microcopy contextual en estados vacíos (R-27) con orientación a la acción, manteniendo compatibilidad con las queries accesibles existentes.

- [ ] **Step 1: Escribir tests para verificar guía de acción en estados vacíos y prefers-reduced-motion en spinner**

En `src/tests/CategoryDistributionChart.test.tsx`:
```typescript
  it('orienta al usuario en el estado vacío a registrar tareas o bloques', () => {
    render(<CategoryDistributionChart todos={[]} planner={[]} />);
    expect(screen.getByText(/crea tareas o bloques en el planner/i)).toBeInTheDocument();
  });
```

En `src/tests/TaskCompletionChart.test.tsx`:
```typescript
  it('orienta al usuario en el estado vacío a crear tareas en to-do', () => {
    render(<TaskCompletionChart todos={[]} />);
    expect(screen.getByText(/agrega tareas en to-do para visualizar tu progreso/i)).toBeInTheDocument();
  });
```

En `src/tests/antislopTokens.test.ts`:
```typescript
  it('RouteLoadingFallback.module.css respeta prefers-reduced-motion', () => {
    const cssPath = path.resolve(__dirname, '../components/RouteLoadingFallback.module.css');
    const content = fs.readFileSync(cssPath, 'utf-8');
    expect(content).toContain('prefers-reduced-motion');
  });
```

- [ ] **Step 2: Ejecutar tests para comprobar que fallan**

Run: `pnpm exec vitest run src/tests/CategoryDistributionChart.test.tsx src/tests/TaskCompletionChart.test.tsx src/tests/antislopTokens.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar mejoras en los charts y en el fallback**

- En `CategoryDistributionChart.tsx`: bajo el texto "Sin actividades categorizadas", agregar `<p className={styles.emptyHint}>Crea tareas o bloques en el Planner para visualizar la distribución aquí.</p>`.
- En `TaskCompletionChart.tsx`: bajo "Sin tareas para graficar", agregar `<p className={styles.emptyHint}>Agrega tareas en To-Do para visualizar tu progreso diario.</p>`.
- En `RouteLoadingFallback.module.css`: añadir bloque `@media (prefers-reduced-motion: reduce) { .spinner { animation: none; } }`.

- [ ] **Step 4: Ejecutar tests para comprobar que pasan**

Run: `pnpm exec vitest run src/tests/CategoryDistributionChart.test.tsx src/tests/TaskCompletionChart.test.tsx src/tests/antislopTokens.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/charts/CategoryDistributionChart.tsx src/components/charts/TaskCompletionChart.tsx src/components/RouteLoadingFallback.module.css src/tests/CategoryDistributionChart.test.tsx src/tests/TaskCompletionChart.test.tsx src/tests/antislopTokens.test.ts
git commit -m ":sparkles: feat(ui): enriquecer estados vacios con accion inmediata y pausar animacion en reduced motion"
```

---

### Task 4: Verificación Integral de Suite y Compilación de Producción

**Files:**
- Verify: suite completa de pruebas unitarias y de integración.
- Verify: bundle de producción y chequeo de tipos TypeScript (`pnpm build`).

- [ ] **Step 1: Ejecutar la suite completa de tests de Vitest**

Run: `pnpm exec vitest run`
Expected: 21 suites en verde, 196+ tests pasando.

- [ ] **Step 2: Ejecutar el build de producción**

Run: `pnpm build`
Expected: código de salida 0, sin advertencias de tipos ni errores de bundling en Vite.

- [ ] **Step 3: Registrar en el log de git y preparar integración en develop**

Run: `git status`
Expected: working tree limpio.
