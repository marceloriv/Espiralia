# Landing Page /inicio — Fidelidad Visual Stitch & Papelería Editorial Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar en `LandingView.tsx` y sus submódulos la fidelidad visual y táctil al 100% de la pantalla de Stitch `/inicio` (ID `173cc1cac1954ac8ac90182f9c81d8e0`, captura `docs/stitch-screens/01-inicio.png`), reproduciendo el diseño analógico de papelería editorial: hero con aforismo rotado y clips de latón, pliego A4 *Focus Plan* con borde rasgado y tareas interactivas, tarjeta de biorritmos lunares, tríada de cadencia vital, pliego nocturno con certificado notarial local-first y banner de creación.

**Architecture:** Componentización modular bajo `src/components/landing/` con CSS Modules dedicados que consumen las variables oficiales de diseño de `src/index.css` (tokens de `DESIGN.md`). El estado interactivo de la mesa de trabajo (checklist de tareas tachables y selector de estado anímico/lunar) se maneja localmente en memoria sin persistir hasta que el usuario decida registrarse o abrir su cuaderno.

**Tech Stack:** React 19, TypeScript 5.8, CSS Modules (`*.module.css`), Lucide React 1.53+, Vitest 3.x + `@testing-library/react`.

**Spec:** Diseño de pantalla Stitch `projects/2198597521553671013/screens/173cc1cac1954ac8ac90182f9c81d8e0`, captura oficial [01-inicio.png](file:///C:/Users/river/Desktop/Codigo/Proyectos/Espiralia/docs/stitch-screens/01-inicio.png), tokens maestros [DESIGN.md](file:///C:/Users/river/Desktop/Codigo/Proyectos/Espiralia/DESIGN.md) y estilos base [src/index.css](file:///C:/Users/river/Desktop/Codigo/Proyectos/Espiralia/src/index.css).

## Global Constraints

- Lienzo de fondo en marfil cálido (`--color-canvas: #faf9f5` / `#fcf9f6`), prohibido fondos blancos clínicos puros (`#ffffff`) salvo en fichas superpuestas.
- Tipografía estricta según tokens: titulares en `Newsreader, serif` (`--font-primary`), cuerpo en `Inter, sans-serif` (`--font-body`), etiquetas/código en `JetBrains Mono, monospace` (`--font-code`), y aforismos manuscritos en `Caveat, cursive` (`--font-script`).
- Identidad magenta primaria (`--color-primary: #8E1EA2`, hover `--color-primary-active: #C654C3`, soft `--color-primary-soft: #ED96D7`).
- Acentos táctiles analógicos: clips de latón dorado metálico (`.brassClip`), franjas de cinta adhesiva semitransparente (`.washiTapeMagenta`, `.washiTapeSage`), sellos de imprenta inclinados (`.stampSeal`) y textura milimetrada tenue (`.paperTexture`).
- Todos los estilos deben ser CSS Modules puros (`*.module.css`) con variables de `src/index.css` — sin estilos inline hardcodeados ni frameworks utilitarios externos que rompan el aislamiento.
- Convención de commits: Conventional Commits con Gitmoji obligatorio según AGENTS.md §11.2 (ej: `:art: style(layout): ...`, `:sparkles: feat(layout): ...`).

## Review Focus

- **Comportamiento en viewport móvil (<768px):** Las tarjetas con micro-rotación (`+2deg`, `-3deg`) y los clips decorativos no deben provocar overflow horizontal ni tapar botones táctiles (mínimo 44px de área táctil).
- **Accesibilidad y contraste WCAG 2.2 AA:** Los textos manuscritos en `Caveat` sobre notas adhesivas amarillas (`#fcf5c7`) y los sellos de imprenta rojos deben mantener ratio de contraste ≥ 4.5:1 contra sus fondos.
- **Interactividad accesible del Checklist y Selectores de Biorritmo:** Los checkboxes del Focus Plan y los botones de fase lunar/ánimo deben ser operables por teclado (`Tab`, `Space`, `Enter`) y anunciar su estado vía atributos ARIA (`aria-pressed`, `aria-checked`).
- **Navegación fluida por anclas (`#cuaderno`, `#ritmos`, `#manifiesto`):** Cada sección debe incluir `scroll-margin-top: 80px` para no quedar oculta bajo el header sticky.
- **Ruta y redirección con perfil activo:** Si el usuario ya tiene sesión activa en `localStorage`, los botones "Comenzar Cuaderno" o "Abrir Cuaderno Inmediato" navegan a `/dashboard`; si no, a `/login`.

---

### Task 1: Top Navigation Bar & Hero Section con Viñeta Analógica (Aforismo + Biorritmo)

**Files:**
- Create: `src/components/landing/LandingHeroCard.tsx`
- Create: `src/components/landing/LandingHeroCard.module.css`
- Modify: `src/components/LandingView.tsx:37-122`
- Modify: `src/components/LandingView.module.css`
- Test: `src/tests/LandingHeroCard.test.tsx`
- Test: `src/tests/LandingView.test.tsx`

**Interfaces:**
- Consumes: `LandingViewProps` (`onNavigateLogin: () => void`, `onNavigateDashboard?: () => void`, `hasActiveProfile?: boolean`).
- Produces: `LandingHeroCard` (`export const LandingHeroCard: React.FC`).

- [ ] **Step 1: Escribir el test fallido para `LandingHeroCard`**

```tsx
// src/tests/LandingHeroCard.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LandingHeroCard } from '../components/landing/LandingHeroCard';

describe('LandingHeroCard', () => {
  it('renderiza la nota adhesiva amarilla con aforismo caligráfico y clip dorado', () => {
    render(<LandingHeroCard />);
    expect(screen.getByText(/aforismo matutino/i)).toBeInTheDocument();
    expect(screen.getByText(/№ 042/i)).toBeInTheDocument();
    expect(screen.getByText(/small steps every day lead to big results/i)).toBeInTheDocument();
    expect(screen.getByText(/tinta ferrogalorresistente/i)).toBeInTheDocument();
  });

  it('despliega la ficha de biorritmo con sello de imprenta en foco y porcentaje', () => {
    render(<LandingHeroCard />);
    expect(screen.getByText(/biorritmo hoy/i)).toBeInTheDocument();
    expect(screen.getByText(/en foco/i)).toBeInTheDocument();
    expect(screen.getByText(/claridad mental/i)).toBeInTheDocument();
    expect(screen.getByText(/88%/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Ejecutar el test para verificar que falla**

Run: `pnpm exec vitest run src/tests/LandingHeroCard.test.tsx`
Expected: FAIL con error de módulo no encontrado (`LandingHeroCard`).

- [ ] **Step 3: Implementar `LandingHeroCard.tsx` y su CSS Module**

Crear `src/components/landing/LandingHeroCard.module.css` con estilos para `.stickyNote` (fondo `#fcf5c7`, borde `#ebd88d`, rotación `rotate(2deg)`), `.brassClip` (gradiente metálico dorado `linear-gradient(135deg, #d4af37 0%, #aa820a 50%, #f3e5ab 100%)`), `.washiTapeMagenta` (cinta magenta semitransparente con `backdrop-filter: blur(2px)`), `.quoteText` en fuente caligráfica `Caveat`, y `.indexCard` superpuesta con `.stampSeal` rotado `-5deg` y barra de progreso al 88%.

Implementar `src/components/landing/LandingHeroCard.tsx`:
```tsx
import React from 'react';
import styles from './LandingHeroCard.module.css';

export const LandingHeroCard: React.FC = () => {
  return (
    <div className={styles.heroVignetteContainer}>
      <aside className={styles.stickyNote} aria-label="Aforismo Matutino de Autor">
        <div className={styles.brassClip} aria-hidden="true" />
        <div className={styles.washiTapeMagenta} aria-hidden="true" />
        <div className={styles.noteHeader}>
          <span>Aforismo Matutino</span>
          <span className={styles.noteNumber}>№ 042</span>
        </div>
        <blockquote className={styles.quoteText}>
          «small steps every day lead to big results ♡»
        </blockquote>
        <div className={styles.noteFooter}>
          <span>Tinta ferrogalorresistente</span>
          <time dateTime="08:30">08:30 AM · En calma</time>
        </div>
      </aside>

      <div className={styles.indexCard} aria-label="Biorritmo Hoy">
        <div className={styles.indexCardHeader}>
          <span className={styles.indexCardTitle}>Biorritmo Hoy</span>
          <span className={styles.stampSeal}>En Foco</span>
        </div>
        <div className={styles.clarityRow}>
          <span>Claridad mental:</span>
          <span className={styles.clarityValue}>88%</span>
        </div>
        <div className={styles.progressBarBg} role="progressbar" aria-valuenow={88} aria-valuemin={0} aria-valuemax={100} aria-label="Claridad mental">
          <div className={styles.progressBarFill} style={{ width: '88%' }} />
        </div>
        <p className={styles.indexCardDesc}>
          Fase ideal para escritura profunda y diseño de estructuras.
        </p>
      </div>
    </div>
  );
};
```

- [ ] **Step 4: Integrar en `LandingView.tsx` (Top Nav & Hero Layout)**

Actualizar `src/components/LandingView.tsx` para incorporar:
1. Header sticky con logotipo `☲ Espiralia`, badge `v2.4 Papelería`, enlaces (`#manifiesto`, `#cuaderno`, `#ritmos`, `#metodologia`), botón `Acceder` y botón primario `Comenzar Cuaderno`.
2. Sección Hero con badge `100% Client-Side • Sin Rastreo • Almacenamiento Local`, gran titular display Newsreader, subtítulo suizo, botones `Abrir Cuaderno Inmediato` y `Explorar Mesa de Trabajo`, barra de micro-especificaciones (`IndexedDB cifrado`, `Exporta a .MD & .ICS`, `Listo para imprenta A4/A5`), y la columna derecha renderizando `<LandingHeroCard />`.

- [ ] **Step 5: Ejecutar los tests de Task 1**

Run: `pnpm exec vitest run src/tests/LandingHeroCard.test.tsx src/tests/LandingView.test.tsx`
Expected: PASS en ambas suites.

- [ ] **Step 6: Commit de Task 1**

```bash
git add src/components/landing/LandingHeroCard.tsx src/components/landing/LandingHeroCard.module.css src/components/LandingView.tsx src/components/LandingView.module.css src/tests/LandingHeroCard.test.tsx src/tests/LandingView.test.tsx
git commit -m ":art: style(layout): implementar hero editorial y nota adhesiva táctil de inicio"
```

---

### Task 2: Mesa de Trabajo Viva (Focus Plan A4 & Biorritmos Bento Grid)

**Files:**
- Modify: `src/components/landing/LandingDeskPreview.tsx`
- Modify: `src/components/landing/LandingDeskPreview.module.css`
- Test: `src/tests/LandingDeskPreview.test.tsx`

**Interfaces:**
- Consumes: Tokens CSS (`--color-canvas`, `--color-surface-card`, `--color-hairline`, `--color-primary`, `--color-accent-teal`).
- Produces: `LandingDeskPreview: React.FC` con pliego interactivo de 2 columnas (Focus Plan A4 a la izquierda, Mood & Energy + Nota rápida a la derecha).

- [ ] **Step 1: Escribir el test fallido para la nueva estructura de `LandingDeskPreview`**

```tsx
// src/tests/LandingDeskPreview.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LandingDeskPreview } from '../components/landing/LandingDeskPreview';

describe('LandingDeskPreview (Papercraft)', () => {
  it('renderiza el pliego Focus Plan con prioridades innegociables y bloques horarios', () => {
    render(<LandingDeskPreview />);
    expect(screen.getByText(/muestrario de papelería activa/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: /focus plan/i })).toBeInTheDocument();
    expect(screen.getByText(/prioridades innegociables/i)).toBeInTheDocument();
    expect(screen.getByText(/bloques horarios/i)).toBeInTheDocument();
    expect(screen.getByText(/bloque creativo alpha/i)).toBeInTheDocument();
    expect(screen.getByText(/pliego de 300g libre de ácido/i)).toBeInTheDocument();
  });

  it('permite tachar tareas en el checklist táctil de tareas reales', async () => {
    const user = userEvent.setup();
    render(<LandingDeskPreview />);
    const taskCheckbox = screen.getByRole('checkbox', { name: /archivar borradores de octubre/i });
    expect(taskCheckbox).not.toBeChecked();

    await user.click(taskCheckbox);
    expect(taskCheckbox).toBeChecked();
  });

  it('despliega el registro basal de ánimo y fases lunares interactivas', async () => {
    const user = userEvent.setup();
    render(<LandingDeskPreview />);
    expect(screen.getByText(/mood & energy rhythm/i)).toBeInTheDocument();

    const lucidaBtn = screen.getByRole('button', { name: /lúcida/i });
    expect(lucidaBtn).toHaveAttribute('aria-pressed', 'true');

    const calmaBtn = screen.getByRole('button', { name: /calma/i });
    await user.click(calmaBtn);
    expect(calmaBtn).toHaveAttribute('aria-pressed', 'true');
    expect(lucidaBtn).toHaveAttribute('aria-pressed', 'false');
  });

  it('muestra la nota rápida de autor en azul pizarra con pin dorado', () => {
    render(<LandingDeskPreview />);
    expect(screen.getByText(/nota rápida de autor/i)).toBeInTheDocument();
    expect(screen.getByText(/no persigas optimizar cada minuto del reloj/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Ejecutar el test para verificar que falla**

Run: `pnpm exec vitest run src/tests/LandingDeskPreview.test.tsx`
Expected: FAIL (falta contenido del nuevo Focus Plan y selectores de ánimo).

- [ ] **Step 3: Implementar el nuevo `LandingDeskPreview.tsx` y CSS Module**

Actualizar `src/components/landing/LandingDeskPreview.tsx`:
1. **Focus Plan Sheet (Columna Izquierda 7 cols):**
   - Washi tape verde salvia (`.washiTapeSage`) y clip metálico dorado superior.
   - Encabezado con tipografía Newsreader y metadatos `Fecha de Registro: 24 Octubre 2025`.
   - Bloque `Prioridades Innegociables` (01, 02, 03 con checkmarks activos).
   - Bloques horarios (07:00 Despertar, 09:00 Bloque Creativo Alpha resaltado en primary soft, 13:30, 16:00, 21:30).
   - Checklist de tareas reales interactivas (`useState` local para alternar estado tachado).
   - Frase caligráfica en pie de pliego: `«progress, not perfection. ♡»`.
2. **Columna Derecha (5 cols):**
   - Tarjeta `Mood & Energy Rhythm`: ciclo lunar (🌑 Reposo, 🌓 Recupera, 🌕 Plenitud destacado, 🌖 Expansión, 🌘 Refugio) y selector de ánimo basal (Turbia, Calma, Lúcida, Viva, Cansada) con `aria-pressed`.
   - Medidores de barra para `Concentración Sostenida` (4.5 hrs) y `Serenidad Emocional` (90%).
   - Tarjeta azul pizarra (`#7B8C9E`) con pin dorado superior (`.goldenPin`) y aforismo caligráfico `«No persigas optimizar cada minuto del reloj. Haz espacio para mirar por la ventana sin remordimiento.»`.

Actualizar `src/components/landing/LandingDeskPreview.module.css` con fondos de textura milimetrada `.paperTexture` (`radial-gradient(#e6dfd8 0.75px, transparent 0.75px)`), `.focusSheetCard` con sombra difusa multicapa, bordes hairline y tipografías asignadas.

- [ ] **Step 4: Ejecutar el test para verificar que pasa**

Run: `pnpm exec vitest run src/tests/LandingDeskPreview.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit de Task 2**

```bash
git add src/components/landing/LandingDeskPreview.tsx src/components/landing/LandingDeskPreview.module.css src/tests/LandingDeskPreview.test.tsx
git commit -m ":sparkles: feat(layout): renovar mesa de trabajo viva con focus plan papercraft y biorritmos"
```

---

### Task 3: Sección Cadencia Vital & Tríada de Estaciones del Día

**Files:**
- Create: `src/components/landing/LandingRitmosSection.tsx`
- Create: `src/components/landing/LandingRitmosSection.module.css`
- Modify: `src/components/LandingView.tsx`
- Test: `src/tests/LandingRitmosSection.test.tsx`

**Interfaces:**
- Consumes: Ancla `#ritmos`.
- Produces: `LandingRitmosSection: React.FC` con las 3 tarjetas de metodología de biorritmos editoriales (Amanecer, Cenit, Crepúsculo).

- [ ] **Step 1: Escribir el test fallido para `LandingRitmosSection`**

```tsx
// src/tests/LandingRitmosSection.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LandingRitmosSection } from '../components/landing/LandingRitmosSection';

describe('LandingRitmosSection', () => {
  it('renderiza el encabezado de biorritmo y la espiral armónica', () => {
    render(<LandingRitmosSection />);
    expect(screen.getByText(/biorritmos & cadencia vital/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /tu tiempo no es una línea recta: es una espiral armónica/i })).toBeInTheDocument();
  });

  it('despliega los tres pilares de estaciones vitales con sus tiempos y lemas', () => {
    render(<LandingRitmosSection />);
    expect(screen.getByText(/01 \/ amanecer/i)).toBeInTheDocument();
    expect(screen.getByText(/foco sin dispersión/i)).toBeInTheDocument();
    expect(screen.getByText(/bloque alpha: 90 minutos/i)).toBeInTheDocument();

    expect(screen.getByText(/02 \/ cenit/i)).toBeInTheDocument();
    expect(screen.getByText(/serenidad en la acción/i)).toBeInTheDocument();
    expect(screen.getByText(/máximo 3 prioridades diarias/i)).toBeInTheDocument();

    expect(screen.getByText(/03 \/ crepúsculo/i)).toBeInTheDocument();
    expect(screen.getByText(/cierre & gratitud/i)).toBeInTheDocument();
    expect(screen.getByText(/ritual de desconexión completa/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Ejecutar el test para verificar que falla**

Run: `pnpm exec vitest run src/tests/LandingRitmosSection.test.tsx`
Expected: FAIL con error de módulo no encontrado.

- [ ] **Step 3: Implementar `LandingRitmosSection.tsx` y su CSS Module**

Crear `src/components/landing/LandingRitmosSection.tsx`:
```tsx
import React from 'react';
import { Sunrise, Sparkles, Moon, ArrowRight } from 'lucide-react';
import styles from './LandingRitmosSection.module.css';

export const LandingRitmosSection: React.FC = () => {
  return (
    <section id="ritmos" className={styles.ritmosSection} aria-labelledby="ritmos-heading">
      <div className={styles.headerContainer}>
        <span className={styles.sectionBadge}>Biorritmos & Cadencia Vital</span>
        <h2 id="ritmos-heading" className={styles.sectionTitle}>
          Tu tiempo no es una línea recta: es una espiral armónica.
        </h2>
        <p className={styles.sectionSubtitle}>
          Alinea tus tareas más complejas con tus picos biológicos de lucidez. Reemplaza los plazos angustiantes por estaciones de contemplación.
        </p>
      </div>

      <div className={styles.pillarsGrid}>
        <article className={styles.pillarCard}>
          <div>
            <div className={styles.iconBox} style={{ color: 'var(--color-primary)' }}>
              <Sunrise size={24} aria-hidden="true" />
            </div>
            <span className={styles.pillarNumber}>01 / Amanecer</span>
            <h3 className={styles.pillarTitle}>Foco sin Dispersión</h3>
            <p className={styles.pillarDesc}>
              Reserva las primeras dos horas del día para crear antes de consumir. Sin notificaciones entrantes, con la mente reposada y el pliego en blanco.
            </p>
          </div>
          <div className={styles.pillarFooter} style={{ color: 'var(--color-primary)' }}>
            <span>Bloque Alpha: 90 minutos</span>
            <ArrowRight size={14} aria-hidden="true" />
          </div>
        </article>

        <article className={styles.pillarCard}>
          <div>
            <div className={styles.iconBox} style={{ color: 'var(--color-accent-teal)' }}>
              <Sparkles size={24} aria-hidden="true" />
            </div>
            <span className={styles.pillarNumber}>02 / Cenit</span>
            <h3 className={styles.pillarTitle}>Serenidad en la Acción</h3>
            <p className={styles.pillarDesc}>
              Gestión de tareas cotidianas y correspondencia humana. Priorizar sólo tres acciones para evitar la trampa del hiperrendimiento vacío.
            </p>
          </div>
          <div className={styles.pillarFooter} style={{ color: 'var(--color-accent-teal)' }}>
            <span>Máximo 3 prioridades diarias</span>
            <ArrowRight size={14} aria-hidden="true" />
          </div>
        </article>

        <article className={styles.pillarCard}>
          <div>
            <div className={styles.iconBox} style={{ color: 'var(--color-primary-active)' }}>
              <Moon size={24} aria-hidden="true" />
            </div>
            <span className={styles.pillarNumber}>03 / Crepúsculo</span>
            <h3 className={styles.pillarTitle}>Cierre & Gratitud</h3>
            <p className={styles.pillarDesc}>
              El arte de cerrar el cuaderno. Registrar qué salió bien, qué se deja en pausa sin culpa y preparar el escritorio para el reposo nocturno.
            </p>
          </div>
          <div className={styles.pillarFooter} style={{ color: 'var(--color-primary-active)' }}>
            <span>Ritual de desconexión completa</span>
            <ArrowRight size={14} aria-hidden="true" />
          </div>
        </article>
      </div>
    </section>
  );
};
```

Crear `src/components/landing/LandingRitmosSection.module.css` con `scroll-margin-top: 80px`, grid responsive de 3 columnas, bordes hairline y hover suave en tarjetas.

- [ ] **Step 4: Conectar en `LandingView.tsx` y verificar que pasa el test**

Run: `pnpm exec vitest run src/tests/LandingRitmosSection.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit de Task 3**

```bash
git add src/components/landing/LandingRitmosSection.tsx src/components/landing/LandingRitmosSection.module.css src/components/LandingView.tsx src/tests/LandingRitmosSection.test.tsx
git commit -m ":art: style(layout): agregar seccion de ritmos y cadencia vital editorial"
```

---

### Task 4: Pliego Nocturno `#181715`, Certificado Notarial Local-First & Banner de Creación

**Files:**
- Create: `src/components/landing/LandingManifestoSection.tsx`
- Create: `src/components/landing/LandingManifestoSection.module.css`
- Modify: `src/components/LandingView.tsx`
- Modify: `src/components/LandingView.module.css`
- Test: `src/tests/LandingManifestoSection.test.tsx`

**Interfaces:**
- Consumes: `onPrimaryCta: () => void`.
- Produces: `LandingManifestoSection: React.FC<{ onPrimaryCta: () => void }>` y banner `#cuaderno`.

- [ ] **Step 1: Escribir el test fallido para `LandingManifestoSection`**

```tsx
// src/tests/LandingManifestoSection.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LandingManifestoSection } from '../components/landing/LandingManifestoSection';

describe('LandingManifestoSection', () => {
  it('renderiza el manifiesto de soberanía digital sobre fondo nocturno con el certificado notarial', () => {
    render(<LandingManifestoSection onPrimaryCta={() => {}} />);
    expect(screen.getByText(/manifiesto de soberanía digital/i)).toBeInTheDocument();
    expect(screen.getByText(/tu tiempo no es una métrica corporativa/i)).toBeInTheDocument();
    expect(screen.getByText(/garantía local-first/i)).toBeInTheDocument();
    expect(screen.getByText(/indexeddb nativo/i)).toBeInTheDocument();
    expect(screen.getByText(/telemetría:/i)).toBeInTheDocument();
    expect(screen.getByText(/0% \(inexistente\)/i)).toBeInTheDocument();
  });

  it('dispara la acción de comenzar cuaderno al hacer clic en el botón del certificado', async () => {
    const user = userEvent.setup();
    const handleCta = vi.fn();
    render(<LandingManifestoSection onPrimaryCta={handleCta} />);

    const ctaBtn = screen.getByRole('button', { name: /iniciar sin registro/i });
    await user.click(ctaBtn);

    expect(handleCta).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Ejecutar el test para verificar que falla**

Run: `pnpm exec vitest run src/tests/LandingManifestoSection.test.tsx`
Expected: FAIL con error de módulo no encontrado.

- [ ] **Step 3: Implementar `LandingManifestoSection.tsx` y su CSS Module**

Implementar `src/components/landing/LandingManifestoSection.tsx` con fondo `#181715`, tipografía serif en marfil `#faf9f5`, y tarjeta de certificado notarial `#252320` con sello circular `§`, tabla de especificaciones (IndexedDB Nativo, Telemetría 0%, Exportabilidad JSON/MD/iCal/PDF) y botón `Iniciar sin Registro`.

Incorporar en `src/components/LandingView.tsx` el banner de llamada final `Tu Cuaderno te Espera` (enmarcado con washi tape magenta superior, botón `Comenzar Cuaderno` y botón `Descargar Plantillas Imprimibles (PDF)`), así como el pie de página editorial completo con enlaces a Filosofía, Privacidad, Guía Tipográfica y Glosario.

- [ ] **Step 4: Ejecutar el test para verificar que pasa**

Run: `pnpm exec vitest run src/tests/LandingManifestoSection.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit de Task 4**

```bash
git add src/components/landing/LandingManifestoSection.tsx src/components/landing/LandingManifestoSection.module.css src/components/LandingView.tsx src/components/LandingView.module.css src/tests/LandingManifestoSection.test.tsx
git commit -m ":sparkles: feat(layout): agregar manifiesto en pliego nocturno y certificado local-first"
```

---

### Task 5: Integración Final, Verificación E2E, Accesibilidad & Suite Completa de Tests

**Files:**
- Modify: `src/components/LandingView.tsx`
- Modify: `src/tests/LandingView.test.tsx`
- Modify: `src/tests/routesLanding.test.tsx`

**Interfaces:**
- Consumes: Todos los submódulos integrados.
- Produces: Landing completa, verificada con typecheck, linter y suite de tests 100% en verde.

- [ ] **Step 1: Actualizar `src/tests/LandingView.test.tsx` para cubrir todos los módulos integrados**

```tsx
// src/tests/LandingView.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LandingView } from '../components/LandingView';

describe('LandingView (Stitch Visual Fidelity)', () => {
  it('renderiza todas las secciones clave de la landing page editorial', () => {
    render(<LandingView onNavigateLogin={() => {}} />);

    // Top Bar & Hero
    expect(screen.getByRole('heading', { level: 1, name: /el arte de organizar tu vida con serenidad cotidiana/i })).toBeInTheDocument();
    expect(screen.getByText(/100% client-side • sin rastreo • almacenamiento local/i)).toBeInTheDocument();
    expect(screen.getByText(/v2\.4 papelería/i)).toBeInTheDocument();

    // Aforismo en Hero
    expect(screen.getByText(/small steps every day lead to big results/i)).toBeInTheDocument();

    // Mesa de Trabajo (Focus Plan)
    expect(screen.getByText(/focus plan/i)).toBeInTheDocument();
    expect(screen.getByText(/prioridades innegociables/i)).toBeInTheDocument();

    // Ritmos & Metodología
    expect(screen.getByText(/biorritmos & cadencia vital/i)).toBeInTheDocument();

    // Manifiesto Nocturno
    expect(screen.getByText(/manifiesto de soberanía digital/i)).toBeInTheDocument();
    expect(screen.getByText(/garantía local-first/i)).toBeInTheDocument();

    // Banner de Cierre
    expect(screen.getByText(/tu cuaderno te espera/i)).toBeInTheDocument();
  });

  it('permite navegación fluida a login o dashboard según el estado del perfil', async () => {
    const user = userEvent.setup();
    const handleLogin = vi.fn();
    const handleDashboard = vi.fn();

    // Sin perfil -> va a login
    const { unmount } = render(<LandingView onNavigateLogin={handleLogin} onNavigateDashboard={handleDashboard} hasActiveProfile={false} />);
    const ctaBtns = screen.getAllByRole('button', { name: /comenzar cuaderno|abrir cuaderno inmediato/i });
    await user.click(ctaBtns[0]);
    expect(handleLogin).toHaveBeenCalledTimes(1);
    expect(handleDashboard).not.toHaveBeenCalled();

    unmount();

    // Con perfil activo -> va a dashboard
    render(<LandingView onNavigateLogin={handleLogin} onNavigateDashboard={handleDashboard} hasActiveProfile={true} />);
    const ctaBtnsActive = screen.getAllByRole('button', { name: /comenzar cuaderno|abrir cuaderno inmediato/i });
    await user.click(ctaBtnsActive[0]);
    expect(handleDashboard).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Ejecutar la suite completa de pruebas unitarias y de integración**

Run: `pnpm exec vitest run src/tests/LandingView.test.tsx src/tests/LandingHeroCard.test.tsx src/tests/LandingDeskPreview.test.tsx src/tests/LandingRitmosSection.test.tsx src/tests/LandingManifestoSection.test.tsx src/tests/routesLanding.test.tsx`
Expected: Todos los tests pasan (PASS).

- [ ] **Step 3: Ejecutar comprobación de tipos y build de producción**

Run: `pnpm build`
Expected: Compilación exitosa en `dist/` con 0 errores TypeScript.

- [ ] **Step 4: Commit de Task 5**

```bash
git add src/components/LandingView.tsx src/tests/LandingView.test.tsx src/tests/routesLanding.test.tsx
git commit -m ":white_check_mark: test(layout): unificar verificacion y tests de fidelidad visual para landing inicio"
```

---

## Self-Review Checklist

1. **Spec coverage:** Todos los bloques de `01-inicio.png` / `173cc1cac1954ac8ac90182f9c81d8e0` están cubiertos: Top bar, Hero con sticky aforismo + biorritmo, Mesa de trabajo Focus Plan A4 con checklist y biorritmo basal, Tríada de cadencia vital, Pliego nocturno con certificado notarial, y Banner de cierre.
2. **Step scan:** Cada paso tiene un comando o bloque ejecutable unívoco con su resultado esperado.
3. **Type consistency:** Las interfaces `LandingViewProps`, `LandingHeroCard`, `LandingDeskPreview`, `LandingRitmosSection`, y `LandingManifestoSection` se mantienen coherentes en imports y props.
4. **Review Focus:** Se agregaron pruebas para navegación condicional (con y sin perfil), interactividad de checklist y accesibilidad de botones.
5. **Proporción y Ponytail:** Reutiliza tokens de `src/index.css` e iconos de `lucide-react`, sin dependencias externas adicionales.
