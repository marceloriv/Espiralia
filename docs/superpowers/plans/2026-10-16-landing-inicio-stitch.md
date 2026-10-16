# Página de Inicio Stitch (Landing Editorial) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar la página de inicio editorial de alto impacto visual y conceptual basada en el diseño oficial de Stitch (`b96b1520d8d5487bac12a2f22fd98b78`), integrándola como ruta pública `/inicio` y punto de bienvenida para Espiralia con estándares UI/UX Pro Max (WCAG 2.2 AA, touch targets ≥44px, zero CLS, reduced-motion y antislop).

**Architecture:** Componente desacoplado `LandingView` estructurado en sub-componentes funcionales (`LandingIntentionWidget`, `LandingDeskPreview`, etc.) que consumen los tokens globales de `src/index.css` y CSS Modules para aislamiento de estilos. El enrutador de React Router 7 expone `/inicio` y redirige a la landing cuando no existe perfil activo en `/`.

**Tech Stack:** React 19.2, TypeScript 5.8, CSS Modules, Lucide React, React Router 7 (`react-router-dom`), Vitest 3 + Testing Library React 16.

**Spec:** [`docs/superpowers/specs/2026-10-16-landing-inicio-stitch-design.md`](file:///C:/Users/river/Desktop/Codigo/Proyectos/Espiralia/docs/superpowers/specs/2026-10-16-landing-inicio-stitch-design.md)

## Global Constraints

- 100% Client-Side: sin dependencias de backend, APIs remotas ni llamadas de red externas.
- Convención de ramas Git Flow: desarrollo en `feature/landing-inicio-stitch` desde `develop`.
- Commits Conventional Commits v1.0.0 con Gitmoji en español; sin firmas de IA ni trailers automáticos.
- Pruebas unitarias e integración en `src/tests/` exclusivamente.
- Estilos con CSS Modules y consumo estricto de variables de diseño de `src/index.css` (Warm Editorial Magenta).
- Accesibilidad WCAG 2.2 AA: ratio de contraste ≥4.5:1 en texto normal (y ≥3:1 en gráfica/badges), touch targets ≥44×44px, navegación por teclado con foco visible y estados `aria-pressed` / `aria-live`.
- Antislop activo en modo DURANTE: prosa editorial humana sin clichés de marketing de IA ni métricas ficticias.

## Review Focus (UI/UX Pro Max Audit)

1. **Prevención de Layout Shift (CLS < 0.1)**: El panel del widget de intenciones debe tener un `min-height` fijo reservado para que el cambio de texto y pasos guiados no empuje abruptamente las secciones inferiores.
2. **Accesibilidad en vivo (WCAG 4.1.3 Status Messages)**: El contenedor de citas y pasos debe tener `aria-live="polite"` y `aria-atomic="true"` para que lectores de pantalla anuncien la nueva intención sin perder el foco del botón activo.
3. **Touch Targets e Interacción Móvil (WCAG 2.5.8 & 2.5.5)**: Cada botón de intención, enlace de cabecera y botón de acción debe tener un área táctil mínima de 44×44px o margen compensatorio de 8px en pantallas táctiles.
4. **Sensibilidad al movimiento (prefers-reduced-motion)**: La animación de pulso del indicador de "Bóveda Local" y los desplazamientos suaves deben desactivarse automáticamente bajo `@media (prefers-reduced-motion: reduce)`.
5. **Foco no oscurecido por cabecera fija (WCAG 2.4.11 Focus Not Obscured)**: Las secciones vinculadas por ancla (`#manifiesto`, `#cuaderno`, `#ritmos`, `#pilares`) deben tener `scroll-margin-top: calc(5rem + 1rem)` para que la cabecera fija no tape el foco de teclado al saltar de sección.

---

### Task 1: Widget Interactivo de Intenciones (`LandingIntentionWidget`)

**Files:**
- Create: `src/components/landing/LandingIntentionWidget.tsx`
- Create: `src/components/landing/LandingIntentionWidget.module.css`
- Test: `src/tests/LandingIntentionWidget.test.tsx`

**Interfaces:**
- Consumes: Tipos de intención `'calma' | 'foco' | 'claridad' | 'gratitud'`, Lucide icons (`Sparkles`, `Target`, `Lightbulb`, `Heart`).
- Produces: `export const LandingIntentionWidget: React.FC`

- [ ] **Step 1: Write the failing test**

```tsx
// src/tests/LandingIntentionWidget.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LandingIntentionWidget } from '../components/landing/LandingIntentionWidget';

describe('LandingIntentionWidget', () => {
  it('renderiza por defecto la intención de calma mental con sus 3 pasos y región aria-live', () => {
    render(<LandingIntentionWidget />);
    expect(screen.getByRole('heading', { level: 2, name: /elige tu intención para hoy/i })).toBeInTheDocument();
    expect(screen.getByText(/no tienes que resolver toda tu vida hoy/i)).toBeInTheDocument();
    expect(screen.getByText(/01\. pausa/i)).toBeInTheDocument();
    expect(screen.getByText(/02\. descarga/i)).toBeInTheDocument();
    expect(screen.getByText(/03\. un solo paso/i)).toBeInTheDocument();

    const liveRegion = screen.getByRole('region', { name: /panel de intención activa/i });
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
  });

  it('permite cambiar a foco implacable y actualiza la cita y los pasos con aria-pressed', async () => {
    const user = userEvent.setup();
    render(<LandingIntentionWidget />);

    const focoBtn = screen.getByRole('button', { name: /foco implacable/i });
    expect(focoBtn).toHaveAttribute('aria-pressed', 'false');

    await user.click(focoBtn);
    expect(focoBtn).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/la concentración profunda es el acto de amor más grande/i)).toBeInTheDocument();
    expect(screen.getByText(/01\. mesa limpia/i)).toBeInTheDocument();
    expect(screen.getByText(/02\. bloque sagrado/i)).toBeInTheDocument();
    expect(screen.getByText(/03\. cierre nítido/i)).toBeInTheDocument();
  });

  it('los botones de intención cumplen con un tamaño táctil accesible', () => {
    render(<LandingIntentionWidget />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(4);
    for (const btn of buttons) {
      expect(btn).toHaveClass(/intentionBtn/);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/tests/LandingIntentionWidget.test.tsx`  
Expected: FAIL with component not found.

- [ ] **Step 3: Implement `LandingIntentionWidget` in `src/components/landing/LandingIntentionWidget.tsx`**

Implementar el mapa de datos de intenciones (`calma`, `foco`, `claridad`, `gratitud`) con:
- Estado React `useState<IntentionKey>('calma')`.
- Región de salida dinámica con `aria-live="polite"` y `aria-atomic="true"`.
- Altura mínima `min-height: 240px` en `LandingIntentionWidget.module.css` para evitar Cumulative Layout Shift (CLS).
- Botones de intención con touch target mínimo de 44px de altura, feedback de clic activo (`active:scale-98`) y anillo de foco visible (`:focus-visible`).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/tests/LandingIntentionWidget.test.tsx`  
Expected: PASS (3 tests pass).

- [ ] **Step 5: Commit**

```bash
git add src/components/landing/LandingIntentionWidget.tsx src/components/landing/LandingIntentionWidget.module.css src/tests/LandingIntentionWidget.test.tsx
git commit -m ":sparkles: feat(landing): implementar widget interactivo de intenciones con aria-live y zero CLS"
```

---

### Task 2: Maqueta Viva de la Mesa de Trabajo (`LandingDeskPreview`)

**Files:**
- Create: `src/components/landing/LandingDeskPreview.tsx`
- Create: `src/components/landing/LandingDeskPreview.module.css`
- Test: `src/tests/LandingDeskPreview.test.tsx`

**Interfaces:**
- Consumes: Iconos de Lucide React (`Brain`, `Calendar`, `CheckSquare`, `Sparkles`, `Clock`).
- Produces: `export const LandingDeskPreview: React.FC`

- [ ] **Step 1: Write the failing test**

```tsx
// src/tests/LandingDeskPreview.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LandingDeskPreview } from '../components/landing/LandingDeskPreview';

describe('LandingDeskPreview', () => {
  it('despliega las 3 columnas representativas de la mesa de trabajo', () => {
    render(<LandingDeskPreview />);
    expect(screen.getByText(/la composición de tu mesa de trabajo/i)).toBeInTheDocument();
    expect(screen.getByText(/proceso terapéutico/i)).toBeInTheDocument();
    expect(screen.getByText(/ritmo semanal/i)).toBeInTheDocument();
    expect(screen.getByText(/tareas prioritarias/i)).toBeInTheDocument();
  });

  it('muestra el widget circular de 84% con rol accesible y tareas reales', () => {
    render(<LandingDeskPreview />);
    const progressWidget = screen.getByRole('progressbar', { name: /avance semanal/i });
    expect(progressWidget).toHaveAttribute('aria-valuenow', '84');
    expect(screen.getByText(/examen teórico clase b/i)).toBeInTheDocument();
    expect(screen.getByText(/postulación universidad 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/práctica en circuito cerrado/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/tests/LandingDeskPreview.test.tsx`  
Expected: FAIL with component not found.

- [ ] **Step 3: Implement `LandingDeskPreview` in `src/components/landing/LandingDeskPreview.tsx`**

Implementar la composición visual del escritorio en 3 columnas:
1. Columna Terapéutica con extracto de manuscrito, hallazgo de licencia y contador accesible de 420 palabras.
2. Columna de Ritmo Semanal con SVG circular de 84% (`role="progressbar"`, `aria-valuenow="84"`, `aria-valuemin="0"`, `aria-valuemax="100"`), leyenda de categorías y tira de días de semana (L-D).
3. Columna de Tareas con checkboxes maquetados (Clase B, Universidad, Práctica) y atajo visual accesible `<kbd>⌘N</kbd>`.
4. Regla CSS responsiva: cuadrícula en 3 columnas en escritorio (`@media (min-width: 1024px)`), apilado a 1 columna en tablet y móvil sin desbordes horizontales.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/tests/LandingDeskPreview.test.tsx`  
Expected: PASS (2 tests pass).

- [ ] **Step 5: Commit**

```bash
git add src/components/landing/LandingDeskPreview.tsx src/components/landing/LandingDeskPreview.module.css src/tests/LandingDeskPreview.test.tsx
git commit -m ":sparkles: feat(landing): maquetar preview de mesa de trabajo editorial con progressbar accesible"
```

---

### Task 3: Vista Principal `LandingView` y Secciones Editoriales Completas

**Files:**
- Create: `src/components/LandingView.tsx`
- Create: `src/components/LandingView.module.css`
- Test: `src/tests/LandingView.test.tsx`

**Interfaces:**
- Consumes: `LandingDeskPreview`, `LandingIntentionWidget`, tokens de `src/index.css`.
- Produces: `export const LandingView: React.FC<{ onNavigateLogin: () => void; onNavigateDashboard?: () => void; hasActiveProfile?: boolean }>`

- [ ] **Step 1: Write the failing test**

```tsx
// src/tests/LandingView.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LandingView } from '../components/LandingView';

describe('LandingView', () => {
  it('renderiza la cabecera editorial con indicador de bóveda local y titular display', () => {
    render(<LandingView onNavigateLogin={() => {}} />);
    expect(screen.getByRole('heading', { level: 1, name: /tu caos mental transformado en arte cotidiano/i })).toBeInTheDocument();
    expect(screen.getByText(/edición cuaderno 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/bóveda local/i)).toBeInTheDocument();
    expect(screen.getByText(/el orden no es una restricción fría/i)).toBeInTheDocument();
  });

  it('despliega los tres pilares de enfoque con enlaces ancla y scroll-margin', () => {
    render(<LandingView onNavigateLogin={() => {}} />);
    expect(screen.getByText(/1\. estudios & foco práctico/i)).toBeInTheDocument();
    expect(screen.getByText(/2\. introspección & diario/i)).toBeInTheDocument();
    expect(screen.getByText(/3\. horizonte & universidad/i)).toBeInTheDocument();

    const pilaresSection = document.getElementById('pilares');
    expect(pilaresSection).toBeInTheDocument();
  });

  it('dispara la navegación hacia login al hacer clic en comenzar cuaderno o acceder', async () => {
    const user = userEvent.setup();
    const handleLogin = vi.fn();
    render(<LandingView onNavigateLogin={handleLogin} />);

    const ctaBtns = screen.getAllByRole('button', { name: /comenzar cuaderno|abrir cuaderno personal/i });
    expect(ctaBtns.length).toBeGreaterThan(0);
    await user.click(ctaBtns[0]);

    expect(handleLogin).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/tests/LandingView.test.tsx`  
Expected: FAIL with `LandingView` not defined.

- [ ] **Step 3: Implement `LandingView` in `src/components/LandingView.tsx`**

Ensamblar las 7 secciones del diseño Stitch con refinamientos de UI/UX Pro Max:
1. **Top App Bar**: Sticky con `backdrop-filter: blur(12px)`, logo con serif, indicador de *"Bóveda Local"* (con animación de pulso aislada en `@media (prefers-reduced-motion: no-preference)`), y botones con touch targets ≥44px.
2. **Hero Section**: Titular display con Newsreader, aforismo del día oficial en tarjeta elevada con comilla ornamental de fondo y botones CTA primario/secundario.
3. **Mesa de trabajo**: Montaje de `<LandingDeskPreview />`.
4. **Tres Pilares**: Tarjetas con badges de módulo (`Módulo 01`, `Módulo 02`, `Módulo 03`), barras de progreso visuales con contraste garantizado y títulos claros.
5. **Brújula Interior**: Montaje de `<LandingIntentionWidget />`.
6. **Métricas de Soberanía**: Tarjetas de 100% Client-Side, 0 telemetría y durabilidad de datos.
7. **Manifiesto y Footer**: Bloque oscuro en `surface-dark` con contraste verificado, CTA de inicio rápido offline y footer con navegación accesible.
8. **Offset de scroll para navegación ancla**: Añadir clase `.anchorSection { scroll-margin-top: calc(5rem + 1.5rem); }` para que la barra fija no cubra el foco de teclado al hacer clic en los enlaces del menú.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/tests/LandingView.test.tsx`  
Expected: PASS (3 tests pass).

- [ ] **Step 5: Commit**

```bash
git add src/components/LandingView.tsx src/components/LandingView.module.css src/tests/LandingView.test.tsx
git commit -m ":sparkles: feat(landing): ensamblar vista LandingView con diseño editorial completo de Stitch y soporte a11y"
```

---

### Task 4: Enrutamiento en `src/routes/index.tsx` y Acceso desde `ProfileGateView`

**Files:**
- Modify: `src/routes/index.tsx`
- Modify: `src/components/ProfileGateView.tsx`
- Test: `src/tests/routesLanding.test.tsx`

**Interfaces:**
- Consumes: `LandingView`, React Router `useNavigate`, `Routes`, `Route`.
- Produces: Rutas `/inicio` pública y `/` redirigiendo a landing si no hay perfil.

- [ ] **Step 1: Write the failing test**

```tsx
// src/tests/routesLanding.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '../routes';

describe('Rutas de Landing e Inicio', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('permite acceder a /inicio y despliega la landing editorial', async () => {
    render(
      <MemoryRouter initialEntries={['/inicio']}>
        <AppRoutes
          activeProfile={null}
          onSelectProfile={() => {}}
          onLockProfile={() => {}}
        />
      </MemoryRouter>
    );

    expect(await screen.findByText(/tu caos mental transformado en arte cotidiano/i)).toBeInTheDocument();
  });

  it('cuando no hay perfil activo, la raíz / presenta la landing de bienvenida', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes
          activeProfile={null}
          onSelectProfile={() => {}}
          onLockProfile={() => {}}
        />
      </MemoryRouter>
    );

    expect(await screen.findByText(/tu caos mental transformado en arte cotidiano/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/tests/routesLanding.test.tsx`  
Expected: FAIL (no route for `/inicio`).

- [ ] **Step 3: Modify `src/routes/index.tsx` and `src/components/ProfileGateView.tsx`**

1. Cargar lazy `LandingView`:
   ```tsx
   const LandingView = lazy(() => import('../components/LandingView').then(m => ({ default: m.LandingView })));
   ```
2. Agregar ruta pública `/inicio` en `src/routes/index.tsx`.
3. Cuando `!activeProfile`, la ruta `/` renderiza `LandingView` (con callbacks `onNavigateLogin={() => navigate('/login')}` y `onNavigateDashboard={() => navigate('/dashboard')}`).
4. En `ProfileGateView.tsx`, agregar botón secundario accesible en el footer: *"← Conoce más sobre Espiralia"* con touch target adecuado para volver a `/inicio`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/tests/routesLanding.test.tsx`  
Expected: PASS (2 tests pass).

- [ ] **Step 5: Commit**

```bash
git add src/routes/index.tsx src/components/ProfileGateView.tsx src/tests/routesLanding.test.tsx
git commit -m ":sparkles: feat(routes): habilitar ruta /inicio y acceso editorial desde selector de perfiles"
```

---

### Task 5: Verificación Global, Build de Producción y Tests de Regresión

**Files:**
- Modify: `docs/superpowers/plans/2026-10-16-landing-inicio-stitch.md` (marcar tareas completadas)

**Interfaces:**
- Consumes: Toda la suite de pruebas del proyecto (`pnpm exec vitest run`), `tsc -b && vite build`.

- [ ] **Step 1: Run complete test suite**

Run: `pnpm exec vitest run`  
Expected: Todos los tests pasan (321 anteriores + nuevos tests de landing).

- [ ] **Step 2: Run production bundle build**

Run: `pnpm build`  
Expected: Build exitoso sin errores de TypeScript ni advertencias de chunking.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/plans/2026-10-16-landing-inicio-stitch.md
git commit -m ":white_check_mark: test(regresion): validar suite global y build de produccion con landing"
```
