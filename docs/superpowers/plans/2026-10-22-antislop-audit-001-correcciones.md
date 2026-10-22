# Correcciones de la auditoría antislop 001 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cerrar los 32 hallazgos de `anti-slop/audit-001-2026-10-22.md` para que la UI de Espiralia no afirme nada falso, no muestre datos inventados, cumpla AA y 44px, y funcione a 375px.

**Architecture:** Cambios en tres capas, en este orden: comportamiento y datos (Escape, almacenamiento, métricas reales), honestidad del contenido (claims, ejemplos, copy), y presentación (tokens, tipografía, movimiento, iconos, responsive). Cada regla que se corrige deja un test guardián que lee fuentes (`src/**/*.tsx`, `*.module.css`) y falla si el patrón vuelve a aparecer.

**Tech Stack:** React 19.2, TypeScript 5.8, Vite, CSS Modules, Vitest + Testing Library, Chrome DevTools para la verificación visual.

**Spec:** `anti-slop/audit-001-2026-10-22.md` (hallazgos 1 a 32, secciones "Verificación en navegador" y "Cambios aplicados").

## Decisiones que asumí (cámbialas antes de ejecutar)

| # | Decisión por defecto | Alternativa |
|---|---|---|
| D1 | Funciones anunciadas que no existen (simulador CONASET, exportar `.md`, imprenta A4/A5, plantillas PDF): se **quita la promesa**. | Construir la función. |
| D2 | Contenido personal de ejemplo (Clase B, PAES, terapia) se **quita de las vistas**; un perfil nuevo ve estados vacíos. `StorageService.seedInitialProfileData` no se llama desde la app (solo tests): no se toca. | Mantener un perfil demo opcional. |
| D3 | Versiones (v2.4, v2.6, v4.8) se **eliminan**. | Inyectar `package.json` con `define` de Vite. |
| D4 | Idioma único: **español**, salvo los aforismos de `DESIGN.md` §6. | Declarar el inglés como recurso estilístico en `DESIGN.md`. |
| D5 | Logo único: monograma **"Es"** (ya está en la barra lateral). | Conservar `☲`. Requiere tu confirmación (R-23). |
| D6 | Barra inferior móvil: 4 destinos + botón **"Más"** (Notas, Carpetas, Integraciones). | Barra con scroll horizontal. |
| D7 | Dials de `DESIGN.md`: **ENERGY 2 / RHYTHM 2 / MOTION 1**. | Otros valores. |
| D8 | Tokens de texto más oscuros: `--color-muted` pasa a `#64625C`; nuevos `--color-text-success #316F3F`, `--color-text-teal #2F6B60`, `--color-text-amber #8E5414`, `--color-text-primary-active #9E359B` (todos ≥4.6:1 sobre `#FCF9F6`, `#F6F2EC`, `#EFE9DE`, `#E8E0D2`, `#FFFFFF`, calculados con `contrast-check.py`). | Mantener tokens y usarlos solo como decoración. |

## Global Constraints

- Commits: Conventional Commits con Gitmoji, en español, tipo en inglés (`AGENTS.md` §11.1 y §11.2). **Sin** `Co-Authored-By` ni firma de agente (`AGENTS.md` §11.1).
- Pruebas solo en `src/tests/`. Comando completo: `pnpm exec vitest run`. Acotado: `pnpm exec vitest run src/tests/<archivo>`.
- Estado de partida: 71 archivos, 456 tests en verde (457 con el test de `--tap-min`). Cada tarea termina con la suite completa en verde y `pnpm exec tsc -b --noEmit` sin errores.
- Sin dependencias nuevas. Sin `—` (em dash) en texto de UI (R-02). Colores solo desde tokens de `src/index.css` (`DESIGN.md` §6).
- Objetivo táctil mínimo `--tap-min: 44px` (decisión del dueño, 2026-10-22).
- Rama: se continúa en `feature/stitch-visual-fidelity`; un commit por tarea. Integración a `develop` solo por PR (`AGENTS.md` §11.3 y §12). No hacer push ni PR sin pedirlo.
- **Datos de usuarios existentes** (restricción del dueño, 2026-10-22): hay personas usando la app. Ningún cambio renombra claves de `localStorage` ni cambia la forma o el valor de lo ya guardado (emoji de `daily_energy`, `color` de áreas, `folderId` y `tags` de notas, formato del respaldo). Lo guardado se sigue leyendo igual; solo cambia cómo se muestra. `src/tests/legacyDataCompat.test.tsx` fija el contrato y debe seguir en verde.
- Los textos de la UI no pueden afirmar cifrado en reposo, certificaciones, versiones ni métricas que la app no calcula.

## Review Focus

1. **Moods guardados**: un perfil existente con `daily_energy` guardado como emoji (`'✨'`, `'☀️'`) debe seguir mostrando su nivel tras cambiar emoji por icono y texto. Test en Task 11.
2. **`QuotaExceededError`**: con `localStorage.setItem` lanzando, ninguna escritura del servicio debe lanzar, y la UI debe avisar sin pantalla blanca. Test en Task 2.
3. **Semana ISO en bordes de año**: `isoWeekNumber(2026-12-31)` = 53, `(2027-01-01)` = 53, `(2024-12-30)` = 1, `(2026-10-22)` = 43. Test en Task 3.
4. **Perfil vacío**: cada vista debe renderizar sin datos de ejemplo, sin `NaN%` y sin "100%" con cero tareas. Tests en Task 3 y Task 6.
5. **Anclas con `HashRouter`**: un clic en "Ritmos" no debe cambiar la ruta ni redirigir; `#/inicio` sigue abriendo la landing. Test en Task 5.

