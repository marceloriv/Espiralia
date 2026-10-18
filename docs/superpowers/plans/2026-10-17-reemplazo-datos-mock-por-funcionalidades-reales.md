# Reemplazo Integral de Datos Mockup por Funcionalidades Reales en Espiralia Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sustituir todos los datos simulados y textos de relleno (*mockups* estáticos de CONASET, rutinas fijas y documentos ficticios) en `DashboardView`, `TodoView` y `FoldersView` por fuentes de datos y funcionalidades vivas conectadas a `StorageService`. Esto incluye: gestión y marcado de hábitos semanales con modal propio, fijación del foco diario enlazado a tareas reales con selector de cambio, compromisos antidistracciones editables, hitos reales por área temática, línea de tiempo diaria alimentada por Agenda/Planner, guardado de reflexiones nocturnas en el cuaderno de notas, persistencia del nivel de energía diario y tabla de fichas en carpetas vinculada a notas y enlaces reales.

**Architecture:**
- `src/services/storage.ts`: Añadir helpers para hábitos (`toggleHabitDay`), compromisos antidistracciones (`getDistractions`, `saveDistractions`), registro diario de energía (`getTodayMood`, `setTodayMood`) y seed inicial sensato para nuevos perfiles.
- `src/components/habits/HabitModal.tsx`: Nuevo modal papercraft para crear, editar y eliminar hábitos con selección de nombre, categoría e icono.
- `DashboardView.tsx`:
  - Hábitos: Renderiza hábitos reales desde `StorageService.getHabits()`, permite alternar días L-D con recalculo automático del % de cumplimiento, y botón «+ Hábito» para abrir `HabitModal`.
  - Foco Diario (`Today's Main Focus`): Asigna por defecto la tarea crítica más urgente con botón «Cambiar Foco» (selector de tareas pendientes) y checkbox que completa la tarea real en `StorageService`.
  - Top Priorities: Si `critical.length === 0`, muestra estado vacío limpio («Todo al día • Ninguna tarea crítica pendiente») con botón para añadir tarea.
  - Distracciones: Lista editable de compromisos personales con adición/eliminación persistida en el perfil.
  - Focus Schedule: Combina los eventos reales del día (`todayEvents`) con los bloques del planner agendados para hoy (`planner`), ordenados cronológicamente; estado vacío si el día está despejado.
  - Áreas Temáticas: Muestra las áreas reales, extrayendo los 2 hitos de las tareas reales más prioritarias de cada área y la fecha límite del `dueDate` más próximo.
  - Notes / Brain Dump: Despliega la nota/reflexión real más reciente con su fecha y botón «+ Nueva Anotación» que abre `NoteModal` in situ.
  - Reflexión Nocturna: «Guardar Pliego» crea una nota bujo real con las 3 respuestas bajo el tag `#reflexion-diaria` en `StorageService` con notificación toast.
- `TodoView.tsx`:
  - Agenda Asociada: Conecta la columna lateral a los próximos eventos reales de `StorageService.getEvents()`.
  - Energía: Persiste el nivel de energía del día en `StorageService` asociado a la fecha actual para mantenerlo al recargar o navegar.
- `FoldersView.tsx`:
  - Fichas & Manuscritos: Puebla la tabla con las notas y enlaces reales pertenecientes a la carpeta activa (`folderId`).
  - Acción «Ver Ficha»: Para notas abre el modal editorial in situ; para enlaces abre la URL en nueva pestaña. Estado vacío amigable si la carpeta está vacía.

**Tech Stack:** TypeScript 5.8, React 19.2, CSS Modules, Lucide React, Vitest 3.x, Testing Library React.

**Spec:** Entrevista técnica `/grill-me` del 2026-10-17, resolución de 7 ramas de diseño y catálogo de papelería física en `DESIGN.md`.

## Global Constraints

- Aislamiento estricto por `profileId` en `StorageService`: ningún dato puede filtrarse entre perfiles.
- Cumplimiento WCAG 2.2: todas las acciones interactivas (marcar días de hábitos, cambiar foco, guardar reflexión, abrir fichas) deben tener nombres accesibles (`aria-label`), áreas táctiles de al menos 44px y estados `:focus-visible`.
- Cero tokens CSS huérfanos sin fallback, según exige `src/tests/ui-a11y-tokens.test.tsx`.
- Preservar al 100% la estética editorial artesanal (*Warm Editorial Papercraft* de `DESIGN.md`).
- Commits en formato Conventional Commits con Gitmoji en español (`:sparkles: feat(...)`, `:recycle: refactor(...)`, `:white_check_mark: test(...)`).

