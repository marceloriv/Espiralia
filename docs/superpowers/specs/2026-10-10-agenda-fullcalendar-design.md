# Agenda con FullCalendar v7 — Diseño (F1)

**Fecha:** 2026-10-10
**Rama:** `feature/agenda-fullcalendar` (desde `develop` 52d66d1)
**Roadmap:** `docs/superpowers/plans/2026-10-10-stitch-redesign-roadmap.md`, fase F1
**Decisiones heredadas:** D1 sin tope de bundle (medir y reportar); D4 recurrencia nativa simple; D5 tema `forma` + paleta mapeada a tokens.

## 1. Objetivo

Reemplazar la grilla mensual hecha a mano de `AgendaView` por FullCalendar v7. El usuario tiene que poder:
- ver la agenda en vista mes, semana con franja horaria y día;
- crear, editar, mover y redimensionar eventos;
- repetir eventos semanalmente;
- filtrar por categoría.

Todo sigue aislado por perfil y sin perder los eventos ya guardados.

**Criterio de éxito:** una persona con eventos guardados con la versión actual abre la Agenda nueva y los ve en el día y la hora correctos. Puede hacer todas las operaciones con mouse, con teclado y con formulario, y al recargar los cambios siguen ahí.

## 2. Alcance

**Dentro:**
- vistas `dayGridMonth`, `timeGridWeek` y `timeGridDay`, en locale `es` y con la semana empezando en lunes;
- seleccionar un día o un rango y crear un evento en ese momento;
- editar un evento existente con el formulario (hoy no se puede editar);
- mover y redimensionar eventos únicos por arrastre;
- recurrencia semanal por días, con fecha de término opcional;
- filtro por categoría con contador: "Todas (n)" más las 4 categorías;
- panel lateral "Día seleccionado" con la lista de ese día y el formulario;
- corregir el cálculo de "hoy" en `AgendaView` y `DashboardView`;
- mostrar los eventos recurrentes de hoy en el Dashboard.

**Fuera (YAGNI o de otra fase):**
- layout de Stitch, que es F2;
- eventos que cruzan medianoche o duran varios días;
- excepciones en una serie recurrente (editar una sola ocurrencia): la edición aplica a toda la serie;
- recurrencia RFC 5545 (`rrule`);
- zonas horarias distintas de la local del dispositivo;
- importar o exportar `.ics`.

## 3. Modelo de datos: extensión aditiva sin migración

El roadmap anticipaba pasar a `start`/`end` con migración. Este spec lo reemplaza por una **extensión aditiva**. Los campos actuales ya expresan un evento de un solo día en hora local, y FullCalendar acepta strings locales (`'2026-10-14T09:00'`), así que no hace falta reescribir datos ni migrar.

```ts
export interface AgendaEvent {
  id: string;
  profileId: string;
  title: string;
  date: string;        // YYYY-MM-DD, hora local; en recurrentes = primera ocurrencia (startRecur)
  startTime?: string;  // HH:mm; ausente = evento de todo el día
  endTime?: string;    // HH:mm; ausente con startTime = duración por defecto de 1 h
  category?: EventCategory;
  notes?: string;
  recurrence?: {       // NUEVO, opcional
    daysOfWeek: number[]; // 0 = domingo … 6 = sábado; al menos 1
    until?: string;       // YYYY-MM-DD inclusive; ausente = sin término
  };
}
```

Reglas:
- Un registro sin `recurrence` se comporta exactamente como hoy. Los datos existentes son válidos sin tocarlos.
- Las fechas y horas se tratan siempre como **hora local de pared**. Prohibido `toISOString()` para derivar una fecha: es la causa del bug de "hoy".
- `endTime` debe ser mayor que `startTime` el mismo día. Si un arrastre o un redimensionado deja el fin en otro día, se rechaza (`info.revert()`) y se avisa con un toast.

## 4. Arquitectura

