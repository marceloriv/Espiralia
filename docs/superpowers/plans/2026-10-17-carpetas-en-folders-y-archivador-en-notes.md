# Carpetas Planas en FoldersView y Archivador Físico en NotesView Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar el diseño de carpetas planas modernas (con solapa trapezoidal, hojas asomando y tapa de bolsillo) en `FoldersView` y transformar la interfaz de `NotesView` en un archivador físico de oficina / bibliorato de anillas (con lomos porta-etiquetas metálicos, ojal circular de extracción y mecanismo de anillas con hojas perforadas).

**Architecture:** En `FoldersView`, adaptar el sistema de solapas escalonadas para renderizar carpetas planas modernas consistentes con el diseño aprobado. En `NotesView`, rediseñar las pestañas de tomos como lomos de archivadores de palanca/anillas con herrajes metálicos y dotar al pliego principal de anillas de acero y perforaciones circulares de archivo, preservando al 100% la lógica de aislamiento por `folderId`, `StorageService` y accesibilidad WCAG 2.4.7.

**Tech Stack:** TypeScript 5.8, React 19.2, CSS Modules, Lucide React, Vitest 3.x, Testing Library React.

**Spec:** Requerimiento del usuario ("este diseño de carpetas implementarla en folder y cambiar el diseño de notes para que sea semejante a un archivador") y catálogo de diseño de papelería física Espiralia.

## Global Constraints

- Preservar al 100% el aislamiento de datos por `profileId` y `folderId` en `StorageService`.
- No romper retrocompatibilidad con los tests existentes en `FoldersView.test.tsx`, `NotesView.test.tsx` y `NotesViewActivePliego.test.tsx`.
- Estricto cumplimiento WCAG 2.4.7: nunca utilizar `outline: none;` sin regla `:focus-visible` accesible.
- Commits en formato Conventional Commits + Gitmoji en español (`:art: style(...)`, `:sparkles: feat(...)`, `:white_check_mark: test(...)`).
- Todas las pruebas deben ubicarse exclusivamente en `src/tests/`.

## Review Focus

1. **Persistencia y reactividad en FoldersView:** Crear una nueva carpeta o cambiar entre carpetas debe activar correctamente la carpeta seleccionada y reflejar la estructura de solapa, hojas y bolsillo.
2. **Accesibilidad de teclado en Archivadores de NotesView:** Los lomos/botones de tomos deben ser botones nativos con nombre accesible, `aria-current="page"` para el archivador activo y foco visible sin recortes.
3. **Mecanismo de anillas en NotesView:** Las anillas metálicas y perforaciones de papel deben ser puramente presentacionales (`aria-hidden="true"`) para no saturar lectores de pantalla.
4. **Respuesta responsiva en pantallas estrechas:** Los archivadores de `NotesView` y las carpetas de `FoldersView` deben permitir scroll horizontal suave sin desbordar el viewport (`overflow-x: auto`).
5. **Compilación de producción limpia:** El build `pnpm build` (`tsc -b && vite build`) debe finalizar con código 0 y sin errores de tipos de TypeScript.

---

### Task 1: Implementar Carpetas Planas Modernas en `FoldersView`

**Files:**
- Modify: `src/components/FoldersView.tsx:365-410`
- Modify: `src/components/FoldersView.module.css:195-275`
- Test: `src/tests/FoldersView.test.tsx`

**Interfaces:**
- Consumes: `displayFolders` (`id`, `num`, `name`, `color`, `specs`, `icon`), `selectedFolderId`, `setUserSelectedFolderId`
- Produces: Estructura de carpetas planas modernas en `FoldersView`:
  - `.flatFoldersRow`: contenedor de solapas de carpetas
  - `.flatFolderTab`: botón interactivo de carpeta con solapa trapezoidal trasera (`.flatBackFlap`), hojas interiores asomando (`.flatSheets`) y tapa delantera de bolsillo (`.flatFrontFlap`) con icono, título y píldora de conteo

- [ ] **Step 1: Write the failing test**

Agregar caso en `src/tests/FoldersView.test.tsx`:
```tsx
it('renderiza las carpetas del fichero con estructura de carpeta plana moderna (solapa trasera, hojas y bolsillo frontal)', () => {
  render(<FoldersView profileId="p-test-flat" />);

  const sheets = screen.getAllByTestId('folder-flat-sheets');
  expect(sheets.length).toBeGreaterThanOrEqual(4);

  const activeTab = screen.getByRole('tab', { name: /clase b conaset/i });
  expect(activeTab).toHaveAttribute('aria-selected', 'true');
  expect(activeTab.querySelector('._flatFrontFlap_8c07e0, [data-front-flap="true"]')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/tests/FoldersView.test.tsx`