---

### Task 0: Línea base y commit del trabajo de 44px

**Files:**
- Modify (ya hechos, sin commit): `src/index.css`, `src/components/{AgendaView,DashboardView,FoldersView,LandingView,NotesView,TodoView}.module.css`, `src/components/{notes/BujoCard,notes/NoteModal,todo/AreaIntegratedWorkspace,landing/LandingDeskPreview}.module.css`, `src/components/DashboardView.tsx`, `src/components/todo/AreaIntegratedWorkspace.tsx`, `src/tests/ui-a11y-touch.test.tsx`, `DESIGN.md`
- Add: `anti-slop/audit-001-2026-10-22.md`, este plan

- [ ] **Step 1: Verificar verde**: `pnpm exec vitest run` y `pnpm exec tsc -b --noEmit`. Esperado: sin fallos.
- [ ] **Step 2: Commit del código**: `git add src DESIGN.md` y `git commit -m ":art: style(config): subir objetivo tactil minimo a 44px con token --tap-min"`.
- [ ] **Step 3: Commit de docs**: `git add anti-slop docs/superpowers/plans` y `git commit -m ":memo: docs(superpowers): registrar auditoria antislop 001 y plan de correcciones"`. No agregar `.gitignore` ni `.projectmem/` (cambios previos ajenos).

### Task 1: Cierre con Escape en los tres diálogos (hallazgo 8)

**Files:**
- Create: `src/utils/useEscapeKey.ts`
- Modify: `src/components/DashboardView.tsx` (diálogo `focus-select-title`, ~línea 1218), `src/components/TodoView.tsx` (diálogo "Nueva área temática", ~839), `src/components/planner/GoalsDrawer.tsx` (diálogo `modal-goal-title`, ~140)
- Test: `src/tests/useEscapeKey.test.tsx`, ampliar `src/tests/GoalsDrawer.test.tsx`

**Interfaces:**
- Produces: `useEscapeKey(onClose: () => void, active = true): void`. Escucha `keydown` en `window`, llama `onClose` con `Escape`, usa el patrón de `onCloseRef` de `QuickActionModal.tsx:44-56` para no reenganchar el listener en cada render.

- [ ] **Step 1: Test que falla**: `useEscapeKey.test.tsx` con tres casos: `'llama onClose al pulsar Escape'`, `'no llama onClose con active=false'`, `'no llama onClose con otras teclas'`. En `GoalsDrawer.test.tsx`: `'se cierra con Escape'` (abre con "Nueva Meta", `userEvent.keyboard('{Escape}')`, espera que `role="dialog"` desaparezca).
- [ ] **Step 2: Ver fallar**: `pnpm exec vitest run src/tests/useEscapeKey.test.tsx src/tests/GoalsDrawer.test.tsx`. Esperado: FAIL, módulo inexistente.
- [ ] **Step 3: Implementar `useEscapeKey`** en `src/utils/useEscapeKey.ts` y llamarlo en los tres componentes con su `onClose` y su flag de apertura.
- [ ] **Step 4: Foco al abrir el diálogo de foco del Dashboard**: al abrir "Cambiar Foco", mover el foco al primer control dentro del diálogo (`ref` + `useEffect`). Test: `'el foco entra al diálogo al abrirse'` en un nuevo `src/tests/DashboardFocusModal.test.tsx`.
- [ ] **Step 5: Ver pasar** los tests acotados y la suite completa.
- [ ] **Step 6: Verificar en navegador**: abrir cada diálogo y pulsar Escape; esperado: `document.querySelector('[role=dialog]')` es `null`.
- [ ] **Step 7: Commit**: `:bug: fix(layout): cerrar con Escape los dialogos de foco, area y metas`.

### Task 2: Escrituras de almacenamiento sin pantalla blanca (hallazgo 11)

**Files:**
- Modify: `src/services/storage.ts` (todas las escrituras `localStorage.setItem`: `saveScopedItem`, `deleteScopedItem`, `ACTIVE_PROFILE_KEY`, seed de `getAreas`, `deleteArea`, `setTodayMood`, y el resto), `src/App.tsx`
- Test: `src/tests/storageQuota.test.ts`, ampliar `src/tests/App.test.tsx`

**Interfaces:**
- Produces en `storage.ts`: `writeItem(key: string, value: string): boolean` (try/catch de `setItem`; en fallo despacha `window.dispatchEvent(new CustomEvent(STORAGE_ERROR_EVENT, { detail: { key } }))` y devuelve `false`) y `export const STORAGE_ERROR_EVENT = 'espiralia:storage-error'`.
- Consumes: `sileo.error({ title })` (ya usado en `DashboardView.tsx:211`).

