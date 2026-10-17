# Fidelidad Visual Stitch para Espiralia — Plan Maestro de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar las 9 vistas y el layout compartido de Espiralia para lograr una fidelidad visual del 100% con los diseños exportados de Stitch, preservando todos los detalles analógicos papercraft (sellos notariales, cintas washi, clips de latón, texturas verjuradas, solapas Manila con marcas de agua, y rejillas bujo).

**Architecture:** Mantenimiento de la arquitectura SPA 100% en cliente sin dependencias de backend ni nube. Componentes funcionales en React 19 + TypeScript con estilos encapsulados en CSS Modules (`*.module.css`) que consumen estrictamente los tokens analógicos definidos en `src/index.css`. Persistencia de datos en `localStorage` con aislamiento estricto por `profileId` mediante `StorageService`.

**Tech Stack:** React 19, TypeScript 5.8, Vite 6.4, CSS Modules, Lucide React (1.53+), Vitest 3.x, `@testing-library/react` 16.x.

**Spec:** Capturas maestras de scroll completo (hasta 2800px) y exports HTML/CSS en [`docs/stitch_espiralia/`](file:///C:/Users/river/Desktop/Codigo/Proyectos/Espiralia/docs/stitch_espiralia/) y tokens de diseño en [`DESIGN.md`](file:///C:/Users/river/Desktop/Codigo/Proyectos/Espiralia/DESIGN.md).

---

## Capturas Maestras de Referencia Visual (Completas en Disco)

Todas las capturas maestras de scroll total (renderizadas a 1600x2800 / altura completa) están disponibles para inspección visual directa:
1. **`/inicio`**: 100% implementada y verificada en `src/components/LandingView.tsx` (commit `f73e442`, `203d297`, `544b29e`, `fa71ec1`, `482a476`).
2. **`/login`**: [`docs/stitch_espiralia/02_full_login.png`](file:///C:/Users/river/Desktop/Codigo/Proyectos/Espiralia/docs/stitch_espiralia/02_full_login.png) (Pliego crema, teclado numérico táctil 3x4, post-it con clip de latón, selector de perfil y enlaces de bóveda).
3. **`/dashboard`**: [`docs/stitch_espiralia/03_full_dashboard.png`](file:///C:/Users/river/Desktop/Codigo/Proyectos/Espiralia/docs/stitch_espiralia/03_full_dashboard.png) (2800px: Hoy en foco con cinta washi, prioridades 01-03 tachables, cronograma 08:00-20:00, carpetas Manila de progreso, tarjeta de notas amarillas Caveat y 3 cajas de reflexión nocturna).
4. **`/planner`**: [`docs/stitch_espiralia/04_full_planner.png`](file:///C:/Users/river/Desktop/Codigo/Proyectos/Espiralia/docs/stitch_espiralia/04_full_planner.png) (2800px: Rejilla semanal 7 columnas hasta las 21:30, Top Priorities con clip dorado, habit tracker diario L-D, medidor de energía y cuadrícula dot-grid).
5. **`/todo`**: [`docs/stitch_espiralia/05_full_todo.png`](file:///C:/Users/river/Desktop/Codigo/Proyectos/Espiralia/docs/stitch_espiralia/05_full_todo.png) (2800px: Solapas Manila con números de marca de agua gigantes `01`, `02`, `03`, tarjeta de entrada rápida, lista de tareas con checkboxes táctiles y panel de agenda asociada).
6. **`/agenda`**: [`docs/stitch_espiralia/06_full_agenda.png`](file:///C:/Users/river/Desktop/Codigo/Proyectos/Espiralia/docs/stitch_espiralia/06_full_agenda.png) (2800px: Almanaque de mesa formato imprenta, día 16 HOY con chips de eventos apilados, y panel diario de eventos con clip de latón).
7. **`/notes`**: [`docs/stitch_espiralia/07_full_notes.png`](file:///C:/Users/river/Desktop/Codigo/Proyectos/Espiralia/docs/stitch_espiralia/07_full_notes.png) (2800px: Cuaderno terapéutico con pregunta ancla, pliego verjurado con margen vertical violeta, avance Conaset, 3 cajas de reflexión nocturna, barra inferior de pluma estilográfica y bento lateral con energía basal).
8. **`/folders`**: [`docs/stitch_espiralia/08_full_folders.png`](file:///C:/Users/river/Desktop/Codigo/Proyectos/Espiralia/docs/stitch_espiralia/08_full_folders.png) (2800px: Fichero con solapas escalonadas, sello notarial rojo `ARCHIVADO LOCALMENTE`, tabla de inventario `DOC-01.1`, captura veloz y medidor IndexedDB).
9. **`/integrations`**: [`docs/stitch_espiralia/09_full_integrations.png`](file:///C:/Users/river/Desktop/Codigo/Proyectos/Espiralia/docs/stitch_espiralia/09_full_integrations.png) (2800px: Sello de archivo local, tarjeta RFC 5545 con exportación/importación y enlaces directos a Google Calendar Web, plantillas mailto de Gmail, auditoría de tráfico y medidor de memoria).

---

## Global Constraints

- **Stack estricto:** React 19 + TypeScript + Vite. Sin frameworks UI externos (cero Tailwind runtime, cero Radix UI desordenado). Todo estilo vía CSS Modules (`*.module.css`) consumiendo variables globales de `src/index.css`.
- **Tipografía analógica:** `Newsreader` para títulos editoriales, `Plus Jakarta Sans` para textos de interfaz, `Caveat` para notas manuscritas y post-its, `JetBrains Mono` para metadatos y sellos técnicos.
- **Tokens de color oficiales:**
  - Lienzo y papel: `--bg-canvas` (`#F7F4EE`), `--bg-card` (`#FFFFFF`), `--bg-manila` (`#EDE3D0`), `--bg-postit` (`#FEF8D6`), `--bg-night` (`#181715`).
  - Acentos y tintas: `--primary` (`#5E1755`), `--primary-hover` (`#4A1243`), `--accent-amber` (`#D97706`), `--accent-teal` (`#0D9488`), `--accent-red` (`#B91C1C`).
  - Bordes y líneas: `--border-subtle` (`rgba(0, 0, 0, 0.08)`), `--border-hairline` (`rgba(0, 0, 0, 0.12)`).
- **Aislamiento de tests:** Todo test unitario/integración debe residir exclusivamente en `src/tests/` (prohibido carpetas dispersas). Limpiar `localStorage.clear()` en `beforeEach`.
- **Git Flow & Commits:** Todos los cambios en la rama de trabajo `feature/stitch-visual-fidelity`. Commits bajo Conventional Commits + Gitmoji (`:emoji: <tipo>(<alcance>): <sujeto>`), sin trailers ni firmas de agentes IA.

---

## Review Focus

Cinco puntos críticos de fallo e interacción a verificar en cada vista:
1. **Persistencia y reactividad local:** Los cambios en formularios y acciones (tachar prioridades, agregar bloques, redactar notas) deben impactar `StorageService` y mantenerse intactos al recargar.
2. **Alineación y legibilidad de post-its y clips de latón:** Los clips dorados y chinchetas decorativas no deben superponerse a textos interactivos ni romper el flujo de lectura en pantallas medianas/móviles.
3. **Escalabilidad del scroll vertical:** Las vistas con cuadrículas horarias o tablas extensas (Dashboard, Planner, Folders) deben permitir scroll fluido sin provocar dobles scrollbars ni cortar los pies de pliego.
4. **Accesibilidad en teclados táctiles y checkboxes:** El teclado numérico del PIN y los checkboxes táctiles de tareas deben responder tanto a clics/taps como a pulsaciones de teclado físico (soporte `onKeyDown` y atributos ARIA).
5. **Aislamiento estricto por perfil:** Toda consulta o mutación de datos debe respetar el `profileId` activo sin filtrar información entre perfiles.

---

## Desglose de Tareas

```
Task 1: Shared AppLayout & Sidebar          -> verify: AppLayout.test.tsx
Task 2: Screen 2 — /login (ProfileGate)      -> verify: ProfileGateView.test.tsx
Task 3: Screen 3 — /dashboard (Dashboard)   -> verify: DashboardView.test.tsx
Task 4: Screen 4 — /planner (Planner)       -> verify: PlannerView.test.tsx
Task 5: Screen 5 — /todo (To-Do & Áreas)    -> verify: TodoView.test.tsx
Task 6: Screen 6 — /agenda (Agenda)         -> verify: AgendaView.test.tsx
Task 7: Screen 7 — /notes (Cuaderno)        -> verify: NotesView.test.tsx
Task 8: Screen 8 — /folders (Fichero)       -> verify: FoldersView.test.tsx
Task 9: Screen 9 — /integrations (Bóveda)   -> verify: IntegrationsView.test.tsx
Task 10: Verificación Global & Build        -> verify: pnpm exec vitest run && pnpm build
```

---

### Task 1: AppLayout Compartido & Barra Lateral de Atelier Digital

**Files:**
- Modify: `src/components/AppLayout.tsx`
- Modify: `src/components/AppLayout.module.css`
- Test: `src/tests/AppLayout.test.tsx`

**Interfaces:**
- Consumes: Rutas de `react-router-dom`, `Profile` activo de `StorageService`.
- Produces: Barra lateral fija editorial estilo Atelier Digital con monograma `Es`, botón `+ Nueva Entrada`, ítems de navegación con badges táctiles, ficha inferior de estado `Local DB: Activa` y drawer móvil.

- [ ] **Step 1: Write the failing test**

```tsx
// en src/tests/AppLayout.test.tsx
it('renderiza la barra lateral editorial con monograma Es, boton Nueva Entrada y ficha Local DB', () => {
  renderWithRouter(<AppLayout />);

  expect(screen.getByText('Es')).toBeInTheDocument();
  expect(screen.getByText('Espiralia')).toBeInTheDocument();
  expect(screen.getByText('Taller de Escritorio')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /\+ nueva entrada/i })).toBeInTheDocument();
  expect(screen.getByText(/local db: activa/i)).toBeInTheDocument();
  expect(screen.getByText(/aes-256/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/tests/AppLayout.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement minimal code in `AppLayout.tsx` and `AppLayout.module.css`**

1. Monograma y Marca: Contenedor con caja crema/marfil `Es` con tipografía de imprenta serif, H2 `Espiralia`, subtítulo `Taller de Escritorio`.
2. Botón de Acción Rápida: Botón morado profundo (`var(--primary)`) `+ Nueva Entrada` con icono `Plus` e interactividad.
3. Lista de Navegación: Enlaces `Resumen` (`/dashboard`), `Agenda & Planner` (`/planner`), `Tareas & Áreas` (`/todo`), `Notas & Terapia` (`/notes`), `Archivos & Vínculos` (`/folders`), `Sincronización` (`/integrations`). El enlace activo lleva fondo blanco puro, sombra papercraft sutil y punto indicador color magenta.
4. Tarjeta Inferior de Soberanía: Ficha con borde fino: indicador verde `Local DB: Activa`, tag `AES-256`, avatar con iniciales del perfil activo (`RV` / `Romina V.`) con candado, enlace `Ajustes` y versión `v2.4.8-analog`.
5. Drawer Móvil: Botón de hamburguesa superior con transición fluida para pantallas menores a 768px.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/tests/AppLayout.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/AppLayout.tsx src/components/AppLayout.module.css src/tests/AppLayout.test.tsx
git commit -m ":art: style(layout): alinear barra lateral y navegacion compartida con diseño stitch"
```

---

### Task 2: Screen 2 — `/login` (ProfileGateView: Desbloqueo de Cuaderno & PIN)

**Files:**
- Modify: `src/components/ProfileGateView.tsx`
- Modify: `src/components/ProfileGateView.module.css`
- Test: `src/tests/ProfileGateView.test.tsx`

**Interfaces:**
- Consumes: `StorageService.getProfiles`, `StorageService.verifyProfilePin`.
- Produces: Pliego central papercraft sobre tapete punteado, selector de cuadernos registrados, teclado numérico táctil 3x4, post-it con clip de latón y enlaces de bóveda.

- [ ] **Step 1: Write the failing test**

```tsx
// en src/tests/ProfileGateView.test.tsx
it('renderiza la interfaz de desbloqueo con pliego papercraft, teclado numerico 3x4 y post-it con clip', () => {
  render(<ProfileGateView onUnlock={vi.fn()} />);

  expect(screen.getByRole('heading', { level: 1, name: /desbloquear cuaderno\./i })).toBeInTheDocument();
  expect(screen.getByText(/cuadernos registrados/i)).toBeInTheDocument();
  expect(screen.getByText(/introduce tu pin maestro/i)).toBeInTheDocument();
  expect(screen.getByText(/discipline today, peace tomorrow/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '9' })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/tests/ProfileGateView.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement minimal code in `ProfileGateView.tsx` and `ProfileGateView.module.css`**

1. Franja Superior y Encabezado: Línea degradada superior (magenta/ámbar/esmeralda), logotipo central `Espiralia • TALLER DE ESCRITORIO • CUADERNO PERSONAL`, badge con candado `Arquitectura 100% Client-Side • IndexedDB / WebCrypto PBKDF2`.
2. Pliego Central Papercraft: Tarjeta flotante crema (`#FFFDF9`) con textura de cuadrícula milimétrica sutil, sombra multicapa y cinta washi en la esquina superior izquierda.
3. Columna Izquierda:
   - Tag `CUADERNOS REGISTRADOS` en color magenta.
   - H1 `Desbloquear Cuaderno.`
   - Cita itálica `«Un espacio íntimo donde tus pensamientos no salen jamás de tu dispositivo.»`
   - Lista de perfiles: Perfil activo con avatar `RV`, etiqueta `ACTIVO`, candado violeta; perfil secundario `Invitado / Taller (Borrador Temporal Efímero)`.
   - Botón punteado `+ Crear Nuevo Cuaderno / Perfil`.
   - Indicador de seguridad: `Cifrado PBKDF2 • 100.000 iteraciones en navegador`.
4. Columna Derecha:
   - Post-it amarillo (`#FEF8D6`) rotado -2° con clip dorado: `"discipline today, peace tomorrow ♡"` en fuente Caveat.
   - Sello rectangular rojo `LOCAL ENCRIPTADO`.
   - H2 `Introduce tu PIN Maestro`.
   - 4 casillas cuadradas táctiles para los dígitos con animación de punto lleno al tipear.
   - Teclado numérico táctil 3x4: teclas 1-9 con bisel suave, tecla `⌫` de borrado, tecla `0`, y tecla de desbloqueo `➔` en morado profundo.
   - Manejo de teclado físico numérico (`onKeyDown`).
5. Pie de Pantalla: Enlaces `¿Olvidaste tu PIN?`, `Exportar Bóveda Local (.json)`, `Manifiesto Soberano →`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/tests/ProfileGateView.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/ProfileGateView.tsx src/components/ProfileGateView.module.css src/tests/ProfileGateView.test.tsx
git commit -m ":sparkles: feat(perfiles): implementar profilegate de alta fidelidad con teclado tactil y post-it"
```

---

### Task 3: Screen 3 — `/dashboard` (DashboardView: Resumen Papercraft & Bento de Serenidad)

**Files:**
- Modify: `src/components/DashboardView.tsx`
- Modify: `src/components/DashboardView.module.css`
- Test: `src/tests/DashboardView.test.tsx`

**Interfaces:**
- Consumes: `StorageService.getTodos`, `StorageService.getPlannerBlocks`, `StorageService.getEvents`, `StorageService.getNotes`.
- Produces: Vista de escritorio completa de 2800px según `03_full_dashboard.png`: cabecera editorial con post-it manuscrito, 3 bento cards de serenidad, `TODAY'S MAIN FOCUS` con cinta washi, `TOP PRIORITIES` 01-03 tachables, cronograma 08:00-20:00, carpetas Manila de progreso, tarjeta de notas amarillas (Caveat) y 3 cajas de reflexión nocturna al cierre.

- [ ] **Step 1: Write the failing test**

```tsx
// en src/tests/DashboardView.test.tsx
it('renderiza el dashboard completo con cabecera editorial, bento de serenidad, today focus y reflexion nocturna', () => {
  render(<DashboardView profileId="p-test" />);

  expect(screen.getByText(/hoy en el escritorio/i)).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/octubre de 2026/i);
  expect(screen.getByText(/today's main focus/i)).toBeInTheDocument();
  expect(screen.getByText(/top priorities no negociables/i)).toBeInTheDocument();
  expect(screen.getByText(/focus schedule de hoy/i)).toBeInTheDocument();
  expect(screen.getByText(/progreso por áreas temáticas/i)).toBeInTheDocument();
  expect(screen.getByText(/end of day reflection/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/tests/DashboardView.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement minimal code in `DashboardView.tsx` and `DashboardView.module.css`**

1. Cabecera Editorial: Overline `ESPIRALIA ATELIER • HOY EN EL ESCRITORIO`, H1 con fecha activa y subtítulo itálico. Tarjeta de nota manuscrita con chincheta: `"El secreto no es hacer más cosas, sino proteger con gentileza las que realmente importan."` (Caveat). Píldoras de acción rápida: `+ Nueva Tarea`, `Bloque Horario`, `Entrada Diario`, `Foco Pomodoro`.
2. Trilogía Bento Superior:
   - Tarjeta 1 (`ENERGÍA Y CLARIDAD`): Medidor circular 85%, tag `Ritmo Óptimo`, indicación de ventana cognitiva (09:30 a 12:30).
   - Tarjeta 2 (`TIEMPO EN PLANIFICADOR`): `4.5 hrs` de enfoque en 3 bloques, desglose visual por área.
   - Tarjeta 3 (`COMPROMISOS CLAVE`): Contador `3 / 5 Tareas`, chip `Al día con la agenda`.
3. Columna Principal Izquierda (8 cols):
   - Banner `TODAY'S MAIN FOCUS` estilo papel rasgado con cinta washi beige.
   - Tarjeta `TOP PRIORITIES no negociables`: 3 tareas numeradas (01, 02, 03) con checkbox táctil, badge de área, y tachado animado al marcarse.
   - Caja `ELIMINATE DISTRACTIONS` con clip: 3 reglas clave de protección del foco.
   - Línea temporal `Focus Schedule de Hoy (08:00 - 20:00)`: Bloques coloreados por área con horario de inicio/fin y aguja roja de hora actual.
   - `Progreso por Áreas Temáticas`: 3 carpetas Manila (`01 Estudios & Conaset B`, `02 Terapia & Bienestar`, `03 Universidad & Tesis`) con medidores de avance, tareas pendientes y próximas fechas.
4. Columna Derecha (4 cols):
   - Tarjeta `NOTES / BRAIN DUMP`: Fondo amarillo suave punteado con tipografía Caveat, campo de adición rápida y lista de capturas.
   - Tarjeta `End of day reflection ♡`: 3 áreas de reflexión (`¿Qué fluyó bien?`, `¿Qué fricción superé?`, `Intención para mañana`) y botón `Guardar Reflexión`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/tests/DashboardView.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/DashboardView.tsx src/components/DashboardView.module.css src/tests/DashboardView.test.tsx
git commit -m ":sparkles: feat(dashboard): implementar dashboard resumen papercraft y bento de serenidad"
```

---

### Task 4: Screen 4 — `/planner` (PlannerView: Pliego Horario Semanal & Top Priorities)

**Files:**
- Modify: `src/components/PlannerView.tsx`
- Modify: `src/components/PlannerView.module.css`
- Test: `src/tests/PlannerView.test.tsx`

**Interfaces:**
- Consumes: `StorageService.getPlannerBlocks`, `StorageService.savePlannerBlock`.
- Produces: Cronograma semanal de 7 columnas (07:00 a 21:30), bloques coloreados por área, columna destacada de hoy, panel de Top Priorities con clip dorado, Habit Tracker diario (L-D) y medidor de estado de ánimo.

- [ ] **Step 1: Write the failing test**

```tsx
// en src/tests/PlannerView.test.tsx
it('renderiza la cabecera focus plan, filtros de area, rejilla semanal de 7 columnas y top priorities con clip', () => {
  render(<PlannerView profileId="p-test" />);

  expect(screen.getByRole('heading', { level: 1, name: /focus plan & agenda semanal\./i })).toBeInTheDocument();
  expect(screen.getByText(/01\. estudios & clase b/i)).toBeInTheDocument();
  expect(screen.getByText(/top priorities de la semana/i)).toBeInTheDocument();
  expect(screen.getByText(/habit tracker semanal/i)).toBeInTheDocument();
  expect(screen.getByText(/discipline today, peace tomorrow/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/tests/PlannerView.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement minimal code in `PlannerView.tsx` and `PlannerView.module.css`**

1. Cabecera del Pliego: Overline editorial, H1 `focus plan & agenda semanal.`, selector de semana activa, post-it manuscrito con chincheta dorada (`discipline today, peace tomorrow. ♡`), y botón morado `+ Agregar Bloque de Enfoque`.
2. Filtros de Área: Píldoras interactivas (`01. Estudios & Clase B`, `02. Introspección & Terapia`, `03. Universidad & Admisión`) con colores distintivos (ámbar, menta, púrpura).
3. Rejilla Semanal de 7 Columnas:
   - Eje horario vertical de 07:00 a 21:30 en franjas de 30 minutos.
   - Cabeceras de días (Lunes a Domingo), con la columna del día actual (`Martes • Hoy 13 Oct`) destacada con fondo violeta suave y borde nítido.
   - Bloques horarios interactivos en tarjetas papercraft con título, etiqueta de área y horario.
   - Franja transversal de almuerzo mindful (`13:30 - 14:30 Pausa Nutritiva & Caminata`).
4. Columna Derecha de Hábitos & Prioridades:
   - Tarjeta Manila `TOP PRIORITIES DE LA SEMANA` sostenida por un clip de latón: tareas con casillas táctiles.
   - Tarjeta `HABIT TRACKER SEMANAL`: Lista de 3 hábitos clave con 7 círculos diarios (L M X J V S D) con animación de completado.
   - Medidor `ENERGY CHECK & MOOD`: 5 iconos de estado anímico seleccionables.
   - Tarjeta inferior `NOTES / BRAIN DUMP Bujo Dot Grid` con puntos milimétricos.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/tests/PlannerView.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/PlannerView.tsx src/components/PlannerView.module.css src/tests/PlannerView.test.tsx
git commit -m ":sparkles: feat(planner): implementar vista semanal con pliego horario papercraft y top priorities"
```

---

### Task 5: Screen 5 — `/todo` (TodoView: To-Do & Áreas Integradas con Solapas Manila)

**Files:**
- Modify: `src/components/TodoView.tsx`
- Modify: `src/components/TodoView.module.css`
- Test: `src/tests/TodoView.test.tsx`

**Interfaces:**
- Consumes: `StorageService.getTodos`, `StorageService.saveTodo`, `StorageService.getAreas`.
- Produces: Barra de solapas Manila escalonadas con marcas de agua numéricas gigantes (`01`, `02`, `03`), tarjeta de entrada rápida con clip de latón, lista de tareas con checkboxes circulares y panel lateral de agenda asociada.

- [ ] **Step 1: Write the failing test**

```tsx
// en src/tests/TodoView.test.tsx
it('renderiza la cabecera to-do, solapas manila con marcas de agua numericas, entrada rapida y agenda asociada', () => {
  render(<TodoView profileId="p-test" />);

  expect(screen.getByRole('heading', { level: 1, name: /to-do & áreas integradas\./i })).toBeInTheDocument();
  expect(screen.getByText(/todas las áreas/i)).toBeInTheDocument();
  expect(screen.getByText(/01\. estudios & clase b/i)).toBeInTheDocument();
  expect(screen.getByText(/entrada rápida al taller/i)).toBeInTheDocument();
  expect(screen.getByText(/agenda asociada/i)).toBeInTheDocument();
  expect(screen.getByText(/disciplina gentil/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/tests/TodoView.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement minimal code in `TodoView.tsx` and `TodoView.module.css`**

1. Cabecera Editorial: Overline `CUADERNO DE TAREAS SEMESTRAL • V4.8`, H1 `to-do & áreas integradas.`, indicadores de tareas pendientes/completadas, y post-it Manila #08 con chincheta: `"El orden exterior nutre la serenidad interior. ♡"`.
2. Barra de Solapas Manila:
   - Pestañas escalonadas estilo cartulina Manila con números en marca de agua transparente (`01`, `02`, `03`): `Todas las Áreas`, `01. Estudios & Clase B`, `02. Terapia & Bienestar`, `03. Universidad & Tesis`.
   - Botón `+` para añadir área.
   - Píldoras de filtrado por estado: `Pendientes`, `En Curso`, `Hechas`.
3. Pliego Central de Tareas (Izquierda):
   - Tarjeta `ENTRADA RÁPIDA AL TALLER` sujeta con clip de latón: input para título, select de área, selector de prioridad (Baja, Media, Alta, Capital) y botón de inserción.
   - Lista de tareas prioritarias numeradas (`01.`, `02.`): Checkbox circular táctil, título con tachado al completar, tag de urgencia, fecha límite y botón de borrado.
   - Sección de cierre `Compromiso Antidistracciones de Hoy: disciplina gentil ♡`.
4. Columna Derecha (Agenda Asociada & Reminders):
   - Fichas de fecha con cinta washi verde (`VIE 24`, `MAR 28`, `LUN 03`) que muestran compromisos vinculados a las tareas activas.
   - Tarjeta de recordatorios y medidor de energía diaria.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/tests/TodoView.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/TodoView.tsx src/components/TodoView.module.css src/tests/TodoView.test.tsx
git commit -m ":sparkles: feat(tareas): implementar to-do y areas integradas con solapas papercraft"
```

---

### Task 6: Screen 6 — `/agenda` (AgendaView: Almanaque de Mesa Mensual & Panel Diario)

**Files:**
- Modify: `src/components/AgendaView.tsx`
- Modify: `src/components/AgendaView.module.css`
- Test: `src/tests/AgendaView.test.tsx`

**Interfaces:**
- Consumes: `StorageService.getEvents`, `StorageService.saveEvent`.
- Produces: Almanaque mensual de mesa con formato imprenta, leyenda por categorías, día 16 HOY destacado con chips de eventos apilados, panel diario de eventos con clip de latón, y tracker de energía y ritmo.

- [ ] **Step 1: Write the failing test**

```tsx
// en src/tests/AgendaView.test.tsx
it('renderiza el almanaque de mesa con formato imprenta, dia hoy con chips apilados y panel diario con clip', () => {
  render(<AgendaView profileId="p-test" />);

  expect(screen.getByRole('heading', { level: 1, name: /octubre 2026/i })).toBeInTheDocument();
  expect(screen.getByText(/almanaque de mesa/i)).toBeInTheDocument();
  expect(screen.getByText(/formato imprenta/i)).toBeInTheDocument();
  expect(screen.getByText(/agenda diaria/i)).toBeInTheDocument();
  expect(screen.getByText(/energy & mood rhythm tracker/i)).toBeInTheDocument();
  expect(screen.getByText(/the weekly flow & quick capture/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/tests/AgendaView.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement minimal code in `AgendaView.tsx` and `AgendaView.module.css`**

1. Cabecera Editorial: Overline `CUADERNO #04 • TOMO PRIMAVERA-VERANO • SEMANA 42`, H1 `Octubre 2026` + itálica `Planificador Mensual & Ritmos de Vida`, navegación entre meses `< Mes en curso >`, y botón `Exportar .ics`.
2. Almanaque de Mesa Mensual (Izquierda):
   - Subheader con badge `Formato Imprenta` y leyenda de puntos (`Terapia / Clave`, `Trámites & Conaset`, `Académico`, `Personal & Descanso`).
   - Rejilla mensual de 7 columnas (Lunes a Domingo), con fines de semana teñidos en tono ocre suave.
   - Celda del día actual con círculo violeta `16 HOY` y chips de eventos apilados con categoría de color y texto truncado.
   - Días de meses anterior y posterior en estilo punteado tenue.
   - Pie con indicación de protocolo `Sincronización RFC 5545 • Compatible Google Calendar / Apple Calendar`.
3. Columna Derecha (Panel Diario & Ritmo):
   - Post-it amarillo con aforismo de autor: `"No llenes los días de eventos; llena los eventos de presencia."`.
   - Tarjeta `AGENDA DIARIA • Viernes 16 Octubre` sujeta con clip de latón: listado de eventos con horarios, checkboxes de asistencia y notas breves.
   - Tarjeta `Energy & Mood Rhythm Tracker (OCT 16)`: 5 niveles de energía y 4 estados emocionales.
   - Tarjeta `The Weekly Flow & Quick Capture`: Vista rápida de los próximos 4 días con recuento de hitos.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/tests/AgendaView.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/AgendaView.tsx src/components/AgendaView.module.css src/tests/AgendaView.test.tsx
git commit -m ":sparkles: feat(agenda): implementar almanaque de mesa mensual y panel diario con estetica stitch"
```

---

### Task 7: Screen 7 — `/notes` (NotesView: Cuaderno de Terapia, Pliego Manuscrito & Reflexión)

**Files:**
- Modify: `src/components/NotesView.tsx`
- Modify: `src/components/NotesView.module.css`
- Test: `src/tests/NotesView.test.tsx`

**Interfaces:**
- Consumes: `StorageService.getNotes`, `StorageService.saveNote`.
- Produces: Cuaderno terapéutico analógico de 2800px según `07_full_notes.png`: pregunta ancla de la semana, pliego verjurado con margen vertical violeta y cuadrícula punteada, banner de avance CONASET, reflexión nocturna de 3 columnas, barra analógica de estilográfica, y bento lateral con energía basal y brain dump rápido.

- [ ] **Step 1: Write the failing test**

```tsx
// en src/tests/NotesView.test.tsx
it('renderiza el diario de autoobservacion con pregunta ancla, pliego verjurado, reflexion nocturna y energia basal', () => {
  render(<NotesView profileId="p-test" />);

  expect(screen.getByRole('heading', { level: 1, name: /diario de autoobservación & desahogo/i })).toBeInTheDocument();
  expect(screen.getByText(/pregunta ancla de la semana/i)).toBeInTheDocument();
  expect(screen.getByText(/descompresión mental & autoobservación/i)).toBeInTheDocument();
  expect(screen.getByText(/avance conaset - simulacro clase b/i)).toBeInTheDocument();
  expect(screen.getByText(/¿qué fluyó bien hoy\?/i)).toBeInTheDocument();
  expect(screen.getByText(/modo estilográfica: activo/i)).toBeInTheDocument();
  expect(screen.getByText(/brain dump rápido/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/tests/NotesView.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement minimal code in `NotesView.tsx` and `NotesView.module.css`**

1. Cabecera y Solapas de Tomos: Overline `ESPIRALIA • CUADERNO ANALÓGICO LOCAL • Tomo IV`, H1 `Diario de Autoobservación & Desahogo`, badge verde `Cifrado Local`, solapas de tomos (`01. Diario Íntimo & Terapia`, `02. Ideas & Taller`, `03. Conaset & Apuntes B`). Barra superior con botones de vista (`Hoy`, `Semana`, `Mes`, `Reflexión`), buscador y botón `Bloquear Cuaderno`.
2. Pliego Manuscrito Central (Papel Verjurado):
   - Ficha de metadatos: `FECHA: Jueves, 24 de Octubre de 2025 • Sesión Semanal #14 • 42 min de escritura`.
   - Callout con icono floral: `Pregunta Ancla de la Semana: "¿Qué autoexigencias me estoy imponiendo hoy que pertenecen al futuro y no a mi presente inmediato?"`.
   - Pliego verjurado marfil (`#FAF7F0`) con margen vertical violeta en el costado izquierdo:
     - Sección `§ 1. Descompresión mental & Autoobservación`.
     - Banner embebido `Avance Conaset - Simulacro Clase B` con barra de progreso `32 / 35 Aprobado (91%)` y notas de memoria muscular.
     - Sección `§ 2. Planes de Postulación 2026 (Diseño & Humanidades)`.
     - Pie de edición: `Escribiendo en vivo en almacenamiento cifrado local • 384 palabras escritas`.
3. Tarjeta de Reflexión Nocturna (3 Columnas):
   - Columna 1: `¿QUÉ FLUYO BIEN HOY?`
   - Columna 2: `¿QUÉ PUEDO MEJORAR?`
   - Columna 3: `INTENCIÓN PARA MAÑANA`
4. Barra Analógica Inferior: Ficha técnica con `Modo Estilográfica: Activo (Tinta 0.5mm)`, `Papel: Tinte Marfil 300g / Verjurado`, botón `Historial de Versiones` y botón morado `Guardar Pliego`.
5. Columna Lateral Derecha (Bento de Serenidad):
   - Post-it compasivo con clip de latón: `"discipline today, peace tomorrow ♡"`.
   - Tarjeta `Ritmo & Estado de Ánimo`: 5 botones emoji de Energía Basal (Baja, Neutro, Sereno, Enérgico, Radiante) y 3 barras de progreso (Foco 78%, Calma 85%, Cansancio 48%).
   - Tarjeta `BRAIN DUMP RÁPIDO 📌`: Lista de 3 notas inmediatas y campo de captura.
   - Tarjeta con candado `Cuaderno de Terapia Privado`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/tests/NotesView.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/NotesView.tsx src/components/NotesView.module.css src/tests/NotesView.test.tsx
git commit -m ":sparkles: feat(notes): implementar cuaderno terapeutico con pliego manuscrito y reflexion nocturna"
```

---

### Task 8: Screen 8 — `/folders` (FoldersView: Fichero Archival de Carpetas & Vínculos)

**Files:**
- Modify: `src/components/FoldersView.tsx`
- Modify: `src/components/FoldersView.module.css`
- Test: `src/tests/FoldersView.test.tsx`

**Interfaces:**
- Consumes: Carpetas y enlaces de `StorageService`.
- Produces: Fichero de índice manuscrito de 2800px según `08_full_folders.png`: solapas escalonadas estilo Manila (`01`, `02`, `03`, `04`), pliego con sello notarial rojo `ARCHIVADO LOCALMENTE`, tabla de inventario con códigos de documento (`DOC-01.1`), catálogo de vínculos con washi cards, captura veloz y medidor IndexedDB.

- [ ] **Step 1: Write the failing test**

```tsx
// en src/tests/FoldersView.test.tsx
it('renderiza el fichero archival con solapas escalonadas, sello archivado localmente, tabla de fichas y medidor indexeddb', () => {
  render(<FoldersView profileId="p-test" />);

  expect(screen.getByRole('heading', { level: 1, name: /explorador de carpetas & vínculos/i })).toBeInTheDocument();
  expect(screen.getByText(/archivado localmente/i)).toBeInTheDocument();
  expect(screen.getByText(/manual oficial señalización del tránsito conaset/i)).toBeInTheDocument();
  expect(screen.getByText(/captura veloz de enlace/i)).toBeInTheDocument();
  expect(screen.getByText(/almacenamiento local \(indexeddb\)/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/tests/FoldersView.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement minimal code in `FoldersView.tsx` and `FoldersView.module.css`**

1. Cabecera Editorial: Overline `REGISTRO FÍSICO-DIGITAL • ESTANTE 04-A`, H1 `Explorador de Carpetas & Vínculos`, subtítulo itálico, y botones de acción `+ Guardar Vínculo` y `+ Nueva Carpeta`.
2. Fichero de Solapas Escalonadas: 4 pestañas de solapas Manila desfasadas (`01 Clase B Conaset`, `02 Proceso Terapéutico`, `03 Admisión Univ. 2026`, `04 Finanzas & Vida`) y botón `+ Nueva Solapa`.
3. Pliego de Carpeta Activa:
   - Cabecera de carpeta con icono, título, sello rectangular rojo `ARCHIVADO LOCALMENTE` e indicadores de conteo.
   - Tabla de Inventario de Fichas: Columnas CÓDIGO (`DOC-01.1`), TÍTULO DEL DOCUMENTO (`Manual Oficial Señalización del Tránsito CONASET 2025`), TIPO / FORMATO (`PDF Anotado • 4.2 MB`), REGISTRO y ACCIONES.
   - Sección `Catálogo de Vínculos & Recursos Web`: Tarjetas de marcapáginas con cinta washi, título, favicon, dominio host y botón de acceso externo.
4. Columna Derecha (Captura & Almacenamiento):
   - Tarjeta Manila con clip de latón y aforismo de organización analógica.
   - Tarjeta `Captura Veloz de Enlace [CLIPBOARD]`: Formulario con inputs para URL, título, selector de carpeta y botón `Archivar Vínculo`.
   - Medidor `Almacenamiento Local (IndexedDB)`: Barra de progreso (`42.8 MB / 500 MB`), botón de limpieza de caché y botón `Exportar Todo (.json)`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/tests/FoldersView.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/FoldersView.tsx src/components/FoldersView.module.css src/tests/FoldersView.test.tsx
git commit -m ":sparkles: feat(folders): implementar fichero archival con solapas escalonadas y tabla de inventario"
```

---

### Task 9: Screen 9 — `/integrations` (IntegrationsView: Bóveda Local & Enlace Externo RFC 5545)

**Files:**
- Modify: `src/components/IntegrationsView.tsx`
- Modify: `src/components/IntegrationsView.module.css`
- Test: `src/tests/IntegrationsView.test.tsx`

**Interfaces:**
- Consumes: Generación y parseo de `.ics` local, auditoría local y almacenamiento de perfiles.
- Produces: Interfaz completa de bóveda local de 2800px según `09_full_integrations.png`: topbar atelier con píldoras de navegación, sello rojo `ARCHIVADO LOCALMENTE`, post-it de Soberanía con clip de latón, banner de aislamiento estricto (0 bytes), tarjeta RFC 5545 (generador `.ics`, zona drop de importación y enlaces directos a Google Calendar Web), plantillas de Gmail mailto, auditoría local y métricas de memoria.

- [ ] **Step 1: Write the failing test**

```tsx
// en src/tests/IntegrationsView.test.tsx
it('renderiza la bóveda local con sello archivado, tarjeta rfc 5545, zona drop, plantillas gmail y auditoria', () => {
  render(<IntegrationsView profileId="p-test" />);

  expect(screen.getByRole('heading', { level: 1, name: /integraciones & enlace externo/i })).toBeInTheDocument();
  expect(screen.getByText(/archivado localmente/i)).toBeInTheDocument();
  expect(screen.getByText(/aislamiento estricto verificado/i)).toBeInTheDocument();
  expect(screen.getByText(/0 bytes transmitidos al exterior/i)).toBeInTheDocument();
  expect(screen.getByText(/google calendar & ical \(\.ics\)/i)).toBeInTheDocument();
  expect(screen.getByText(/arrastra tu archivo/i)).toBeInTheDocument();
  expect(screen.getByText(/gmail & plantillas/i)).toBeInTheDocument();
  expect(screen.getByText(/registro de auditoría local/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/tests/IntegrationsView.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement minimal code in `IntegrationsView.tsx` and `IntegrationsView.module.css`**

1. Topbar Atelier & Encabezado: Barra superior con enlaces (`Biblioteca`, `Cuaderno`, `Bóveda Local`, `Ajustes & Conexiones` [píldora activa], `Estado Offline Activo`, botón morado `Exportar Bóveda`). Pliego principal con badges de versión, H1 `Integraciones & Enlace Externo`, sello rectangular rojo `ARCHIVADO LOCALMENTE`, subtítulo de soberanía Privacy-by-Design, y post-it amarillo con clip de latón: `"Tus compromisos y pensamientos no necesitan servidores; viven en tu propio pliego ♡"`.
2. Subnavegación Lateral Izquierda: Ficha con enlaces de protocolo: `Integraciones`, `Bóveda & Privacidad`, `Google Calendar (.ics)` [activo], `Gmail & Plantillas`, `Áreas Temáticas`, `Registro de Actividad`, tarjeta de `Copia de Respaldo` con botón `Descargar .ics Completo`, y enlaces de cierre.
3. Columna Central (Protocolo RFC 5545):
   - Banner verde de seguridad: `Aislamiento Estricto Verificado • 0 bytes transmitidos al exterior` con botón `Ver Auditoría de Tráfico`.
   - Tarjeta principal con cinta washi `RFC 5545 LOCAL`:
     - `Opción A: Generar Archivo de Exportación (.ics)` con selects de Rango Temporal y Filtro por Área, y botón morado de descarga calificada.
     - `Opción B: Importar Eventos hacia Bóveda Local` con zona drag-and-drop punteada para archivos `.ics` y lectura exclusiva en memoria vía FileReader API.
     - `Opción C: Atajos Directos "A un solo clic" (Google Calendar Web)` con tarjetas de eventos y botones de enlace directo `Añadir a Google ↗`.
4. Columna Derecha (Gmail & Auditoría):
   - Tarjeta `Gmail & Plantillas` con cinta washi: Explicación de protocolo `mailto://` sin API keys, plantilla para justificaciones académicas y recordatorio instantáneo.
   - Tarjeta `Registro de Auditoría Local`: Historial de operaciones de exportación/lectura fechadas y botón `Descargar Copia Completa (JSON + .ics)`.
5. Pie de Pliego y Página: Medidor `Almacenamiento Local: 1.4 MB / 50 MB (IndexedDB)`, cita de autor y ficha notarial `Especificación RFC 5545 iCalendar`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/tests/IntegrationsView.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/IntegrationsView.tsx src/components/IntegrationsView.module.css src/tests/IntegrationsView.test.tsx
git commit -m ":sparkles: feat(storage): refinar boveda de integraciones rfc 5545 y auditoria local segun stitch"
```

---

### Task 10: Verificación Global, Accesibilidad & Compilación de Producción

**Files:**
- Modify: `src/tests/*` (en caso de requerir sincronización de aserciones entre vistas)
- Verify: Todas las suites de pruebas unificadas en `src/tests/` y compilación de producción con Vite.

**Interfaces:**
- Produces: 100% de tests unitarios y de integración pasando en verde (340+ tests), cero errores de tipado TypeScript y build de producción optimizado en `dist/`.

- [ ] **Step 1: Run complete vitest test suite**

Run: `pnpm exec vitest run`
Expected: 62+ archivos de test pasando en verde (340+ tests en total).

- [ ] **Step 2: Run production build and typecheck**

Run: `pnpm build`
Expected: `tsc -b && vite build` compila con éxito y código de salida 0.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m ":white_check_mark: test(layout): verificar fidelidad visual completa y suites de pruebas en verde"
```