## Review Focus

1. **Gestión y marcado de hábitos:** Añadir un hábito desde `HabitModal` debe reflejarse de inmediato en la tarjeta; pulsar un día (L a D) debe alternar su estado con `toggleHabitDay` y actualizar el porcentaje de cumplimiento real.
2. **Foco diario sincronizado con tareas:** Completar el checkbox de `Today's Main Focus` debe marcar la tarea real como completada en `StorageService`, y cambiar el foco desde el selector debe actualizar el banner de inmediato.
3. **Persistencia de la reflexión nocturna:** Al pulsar «Guardar Pliego» con las 3 respuestas, debe crearse una nota real en `StorageService.getNotes()`, visible luego en `NotesView` con tag `#reflexion-diaria` y feedback toast.
4. **Fichas dinámicas en FoldersView:** Cambiar de carpeta activa debe listar exclusivamente las notas y enlaces reales pertenecientes a ese `folderId`. Si no tiene elementos, debe mostrar el estado vacío con botones para agregar contenido.
5. **Eventos reales en Agenda Asociada de TodoView:** La lista de eventos en `TodoView` debe reflejar los eventos agendados reales de `StorageService.getEvents()`, sin rastros de simulaciones mock de prueba.

---

### Task 1: Métodos de almacenamiento para Hábitos, Distracciones y Mood Diario en `StorageService`

**Files:**
- Modify: `src/services/storage.ts:310-340, 415-434`
- Test: `src/tests/storage.test.ts`

**Interfaces:**
- Consumes: `HabitTrackerItem`, `MoodEntry` de `src/types`
- Produces:
  - `StorageService.toggleHabitDay(profileId: string, habitId: string, dayIndex: number): void`
  - `StorageService.getDistractions(profileId: string): string[]`
  - `StorageService.saveDistractions(profileId: string, items: string[]): void`
  - `StorageService.getTodayMood(profileId: string, dateStr: string): string | undefined`
  - `StorageService.setTodayMood(profileId: string, dateStr: string, energy: string): void`
  - Seeding predeterminado de hábitos y compromisos en `seedInitialProfileData` si están vacíos.

- [ ] **Step 1: Escribir tests en `src/tests/storage.test.ts`**

Agregar pruebas para `toggleHabitDay`, distracciones y mood diario:
```ts
it('permite alternar días de hábitos con toggleHabitDay', () => {
  const profileId = 'p-hab-1';
  StorageService.saveHabit({ id: 'h-1', profileId, name: 'Lectura', daysCompleted: [false, false, false, false, false, false, false] });
  StorageService.toggleHabitDay(profileId, 'h-1', 0);
  expect(StorageService.getHabits(profileId)[0].daysCompleted[0]).toBe(true);
});

it('permite obtener y guardar compromisos antidistracciones', () => {
  const profileId = 'p-dist-1';
  StorageService.saveDistractions(profileId, ['Teléfono en otra habitación', 'Cerrar pestañas']);
  expect(StorageService.getDistractions(profileId)).toEqual(['Teléfono en otra habitación', 'Cerrar pestañas']);
});

it('permite guardar y recuperar el nivel de energía del día', () => {
  const profileId = 'p-mood-1';
  StorageService.setTodayMood(profileId, '2026-10-17', '✨');
  expect(StorageService.getTodayMood(profileId, '2026-10-17')).toBe('✨');
});
```

- [ ] **Step 2: Ejecutar los tests para verificar que fallan**

Run: `pnpm exec vitest run src/tests/storage.test.ts`
Expected: FAIL indicando que los nuevos métodos no existen.

- [ ] **Step 3: Implementar los métodos en `src/services/storage.ts`**

Implementar `toggleHabitDay`, `getDistractions`, `saveDistractions`, `getTodayMood`, `setTodayMood` y actualizar `seedInitialProfileData`.

- [ ] **Step 4: Ejecutar los tests de almacenamiento**

Run: `pnpm exec vitest run src/tests/storage.test.ts`
Expected: PASS

- [ ] **Step 5: Commit del servicio de almacenamiento**

```bash
git add src/services/storage.ts src/tests/storage.test.ts
git commit -m ":sparkles: feat(storage): agregar metodos para habitos, distracciones y energia diaria"
```

