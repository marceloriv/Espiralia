# Ecosistema Editorial Bujo para Notas Reales Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar las notas reales del usuario en Espiralia en pliegos y cuadernillos editoriales de papelería verjurada japonesa (dot-grid, cintas marcapáginas, secciones numeradas con §, cajas embebidas de hito y pliego superior activo en vivo con guardado local).

**Architecture:** Módulo desacoplado de formateo editorial (`bujoFormatter`) que parsea texto plano a bloques de libreta (secciones, callouts, párrafos); componente de tarjeta de archivo artesanal (`BujoCard`); integración en `NotesView` conectando el pliego superior `.folioContainer` a la nota activa del usuario con guardado automático reactivo; y estilizado verjurado para `NoteModal`.

**Tech Stack:** TypeScript 5.8, React 19.2, CSS Modules con tokens CSS de Espiralia (`--bg-card`, `--border-hairline`, `--color-primary`, `--font-primary`), Lucide React, Vitest 3.x, Testing Library React.

**Spec:** Brainstorming Visual Companion con Opción C aprobada (`.superpowers/brainstorm/session-notes/content/options.html`).

## Global Constraints

- Estricto respeto al diseño y tokens de `src/index.css` y `DESIGN.md` (sin colores hardcodeados arbitrarios, usar paleta verjurada `#FAF7F0`, `#FCFBF8`, `--color-primary`).
- Almacenamiento 100% local en cliente mediante `StorageService` aislado por `profileId`.
- Preservar compatibilidad total con tests existentes de `src/tests/NotesView.test.tsx` (contenido inicial por defecto y selectores accesibles).
- Commits obligatorios con Conventional Commits + Gitmoji en español sin firmas de IA.
- Todas las pruebas deben residir exclusivamente en `src/tests/`.

## Review Focus

- Nota con texto plano sin formato especial: debe renderizarse limpiamente con `§ 1.` y párrafos serif verjurados sin romperse ni mostrar etiquetas sin procesar.
- Cambio de nota activa al hacer clic en tarjeta de la grilla: el pliego superior debe sincronizar título, cinta marcapáginas, secciones y conteo de palabras sin recargar la página.
- Guardado y edición en vivo en el pliego superior: las modificaciones deben persistirse en `StorageService` y actualizar inmediatamente la tarjeta correspondiente en la grilla inferior.
- Filtrado por pestañas (Todas / Reflexiones / Notas rápidas) y búsqueda: no debe desincronizar la nota activa si está visible, o debe seleccionar limpiamente la primera coincidencia.
- Nota vacía o nueva creación: debe mantener el pliego abierto con cursor parpadeante y cinta marcapáginas lista para escribir sin pantalla blanca (`QuotaExceededError` o `null` pointers protegidos).

---

### Task 1: Formateador Editorial Bujo (`bujoFormatter`)

**Files:**
- Create: `src/utils/bujoFormatter.ts`
- Test: `src/tests/bujoFormatter.test.ts`

**Interfaces:**
- Produces:
  ```typescript
  export type BujoBlockType = 'heading' | 'callout' | 'paragraph';

  export interface BujoHeadingBlock {
    type: 'heading';
    symbol: string;
    title: string;
  }

  export interface BujoCalloutBlock {
    type: 'callout';
    icon: string;
    title: string;
    badge?: string;
    text: string;
  }

  export interface BujoParagraphBlock {
    type: 'paragraph';
    text: string;
  }

  export type BujoBlock = BujoHeadingBlock | BujoCalloutBlock | BujoParagraphBlock;

  export function parseBujoContent(content: string, defaultTitle?: string): BujoBlock[];
  export function countWords(text: string): number;
  export function getCategoryRibbonColor(isReflection?: boolean, tags?: string[]): string;
  ```

- [ ] **Step 1: Write the failing test**

