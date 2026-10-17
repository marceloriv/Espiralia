```python
plan_content = """# Máximo Impacto Visual para Espiralia — Plan Maestro de Implementación v2.0

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`[ ]`) syntax for tracking.

**Goal:** Elevar todas las vistas de Espiralia (`/login`, `/dashboard`, `/planner`, `/todo`, `/agenda`, `/notes`, `/folders`, `/integrations` y el shell compartido `AppLayout`) al estándar de máximo impacto visual establecido en las referencias maestras de Stitch y el showcase HIBI Papercraft, conservando los detalles de papelería artesanal (clips de latón 3D, solapas Manila con marcas de agua translúcidas gigantes, bordes de papel rasgado, renglones verjurados, sellos notariales hanko/lacre y cintas washi), con **cero regresiones** en la suite de pruebas de Vitest y compatibilidad WCAG 2.2 AA.

**Architecture:** Aplicación SPA 100% en cliente sin backend ni dependencias de nube. Componentes funcionales en React 19 + TypeScript con estilos rigurosamente encapsulados en CSS Modules (`*.module.css`) que consumen los tokens analógicos oficiales de `src/index.css` y primitivas reutilizables en `src/components/common/PaperOrnament.tsx`. Aislamiento estricto de datos en `localStorage` particionado por `profileId` mediante `StorageService`.

**Tech Stack:** React 19, TypeScript 5.8, Vite 6.4, CSS Modules, Lucide React (1.53+), Vitest 3.x, `@testing-library/react` 16.x.

**Spec:** Capturas maestras de scroll completo (hasta 2800px) y código HTML/CSS exportado en `docs/stitch_espiralia/` y sistema de diseño en `docs/stitch_espiralia/warm_editorial_magenta/DESIGN.md`.

---

## Global Constraints & Guardrails

- **Stack estricto:** React 19 + TypeScript 5.8 + Vite. Cero librerías UI pesadas en runtime. Todo estilo vía CSS Modules (`*.module.css`) consumiendo variables CSS globales de `src/index.css`.
- **Prohibición de Blanco Clínico (`#FFFFFF`):** Ningún lienzo o tarjeta principal usará `#FFFFFF` puro. El contraste entre capas se construye mediante iluminación cálida (`#FCF9F6` sobre `#F3EFE6` / `#EFE9DE`) y sombras multicapa de contacto y oclusión.
- **Tipografía analógica:**
  - `--font-primary` / `--font-serif`: `"Newsreader", "Copernicus", "Tiempos Headline", Georgia, serif` para titulares monumentales con relieve letterpress.
  - `--font-family-2` / `--font-sans`: `"Plus Jakarta Sans", "StyreneB", Inter, sans-serif` para cuerpo e interfaz.
  - `--font-family-3` / `--font-mono`: `"JetBrains Mono", ui-monospace, monospace` para metadatos, sellos técnicos y marcas de tiempo.
  - `--font-handwriting`: `"Caveat", "Segoe Print", cursive` para notas adhesivas, post-its y citas manuscritas.
- **Tokens de color y sombra oficiales (con alias retrocompatibles en `src/index.css`):**
  - Papel y lienzo: `--bg-canvas` (`#F3EFE6`), `--bg-card` (`#FCF9F6`), `--bg-manila` (`#EDE3D0`), `--bg-postit` (`#FFF9D6`), `--bg-slate-paper` (`#E8EDF2`), `--bg-surface-soft` (`#F5F0E8`).
  - Tintas y acentos: `--primary` (`#8E1EA2`), `--primary-deep` (`#6E0081`), `--primary-active` (`#C654C3`), `--accent-amber` (`#E8A55A`), `--accent-terracotta` (`#D4745E`), `--accent-teal` (`#5DB8A6`), `--accent-sage` (`#5A826D`), `--error` (`#C64545`).
  - Sombras multicapa 3D:
    - `--shadow-sheet`: `0 1px 2px rgba(26, 25, 23, 0.06), 0 10px 24px -4px rgba(26, 25, 23, 0.08)`
    - `--shadow-card-stack`: `0 1px 2px rgba(26, 25, 23, 0.07), 0 4px 0 -1px #FAF6F0, 0 5px 2px -1px rgba(26, 25, 23, 0.06), 0 14px 28px -6px rgba(26, 25, 23, 0.10)`
    - `--shadow-postit`: `2px 8px 18px -4px rgba(26, 25, 23, 0.14), 0 1px 3px rgba(26, 25, 23, 0.08)`
    - `--shadow-pin`: `1px 3px 5px rgba(0, 0, 0, 0.28), inset 0 1px 1px rgba(255, 255, 255, 0.7)`
    - `--shadow- recessed`: `inset 0 2px 4px rgba(20, 20, 19, 0.08), 0 1px 0 rgba(255, 255, 255, 0.8)`
- **Retrocompatibilidad de Props e Interfaces:** Todas las vistas (`AgendaView`, `PlannerView`, `TodoView`, `NotesView`, `FoldersView`, `IntegrationsView`) deben aceptar `{ profileId?: string; profile?: Profile; onNavigate?: (view: ViewType) => void }` resolviendo internamente `const activeProfileId = profile?.id ?? profileId ?? ''`.
- **Accesibilidad, Rendimiento & Ergonomía:**
  - Contraste WCAG 2.2 AA (mínimo 4.5:1 para texto normal) y touch targets mínimos de 44x44px.
  - Respeto estricto a `@media (prefers-reduced-motion: reduce)` desactivando pulsaciones infinitas.
  - Todo adorno físico (`brass-paperclip`, `washi-tape`, `wax-seal`, `hanko-stamp`) debe renderizarse con `aria-hidden="true"` y `pointer-events: none`.

---

## Especificaciones de Materialidad Física en Puro CSS (Zero-JS Assets)

1. **Clip de Latón Físico (`brass-paperclip`):**
   - Dimensiones: `24px x 64px`, `position: absolute; top: -14px; left: 24px; z-index: 10; pointer-events: none;`.
   - Alambre metálico: `background-image: linear-gradient(90deg, #b58929, #e6c667, #966f1f, #d4af37)`.
   - Relieve interno: `box-shadow: inset 2px 0 0 -1px #fff3a6, inset -2px 0 0 -1px #59410d, 2px 4px 8px rgba(0,0,0,0.2)`.
   - Filtro de elevación: `filter: drop-shadow(1px 2px 2px rgba(0, 0, 0, 0.15))`.
2. **Sello Notarial de Cera Lacre (`wax-seal`) & Sello Japonés Hanko (`hanko-stamp`):**
   - Lacre: `border-radius: 42% 58% 48% 52% / 53% 43% 57% 47%`, `radial-gradient(circle at 35% 35%, #9b111e 0%, #6e0081 60%, #380042 100%)`, `box-shadow: 0 2px 4px rgba(0,0,0,0.3), 0 8px 16px rgba(74,4,4,0.4), inset 0 2px 3px rgba(255,120,120,0.4)`.
   - Hanko (`済` / `ARCHIVADO`): Borde doble bermellón `2px solid rgba(198, 69, 69, 0.78)`, rotación `-6deg`, `mix-blend-mode: multiply`.
3. **Solapas Manila con Corte Trapezoidal (`manila-folder-tab`):**
   - Ángulo de archivador: `clip-path: polygon(8% 0%, 92% 0%, 100% 100%, 0% 100%)`.
   - Fondo: `--bg-manila` (`#EDE3D0`), marca de agua translúcida gigante (`01`, `02`, `03`) al 15% de opacidad (`font-size: 4.5rem; color: rgba(142, 30, 162, 0.15)`).
4. **Borde Dentado de Papel Rasgado (`torn-paper-edge`):**
   - Remate orgánico mediante `clip-path: polygon(0% 0%, 100% 0%, 100% calc(100% - 6px), 97% 100%, 94% calc(100% - 5px), 90% 100%, 86% calc(100% - 6px), 82% 100%, 78% calc(100% - 4px), 74% 100%, 70% calc(100% - 6px), 66% 100%, 62% calc(100% - 5px), 58% 100%, 54% calc(100% - 6px), 50% 100%, 46% calc(100% - 4px), 42% 100%, 38% calc(100% - 6px), 34% 100%, 30% calc(100% - 5px), 26% 100%, 22% calc(100% - 6px), 18% 100%, 14% calc(100% - 4px), 10% 100%, 6% calc(100% - 6px), 3% 100%, 0% calc(100% - 5px))`.
5. **Renglones Verjurados con Margen Vertical Violeta (`notes-ruled-sheet`):**
   - Margen vertical izquierdo violeta (`border-left: 2px solid rgba(142, 30, 162, 0.22)`) a `56px` del borde del papel y pauta de `28px` con `repeating-linear-gradient`.
6. **Cintas Washi Translúcidas (`washi-tape`):**
   - Variantes terracota (`rgba(212, 116, 94, 0.55)`), orquídea (`rgba(237, 150, 215, 0.55)`), salvia (`rgba(90, 130, 109, 0.45)`) y pizarra (`rgba(225, 230, 235, 0.65)`) con bordes laterales dentados y micro-rotación (`-2deg` a `2deg`).

---

## Contratos de No-Regresión en Tests Existentes

Para garantizar que el 100% de los tests previos sigan pasando junto con los nuevos tests de diseño Stitch:
1. **`ProfileGateView` (`/login`):** Conservar el texto `Selecciona tu perfil` (como subtítulo o kicker), el botón `Nuevo perfil`, el modal con label `Nombre` y botón `Crear perfil`, y el modal/panel de PIN con texto `Ingresa tu PIN`, `<input aria-label="PIN de acceso" />`, mensaje `PIN incorrecto` y botón `Desbloquear`.
2. **`AppLayout`:** Conservar el texto `Espiralia`, el nombre del perfil activo, y al menos un botón con nombre accesible `/cambiar perfil/i`.
3. **`DashboardView` (`/dashboard`):** Conservar el saludo `¡Hola, {profile.name}!`, el botón `Ver agenda completa` y los checkboxes con `aria-label="completar {todo.title}"`.
4. **`PlannerView` (`/planner`):** Conservar el kicker/subtítulo `Planner y objetivos`, el input con placeholder `Objetivo o bloque de enfoque`, el botón `Agregar bloque`, los botones de periodo (`Semanal`, `Mensual`), el texto de estado vacío `Sin bloques para mañana. Agrega un objetivo`, y los controles `completar {block.title}` / `eliminar {block.title}`.
5. **`TodoView` (`/todo`):** Conservar el kicker/subtítulo `Mis tareas`, el input con placeholder `¿Qué tienes pendiente?`, los botones de filtro (`Todas`, `Pendientes`, `Completadas`), y los textos exactos de estado vacío (`Aún no has agregado tareas`, `Usa el formulario superior para crear tu primera tarea`, `Sin tareas completadas aún`, `¡Todo al día!`).
6. **`AgendaView` (`/agenda`):** Conservar el kicker/subtítulo `Agenda de eventos`, el input con placeholder `Título del evento`, el botón `Agregar evento`, los botones `Mes anterior`, `Mes siguiente`, `Día {N}`, el texto `Nuevo evento para {YYYY-MM-DD}` y el botón `eliminar {event.title}`.

---

## Desglose de Tareas (11 Tareas)

