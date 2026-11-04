# Correcciones de la auditoría 002 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cerrar los 16 hallazgos de `anti-slop/audit-002-2026-11-03.md`, los issues de projectmem #0012 a #0022 y los huecos CRUD del informe del 2026-11-03.

**Architecture:** Primero lo que bloquea o pierde datos (test con fecha, respaldo), después el modelo (semana ISO en bloques y hábitos, tomo de nota, división de series), después el CRUD en las vistas y al final identidad, textos y documentación. Cada bug deja un test que falla antes del arreglo.

**Tech Stack:** React 19, TypeScript 6, Vite 8, CSS Modules, Vitest 5 + Testing Library. Sin dependencias nuevas.

**Spec:** `anti-slop/audit-002-2026-11-03.md` (local, ignorado por git) y los issues #0012 a #0022 de `.projectmem/`.

## Global Constraints

- Textos de la UI en español, sin raya (R-02), sin datos ni afirmaciones inventadas (R-17, R-36, R-38).
- Colores solo con tokens de `src/index.css`; diálogos nuevos con los primitivos de `src/components/common/Dialogo.module.css`.
- No cambiar el formato de las claves guardadas: solo se agregan dominios (`daily_focus`) y campos opcionales (`weekKey`, `tomo`, `disposition`).
- Tests solo en `src/tests/`. Commits Conventional + Gitmoji en español, sin firmas de agente.
- Presupuesto de la carga inicial: 184 KB gzip (`ci.yml`).

## Decisiones tomadas por defecto

| # | Decisión | Alternativa descartada |
|---|---|---|
| D1 | Bloques del Planner con semana ISO (`weekKey`, `2026-W45`). Los guardados sin semana pasan a la semana en curso la primera vez que se leen. "Limpiar semana" borra solo la semana visible. | Quitar la navegación entre semanas. |
| D2 | Hábitos con `weekKey`: una semana nueva empieza sin marcas. Un hábito sin `weekKey` cuenta como de la semana en curso. Fuera de la semana en curso los círculos se muestran y no se pueden marcar. | Historial por semana. |
| D3 | Ánimo del día (Plena, En calma, Neutra, Cansada) en `moods` con el campo nuevo `disposition`; lo comparten Dashboard y Agenda. La energía de Agenda usa `daily_energy`, como To-Do, Planner y Notas. | Quitar los selectores. |
| D4 | Foco fijado del Dashboard en el dominio nuevo `daily_focus` (fecha: id de tarea). | Guardarlo en el perfil. |
| D5 | Fase lunar calculada con el mes sinódico medio desde la luna nueva del 2000-01-06 18:14 UTC (error de un día como máximo). Se quita "Estable". | Quitar la tarjeta. |
| D6 | Se quitan las píldoras de área del Planner: los bloques no tienen área. | Agregar área a los bloques. |
| D7 | "Quitar este día" divide la serie en dos (antes y después del día). "Cambiar solo este día" en el formulario hace lo mismo y guarda un evento suelto. | Lista de excepciones (FullCalendar no las dibuja sin otro plugin). |
| D8 | Confirmación al borrar tareas, bloques, metas, hábitos y compromisos, como ya ocurre con notas y carpetas. | Deshacer en el aviso. |
| D9 | No se puede borrar la última área. Al borrar un área, sus tareas pasan a General o a la primera; notas y vínculos quedan sin área. | Permitir cero áreas. |
| D10 | Respaldo versión 1 con campos opcionales nuevos (`habits`, `distractions`, `dailyEnergy`, `moods`, `dailyFocus`); un respaldo antiguo restaura igual. | Versión 2. |
| D11 | El logotipo pierde su variante oscura del SVG (la app es clara en esta rama) y pasa a la barra de la landing. | SVG en línea atado a `data-theme`. |
| D12 | El lema del Dashboard se rotula "lema" y conserva el texto: la repetición en cuatro vistas es decisión de `DESIGN.md` §0.9. | Rotar aforismos. |
| D13 | `manifest.webmanifest` con el monograma SVG y metadatos `og:` sin imagen. `apple-touch-icon` y `og:image` esperan un PNG de la persona dueña (R-23). | Generar imágenes nuevas. |
| D14 | La monoespaciada en mayúsculas queda documentada como rótulo de ficha en `DESIGN.md` §0.6; se quitan los rótulos ficticios. | Reescribir todos los rótulos. |
| D15 | La retícula del hero queda documentada y con color de token. | Quitarla. |
| D16 | Sin energía preseleccionada: "Sin registrar" hasta que la persona elija. | Mantener "Alta". |

## Review Focus

- Datos guardados antes del cambio (bloques y hábitos sin `weekKey`, notas con `folderId: 'tomo-02'`): deben verse igual que antes en la semana en curso y en su tomo.
- Respaldo antiguo sin los campos nuevos: restaura sin error y no borra hábitos existentes en modo sobrescritura.
- Quitar el primer o el último día de una serie: no deja una serie vacía ni una con fin anterior al inicio.
- `.ics` con horas en UTC (`Z`) o con `TZID`: la hora local resultante es la que muestra Google Calendar.
- Borrar la única área: el botón no lo permite y lo explica.

