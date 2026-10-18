# Carpetas Planas Modernas de Tomos para Notas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar el sistema de carpetas planas modernas (estilo Windows 11 / Flat Design) para los Tomos de notas en `NotesView`, permitiendo alternar entre áreas temáticas (`01. Diario & Terapia`, `02. Ideas & Taller`, `03. Conaset & Apuntes B`) con filtrado reactivo, pliego superior contextual por tomo y persistencia 100% aislada sin pérdida de notas.

**Architecture:** Lógica de asignación de tomos en `NotesView.tsx` basada en `folderId` con mapeo retrocompatible por tags; pliego superior que sincroniza su nota activa con el tomo seleccionado; y rediseño en `NotesView.module.css` con solapa trasera trapezoidal, hojas interiores asomando y tapa delantera de bolsillo con contador de notas.

**Tech Stack:** TypeScript 5.8, React 19.2, CSS Modules, Lucide React, Vitest 3.x, Testing Library React.

**Spec:** Visual Companion aprobado (`.superpowers/brainstorm/session-notes/content/folders.html` - Carpetas Planas Modernas).

## Global Constraints

- Preservar todas las notas en `StorageService` sin pérdida de datos al cambiar de tomo.
- Estricto respeto al diseño plano moderno: sin brillos plásticos pesados ni perspectivas 3D extremas; líneas limpias y colores temáticos armonizados con `--bg-card` y `--color-primary`.
- Accesibilidad de teclado completa (navegación con flechas o tabulación, soporte de `Enter`/`Space` y `aria-selected` / `aria-current`).
- Todos los tests nuevos en `src/tests/NotesViewTomos.test.tsx` y 100% de compatibilidad con los 68 archivos de prueba existentes.
- Commits en formato Conventional Commits + Gitmoji en español.

## Review Focus

- Cambio de tomo no debe borrar ni desasociar notas de los otros tomos en `localStorage`.
- Cuando un tomo no tenga notas guardadas (ej. Tomo 02 recién abierto), el pliego superior debe mostrar un estado en blanco/invitación a escribir acorde a ese tomo en lugar de romperse.
- Creación de notas con `+ Nueva Nota` o desde el pliego mientras se está en Tomo 02 debe asignar automáticamente `folderId: 'tomo-02'` a la nueva nota.
- El contador en píldora de cada carpeta (`3`, `0`, `2`) debe actualizarse reactivamente cuando se agregan o eliminan notas.
- Retrocompatibilidad con tests existentes: los textos esperados en `NotesView.test.tsx` (como pregunta ancla y diario) deben seguir estando disponibles en Tomo 01.

---

### Task 1: Lógica de Tomos Contextuales y Filtrado en `NotesView`

**Files:**
- Modify: `src/components/NotesView.tsx:30-310`
- Test: `src/tests/NotesViewTomos.test.tsx`

**Interfaces:**
- Produces:
  - Constante `TOMOS_CONFIG = [{ id: '01', folderId: 'tomo-01', title: '01. Diario & Terapia', icon: '📖', color: 'tomo-diario' }, ...]`
  - Helper `getNoteTomoId(note: Note): string` (resuelve `folderId` o tags `terapia`/`conaset`/`ideas`)
  - Estado `activeTomo` conectado al filtrado de `filteredNotes`, creación de notas y pliego contextual

- [x] **Step 1: Write the failing test**

Crear `src/tests/NotesViewTomos.test.tsx`:
1. Renderiza las 3 carpetas de Tomos (`01. Diario & Terapia`, `02. Ideas & Taller`, `03. Conaset & Apuntes B`) con sus contadores respectivos.
2. Al pulsar sobre `02. Ideas & Taller`, la lista de notas se filtra mostrando solo las notas del Tomo 02 (y oculta las del Tomo 01).
3. Al pulsar nuevamente `01. Diario & Terapia`, las notas del Tomo 01 reaparecen intactas (sin pérdida de datos).
4. Al crear una nota mientras `activeTomo` es `02`, la nota guardada recibe `folderId: 'tomo-02'` y aparece inmediatamente en el Tomo 02.