---

### Task 2: Crear `HabitModal` y conectar la tarjeta de Hábitos en `DashboardView.tsx`

**Files:**
- Create: `src/components/habits/HabitModal.tsx`
- Create: `src/components/habits/HabitModal.module.css`
- Modify: `src/components/DashboardView.tsx:380-465`
- Test: `src/tests/HabitModal.test.tsx`
- Test: `src/tests/DashboardView.hero.test.tsx`

**Interfaces:**
- Consumes: `StorageService.getHabits()`, `StorageService.saveHabit()`, `StorageService.deleteHabit()`, `StorageService.toggleHabitDay()`
- Produces:
  - `HabitModal`: Diálogo accesible para crear o editar un hábito (nombre, categoría, icono) o eliminarlo.
  - Tarjeta de hábitos dinámica en Dashboard: lista los hábitos reales del perfil con botones accesibles para marcar días L–D, muestra el % de cumplimiento calculado dinámicamente y botón «+ Hábito».

- [ ] **Step 1: Escribir tests unitarios para `HabitModal`**

Crear `src/tests/HabitModal.test.tsx` probando apertura, creación de hábito y llamada a `onSave`.

- [ ] **Step 2: Ejecutar el test para comprobar que falla**

Run: `pnpm exec vitest run src/tests/HabitModal.test.tsx`
Expected: FAIL (módulo inexistente).

- [ ] **Step 3: Implementar `HabitModal.tsx` y `HabitModal.module.css`**

Crear el componente modal con diseño papercraft editorial, formulario con input de nombre y selección de categoría, botones de guardar/cancelar y foco accesible.

- [ ] **Step 4: Integrar `HabitModal` y renderizar hábitos reales en `DashboardView.tsx`**

Sustituir los 4 hábitos estáticos por `habits.map(...)` con botones accesibles para cada día de la semana y botón «+ Hábito».

- [ ] **Step 5: Ejecutar los tests de `HabitModal` y `DashboardView.hero.test.tsx`**

Run: `pnpm exec vitest run src/tests/HabitModal.test.tsx src/tests/DashboardView.hero.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit de hábitos dinámicos**

```bash
git add src/components/habits/ src/components/DashboardView.tsx src/tests/HabitModal.test.tsx src/tests/DashboardView.hero.test.tsx
git commit -m ":sparkles: feat(habits): crear HabitModal y conectar tarjeta de habitos en dashboard"
```

---

### Task 3: Conectar «Today's Main Focus» a tareas reales con selector de cambio y limpiar «Top Priorities»

**Files:**
- Modify: `src/components/DashboardView.tsx:470-588`
- Test: `src/tests/DashboardView.hero.test.tsx`

**Interfaces:**
- Consumes: `critical`, `todos`, `StorageService.toggleTodo()`
- Produces:
  - Foco Principal: muestra automáticamente la tarea crítica más urgente (`critical[0]`), con su área e indicador de prioridad. Marcar el checkbox completa la tarea real.
  - Botón «Cambiar Foco»: despliega un selector/modal de tareas pendientes para fijar manualmente otra tarea como foco del día (`mainFocusTodoId`).
  - Si no hay tareas críticas: muestra botón acogedor «+ Fijar foco del día».
  - Top Priorities: si `critical.length === 0`, muestra estado vacío limpio («Todo al día • Ninguna tarea crítica pendiente») con botón para crear tarea. Eliminar todas las filas mock fijas de CONASET/epistemología.

- [ ] **Step 1: Escribir el test para foco del día y estado vacío de prioridades**

En `src/tests/DashboardView.hero.test.tsx`:
Verificar que la tarea crítica real aparece como foco del día y que no se renderizan textos de epistemología cuando no hay tareas críticas.

- [ ] **Step 2: Ejecutar el test para verificar que falla**

Run: `pnpm exec vitest run src/tests/DashboardView.hero.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Modificar `src/components/DashboardView.tsx`**

Implementar la lógica de foco dinámico, selector de tarea y estado vacío limpio en Top Priorities.

- [ ] **Step 4: Ejecutar los tests de verificación**