---

### Task 1: Test de Agenda sin fecha fija (#0012)
**Files:** `src/tests/AgendaView.test.tsx:24-27`
- [ ] Fijar el reloj (`vi.useFakeTimers({ toFake: ['Date'] })`, `vi.setSystemTime(new Date(2026, 9, 15))`) solo en ese test.
- [ ] `pnpm exec vitest run src/tests/AgendaView.test.tsx` en verde. Commit `:white_check_mark: test(agenda): fijar la fecha del test del almanaque`.

### Task 2: Lint local
**Files:** `eslint.config.js:9`
- [ ] `globalIgnores(['dist', 'coverage', '.agents', '.worktrees'])`. `pnpm lint` sale con 0. Commit `:wrench: chore(config): excluir carpetas de herramientas del lint`.

### Task 3: Respaldo completo (#0014)
**Files:** `src/services/vaultCrypto.ts`, `src/services/vaultService.ts`, `src/services/storage.ts`, test `src/tests/vaultService.test.ts`
**Produces:** `StorageService.getDomain<T>(profileId, domain, fallback)`, `StorageService.replaceDomain(profileId, domain, value)`.
- [ ] Test `restaura hábitos, compromisos, energía, ánimo y foco en un perfil nuevo` y `un respaldo sin los campos nuevos conserva los hábitos al sobrescribir`. Verlos fallar.
- [ ] Exportar y restaurar los campos de D10; en sobrescritura reemplazar cada colección presente (áreas incluidas). Verde. Commit `:bug: fix(storage): respaldo con hábitos, compromisos y registros diarios`.

### Task 4: Vistas que no se refrescan y títulos de pestaña (#0019)
**Files:** `src/components/AppLayout.tsx`, `src/components/ProfileGateView.tsx`, test `src/tests/AppLayout.test.tsx`
- [ ] Test: tras crear una tarea con Acción Rápida el hijo vuelve a leer el almacenamiento; `document.title` es `To-Do · Espiralia`.
- [ ] Contador de versión que remonta el contenido de `<main>`; título por vista y "Acceso · Espiralia". Commit `:bug: fix(layout): refrescar la vista tras crear y titular cada pestaña`.

### Task 5: Agenda (#0013, #0020; hallazgos 1, 4, 6, 10)
**Files:** `src/components/AgendaView.tsx`, `src/services/storage.ts`, test `src/tests/AgendaView.test.tsx`
**Produces:** `StorageService.getTodayDisposition(profileId, date): Disposition | undefined`, `setTodayDisposition(profileId, date, value)`; tipo `Disposition = 'plena' | 'calma' | 'neutra' | 'cansada'` en `src/types`.
- [ ] Tests: "Exportar .ics" descarga un `.ics` con los eventos visibles; leyenda con las cinco categorías; la energía y el ánimo elegidos siguen al volver a montar la vista; botones de ánimo con `aria-pressed`.
- [ ] Commit `:bug: fix(agenda): exportar .ics real y guardar energía y ánimo`.

### Task 6: Dashboard (#0020; hallazgos 3, 4)
**Files:** `src/utils/moonPhase.ts` (nuevo), `src/components/DashboardView.tsx`, tests `src/tests/moonPhase.test.ts`, `src/tests/DashboardView.test.tsx`
**Produces:** `moonPhase(date: Date): { index: 0..7; name: string; icon: 'nueva' | 'creciente' | 'gibosa' | 'llena' | 'menguante' }`.
- [ ] Tests: 2026-11-09 nueva, 2026-10-26 llena, 2026-11-03 cuarto menguante; el ánimo y el foco fijado sobreviven a un remontaje; ya no aparece "Estable".
- [ ] Commit `:bug: fix(dashboard): fase lunar calculada y ánimo y foco guardados`.

### Task 7: Tareas y áreas
**Files:** `src/components/TodoView.tsx`, `src/components/todo/TodoEditModal.tsx` (nuevo), `src/services/storage.ts:188`, test `src/tests/TodoView.test.tsx`
- [ ] Tests: editar título, prioridad y área; renombrar un área; borrar un área mueve sus tareas a General; la última área no se borra; borrar una tarea pide confirmación.
- [ ] Commit `:sparkles: feat(tareas): editar tareas y gestionar áreas`.

