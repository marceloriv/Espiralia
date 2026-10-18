# Mesa de Trabajo Táctil y Papelería Viva en Inicio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar una experiencia táctil y tangible en la página de Inicio de Espiralia con trazado animado de pluma estilográfica en las tareas de la Mesa de Trabajo, recálculo reactivo en tiempo real del indicador circular de biorritmo con soporte de accesibilidad `aria-live`, y abanicado orgánico de capas de papelería en el bodegón del Hero.

**Architecture:** En `LandingDeskPreview.tsx` se dota a las tareas de un trazo de tinta estilográfica mediante pseudo-elementos CSS con curva física de deslizamiento de plumín (`cubic-bezier(0.22, 1, 0.36, 1)`). La tasa de serenidad y el indicador circular SVG de biorritmo se conectan reactivamente al recuento de tareas completadas anunciando cambios con `aria-live="polite"`. En `LandingHeroCard.module.css` se estructura una interacción de apertura en abanico sobre las capas de papelería (dossier, pliego rasgado, nota adhesiva) activada por `:hover` y `:focus-within`, complementada con reflejos especulares sobre los clips de latón y respetando estrictamente `prefers-reduced-motion`.

**Tech Stack:** React 19.2, TypeScript 5.8, CSS Modules, Lucide React, Vitest 3.x, `@testing-library/react`.