Run: `pnpm exec vitest run src/tests/DashboardView.hero.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit de foco dinámico y prioridades limpias**

```bash
git add src/components/DashboardView.tsx src/tests/DashboardView.hero.test.tsx
git commit -m ":recycle: refactor(dashboard): conectar foco principal a tarea real y limpiar prioridades mock"
```

---

### Task 4: Lista editable de Antidistracciones y Timeline de eventos reales en `DashboardView.tsx`

**Files:**
- Modify: `src/components/DashboardView.tsx:590-735`
- Test: `src/tests/DashboardView.hero.test.tsx`

**Interfaces:**
- Consumes: `StorageService.getDistractions()`, `StorageService.saveDistractions()`, `todayEvents`, `planner`
- Produces:
  - Eliminate Distractions: Lista editable donde el usuario puede tachar o eliminar compromisos existentes, y agregar nuevos compromisos con un input inline accesible.
  - Focus Schedule de Hoy: Combina cronológicamente los eventos reales de la agenda (`todayEvents`) con los bloques del planner de hoy. Si no hay eventos ni bloques hoy, muestra estado vacío («Día despejado • Sin eventos agendados para hoy»). Eliminar los 7 slots estáticos.
  - Mini Reminders: Filtra las tareas reales de `todos` que tengan fecha de vencimiento (`dueDate`) próxima (hoy, mañana, esta semana).

- [ ] **Step 1: Escribir el test para compromisos y timeline real**

En `src/tests/DashboardView.hero.test.tsx`:
Verificar que los compromisos se cargan de `StorageService`, y que la línea de tiempo muestra eventos reales de agenda en lugar de los 7 slots mock.

- [ ] **Step 2: Ejecutar el test para verificar que falla**

Run: `pnpm exec vitest run src/tests/DashboardView.hero.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Actualizar `src/components/DashboardView.tsx`**

Implementar la lista interactiva de distracciones, el timeline real con eventos y planner de hoy, y los mini reminders basados en `dueDate`.

- [ ] **Step 4: Ejecutar los tests de verificación**

Run: `pnpm exec vitest run src/tests/DashboardView.hero.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit de distracciones y timeline vivo**

```bash
git add src/components/DashboardView.tsx src/tests/DashboardView.hero.test.tsx
git commit -m ":recycle: refactor(dashboard): incorporar distracciones editables y timeline de agenda real"
```

---

### Task 5: Hitos reales en Áreas Temáticas, Brain Dump real y Guardado de Reflexión Nocturna

**Files:**
- Modify: `src/components/DashboardView.tsx:770-1010`
- Test: `src/tests/DashboardView.hero.test.tsx`

**Interfaces:**
- Consumes: `areas`, `todos`, `notes`, `StorageService.saveNote()`, `sileo.success`
- Produces:
  - Áreas Temáticas: calcula los 2 hitos de las tareas reales de cada área (mostrando título y estado completada/pendiente), la fecha límite del `dueDate` más próximo, y botón «Ver Tareas de [Nombre de Área]». Elimina los textos estáticos de CONASET/terapia.
  - Notes / Brain Dump: muestra la nota o reflexión real más reciente del usuario con su fecha, y botón «+ Nueva Anotación» que abre `NoteModal` in situ.
  - Cierre de jornada: al pulsar «Guardar Pliego», crea una nota bujo real en `StorageService` con tag `#reflexion-diaria`, limpia los campos y notifica con toast `sileo.success`.

- [ ] **Step 1: Escribir el test para hitos reales, brain dump y guardado de reflexión**

En `src/tests/DashboardView.hero.test.tsx`:
Verificar que el pliego de reflexión se guarda como nota real y que las áreas muestran las tareas reales del área.

- [ ] **Step 2: Ejecutar el test para verificar que falla**

Run: `pnpm exec vitest run src/tests/DashboardView.hero.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Actualizar `src/components/DashboardView.tsx`**

Implementar el mapeo dinámico de hitos por área, lectura de nota reciente en Brain Dump, y manejador de guardado de reflexión con `StorageService.saveNote`.

- [ ] **Step 4: Ejecutar los tests de DashboardView**

Run: `pnpm exec vitest run src/tests/DashboardView.hero.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit de áreas reales y guardado de reflexión**

```bash
git add src/components/DashboardView.tsx src/tests/DashboardView.hero.test.tsx
git commit -m ":sparkles: feat(dashboard): conectar hitos de areas, brain dump y guardado de reflexion nocturna"
```

---

### Task 6: Conectar «Agenda Asociada» y persistencia de Energía en `TodoView.tsx`

**Files:**
- Modify: `src/components/TodoView.tsx:715-845`
- Test: `src/tests/TodoView.test.tsx`