### Task 8: Planner con semanas, hábitos por semana y edición (#0015, #0016; hallazgo 5)
**Files:** `src/utils/localDate.ts`, `src/types/index.ts`, `src/services/storage.ts`, `src/components/PlannerView.tsx`, `planner/PlannerBlockModal.tsx`, `planner/PlannerBlockCard.tsx`, `planner/PlannerDayColumn.tsx`, `planner/GoalsDrawer.tsx`, `planner/GoalCard.tsx`, `habits/HabitModal.tsx`, `DashboardView.tsx`, tests `localDate.test.ts`, `plannerStorage.test.ts`, `PlannerView.test.tsx`, `GoalsDrawer.test.tsx`
**Produces:** `isoWeekKey(date: Date): string`; `StorageService.getHabits(profileId, weekKey?)`, `toggleHabitDay(profileId, habitId, dayIndex, weekKey?)`, `clearWeeklyPlanner(profileId, weekKey)`.
- [ ] Tests: un bloque del 2-nov no aparece en la semana del 9-nov; un hábito marcado la semana pasada llega vacío; editar un bloque; editar una meta y su período; borrar bloque, meta y hábito pide confirmación; sin píldoras de área.
- [ ] Commits `:bug: fix(planner): bloques y hábitos con semana ISO` y `:sparkles: feat(planner): editar bloques y metas`.

### Task 9: Renombrar perfil
**Files:** `src/services/profileOperations.ts`, `src/components/profile/ProfileSettingsModal.tsx`, tests `profileOperations.test.ts`, `ProfileSettingsModal.test.tsx`
**Produces:** `renameProfile(profile: Profile, name: string): UpdateProfilePinResult`.
- [ ] Commit `:sparkles: feat(perfiles): renombrar perfil`.

### Task 10: .ics fiel (#0017, #0018)
**Files:** `src/services/icsService.ts`, `src/components/IntegrationsView.tsx`, tests `icsService.test.ts`, `IntegrationsView.test.tsx`
- [ ] Tests: `RRULE` al exportar una serie; reimportar el mismo `UID` no duplica; `RRULE:FREQ=WEEKLY;BYDAY=` se importa como serie; `Z` pasa a hora local; el filtro usa categorías de evento.
- [ ] Commit `:bug: fix(storage): ics con UID, RRULE y horas UTC`.

### Task 11: Un solo día de una serie
**Files:** `src/components/agenda/eventMapping.ts`, `src/components/AgendaView.tsx`, `agenda/EventFormPanel.tsx`, tests `eventMapping.test.ts`, `AgendaView.test.tsx`
**Produces:** `removeOccurrence(ev: AgendaEvent, date: string, newId: () => string): AgendaEvent[]`.
- [ ] Tests: quitar un día intermedio deja dos series; quitar el primer o el último día no deja series vacías.
- [ ] Commit `:sparkles: feat(agenda): quitar o cambiar un solo día de una serie`.

### Task 12: Notas y carpetas (#0022)
**Files:** `src/types/index.ts`, `src/components/NotesView.tsx`, `src/components/FoldersView.tsx`, `src/services/storage.ts:315`, tests `NotesViewTomos.test.tsx`, `FoldersView.test.tsx`, `notesStorage.test.ts`
- [ ] Tests: una nota de Notas guarda `tomo` y no `folderId`; una nota antigua con `folderId: 'tomo-02'` sigue en el tomo 02; borrar una carpeta deja sus notas y vínculos sin carpeta; una nota se borra desde Carpetas; el respaldo de Carpetas es el respaldo completo.
- [ ] Commit `:bug: fix(storage): tomos separados de carpetas y borrado de notas en Carpetas`.

### Task 13: Acción Rápida valida eventos
**Files:** `src/components/quickAction/QuickActionModal.tsx`, test `QuickActionModal.test.tsx`
- [ ] Test: hora de término anterior al inicio muestra el error y no guarda. Commit `:bug: fix(layout): validar el evento de Acción Rápida`.

### Task 14: Identidad y textos (hallazgos 2, 7 a 16)
**Files:** `public/02-logotipo-Espiralia.svg`, `index.html`, `public/manifest.webmanifest` (nuevo), landing (`LandingView`, `LandingDeskPreview`, `LandingFolderCards`, `LandingHeroCard`, `LandingManifestoSection` y sus CSS), `NotesView.tsx`, `DashboardView.tsx`, `AppLayout.tsx`, `IntegrationsView.tsx`, `ProfileGateView.tsx`, test `antislopHonestClaims.test.ts`
- [ ] Ampliar `antislopHonestClaims.test.ts` con los textos del hallazgo 8 y verlo fallar; reescribir; verde.
- [ ] Commits por grupo: `:art: style(layout)`, `:art: style(config)` y `:fire: chore(config): quitar favicon, icons y OrigamiNautilus sin uso`.

### Task 15: Energía sin preselección (D16)
**Files:** `src/components/TodoView.tsx`, `PlannerView.tsx`, `NotesView.tsx`, `src/utils/energyLevels.ts`, test `energyLevels.test.ts`
- [ ] Commit `:bug: fix(tareas): no mostrar energía registrada sin elegirla`.

### Task 16: Documentación y cierre
**Files:** `DESIGN.md` (§0.6, §0.12), `docs/ERS.md` (RF-3, RF-Transversal-2, requisitos futuros), `anti-slop/audit-002-2026-11-03.md` (cambios aplicados y Delivery Gate)
- [ ] `pnpm exec vitest run`, `pnpm lint`, `pnpm build` y recorrido en navegador. Commit `:memo: docs(config): diseño y ERS al día con la auditoría 002`.