```text
Task 0:  Foundation — Tokens CSS, Tipos, Storage, Rutas y PaperOrnament     -> verify: types.test.ts, storage.test.ts, routes.test.tsx
Task 1:  Shared Atelier Shell (AppLayout & TopNavBar de Papelería)          -> verify: AppLayout.test.tsx
Task 2:  Screen 2 — /login (ProfileGateView: Pliego & Teclado Híbrido 3x4)  -> verify: ProfileGateView.test.tsx
Task 3:  Screen 3 — /dashboard (DashboardView: HIBI Daily, Mood & Dump)     -> verify: DashboardView.test.tsx
Task 4:  Screen 4 — /planner (PlannerView & Grid Semanal 7 Días)            -> verify: PlannerView.test.tsx
Task 5:  Screen 5 — /todo (TodoView & Solapas Manila con Marcas de Agua)    -> verify: TodoView.test.tsx
Task 6:  Screen 6 — /agenda (AgendaView: Almanaque de Mesa & Pliego Diario) -> verify: AgendaView.test.tsx
Task 7:  Screen 7 — /notes (NotesView: Cuaderno Terapéutico Verjurado)      -> verify: NotesView.test.tsx
Task 8:  Screen 8 — /folders (FoldersView: Fichero Archival & Sellos)       -> verify: FoldersView.test.tsx
Task 9:  Screen 9 — /integrations (IntegrationsView & Bóveda Local)         -> verify: IntegrationsView.test.tsx
Task 10: Verificación Global, Regresión Cero, Build y Capturas Playwright   -> verify: pnpm exec vitest run && pnpm build

```

---

### Task 0: Foundation — Tokens CSS, Tipos, Storage, Rutas y Primitivas `PaperOrnament`

**Files:**

* Modify: `src/index.css`
* Modify: `src/types/index.ts`
* Modify: `src/services/storage.ts`
* Create: `src/components/common/PaperOrnament.tsx`
* Create: `src/components/common/PaperOrnament.module.css`
* Modify: `src/routes/index.tsx`
* Modify: `src/routes/ProtectedRoute.tsx`
* Test: `src/tests/types.test.ts`
* Test: `src/tests/storage.test.ts`

**Interfaces:**

* Amplía `ViewType` a `'dashboard' | 'agenda' | 'planner' | 'todo' | 'notes' | 'folders' | 'integrations'`.
* Añade tipos `NoteItem`, `FolderItem`, `HabitTrackerItem`, `MoodEntry` en `src/types/index.ts`.
* Amplía `StorageService` con métodos para notas, carpetas, hábitos y exportación/importación JSON/ICS con borrado en cascada en `deleteProfile`.
* Crea `<PaperOrnament variant="clip" | "washi-terracotta" | "washi-orchid" | "washi-sage" | "washi-slate" | "wax-seal" | "hanko-stamp" | "brass-pin" />` con `aria-hidden="true"` y `pointer-events: none`.
* [ ] **Step 1: Write failing tests in `src/tests/types.test.ts` and `src/tests/storage.test.ts**`

```typescript
// En src/tests/types.test.ts
it('supports extended ViewType values for full stationery suite', () => {
  const allViews: ViewType[] = [
    'dashboard',
    'agenda',
    'planner',
    'todo',
    'notes',
    'folders',
    'integrations',
  ];
  expect(allViews).toHaveLength(7);
});

```

```typescript
// En src/tests/storage.test.ts
describe('Notes & Folders persistence', () => {
  it('saves and isolates notes and folders per profile and cascades on deleteProfile', () => {
    StorageService.saveNote({
      id: 'n-1',
      profileId: 'p-1',
      title: 'Reflexión nocturna',
      content: 'Avance sólido hoy',
      updatedAt: '2026-10-17',
    });
    StorageService.saveFolder({
      id: 'f-1',
      profileId: 'p-1',
      code: 'DOC-01',
      name: 'Universidad & Admisión',
      area: 'Estudio',
      itemCount: 2,
      updatedAt: '2026-10-17',
    });

    expect(StorageService.getNotes('p-1')).toHaveLength(1);
    expect(StorageService.getFolders('p-1')).toHaveLength(1);

    StorageService.deleteProfile('p-1');
    expect(StorageService.getNotes('p-1')).toEqual([]);
    expect(StorageService.getFolders('p-1')).toEqual([]);
  });
});

```