- [ ] **Step 1: Test que falla**: `storageQuota.test.ts`: con `vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('full', 'QuotaExceededError') })`, `'saveTodo no lanza y despacha espiralia:storage-error'` y `'getAreas no lanza al sembrar'`. En `App.test.tsx`: `'muestra un aviso al recibir espiralia:storage-error'`.
- [ ] **Step 2: Ver fallar**: `pnpm exec vitest run src/tests/storageQuota.test.ts`.
- [ ] **Step 3: Sustituir** cada `localStorage.setItem(...)` de `storage.ts` por `writeItem(...)`.
- [ ] **Step 4: Escuchar el evento en `App.tsx`** (`useEffect` con `addEventListener`) y mostrar `sileo.error({ title: 'No se pudo guardar: el almacenamiento del navegador está lleno. Exporta un respaldo desde Bóveda Offline.' })`.
- [ ] **Step 5: Ver pasar** y suite completa.
- [ ] **Step 6: Commit**: `:bug: fix(storage): capturar QuotaExceededError y avisar sin romper la interfaz`.

### Task 3: Fechas y métricas reales (hallazgos 3, 27 y 31)

**Files:**
- Modify: `src/utils/localDate.ts`, `src/components/dashboard/dashboardData.ts`, `src/services/storage.ts`, `src/components/DashboardView.tsx` (~185, 553-565 y la sección "Progreso por Áreas Temáticas"), `src/components/AgendaView.tsx` (187, 586, 654), `src/components/TodoView.tsx` (241, 791), `src/components/NotesView.tsx` (471, 656-679), `src/components/FoldersView.tsx` (571, 804-808), `src/components/IntegrationsView.tsx` (719)
- Create: `src/utils/formatBytes.ts`
- Test: `src/tests/localDate.test.ts`, `src/tests/dashboardData.test.ts` (línea 239 hoy afirma `100`: se invierte), `src/tests/storageUsage.test.ts`, `src/tests/emptyProfileMetrics.test.tsx`

**Interfaces:**
- Produces: `isoWeekNumber(date: Date): number` en `localDate.ts`; `TaskPerformanceResult.percentage: number | null` (`null` si `total === 0`); `StorageService.getProfileStorageBytes(profileId: string): number` (suma `(key.length + value.length) * 2` de las claves `espiralia_${profileId}_*`) y `LOCALSTORAGE_QUOTA_BYTES = 5 * 1024 * 1024`; `formatBytes(bytes: number): string` (`'0 KB'`, `'42 KB'`, `'1.4 MB'`).

- [ ] **Step 1: Tests que fallan**: `isoWeekNumber` con los cuatro valores del Review Focus 3; `computeTaskPerformance([])` devuelve `percentage: null`; `getProfileStorageBytes` es 0 para un perfil vacío y crece al guardar una tarea; `formatBytes(0)`, `formatBytes(43008)`, `formatBytes(1468006)`.
- [ ] **Step 2: Ver fallar**: `pnpm exec vitest run src/tests/localDate.test.ts src/tests/dashboardData.test.ts src/tests/storageUsage.test.ts`.
- [ ] **Step 3: Implementar** las cuatro piezas. Reemplazar `currentWeekNumber` de `DashboardView.tsx:185` por `isoWeekNumber(now)`.
- [ ] **Step 4: Sustituir cada valor fijo**:
  - "Semana 42" (Agenda, To-Do) por `Semana ${isoWeekNumber(today)}`; en To-Do quitar "Otoño 2026".
  - Dashboard "Rendimiento": mostrar `—` si `percentage === null`; reemplazar el mosaico "Ruido Digital 0%" por "Almacenamiento" con `formatBytes(getProfileStorageBytes(profileId))`.
  - Carpetas e Integraciones: `"{formatBytes(x)} de ~5 MB"` y la barra con `x / LOCALSTORAGE_QUOTA_BYTES`.
  - Agenda "80% Óptima" y barra 66%, Notas barras 78/85/40% y "42 min de escritura", To-Do "80% · Lúcida": **eliminar** el widget estático (el nivel de energía queda como lo define Task 11).
  - Carpetas "18 Mar 2025, 11:42": mostrar la fecha de modificación real de la carpeta si el modelo `Folder` la tiene; si no, quitar la columna.
  - Dashboard, áreas: si ninguna área tiene tareas, mostrar **una** tarjeta de estado vacío ("Aún no hay tareas por área. Crea la primera en To-Do.") en lugar de cuatro tarjetas idénticas.
- [ ] **Step 5: Test de vista vacía**: `emptyProfileMetrics.test.tsx` renderiza `DashboardView` con perfil sin datos y afirma que no aparece `100%` ni `NaN`.
- [ ] **Step 6: Ver pasar** y suite completa. Verificar en navegador con perfil nuevo: Agenda, To-Do y Dashboard muestran "Semana 43".
- [ ] **Step 7: Commit**: `:bug: fix(dashboard): calcular semana, rendimiento y almacenamiento con datos reales`.

### Task 4: Honestidad de afirmaciones (hallazgos 1, 2, 4 y promesas de 5)

**Files:**
- Modify: `src/components/AppLayout.tsx`, `LandingView.tsx`, `ProfileGateView.tsx`, `IntegrationsView.tsx`, `FoldersView.tsx`, `TodoView.tsx`, `NotesView.tsx`, `DashboardView.tsx`, `landing/LandingManifestoSection.tsx`, `landing/LandingFolderCards.tsx`, `landing/LandingHeroCard.tsx`
- Test: `src/tests/antislopHonestClaims.test.ts`

