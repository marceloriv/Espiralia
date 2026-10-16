# UI Styling Refinements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Subsanar las inconsistencias cromáticas, variables CSS huérfanas, objetivos táctiles y adaptabilidad de tablet detectadas en la auditoría UI/UX (H1–H7), unificando la identidad visual editorial de Espiralia bajo la paleta púrpura de marca.

**Architecture:** Enfoque quirúrgico en 4 capas: (1) normalización y alias de tokens en `:root` (`src/index.css`), (2) corrección de accesibilidad ergonómica (touch targets de 44px y contraste en hover), (3) armonización visual de componentes F6/F7 hacia `--color-primary` y tokens `--shadow-*`, y (4) adaptabilidad horizontal en la grilla semanal del Planner.

**Tech Stack:** React 19.3, TypeScript 5.8, CSS Modules, Vitest 5.0, Testing Library React, Lucide React.

**Spec:** [`ui-styling-audit-espiralia.md`](file:///C:/Users/river/.gemini/antigravity-cli/brain/d2d5c144-5a32-4ed4-9411-efd7f74e26a5/ui-styling-audit-espiralia.md)

## Global Constraints

- Cumplimiento estricto de Conventional Commits con Gitmoji según `AGENTS.md` §11.2 (sin firmas de IA ni trailers automáticos).
- Pruebas ubicadas exclusivamente en `src/tests/` (prohibido crear carpetas de test fuera de `src/tests/`).
- Mantener la suite de Vitest en 100% verde y `pnpm build` sin errores de compilación de TypeScript.
- Respetar los tokens de diseño oficiales de `DESIGN.md` (paleta púrpura `#8E1EA2`, tipografía editorial con serif `--font-primary`, cuerpo humanista `--font-family-2`).

## Review Focus

1. **Tokens huérfanos sin fallback válido:** Asegurar que ningún componente dependa de variables no declaradas en `:root` que causen caídas silenciosas de estilos en navegadores estrictos.
2. **Contraste de texto en hover (WCAG 1.4.3):** Garantizar un ratio mínimo de 4.5:1 en estados interactivos (`:hover`, `:active`) de botones de acción rápida.
3. **Dimensiones táctiles mínimas (WCAG 2.5.5 / 2.5.8):** Verificar que los botones de cierre en modales y enlaces de acción en filas alcancen un área mínima interactiva de 44x44px en móviles y tablets.
4. **Armonía cromática de marca:** Asegurar que los botones primarios en Notas, Carpetas y Bóveda utilicen `--color-primary` y no el naranja terracota `#c96442`.
5. **Legibilidad y no desbordamiento en tablets:** Verificar que la grilla semanal del planificador mantenga un ancho mínimo legible por columna con scroll horizontal suave en viewports de 768px a 1024px.

---

### Task 1: Normalización de Tokens y Alias en `src/index.css`

**Files:**
- Modify: `src/index.css:120-130`
- Test: `src/tests/ui-styling-tokens.test.ts`

**Interfaces:**
- Produces: tokens en `:root` (`--font-headline`, `--color-ink-muted`, `--color-accent`, `--color-surface`).

- [ ] **Step 1: Write the failing test**

```typescript
// src/tests/ui-styling-tokens.test.ts
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Token Normalization (H2, H5)', () => {
  it('declares alias tokens in src/index.css :root', () => {
    const cssPath = path.resolve(__dirname, '../index.css');
    const css = fs.readFileSync(cssPath, 'utf-8');

    expect(css).toMatch(/--font-headline:\s*var\(--font-primary\);/);
    expect(css).toMatch(/--color-accent:\s*var\(--color-primary\);/);
    expect(css).toMatch(/--color-ink-muted:\s*var\(--color-muted\);/);
    expect(css).toMatch(/--color-surface:\s*var\(--color-surface-soft\);/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/tests/ui-styling-tokens.test.ts`
Expected: FAIL con "expected css to match pattern"

- [ ] **Step 3: Implement tokens in `src/index.css`**

Agregar en la sección de tokens de compatibilidad de `:root`:
```css
  /* Tokens de compatibilidad y alias historicos */
  --color-surface: var(--color-surface-soft);
  --color-accent: var(--color-primary);
  --color-ink-muted: var(--color-muted);
  --font-headline: var(--font-primary);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/tests/ui-styling-tokens.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/index.css src/tests/ui-styling-tokens.test.ts
git commit -m ":art: style(tokens): definir alias --font-headline, --color-accent y --color-ink-muted en root"
```

---

### Task 2: Accesibilidad Ergonómica — Touch Targets de 44px y Contraste en Hover

**Files:**
- Modify: `src/components/AppLayout.module.css:90-95`
- Modify: `src/components/vault/VaultModal.module.css:45-55`
- Modify: `src/components/DashboardView.module.css:439-455`
- Test: `src/tests/ui-styling-a11y-targets.test.tsx`

**Interfaces:**
- Consumes: tokens `--color-primary`, `--color-on-primary`, `--color-muted` de `src/index.css`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/tests/ui-styling-a11y-targets.test.tsx
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Ergonomics and Touch Targets (H3, H4)', () => {
  it('VaultModal close button has min 44x44px touch target', () => {
    const cssPath = path.resolve(__dirname, '../components/vault/VaultModal.module.css');
    const css = fs.readFileSync(cssPath, 'utf-8');
    expect(css).toMatch(/\.closeBtn\s*\{[^}]*min-height:\s*44px/);
    expect(css).toMatch(/\.closeBtn\s*\{[^}]*min-width:\s*44px/);
  });

  it('DashboardView areaActionBtn has min-height 44px', () => {
    const cssPath = path.resolve(__dirname, '../components/DashboardView.module.css');
    const css = fs.readFileSync(cssPath, 'utf-8');
    expect(css).toMatch(/\.areaActionBtn\s*\{[^}]*min-height:\s*44px/);
  });

  it('AppLayout quickActionButton hover state uses high contrast primary fill', () => {
    const cssPath = path.resolve(__dirname, '../components/AppLayout.module.css');
    const css = fs.readFileSync(cssPath, 'utf-8');
    expect(css).toMatch(/\.quickActionButton:hover\s*\{[^}]*color:\s*var\(--color-on-primary\)/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/tests/ui-styling-a11y-targets.test.tsx`
Expected: FAIL con falta de reglas `min-height` y `color: var(--color-on-primary)`.

- [ ] **Step 3: Implement touch targets & contrast updates**

1. En `src/components/AppLayout.module.css`:
```css
.quickActionButton:hover {
  background-color: var(--color-primary);
  color: var(--color-on-primary);
  border-color: var(--color-primary);
}
```
2. En `src/components/vault/VaultModal.module.css`:
```css
.closeBtn {
  min-height: 44px;
  min-width: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--color-muted);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: background-color 0.15s ease, color 0.15s ease;
}
.closeBtn:hover {
  background-color: var(--color-hairline);
  color: var(--color-ink);
}
```
3. En `src/components/DashboardView.module.css`:
```css
.areaActionBtn {
  min-height: 44px;
  padding: 8px 12px;
  background: none;
  border: none;
  color: var(--color-primary);
  font-family: var(--font-family-2);
  font-size: var(--text-caption);
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/tests/ui-styling-a11y-targets.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/AppLayout.module.css src/components/vault/VaultModal.module.css src/components/DashboardView.module.css src/tests/ui-styling-a11y-targets.test.tsx
git commit -m ":wheelchair: style(a11y): elevar touch targets a 44px en modal y dashboard y optimizar contraste de hover"
```

---

### Task 3: Armonización Cromática de Fases F6 (Notas/Carpetas) y F7 (Bóveda)

**Files:**
- Modify: `src/components/NotesView.module.css`
- Modify: `src/components/FoldersView.module.css`
- Modify: `src/components/FoldersView.tsx`
- Modify: `src/components/notes/NoteModal.module.css`
- Modify: `src/components/folders/FolderModal.module.css`
- Modify: `src/components/vault/VaultModal.module.css`
- Modify: `src/components/vault/VaultModal.tsx`
- Test: `src/tests/ui-styling-chroma.test.tsx`

**Interfaces:**
- Consumes: tokens `--color-primary`, `--color-primary-active`, `--shadow-sm`, `--shadow-md`, `--shadow-lg`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/tests/ui-styling-chroma.test.tsx
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Chroma & Elevation Harmonization (H1, H6)', () => {
  it('NotesView uses primary brand color and design token shadows', () => {
    const cssPath = path.resolve(__dirname, '../components/NotesView.module.css');
    const css = fs.readFileSync(cssPath, 'utf-8');
    expect(css).toMatch(/\.btnAdd\s*\{[^}]*background:\s*var\(--color-primary\)/);
    expect(css).toMatch(/\.card\s*\{[^}]*box-shadow:\s*var\(--shadow-sm\)/);
  });

  it('FoldersView uses primary brand color on add buttons', () => {
    const cssPath = path.resolve(__dirname, '../components/FoldersView.module.css');
    const css = fs.readFileSync(cssPath, 'utf-8');
    expect(css).toMatch(/\.btnAdd\s*\{[^}]*background:\s*var\(--color-primary\)/);
  });

  it('VaultModal uses shadow-lg design token', () => {
    const cssPath = path.resolve(__dirname, '../components/vault/VaultModal.module.css');
    const css = fs.readFileSync(cssPath, 'utf-8');
    expect(css).toMatch(/\.modalBox\s*\{[^}]*box-shadow:\s*var\(--shadow-lg\)/);
    expect(css).toMatch(/\.btnPrimary\s*\{[^}]*background:\s*var\(--color-primary\)/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/tests/ui-styling-chroma.test.tsx`
Expected: FAIL con `background: var(--color-accent, #c96442)` y sombras directas.

- [ ] **Step 3: Implement chromatic & elevation updates**

1. En `NotesView.module.css`:
   - Cambiar `.btnAdd` a `background: var(--color-primary); color: var(--color-on-primary);`.
   - `.btnAdd:hover` a `background: var(--color-primary-active);`.
   - `.card` a `box-shadow: var(--shadow-sm);`.
   - `.card:hover` a `box-shadow: var(--shadow-md);`.
2. En `FoldersView.module.css`:
   - Cambiar `.btnAdd` a `background: var(--color-primary); color: var(--color-on-primary);`.
   - `.btnAdd:hover` a `background: var(--color-primary-active);`.
3. En `FoldersView.tsx`:
   - Cambiar los íconos de vínculos y notas que pasaban `color="var(--color-accent, #c96442)"` a `color="var(--color-primary)"`.
4. En `FolderModal.module.css` y `NoteModal.module.css`:
   - Cambiar botones primarios de guardado a `var(--color-primary)`.
5. En `VaultModal.module.css` y `VaultModal.tsx`:
   - `.modalBox` a `box-shadow: var(--shadow-lg);`.
   - `.btnPrimary` a `background: var(--color-primary); color: var(--color-on-primary);`.
   - `.btnPrimary:hover` a `background: var(--color-primary-active);`.
   - Ícono `Lock` en `VaultModal.tsx` a `color="var(--color-primary)"`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/tests/ui-styling-chroma.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/NotesView.module.css src/components/FoldersView.module.css src/components/FoldersView.tsx src/components/notes/NoteModal.module.css src/components/folders/FolderModal.module.css src/components/vault/VaultModal.module.css src/components/vault/VaultModal.tsx src/tests/ui-styling-chroma.test.tsx
git commit -m ":art: style(ui): unificar paleta de marca y sombras en notas, carpetas y boveda"
```

---

### Task 4: Adaptabilidad Responsiva del Planner Semanal en Tablets (H7)

**Files:**
- Modify: `src/components/planner/PlannerWeeklyGrid.module.css`
- Test: `src/tests/ui-styling-planner-grid.test.tsx`

**Interfaces:**
- Consumes: grilla semanal de 7 días y columna sin día asignado.

- [ ] **Step 1: Write the failing test**

```tsx
// src/tests/ui-styling-planner-grid.test.tsx
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Planner Weekly Grid Responsive Polish (H7)', () => {
  it('PlannerWeeklyGrid container enforces horizontal scroll and minimum column widths', () => {
    const cssPath = path.resolve(__dirname, '../components/planner/PlannerWeeklyGrid.module.css');
    const css = fs.readFileSync(cssPath, 'utf-8');
    expect(css).toMatch(/overflow-x:\s*auto/);
    expect(css).toMatch(/min-width:\s*130px/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/tests/ui-styling-planner-grid.test.tsx`
Expected: FAIL con falta de `overflow-x: auto` o `min-width: 130px`.

- [ ] **Step 3: Implement responsive improvements in `PlannerWeeklyGrid.module.css`**

Configurar el contenedor de la grilla para permitir scroll horizontal suave cuando el espacio por día sea inferior a 130px:
```css
.gridContainer {
  display: flex;
  flex-direction: column;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 8px;
}

.weeklyColumns {
  display: grid;
  grid-template-columns: repeat(8, minmax(130px, 1fr));
  gap: 12px;
  min-width: 1040px;
}

@media (min-width: 1280px) {
  .weeklyColumns {
    min-width: 0;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/tests/ui-styling-planner-grid.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/planner/PlannerWeeklyGrid.module.css src/tests/ui-styling-planner-grid.test.tsx
git commit -m ":art: style(planner): habilitar desplazamiento horizontal y ancho minimo por dia en tablets"
```

---

### Task 5: Verificación Integral del Sistema de Estilos y Build

**Files:**
- Verification: Todo el proyecto

- [ ] **Step 1: Ejecutar suite completa de Vitest**

Run: `pnpm exec vitest run src/tests/`
Expected: 100% de tests en verde (mínimo 572 tests pasados).

- [ ] **Step 2: Ejecutar diagnóstico de salud con React Doctor**

Run: `npx react-doctor src`
Expected: `Score: 100 / 100 Great · 0 issues found!`

- [ ] **Step 3: Compilar bundle de producción**

Run: `pnpm build`
Expected: `built in < 2s` con 0 errores de TypeScript y empaquetado Vite limpio.