```
src/
├── utils/
│   └── localDate.ts           NUEVO: toLocalDateStr(Date) → 'YYYY-MM-DD' en hora local
├── components/
│   ├── AgendaView.tsx         reescrito: orquesta calendario, filtro, panel y formulario
│   ├── AgendaView.module.css  reescrito
│   └── agenda/
│       ├── eventMapping.ts    NUEVO: funciones puras AgendaEvent <-> FullCalendar
│       ├── eventForm.ts       NUEVO: validación pura del formulario
│       └── fullcalendar-palette.css  NUEVO: tokens --fc-forma-* -> index.css
└── components/DashboardView.tsx  usa toLocalDateStr y occursOn
```

Cada unidad, en una línea:
- **`toLocalDateStr(date: Date): string`:** formatea con `getFullYear()`, `getMonth()` y `getDate()`. Sin dependencias.
- **`eventMapping.ts`** (puro, sin React y sin FullCalendar en runtime, solo tipos):
  - `toCalendarEvent(ev: AgendaEvent): EventInput`. Un evento único sale como `{ id, title, start, end?, allDay, classNames }`. Uno recurrente sale como `{ id, title, daysOfWeek, startTime, endTime, startRecur: date, endRecur: until+1 día, classNames, editable: false }`. `endRecur` es exclusivo en FullCalendar, por eso el +1.
  - `applyTimeChange(ev, start: Date, end: Date | null, allDay: boolean): AgendaEvent | null`. Devuelve el evento actualizado, o `null` si el cambio cruza de día.
  - `occursOn(ev, dateStr): boolean`. Indica si el evento ocurre ese día, incluida la recurrencia; lo usan el panel del día y el Dashboard.
  - `countByCategory(events): Record<EventCategory | 'todas', number>`.
- **`eventForm.ts`:** `validateEventForm(input): { ok: true; event } | { ok: false; error: string }`. Valida:
  - título no vacío y de 120 caracteres o menos (AGENTS.md §10 A05);
  - horas en formato `HH:mm`;
  - fin mayor que inicio;
  - recurrencia con al menos un día;
  - `until` igual o posterior a `date`.
- **`AgendaView`:** mantiene el estado (vista, día seleccionado, filtro, evento en edición) y llama a `StorageService`. Configura FullCalendar con los plugins `forma`, `daygrid`, `timegrid` e `interaction`, con `locale: es`, `firstDay: 1`, `editable`, `selectable` y `nowIndicator`.

Las categorías se colorean con `classNames` hacia clases de CSS Modules que usan los tokens:

| Categoría | Token |
|---|---|
| `trabajo` | `--color-accent-teal` |
| `personal` | `--color-primary` |
| `urgente` | `--color-error` |
| `estudio` | `--color-accent-amber` |

El contraste del texto sobre cada color se verifica: 4.5:1 o más.

## 5. Flujo de datos

1. `AgendaView` carga `StorageService.getEvents(profileId)`, igual que hoy.
2. Aplica el filtro de categoría, mapea con `toCalendarEvent` y se lo pasa a FullCalendar como `events`.
3. Interacciones:
   - `dateClick` o `select` → actualiza el día seleccionado y precarga el formulario con fecha, inicio y fin.
   - `eventClick` → carga el evento en el formulario en modo edición.
   - `eventDrop` o `eventResize` → `applyTimeChange`. Si devuelve `null`, `info.revert()` y un toast de error. Si no, `saveEvent` y recargar.
   - Formulario → `validateEventForm`, después `saveEvent` (crear o editar) o `deleteEvent`.
4. Cada escritura pasa por `try/catch`. Si hay `QuotaExceededError` o cualquier otro error, aparece `sileo.error` con un mensaje comprensible, la vista no queda en blanco y el estado en pantalla se recarga desde el almacenamiento.

## 6. Accesibilidad (WCAG 2.2 AA)

- **2.5.7 Movimientos de arrastre:** todo lo que se hace arrastrando (mover o redimensionar) también se puede hacer en el formulario de edición, cambiando fecha, inicio y fin.
- **Teclado:** el panel lateral ofrece un `<input type="date">` "Ir a fecha" que selecciona el día y mueve el calendario. Los botones de la barra de FullCalendar (anterior, siguiente, hoy y vistas) llevan nombre accesible en español.
- **Filtros:** un grupo de botones con `aria-pressed`; el contador va dentro del nombre accesible ("Trabajo, 3 eventos").
- **Tamaño:** objetivos táctiles de 44 px o más en filtros, botones del panel y barra.
- **Anuncios:** crear, editar y borrar anuncian el resultado con los toasts de `sileo`, que ya tienen `aria-live`.
- **Responsive:** bajo 768 px la vista inicial pasa a `timeGridDay`, el panel queda debajo del calendario y no hay scroll horizontal de página desde 320 px.