**Interfaces:**
- Produces: guardián que lee todos los `src/components/**/*.tsx` y afirma que **ninguno** contiene: `Certificad`, `Verificado`, `AES-256`, `IndexedDB`, `cifrado en reposo`, `almacenamiento cifrado`, `bóveda encriptada`, `Bóveda Cifrada`, `v2.4`, `v2.6`, `v4.8`, `Exporta a .MD`, `A4/A5`, `Plantillas Imprimibles`, `ferrogal`, `Biorritmo`, `0 bytes transmitidos`, `LOCAL ENCRIPTADO`; y que `src/components/landing/**` y `LandingView.tsx` no contienen `CONASET`. Allowlist: `PBKDF2` en `ProfileGateView.tsx` y `vault/*`.

- [ ] **Step 1: Escribir el guardián** (falla con ~25 coincidencias).
- [ ] **Step 2: Ver fallar**: `pnpm exec vitest run src/tests/antislopHonestClaims.test.ts`.
- [ ] **Step 3: Aplicar esta tabla de texto** (verdad verificada en `storage.ts:8`, `vaultCrypto.ts` y `pinHash.ts`):

| Antes | Después |
|---|---|
| Insignia lateral "AES-256" | quitar |
| "Local DB: Activa" | "Guardado en este navegador" |
| "Soberanía Digital Certificada" | "Tus datos se quedan en tu navegador" |
| "0% Telemetría • 100% Autónomo" | "Sin servidor ni telemetría" |
| "Bóveda Cifrada ... IndexedDB ..." | título "Datos locales"; "Se guardan en el localStorage de tu navegador. El PIN opcional bloquea el perfil. El respaldo exportable se cifra con tu contraseña (PBKDF2 y AES-GCM)." |
| "Interoperabilidad Total ... Markdown" | "Agenda exportable": "Exporta tu agenda a un archivo .ics, formato abierto (RFC 5545)." |
| Pie del certificado ("Garantía Fundacional", "Cifrado en cliente", sello "BÓVEDA SOBERANA / EXP. 2026") | quitar el bloque completo |
| Hero: "IndexedDB cifrado" | "Datos en tu navegador" |
| Hero: "Exporta a .MD & .ICS" | "Exporta la agenda a .ics" |
| Hero: "Listo para imprenta A4/A5" | quitar |
| Cierre: "bóveda digital cifrada en tu disco" | "tus datos en tu navegador" |
| Botón "Descargar Plantillas Imprimibles (PDF)" | quitar (junto a su `window.print()`) |
| Pilar 01: "banco ... CONASET, simuladores cronometrados y métricas de retención real" | "Tareas, bloques de estudio y enlaces a tus recursos de preparación." |
| Pilar 01 métrica "Banco oficial CONASET • Modo cronometrado" | "Tareas y bloques por área" |
| Integraciones: "Aislamiento Estricto Verificado", "0 bytes transmitidos...", "Protocolo local IndexedDB activo con cifrado en reposo..." | "Datos solo en este navegador"; sin etiqueta; "Los datos viven en el localStorage de este navegador. Los archivos .ics siguen el formato RFC 5545 y abren en Google Calendar y Apple Calendario." |
| Notas: "almacenamiento cifrado local", "Copia de respaldo automática en bóveda encriptada" | "Guardado en este navegador"; quitar la segunda |
| Login: "IndexedDB / WebCrypto PBKDF2", "LOCAL ENCRIPTADO", "✓ Cifrado PBKDF2 • 100.000 iteraciones" | "Datos en este navegador • PIN con hash PBKDF2"; "LOCAL"; "PIN protegido con hash PBKDF2 (100.000 iteraciones)" |
| Carpetas y To-Do "IndexedDB" | "localStorage" |
| `v2.4 Papelería`, `v2.6`, `v4.8 Local-First` | quitar (D3) |
| `LandingHeroCard.tsx`: "Tinta ferrogalorresistente", "Biorritmo Hoy", "Claridad mental 88%", "№ 042" | tarjeta rotulada "Ejemplo": título "Día de ejemplo", sin porcentaje ni número de folio |

- [ ] **Step 4: Ver pasar** el guardián y la suite completa (ajustar tests que afirmen los textos viejos, p. ej. `routesLanding.test.tsx`, `App.test.tsx`).
- [ ] **Step 5: Commit**: `:bug: fix(landing): quitar claims de cifrado, certificacion y versiones que la app no cumple`.

### Task 5: Landing: navegación, cabecera móvil, estructura (hallazgos 6, 12, 14, 19, 25, 32 y landing de 23)

**Files:**
- Modify: `src/components/LandingView.tsx` (enlaces `#...` en 42, 49-52, 103, 175-177; píldora 80-83; logo 41), `LandingView.module.css`, `landing/{LandingDeskPreview,LandingFolderCards,LandingRitmosSection,LandingIntentionWidget,LandingManifestoSection,LandingHeroCard}.tsx` y `.module.css`
- Test: `src/tests/landingNavigation.test.tsx`; ampliar `src/tests/routesLanding.test.tsx`

**Interfaces:**
- Produces: `scrollToSection(id: string): void` local en `LandingView.tsx` (`document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })`). Los enlaces pasan a `<button type="button">` con `onClick={() => scrollToSection('ritmos')}`, estilos heredados de `navLink`.