* [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm exec vitest run src/tests/types.test.ts src/tests/storage.test.ts`
Expected: FAIL

* [ ] **Step 3: Implement tokens in `src/index.css`, types in `src/types/index.ts`, storage methods in `src/services/storage.ts`, and `<PaperOrnament />**`

1. En `src/index.css`, conservar todos los tokens `--color-*` actuales y añadir los tokens físicos HIBI/Stitch:

```css
:root {
  /* Alias y tokens HIBI / Stitch Papercraft */
  --bg-canvas: #F3EFE6;
  --bg-card: #FCF9F6;
  --bg-manila: #EDE3D0;
  --bg-postit: #FFF9D6;
  --bg-postit-lavender: #F3E8FA;
  --bg-slate-paper: #E8EDF2;
  --bg-surface-soft: #F5F0E8;

  --primary: #8E1EA2;
  --primary-deep: #6E0081;
  --primary-active: #C654C3;
  --accent-amber: #E8A55A;
  --accent-terracotta: #D4745E;
  --accent-teal: #5DB8A6;
  --accent-sage: #5A826D;
  --error: #C64545;

  --border-subtle: rgba(20, 20, 19, 0.08);
  --border-hairline: #E6DFD8;

  /* Sombras multicapa 3D de papelería */
  --shadow-sheet: 0 1px 2px rgba(26, 25, 23, 0.06), 0 10px 24px -4px rgba(26, 25, 23, 0.08);
  --shadow-card-stack: 0 1px 2px rgba(26, 25, 23, 0.07), 0 4px 0 -1px #FAF6F0, 0 5px 2px -1px rgba(26, 25, 23, 0.06), 0 14px 28px -6px rgba(26, 25, 23, 0.10);
  --shadow-postit: 2px 8px 18px -4px rgba(26, 25, 23, 0.14), 0 1px 3px rgba(26, 25, 23, 0.08);
  --shadow-pin: 1px 3px 5px rgba(0, 0, 0, 0.28), inset 0 1px 1px rgba(255, 255, 255, 0.7);
  --shadow-recessed: inset 0 2px 4px rgba(20, 20, 19, 0.08), 0 1px 0 rgba(255, 255, 255, 0.8);

  /* Trama Tomoe River y renglones verjurados */
  --pattern-dot-grid: radial-gradient(rgba(20, 20, 19, 0.055) 1px, transparent 0);
  --font-handwriting: "Caveat", "Segoe Print", "Bradley Hand", cursive;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

```

2. Crear `src/components/common/PaperOrnament.tsx` y su CSS Module con las variantes de clip de latón, cintas washi, sello de lacre, sello hanko (`済`) y alfiler dorado, asegurando `aria-hidden="true"`.
3. Actualizar `src/routes/ProtectedRoute.tsx` para permitir las 7 vistas en `currentView`.

* [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm exec vitest run src/tests/types.test.ts src/tests/storage.test.ts`
Expected: PASS

* [ ] **Step 5: Commit**

```bash
git add src/index.css src/types/index.ts src/services/storage.ts src/components/common/PaperOrnament.tsx src/components/common/PaperOrnament.module.css src/routes/ProtectedRoute.tsx src/tests/types.test.ts src/tests/storage.test.ts
git commit -m ":bricks: feat(core): establecer tokens papercraft, tipos extendidos y primitivas fisicas"

```

---

### Task 1: Shared Atelier Shell (`AppLayout` & `TopNavBar` de Papelería)

**Files:**

* Modify: `src/components/AppLayout.tsx`
* Modify: `src/components/AppLayout.module.css`
* Test: `src/tests/AppLayout.test.tsx`

**Interfaces:**

* Consumes: `Profile` activo, `currentView: ViewType`, `onViewChange`, `onLockProfile`.
* Produces: Barra lateral fija estilo Atelier de Papelería con monograma `Es`, título `Espiralia`, subtítulo `Taller de Escritorio`, botón `+ Nueva Entrada`, navegación hacia las 7 vistas (`dashboard`, `planner`, `todo`, `agenda`, `notes`, `folders`, `integrations`), ficha inferior `Local DB: Activa` con `AES-256`, botón `Cambiar perfil` conservado para contratos de test, y TopBar con buscador `Ctrl+K`, fecha larga y botón `Modo Concentración`.
* [ ] **Step 1: Write the failing test in `src/tests/AppLayout.test.tsx**`

```tsx
it('renderiza la barra lateral editorial con monograma Es, boton Nueva Entrada y ficha Local DB', () => {
  render(
    <AppLayout
      profile={mockProfile}
      currentView="dashboard"
      onViewChange={vi.fn()}
      onLockProfile={vi.fn()}
    >
      <div>Contenido</div>
    </AppLayout>
  );

  expect(screen.getByText('Es')).toBeInTheDocument();
  expect(screen.getByText('Espiralia')).toBeInTheDocument();
  expect(screen.getByText(/taller de escritorio/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /\+ acción rápida|\+ nueva entrada/i })).toBeInTheDocument();
  expect(screen.getByText(/local db: activa/i)).toBeInTheDocument();
  expect(screen.getByText(/aes-256/i)).toBeInTheDocument();
});

```

* [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/tests/AppLayout.test.tsx`
Expected: FAIL

* [ ] **Step 3: Implement minimal code in `src/components/AppLayout.tsx` and `AppLayout.module.css**`

1. Añadir monograma `Es` junto al título `Espiralia` y subtítulo `Taller de Escritorio`.
2. Incluir botón primario `+ Nueva Entrada` (que navega a `todo` o abre acción rápida) y los 7 ítems de navegación con pestañas estilo índice de biblioteca.
3. Añadir tarjeta de soberanía con `Local DB: Activa` y badge `AES-256`, manteniendo el botón `Cambiar perfil` tanto en el pie del sidebar como en la cabecera móvil.
4. En el `topHeader`, mostrar buscador rápido (`Ctrl+K`), fecha formateada y botón `Modo Concentración`.

* [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/tests/AppLayout.test.tsx`
Expected: PASS

* [ ] **Step 5: Commit**

```bash
git add src/components/AppLayout.tsx src/components/AppLayout.module.css src/tests/AppLayout.test.tsx
git commit -m ":art: style(layout): alinear barra lateral y navegacion compartida con diseño stitch"

```

---

### Task 2: Screen 2 — `/login` (`ProfileGateView`: Desbloqueo Táctil & Bóveda Local)

**Files:**

* Modify: `src/components/ProfileGateView.tsx`
* Modify: `src/components/ProfileGateView.module.css`
* Test: `src/tests/ProfileGateView.test.tsx`

**Interfaces:**

* Consumes: `StorageService.getProfiles`, `StorageService.saveProfile`.
* Produces: Pliego central papercraft sobre tapete de escritorio cálido (`#FCF9F6`), titular monumental `desbloquear cuaderno.`, kicker `Selecciona tu perfil` (preservando test existente), post-it inclinado (`-2deg`) con clip de latón, sello hanko `済` y cita *"discipline today, peace tomorrow."*, y teclado numérico híbrido 3x4 sincronizado con el `<input aria-label="PIN de acceso" />`.
* [ ] **Step 1: Write the failing test in `src/tests/ProfileGateView.test.tsx**`

```tsx
it('renderiza la interfaz de desbloqueo con pliego papercraft, teclado numerico 3x4 y post-it con clip', () => {
  render(<ProfileGateView onSelectProfile={vi.fn()} />);

  expect(screen.getByRole('heading', { level: 1, name: /desbloquear cuaderno\./i })).toBeInTheDocument();
  expect(screen.getByText(/selecciona tu perfil/i)).toBeInTheDocument();
  expect(screen.getByText(/cuadernos registrados/i)).toBeInTheDocument();
  expect(screen.getByText(/introduce tu pin maestro/i)).toBeInTheDocument();
  expect(screen.getByText(/discipline today, peace tomorrow/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '9' })).toBeInTheDocument();
});

```

* [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/tests/ProfileGateView.test.tsx`
Expected: FAIL

* [ ] **Step 3: Implement minimal code in `src/components/ProfileGateView.tsx` and `ProfileGateView.module.css**`

1. Estructurar el pliego central con H1 `desbloquear cuaderno.`, subtítulo `Selecciona tu perfil` y etiqueta `Cuadernos registrados`.
2. Incorporar el post-it artesanal inclinado `-2deg` con `<PaperOrnament variant="clip" />`, `<PaperOrnament variant="washi-orchid" />`, sello `済` y texto en fuente Caveat *"discipline today, peace tomorrow."*.
3. Renderizar el bloque `Introduce tu PIN maestro` con el teclado numérico táctil 3x4 (`1`-`9`, `0`, `⌫`) que alimenta el estado `pinInput`. Cuando se selecciona un perfil con PIN, mostrar el encabezamiento `Ingresa tu PIN`, el `<input id="verify-pin-input" aria-label="PIN de acceso" />` y el botón `Desbloquear` para que funcionen tanto la escritura por teclado de los tests existentes como los clics táctiles.
4. Añadir pie de soberanía `INDEXEDDB LOCAL • ZERO TRACKERS • NO CLOUD`.

* [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/tests/ProfileGateView.test.tsx src/tests/App.test.tsx`
Expected: PASS

* [ ] **Step 5: Commit**

```bash
git add src/components/ProfileGateView.tsx src/components/ProfileGateView.module.css src/tests/ProfileGateView.test.tsx
git commit -m ":art: style(login): alinear pliego de desbloqueo y teclado tactil hibrido segun stitch"

```

---

### Task 3: Screen 3 — `/dashboard` (`DashboardView`: HIBI Daily Dashboard, Mood Tracker & Brain Dump)

**Files:**

* Modify: `src/components/DashboardView.tsx`
* Modify: `src/components/DashboardView.module.css`
* Test: `src/tests/DashboardView.test.tsx`

**Interfaces:**

* Consumes: `profile: Profile`, `onNavigate: (view: ViewType) => void`, `StorageService.getEvents`, `StorageService.getTodos`, `StorageService.getPlanner`.
* Produces: Tablero central inspirado en la lámina maestra `HIBI Daily Dashboard` con pestañas superiores de archivo (`Daily Rituals`, `Mood & Focus`, `Archives`), saludo editorial `¡Hola, {profile.name}!`, tarjeta de horario `The Weekly Flow` con borde inferior rasgado (`torn-paper-edge`), tarjeta `Mood & Focus Rhythm Tracker` con fases lunares e iconos de energía, cuaderno `Brain Dump` con nota adhesiva lavanda y clip de latón, y sello rojo japonés `済`.
* [ ] **Step 1: Write the failing test in `src/tests/DashboardView.test.tsx**`

```tsx
it('renderiza los modulos fisicos HIBI: pestañas de rituales, Mood & Focus Rhythm Tracker y Brain Dump', () => {
  render(<DashboardView profile={mockProfile} onNavigate={vi.fn()} />);

  expect(screen.getByText(/¡hola, andrés!/i)).toBeInTheDocument();
  expect(screen.getByText(/daily rituals/i)).toBeInTheDocument();
  expect(screen.getByText(/mood & focus rhythm tracker/i)).toBeInTheDocument();
  expect(screen.getByText(/brain dump/i)).toBeInTheDocument();
  expect(screen.getByText(/focus on the path, not just the destination/i)).toBeInTheDocument();
});

```

* [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/tests/DashboardView.test.tsx`
Expected: FAIL

* [ ] **Step 3: Implement minimal code in `src/components/DashboardView.tsx` and `DashboardView.module.css**`

1. Añadir pestañas superiores troqueladas en salvia y crema (`Daily Rituals`, `Mood & Focus`, `02 / Archives`) sobre el pliego principal.
2. Mantener el saludo `¡Hola, {profile.name}!` acompañado del post-it amarillo con clip de latón y caligrafía *"Focus on the path, not just the destination."*.
3. Estilizar el bloque de agenda del día como hoja pizarra (`#E8EDF2`) con borde inferior rasgado (`torn-paper-edge`) y botón `Ver agenda completa`.
4. Añadir la tarjeta táctil `Mood & Focus Rhythm Tracker` con selector interactivo de fases lunares (`🌑`, `🌓`, `🌕`) y niveles de energía, más la tarjeta `Brain Dump` con captura rápida de ideas y sello hanko `済`.

* [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/tests/DashboardView.test.tsx`
Expected: PASS

* [ ] **Step 5: Commit**

```bash
git add src/components/DashboardView.tsx src/components/DashboardView.module.css src/tests/DashboardView.test.tsx
git commit -m ":art: style(dashboard): incorporar modulos HIBI Daily Dashboard, Mood Tracker y Brain Dump"

```

---

### Task 4: Screen 4 — `/planner` (`PlannerView` & Grid Semanal: Pliego de Enfoque 7 Días)

**Files:**

* Modify: `src/components/PlannerView.tsx`
* Modify: `src/components/PlannerView.module.css`
* Create: `src/components/planner/PlannerWeeklyGrid.tsx`
* Create: `src/components/planner/PlannerWeeklyGrid.module.css`
* Test: `src/tests/PlannerView.test.tsx`

**Interfaces:**

* Consumes: `{ profileId?: string; profile?: Profile; onNavigate?: (view: ViewType) => void }`, `StorageService.getPlanner`, `StorageService.savePlanner`, `StorageService.deletePlanner`.
* Produces: Cabecera con kicker `Planner y objetivos` (preservando test existente), titular H1 `focus plan & agenda semanal.`, post-it crema en ángulo de `-3deg` con sprig botánico `🌿` y cita *"discipline today"*, matriz de `Hábitos Semanales` con círculos verde salvia (`#5A826D`) y cinta washi terracota, tarjeta lateral de `Top Priorities` con clip de latón, y rejilla `Horario de Estudio & Bloques Activos` manteniendo los controles de creación/eliminación y estados vacíos por franja (`mañana`, `tarde`, `noche`, `meta`).
* [ ] **Step 1: Write the failing test in `src/tests/PlannerView.test.tsx**`

```tsx
it('renderiza cabecera monumental de planner con post-it inclinado y habit tracker semanal', () => {
  render(<PlannerView profileId={profileId} />);

  expect(screen.getByRole('heading', { level: 1, name: /focus plan & agenda semanal\./i })).toBeInTheDocument();
  expect(screen.getByText(/planner y objetivos/i)).toBeInTheDocument();
  expect(screen.getByText(/discipline today/i)).toBeInTheDocument();
  expect(screen.getByText(/horario de estudio & bloques activos/i)).toBeInTheDocument();
  expect(screen.getByText(/hábitos semanales/i)).toBeInTheDocument();
});

```

* [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/tests/PlannerView.test.tsx`
Expected: FAIL

* [ ] **Step 3: Implement minimal code in `PlannerView.tsx` and `PlannerWeeklyGrid.tsx**`

1. Aceptar `{ profileId, profile, onNavigate }` resolviendo `const resolvedProfileId = profile?.id ?? profileId ?? ''`.
2. Renderizar el Hero Header con post-it inclinado `-3deg`, sprig `🌿`, kicker `Planner y objetivos`, H1 `focus plan & agenda semanal.` y etiqueta de fecha con cinta washi.
3. Crear `PlannerWeeklyGrid.tsx` mostrando la vista de franjas horarias (`08:00` a `21:30`) y las tarjetas de franja (`mañana`, `tarde`, `noche`, `meta`) con borde rasgado superior y sus textos de estado vacío (`Sin bloques para mañana. Agrega un objetivo`, etc.).
4. Incluir el módulo de `Hábitos Semanales` con matriz L-D de círculos verde salvia (`#5A826D`) interactivos y la tarjeta `Top Priorities` con clip de latón 3D.

* [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/tests/PlannerView.test.tsx`
Expected: PASS

* [ ] **Step 5: Commit**

```bash
git add src/components/PlannerView.tsx src/components/PlannerView.module.css src/components/planner/PlannerWeeklyGrid.tsx src/components/planner/PlannerWeeklyGrid.module.css src/tests/PlannerView.test.tsx
git commit -m ":art: style(planner): alinear pliego semanal, habit tracker salvia y rejilla con stitch"

```

---

### Task 5: Screen 5 — `/todo` (`TodoView` & Solapas Manila: Archivador de Tareas)

**Files:**

* Modify: `src/components/TodoView.tsx`
* Modify: `src/components/TodoView.module.css`
* Create: `src/components/todo/AreaIntegratedWorkspace.tsx`
* Create: `src/components/todo/AreaIntegratedWorkspace.module.css`
* Test: `src/tests/TodoView.test.tsx`

**Interfaces:**

* Consumes: `{ profileId?: string; profile?: Profile; onNavigate?: (view: ViewType) => void }`, `StorageService.getTodos`, `StorageService.saveTodo`, `StorageService.toggleTodo`, `StorageService.deleteTodo`.
* Produces: Cabecera con kicker `Mis tareas` (preservando test existente), H1 `to-do & áreas integradas.`, archivador Manila con solapas trapezoidales (`Todas las áreas`, `01. Estudios & Clase B`, `02. Introspección & Terapia`, `03. Universidad & Admisión`) y marcas de agua gigantes (`01`, `02`, `03`), cajón de entrada rápida con borde superior rasgado y clip dorado, y workspace contextual lateral.
* [ ] **Step 1: Write the failing test in `src/tests/TodoView.test.tsx**`

```tsx
it('renderiza archivador Manila con solapas y marcas de agua de area', () => {
  render(<TodoView profileId={profileId} />);

  expect(screen.getByRole('heading', { level: 1, name: /to-do & áreas integradas\./i })).toBeInTheDocument();
  expect(screen.getByText(/mis tareas/i)).toBeInTheDocument();
  expect(screen.getByText(/todas las áreas/i)).toBeInTheDocument();
  expect(screen.getByText(/01\. estudios & clase b/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/¿qué tienes pendiente\?/i)).toBeInTheDocument();
});

```

* [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/tests/TodoView.test.tsx`
Expected: FAIL

* [ ] **Step 3: Implement minimal code in `TodoView.tsx` and `AreaIntegratedWorkspace.tsx**`

1. Aceptar `{ profileId, profile, onNavigate }` de forma retrocompatible.
2. Renderizar cabecera con kicker `Mis tareas`, H1 `to-do & áreas integradas.` y post-it lateral con cita manuscrita.
3. Añadir fila de solapas Manila trapezoidales (`Todas las áreas`, `01. Estudios & Clase B`, `02. Introspección & Terapia`, `03. Universidad & Admisión`) con marcas de agua translúcidas `01`, `02`, `03`.
4. Conservar el formulario con placeholder `¿Qué tienes pendiente?`, los botones de estado (`Todas`, `Pendientes`, `Completadas`) y los mensajes vacíos exactos, acompañados del panel lateral `AreaIntegratedWorkspace`.

* [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/tests/TodoView.test.tsx`
Expected: PASS

* [ ] **Step 5: Commit**

```bash
git add src/components/TodoView.tsx src/components/TodoView.module.css src/components/todo/AreaIntegratedWorkspace.tsx src/components/todo/AreaIntegratedWorkspace.module.css src/tests/TodoView.test.tsx
git commit -m ":art: style(todo): alinear archivador manila, solapas con marcas de agua y entrada rapida"

```

---

### Task 6: Screen 6 — `/agenda` (`AgendaView`: Almanaque de Mesa & Pliego Diario)

**Files:**

* Modify: `src/components/AgendaView.tsx`
* Modify: `src/components/AgendaView.module.css`
* Test: `src/tests/AgendaView.test.tsx`

**Interfaces:**

* Consumes: `{ profileId?: string; profile?: Profile; onNavigate?: (view: ViewType) => void }`, `StorageService.getEvents`, `StorageService.saveEvent`, `StorageService.deleteEvent`.
* Produces: Cabecera con kicker `Agenda de eventos` y badge `Almanaque de Mesa`, H1 `agenda & calendario mensual.`, cuadrícula mensual editorial con botones `Mes anterior`, `Mes siguiente` y `Día {N}`, celda `HOY` destacada con cinta washi, y pliego lateral `Citas & Compromisos de Hoy` sujeto con clip metálico de latón manteniendo el encabezado `Nuevo evento para {selectedDate}`.
* [ ] **Step 1: Write the failing test in `src/tests/AgendaView.test.tsx**`

```tsx
it('renderiza el almanaque de mesa con titular editorial y panel diario con clip', () => {
  render(<AgendaView profileId={profileId} />);

  expect(screen.getByRole('heading', { level: 1, name: /agenda & calendario mensual\./i })).toBeInTheDocument();
  expect(screen.getByText(/agenda de eventos/i)).toBeInTheDocument();
  expect(screen.getByText(/almanaque de mesa/i)).toBeInTheDocument();
  expect(screen.getByText(/citas & compromisos de hoy/i)).toBeInTheDocument();
});

```

* [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/tests/AgendaView.test.tsx`
Expected: FAIL

* [ ] **Step 3: Implement minimal code in `AgendaView.tsx` and `AgendaView.module.css**`

1. Aceptar `{ profileId, profile, onNavigate }` de forma retrocompatible.
2. Renderizar cabecera con kicker `Agenda de eventos`, sello `Almanaque de Mesa` y H1 `agenda & calendario mensual.`.
3. Estilizar las celdas del calendario con tipografía serif, manteniendo `aria-label="Día {d}"` en cada celda y `Mes anterior` / `Mes siguiente` en los controles.
4. En el pliego derecho, colocar `<PaperOrnament variant="clip" />`, el subtítulo `Citas & Compromisos de Hoy`, el formulario `Nuevo evento para {selectedDate}` con placeholder `Título del evento` y botón `Agregar evento`.

* [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/tests/AgendaView.test.tsx`
Expected: PASS

* [ ] **Step 5: Commit**

```bash
git add src/components/AgendaView.tsx src/components/AgendaView.module.css src/tests/AgendaView.test.tsx
git commit -m ":art: style(agenda): alinear almanaque mensual y pliego diario con clip segun stitch"

```

---

### Task 7: Screen 7 — `/notes` (`NotesView`: Cuaderno Terapéutico & Pliego Verjurado)

**Files:**

* Create: `src/components/NotesView.tsx`
* Create: `src/components/NotesView.module.css`
* Modify: `src/routes/index.tsx`
* Test: `src/tests/NotesView.test.tsx`

**Interfaces:**

* Consumes: `{ profileId?: string; profile?: Profile; onNavigate?: (view: ViewType) => void }`, `StorageService.getNotes`, `StorageService.saveNote`, `StorageService.deleteNote`.
* Produces: Cuaderno terapéutico con H1 `cuaderno de notas & reflexión.`, pregunta ancla `¿Qué pensamiento necesitas desahogar hoy?`, pliego de papel verjurado con margen vertical violeta (`56px`) y renglones de `28px`, sección `Balance de la Jornada` con 3 cajas reflexivas, y barra inferior de pluma estilográfica con sello `Almacenamiento 100% confidencial local`.
* [ ] **Step 1: Write the failing test in `src/tests/NotesView.test.tsx**`

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotesView } from '../components/NotesView';

describe('NotesView', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renderiza cuaderno terapeutico con pregunta ancla, pliego verjurado y permite guardar una nota', async () => {
    const user = userEvent.setup();
    render(<NotesView profileId="p-notes" onNavigate={vi.fn()} />);

    expect(screen.getByRole('heading', { level: 1, name: /cuaderno de notas & reflexión\./i })).toBeInTheDocument();
    expect(screen.getByText(/¿qué pensamiento necesitas desahogar hoy\?/i)).toBeInTheDocument();
    expect(screen.getByText(/balance de la jornada/i)).toBeInTheDocument();
    expect(screen.getByText(/almacenamiento 100% confidencial local/i)).toBeInTheDocument();

    const titleInput = screen.getByPlaceholderText(/título de la página/i);
    const bodyInput = screen.getByPlaceholderText(/escribe sin filtros/i);
    await user.type(titleInput, 'Bitácora de estudio');
    await user.type(bodyInput, 'Hoy avancé con geometría analítica.');

    const saveBtn = screen.getByRole('button', { name: /guardar en cuaderno/i });
    await user.click(saveBtn);

    expect(screen.getByText('Bitácora de estudio')).toBeInTheDocument();
  });
});

```

* [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/tests/NotesView.test.tsx`
Expected: FAIL

* [ ] **Step 3: Implement minimal code in `src/components/NotesView.tsx`, `NotesView.module.css` and register `/notes` in `src/routes/index.tsx**`

1. Construir `NotesView.tsx` con cabecera editorial, pregunta ancla, pliego verjurado con margen vertical violeta (`notes-ruled-sheet`), pestañas laterales troqueladas (`Journaling`, `Ideas`, `Terapia`), 3 tarjetas de `Balance de la Jornada` y barra inferior con contador de palabras y sello `Almacenamiento 100% confidencial local`.
2. Registrar la ruta `<Route path="/notes" element={activeProfile ? <NotesView profile={activeProfile} /> : null} />` en `src/routes/index.tsx`.

* [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/tests/NotesView.test.tsx`
Expected: PASS

* [ ] **Step 5: Commit**

```bash
git add src/components/NotesView.tsx src/components/NotesView.module.css src/routes/index.tsx src/tests/NotesView.test.tsx
git commit -m ":sparkles: feat(notes): implementar cuaderno terapeutico verjurado y balance de jornada"

```

---

### Task 8: Screen 8 — `/folders` (`FoldersView`: Fichero Archival de Carpetas & Vínculos)

**Files:**

* Create: `src/components/FoldersView.tsx`
* Create: `src/components/FoldersView.module.css`
* Modify: `src/routes/index.tsx`
* Test: `src/tests/FoldersView.test.tsx`

**Interfaces:**

* Consumes: `{ profileId?: string; profile?: Profile; onNavigate?: (view: ViewType) => void }`, `StorageService.getFolders`, `StorageService.saveFolder`, `StorageService.deleteFolder`.
* Produces: Fichero archival con H1 `fichero archival & documentos.`, sello notarial rojo `ARCHIVADO LOCALMENTE`, cuadrícula de carpetas con pestañas Manila escalonadas y marcas de agua (`01`, `02`, `03`), formulario de `Nueva Carpeta` y tabla `Inventario de Expedientes` (`DOC-01.1`).
* [ ] **Step 1: Write the failing test in `src/tests/FoldersView.test.tsx**`

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FoldersView } from '../components/FoldersView';

describe('FoldersView', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renderiza fichero archival con solapas escalonadas, sello notarial y tabla de inventario', async () => {
    const user = userEvent.setup();
    render(<FoldersView profileId="p-folders" onNavigate={vi.fn()} />);

    expect(screen.getByRole('heading', { level: 1, name: /fichero archival & documentos\./i })).toBeInTheDocument();
    expect(screen.getByText(/archivado localmente/i)).toBeInTheDocument();
    expect(screen.getByText(/inventario de expedientes/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /nueva carpeta/i })).toBeInTheDocument();

    const nameInput = screen.getByPlaceholderText(/nombre del expediente o carpeta/i);
    await user.type(nameInput, 'Bibliografía Semestral');
    await user.click(screen.getByRole('button', { name: /nueva carpeta/i }));

    expect(screen.getByText('Bibliografía Semestral')).toBeInTheDocument();
  });
});

```

* [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/tests/FoldersView.test.tsx`
Expected: FAIL

* [ ] **Step 3: Implement minimal code in `src/components/FoldersView.tsx`, `FoldersView.module.css` and register `/folders` in `src/routes/index.tsx**`

1. Implementar `FoldersView.tsx` con H1 `fichero archival & documentos.`, `<PaperOrnament variant="hanko-stamp" />` con leyenda `ARCHIVADO LOCALMENTE`, tarjetas Manila con solapas troqueladas y tabla `Inventario de Expedientes`.
2. Registrar la ruta `/folders` en `src/routes/index.tsx`.

* [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/tests/FoldersView.test.tsx`
Expected: PASS

* [ ] **Step 5: Commit**

```bash
git add src/components/FoldersView.tsx src/components/FoldersView.module.css src/routes/index.tsx src/tests/FoldersView.test.tsx
git commit -m ":sparkles: feat(folders): implementar fichero archival, sello notarial y tabla de expedientes"

```

---

### Task 9: Screen 9 — `/integrations` (`IntegrationsView` & `VaultModal`: Soberanía de Datos)

**Files:**

* Create: `src/components/IntegrationsView.tsx`
* Create: `src/components/IntegrationsView.module.css`
* Create: `src/components/vault/VaultModal.tsx`
* Create: `src/components/vault/VaultModal.module.css`
* Modify: `src/routes/index.tsx`
* Test: `src/tests/IntegrationsView.test.tsx`

**Interfaces:**

* Consumes: `{ profileId?: string; profile?: Profile; onNavigate?: (view: ViewType) => void }`, `StorageService.exportProfileBundle`, `StorageService.importProfileBundle`.
* Produces: Centro de bóveda local con H1 `bóveda local & sincronización.`, sello de cera lacre (`wax-seal`), lema `Almacenamiento 100% en tu máquina`, tarjeta RFC 5545 con botón `Exportar Calendario .ics`, auditoría `0 peticiones externas` y modal `VaultModal` para respaldo JSON local.
* [ ] **Step 1: Write the failing test in `src/tests/IntegrationsView.test.tsx**`

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntegrationsView } from '../components/IntegrationsView';

describe('IntegrationsView', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renderiza boveda local con sello notarial, tarjeta RFC 5545, auditoria offline y abre VaultModal', async () => {
    const user = userEvent.setup();
    render(<IntegrationsView profileId="p-int" onNavigate={vi.fn()} />);

    expect(screen.getByRole('heading', { level: 1, name: /bóveda local & sincronización\./i })).toBeInTheDocument();
    expect(screen.getByText(/almacenamiento 100% en tu máquina/i)).toBeInTheDocument();
    expect(screen.getByText(/exportar calendario \.ics/i)).toBeInTheDocument();
    expect(screen.getByText(/0 peticiones externas/i)).toBeInTheDocument();

    const openVaultBtn = screen.getByRole('button', { name: /abrir bóveda json/i });
    await user.click(openVaultBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

```

* [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/tests/IntegrationsView.test.tsx`
Expected: FAIL

* [ ] **Step 3: Implement minimal code in `IntegrationsView.tsx`, `VaultModal.tsx` and register `/integrations` in `src/routes/index.tsx**`

1. Implementar `IntegrationsView.tsx` con H1 `bóveda local & sincronización.`, `<PaperOrnament variant="wax-seal" />`, tarjeta RFC 5545 (`.ics`), panel de auditoría `0 peticiones externas` y botón `Abrir Bóveda JSON`.
2. Implementar `VaultModal.tsx` con `role="dialog"`, exportación/importación JSON del perfil activo y botón de cierre de `44x44px`.
3. Registrar la ruta `/integrations` en `src/routes/index.tsx`.

* [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/tests/IntegrationsView.test.tsx`
Expected: PASS

* [ ] **Step 5: Commit**

```bash
git add src/components/IntegrationsView.tsx src/components/IntegrationsView.module.css src/components/vault/VaultModal.tsx src/components/vault/VaultModal.module.css src/routes/index.tsx src/tests/IntegrationsView.test.tsx
git commit -m ":sparkles: feat(integrations): implementar boveda local, sello de lacre y exportacion ics/json"

```

---

### Task 10: Verificación Global, Regresión Cero, Build y Capturas de Pantalla

**Files:**

* Modify: `src/tests/routes.test.tsx`
* Modify: `docs/stitch_espiralia/` (actualización de capturas verificadas si aplica)
* Test: Todas las suites de pruebas (`src/tests/*.test.ts*`)

**Interfaces:**

* Consumes: Todo el código y estilos implementados en las Tareas 0 a 9.
* Produces: Suite completa de Vitest en verde (0 regresiones en tests existentes + nuevos tests de vistas y rutas), build de producción sin errores de TypeScript y validación visual.
* [ ] **Step 1: Add route integration tests for `/notes`, `/folders` and `/integrations` in `src/tests/routes.test.tsx**`

```tsx
it('navega a /notes, /folders e /integrations dentro de las rutas protegidas', () => {
  const { unmount } = render(
    <MemoryRouter initialEntries={['/notes']}>
      <AppRoutes activeProfile={mockProfile} onSelectProfile={vi.fn()} onLockProfile={vi.fn()} />
    </MemoryRouter>
  );
  expect(screen.getByRole('heading', { level: 1, name: /cuaderno de notas & reflexión\./i })).toBeInTheDocument();
  unmount();

  render(
    <MemoryRouter initialEntries={['/folders']}>
      <AppRoutes activeProfile={mockProfile} onSelectProfile={vi.fn()} onLockProfile={vi.fn()} />
    </MemoryRouter>
  );
  expect(screen.getByRole('heading', { level: 1, name: /fichero archival & documentos\./i })).toBeInTheDocument();
});

```

* [ ] **Step 2: Run full test suite to verify zero regressions**

Run: `pnpm exec vitest run`
Expected: 100% de las suites y tests en `PASS`.

* [ ] **Step 3: Run production bundle build**

Run: `pnpm build`
Expected: `tsc -b && vite build` finalizado con éxito sin errores de tipos ni CSS.

* [ ] **Step 4: Commit final verification**

```bash
git add src/tests/routes.test.tsx
git commit -m ":white_check_mark: test(routes): verificar navegacion completa de las 8 vistas de papeleria"

```

"""

with open("PLAN_MAESTRO_ESPIRALIA_V2.md", "w", encoding="utf-8") as f:
f.write(plan_content)

print("File generated successfully.")

```

```text?code_stdout&code_event_index=1
File generated successfully.


```

Your Markdown file is ready


A continuación tienes el **Plan Maestro de Implementación v2.0** completo, con las **11 tareas (Task 0 a Task 10)** integradas y alineadas tanto con la arquitectura actual de tu repositorio (`src/index.css`, `src/types/index.ts`, `src/services/storage.ts`, `src/routes/index.tsx` y `src/tests/*.test.tsx`) como con las especificaciones visuales del ecosistema **HIBI Papercraft**.

---

# Máximo Impacto Visual para Espiralia — Plan Maestro de Implementación v2.0

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`[ ]`) syntax for tracking.

**Goal:** Elevar todas las vistas de Espiralia (`/login`, `/dashboard`, `/planner`, `/todo`, `/agenda`, `/notes`, `/folders`, `/integrations` y el shell compartido `AppLayout`) al estándar de máximo impacto visual establecido en las referencias maestras de Stitch y el showcase HIBI Papercraft (pestañas troqueladas de archivo, clips de latón 3D, solapas Manila con marcas de agua translúcidas gigantes, bordes de papel rasgado, renglones verjurados, sellos japoneses hanko `済` / lacre y cintas washi), con **cero regresiones** en la suite de pruebas de Vitest y compatibilidad WCAG 2.2 AA.

**Architecture:** Aplicación SPA 100% en cliente sin backend ni dependencias de nube. Componentes funcionales en React 19 + TypeScript con estilos rigurosamente encapsulados en CSS Modules (`*.module.css`) que consumen los tokens analógicos oficiales de `src/index.css` y primitivas reutilizables en `src/components/common/PaperOrnament.tsx`. Aislamiento estricto de datos en `localStorage` particionado por `profileId` mediante `StorageService`.

**Tech Stack:** React 19, TypeScript 5.8, Vite 6.4, CSS Modules, Lucide React (1.53+), Vitest 3.x, `@testing-library/react` 16.x.

---

## Global Constraints & Guardrails

* **Stack estricto:** React 19 + TypeScript 5.8 + Vite. Cero librerías UI pesadas en runtime. Todo estilo vía CSS Modules (`*.module.css`) consumiendo variables CSS globales de `src/index.css`.


* **Prohibición de Blanco Clínico (`#FFFFFF`):** Ningún lienzo o tarjeta principal usará `#FFFFFF` puro. El contraste entre capas se construye mediante iluminación cálida (`#FCF9F6` sobre `#F3EFE6` / `#EFE9DE`) y sombras multicapa de contacto y oclusión.


* **Tipografía analógica:**
* `--font-primary` / `--font-serif`: `"Newsreader", "Copernicus", "Tiempos Headline", Georgia, serif` para titulares monumentales con relieve letterpress.


* `--font-family-2` / `--font-sans`: `"Plus Jakarta Sans", "StyreneB", Inter, sans-serif` para cuerpo e interfaz.


* `--font-family-3` / `--font-mono`: `"JetBrains Mono", ui-monospace, monospace` para metadatos, sellos técnicos y marcas de tiempo.


* `--font-handwriting`: `"Caveat", "Segoe Print", cursive` para notas adhesivas, post-its y citas manuscritas.




* **Tokens de color y sombra oficiales (con alias retrocompatibles en `src/index.css`):**
* Papel y lienzo: `--bg-canvas` (`#F3EFE6`), `--bg-card` (`#FCF9F6`), `--bg-manila` (`#EDE3D0`), `--bg-postit` (`#FFF9D6`), `--bg-slate-paper` (`#E8EDF2`), `--bg-surface-soft` (`#F5F0E8`).


* Tintas y acentos: `--primary` (`#8E1EA2`), `--primary-deep` (`#6E0081`), `--primary-active` (`#C654C3`), `--accent-amber` (`#E8A55A`), `--accent-terracotta` (`#D4745E`), `--accent-teal` (`#5DB8A6`), `--accent-sage` (`#5A826D`), `--error` (`#C64545`).


* Sombras multicapa 3D:
* `--shadow-sheet`: `0 1px 2px rgba(26, 25, 23, 0.06), 0 10px 24px -4px rgba(26, 25, 23, 0.08)`
* `--shadow-card-stack`: `0 1px 2px rgba(26, 25, 23, 0.07), 0 4px 0 -1px #FAF6F0, 0 5px 2px -1px rgba(26, 25, 23, 0.06), 0 14px 28px -6px rgba(26, 25, 23, 0.10)`
* `--shadow-postit`: `2px 8px 18px -4px rgba(26, 25, 23, 0.14), 0 1px 3px rgba(26, 25, 23, 0.08)`
* `--shadow-pin`: `1px 3px 5px rgba(0, 0, 0, 0.28), inset 0 1px 1px rgba(255, 255, 255, 0.7)`
* `--shadow-recessed`: `inset 0 2px 4px rgba(20, 20, 19, 0.08), 0 1px 0 rgba(255, 255, 255, 0.8)`




* **Retrocompatibilidad de Props e Interfaces:** Todas las vistas (`AgendaView`, `PlannerView`, `TodoView`, `NotesView`, `FoldersView`, `IntegrationsView`) deben aceptar `{ profileId?: string; profile?: Profile; onNavigate?: (view: ViewType) => void }` resolviendo internamente `const activeProfileId = profile?.id ?? profileId ?? ''`, preservando la firma `profileId: string` usada en `src/routes/index.tsx` y en los tests actuales.


* **Accesibilidad, Rendimiento & Ergonomía:**
* Contraste WCAG 2.2 AA (mínimo 4.5:1 para texto normal) y touch targets mínimos de 44x44px.


* Respeto estricto a `@media (prefers-reduced-motion: reduce)` desactivando pulsaciones infinitas.
* Todo adorno físico (`brass-paperclip`, `washi-tape`, `wax-seal`, `hanko-stamp`) debe renderizarse con `aria-hidden="true"` y `pointer-events: none`.



---

## Contratos de No-Regresión en Tests Existentes (`src/tests/`)

Para garantizar que el 100% de los tests actuales sigan pasando sin modificaciones destructivas:

1. **`ProfileGateView` (`/login`):** Conservar el texto `Selecciona tu perfil`, el botón `Nuevo perfil`, el formulario con label `Nombre` y botón `Crear perfil`, y la verificación de PIN con texto `Ingresa tu PIN`, `<input aria-label="PIN de acceso" />`, mensaje `PIN incorrecto` y botón `Desbloquear`.


2. **`AppLayout`:** Conservar el texto `Espiralia`, el nombre del perfil activo, y los botones con nombre accesible `/cambiar perfil/i`.


3. **`DashboardView` (`/dashboard`):** Conservar el saludo `¡Hola, {profile.name}!`, el botón `Ver agenda completa` y los checkboxes con `aria-label="completar {todo.title}"`.


4. **`PlannerView` (`/planner`):** Conservar el kicker/subtítulo `Planner y objetivos`, el input con placeholder `Objetivo o bloque de enfoque`, el botón `Agregar bloque`, los botones de periodo (`Semanal`, `Mensual`), el texto de estado vacío `Sin bloques para mañana. Agrega un objetivo`, y los controles `completar {block.title}` / `eliminar {block.title}`.


5. **`TodoView` (`/todo`):** Conservar el kicker/subtítulo `Mis tareas`, el input con placeholder `¿Qué tienes pendiente?`, los botones de filtro (`Todas`, `Pendientes`, `Completadas`), y los textos exactos de estado vacío (`Aún no has agregado tareas`, `Usa el formulario superior para crear tu primera tarea`, `Sin tareas completadas aún`, `¡Todo al día!`).


6. **`AgendaView` (`/agenda`):** Conservar el kicker/subtítulo `Agenda de eventos`, el input con placeholder `Título del evento`, el botón `Agregar evento`, los botones `Mes anterior`, `Mes siguiente`, `Día {N}`, el texto `Nuevo evento para {YYYY-MM-DD}` y el botón `eliminar {event.title}`.



---

## Desglose de Tareas (11 Tareas)

```text
Task 0:  Foundation — Tokens CSS, Tipos, Storage, Rutas y PaperOrnament     -> verify: types.test.ts, storage.test.ts, routes.test.tsx
Task 1:  Shared Atelier Shell (AppLayout & TopNavBar de Papelería)          -> verify: AppLayout.test.tsx
Task 2:  Screen 2 — /login (ProfileGateView: Pliego & Teclado Híbrido 3x4)  -> verify: ProfileGateView.test.tsx
Task 3:  Screen 3 — /dashboard (DashboardView: HIBI Daily, Mood & Dump)     -> verify: DashboardView.test.tsx
Task 4:  Screen 4 — /planner (PlannerView & Grid Semanal 7 Días)            -> verify: PlannerView.test.tsx
Task 5:  Screen 5 — /todo (TodoView & Solapas Manila con Marcas de Agua)    -> verify: TodoView.test.tsx
Task 6:  Screen 6 — /agenda (AgendaView: Almanaque de Mesa & Pliego Diario) -> verify: AgendaView.test.tsx
Task 7:  Screen 7 — /notes (NotesView: Cuaderno Terapéutico Verjurado)      -> verify: NotesView.test.tsx
Task 8:  Screen 8 — /folders (FoldersView: Fichero Archival & Sellos)       -> verify: FoldersView.test.tsx
Task 9:  Screen 9 — /integrations (IntegrationsView & Bóveda Local)         -> verify: IntegrationsView.test.tsx
Task 10: Verificación Global, Regresión Cero, Build y Capturas Playwright   -> verify: pnpm exec vitest run && pnpm build

```

---

### Task 0: Foundation — Tokens CSS, Tipos, Storage, Rutas y Primitivas `PaperOrnament`

**Files:**

* Modify: `src/index.css`

* Modify: `src/types/index.ts`

* Modify: `src/services/storage.ts`

* Create: `src/components/common/PaperOrnament.tsx`
* Create: `src/components/common/PaperOrnament.module.css`
* Modify: `src/routes/ProtectedRoute.tsx`

* Test: `src/tests/types.test.ts`

* Test: `src/tests/storage.test.ts`


**Interfaces:**

* Amplía `ViewType` de `'dashboard' | 'agenda' | 'planner' | 'todo'` a `'dashboard' | 'agenda' | 'planner' | 'todo' | 'notes' | 'folders' | 'integrations'`.


* Añade tipos `NoteItem`, `FolderItem`, `HabitTrackerItem` y `MoodEntry` en `src/types/index.ts`.
* Amplía `StorageService` con métodos para notas, carpetas, hábitos y exportación/importación JSON/ICS con borrado en cascada en `deleteProfile`.


* Crea `<PaperOrnament "brass-pin" "hanko-stamp" "washi-orchid" "washi-sage" "washi-slate" "washi-terracotta" "wax-seal" variant="clip" |/>` con `aria-hidden="true"` y `pointer-events: none`.
* [ ] **Step 1: Write failing tests in `src/tests/types.test.ts` and `src/tests/storage.test.ts**`

```typescript
// En src/tests/types.test.ts
it('supports extended ViewType values for full stationery suite', () => {
  const allViews: ViewType[] = [
    'dashboard',
    'agenda',
    'planner',
    'todo',
    'notes',
    'folders',
    'integrations',
  ];
  expect(allViews).toHaveLength(7);
});

```

```typescript
// En src/tests/storage.test.ts
describe('Notes & Folders persistence', () => {
  it('saves and isolates notes and folders per profile and cascades on deleteProfile', () => {
    StorageService.saveNote({
      id: 'n-1',
      profileId: 'p-1',
      title: 'Reflexión nocturna',
      content: 'Avance sólido hoy',
      updatedAt: '2026-10-17',
    });
    StorageService.saveFolder({
      id: 'f-1',
      profileId: 'p-1',
      code: 'DOC-01',
      name: 'Universidad & Admisión',
      area: 'Estudio',
      itemCount: 2,
      updatedAt: '2026-10-17',
    });

    expect(StorageService.getNotes('p-1')).toHaveLength(1);
    expect(StorageService.getFolders('p-1')).toHaveLength(1);

    StorageService.deleteProfile('p-1');
    expect(StorageService.getNotes('p-1')).toEqual([]);
    expect(StorageService.getFolders('p-1')).toEqual([]);
  });
});

```

* [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm exec vitest run src/tests/types.test.ts src/tests/storage.test.ts`
Expected: FAIL

* [ ] **Step 3: Implement tokens in `src/index.css`, types in `src/types/index.ts`, storage methods in `src/services/storage.ts`, and `<PaperOrnament/>**`

1. En `src/index.css`, conservar todos los tokens `--color-*` actuales y añadir los tokens físicos HIBI/Stitch (`--bg-canvas: #F3EFE6`, `--bg-card: #FCF9F6`, `--bg-manila: #EDE3D0`, `--bg-postit: #FFF9D6`, `--bg-slate-paper: #E8EDF2`, `--accent-sage: #5A826D`, `--shadow-sheet`, `--shadow-card-stack`, `--shadow-postit`, `--shadow-pin`, `--font-handwriting`).


2. Crear `src/components/common/PaperOrnament.tsx` y `PaperOrnament.module.css` con las primitivas en puro CSS (clip de latón, cintas washi translúcidas, sello de lacre, sello japonés `済` y alfiler dorado).


3. Actualizar `src/routes/ProtectedRoute.tsx` para admitir las 7 rutas en el array de validación de `currentView`.



* [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm exec vitest run src/tests/types.test.ts src/tests/storage.test.ts`
Expected: PASS

* [ ] **Step 5: Commit**

```bash
git add src/index.css src/types/index.ts src/services/storage.ts src/components/common/PaperOrnament.tsx src/components/common/PaperOrnament.module.css src/routes/ProtectedRoute.tsx src/tests/types.test.ts src/tests/storage.test.ts
git commit -m ":bricks: feat(core): establecer tokens papercraft, tipos extendidos y primitivas fisicas"

```

---

### Task 1: Shared Atelier Shell (`AppLayout` & `TopNavBar` de Papelería)

**Files:**

* Modify: `src/components/AppLayout.tsx`

* Modify: `src/components/AppLayout.module.css`

* Test: `src/tests/AppLayout.test.tsx`


**Interfaces:**

* Consumes: `Profile` activo, `currentView: ViewType`, `onViewChange`, `onLockProfile`.


* Produces: Barra lateral estilo Atelier de Papelería con monograma `Es`, título `Espiralia`, subtítulo `Taller de Escritorio`, botón `+ Nueva Entrada`, navegación hacia las 7 vistas, ficha inferior `Local DB: Activa` con `AES-256`, botón `Cambiar perfil` conservado, y TopBar con buscador `Ctrl+K`, fecha larga y botón `Modo Concentración`.


* [ ] **Step 1: Write the failing test in `src/tests/AppLayout.test.tsx**`

```tsx
it('renderiza la barra lateral editorial con monograma Es, boton Nueva Entrada y ficha Local DB', () => {
  render(
    <AppLayout
      profile={mockProfile}
      currentView="dashboard"
      onViewChange={vi.fn()}
      onLockProfile={vi.fn()}
    >
      <div>Contenido</div>
    </AppLayout>
  );

  expect(screen.getByText('Es')).toBeInTheDocument();
  expect(screen.getByText('Espiralia')).toBeInTheDocument();
  expect(screen.getByText(/taller de escritorio/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /\+ acción rápida|\+ nueva entrada/i })).toBeInTheDocument();
  expect(screen.getByText(/local db: activa/i)).toBeInTheDocument();
  expect(screen.getByText(/aes-256/i)).toBeInTheDocument();
});

```

* [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/tests/AppLayout.test.tsx`
Expected: FAIL

* [ ] **Step 3: Implement minimal code in `src/components/AppLayout.tsx` and `AppLayout.module.css**`

1. Añadir monograma `Es` junto al título `Espiralia` y subtítulo `Taller de Escritorio`.
2. Incluir botón primario `+ Nueva Entrada` y los 7 ítems de navegación (`Dashboard`, `Planner`, `To-Do`, `Agenda`, `Notas`, `Carpetas`, `Bóveda`).
3. Añadir tarjeta de soberanía con `Local DB: Activa` y badge `AES-256`, conservando intacto el botón `Cambiar perfil` tanto en el pie del sidebar como en la cabecera móvil.



* [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/tests/AppLayout.test.tsx`
Expected: PASS

* [ ] **Step 5: Commit**

```bash
git add src/components/AppLayout.tsx src/components/AppLayout.module.css src/tests/AppLayout.test.tsx
git commit -m ":art: style(layout): alinear barra lateral y navegacion compartida con diseño stitch"

```

---

### Task 2: Screen 2 — `/login` (`ProfileGateView`: Desbloqueo Táctil & Bóveda Local)

**Files:**

* Modify: `src/components/ProfileGateView.tsx`

* Modify: `src/components/ProfileGateView.module.css`

* Test: `src/tests/ProfileGateView.test.tsx`


**Interfaces:**

* Consumes: `StorageService.getProfiles`, `StorageService.saveProfile`.


* Produces: Pliego central papercraft sobre tapete cálido (`#FCF9F6`), titular monumental `desbloquear cuaderno.`, subtítulo `Selecciona tu perfil`, post-it inclinado (`-2deg`) con clip de latón, sello hanko `済` y cita *"discipline today, peace tomorrow."*, y teclado numérico híbrido 3x4 sincronizado con el `<input aria-label="PIN de acceso" />`.


* [ ] **Step 1: Write the failing test in `src/tests/ProfileGateView.test.tsx**`

```tsx
it('renderiza la interfaz de desbloqueo con pliego papercraft, teclado numerico 3x4 y post-it con clip', () => {
  render(<ProfileGateView onSelectProfile={vi.fn()} />);

  expect(screen.getByRole('heading', { level: 1, name: /desbloquear cuaderno\./i })).toBeInTheDocument();
  expect(screen.getByText(/selecciona tu perfil/i)).toBeInTheDocument();
  expect(screen.getByText(/cuadernos registrados/i)).toBeInTheDocument();
  expect(screen.getByText(/introduce tu pin maestro/i)).toBeInTheDocument();
  expect(screen.getByText(/discipline today, peace tomorrow/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '9' })).toBeInTheDocument();
});

```

* [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/tests/ProfileGateView.test.tsx`
Expected: FAIL

* [ ] **Step 3: Implement minimal code in `src/components/ProfileGateView.tsx` and `ProfileGateView.module.css**`

1. Estructurar el pliego central con H1 `desbloquear cuaderno.`, subtítulo `Selecciona tu perfil` y etiqueta `Cuadernos registrados`.
2. Incorporar el post-it artesanal inclinado `-2deg` con `<PaperOrnament variant="clip"/>`, `<PaperOrnament variant="washi-orchid"/>`, sello `済` y texto en fuente Caveat *"discipline today, peace tomorrow."*.


3. Renderizar el bloque `Introduce tu PIN maestro` con el teclado numérico táctil 3x4 (`1`-`9`, `0`, `⌫`) conectado al estado `pinInput`, conservando el `<input id="verify-pin-input" aria-label="PIN de acceso" />`, el título `Ingresa tu PIN` y el botón `Desbloquear` para compatibilidad total con los tests actuales.



* [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/tests/ProfileGateView.test.tsx src/tests/App.test.tsx`
Expected: PASS

* [ ] **Step 5: Commit**

```bash
git add src/components/ProfileGateView.tsx src/components/ProfileGateView.module.css src/tests/ProfileGateView.test.tsx
git commit -m ":art: style(login): alinear pliego de desbloqueo y teclado tactil hibrido segun stitch"

```

---

### Task 3: Screen 3 — `/dashboard` (`DashboardView`: HIBI Daily Dashboard, Mood Tracker & Brain Dump)

**Files:**

* Modify: `src/components/DashboardView.tsx`

* Modify: `src/components/DashboardView.module.css`

* Test: `src/tests/DashboardView.test.tsx`


**Interfaces:**

* Consumes: `profile: Profile`, `onNavigate: (view: ViewType) => void`, `StorageService.getEvents`, `StorageService.getTodos`, `StorageService.getPlanner`.


* Produces: Tablero central inspirado en el showcase `HIBI Daily Dashboard` con pestañas superiores troqueladas (`Daily Rituals`, `Mood & Focus`, `02 / Archives`), saludo `¡Hola, {profile.name}!`, bloque de horario con borde inferior rasgado (`torn-paper-edge`), tarjeta `Mood & Focus Rhythm Tracker` con fases lunares e iconos lineales de expresión, y cuaderno `Brain Dump` con nota adhesiva lavanda, clip de latón y sello rojo `済`.


* [ ] **Step 1: Write the failing test in `src/tests/DashboardView.test.tsx**`

```tsx
it('renderiza los modulos fisicos HIBI: pestañas de rituales, Mood & Focus Rhythm Tracker y Brain Dump', () => {
  render(<DashboardView profile={mockProfile} onNavigate={vi.fn()} />);

  expect(screen.getByText(/¡hola, andrés!/i)).toBeInTheDocument();
  expect(screen.getByText(/daily rituals/i)).toBeInTheDocument();
  expect(screen.getByText(/mood & focus rhythm tracker/i)).toBeInTheDocument();
  expect(screen.getByText(/brain dump/i)).toBeInTheDocument();
  expect(screen.getByText(/focus on the path, not just the destination/i)).toBeInTheDocument();
});

```

* [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/tests/DashboardView.test.tsx`
Expected: FAIL

* [ ] **Step 3: Implement minimal code in `src/components/DashboardView.tsx` and `DashboardView.module.css**`

1. Añadir pestañas superiores troqueladas en verde salvia y crema (`Daily Rituals`, `Mood & Focus`, `02 / Photographic Logs`) sobre el pliego principal.


2. Conservar el saludo `¡Hola, {profile.name}!` acompañado del post-it amarillo con clip de latón y caligrafía *"Focus on the path, not just the destination."*.


3. Estilizar el bloque de agenda del día como hoja azul pizarra (`#E8EDF2`) con borde inferior rasgado (`torn-paper-edge`) y botón `Ver agenda completa`.


4. Incorporar la tarjeta táctil `Mood & Focus Rhythm Tracker` con selector interactivo de fases lunares e iconos de ánimo, junto con el bloque `Brain Dump` y sello japonés `済`.



* [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/tests/DashboardView.test.tsx`
Expected: PASS

* [ ] **Step 5: Commit**

```bash
git add src/components/DashboardView.tsx src/components/DashboardView.module.css src/tests/DashboardView.test.tsx
git commit -m ":art: style(dashboard): incorporar modulos HIBI Daily Dashboard, Mood Tracker y Brain Dump"

```

---

### Task 4: Screen 4 — `/planner` (`PlannerView` & Grid Semanal: Pliego de Enfoque 7 Días)

**Files:**

* Modify: `src/components/PlannerView.tsx`

* Modify: `src/components/PlannerView.module.css`

* Create: `src/components/planner/PlannerWeeklyGrid.tsx`
* Create: `src/components/planner/PlannerWeeklyGrid.module.css`
* Test: `src/tests/PlannerView.test.tsx`


**Interfaces:**

* Consumes: `{ profileId?: string; profile?: Profile; onNavigate?: (view: ViewType) => void }`, `StorageService.getPlanner`, `StorageService.savePlanner`, `StorageService.deletePlanner`.


* Produces: Cabecera con kicker `Planner y objetivos`, H1 `focus plan & agenda semanal.`, post-it crema en ángulo de `-3deg` con sprig botánico `🌿`, matriz de `Hábitos Semanales` con círculos verde salvia (`#5A826D`) y cinta washi terracota, tarjeta lateral `Top Priorities` con clip de latón, y rejilla `Horario de Estudio & Bloques Activos` manteniendo los estados vacíos y controles existentes.


* [ ] **Step 1: Write the failing test in `src/tests/PlannerView.test.tsx**`

```tsx
it('renderiza cabecera monumental de planner con post-it inclinado y habit tracker semanal', () => {
  render(<PlannerView profileId={profileId} />);

  expect(screen.getByRole('heading', { level: 1, name: /focus plan & agenda semanal\./i })).toBeInTheDocument();
  expect(screen.getByText(/planner y objetivos/i)).toBeInTheDocument();
  expect(screen.getByText(/discipline today/i)).toBeInTheDocument();
  expect(screen.getByText(/horario de estudio & bloques activos/i)).toBeInTheDocument();
  expect(screen.getByText(/hábitos semanales/i)).toBeInTheDocument();
});

```

* [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/tests/PlannerView.test.tsx`
Expected: FAIL

* [ ] **Step 3: Implement minimal code in `PlannerView.tsx` and `PlannerWeeklyGrid.tsx**`

1. Aceptar `{ profileId, profile, onNavigate }` resolviendo `const resolvedProfileId = profile?.id ?? profileId ?? ''`.
2. Renderizar el Hero Header con post-it inclinado `-3deg`, sprig `🌿`, kicker `Planner y objetivos`, H1 `focus plan & agenda semanal.` y caja de fecha con cinta washi.
3. Crear `PlannerWeeklyGrid.tsx` e integrarlo junto a las franjas (`mañana`, `tarde`, `noche`, `meta`), preservando el placeholder `Objetivo o bloque de enfoque`, el botón `Agregar bloque`, los botones `Semanal` / `Mensual` y el texto vacío `Sin bloques para mañana. Agrega un objetivo`.


4. Incluir el módulo de `Hábitos Semanales` con matriz de círculos verde salvia (`#5A826D`) y tarjeta `Top Priorities` con clip de latón.



* [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/tests/PlannerView.test.tsx`
Expected: PASS

* [ ] **Step 5: Commit**

```bash
git add src/components/PlannerView.tsx src/components/PlannerView.module.css src/components/planner/PlannerWeeklyGrid.tsx src/components/planner/PlannerWeeklyGrid.module.css src/tests/PlannerView.test.tsx
git commit -m ":art: style(planner): alinear pliego semanal, habit tracker salvia y rejilla con stitch"

```

---

### Task 5: Screen 5 — `/todo` (`TodoView` & Solapas Manila: Archivador de Tareas)

**Files:**

* Modify: `src/components/TodoView.tsx`

* Modify: `src/components/TodoView.module.css`

* Create: `src/components/todo/AreaIntegratedWorkspace.tsx`
* Create: `src/components/todo/AreaIntegratedWorkspace.module.css`
* Test: `src/tests/TodoView.test.tsx`


**Interfaces:**

* Consumes: `{ profileId?: string; profile?: Profile; onNavigate?: (view: ViewType) => void }`, `StorageService.getTodos`, `StorageService.saveTodo`, `StorageService.toggleTodo`, `StorageService.deleteTodo`.


* Produces: Cabecera con kicker `Mis tareas`, H1 `to-do & áreas integradas.`, archivador Manila con solapas troqueladas (`Todas las áreas`, `01. Estudios & Clase B`, `02. Introspección & Terapia`, `03. Universidad & Admisión`) y marcas de agua gigantes (`01`, `02`, `03`), cajón de captura rápida con borde rasgado superior y clip dorado, y workspace contextual lateral.


* [ ] **Step 1: Write the failing test in `src/tests/TodoView.test.tsx**`

```tsx
it('renderiza archivador Manila con solapas y marcas de agua de area', () => {
  render(<TodoView profileId={profileId} />);

  expect(screen.getByRole('heading', { level: 1, name: /to-do & áreas integradas\./i })).toBeInTheDocument();
  expect(screen.getByText(/mis tareas/i)).toBeInTheDocument();
  expect(screen.getByText(/todas las áreas/i)).toBeInTheDocument();
  expect(screen.getByText(/01\. estudios & clase b/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/¿qué tienes pendiente\?/i)).toBeInTheDocument();
});

```

* [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/tests/TodoView.test.tsx`
Expected: FAIL

* [ ] **Step 3: Implement minimal code in `TodoView.tsx` and `AreaIntegratedWorkspace.tsx**`

1. Aceptar `{ profileId, profile, onNavigate }` de forma retrocompatible.
2. Renderizar cabecera con kicker `Mis tareas`, H1 `to-do & áreas integradas.` y post-it lateral con cita manuscrita.


3. Añadir fila de solapas Manila trapezoidales con marcas de agua translúcidas `01`, `02`, `03`.


4. Conservar el formulario con placeholder `¿Qué tienes pendiente?`, los botones de filtro (`Todas`, `Pendientes`, `Completadas`) y los mensajes de estado vacío exactos, acompañados del panel lateral `AreaIntegratedWorkspace`.



* [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/tests/TodoView.test.tsx`
Expected: PASS

* [ ] **Step 5: Commit**

```bash
git add src/components/TodoView.tsx src/components/TodoView.module.css src/components/todo/AreaIntegratedWorkspace.tsx src/components/todo/AreaIntegratedWorkspace.module.css src/tests/TodoView.test.tsx
git commit -m ":art: style(todo): alinear archivador manila, solapas con marcas de agua y entrada rapida"

```

---

### Task 6: Screen 6 — `/agenda` (`AgendaView`: Almanaque de Mesa & Pliego Diario)

**Files:**

* Modify: `src/components/AgendaView.tsx`

* Modify: `src/components/AgendaView.module.css`

* Test: `src/tests/AgendaView.test.tsx`


**Interfaces:**

* Consumes: `{ profileId?: string; profile?: Profile; onNavigate?: (view: ViewType) => void }`, `StorageService.getEvents`, `StorageService.saveEvent`, `StorageService.deleteEvent`.


* Produces: Cabecera con kicker `Agenda de eventos` y badge `Almanaque de Mesa`, H1 `agenda & calendario mensual.`, cuadrícula mensual editorial con botones `Mes anterior`, `Mes siguiente` y `Día {N}`, celda `HOY` con cinta washi, y pliego lateral `Citas & Compromisos de Hoy` con clip metálico de latón manteniendo el encabezado `Nuevo evento para {selectedDate}`.


* [ ] **Step 1: Write the failing test in `src/tests/AgendaView.test.tsx**`

```tsx
it('renderiza el almanaque de mesa con titular editorial y panel diario con clip', () => {
  render(<AgendaView profileId={profileId} />);

  expect(screen.getByRole('heading', { level: 1, name: /agenda & calendario mensual\./i })).toBeInTheDocument();
  expect(screen.getByText(/agenda de eventos/i)).toBeInTheDocument();
  expect(screen.getByText(/almanaque de mesa/i)).toBeInTheDocument();
  expect(screen.getByText(/citas & compromisos de hoy/i)).toBeInTheDocument();
});

```

* [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/tests/AgendaView.test.tsx`
Expected: FAIL

* [ ] **Step 3: Implement minimal code in `AgendaView.tsx` and `AgendaView.module.css**`

1. Aceptar `{ profileId, profile, onNavigate }` de forma retrocompatible.
2. Renderizar cabecera con kicker `Agenda de eventos`, sello `Almanaque de Mesa` y H1 `agenda & calendario mensual.`.
3. Estilizar las celdas del calendario con tipografía serif, manteniendo `aria-label="Día {d}"` en cada celda y `Mes anterior` / `Mes siguiente` en los controles.


4. En el pliego derecho, colocar `<PaperOrnament variant="clip"/>`, el subtítulo `Citas & Compromisos de Hoy`, el formulario `Nuevo evento para {selectedDate}` con placeholder `Título del evento` y botón `Agregar evento`.



* [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/tests/AgendaView.test.tsx`
Expected: PASS

* [ ] **Step 5: Commit**

```bash
git add src/components/AgendaView.tsx src/components/AgendaView.module.css src/tests/AgendaView.test.tsx
git commit -m ":art: style(agenda): alinear almanaque mensual y pliego diario con clip segun stitch"

```

---

### Task 7: Screen 7 — `/notes` (`NotesView`: Cuaderno Terapéutico & Pliego Verjurado)

**Files:**

* Create: `src/components/NotesView.tsx`
* Create: `src/components/NotesView.module.css`
* Modify: `src/routes/index.tsx`

* Test: `src/tests/NotesView.test.tsx`

**Interfaces:**

* Consumes: `{ profileId?: string; profile?: Profile; onNavigate?: (view: ViewType) => void }`, `StorageService.getNotes`, `StorageService.saveNote`, `StorageService.deleteNote`.
* Produces: Cuaderno terapéutico con H1 `cuaderno de notas & reflexión.`, pregunta ancla `¿Qué pensamiento necesitas desahogar hoy?`, pliego de papel verjurado con margen vertical violeta (`56px`) y renglones de `28px`, sección `Balance de la Jornada` con 3 cajas reflexivas, y barra inferior de pluma estilográfica con sello `Almacenamiento 100% confidencial local`.
* [ ] **Step 1: Write the failing test in `src/tests/NotesView.test.tsx**`

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotesView } from '../components/NotesView';

describe('NotesView', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renderiza cuaderno terapeutico con pregunta ancla, pliego verjurado y permite guardar una nota', async () => {
    const user = userEvent.setup();
    render(<NotesView profileId="p-notes" onNavigate={vi.fn()} />);

    expect(screen.getByRole('heading', { level: 1, name: /cuaderno de notas & reflexión\./i })).toBeInTheDocument();
    expect(screen.getByText(/¿qué pensamiento necesitas desahogar hoy\?/i)).toBeInTheDocument();
    expect(screen.getByText(/balance de la jornada/i)).toBeInTheDocument();
    expect(screen.getByText(/almacenamiento 100% confidencial local/i)).toBeInTheDocument();

    const titleInput = screen.getByPlaceholderText(/título de la página/i);
    const bodyInput = screen.getByPlaceholderText(/escribe sin filtros/i);
    await user.type(titleInput, 'Bitácora de estudio');
    await user.type(bodyInput, 'Hoy avancé con geometría analítica.');

    const saveBtn = screen.getByRole('button', { name: /guardar en cuaderno/i });
    await user.click(saveBtn);

    expect(screen.getByText('Bitácora de estudio')).toBeInTheDocument();
  });
});

```

* [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/tests/NotesView.test.tsx`
Expected: FAIL

* [ ] **Step 3: Implement minimal code in `src/components/NotesView.tsx`, `NotesView.module.css` and register `/notes` in `src/routes/index.tsx**`

1. Construir `NotesView.tsx` con cabecera editorial, pregunta ancla, pliego verjurado con margen vertical violeta (`notes-ruled-sheet`), pestañas laterales troqueladas (`Journaling`, `Ideas`, `Terapia`), 3 tarjetas de `Balance de la Jornada` y barra inferior con contador de palabras y sello `Almacenamiento 100% confidencial local`.


2. Registrar la ruta `<Route <NotesView ? element="{activeProfile" path="/notes" profile="{activeProfile}"/> : null} />` en `src/routes/index.tsx`.



* [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/tests/NotesView.test.tsx`
Expected: PASS

* [ ] **Step 5: Commit**

```bash
git add src/components/NotesView.tsx src/components/NotesView.module.css src/routes/index.tsx src/tests/NotesView.test.tsx
git commit -m ":sparkles: feat(notes): implementar cuaderno terapeutico verjurado y balance de jornada"

```

---

### Task 8: Screen 8 — `/folders` (`FoldersView`: Fichero Archival de Carpetas & Vínculos)

**Files:**

* Create: `src/components/FoldersView.tsx`
* Create: `src/components/FoldersView.module.css`
* Modify: `src/routes/index.tsx`

* Test: `src/tests/FoldersView.test.tsx`

**Interfaces:**

* Consumes: `{ profileId?: string; profile?: Profile; onNavigate?: (view: ViewType) => void }`, `StorageService.getFolders`, `StorageService.saveFolder`, `StorageService.deleteFolder`.
* Produces: Fichero archival con H1 `fichero archival & documentos.`, sello notarial rojo `ARCHIVADO LOCALMENTE`, cuadrícula de carpetas con pestañas Manila escalonadas y marcas de agua (`01`, `02`, `03`), formulario de `Nueva Carpeta` y tabla `Inventario de Expedientes` (`DOC-01.1`).


* [ ] **Step 1: Write the failing test in `src/tests/FoldersView.test.tsx**`

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FoldersView } from '../components/FoldersView';

describe('FoldersView', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renderiza fichero archival con solapas escalonadas, sello notarial y tabla de inventario', async () => {
    const user = userEvent.setup();
    render(<FoldersView profileId="p-folders" onNavigate={vi.fn()} />);

    expect(screen.getByRole('heading', { level: 1, name: /fichero archival & documentos\./i })).toBeInTheDocument();
    expect(screen.getByText(/archivado localmente/i)).toBeInTheDocument();
    expect(screen.getByText(/inventario de expedientes/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /nueva carpeta/i })).toBeInTheDocument();

    const nameInput = screen.getByPlaceholderText(/nombre del expediente o carpeta/i);
    await user.type(nameInput, 'Bibliografía Semestral');
    await user.click(screen.getByRole('button', { name: /nueva carpeta/i }));

    expect(screen.getByText('Bibliografía Semestral')).toBeInTheDocument();
  });
});

```

* [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/tests/FoldersView.test.tsx`
Expected: FAIL

* [ ] **Step 3: Implement minimal code in `src/components/FoldersView.tsx`, `FoldersView.module.css` and register `/folders` in `src/routes/index.tsx**`

1. Implementar `FoldersView.tsx` con H1 `fichero archival & documentos.`, `<PaperOrnament variant="hanko-stamp"/>` con leyenda `ARCHIVADO LOCALMENTE`, tarjetas Manila con solapas troqueladas y marcas de agua, y tabla `Inventario de Expedientes`.


2. Registrar la ruta `/folders` en `src/routes/index.tsx`.



* [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/tests/FoldersView.test.tsx`
Expected: PASS

* [ ] **Step 5: Commit**

```bash
git add src/components/FoldersView.tsx src/components/FoldersView.module.css src/routes/index.tsx src/tests/FoldersView.test.tsx
git commit -m ":sparkles: feat(folders): implementar fichero archival, sello notarial y tabla de expedientes"

```

---

### Task 9: Screen 9 — `/integrations` (`IntegrationsView` & `VaultModal`: Soberanía de Datos)

**Files:**

* Create: `src/components/IntegrationsView.tsx`
* Create: `src/components/IntegrationsView.module.css`
* Create: `src/components/vault/VaultModal.tsx`
* Create: `src/components/vault/VaultModal.module.css`
* Modify: `src/routes/index.tsx`

* Test: `src/tests/IntegrationsView.test.tsx`

**Interfaces:**

* Consumes: `{ profileId?: string; profile?: Profile; onNavigate?: (view: ViewType) => void }`, `StorageService.exportProfileBundle`, `StorageService.importProfileBundle`.
* Produces: Centro de bóveda local con H1 `bóveda local & sincronización.`, sello de cera lacre (`wax-seal`), lema `Almacenamiento 100% en tu máquina`, tarjeta RFC 5545 con botón `Exportar Calendario .ics`, auditoría `0 peticiones externas` y modal `VaultModal` para respaldo JSON local.
* [ ] **Step 1: Write the failing test in `src/tests/IntegrationsView.test.tsx**`

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntegrationsView } from '../components/IntegrationsView';

describe('IntegrationsView', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renderiza boveda local con sello notarial, tarjeta RFC 5545, auditoria offline y abre VaultModal', async () => {
    const user = userEvent.setup();
    render(<IntegrationsView profileId="p-int" onNavigate={vi.fn()} />);

    expect(screen.getByRole('heading', { level: 1, name: /bóveda local & sincronización\./i })).toBeInTheDocument();
    expect(screen.getByText(/almacenamiento 100% en tu máquina/i)).toBeInTheDocument();
    expect(screen.getByText(/exportar calendario \.ics/i)).toBeInTheDocument();
    expect(screen.getByText(/0 peticiones externas/i)).toBeInTheDocument();

    const openVaultBtn = screen.getByRole('button', { name: /abrir bóveda json/i });
    await user.click(openVaultBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

```

* [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/tests/IntegrationsView.test.tsx`
Expected: FAIL

* [ ] **Step 3: Implement minimal code in `IntegrationsView.tsx`, `VaultModal.tsx` and register `/integrations` in `src/routes/index.tsx**`

1. Implementar `IntegrationsView.tsx` con H1 `bóveda local & sincronización.`, `<PaperOrnament variant="wax-seal"/>`, tarjeta RFC 5545 (`.ics`), panel de auditoría `0 peticiones externas` y botón `Abrir Bóveda JSON`.
2. Implementar `VaultModal.tsx` con `role="dialog"`, exportación/importación JSON del perfil activo y botón de cierre de `44x44px`.
3. Registrar la ruta `/integrations` en `src/routes/index.tsx`.



* [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/tests/IntegrationsView.test.tsx`
Expected: PASS

* [ ] **Step 5: Commit**

```bash
git add src/components/IntegrationsView.tsx src/components/IntegrationsView.module.css src/components/vault/VaultModal.tsx src/components/vault/VaultModal.module.css src/routes/index.tsx src/tests/IntegrationsView.test.tsx
git commit -m ":sparkles: feat(integrations): implementar boveda local, sello de lacre y exportacion ics/json"

```

---

### Task 10: Verificación Global, Regresión Cero, Build y Capturas de Pantalla

**Files:**

* Modify: `src/tests/routes.test.tsx`

* Test: Todas las suites de pruebas (`src/tests/*.test.ts*`)



**Interfaces:**

* Consumes: Todo el código y estilos implementados en las Tareas 0 a 9.
* Produces: Suite completa de Vitest en verde (0 regresiones en tests existentes + nuevos tests de vistas y rutas), build de producción sin errores de TypeScript y validación visual.
* [ ] **Step 1: Add route integration tests for `/notes`, `/folders` and `/integrations` in `src/tests/routes.test.tsx**`

```tsx
it('navega a /notes, /folders e /integrations dentro de las rutas protegidas', () => {
  const { unmount } = render(
    <MemoryRouter initialEntries={['/notes']}>
      <AppRoutes activeProfile={mockProfile} onSelectProfile={vi.fn()} onLockProfile={vi.fn()} />
    </MemoryRouter>
  );
  expect(screen.getByRole('heading', { level: 1, name: /cuaderno de notas & reflexión\./i })).toBeInTheDocument();
  unmount();

  render(
    <MemoryRouter initialEntries={['/folders']}>
      <AppRoutes activeProfile={mockProfile} onSelectProfile={vi.fn()} onLockProfile={vi.fn()} />
    </MemoryRouter>
  );
  expect(screen.getByRole('heading', { level: 1, name: /fichero archival & documentos\./i })).toBeInTheDocument();
});

```

* [ ] **Step 2: Run full test suite to verify zero regressions**

Run: `pnpm exec vitest run`
Expected: 100% de las suites y tests en `PASS`.

* [ ] **Step 3: Run production bundle build**

Run: `pnpm build`
Expected: `tsc -b && vite build` finalizado con éxito sin errores de tipos ni CSS.

* [ ] **Step 4: Commit final verification**

```bash
git add src/tests/routes.test.tsx
git commit -m ":white_check_mark: test(routes): verificar navegacion completa de las 8 vistas de papeleria"

```

---

¿Comenzamos ejecutando la **Task 0** (entregándote el código completo listo para pegar en `src/index.css`, `src/types/index.ts`, `src/services/storage.ts`, `src/routes/ProtectedRoute.tsx` y el nuevo componente `PaperOrnament`)?