- [x] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/tests/NotesViewTomos.test.tsx`
Expected: FAIL porque las solapas de tomos actualmente solo alternan una clase CSS y no filtran las notas ni asocian carpetas.

- [x] **Step 3: Implement Tomo logic in `NotesView.tsx`**

1. Definir configuración de tomos:
   - `01`: `folderId: 'tomo-01'`, nombre: `01. Diario & Terapia`, icono: `BookOpen`, tag: `terapia`.
   - `02`: `folderId: 'tomo-02'`, nombre: `02. Ideas & Taller`, icono: `Sparkles`, tag: `ideas`.
   - `03`: `folderId: 'tomo-03'`, nombre: `03. Conaset & Apuntes B`, icono: `FileText`, tag: `conaset`.
2. Implementar `getNoteTomo(note: Note): string`: si `note.folderId` coincide con un tomo, usarlo; de lo contrario, inferir según `tags` o por defecto `'01'`.
3. Filtrar `filteredNotes` por `activeTomo`.
4. Calcular el conteo de notas por cada tomo dinámicamente (`tomoNoteCounts`).
5. En `handleSaveNote` y `handleSavePliego`, asignar automáticamente `folderId: tomoConfig.folderId` y el tag correspondiente al tomo activo.
6. Al cambiar de tomo, si el nuevo tomo tiene notas, activar su nota más reciente; si está vacío, ofrecer el pliego listo para redactar en ese tomo.

- [x] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/tests/NotesViewTomos.test.tsx src/tests/NotesView.test.tsx`
Expected: PASS en ambos archivos.

- [x] **Step 5: Commit**

```bash
git add src/components/NotesView.tsx src/tests/NotesViewTomos.test.tsx
git commit -m ":sparkles: feat(notes): conectar solapas de tomos a carpetas reales con filtrado y persistencia"
```

---

### Task 2: Estilos de Carpetas Planas Modernas (Flat Windows 11 Style)

**Files:**
- Modify: `src/components/NotesView.module.css:140-220`
- Modify: `src/components/NotesView.tsx:310-370`

**Interfaces:**
- Consumes: Clases CSS `.flatFolderTab`, `.flatBackFlap`, `.flatSheets`, `.flatFrontFlap`, `.flatCountPill`
- Produces: Representación visual plana moderna de las carpetas de tomos con solapa trasera, hojas interiores y tapa frontal de bolsillo.

- [x] **Step 1: Write the failing visual integration test**

Agregar caso en `src/tests/NotesViewTomos.test.tsx`:
1. Verifica que cada carpeta de tomo incluye los elementos estructurales accesibles: botón con rol tab/botón, texto descriptivo, hojas decorativas con `aria-hidden="true"`, y badge de conteo.
2. Verifica que la carpeta activa recibe la clase/atributo de selección correspondiente (`active` / `aria-current="true"`).

- [x] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/tests/NotesViewTomos.test.tsx`
Expected: FAIL esperando los nuevos elementos de estructura de carpeta.

- [x] **Step 3: Implement Flat Folder CSS in `NotesView.module.css` and update markup**

1. Reemplazar `.tomoTabsRow` y `.tomoTab` con las clases del diseño plano moderno:
   - `.flatFoldersBar`: contenedor horizontal de carpetas.
   - `.flatFolderTab`: botón interactivo con solapa trasera (`.flatBackFlap` con corte trapezoidal plano en clip-path), hojas blancas interiores (`.flatSheets`) y tapa delantera (`.flatFrontFlap`).
   - Variaciones cromáticas por tomo: dorado ámbar para Tomo 01, mostaza para Tomo 02, esmeralda para Tomo 03.
   - Estado `.active`: elevación sutil de 2px, hojas interiores asomando 6px hacia arriba, y tono frontal iluminado.
   - Focus visible accesible con `outline: 2px solid var(--color-primary)` (WCAG 2.4.7).

- [x] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/tests/NotesViewTomos.test.tsx src/tests/ui-a11y-focus.test.tsx`
Expected: PASS sin advertencias ni regresiones de accesibilidad.

- [x] **Step 5: Commit**

```bash
git add src/components/NotesView.module.css src/components/NotesView.tsx src/tests/NotesViewTomos.test.tsx
git commit -m ":art: style(notes): implementar estetica de carpetas planas modernas estilo windows 11 para tomos"
```

---

### Task 3: Verificación Global y Build de Producción

**Files:**
- Test: Suite completa del proyecto (`pnpm exec vitest run`)
- Build: Compilación de producción (`pnpm build`)

- [x] **Step 1: Run complete test suite**

Run: `pnpm exec vitest run`
Expected: Todos los archivos de prueba en verde (69 test files, 395+ tests).

- [x] **Step 2: Run production build check**

Run: `pnpm build`
Expected: `tsc -b && vite build` finaliza con código 0 sin errores de tipos ni CSS.

- [x] **Step 3: Commit final documentation or ledger update if needed**

```bash
git commit --allow-empty -m ":white_check_mark: test(notes): validacion integral de carpetas de tomos y build de produccion"
```