- [ ] **Step 1: Tests que fallan**: `landingNavigation.test.tsx`: `'clic en Ritmos llama scrollIntoView y no cambia el hash de la ruta'`, `'no hay elementos <a href="#...">'`. En `routesLanding.test.tsx`: `'/inicio sigue renderizando la landing'`.
- [ ] **Step 2: Ver fallar**.
- [ ] **Step 3: Implementar** `scrollToSection`, convertir los 9 enlaces (nav, hero secundario, footer); el logo (`href="#root"`) pasa a `window.scrollTo({ top: 0 })`.
- [ ] **Step 4: Estructura**:
  - Quitar la píldora con punto sobre el H1 y el `editionBadge`.
  - Quitar los cuatro `sectionBadge` previos a los H2 (Pilares, Ritmos, Intención, Manifiesto); el contexto va en el H2 o el subtítulo.
  - Variar composición (RHYTHM 2): Pilares con el primer pilar a ancho completo y los otros dos en dos columnas; Ritmos como lista vertical con la hora a la izquierda en escritorio; el widget de Intención conserva sus cuatro botones pero muestra los pasos como lista numerada, no como tres tarjetas iguales.
  - CTAs: barra superior "Crear mi cuaderno"; hero "Crear mi cuaderno" (primario) y "Ver la mesa de trabajo" (secundario, sin flecha); cierre "Crear mi cuaderno". Una sola flecha, en el CTA del cierre.
  - Logo: monograma "Es" (D5).
- [ ] **Step 5: Reveals por hover**: `innerSheet` de `LandingFolderCards` y el abanico de `LandingHeroCard` ganan equivalente `:focus-within` y `@media (hover: none)` (siempre visibles en táctil). El contenedor `tabIndex={0}` de `LandingHeroCard` recibe `role="group"`.
- [ ] **Step 6: Cabecera móvil**: a ≤768px la barra superior muestra logo, "Acceder" y un único CTA corto, sin salirse de 375px (`min-width: 0`, `flex-wrap: nowrap`, enlaces de sección ocultos). Verificar en navegador a 375px en `#/inicio`: `[...document.querySelectorAll('body *')].filter(e => e.getBoundingClientRect().right > innerWidth + 1).length` es `0`.
- [ ] **Step 7: Hoja "Mesa de trabajo" móvil**: `paperSheet` cabe en 375px (`width: 100%`, insignias con `flex-wrap`, sin `overflow: hidden` que recorte). Mismo comando.
- [ ] **Step 8: Ver pasar** y suite completa. Commit: `:art: style(landing): navegacion por scroll, cabecera movil y composicion variada`.

### Task 6: Sin contenido personal de ejemplo en las vistas (hallazgo 7)

**Files:**
- Modify: `src/components/NotesView.tsx` (`DEFAULT_THERAPEUTIC_CONTENT` línea 21, widget "Vaciado Rápido" ~690-705, "Tomo IV", "Sesión Semanal #14", "Cifrado Local"), `TodoView.tsx` (~766 cita y "ESPIRALIA MANILA NOTE #08"), `PlannerView.tsx` (139 `FOLIO TEC-2026`, 158 pill, 299 "Repaso intensivo Conaset B"), `IntegrationsView.tsx` (~556-570 evento fijo, mailto de 621 y 641, "agenda_2026.ics" y fechas fijas), `FoldersView.tsx` (carpetas de ejemplo si son fijas), `landing/LandingDeskPreview.tsx` (tareas de ejemplo)
- Test: ampliar `src/tests/emptyProfileMetrics.test.tsx`

- [ ] **Step 1: Test que falla**: renderizar `NotesView`, `TodoView`, `PlannerView`, `IntegrationsView`, `FoldersView` con un `profileId` sin datos y afirmar que ninguna contiene `/Conaset|Clase B|PAES|oftalmol|berenjena|terapia|TEC-2026|universidad\.edu|personal\.vault/i`.
- [ ] **Step 2: Ver fallar**.
- [ ] **Step 3: Aplicar**: nota por defecto = título "Nueva nota" con contenido vacío; "Vaciado Rápido", "Tomo IV", "Sesión Semanal #14", "FOLIO TEC-2026" y el widget de cita de To-Do se quitan; Integraciones: el evento de ejemplo se sustituye por el primer evento real de la agenda o por un estado vacío ("Aún no tienes eventos para exportar"); los `mailto:` usan un botón "Abrir borrador" sin destinatario fijo (`mailto:?subject=...`); en la landing, la hoja "Plan de foco" se rotula "Ejemplo" y no usa fecha.
- [ ] **Step 4: Ver pasar**; ajustar tests que afirmen el contenido viejo (`NoteModalEditorial.test.tsx`, `NotesViewActivePliego.test.tsx`).
- [ ] **Step 5: Commit**: `:fire: refactor(notas): quitar contenido personal de ejemplo de las vistas`.

### Task 7: Login sin teclado de PIN cuando no hay perfiles (hallazgo 28)

**Files:**
- Modify: `src/components/ProfileGateView.tsx` (panel del teclado ~280-340)
- Test: ampliar el test existente del teclado físico (`grep -l keypad src/tests`)

- [ ] **Step 1: Test que falla**: `'sin perfiles no muestra Introduce tu PIN Maestro'` y `'con un perfil protegido seleccionado sí lo muestra'`.
- [ ] **Step 2: Ver fallar**.
- [ ] **Step 3: Implementar**: renderizar el panel solo si `selectedProfileForPin !== null`; si no, un texto "Crea un perfil para empezar" bajo "Nuevo perfil". Quitar el listener global de teclas numéricas cuando no hay panel.
- [ ] **Step 4: Ver pasar** y suite completa. Commit: `:bug: fix(perfiles): ocultar el teclado de PIN cuando no hay perfil protegido`.