Expected: FAIL esperando `folder-flat-sheets` o estructura de carpetas planas.

- [ ] **Step 3: Implement flat modern folders in `FoldersView.module.css` and `FoldersView.tsx`**

1. En `FoldersView.module.css`:
   - Definir `.flatFoldersRow`, `.flatFolderTab`, `.flatBackFlap`, `.flatSheets`, `.sheetLine`, `.sheetAccent`, `.flatFrontFlap`, `.flatFolderHeader`, `.flatFolderTitle`, `.flatSpecsPill`.
   - Soporte para color temático dinámico con `border-color` y fondos adaptados a `df.color`.
   - Estado activo con elevación de hojas (`translateY(-6px)`), foco visible accesible (`outline: 2px solid var(--color-primary)`).
2. En `FoldersView.tsx`:
   - Actualizar el mapeo de `displayFolders` dentro de `steppedTabsWrapper` (o nuevo contenedor `flatFoldersRow`) para renderizar la solapa trasera, hojas interiores (`data-testid="folder-flat-sheets"`), y tapa frontal con número, título y contador.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/tests/FoldersView.test.tsx src/tests/ui-a11y-focus.test.tsx`
Expected: PASS en ambos archivos.

- [ ] **Step 5: Commit**

```bash
git add src/components/FoldersView.tsx src/components/FoldersView.module.css src/tests/FoldersView.test.tsx
git commit -m ":art: style(folders): implementar estetica de carpetas planas modernas en explorador de carpetas"
```

---

### Task 2: Rediseñar los Tomos de `NotesView` como Archivadores Físicos de Oficina (Binder Spines)

**Files:**
- Modify: `src/components/NotesView.tsx:345-400`
- Modify: `src/components/NotesView.module.css:90-210`
- Test: `src/tests/NotesViewTomos.test.tsx`

**Interfaces:**
- Consumes: `TOMOS_CONFIG`, `activeTomo`, `setActiveTomo`, `tomoNoteCounts`
- Produces: Estructura de lomos de archivador de oficina / bibliorato:
  - `.binderCabinetRow`: fila de archivadores de palanca alineados en el estante
  - `.binderSpineBtn`: lomo vertical/apaisado con textura de archivador encuadernado
  - `.binderLabelFrame`: porta-etiquetas metálico con remaches en esquinas
  - `.binderLabelPaper`: etiqueta de cartulina con tipografía mecanografiada
  - `.binderFingerRing`: ojal metálico circular de extracción con anillo de acero
  - `.binderSpinePill`: contador de notas archivadas en el lomo

- [ ] **Step 1: Write the failing test**

Actualizar `src/tests/NotesViewTomos.test.tsx` para validar la estructura de archivadores:
```tsx
it('renderiza las solapas de tomos con estetica de archivador de oficina (porta-etiquetas metalico, ojal de extraccion y badge)', () => {
  render(<NotesView profileId={profileId} />);

  // Portaetiquetas metálicos en cada archivador
  const labelFrames = screen.getAllByTestId('binder-label-frame');
  expect(labelFrames.length).toBe(3);

  // Ojales metálicos de extracción (finger hole ring)
  const fingerRings = screen.getAllByTestId('binder-finger-ring');
  expect(fingerRings.length).toBe(3);

  // Botón del archivador activo
  const tomo1Btn = screen.getByRole('button', { name: /diario íntimo & terapia/i });
  expect(tomo1Btn).toHaveAttribute('aria-current', 'page');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/tests/NotesViewTomos.test.tsx`
Expected: FAIL esperando `binder-label-frame` y `binder-finger-ring`.

- [ ] **Step 3: Implement Binder Spines in `NotesView.module.css` and `NotesView.tsx`**

1. En `NotesView.module.css`:
   - Crear estilos `.binderCabinetRow`: estante de archivadores con línea base metálica.
   - `.binderSpineBtn`: cuerpo rígido de archivador con cantonera reforzada, textura sutil de cartón prensado y sombras de profundidad.
   - Variaciones por tomo: Tomo 01 (Archivador Burdeos/Ámbar Terapéutico), Tomo 02 (Archivador Mostaza Taller), Tomo 03 (Archivador Verde Bosque Conaset).
   - `.binderLabelFrame`: marco de metal plateado/bronce con tornillos decorativos en las 4 esquinas.
   - `.binderLabelPaper`: etiqueta crema con ribete de papel y nombre del tomo.
   - `.binderFingerRing`: orificio circular con borde metálico biselado (`box-shadow: inset 0 2px 4px rgba(0,0,0,0.5)`).
   - `.binderSpineActive`: archivador desplazado hacia adelante/abajo con resaltado de etiqueta.
   - Regla `:focus-visible` con `outline: 2px solid var(--color-primary)` (WCAG 2.4.7).
2. En `NotesView.tsx`:
   - Actualizar el bloque de botones de tomos para renderizar la estructura del archivador con `data-testid="binder-label-frame"` y `data-testid="binder-finger-ring"`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/tests/NotesViewTomos.test.tsx`
Expected: PASS en los 3 tests de `NotesViewTomos.test.tsx`.

- [ ] **Step 5: Commit**

```bash
git add src/components/NotesView.tsx src/components/NotesView.module.css src/tests/NotesViewTomos.test.tsx
git commit -m ":art: style(notes): redisenar tomos con estetica de archivadores fisicos con portaetiquetas y ojal metalico"
```

---

### Task 3: Mecanismo de Anillas Metálicas y Hojas Perforadas en el Pliego de `NotesView`

**Files:**
- Modify: `src/components/NotesView.tsx:400-450`
- Modify: `src/components/NotesView.module.css:210-310`
- Test: `src/tests/NotesViewActivePliego.test.tsx`

**Interfaces:**
- Consumes: `.folioContainer`, `.bujoSheet`
- Produces: Elementos de archivador de anillas abierto en el pliego:
  - `.binderMechanism`: lomo metálico izquierdo con anillas dobles de acero cromado
  - `.binderRing`: anilla de acero plateada con brillo curvo
  - `.binderPunchHoles`: orificios perforados circulares en el papel con refuerzo perimetral

- [ ] **Step 1: Write the failing test**

Agregar comprobación en `src/tests/NotesViewActivePliego.test.tsx`:
```tsx
it('el pliego superior abierto despliega el mecanismo de anillas metalicas del archivador y perforaciones de hoja', () => {
  render(<NotesView profileId={profileId} />);

  const mechanism = screen.getByTestId('binder-mechanism');
  expect(mechanism).toBeInTheDocument();
  expect(screen.getAllByTestId('binder-ring').length).toBeGreaterThanOrEqual(2);
  expect(screen.getAllByTestId('binder-punch-hole').length).toBeGreaterThanOrEqual(2);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/tests/NotesViewActivePliego.test.tsx`
Expected: FAIL esperando `binder-mechanism`.

- [ ] **Step 3: Implement Binder Rings & Punched Sheets in `NotesView.module.css` and `NotesView.tsx`**

1. En `NotesView.module.css`:
   - `.binderMechanism`: barra vertical izquierda fija que emula el lomo de acero de la palanca de anillas.
   - `.binderRing`: aros metálicos curvos de acero brillante que abrazan el borde de la página.
   - `.binderPunchHoles`: orificios circulares con sombra interna recortada sobre el margen del pliego.
   - Borde de cartón rígido protector exterior en `.folioContainer` simulando las tapas duras del archivador abierto.
2. En `NotesView.tsx`:
   - Renderizar el mecanismo de anillas y perforaciones dentro de `.folioContainer` con `aria-hidden="true"` para accesibilidad.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/tests/NotesViewActivePliego.test.tsx src/tests/NotesView.test.tsx`
Expected: PASS en ambos archivos.

- [ ] **Step 5: Commit**

```bash
git add src/components/NotesView.tsx src/components/NotesView.module.css src/tests/NotesViewActivePliego.test.tsx
git commit -m ":art: style(notes): incorporar mecanismo de anillas de acero y perforaciones de hoja al pliego archivador"
```

---

### Task 4: Suite Global de Verificación y Compilación de Producción

**Files:**
- Test: `src/tests/FoldersView.test.tsx`, `src/tests/NotesViewTomos.test.tsx`, `src/tests/NotesView.test.tsx`, `src/tests/NotesViewActivePliego.test.tsx`
- Build: `pnpm build`

- [ ] **Step 1: Run complete test suite**

Run: `pnpm exec vitest run`
Expected: Todos los 69 archivos de prueba en verde sin regresiones.

- [ ] **Step 2: Run production build check**

Run: `pnpm build`
Expected: `tsc -b && vite build` finaliza con código de salida 0.

- [ ] **Step 3: Commit**

```bash
git commit --allow-empty -m ":white_check_mark: test(archiver): verificacion integral de carpetas en folders y archivador en notes"
```