Crear `src/tests/bujoFormatter.test.ts` probando:
1. `countWords` calcula palabras exactas ignorando espacios extra.
2. `parseBujoContent` parsea encabezados con `§` o `#` como `BujoHeadingBlock` numerados secuencialmente.
3. `parseBujoContent` parsea bloques de caja tipo `[caja: 🚗 Avance | 91% Aprobado | Texto]` o `[hito: ...]` como `BujoCalloutBlock`.
4. `parseBujoContent` envuelve texto plano en párrafos y agrega `§ 1.` con `defaultTitle` si no tiene encabezados explícitos.
5. `getCategoryRibbonColor` entrega el token o hex apropiado según si es reflexión o tag de estudio.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/tests/bujoFormatter.test.ts`
Expected: FAIL con `Cannot find module '../utils/bujoFormatter'`

- [ ] **Step 3: Implement `bujoFormatter.ts` in `src/utils/bujoFormatter.ts`**

Implementar parser puro sin dependencias externas:
- Regex para encabezados `^(?:#+|§)\s*(.*)$`.
- Regex para callouts `^\[(?:caja|hito|callout):\s*([^|\]]+)(?:\|\s*([^|\]]+))?(?:\|\s*([^\]]+))?\]`.
- Mapeo de párrafos limpios preservando saltos de línea dobles.
- Manejo de conteo de palabras seguro con `text.trim().split(/\s+/).filter(Boolean).length`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/tests/bujoFormatter.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/bujoFormatter.ts src/tests/bujoFormatter.test.ts
git commit -m ":sparkles: feat(notes): agregar formateador editorial bujo para notas manuscritas"
```

---

### Task 2: Componente de Tarjeta Pliego Verjurado (`BujoCard`)

**Files:**
- Create: `src/components/notes/BujoCard.tsx`
- Create: `src/components/notes/BujoCard.module.css`
- Test: `src/tests/BujoCard.test.tsx`

**Interfaces:**
- Consumes: `parseBujoContent`, `countWords`, `getCategoryRibbonColor` de `src/utils/bujoFormatter.ts`
- Consumes: `Note`, `Folder` de `src/types`
- Produces:
  ```typescript
  export interface BujoCardProps {
    note: Note;
    folder?: Folder;
    isActive?: boolean;
    onSelect: (note: Note) => void;
    onEdit: (note: Note) => void;
    onDelete: (note: Note) => void;
  }
  export const BujoCard: React.FC<BujoCardProps>;
  ```

- [ ] **Step 1: Write the failing test**

Crear `src/tests/BujoCard.test.tsx`:
1. Renderiza tarjeta con cinta marcapáginas visible y atributos `aria-hidden`.
2. Muestra encabezado estilizado con símbolo `§` y título de la nota.
3. Muestra badge de palabras y fecha formateada en locale `es-CL`.
4. Al hacer clic en la tarjeta o presionar Enter, llama a `onSelect(note)`.
5. Al hacer clic en botón de editar, invoca `onEdit(note)`; en eliminar, invoca `onDelete(note)`.
6. Aplica clase `cardActive` si `isActive` es `true`.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/tests/BujoCard.test.tsx`
Expected: FAIL con `Cannot find module '../components/notes/BujoCard'`

- [ ] **Step 3: Implement `BujoCard.tsx` and `BujoCard.module.css`**

Implementar componente y estilos:
- Fondo verjurado con micro dot-grid (`radial-gradient(#E8DFD3 1px, transparent 1px)`) y borde izquierdo acentuado.
- Cinta marcapáginas vertical `.ribbon` posicionada con color dinámico.
- Contenido tipográfico serif (`font-family: Georgia, serif`) con preview limpio de la nota.
- Botones de acción accesibles con etiquetas `aria-label` claras para tests y lectores de pantalla.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/tests/BujoCard.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/notes/BujoCard.tsx src/components/notes/BujoCard.module.css src/tests/BujoCard.test.tsx
git commit -m ":art: style(notes): crear componente de tarjeta de libreta verjurada bujocard"
```

---

### Task 3: Pliego Bujo Superior Activo & Enriquecido en `NotesView`

**Files:**
- Modify: `src/components/NotesView.tsx:18-601`
- Modify: `src/components/NotesView.module.css:359-498`
- Test: `src/tests/NotesViewActivePliego.test.tsx`

**Interfaces:**
- Consumes: `BujoCard` de `src/components/notes/BujoCard`
- Consumes: `parseBujoContent`, `countWords` de `src/utils/bujoFormatter`
- Produces: Experiencia de pliego activo interactivo conectado al estado de notas del usuario y selección en grilla.

- [ ] **Step 1: Write the failing test**

Crear `src/tests/NotesViewActivePliego.test.tsx`:
1. Verifica que si no hay notas de usuario guardadas, renderiza el pliego terapéutico por defecto (preservando el comportamiento para onboarding y tests existentes).
2. Si el usuario guarda una nota "Mi Viaje Interior", el pliego superior se sincroniza mostrando el título y contenido de "Mi Viaje Interior" con secciones `§` y contador de palabras en tiempo real.
3. Al hacer clic en una tarjeta de la grilla inferior, el pliego superior cambia inmediatamente para mostrar esa nota como activa con el badge "Pliego Activo de Trabajo".
4. Al hacer clic en "Guardar Pliego" o editar el texto del pliego, persiste los cambios a través de `StorageService.saveNote`.
5. Los tests existentes de `NotesView.test.tsx` continúan pasando íntegramente.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/tests/NotesViewActivePliego.test.tsx`
Expected: FAIL debido a que el pliego superior actualmente es estático y no reacciona a la selección ni a las notas guardadas.

- [ ] **Step 3: Implement Active Pliego logic in `NotesView.tsx` and update CSS**

1. Agregar estado `activeNoteId` en `NotesView.tsx`.
2. Si `activeNoteId` existe y coincide con una nota de `notes`, derivar el contenido activo de esa nota; si no, utilizar la nota por defecto de autoobservación.
3. Renderizar bloques con `parseBujoContent`: secciones con `§`, párrafos con `.journalParagraph`, callouts con `.conasetEmbeddedBox` estilizado.
4. Conectar la barra de estado inferior `.writingStatusBar` con el conteo de palabras real dinámico (`countWords`) y estado de sincronización local.
5. Permitir alternar modo lectura/edición rápida del pliego con botón "Editar Pliego" / "Guardar Pliego".
6. En la sección de archivo inferior, reemplazar el `article className={styles.card}` por `<BujoCard key={note.id} note={note} isActive={note.id === activeNoteId} onSelect={handleSelectActiveNote} onEdit={handleOpenEdit} onDelete={handleDeleteNote} />`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/tests/NotesViewActivePliego.test.tsx src/tests/NotesView.test.tsx`
Expected: PASS en ambos archivos.

- [ ] **Step 5: Commit**

```bash
git add src/components/NotesView.tsx src/components/NotesView.module.css src/tests/NotesViewActivePliego.test.tsx
git commit -m ":sparkles: feat(notes): conectar pliego bujo superior a la nota activa del usuario con guardado en vivo"
```

---

### Task 4: Modal Editorial Verjurado (`NoteModal` Mejorado)

**Files:**
- Modify: `src/components/notes/NoteModal.tsx:65-175`
- Modify: `src/components/notes/NoteModal.module.css:1-120`
- Test: `src/tests/NoteModalEditorial.test.tsx`

**Interfaces:**
- Consumes: `countWords` de `src/utils/bujoFormatter`
- Produces: Modal de edición con estética de cuaderno verjurado, botones de inserción rápida de sintaxis bujo (`§ Sección`, `[Caja]`), y barra de estado con contador de palabras.

- [ ] **Step 1: Write the failing test**

Crear `src/tests/NoteModalEditorial.test.tsx`:
1. Renderiza el modal con cinta decorativa y textura de cuaderno.
2. Contiene botones de ayuda rápida: `+ § Sección` y `+ 🚗 Caja/Hito`.
3. Al hacer clic en `+ § Sección`, inserta automáticamente `\n§ Nueva Sección\n` en la posición actual del cursor o al final del textarea.
4. Muestra contador dinámico de palabras en la barra inferior del modal.
5. Envía los datos correctamente con `onSave` al enviar el formulario.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/tests/NoteModalEditorial.test.tsx`
Expected: FAIL con botones de inserción rápida no encontrados.

- [ ] **Step 3: Implement NoteModal improvements and styling**

1. Agregar botones de inserción rápida sobre el textarea en `NoteModal.tsx` (`+ § Sección`, `+ 🚗 Hito / Recuadro`).
2. Implementar contador de palabras dinámico en tiempo real bajo el textarea.
3. En `NoteModal.module.css`, aplicar fondo verjurado, cinta marcapáginas en la esquina superior del modal, y bordes cálidos papercraft acordes al sistema de diseño.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/tests/NoteModalEditorial.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/notes/NoteModal.tsx src/components/notes/NoteModal.module.css src/tests/NoteModalEditorial.test.tsx
git commit -m ":art: style(notes): dotar a notemodal de papeleria verjurada y atajos de sintaxis bujo"
```

---

### Task 5: Suite Integral de Verificación y Regresión Visual

**Files:**
- Modify: `src/tests/NotesView.test.tsx`
- Run: Suite completa de tests (`pnpm exec vitest run`) y build de producción (`pnpm build`).

- [ ] **Step 1: Write comprehensive end-to-end user journey test in `NotesView.test.tsx`**

Agregar caso en `NotesView.test.tsx`:
- Crear una nueva nota con secciones `§ 1.` y caja `[caja: Examen | 100% | Excelente]`.
- Verificar que aparece en la grilla con `BujoCard` (cinta marcapáginas, `§ 1.`).
- Seleccionar la tarjeta y verificar que el pliego superior se hidrata con la caja y secciones.
- Filtrar por reflexiones y verificar que solo permanecen las reflexiones.

- [ ] **Step 2: Run all tests in the repository**

Run: `pnpm exec vitest run`
Expected: Todos los tests pasan (65+ archivos de prueba en verde).

- [ ] **Step 3: Run production build check**

Run: `pnpm build`
Expected: `vite build` finaliza con código de salida 0 sin errores de tipos TypeScript ni advertencias de CSS Modules.

- [ ] **Step 4: Commit**

```bash
git add src/tests/NotesView.test.tsx
git commit -m ":white_check_mark: test(notes): suite integral de regresion y flujo de usuario para ecosistema bujo"
```