### Task 8: Foco visible en inputs (hallazgo 9)

**Files:**
- Modify: `AgendaView.module.css:571`, `FoldersView.module.css:1097`, `IntegrationsView.module.css:781`, `DashboardView.module.css:437,1696,2475`, `todo/AreaIntegratedWorkspace.module.css:116`, `notes/BujoCard.module.css:22`, `habits/HabitModal.module.css:185`
- Test: ampliar `src/tests/ui-a11y-focus.test.tsx`

- [ ] **Step 1: Test que falla**: recorrer todos los `*.module.css`; por cada regla con `outline: none`, exigir que la misma regla o su `:focus`/`:focus-visible` gemela declare `box-shadow: var(--focus-ring)` o `outline`. Esperado hoy: FAIL en las reglas listadas.
- [ ] **Step 2: Implementar**: en cada `:focus` con `outline: none` agregar `box-shadow: var(--focus-ring)`; en `BujoCard` agregar `.card:focus-visible { box-shadow: var(--focus-ring); }`.
- [ ] **Step 3: Ver pasar**; verificar con Tab en navegador que cada campo muestra anillo. Commit: `:art: style(config): anillo de foco visible en inputs y tarjetas`.

### Task 9: Contraste AA del texto (hallazgo 10)

**Files:**
- Modify: `src/index.css` (tokens), todos los `*.module.css` que usan `color: var(--color-muted-soft|accent-teal|success|accent-amber|primary-active)`, `DESIGN.md` §2
- Test: `src/tests/textTokensContrast.test.ts`

**Interfaces:**
- Produces tokens: `--color-muted: #64625C`, `--color-text-success: #316F3F`, `--color-text-teal: #2F6B60`, `--color-text-amber: #8E5414`, `--color-text-primary-active: #9E359B`. Los tokens decorativos originales no cambian.

- [ ] **Step 1: Test que falla**: parsear `index.css`, calcular el ratio WCAG de cada `--color-text-*` y de `--color-muted` contra `#FCF9F6`, `#F6F2EC`, `#EFE9DE`, `#E8E0D2`, `#FFFFFF`; exigir ≥4.5. Segundo caso: ningún `*.module.css` usa `color: var(--color-(muted-soft|accent-teal|success|accent-amber|primary-active))`.
- [ ] **Step 2: Ver fallar**.
- [ ] **Step 3: Implementar**: definir tokens, reemplazar en CSS (solo `color:`; bordes y fondos se quedan), actualizar `DESIGN.md` con la nueva tabla.
- [ ] **Step 4: Medir en navegador** (script de contraste del audit sobre `#/dashboard`): esperado, 0 textos bajo 4.5:1.
- [ ] **Step 5: Commit**: `:art: style(config): tokens de texto con contraste AA`.

### Task 10: Paleta solo con tokens y estilos en línea (hallazgos 16 y 26)

**Files:**
- Modify: `src/services/storage.ts` (`DEFAULT_AREAS` colores `#3b82f6` y `#10b981`), todos los `*.module.css` con `#6e0081`, `#324b3e`, `#10b981`, `#f59e0b`, `#b91c1c`, `#520061`, `#3b82f6`; `src/components/**/*.tsx` con `style={{ ... #hex }}` (`#6e0081` ×11, `#5db8a6` ×8, `#e8a55a` ×7, `#3b82f6` ×4)
- Test: `src/tests/paletteTokens.test.ts`

- [ ] **Step 1: Test que falla**: en `*.module.css` y `*.tsx` no puede aparecer ningún hex fuera del conjunto de valores definidos en `:root` de `index.css` (más `#FFFFFF` y `#000`), ni `var(--x, #hex)` con un fallback distinto del valor del token.
- [ ] **Step 2: Ver fallar**.
- [ ] **Step 3: Implementar**: `#6e0081` por `var(--color-primary)`; `#324b3e` por `var(--color-accent-sage)`; azul y verde de áreas por `#7B8C9E` (pizarra) y `#5A826D` (salvia) (solo afecta perfiles nuevos); `#f59e0b`/`#d97706` por `--color-accent-amber`; `#b91c1c` por `--color-error`; fallbacks alineados al token. Colores de estilo en línea pasan a clases CSS; los `style={{ width: '%' }}` dinámicos se quedan.
- [ ] **Step 4: Ver pasar**; revisar visualmente Dashboard, Planner y Carpetas. Commit: `:art: style(config): usar solo tokens de color y sacar hex de los estilos en linea`.

### Task 11: Iconos con significado, emoji fuera, niveles de energía (hallazgos 15, 29)

**Files:**
- Create: `src/utils/energyLevels.ts`
- Modify: `TodoView.tsx` (`Sparkles` ×3 y botones de energía ~793-805), `AgendaView.tsx` (`Sparkles` ×2, fases lunares 🌑🌘🌗), `NotesView.tsx` (×5), `DashboardView.tsx` (×2, y emoji de ánimo 🌿☕☁️🕯️), `landing/*`, `PlannerView.tsx`
- Test: `src/tests/energyLevels.test.ts`, `src/tests/antislopNoEmoji.test.ts`

**Interfaces:**
- Produces: `ENERGY_LEVELS: ReadonlyArray<{ value: string; label: string; icon: LucideIcon }>` con `value` igual al emoji guardado hoy (`'☁️'`, `'☕'`, `'🌱'`, `'✨'`, `'☀️'`) y `label` en texto (`'Baja'`, `'Suave'`, `'Media'`, `'Alta'`, `'Plena'`); `energyLabel(value: string | undefined): string` devuelve la etiqueta o `'Sin registrar'` para un valor desconocido.