## 7. Errores y casos borde

| Caso | Comportamiento |
|---|---|
| Evento viejo sin `endTime` | se muestra con 1 h de duración; al editarlo, el formulario propone inicio + 1 h |
| Evento viejo sin `startTime` | se muestra como de todo el día |
| Evento viejo sin `category` | se muestra con el color de `personal` y cuenta en "Todas" |
| Arrastre que cruza medianoche | se revierte y aparece el toast "Los eventos deben empezar y terminar el mismo día" |
| Arrastrar un evento recurrente | no se puede (`editable: false`); se edita desde el formulario |
| `until` anterior a `date` | el formulario lo rechaza |
| `localStorage` lleno | toast de error; los datos previos quedan intactos (`saveEvent` falla antes de `setItem`, así que no hay escritura parcial) |
| JSON corrupto en almacenamiento | `getEvents` ya devuelve `[]`, sin cambios |

## 8. Pruebas

Todas en `src/tests/`, con técnica declarada (§7 y ISO 29119-4):

- **`localDate.test.ts`** (valores límite): 23:59 y 00:00 locales dan el día correcto; fin de mes; año bisiesto.
- **`eventMapping.test.ts`:**
  - partición de equivalencia: evento único con hora, de todo el día, sin `endTime`, recurrente con y sin `until`;
  - tabla de decisión para `applyTimeChange`: mismo día, cruce de medianoche, cambio a todo el día;
  - valores límite para `occursOn`: primer día, `until` inclusive, el día siguiente a `until` y un día de la semana no incluido.
- **`eventForm.test.ts`** (partición y límites): título de 0, 1, 120 y 121 caracteres; fin igual a inicio; recurrencia sin días.
- **`AgendaView.test.tsx`** (integración, reescrito):
  - renderiza los eventos del perfil activo;
  - **dos perfiles poblados: no se mezclan**;
  - crear desde el formulario, editar y borrar, persistiendo;
  - el filtro con contador cambia lo visible;
  - un evento del esquema viejo aparece en su día;
  - `saveEvent` que lanza `QuotaExceededError` muestra un error y no deja la vista en blanco.
- **`DashboardView.test.tsx`:** se agrega un caso donde un evento recurrente que cae hoy aparece en "Eventos de hoy".

jsdom no simula arrastre, así que mover y redimensionar se cubren en `applyTimeChange` (lógica pura) más un test que invoca el handler con un `info` sintético. Cobertura de rama de 80% o más en `eventMapping.ts`, `eventForm.ts` y `localDate.ts`.

## 9. Dependencias y bundle

- `@fullcalendar/react@7.1.0` y `temporal-polyfill@1.0.5`, versiones exactas con más de 14 días publicadas. `pnpm audit` limpio. El usuario aprobó instalarlas en el spike el 2026-10-10; **aprobar este spec equivale a aprobar su instalación en `feature/agenda-fullcalendar`** (AGENTS.md §12).
- Medición del spike: el chunk lazy de la Agenda pasa de 3.6 a ~84.5 KB gzip y la carga inicial no cambia. Por D1, el número se reporta en el PR sin bloquear.

## 10. Criterios de aceptación

1. `pnpm exec vitest run`, `pnpm exec tsc -b`, `pnpm lint` y `pnpm build` en verde.
2. Todos los casos de §8 existen y pasan.
3. Auditoría de accesibilidad de Lighthouse (Chrome DevTools) sin errores en la vista Agenda. No se agrega `jest-axe` ni otra dependencia de test.
4. Verificación manual en `pnpm dev`:
   - las tres vistas;
   - arrastre y redimensionado;
   - edición por formulario;
   - un evento recurrente;
   - recarga sin pérdida de datos;
   - reflow a 320 px.
5. Commits en Conventional Commits + Gitmoji con alcance `agenda`, y merge `--no-ff` a `develop`.