**Interfaces:**
- Consumes: `StorageService.getEvents()`, `StorageService.getTodayMood()`, `StorageService.setTodayMood()`
- Produces:
  - Agenda Asociada: lista los próximos 3 eventos reales agendados desde `StorageService.getEvents(profileId)`. Si no hay eventos, muestra aviso amable con enlace a la agenda. Elimina eventos hardcodeados de CONASET.
  - Selector de Energía: al hacer clic en un nivel (`☁️`, `☕`, `🌱`, `✨`, `☀️`), lo persiste mediante `StorageService.setTodayMood()` y lo restaura al montar con la fecha actual.

- [ ] **Step 1: Escribir tests en `src/tests/TodoView.test.tsx`**

Verificar que la Agenda Asociada muestra eventos reales y que el nivel de energía se persiste en `StorageService`.

- [ ] **Step 2: Ejecutar el test para verificar que falla**

Run: `pnpm exec vitest run src/tests/TodoView.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Modificar `src/components/TodoView.tsx`**

Integrar la carga de eventos reales y la persistencia de energía.

- [ ] **Step 4: Ejecutar los tests de TodoView**

Run: `pnpm exec vitest run src/tests/TodoView.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit de eventos y energía en TodoView**

```bash
git add src/components/TodoView.tsx src/tests/TodoView.test.tsx
git commit -m ":recycle: refactor(todo): conectar agenda asociada a eventos reales y persistir energia diaria"
```

---

### Task 7: Tabla de «Fichas & Manuscritos» en `FoldersView.tsx` con Notas y Enlaces reales

**Files:**
- Modify: `src/components/FoldersView.tsx:470-565`
- Test: `src/tests/FoldersView.test.tsx`

**Interfaces:**
- Consumes: `notes.filter(n => n.folderId === activeFolder.id)`, `links.filter(l => l.folderId === activeFolder.id)`
- Produces:
  - Tabla de Fichas: lista dinámicamente las notas y enlaces asignados a la carpeta activa.
  - Acción «Ver Ficha»:
    - Para Notas: abre el modal editorial `NoteModal` in situ para leer o editar.
    - Para Enlaces: abre el vínculo web en una nueva pestaña (`window.open(url, '_blank')`).
  - Estado vacío: si la carpeta no tiene elementos, muestra aviso amable con botones «+ Nueva Nota» y «+ Nuevo Enlace». Elimina filas estáticas `DOC-01.1`.

- [ ] **Step 1: Escribir tests en `src/tests/FoldersView.test.tsx`**

Verificar que la tabla de fichas lista las notas y enlaces de la carpeta activa y no contiene filas estáticas de PDF mock.

- [ ] **Step 2: Ejecutar el test para verificar que falla**

Run: `pnpm exec vitest run src/tests/FoldersView.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Modificar `src/components/FoldersView.tsx`**

Reemplazar las filas fijas por el mapeo dinámico de notas y enlaces con sus acciones correspondientes.

- [ ] **Step 4: Ejecutar los tests de FoldersView**

Run: `pnpm exec vitest run src/tests/FoldersView.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit de la tabla de fichas viva**

```bash
git add src/components/FoldersView.tsx src/tests/FoldersView.test.tsx
git commit -m ":recycle: refactor(folders): poblar tabla de fichas con notas y enlaces reales de la carpeta"
```

---

### Task 8: Verificación completa de suite de pruebas, accesibilidad y build de producción

**Files:**
- Test: Suite completa en `src/tests/`

**Interfaces:**
- Consumes: Todo el proyecto
- Produces: 100% de tests en verde (398+ tests) y build de producción limpio

- [ ] **Step 1: Ejecutar la suite completa de pruebas unitarias y de integración**

Run: `pnpm exec vitest run`
Expected: PASS (todos los archivos de prueba en verde)

- [ ] **Step 2: Ejecutar verificación de tokens y accesibilidad**

Run: `pnpm exec vitest run src/tests/ui-a11y-tokens.test.tsx`
Expected: PASS

- [ ] **Step 3: Ejecutar compilación de producción TypeScript + Vite**

Run: `pnpm build`
Expected: PASS (código de salida 0, sin errores)

- [ ] **Step 4: Commit final del plan completado**

```bash
git add .
git commit -m ":white_check_mark: test(calidad): verificar suite completa sin datos mock y build limpio"
```