- [ ] **Step 1: Tests que fallan**: `energyLabel('✨')` devuelve `'Alta'` (Review Focus 1); `energyLabel(undefined)` devuelve `'Sin registrar'`; `antislopNoEmoji.test.ts` recorre `src/components/**/*.tsx` y falla ante cualquier emoji (`\p{Extended_Pictographic}`) salvo `♡`.
- [ ] **Step 2: Ver fallar**.
- [ ] **Step 3: Implementar**: botones de energía y ánimo con icono lucide más texto visible o `aria-label` textual; el valor guardado no cambia. `Sparkles` se sustituye por el icono del significado (`Target` para foco, `Feather` para notas, `Calendar` para agenda, `Check` para logros) o se quita.
- [ ] **Step 4: Ver pasar** y suite completa. Commit: `:art: style(dashboard): iconos por significado y niveles de energia sin emoji`.

### Task 12: Movimiento, desenfoque y franjas decorativas (hallazgos 13, 20, 21)

**Files:**
- Modify: `AppLayout.module.css:206`, `DashboardView.module.css:1939` (pulsos), `NotesView.module.css:1024` (cursor), los 8 `backdrop-filter` de tarjetas en `DashboardView.module.css` (32, 46, 283, 648, 1076, 1233, 1965, 2292), `LandingView.module.css:22`; franjas `border-left` decorativas (`DashboardView.module.css:174,272`, `AgendaView.module.css:600`, `NotesView.module.css:1646`, `PlannerView.module.css:77`, `landing/LandingDeskPreview.module.css:345`, `vault/VaultModal.module.css:301`)
- Test: `src/tests/antislopMotion.test.ts`

- [ ] **Step 1: Test que falla**: (a) ningún `animation:` con `infinite` salvo `spin` de `RouteLoadingFallback`; (b) `backdrop-filter` solo en reglas cuyo selector contiene `overlay|backdrop|scrim|modal|topBar`; (c) `border-left` de ≥3px solo en `PlannerBlockCard.module.css` (categoría) y reglas con clase `*Active|*Priority|*Critical`.
- [ ] **Step 2: Implementar**: quitar pulsos (el punto "Guardado en este navegador" pasa a estático, sin glow `0 0 4px`); quitar `blur(2px)` de tarjetas; reemplazar las franjas decorativas por borde completo de `--color-hairline`, conservando las que marcan estado real.
- [ ] **Step 3: Ver pasar**; revisar visualmente. Commit: `:art: style(dashboard): quitar pulsos, desenfoque y franjas decorativas`.

### Task 13: Tamaños de texto mínimos de 11px (hallazgo 17)

**Files:**
- Modify: todos los `*.module.css` con `font-size` bajo 11px (`10px`, `9px`, `0.625rem`, `0.65rem`, `0.6rem`, `0.62rem`, `0.68rem`, `0.5625rem`, `0.55rem`, `0.5rem`)
- Test: `src/tests/antislopTypeScale.test.ts`

- [ ] **Step 1: Test que falla**: ningún `font-size` calculable por debajo de 11px (px o rem×16) en `*.module.css`.
- [ ] **Step 2: Implementar**: sustituir por `var(--text-caption)` (11px). Donde el texto pase a envolver mal, permitir `flex-wrap` o acortar la etiqueta.
- [ ] **Step 3: Revisar** a 1440 y 375px que no hay desbordes nuevos. Commit: `:art: style(config): piso de 11px en tipografia`.

### Task 14: Copy en español y sin marcas de texto generado (hallazgos 18, 30)

**Files:**
- Modify: `LandingView.tsx`, `landing/*.tsx`, `DashboardView.tsx`, `TodoView.tsx`, `AgendaView.tsx`, `PlannerView.tsx`, `NotesView.tsx`, `FoldersView.tsx`
- Test: `src/tests/antislopCopy.test.ts`

- [ ] **Step 1: Test que falla**: sin las cadenas `santuario`, `Clarify your mind`, `focus plan`, `End of day reflection`, `Mini Reminders`, `Eliminate distractions`, `Tasks that matter`, `Focus Schedule`, `TOP PRIORITIES`, `Brain Dump`, `nobleza de la papelería`, `Interoperabilidad Total`, `Cadencia Vital que Respeta`, y sin `—`.
- [ ] **Step 2: Reescribir** con lenguaje concreto: hero H1 "Organiza tu semana en un cuaderno que guarda todo en tu navegador"; subtítulo "Agenda, planner, tareas y notas por perfil, con PIN opcional. Sin cuenta, sin servidor."; Ritmos H2 "Tu día en tres momentos"; "focus plan." pasa a "Plan de enfoque."; "Focus Schedule de Hoy" a "Horario de hoy"; "TOP PRIORITIES no negociables" a "Prioridades de hoy"; "End of day reflection" a "Reflexión del día"; "Mini Reminders" a "Recordatorios"; "Eliminate distractions" a "Compromisos sin distracciones". Los aforismos en inglés que `DESIGN.md` §6 exige ("discipline today, peace tomorrow ♡", "Small steps every day lead to big results.") se **mantienen** y van a la allowlist del test.
- [ ] **Step 3: Ver pasar**; ajustar tests que afirmen textos viejos. Commit: `:memo: docs(landing): reescribir copy en espanol y sin frases de relleno`.