**Spec:** [docs/superpowers/specs/2026-10-18-inicio-mesa-trabajo-tactil.md](file:///C:/Users/river/Desktop/Codigo/Proyectos/Espiralia/docs/superpowers/specs/2026-10-18-inicio-mesa-trabajo-tactil.md)

## Global Constraints

- TypeScript 5.8 estricto sin tipos `any` implícitos ni directivas `@ts-ignore`.
- Los estilos en `LandingDeskPreview.module.css` y `LandingHeroCard.module.css` deben satisfacer la regla antislop: sin `box-shadow: 0 Xpx Ypx`, empleando tokens oficiales de `src/index.css` o sombras direccionales con compensación física.
- Convención de commits: Conventional Commits v1.0.0 con Gitmoji en español según `AGENTS.md` §11.2 (ej. `:art:`, `:sparkles:`, `:white_check_mark:`).
- Preservar el 100% de la suite de pruebas existente en verde (71 archivos de test en `src/tests/`).
- Mantener soporte integral para lectores de pantalla (`aria-live="polite"`, `role="status"`, `aria-label`).
- Degradación elegante total ante `@media (prefers-reduced-motion: reduce)`.

## Review Focus

1. **Desmarcado inmediato y remoción del trazo de tinta**: Al desmarcar una tarea previamente completada, el trazo caligráfico debe desaparecer sin artefactos visuales atascados ni retrasos en la UI.
2. **Límite inferior con 0 tareas completadas**: Al desmarcar todas las prioridades, la fórmula no debe producir divisiones por cero ni valores inesperados; debe reflejar limpiamente `60% Serenidad` y `0 de 3 Módulos`.
3. **Invariantes de pruebas existentes**: Las aserciones actuales en `LandingDeskPreview.test.tsx` (títulos, encabezados, roles de checkbox y presencia del pliego) deben mantenerse intactas sin romper su contrato semántico.
4. **Respeto a movimiento reducido (`prefers-reduced-motion`)**: En modo de movimiento reducido, el trazo de pluma debe ser estático e inmediato y las capas de papel en el Hero no deben rotar ni fannear.
5. **Aislamiento de desbordamiento horizontal (`overflow-x`)**: El abanicado de las capas de papel en el Hero no debe inducir scroll horizontal indeseado en dispositivos móviles o pantallas con ancho ≤768px.

---

### Task 1: Trazado Animado de Pluma Estilográfica en Tareas (`LandingDeskPreview`)

**Files:**
- Modify: `src/components/landing/LandingDeskPreview.module.css:270-290`
- Modify: `src/components/landing/LandingDeskPreview.tsx:109-115`
- Test: `src/tests/LandingDeskPreview.test.tsx`

**Interfaces:**
- Consumes: Estado `tasks` y función `handleToggleTask(id: string)` en `LandingDeskPreview.tsx`.
- Produces: Clase CSS `.priorityTextCompleted` mejorada con pseudo-elemento caligráfico `::after`, animación `inkStrokeDraw`, y atenuación a tono de carbón sumi `var(--color-muted)`.

- [ ] **Step 1: Escribir el test que falla para el trazo caligráfico de tinta estilográfica**

En `src/tests/LandingDeskPreview.test.tsx`:
```tsx
  it('aplica la clase de trazo caligráfico de tinta al completar una tarea de prioridad', async () => {
    const user = userEvent.setup();
    const { container } = render(<LandingDeskPreview />);

    const secondTaskCheckbox = screen.getByRole('checkbox', { name: /postulación universitaria 2026/i });
    expect(secondTaskCheckbox).not.toBeChecked();

    await user.click(secondTaskCheckbox);
    expect(secondTaskCheckbox).toBeChecked();

    const completedText = container.querySelector('[class*="priorityTextCompleted"]');
    expect(completedText).toBeInTheDocument();
  });
```

- [ ] **Step 2: Ejecutar test para comprobar estado de línea base**

Run: `pnpm exec vitest run src/tests/LandingDeskPreview.test.tsx`
Expected: PASS (asienta la verificación antes de incorporar la animación y pseudo-elementos).

- [ ] **Step 3: Implementar la animación caligráfica en `LandingDeskPreview.module.css`**

Actualizar `.priorityText` y `.priorityTextCompleted` en `src/components/landing/LandingDeskPreview.module.css`:
```css
.priorityText {
  position: relative;
  display: inline-block;
  font-family: var(--font-body, sans-serif);
  font-size: 0.875rem;
  color: var(--color-body-strong, #252523);
  font-weight: 500;
  transition: color 240ms ease;
}

.priorityTextCompleted {
  text-decoration: none;
  color: var(--color-muted, #6c6a64);
}

.priorityTextCompleted::after {
  content: '';
  position: absolute;
  left: -4px;
  right: -4px;
  top: 52%;
  height: 2px;
  background: linear-gradient(90deg, #7B188E 0%, #9426A8 65%, #7B188E 100%);
  transform: translateY(-50%) rotate(-0.4deg);
  border-radius: 9999px;
  pointer-events: none;
  animation: inkStrokeDraw 320ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

@keyframes inkStrokeDraw {
  0% {
    clip-path: inset(0 100% 0 0);
    opacity: 0.7;
  }
  100% {
    clip-path: inset(0 0 0 0);
    opacity: 0.95;
  }
}

@media (prefers-reduced-motion: reduce) {
  .priorityTextCompleted::after {
    animation: none;
    clip-path: inset(0 0 0 0);
  }
}
```

- [ ] **Step 4: Ejecutar test para verificar el trazado estilográfico**

Run: `pnpm exec vitest run src/tests/LandingDeskPreview.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit del trazo de pluma estilográfica**

```bash
git add src/components/landing/LandingDeskPreview.module.css src/tests/LandingDeskPreview.test.tsx
git commit -m ":art: style(landing): agregar trazo animado de pluma estilografica para tareas completadas"
```

---

### Task 2: Medidor Reactivo de Biorritmo y Anuncio Accesible `aria-live` (`LandingDeskPreview`)

**Files:**
- Modify: `src/components/landing/LandingDeskPreview.tsx:38-48`, `165-175`, `230-242`
- Modify: `src/components/landing/LandingDeskPreview.module.css:399-408`, `488-508`
- Test: `src/tests/LandingDeskPreview.test.tsx`

**Interfaces:**
- Consumes: Arreglo de tareas `tasks` en `LandingDeskPreview.tsx`.
- Produces: 
  - Cálculo dinámico: `completedCount = tasks.filter(t => t.completed).length`.
  - Porcentaje de serenidad: `serenityPercentage = Math.round(60 + (completedCount / tasks.length) * 40)` (0 hechas = 60%, 1 hecha = 73%, 2 hechas = 87%, 3 hechas = 100%).
  - Atributos `aria-live="polite"` y `role="status"` en el badge y medidor de serenidad.
  - Ancho reactivo en la barra de progreso de "Módulos Completados": `style={{ width: `${(completedCount / tasks.length) * 100}%` }}` y texto dinámico `{completedCount} de {tasks.length}`.

- [ ] **Step 1: Escribir el test que falla para la reactividad de serenidad y accesibilidad**

En `src/tests/LandingDeskPreview.test.tsx`:
```tsx
  it('recalcula la tasa de serenidad y actualiza el contador de módulos al alternar tareas', async () => {
    const user = userEvent.setup();
    render(<LandingDeskPreview />);

    // Inicialmente 1 tarea de 3 completada (73% Serenidad)
    expect(screen.getByText(/73% serenidad/i)).toBeInTheDocument();
    expect(screen.getByText(/1 de 3/i)).toBeInTheDocument();

    const secondTask = screen.getByRole('checkbox', { name: /postulación universitaria 2026/i });
    await user.click(secondTask);

    // Con 2 de 3 completadas -> 87% Serenidad
    expect(screen.getByText(/87% serenidad/i)).toBeInTheDocument();
    expect(screen.getByText(/2 de 3/i)).toBeInTheDocument();

    const statusBadge = screen.getByRole('status');
    expect(statusBadge).toHaveAttribute('aria-live', 'polite');
  });
```

- [ ] **Step 2: Ejecutar test para comprobar que falla**

Run: `pnpm exec vitest run src/tests/LandingDeskPreview.test.tsx`
Expected: FAIL con `Unable to find element with text /73% serenidad/i` (actualmente está hardcodeado `84% Serenidad`).

- [ ] **Step 3: Implementar el recálculo dinámico y medidor SVG en `LandingDeskPreview.tsx`**

En `src/components/landing/LandingDeskPreview.tsx`:
1. Calcular variables reactivas:
```tsx
  const completedCount = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const serenityPercentage = Math.round(60 + (completedCount / totalTasks) * 40);
  const completionPercentage = Math.round((completedCount / totalTasks) * 100);
```
2. Actualizar el badge de cabecera en la tarjeta vital con accesibilidad:
```tsx
  <span
    className={styles.vitalBadge}
    role="status"
    aria-live="polite"
    aria-label={`${serenityPercentage}% de serenidad alcanzada`}
  >
    {serenityPercentage}% Serenidad
  </span>
```
3. Actualizar la fila de módulos completados:
```tsx
  <div className={styles.metricRow}>
    <div className={styles.metricLabelGroup}>
      <span className={styles.metricLabel}>Módulos Completados</span>
      <span className={styles.metricValue}>{completedCount} de {totalTasks}</span>
    </div>
    <div
      className={styles.progressBarTrack}
      role="progressbar"
      aria-valuenow={completionPercentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Módulos completados"
    >
      <div
        className={styles.progressBarFillAmber}
        style={{ width: `${completionPercentage}%`, transition: 'width 300ms ease' }}
      />
    </div>
  </div>
```

- [ ] **Step 4: Ejecutar test para comprobar que pasa**

Run: `pnpm exec vitest run src/tests/LandingDeskPreview.test.tsx`
Expected: PASS (todos los tests de `LandingDeskPreview.test.tsx` en verde).

- [ ] **Step 5: Commit del medidor reactivo de serenidad**

```bash
git add src/components/landing/LandingDeskPreview.tsx src/components/landing/LandingDeskPreview.module.css src/tests/LandingDeskPreview.test.tsx
git commit -m ":sparkles: feat(landing): recalcular serenidad y modulos completados en tiempo real con aria-live"
```

---

### Task 3: Despliegue Táctil de Capas y Brillo de Clips en Bodegón del Hero (`LandingHeroCard`)

**Files:**
- Modify: `src/components/landing/LandingHeroCard.module.css:20-27`, `88-112`, `215-230`, `320-330`
- Modify: `src/components/landing/LandingHeroCard.tsx:4-8`
- Test: `src/tests/LandingHeroCard.test.tsx`

**Interfaces:**
- Consumes: Estructura HTML de 3 capas en `LandingHeroCard.tsx`.
- Produces: Pseudo-clases `:hover` y `:focus-within` en `.heroVignetteContainer` que abanican orquestadamente las 3 capas analógicas y aplican destello sutil de luz en los clips de latón.

- [ ] **Step 1: Escribir el test para el contenedor interactivo del Hero Card**

En `src/tests/LandingHeroCard.test.tsx`:
```tsx
  it('contiene la estructura de bodegón analógico con capas táctiles interactivas', () => {
    const { container } = render(<LandingHeroCard />);
    const vignetteContainer = container.querySelector('[class*="heroVignetteContainer"]');
    expect(vignetteContainer).toBeInTheDocument();
    expect(vignetteContainer).toHaveAttribute('data-interactive-stack', 'true');
  });
```

- [ ] **Step 2: Ejecutar test para comprobar que falla**

Run: `pnpm exec vitest run src/tests/LandingHeroCard.test.tsx`
Expected: FAIL porque `data-interactive-stack="true"` no está presente todavía.

- [ ] **Step 3: Agregar `data-interactive-stack="true"` y estilizar abanicado en `LandingHeroCard.module.css`**

En `src/components/landing/LandingHeroCard.tsx`:
```tsx
export const LandingHeroCard: React.FC = () => {
  return (
    <div
      className={styles.heroVignetteContainer}
      data-interactive-stack="true"
      tabIndex={0}
      aria-label="Bodegón de papelería interactivo: Dossier, Biorritmo y Aforismo"
    >
```

En `src/components/landing/LandingHeroCard.module.css`:
```css
.heroVignetteContainer {
  position: relative;
  width: 100%;
  max-width: 460px;
  margin-left: auto;
  padding-top: 1.5rem;
  outline: none;
}

.heroVignetteContainer:focus-visible {
  border-radius: var(--radius-md, 8px);
  box-shadow: 0 0 0 2px var(--color-primary);
}

/* 1. Carpeta Dossier Manila (Fondo) */
.dossierFolder {
  position: relative;
  background-color: #ede3d0;
  background-image: radial-gradient(rgba(26, 25, 23, 0.05) 0.75px, transparent 0.75px);
  background-size: 14px 14px;
  border: 1px solid #ddd5c6;
  border-radius: 4px 14px 12px 12px;
  padding: 2.25rem 1.5rem 1.5rem;
  box-shadow: 0 4px 16px rgba(26, 25, 23, 0.06), 0 1px 3px rgba(26, 25, 23, 0.04);
  transform: rotate(-1.5deg);
  transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.35s ease;
  z-index: 1;
}

.heroVignetteContainer:hover .dossierFolder,
.heroVignetteContainer:focus-within .dossierFolder {
  transform: rotate(-2.8deg) translate(-6px, 2px);
  box-shadow: 0 6px 20px rgba(26, 25, 23, 0.09);
}

/* 2. Pliego Rasgado de Biorritmo (Capa Intermedia) */
.tornPaperSlip {
  position: relative;
  background-color: var(--color-surface-card, #ffffff);
  background-image: radial-gradient(var(--color-grid-bujo, #dfd8cc) 0.65px, transparent 0.65px);
  background-size: 16px 16px;
  border-left: 1px solid var(--color-hairline, #e6dfd8);
  border-right: 1px solid var(--color-hairline, #e6dfd8);
  padding: 1.5rem 1.25rem;
  box-shadow: 0 4px 14px rgba(26, 25, 23, 0.04);
  margin-top: -0.75rem;
  margin-left: 1rem;
  max-width: 380px;
  transform: rotate(1deg);
  transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.35s ease;
  z-index: 2;
  clip-path: /* ...clip path existente preservado... */;
}

.heroVignetteContainer:hover .tornPaperSlip,
.heroVignetteContainer:focus-within .tornPaperSlip {
  transform: rotate(2.2deg) translate(8px, -4px);
  box-shadow: 0 8px 22px rgba(26, 25, 23, 0.08);
}

/* 3. Nota adhesiva amarilla rotada (Capa Superior) */
.stickyNote {
  position: relative;
  background-color: #fcf5c7;
  color: #332f14;
  padding: 1.35rem 1.5rem;
  border-radius: 4px;
  border: 1px solid #ebd88d;
  box-shadow: 0 6px 18px rgba(26, 25, 23, 0.1), 0 1px 3px rgba(26, 25, 23, 0.06);
  transform: rotate(2.5deg);
  transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.35s ease;
  margin-top: -2rem;
  margin-left: 2rem;
  max-width: 360px;
  z-index: 3;
}

.heroVignetteContainer:hover .stickyNote,
.heroVignetteContainer:focus-within .stickyNote {
  transform: rotate(4.8deg) translate(14px, -8px);
  box-shadow: 0 10px 24px rgba(26, 25, 23, 0.12);
}

/* Reflejo de luz en clip de latón */
.paperClipBrass,
.brassClip {
  transition: filter 0.3s ease;
}

.heroVignetteContainer:hover .paperClipBrass,
.heroVignetteContainer:hover .brassClip {
  filter: brightness(1.12);
}

@media (max-width: 768px) {
  .heroVignetteContainer:hover .dossierFolder,
  .heroVignetteContainer:focus-within .dossierFolder,
  .heroVignetteContainer:hover .tornPaperSlip,
  .heroVignetteContainer:focus-within .tornPaperSlip,
  .heroVignetteContainer:hover .stickyNote,
  .heroVignetteContainer:focus-within .stickyNote {
    transform: none !important;
  }
}

@media (prefers-reduced-motion: reduce) {
  .dossierFolder,
  .tornPaperSlip,
  .stickyNote {
    transform: none !important;
    transition: none !important;
  }
}
```

- [ ] **Step 4: Ejecutar test para comprobar que pasa**

Run: `pnpm exec vitest run src/tests/LandingHeroCard.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit del abanicado táctil de capas en Hero**

```bash
git add src/components/landing/LandingHeroCard.tsx src/components/landing/LandingHeroCard.module.css src/tests/LandingHeroCard.test.tsx
git commit -m ":art: style(landing): implementar despliegue tactil de capas en abanico para bodegon de hero"
```

---

### Task 4: Verificación Integral de Suite, Antislop Tokens y Build

**Files:**
- Test: `src/tests/LandingDeskPreview.test.tsx`
- Test: `src/tests/LandingHeroCard.test.tsx`
- Test: `src/tests/LandingView.test.tsx`
- Test: `src/tests/antislopTokens.test.ts`

**Interfaces:**
- Consumes: Todo el código implementado en Tasks 1 a 3.
- Produces: 100% de la suite de pruebas unitarias e integración en verde, sin regresiones ni violaciones de tokens antislop.

- [ ] **Step 1: Ejecutar la suite completa de pruebas de Landing**

Run: `pnpm exec vitest run src/tests/LandingDeskPreview.test.tsx src/tests/LandingHeroCard.test.tsx src/tests/LandingView.test.tsx`
Expected: PASS en todos los tests de Landing (13 tests en verde).

- [ ] **Step 2: Ejecutar verificación de tokens antislop**

Run: `pnpm exec vitest run src/tests/antislopTokens.test.ts`
Expected: PASS (sin infracciones de diseño antislop).

- [ ] **Step 3: Ejecutar la suite completa del repositorio**

Run: `pnpm exec vitest run`
Expected: PASS (71 archivos de test, ~454 tests todos en verde).

- [ ] **Step 4: Compilar bundle de producción para verificación de TypeScript**

Run: `pnpm build`
Expected: Build exitoso sin errores de tipos TypeScript ni advertencias bloqueantes de Vite.