### Task 15: Responsive a 375px en las vistas internas (hallazgo 23 y barra inferior)

**Files:**
- Modify: `src/components/AppLayout.tsx` y `.module.css` (barra inferior), `PlannerView.module.css`, `NotesView.module.css`, `FoldersView.module.css`, `IntegrationsView.module.css`, `TodoView.module.css` (barra de filtros), `index.css`, `AppLayout.module.css`, `LandingView.module.css`, `ProfileGateView.module.css` (`100vh` a `100dvh`), módulos sin `@media` (`GoalCard`, `BujoCard`, modales)
- Test: ampliar `src/tests/antislopLayoutMobile.test.ts`

**Interfaces:**
- Produces: en `AppLayout.tsx`, botón "Más" (`aria-haspopup="menu"`, `aria-expanded`) en la barra inferior con un menú que lista Notas, Carpetas e Integraciones; cierra con Escape (`useEscapeKey` de Task 1) y al elegir.

- [ ] **Step 1: Test que falla**: `'la barra inferior móvil tiene 5 elementos: 4 destinos y Más'`; CSS: ningún `100vh` fuera de comentarios; todo `*.module.css` con `width|min-width` fijos ≥400px tiene un `@media (max-width: 768px)` en el mismo archivo.
- [ ] **Step 2: Implementar** el botón "Más" y los `dvh`.
- [ ] **Step 3: Vista por vista a 375px**, con este comando en DevTools por cada ruta (`inicio`, `dashboard`, `agenda`, `planner`, `todo`, `notes`, `folders`, `integrations`): `[...document.querySelectorAll('body *')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > innerWidth + 1 }).length`. Esperado: `0`. Causas medidas: `ficheroSection` (Carpetas, hasta x=692), `binderSpineBtn` (Notas, 540), `weekNavGroup` y `priorityGroup` (Planner, 614), `cardLeft` y `grommetRow` (Integraciones, 405), `filterBar` (To-Do, 585). Resolver con `flex-wrap: wrap`, `min-width: 0`, `max-width: 100%` y `overflow-x: auto` en contenedores de pestañas, no `overflow: hidden`.
- [ ] **Step 4: Comprobar 200% de zoom** a 1440px en Dashboard: sin texto recortado.
- [ ] **Step 5: Ver pasar** y suite completa. Commit: `:art: style(layout): reflujo a 375px y barra inferior con boton Mas`.

### Task 16: Dials, logo y documentación (hallazgos 24 y 32)

**Files:**
- Modify: `DESIGN.md` (línea `Dial: ENERGY 2 / RHYTHM 2 / MOTION 1`, sección "Logo" con el monograma "Es", tokens de Task 9), `src/components/ProfileGateView.tsx` y `AppLayout.tsx` si usan otro monograma

- [ ] **Step 1: Agregar** la línea de dials bajo `Theme:` y la sección "Logo". **Step 2: Commit**: `:memo: docs(config): declarar dials y logo en DESIGN.md`.

### Task 17: Verificación final y cierre de la auditoría (R-35 y Delivery Gate)

**Files:**
- Modify: `anti-slop/audit-001-2026-10-22.md` (estado por hallazgo)

- [ ] **Step 1: Suite y tipos**: `pnpm exec vitest run`, `pnpm exec tsc -b --noEmit` y `pnpm build`. Esperado: todo verde, sin errores.
- [ ] **Step 2: Recorrido de clics en navegador** (`pnpm dev`, Chrome DevTools, perfil nuevo, 1440 y 375px), registrando elemento por elemento: crear evento en Agenda y verificar que aparece; crear bloque y meta en Planner; crear, editar y buscar nota; crear carpeta y enlace; crear tarea, completarla y borrarla; exportar `.ics` y respaldo; bloquear y desbloquear perfil con PIN. Consola sin errores (`list_console_messages`).
- [ ] **Step 3: Barridos automáticos** sobre cada ruta: contraste real (0 textos bajo AA), objetivos táctiles (0 bajo 44x44), desborde a 375px (0), Escape en diálogos (cierra), anillo de foco visible con Tab.
- [ ] **Step 4: Marcar en el reporte** cada hallazgo como corregido con el commit que lo cerró, y anotar los que quedan por decisión (D1 a D8 si cambiaron).
- [ ] **Step 5: Reporte PASS/FAIL del Delivery Gate** de `antislop.md` (bloques 1 a 4, con evidencia por línea).
- [ ] **Step 6: Registrar en projectmem** (`add_decision` por D1 a D8 y `record_fix` por los hallazgos cerrados). Commit: `:memo: docs(superpowers): cerrar auditoria antislop 001 con evidencia`.

## Cobertura de hallazgos

| Hallazgos | Tarea |
|---|---|
| 1, 2, 4, 5 | 4 |
| 3, 27, 31 | 3 |
| 6, 12, 14, 19, 25 | 5 |
| 32 (logo), 24 | 5, 16 |
| 7 | 6 |
| 8 | 1 |
| 9 | 8 |
| 10 | 9 |
| 11 | 2 |
| 13, 20, 21 | 12 |
| 15, 29 | 11 |
| 16, 26 | 10 |
| 17 | 13 |
| 18, 30 | 14 |
| 22 | 0 (hecho) |
| 23 | 5, 15 |
| 28 | 7 |
