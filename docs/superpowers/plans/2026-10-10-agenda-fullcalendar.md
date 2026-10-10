# Agenda con FullCalendar v7 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar la grilla manual de `AgendaView` por FullCalendar v7 (vistas mes, semana y día; crear, editar, mover y redimensionar; recurrencia semanal; filtro por categoría) y corregir el cálculo de "hoy" basado en UTC.

**Architecture:** La lógica vive en módulos puros y testeables (`utils/localDate.ts`, `components/agenda/eventForm.ts`, `components/agenda/eventMapping.ts`) y en un módulo de persistencia con manejo de errores (`components/agenda/eventPersistence.ts`). `AgendaView` solo orquesta: estado, FullCalendar, panel y formulario. El modelo `AgendaEvent` se extiende de forma aditiva (`recurrence?`), así que no hay migración de datos.

**Tech Stack:** React 19.2, TypeScript, Vite, CSS Modules, `@fullcalendar/react@7.1.0` (tema `forma`), `temporal-polyfill@1.0.5`, `sileo` (toasts), `lucide-react`, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-10-agenda-fullcalendar-design.md` (aprobado 2026-10-10, incluida la instalación de dependencias).

## Global Constraints

- Rama `feature/agenda-fullcalendar`, nacida de `develop`. Al terminar vuelve a `develop` con `--no-ff`; nada va a `main` (AGENTS.md §11.3, decisión del usuario).
- Dependencias exactas: `@fullcalendar/react@7.1.0` y `temporal-polyfill@1.0.5`. Ninguna otra: no se agregan `jest-axe`, `@vitest/coverage-v8` ni `rrule`.
- Fechas y horas siempre en **hora local de pared**. Prohibido `toISOString()` para derivar una fecha.
- Estilos solo con CSS Modules y tokens de `src/index.css`. Iconos solo de `lucide-react`.
- Título de evento: 120 caracteres o menos después de `trim()` (§10 A05).
- Contraste de 4.5:1 o más y objetivos táctiles de 44 px o más (WCAG 2.2 AA, §17.1).
- Tests solo en `src/tests/`, con la técnica de diseño declarada en un comentario (§7).
- Commits: `:emoji: tipo(alcance): sujeto`, en español, en minúsculas, sin punto final y sin trailers de agente (§11). Alcances: `agenda`, `dashboard`, `config`, `test`.
- Comandos: test de un archivo con `pnpm exec vitest run <ruta>`; suite completa con `pnpm exec vitest run`; tipos con `pnpm exec tsc -b`; lint con `pnpm lint`; build con `pnpm build`.

## Review Focus

1. **Cambio de perfil con la Agenda abierta:** al cambiar `profileId`, el calendario y el panel muestran solo los eventos del perfil nuevo, sin restos del anterior. Lo cubre el test "remonta al cambiar de perfil" de la Task 6.
2. **Editar un evento recurrente:** el cambio se aplica a toda la serie, también a las ocurrencias pasadas, y la persona tiene que saberlo antes de guardar. La Task 6 agrega el aviso "Los cambios se aplican a todas las repeticiones." y un test que lo verifica.
3. **Eventos recurrentes y cambio de horario de verano** (Chile: primer domingo de septiembre y de abril): una serie de las 18:00 se sigue viendo a las 18:00 después del cambio. La recurrencia se guarda en hora de pared (`startTime`), no en UTC. Verificación manual en la Task 7 navegando a la semana del cambio.
4. **Títulos largos sin espacios** (120 caracteres): no rompen el panel ni la grilla a 320 px (`overflow-wrap: anywhere`). Verificación manual en la Task 7.
5. **Clic en una ocurrencia recurrente:** el panel selecciona el día de esa ocurrencia, no el inicio de la serie, porque `handleEventClick` usa `info.event.start`. Verificación manual en la Task 7: jsdom no simula clics dentro de la grilla de FullCalendar.

---

## File Structure

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `src/utils/localDate.ts` | Crear | Fecha y hora local (`toLocalDateStr`, `toLocalTimeStr`, `addDaysToDateStr`, `defaultEndTime`) |
| `src/types/index.ts` | Modificar | `EventRecurrence` y `AgendaEvent.recurrence?` |
| `src/components/agenda/eventForm.ts` | Crear | Estado del formulario y validación pura |
| `src/components/agenda/eventMapping.ts` | Crear | Mapeo a FullCalendar, `applyTimeChange`, `occursOn`, conteos, constantes de categoría |
| `src/components/agenda/eventPersistence.ts` | Crear | Guardar y borrar con manejo de errores; commit de arrastre y redimensionado |
| `src/components/agenda/fullcalendar-palette.css` | Crear | Tokens `--fc-forma-*` → tokens de `index.css` |
| `src/components/AgendaView.tsx` | Reescribir | Orquestación: FullCalendar, filtro, panel del día, formulario |
| `src/components/AgendaView.module.css` | Reescribir | Estilos de la vista |
| `src/components/DashboardView.tsx` | Modificar | "Hoy" local y eventos recurrentes de hoy |
| `src/tests/localDate.test.ts` | Crear | |
| `src/tests/eventForm.test.ts` | Crear | |
| `src/tests/eventMapping.test.ts` | Crear | |
| `src/tests/eventPersistence.test.ts` | Crear | |
| `src/tests/AgendaView.test.tsx` | Reescribir | |
| `src/tests/DashboardView.test.tsx` | Modificar | |

---

### Task 1: Fecha local y "hoy" correcto en el Dashboard

**Files:**
- Create: `src/utils/localDate.ts`
- Create: `src/tests/localDate.test.ts`
- Modify: `src/components/DashboardView.tsx:34` (cálculo de `todayStr`) y su import
- Modify: `src/tests/DashboardView.test.tsx:23`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `toLocalDateStr(date: Date): string` → `'YYYY-MM-DD'`
  - `toLocalTimeStr(date: Date): string` → `'HH:mm'`
  - `addDaysToDateStr(dateStr: string, days: number): string`
  - `defaultEndTime(startTime: string): string` → inicio + 1 h, con tope en `'23:59'`

- [ ] **Step 1: Write the failing test** — crear `src/tests/localDate.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { addDaysToDateStr, defaultEndTime, toLocalDateStr, toLocalTimeStr } from '../utils/localDate';

// Técnica: valores límite (bordes de día, mes, año, bisiesto y fin del día para horas).
describe('localDate', () => {
  it('usa el día local a las 23:59, no el día UTC', () => {
    expect(toLocalDateStr(new Date(2026, 9, 10, 23, 59))).toBe('2026-10-10');
  });

  it('cambia de día exactamente a las 00:00 locales', () => {
    expect(toLocalDateStr(new Date(2026, 9, 11, 0, 0))).toBe('2026-10-11');
  });

  it('formatea la hora local con ceros a la izquierda', () => {
    expect(toLocalTimeStr(new Date(2026, 9, 10, 9, 5))).toBe('09:05');
  });

  it.each([
    ['2026-10-31', 1, '2026-11-01'],
    ['2026-12-31', 1, '2027-01-01'],
    ['2028-02-28', 1, '2028-02-29'],
    ['2027-02-28', 1, '2027-03-01'],
    ['2026-10-01', -1, '2026-09-30'],
  ])('addDaysToDateStr(%s, %i) = %s', (date, days, expected) => {
    expect(addDaysToDateStr(date, days)).toBe(expected);
  });

  it.each([
    ['09:30', '10:30'],
    ['22:59', '23:59'],
    ['23:00', '23:59'],
    ['23:30', '23:59'],
  ])('defaultEndTime(%s) = %s', (start, expected) => {
    expect(defaultEndTime(start)).toBe(expected);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/tests/localDate.test.ts`
Expected: FAIL con `Failed to resolve import "../utils/localDate"`.

- [ ] **Step 3: Write minimal implementation** — crear `src/utils/localDate.ts`:

```ts
const pad = (n: number) => String(n).padStart(2, '0');

/** Fecha local 'YYYY-MM-DD'. Nunca usar toISOString(): en zonas UTC negativas corre el día. */
export const toLocalDateStr = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** Hora local 'HH:mm'. */
export const toLocalTimeStr = (date: Date): string => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

/** Suma días a una fecha 'YYYY-MM-DD' en calendario local. */
export const addDaysToDateStr = (dateStr: string, days: number): string => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return toLocalDateStr(new Date(y, m - 1, d + days));
};

/** Término por defecto: inicio + 1 h, sin cruzar medianoche. */
export const defaultEndTime = (startTime: string): string => {
  const [h, m] = startTime.split(':').map(Number);
  return h >= 23 ? '23:59' : `${pad(h + 1)}:${pad(m)}`;
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/tests/localDate.test.ts`
Expected: PASS (12 tests).

- [ ] **Step 5: Use local date in DashboardView** — en `src/components/DashboardView.tsx` reemplazar la línea 34:

```tsx
  const [todayStr] = useState(() => new Date().toISOString().split('T')[0]);
```

por:

```tsx
  const [todayStr] = useState(() => toLocalDateStr(new Date()));
```

y agregar junto a los demás imports del archivo:

```tsx
import { toLocalDateStr } from '../utils/localDate';
```

En `src/tests/DashboardView.test.tsx` reemplazar la línea 23:

```tsx
    const todayStr = new Date().toISOString().split('T')[0];
```

por:

```tsx
    const todayStr = toLocalDateStr(new Date());
```

y agregar el import `import { toLocalDateStr } from '../utils/localDate';` junto a los demás.

- [ ] **Step 6: Run Dashboard tests**

Run: `pnpm exec vitest run src/tests/DashboardView.test.tsx src/tests/localDate.test.ts`
Expected: PASS (4 + 12 tests).

- [ ] **Step 7: Commit**

```bash
git add src/utils/localDate.ts src/tests/localDate.test.ts src/components/DashboardView.tsx src/tests/DashboardView.test.tsx
git commit -m ":bug: fix(dashboard): calcular el dia actual en hora local" -m "toISOString convertia a UTC y en Chile despues de las 21:00 mostraba los eventos del dia siguiente."
```

---

### Task 2: Recurrencia en el modelo y validación del formulario

**Files:**
- Modify: `src/types/index.ts:19-28`
- Create: `src/components/agenda/eventForm.ts`
- Create: `src/tests/eventForm.test.ts`

**Interfaces:**
- Consumes: `defaultEndTime(startTime: string): string` (Task 1).
- Produces:
  - `interface EventRecurrence { daysOfWeek: number[]; until?: string }`
  - `AgendaEvent.recurrence?: EventRecurrence`
  - `MAX_TITLE_LENGTH = 120`
  - `DEFAULT_CATEGORY: EventCategory = 'personal'`
  - `interface EventFormState { editingId?: string; notes?: string; title: string; date: string; allDay: boolean; startTime: string; endTime: string; category: EventCategory; repeatWeekly: boolean; daysOfWeek: number[]; until: string }`
  - `type EventFormResult = { ok: true; event: AgendaEvent } | { ok: false; error: string }`
  - `emptyEventForm(date: string): EventFormState`
  - `eventFormFromEvent(ev: AgendaEvent): EventFormState`
  - `validateEventForm(form: EventFormState, profileId: string, newId?: () => string): EventFormResult`

- [ ] **Step 1: Extend the model** — en `src/types/index.ts` reemplazar el bloque `AgendaEvent`:

```ts
export interface AgendaEvent {
  id: string;
  profileId: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  category?: EventCategory;
  notes?: string;
}
```

por:

```ts
export interface EventRecurrence {
  daysOfWeek: number[]; // 0 = domingo … 6 = sábado
  until?: string; // YYYY-MM-DD inclusive
}

export interface AgendaEvent {
  id: string;
  profileId: string;
  title: string;
  date: string; // YYYY-MM-DD hora local; en recurrentes = inicio de la serie
  startTime?: string; // HH:mm; ausente = todo el día
  endTime?: string; // HH:mm; ausente con startTime = 1 h
  category?: EventCategory;
  notes?: string;
  recurrence?: EventRecurrence;
}
```

- [ ] **Step 2: Write the failing test** — crear `src/tests/eventForm.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  MAX_TITLE_LENGTH,
  emptyEventForm,
  eventFormFromEvent,
  validateEventForm,
} from '../components/agenda/eventForm';
import type { EventFormState } from '../components/agenda/eventForm';

const form = (patch: Partial<EventFormState> = {}): EventFormState => ({
  ...emptyEventForm('2026-10-14'),
  title: 'Reunión',
  ...patch,
});
const newId = () => 'e-fixed';

describe('validateEventForm', () => {
  // Técnica: valores límite sobre la longitud del título (0, 1, 120, 121).
  it.each([
    ['', false],
    ['   ', false],
    ['a', true],
    ['x'.repeat(MAX_TITLE_LENGTH), true],
    ['x'.repeat(MAX_TITLE_LENGTH + 1), false],
  ])('título caso %# → ok=%s', (title, ok) => {
    expect(validateEventForm(form({ title }), 'p-1', newId).ok).toBe(ok);
  });

  it('recorta espacios del título', () => {
    const r = validateEventForm(form({ title: '  Clase  ' }), 'p-1', newId);
    expect(r.ok && r.event.title).toBe('Clase');
  });

  // Técnica: partición de equivalencia sobre horas (válida, igual, anterior, mal formada, todo el día).
  it('rechaza término igual al inicio', () => {
    expect(validateEventForm(form({ startTime: '10:00', endTime: '10:00' }), 'p-1', newId)).toEqual({
      ok: false,
      error: 'La hora de término debe ser posterior a la de inicio',
    });
  });

  it('rechaza término anterior al inicio', () => {
    expect(validateEventForm(form({ startTime: '10:00', endTime: '09:59' }), 'p-1', newId).ok).toBe(false);
  });

  it('rechaza horas mal formadas', () => {
    expect(validateEventForm(form({ startTime: '9:00' }), 'p-1', newId).ok).toBe(false);
  });

  it('ignora y no guarda horas en eventos de todo el día', () => {
    const r = validateEventForm(form({ allDay: true, startTime: 'xx', endTime: 'yy' }), 'p-1', newId);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.event).not.toHaveProperty('startTime');
      expect(r.event).not.toHaveProperty('endTime');
    }
  });

  it('rechaza fecha vacía', () => {
    expect(validateEventForm(form({ date: '' }), 'p-1', newId).ok).toBe(false);
  });

  // Técnica: tabla de decisión para recurrencia (repetir × días × until).
  it('rechaza repetir sin días', () => {
    expect(validateEventForm(form({ repeatWeekly: true, daysOfWeek: [] }), 'p-1', newId)).toEqual({
      ok: false,
      error: 'Elige al menos un día para repetir',
    });
  });

  it('rechaza until anterior al inicio', () => {
    const r = validateEventForm(form({ repeatWeekly: true, daysOfWeek: [3], until: '2026-10-13' }), 'p-1', newId);
    expect(r.ok).toBe(false);
  });

  it('acepta until igual al inicio y ordena los días', () => {
    const r = validateEventForm(
      form({ repeatWeekly: true, daysOfWeek: [5, 1, 3], until: '2026-10-14' }),
      'p-1',
      newId,
    );
    expect(r.ok && r.event.recurrence).toEqual({ daysOfWeek: [1, 3, 5], until: '2026-10-14' });
  });

  it('omite until vacío', () => {
    const r = validateEventForm(form({ repeatWeekly: true, daysOfWeek: [3] }), 'p-1', newId);
    expect(r.ok && r.event.recurrence).toEqual({ daysOfWeek: [3] });
  });

  it('no guarda recurrencia si repetir está desactivado aunque haya días marcados', () => {
    const r = validateEventForm(form({ repeatWeekly: false, daysOfWeek: [3] }), 'p-1', newId);
    expect(r.ok && r.event).not.toHaveProperty('recurrence');
  });

  it('crea un evento nuevo con id generado y perfil', () => {
    expect(validateEventForm(form(), 'p-1', newId)).toEqual({
      ok: true,
      event: {
        id: 'e-fixed',
        profileId: 'p-1',
        title: 'Reunión',
        date: '2026-10-14',
        startTime: '09:00',
        endTime: '10:00',
        category: 'personal',
      },
    });
  });

  it('al editar conserva id y notas existentes', () => {
    const r = validateEventForm(form({ editingId: 'e-old', notes: 'traer laptop' }), 'p-1', newId);
    expect(r.ok && r.event.id).toBe('e-old');
    expect(r.ok && r.event.notes).toBe('traer laptop');
  });
});

describe('eventFormFromEvent', () => {
  // Técnica: partición de equivalencia (esquema viejo con hora, todo el día, recurrente).
  it('propone término = inicio + 1 h para eventos viejos sin endTime', () => {
    const f = eventFormFromEvent({ id: 'e1', profileId: 'p', title: 'T', date: '2026-10-14', startTime: '09:30' });
    expect(f).toMatchObject({
      editingId: 'e1',
      allDay: false,
      startTime: '09:30',
      endTime: '10:30',
      category: 'personal',
      repeatWeekly: false,
    });
  });

  it('marca todo el día cuando no hay startTime', () => {
    expect(eventFormFromEvent({ id: 'e2', profileId: 'p', title: 'T', date: '2026-10-14' }).allDay).toBe(true);
  });

  it('carga la recurrencia', () => {
    const f = eventFormFromEvent({
      id: 'e3',
      profileId: 'p',
      title: 'T',
      date: '2026-10-14',
      startTime: '18:00',
      endTime: '19:00',
      recurrence: { daysOfWeek: [1], until: '2026-12-01' },
    });
    expect(f).toMatchObject({ repeatWeekly: true, daysOfWeek: [1], until: '2026-12-01' });
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm exec vitest run src/tests/eventForm.test.ts`
Expected: FAIL con `Failed to resolve import "../components/agenda/eventForm"`.

- [ ] **Step 4: Write minimal implementation** — crear `src/components/agenda/eventForm.ts`:

```ts
import type { AgendaEvent, EventCategory, EventRecurrence } from '../../types';
import { defaultEndTime } from '../../utils/localDate';

export const MAX_TITLE_LENGTH = 120;
export const DEFAULT_CATEGORY: EventCategory = 'personal';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export interface EventFormState {
  editingId?: string;
  notes?: string;
  title: string;
  date: string;
  allDay: boolean;
  startTime: string;
  endTime: string;
  category: EventCategory;
  repeatWeekly: boolean;
  daysOfWeek: number[];
  until: string; // '' = sin término
}

export type EventFormResult = { ok: true; event: AgendaEvent } | { ok: false; error: string };

export const emptyEventForm = (date: string): EventFormState => ({
  title: '',
  date,
  allDay: false,
  startTime: '09:00',
  endTime: '10:00',
  category: DEFAULT_CATEGORY,
  repeatWeekly: false,
  daysOfWeek: [],
  until: '',
});

export const eventFormFromEvent = (ev: AgendaEvent): EventFormState => ({
  editingId: ev.id,
  notes: ev.notes,
  title: ev.title,
  date: ev.date,
  allDay: !ev.startTime,
  startTime: ev.startTime ?? '09:00',
  endTime: ev.endTime ?? (ev.startTime ? defaultEndTime(ev.startTime) : '10:00'),
  category: ev.category ?? DEFAULT_CATEGORY,
  repeatWeekly: Boolean(ev.recurrence),
  daysOfWeek: ev.recurrence?.daysOfWeek ?? [],
  until: ev.recurrence?.until ?? '',
});

/** Valida el formulario (frontera de input del usuario) y arma el AgendaEvent a guardar. */
export const validateEventForm = (
  form: EventFormState,
  profileId: string,
  newId: () => string = () => `e-${Date.now()}`,
): EventFormResult => {
  const title = form.title.trim();
  if (!title) return { ok: false, error: 'El título es obligatorio' };
  if (title.length > MAX_TITLE_LENGTH) {
    return { ok: false, error: `El título no puede superar ${MAX_TITLE_LENGTH} caracteres` };
  }
  if (!DATE_RE.test(form.date)) return { ok: false, error: 'La fecha no es válida' };
  if (!form.allDay) {
    if (!TIME_RE.test(form.startTime) || !TIME_RE.test(form.endTime)) {
      return { ok: false, error: 'Las horas deben tener formato HH:mm' };
    }
    if (form.endTime <= form.startTime) {
      return { ok: false, error: 'La hora de término debe ser posterior a la de inicio' };
    }
  }

  let recurrence: EventRecurrence | undefined;
  if (form.repeatWeekly) {
    if (form.daysOfWeek.length === 0) return { ok: false, error: 'Elige al menos un día para repetir' };
    if (form.until && (!DATE_RE.test(form.until) || form.until < form.date)) {
      return { ok: false, error: 'La fecha de término de la repetición no puede ser anterior al inicio' };
    }
    recurrence = {
      daysOfWeek: [...form.daysOfWeek].sort((a, b) => a - b),
      ...(form.until ? { until: form.until } : {}),
    };
  }

  const event: AgendaEvent = { id: form.editingId ?? newId(), profileId, title, date: form.date, category: form.category };
  if (!form.allDay) {
    event.startTime = form.startTime;
    event.endTime = form.endTime;
  }
  if (form.notes) event.notes = form.notes;
  if (recurrence) event.recurrence = recurrence;
  return { ok: true, event };
};
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm exec vitest run src/tests/eventForm.test.ts src/tests/types.test.ts`
Expected: PASS (todos los casos de `eventForm.test.ts` y `types.test.ts`).

- [ ] **Step 6: Commit**

```bash
git add src/types/index.ts src/components/agenda/eventForm.ts src/tests/eventForm.test.ts
git commit -m ":sparkles: feat(agenda): validar formulario de eventos con recurrencia semanal" -m "Extiende AgendaEvent con recurrence opcional; los eventos guardados siguen validos sin migracion."
```

---

### Task 3: Instalar FullCalendar y mapear eventos

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml` (vía `pnpm add`)
- Create: `src/components/agenda/eventMapping.ts`
- Create: `src/tests/eventMapping.test.ts`

**Interfaces:**
- Consumes:
  - `DEFAULT_CATEGORY` (Task 2)
  - `addDaysToDateStr`, `defaultEndTime`, `toLocalDateStr`, `toLocalTimeStr` (Task 1)
  - tipo `EventInput` de `@fullcalendar/react`
- Produces:
  - `type CategoryFilter = EventCategory | 'todas'`
  - `CATEGORIES: EventCategory[]`
  - `FILTERS: CategoryFilter[]`
  - `FILTER_LABELS: Record<CategoryFilter, string>`
  - `CATEGORY_COLORS: Record<EventCategory, { color: string; textColor: string }>`
  - `WEEK_DAYS: { value: number; short: string; long: string }[]` (lunes primero)
  - `categoryOf(ev: AgendaEvent): EventCategory`
  - `toCalendarEvent(ev: AgendaEvent): EventInput`
  - `applyTimeChange(ev: AgendaEvent, start: Date | null, end: Date | null, allDay: boolean): AgendaEvent | null`
  - `occursOn(ev: AgendaEvent, dateStr: string): boolean`
  - `countByCategory(events: AgendaEvent[]): Record<CategoryFilter, number>`

- [ ] **Step 1: Install dependencies**

```bash
pnpm add -E @fullcalendar/react@7.1.0 temporal-polyfill@1.0.5
pnpm audit --prod
pnpm peers check
```

Expected:
- `package.json` muestra `"@fullcalendar/react": "7.1.0"` y `"temporal-polyfill": "1.0.5"` sin `^`;
- `No known vulnerabilities found`;
- `No peer dependency issues found`.

- [ ] **Step 2: Write the failing test** — crear `src/tests/eventMapping.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  CATEGORY_COLORS,
  applyTimeChange,
  countByCategory,
  occursOn,
  toCalendarEvent,
} from '../components/agenda/eventMapping';
import type { AgendaEvent } from '../types';

const single: AgendaEvent = {
  id: 'e1',
  profileId: 'p',
  title: 'Clase',
  date: '2026-10-14',
  startTime: '09:00',
  endTime: '10:30',
  category: 'estudio',
};

// 2026-10-14 es miércoles (getDay() = 3).
const weekly: AgendaEvent = {
  id: 'r1',
  profileId: 'p',
  title: 'Gimnasio',
  date: '2026-10-14',
  startTime: '18:00',
  endTime: '19:00',
  category: 'personal',
  recurrence: { daysOfWeek: [3], until: '2026-10-28' },
};

describe('toCalendarEvent', () => {
  // Técnica: partición de equivalencia (único con hora, sin endTime, todo el día, sin categoría, recurrentes).
  it('evento único con horas', () => {
    expect(toCalendarEvent(single)).toEqual({
      id: 'e1',
      title: 'Clase',
      start: '2026-10-14T09:00',
      end: '2026-10-14T10:30',
      allDay: false,
      ...CATEGORY_COLORS.estudio,
    });
  });

  it('evento del esquema viejo sin endTime dura 1 h', () => {
    const legacy: AgendaEvent = { id: 'e2', profileId: 'p', title: 'Viejo', date: '2026-10-14', startTime: '09:00' };
    expect(toCalendarEvent(legacy)).toMatchObject({ end: '2026-10-14T10:00' });
  });

  it('evento de todo el día', () => {
    const allDay: AgendaEvent = { id: 'e3', profileId: 'p', title: 'Feriado', date: '2026-10-14' };
    const out = toCalendarEvent(allDay);
    expect(out).toMatchObject({ start: '2026-10-14', allDay: true });
    expect(out).not.toHaveProperty('end');
  });

  it('sin categoría usa los colores de personal', () => {
    const noCat: AgendaEvent = { id: 'e4', profileId: 'p', title: 'X', date: '2026-10-14', startTime: '08:00' };
    expect(toCalendarEvent(noCat)).toMatchObject(CATEGORY_COLORS.personal);
  });

  it('recurrente con until: endRecur exclusivo = until + 1 día y no editable por arrastre', () => {
    expect(toCalendarEvent(weekly)).toEqual({
      id: 'r1',
      title: 'Gimnasio',
      ...CATEGORY_COLORS.personal,
      daysOfWeek: [3],
      startRecur: '2026-10-14',
      endRecur: '2026-10-29',
      startTime: '18:00',
      endTime: '19:00',
      editable: false,
    });
  });

  it('recurrente sin until no define endRecur', () => {
    const open: AgendaEvent = { ...weekly, recurrence: { daysOfWeek: [3] } };
    expect(toCalendarEvent(open)).not.toHaveProperty('endRecur');
  });

  it('recurrente de todo el día', () => {
    const allDaySeries: AgendaEvent = { id: 'r2', profileId: 'p', title: 'Y', date: '2026-10-14', recurrence: { daysOfWeek: [1] } };
    const out = toCalendarEvent(allDaySeries);
    expect(out).toMatchObject({ allDay: true, daysOfWeek: [1] });
    expect(out).not.toHaveProperty('startTime');
  });
});

describe('applyTimeChange', () => {
  // Técnica: tabla de decisión (allDay × cruza de día × end nulo).
  it('mueve un evento con hora dentro del mismo día', () => {
    expect(applyTimeChange(single, new Date(2026, 9, 15, 11, 0), new Date(2026, 9, 15, 12, 30), false)).toEqual({
      ...single,
      date: '2026-10-15',
      startTime: '11:00',
      endTime: '12:30',
    });
  });

  it('con end nulo asume 1 h', () => {
    expect(applyTimeChange(single, new Date(2026, 9, 15, 8, 0), null, false)).toMatchObject({
      startTime: '08:00',
      endTime: '09:00',
    });
  });

  it('rechaza un cambio que cruza medianoche', () => {
    expect(applyTimeChange(single, new Date(2026, 9, 15, 23, 30), new Date(2026, 9, 16, 0, 30), false)).toBeNull();
  });

  it('rechaza 23:30 sin end porque la hora por defecto cruza medianoche', () => {
    expect(applyTimeChange(single, new Date(2026, 9, 15, 23, 30), null, false)).toBeNull();
  });

  it('rechaza start nulo', () => {
    expect(applyTimeChange(single, null, null, false)).toBeNull();
  });

  it('pasar a todo el día elimina las horas', () => {
    const out = applyTimeChange(single, new Date(2026, 9, 16), null, true);
    expect(out).toMatchObject({ id: 'e1', date: '2026-10-16' });
    expect(out).not.toHaveProperty('startTime');
    expect(out).not.toHaveProperty('endTime');
  });

  it('acepta todo el día con end exclusivo al día siguiente', () => {
    expect(applyTimeChange(single, new Date(2026, 9, 16), new Date(2026, 9, 17), true)).not.toBeNull();
  });

  it('rechaza todo el día que abarca varios días', () => {
    expect(applyTimeChange(single, new Date(2026, 9, 16), new Date(2026, 9, 18), true)).toBeNull();
  });

  it('de todo el día a franja horaria asigna horas', () => {
    const allDay: AgendaEvent = { id: 'e5', profileId: 'p', title: 'Z', date: '2026-10-14' };
    expect(applyTimeChange(allDay, new Date(2026, 9, 14, 10, 0), null, false)).toMatchObject({
      startTime: '10:00',
      endTime: '11:00',
    });
  });
});

describe('occursOn', () => {
  // Técnica: valores límite (antes del inicio, inicio, until inclusive, día después de until, otro día de semana).
  it('evento único solo ocurre en su fecha', () => {
    expect(occursOn(single, '2026-10-14')).toBe(true);
    expect(occursOn(single, '2026-10-15')).toBe(false);
  });

  it.each([
    ['2026-10-07', false],
    ['2026-10-14', true],
    ['2026-10-21', true],
    ['2026-10-28', true],
    ['2026-11-04', false],
    ['2026-10-15', false],
  ])('serie semanal de miércoles en %s → %s', (date, expected) => {
    expect(occursOn(weekly, date)).toBe(expected);
  });

  it('serie sin until sigue ocurriendo', () => {
    expect(occursOn({ ...weekly, recurrence: { daysOfWeek: [3] } }, '2027-01-06')).toBe(true);
  });
});

describe('countByCategory', () => {
  it('cuenta por categoría y trata la ausencia como personal', () => {
    const events: AgendaEvent[] = [
      { ...single, id: 'a', category: 'trabajo' },
      { ...single, id: 'b', category: 'trabajo' },
      { id: 'c', profileId: 'p', title: 'sin cat', date: '2026-10-14' },
      { ...single, id: 'd', category: 'urgente' },
    ];
    expect(countByCategory(events)).toEqual({ todas: 4, trabajo: 2, personal: 1, urgente: 1, estudio: 0 });
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm exec vitest run src/tests/eventMapping.test.ts`
Expected: FAIL con `Failed to resolve import "../components/agenda/eventMapping"`.

- [ ] **Step 4: Write minimal implementation** — crear `src/components/agenda/eventMapping.ts`:

```ts
import type { EventInput } from '@fullcalendar/react';
import type { AgendaEvent, EventCategory } from '../../types';
import { addDaysToDateStr, defaultEndTime, toLocalDateStr, toLocalTimeStr } from '../../utils/localDate';
import { DEFAULT_CATEGORY } from './eventForm';

export type CategoryFilter = EventCategory | 'todas';

export const CATEGORIES: EventCategory[] = ['trabajo', 'personal', 'urgente', 'estudio'];
export const FILTERS: CategoryFilter[] = ['todas', ...CATEGORIES];
export const FILTER_LABELS: Record<CategoryFilter, string> = {
  todas: 'Todas',
  trabajo: 'Trabajo',
  personal: 'Personal',
  urgente: 'Urgente',
  estudio: 'Estudio',
};

// Contraste texto/fondo >= 4.5:1: ink sobre teal y amber; blanco sobre primary y error.
export const CATEGORY_COLORS: Record<EventCategory, { color: string; textColor: string }> = {
  trabajo: { color: 'var(--color-accent-teal)', textColor: 'var(--color-ink)' },
  personal: { color: 'var(--color-primary)', textColor: 'var(--color-on-primary)' },
  urgente: { color: 'var(--color-error)', textColor: 'var(--color-on-primary)' },
  estudio: { color: 'var(--color-accent-amber)', textColor: 'var(--color-ink)' },
};

export const WEEK_DAYS = [
  { value: 1, short: 'Lu', long: 'Lunes' },
  { value: 2, short: 'Ma', long: 'Martes' },
  { value: 3, short: 'Mi', long: 'Miércoles' },
  { value: 4, short: 'Ju', long: 'Jueves' },
  { value: 5, short: 'Vi', long: 'Viernes' },
  { value: 6, short: 'Sá', long: 'Sábado' },
  { value: 0, short: 'Do', long: 'Domingo' },
];

export const categoryOf = (ev: AgendaEvent): EventCategory => ev.category ?? DEFAULT_CATEGORY;

export const toCalendarEvent = (ev: AgendaEvent): EventInput => {
  const base = { id: ev.id, title: ev.title, ...CATEGORY_COLORS[categoryOf(ev)] };
  const endTime = ev.startTime ? (ev.endTime ?? defaultEndTime(ev.startTime)) : undefined;

  if (ev.recurrence) {
    return {
      ...base,
      daysOfWeek: ev.recurrence.daysOfWeek,
      startRecur: ev.date,
      // endRecur es exclusivo en FullCalendar; until es inclusivo en el modelo.
      ...(ev.recurrence.until ? { endRecur: addDaysToDateStr(ev.recurrence.until, 1) } : {}),
      ...(ev.startTime ? { startTime: ev.startTime, endTime } : { allDay: true }),
      editable: false,
    };
  }
  if (!ev.startTime) return { ...base, start: ev.date, allDay: true };
  return { ...base, start: `${ev.date}T${ev.startTime}`, end: `${ev.date}T${endTime}`, allDay: false };
};

/** Aplica un arrastre/redimensionado. Devuelve null si el resultado no cabe en un solo día. */
export const applyTimeChange = (
  ev: AgendaEvent,
  start: Date | null,
  end: Date | null,
  allDay: boolean,
): AgendaEvent | null => {
  if (!start) return null;
  const date = toLocalDateStr(start);

  if (allDay) {
    if (end && toLocalDateStr(end) !== addDaysToDateStr(date, 1)) return null;
    const next: AgendaEvent = { ...ev, date };
    delete next.startTime;
    delete next.endTime;
    return next;
  }

  const endDate = end ?? new Date(start.getTime() + 60 * 60 * 1000);
  if (toLocalDateStr(endDate) !== date) return null;
  return { ...ev, date, startTime: toLocalTimeStr(start), endTime: toLocalTimeStr(endDate) };
};

export const occursOn = (ev: AgendaEvent, dateStr: string): boolean => {
  if (!ev.recurrence) return ev.date === dateStr;
  if (dateStr < ev.date) return false;
  if (ev.recurrence.until && dateStr > ev.recurrence.until) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  return ev.recurrence.daysOfWeek.includes(new Date(y, m - 1, d).getDay());
};

export const countByCategory = (events: AgendaEvent[]): Record<CategoryFilter, number> => {
  const counts: Record<CategoryFilter, number> = { todas: events.length, trabajo: 0, personal: 0, urgente: 0, estudio: 0 };
  for (const ev of events) counts[categoryOf(ev)] += 1;
  return counts;
};
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm exec vitest run src/tests/eventMapping.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml src/components/agenda/eventMapping.ts src/tests/eventMapping.test.ts
git commit -m ":sparkles: feat(agenda): mapear eventos a fullcalendar v7 con recurrencia semanal" -m "Instala @fullcalendar/react 7.1.0 y temporal-polyfill 1.0.5 (versiones exactas, pnpm audit limpio)."
```

---

### Task 4: Eventos recurrentes en "Eventos de hoy" del Dashboard

**Files:**
- Modify: `src/components/DashboardView.tsx:35`
- Modify: `src/tests/DashboardView.test.tsx`

**Interfaces:**
- Consumes:
  - `occursOn(ev: AgendaEvent, dateStr: string): boolean` (Task 3)
  - `toLocalDateStr`, `addDaysToDateStr` (Task 1)
- Produces: nada nuevo.

- [ ] **Step 1: Write the failing test** — en `src/tests/DashboardView.test.tsx`, cambiar el import de `localDate` a:

```ts
import { addDaysToDateStr, toLocalDateStr } from '../utils/localDate';
```

y agregar dentro del `describe('DashboardView', …)`, antes del cierre `});`:

```tsx
  // Técnica: partición de equivalencia (serie que cae hoy vs. serie que no cae hoy).
  it('incluye en eventos de hoy las series semanales que caen hoy', () => {
    const today = toLocalDateStr(new Date());
    const todayDow = new Date().getDay();

    StorageService.saveEvent({
      id: 'r-hoy',
      profileId: mockProfile.id,
      title: 'Serie de hoy',
      date: addDaysToDateStr(today, -7),
      startTime: '18:00',
      endTime: '19:00',
      recurrence: { daysOfWeek: [todayDow] },
    });
    StorageService.saveEvent({
      id: 'r-otro',
      profileId: mockProfile.id,
      title: 'Serie de otro día',
      date: addDaysToDateStr(today, -7),
      startTime: '18:00',
      recurrence: { daysOfWeek: [(todayDow + 1) % 7] },
    });

    render(<DashboardView profile={mockProfile} onNavigate={vi.fn()} />);

    expect(screen.getByText('Serie de hoy')).toBeInTheDocument();
    expect(screen.queryByText('Serie de otro día')).not.toBeInTheDocument();
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/tests/DashboardView.test.tsx`
Expected: FAIL en "incluye en eventos de hoy las series semanales que caen hoy" con `Unable to find an element with the text: Serie de hoy`.

- [ ] **Step 3: Write minimal implementation** — en `src/components/DashboardView.tsx` reemplazar:

```tsx
  const todayEvents = events.filter(e => e.date === todayStr);
```

por:

```tsx
  const todayEvents = events.filter(e => occursOn(e, todayStr));
```

y agregar el import:

```tsx
import { occursOn } from './agenda/eventMapping';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/tests/DashboardView.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/DashboardView.tsx src/tests/DashboardView.test.tsx
git commit -m ":sparkles: feat(dashboard): mostrar eventos recurrentes del dia en el resumen"
```

---

### Task 5: Persistencia segura y commit de arrastre

**Files:**
- Create: `src/components/agenda/eventPersistence.ts`
- Create: `src/tests/eventPersistence.test.ts`

**Interfaces:**
- Consumes:
  - `applyTimeChange` (Task 3)
  - `StorageService.saveEvent(event: AgendaEvent): void`
  - `StorageService.deleteEvent(profileId: string, eventId: string): void`
  - `sileo.success/error({ title })`
- Produces:
  - `CROSS_DAY_ERROR: string`
  - `SAVE_ERROR: string`
  - `interface TimeChange { start: Date | null; end: Date | null; allDay: boolean; revert: () => void }`
  - `safeSaveEvent(ev: AgendaEvent): boolean`
  - `safeDeleteEvent(profileId: string, id: string): boolean`
  - `commitTimeChange(ev: AgendaEvent, change: TimeChange): boolean`

- [ ] **Step 1: Write the failing test** — crear `src/tests/eventPersistence.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { sileo } from 'sileo';
import { StorageService } from '../services/storage';
import {
  CROSS_DAY_ERROR,
  SAVE_ERROR,
  commitTimeChange,
  safeDeleteEvent,
  safeSaveEvent,
} from '../components/agenda/eventPersistence';
import type { AgendaEvent } from '../types';

const ev: AgendaEvent = {
  id: 'e1',
  profileId: 'p-1',
  title: 'Clase',
  date: '2026-10-14',
  startTime: '09:00',
  endTime: '10:00',
  category: 'estudio',
};

const quotaError = () => {
  throw new DOMException('lleno', 'QuotaExceededError');
};

// Técnica: tabla de decisión (cambio válido / cruza de día / almacenamiento falla).
describe('eventPersistence', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('guarda un movimiento dentro del mismo día', () => {
    StorageService.saveEvent(ev);
    const revert = vi.fn();
    const success = vi.spyOn(sileo, 'success');

    const ok = commitTimeChange(ev, {
      start: new Date(2026, 9, 15, 11, 0),
      end: new Date(2026, 9, 15, 12, 30),
      allDay: false,
      revert,
    });

    expect(ok).toBe(true);
    expect(revert).not.toHaveBeenCalled();
    expect(StorageService.getEvents('p-1')[0]).toMatchObject({ date: '2026-10-15', startTime: '11:00', endTime: '12:30' });
    expect(success).toHaveBeenCalledWith({ title: 'Evento reprogramado' });
  });

  it('revierte y avisa si el cambio cruza medianoche, sin tocar el almacenamiento', () => {
    StorageService.saveEvent(ev);
    const revert = vi.fn();
    const error = vi.spyOn(sileo, 'error');

    const ok = commitTimeChange(ev, {
      start: new Date(2026, 9, 15, 23, 30),
      end: new Date(2026, 9, 16, 0, 30),
      allDay: false,
      revert,
    });

    expect(ok).toBe(false);
    expect(revert).toHaveBeenCalledOnce();
    expect(error).toHaveBeenCalledWith({ title: CROSS_DAY_ERROR });
    expect(StorageService.getEvents('p-1')[0]).toEqual(ev);
  });

  it('revierte y avisa si el almacenamiento lanza QuotaExceededError', () => {
    vi.spyOn(StorageService, 'saveEvent').mockImplementation(quotaError);
    const revert = vi.fn();
    const error = vi.spyOn(sileo, 'error');

    const ok = commitTimeChange(ev, {
      start: new Date(2026, 9, 15, 11, 0),
      end: new Date(2026, 9, 15, 12, 0),
      allDay: false,
      revert,
    });

    expect(ok).toBe(false);
    expect(revert).toHaveBeenCalledOnce();
    expect(error).toHaveBeenCalledWith({ title: SAVE_ERROR });
  });

  it('safeSaveEvent devuelve false y avisa sin lanzar', () => {
    vi.spyOn(StorageService, 'saveEvent').mockImplementation(quotaError);
    const error = vi.spyOn(sileo, 'error');
    expect(safeSaveEvent(ev)).toBe(false);
    expect(error).toHaveBeenCalledWith({ title: SAVE_ERROR });
  });

  it('safeDeleteEvent borra y devuelve true', () => {
    StorageService.saveEvent(ev);
    expect(safeDeleteEvent('p-1', 'e1')).toBe(true);
    expect(StorageService.getEvents('p-1')).toEqual([]);
  });

  it('safeDeleteEvent devuelve false y avisa sin lanzar', () => {
    vi.spyOn(StorageService, 'deleteEvent').mockImplementation(quotaError);
    const error = vi.spyOn(sileo, 'error');
    expect(safeDeleteEvent('p-1', 'e1')).toBe(false);
    expect(error).toHaveBeenCalledWith({ title: SAVE_ERROR });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/tests/eventPersistence.test.ts`
Expected: FAIL con `Failed to resolve import "../components/agenda/eventPersistence"`.

- [ ] **Step 3: Write minimal implementation** — crear `src/components/agenda/eventPersistence.ts`:

```ts
import { sileo } from 'sileo';
import { StorageService } from '../../services/storage';
import type { AgendaEvent } from '../../types';
import { applyTimeChange } from './eventMapping';

export const CROSS_DAY_ERROR = 'Los eventos deben empezar y terminar el mismo día';
export const SAVE_ERROR = 'No se pudo guardar: el almacenamiento del navegador está lleno o no disponible';

export interface TimeChange {
  start: Date | null;
  end: Date | null;
  allDay: boolean;
  revert: () => void;
}

/** Guarda sin propagar excepciones (QuotaExceededError incluido); la vista nunca queda en blanco. */
export const safeSaveEvent = (ev: AgendaEvent): boolean => {
  try {
    StorageService.saveEvent(ev);
    return true;
  } catch {
    sileo.error({ title: SAVE_ERROR });
    return false;
  }
};

export const safeDeleteEvent = (profileId: string, id: string): boolean => {
  try {
    StorageService.deleteEvent(profileId, id);
    return true;
  } catch {
    sileo.error({ title: SAVE_ERROR });
    return false;
  }
};

/** Persiste un arrastre o redimensionado; revierte el calendario si no es válido o si falla el guardado. */
export const commitTimeChange = (ev: AgendaEvent, change: TimeChange): boolean => {
  const updated = applyTimeChange(ev, change.start, change.end, change.allDay);
  if (!updated) {
    change.revert();
    sileo.error({ title: CROSS_DAY_ERROR });
    return false;
  }
  if (!safeSaveEvent(updated)) {
    change.revert();
    return false;
  }
  sileo.success({ title: 'Evento reprogramado' });
  return true;
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/tests/eventPersistence.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/agenda/eventPersistence.ts src/tests/eventPersistence.test.ts
git commit -m ":sparkles: feat(agenda): persistir cambios de eventos con manejo de almacenamiento lleno"
```

---

### Task 6: AgendaView con FullCalendar

**Files:**
- Rewrite: `src/tests/AgendaView.test.tsx`
- Create: `src/components/agenda/fullcalendar-palette.css`
- Rewrite: `src/components/AgendaView.module.css`
- Rewrite: `src/components/AgendaView.tsx`

**Interfaces:**
- Consumes: todo lo producido en las Tasks 1–5.
- Produces: `export const AgendaView: React.FC<{ profileId: string }>`, con la misma firma de hoy (la usa `src/routes/index.tsx`).

- [ ] **Step 1: Write the failing test** — reemplazar todo `src/tests/AgendaView.test.tsx` por:

```tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { sileo } from 'sileo';
import { AgendaView } from '../components/AgendaView';
import { WEEK_DAYS } from '../components/agenda/eventMapping';
import { SAVE_ERROR } from '../components/agenda/eventPersistence';
import { StorageService } from '../services/storage';
import { toLocalDateStr } from '../utils/localDate';
import type { AgendaEvent } from '../types';

const profileId = 'p-agenda';
const today = toLocalDateStr(new Date());
const dayList = () => within(screen.getByRole('list', { name: /eventos del día/i }));
const seed = (ev: Omit<AgendaEvent, 'profileId' | 'date'> & Partial<AgendaEvent>) =>
  StorageService.saveEvent({ profileId, date: today, ...ev });

describe('AgendaView', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  // Técnica: partición de equivalencia sobre datos de entrada (perfil propio, ajeno, esquema viejo).
  it('muestra en el panel del día los eventos del perfil activo', () => {
    seed({ id: 'e1', title: 'Clase de conducción', startTime: '09:00', endTime: '10:00', category: 'estudio' });
    render(<AgendaView profileId={profileId} />);

    expect(screen.getByRole('heading', { name: /agenda de eventos/i })).toBeInTheDocument();
    expect(dayList().getByText('Clase de conducción')).toBeInTheDocument();
    expect(dayList().getByText('09:00–10:00 · Estudio')).toBeInTheDocument();
  });

  it('no mezcla eventos entre perfiles', () => {
    seed({ id: 'e1', title: 'Evento propio', startTime: '09:00' });
    StorageService.saveEvent({ id: 'e2', profileId: 'p-otro', title: 'Evento ajeno', date: today, startTime: '09:00' });
    render(<AgendaView profileId={profileId} />);

    expect(dayList().getByText('Evento propio')).toBeInTheDocument();
    expect(screen.queryByText('Evento ajeno')).not.toBeInTheDocument();
  });

  it('remonta al cambiar de perfil y muestra solo los eventos del nuevo', () => {
    seed({ id: 'e1', title: 'Del primero', startTime: '09:00' });
    StorageService.saveEvent({ id: 'e2', profileId: 'p-dos', title: 'Del segundo', date: today, startTime: '09:00' });
    const { rerender } = render(<AgendaView profileId={profileId} />);
    rerender(<AgendaView profileId="p-dos" />);

    expect(dayList().getByText('Del segundo')).toBeInTheDocument();
    expect(screen.queryByText('Del primero')).not.toBeInTheDocument();
  });

  it('muestra un evento del esquema viejo (sin endTime ni categoría) con 1 h y categoría personal', () => {
    seed({ id: 'old', title: 'Evento antiguo', startTime: '13:00' });
    render(<AgendaView profileId={profileId} />);

    expect(dayList().getByText('13:00–14:00 · Personal')).toBeInTheDocument();
  });

  it('crea un evento desde el formulario y lo persiste', async () => {
    const success = vi.spyOn(sileo, 'success');
    const user = userEvent.setup();
    render(<AgendaView profileId={profileId} />);

    await user.type(screen.getByPlaceholderText(/título del evento/i), 'Reunión de coordinación');
    await user.click(screen.getByRole('button', { name: /agregar evento/i }));

    expect(dayList().getByText('Reunión de coordinación')).toBeInTheDocument();
    expect(StorageService.getEvents(profileId)).toEqual([
      expect.objectContaining({
        title: 'Reunión de coordinación',
        date: today,
        startTime: '09:00',
        endTime: '10:00',
        category: 'personal',
      }),
    ]);
    expect(success).toHaveBeenCalledWith({ title: 'Evento agendado con éxito' });
  });

  it('edita un evento existente conservando su id', async () => {
    seed({ id: 'e-edit', title: 'Borrador', startTime: '09:00', endTime: '10:00' });
    const success = vi.spyOn(sileo, 'success');
    const user = userEvent.setup();
    render(<AgendaView profileId={profileId} />);

    await user.click(screen.getByRole('button', { name: /editar borrador/i }));
    const title = screen.getByPlaceholderText(/título del evento/i);
    await user.clear(title);
    await user.type(title, 'Versión final');
    fireEvent.change(screen.getByLabelText(/hora de término/i), { target: { value: '11:00' } });
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    expect(StorageService.getEvents(profileId)).toEqual([
      expect.objectContaining({ id: 'e-edit', title: 'Versión final', endTime: '11:00' }),
    ]);
    expect(success).toHaveBeenCalledWith({ title: 'Evento actualizado' });
  });

  it('avisa que editar una serie afecta todas las repeticiones', async () => {
    seed({ id: 'r1', title: 'Serie', startTime: '18:00', endTime: '19:00', recurrence: { daysOfWeek: [new Date().getDay()] } });
    const user = userEvent.setup();
    render(<AgendaView profileId={profileId} />);

    await user.click(screen.getByRole('button', { name: /editar serie/i }));
    expect(screen.getByText('Los cambios se aplican a todas las repeticiones.')).toBeInTheDocument();
  });

  it('elimina un evento', async () => {
    seed({ id: 'e-del', title: 'Almuerzo de trabajo', startTime: '13:00', category: 'trabajo' });
    const success = vi.spyOn(sileo, 'success');
    const user = userEvent.setup();
    render(<AgendaView profileId={profileId} />);

    await user.click(screen.getByRole('button', { name: /eliminar almuerzo de trabajo/i }));

    expect(screen.queryByText('Almuerzo de trabajo')).not.toBeInTheDocument();
    expect(StorageService.getEvents(profileId)).toEqual([]);
    expect(success).toHaveBeenCalledWith({ title: 'Evento eliminado' });
  });

  // Técnica: partición de equivalencia sobre horas inválidas.
  it('rechaza un término anterior al inicio sin guardar', async () => {
    const error = vi.spyOn(sileo, 'error');
    const user = userEvent.setup();
    render(<AgendaView profileId={profileId} />);

    await user.type(screen.getByPlaceholderText(/título del evento/i), 'Mal horario');
    fireEvent.change(screen.getByLabelText(/hora de inicio/i), { target: { value: '10:00' } });
    fireEvent.change(screen.getByLabelText(/hora de término/i), { target: { value: '09:00' } });
    await user.click(screen.getByRole('button', { name: /agregar evento/i }));

    expect(error).toHaveBeenCalledWith({ title: 'La hora de término debe ser posterior a la de inicio' });
    expect(StorageService.getEvents(profileId)).toEqual([]);
  });

  it('crea un evento recurrente semanal que aparece hoy', async () => {
    const user = userEvent.setup();
    const todayDow = new Date().getDay();
    const dayName = WEEK_DAYS.find(d => d.value === todayDow)!.long;
    render(<AgendaView profileId={profileId} />);

    await user.type(screen.getByPlaceholderText(/título del evento/i), 'Gimnasio');
    await user.click(screen.getByRole('checkbox', { name: /repetir semanalmente/i }));
    await user.click(screen.getByRole('checkbox', { name: dayName }));
    await user.click(screen.getByRole('button', { name: /agregar evento/i }));

    expect(StorageService.getEvents(profileId)[0].recurrence).toEqual({ daysOfWeek: [todayDow] });
    expect(dayList().getByText('Gimnasio')).toBeInTheDocument();
  });

  it('filtra por categoría y expone el contador en el nombre accesible', async () => {
    seed({ id: 't1', title: 'Informe', startTime: '09:00', category: 'trabajo' });
    seed({ id: 't2', title: 'Reunión equipo', startTime: '10:00', category: 'trabajo' });
    seed({ id: 'p1', title: 'Cine', startTime: '20:00', category: 'personal' });
    const user = userEvent.setup();
    render(<AgendaView profileId={profileId} />);

    expect(screen.getByRole('button', { name: 'Todas, 3 eventos' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'Personal, 1 evento' }));

    expect(screen.getByRole('button', { name: 'Personal, 1 evento' })).toHaveAttribute('aria-pressed', 'true');
    expect(dayList().getByText('Cine')).toBeInTheDocument();
    expect(dayList().queryByText('Informe')).not.toBeInTheDocument();
  });

  it('muestra error y no deja la vista en blanco si el almacenamiento está lleno', async () => {
    vi.spyOn(StorageService, 'saveEvent').mockImplementation(() => {
      throw new DOMException('lleno', 'QuotaExceededError');
    });
    const error = vi.spyOn(sileo, 'error');
    const user = userEvent.setup();
    render(<AgendaView profileId={profileId} />);

    await user.type(screen.getByPlaceholderText(/título del evento/i), 'No cabe');
    await user.click(screen.getByRole('button', { name: /agregar evento/i }));

    expect(error).toHaveBeenCalledWith({ title: SAVE_ERROR });
    expect(screen.getByRole('heading', { name: /agenda de eventos/i })).toBeInTheDocument();
    expect(screen.getByText(/sin eventos programados/i)).toBeInTheDocument();
  });

  it('ir a fecha cambia el día del panel y del formulario', () => {
    render(<AgendaView profileId={profileId} />);

    fireEvent.change(screen.getByLabelText(/ir a fecha/i), { target: { value: '2026-12-25' } });

    expect(screen.getByRole('heading', { name: /eventos del 2026-12-25/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /nuevo evento para 2026-12-25/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/tests/AgendaView.test.tsx`
Expected: FAIL. Todavía no existen el panel `list` "Eventos del día", ni los filtros, ni "Ir a fecha" (por ejemplo `Unable to find role="list"` y `Unable to find an accessible element with the role "button" and name "Todas, 3 eventos"`).

- [ ] **Step 3: Create the palette** — crear `src/components/agenda/fullcalendar-palette.css`:

```css
/* Paleta del tema forma de FullCalendar mapeada a tokens de src/index.css. */
:root {
  --fc-forma-primary: var(--color-primary);
  --fc-forma-primary-over: var(--color-primary-active);
  --fc-forma-primary-down: var(--color-primary-active);
  --fc-forma-primary-foreground: var(--color-on-primary);
  --fc-forma-event: var(--color-primary);
  --fc-forma-event-contrast: var(--color-on-primary);
  --fc-forma-highlight: color-mix(in srgb, var(--color-primary-soft) 35%, transparent);
  --fc-forma-background: var(--color-canvas);
  --fc-forma-foreground: var(--color-ink);
  --fc-forma-faint-foreground: var(--color-muted-soft);
  --fc-forma-muted-foreground: var(--color-muted);
  --fc-forma-border: var(--color-hairline);
  --fc-forma-muted-border: var(--color-hairline-soft);
  --fc-forma-strong-border: var(--color-muted-soft);
}
```

- [ ] **Step 4: Rewrite the CSS module** — reemplazar todo `src/components/AgendaView.module.css` por:

```css
.agendaContainer {
  max-width: 1280px;
  margin: 0 auto;
}

.headingRow {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

.pageTitle {
  font-size: var(--text-title-lg);
  color: var(--color-ink);
  margin: 0;
}

.filterGroup {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filterBtn {
  min-height: 44px;
  padding: 0 16px;
  border: 1px solid var(--color-hairline);
  border-radius: var(--radius-pill);
  background-color: var(--color-surface-soft);
  color: var(--color-body);
  font-size: var(--text-body-sm);
  cursor: pointer;
}

.filterBtn:hover {
  border-color: var(--color-primary-soft);
}

.filterBtnActive {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-on-primary);
}

.layoutGrid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 24px;
  align-items: start;
}

@media (max-width: 1023px) {
  .layoutGrid {
    grid-template-columns: minmax(0, 1fr);
  }
}

.calendarCard {
  min-width: 0;
  padding: 16px;
  background-color: var(--color-surface-card);
  border: 1px solid var(--color-hairline);
  border-radius: var(--radius-lg);
}

/* Objetivo táctil mínimo de 44 px para los botones de FullCalendar (clases internas con hash). */
.calendarCard button {
  min-height: 44px;
}

.eventsPanel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.panelCard {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  background-color: var(--color-surface-card);
  border: 1px solid var(--color-hairline);
  border-radius: var(--radius-lg);
}

.panelTitle {
  margin: 0;
  font-family: var(--font-primary);
  font-size: var(--text-title-sm);
  color: var(--color-ink);
}

.fieldLabel {
  font-size: var(--text-caption);
  font-weight: 500;
  color: var(--color-body);
}

.hint {
  margin: 0;
  font-size: var(--text-caption);
  color: var(--color-muted);
}

.formGroup {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.inputField {
  width: 100%;
  min-height: 44px;
  padding: 8px 12px;
  border: 1px solid var(--color-hairline);
  border-radius: var(--radius-md);
  background-color: var(--color-canvas);
  color: var(--color-ink);
  font-size: var(--text-body-sm);
}

.timeRow {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.checkRow {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  font-size: var(--text-body-sm);
  color: var(--color-body);
  cursor: pointer;
}

.checkRow input {
  width: 20px;
  height: 20px;
  accent-color: var(--color-primary);
}

.repeatFieldset {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 12px;
  border: 1px solid var(--color-hairline);
  border-radius: var(--radius-md);
}

.daysRow {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.dayChip {
  position: relative;
  display: inline-flex;
}

.dayChip input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;
  cursor: pointer;
}

.dayChip span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
  border: 1px solid var(--color-hairline);
  border-radius: var(--radius-pill);
  background-color: var(--color-canvas);
  color: var(--color-body);
  font-size: var(--text-body-sm);
}

.dayChip input:checked + span {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-on-primary);
}

.formActions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.btnPrimary {
  flex: 1;
  min-height: 44px;
  border: none;
  border-radius: var(--radius-md);
  background-color: var(--color-primary);
  color: var(--color-on-primary);
  font-size: var(--text-button);
  cursor: pointer;
}

.btnPrimary:hover {
  background-color: var(--color-primary-active);
}

.btnSecondary {
  min-height: 44px;
  padding: 0 16px;
  border: 1px solid var(--color-hairline);
  border-radius: var(--radius-md);
  background-color: transparent;
  color: var(--color-body);
  font-size: var(--text-button);
  cursor: pointer;
}

.noEvents {
  margin: 0;
  font-size: var(--text-body-sm);
  color: var(--color-muted);
}

.eventsList {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.eventItem {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border: 1px solid var(--color-hairline-soft);
  border-radius: var(--radius-md);
  background-color: var(--color-canvas);
}

.eventSwatch {
  flex-shrink: 0;
  align-self: stretch;
  width: 4px;
  border-radius: var(--radius-pill);
}

.eventInfo {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.eventTitle {
  font-size: var(--text-body-sm);
  font-weight: 500;
  color: var(--color-ink);
  overflow-wrap: anywhere;
}

.eventMeta {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  font-family: var(--font-family-3);
  font-size: var(--text-caption);
  color: var(--color-muted);
}

.iconBtn {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: var(--radius-md);
  background-color: transparent;
  color: var(--color-muted);
  cursor: pointer;
}

.iconBtn:hover {
  background-color: var(--color-surface-soft);
  color: var(--color-ink);
}

.inputField:focus-visible,
.filterBtn:focus-visible,
.iconBtn:focus-visible,
.btnPrimary:focus-visible,
.btnSecondary:focus-visible,
.dayChip input:focus-visible + span {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

- [ ] **Step 5: Rewrite the component** — reemplazar todo `src/components/AgendaView.tsx` por:

```tsx
import React, { useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import type { CalendarRef, DateClickInfo, DateSelectInfo, EventChangeInfo, EventClickInfo } from '@fullcalendar/react';
import formaTheme from '@fullcalendar/react/themes/forma';
import dayGridPlugin from '@fullcalendar/react/daygrid';
import timeGridPlugin from '@fullcalendar/react/timegrid';
import interactionPlugin from '@fullcalendar/react/interaction';
import esLocale from '@fullcalendar/react/locales/es';
import '@fullcalendar/react/skeleton.css';
import '@fullcalendar/react/themes/forma/theme.css';
import './agenda/fullcalendar-palette.css';
import { Pencil, Repeat, Trash2 } from 'lucide-react';
import { sileo } from 'sileo';
import type { AgendaEvent, EventCategory } from '../types';
import { StorageService } from '../services/storage';
import { defaultEndTime, toLocalDateStr, toLocalTimeStr } from '../utils/localDate';
import { MAX_TITLE_LENGTH, emptyEventForm, eventFormFromEvent, validateEventForm } from './agenda/eventForm';
import type { EventFormState } from './agenda/eventForm';
import {
  CATEGORIES,
  CATEGORY_COLORS,
  FILTERS,
  FILTER_LABELS,
  WEEK_DAYS,
  categoryOf,
  countByCategory,
  occursOn,
  toCalendarEvent,
} from './agenda/eventMapping';
import type { CategoryFilter } from './agenda/eventMapping';
import { commitTimeChange, safeDeleteEvent, safeSaveEvent } from './agenda/eventPersistence';
import styles from './AgendaView.module.css';

interface AgendaViewProps {
  profileId: string;
}

const NARROW_QUERY = '(max-width: 767px)';
const WIDE_HEADER = { start: 'prev,next today', center: 'title', end: 'dayGridMonth,timeGridWeek,timeGridDay' };
const NARROW_HEADER = { start: 'prev,next', center: 'title', end: 'today' };
const NARROW_FOOTER = { center: 'dayGridMonth,timeGridWeek,timeGridDay' };

const eventCountLabel = (n: number) => `${n} ${n === 1 ? 'evento' : 'eventos'}`;

const timeLabel = (ev: AgendaEvent) =>
  ev.startTime ? `${ev.startTime}–${ev.endTime ?? defaultEndTime(ev.startTime)}` : 'Todo el día';

// La key fuerza un remontaje limpio al cambiar de perfil: sin estado ni calendario residual.
export const AgendaView: React.FC<AgendaViewProps> = ({ profileId }) => (
  <AgendaBoard key={profileId} profileId={profileId} />
);

const AgendaBoard: React.FC<AgendaViewProps> = ({ profileId }) => {
  const calendarRef = useRef<CalendarRef>(null);
  const [events, setEvents] = useState<AgendaEvent[]>(() => StorageService.getEvents(profileId));
  const [filter, setFilter] = useState<CategoryFilter>('todas');
  const [selectedDate, setSelectedDate] = useState(() => toLocalDateStr(new Date()));
  const [form, setForm] = useState<EventFormState>(() => emptyEventForm(toLocalDateStr(new Date())));
  // ponytail: se evalúa al montar; si se rota el dispositivo, la barra se ajusta al recargar la vista.
  const [isNarrow] = useState(() => window.matchMedia(NARROW_QUERY).matches);

  const reload = () => setEvents(StorageService.getEvents(profileId));
  const update = (patch: Partial<EventFormState>) => setForm(f => ({ ...f, ...patch }));

  const visible = filter === 'todas' ? events : events.filter(ev => categoryOf(ev) === filter);
  const counts = countByCategory(events);
  const dayEvents = visible
    .filter(ev => occursOn(ev, selectedDate))
    .sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? ''));

  const selectDay = (date: string, patch: Partial<EventFormState> = {}) => {
    setSelectedDate(date);
    setForm({ ...emptyEventForm(date), ...patch });
  };

  const handleDateClick = (info: DateClickInfo) => {
    const date = toLocalDateStr(info.date);
    if (info.allDay) {
      selectDay(date);
      return;
    }
    const startTime = toLocalTimeStr(info.date);
    selectDay(date, { startTime, endTime: defaultEndTime(startTime) });
  };

  const handleSelect = (info: DateSelectInfo) => {
    const date = toLocalDateStr(info.start);
    if (info.allDay || toLocalDateStr(info.end) !== date) {
      selectDay(date);
      return;
    }
    selectDay(date, { startTime: toLocalTimeStr(info.start), endTime: toLocalTimeStr(info.end) });
  };

  const handleEventClick = (info: EventClickInfo) => {
    const ev = events.find(e => e.id === info.event.id);
    if (!ev) return;
    setSelectedDate(info.event.start ? toLocalDateStr(info.event.start) : ev.date);
    setForm(eventFormFromEvent(ev));
  };

  const handleEventChange = (info: EventChangeInfo) => {
    const ev = events.find(e => e.id === info.event.id);
    if (!ev) {
      info.revert();
      return;
    }
    commitTimeChange(ev, { start: info.event.start, end: info.event.end, allDay: info.event.allDay, revert: info.revert });
    reload();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateEventForm(form, profileId);
    if (!result.ok) {
      sileo.error({ title: result.error });
      return;
    }
    if (!safeSaveEvent(result.event)) {
      reload();
      return;
    }
    sileo.success({ title: form.editingId ? 'Evento actualizado' : 'Evento agendado con éxito' });
    selectDay(selectedDate);
    reload();
  };

  const handleDelete = (ev: AgendaEvent) => {
    if (!safeDeleteEvent(profileId, ev.id)) return;
    sileo.success({ title: 'Evento eliminado' });
    if (form.editingId === ev.id) selectDay(selectedDate);
    reload();
  };

  const handleGoToDate = (value: string) => {
    if (!value) return;
    selectDay(value);
    calendarRef.current?.getApi().gotoDate(value);
  };

  const toggleDay = (day: number) =>
    update({
      daysOfWeek: form.daysOfWeek.includes(day) ? form.daysOfWeek.filter(d => d !== day) : [...form.daysOfWeek, day],
    });

  return (
    <div className={styles.agendaContainer}>
      <div className={styles.headingRow}>
        <h2 className={styles.pageTitle}>Agenda de eventos</h2>
        <div className={styles.filterGroup} role="group" aria-label="Filtrar por categoría">
          {FILTERS.map(f => (
            <button
              key={f}
              type="button"
              className={`${styles.filterBtn} ${filter === f ? styles.filterBtnActive : ''}`}
              aria-pressed={filter === f}
              aria-label={`${FILTER_LABELS[f]}, ${eventCountLabel(counts[f])}`}
              onClick={() => setFilter(f)}
            >
              {FILTER_LABELS[f]} ({counts[f]})
            </button>
          ))}
        </div>
      </div>

      <div className={styles.layoutGrid}>
        <div className={styles.calendarCard}>
          <FullCalendar
            ref={calendarRef}
            plugins={[formaTheme, dayGridPlugin, timeGridPlugin, interactionPlugin]}
            locale={esLocale}
            firstDay={1}
            initialView={isNarrow ? 'timeGridDay' : 'dayGridMonth'}
            initialDate={selectedDate}
            headerToolbar={isNarrow ? NARROW_HEADER : WIDE_HEADER}
            footerToolbar={isNarrow ? NARROW_FOOTER : false}
            height="auto"
            editable
            selectable
            nowIndicator
            dayMaxEvents
            events={visible.map(toCalendarEvent)}
            dateClick={handleDateClick}
            select={handleSelect}
            eventClick={handleEventClick}
            eventDrop={handleEventChange}
            eventResize={handleEventChange}
          />
        </div>

        <aside className={styles.eventsPanel} aria-label="Día seleccionado">
          <div className={styles.panelCard}>
            <div className={styles.formGroup}>
              <label className={styles.fieldLabel} htmlFor="agenda-goto">
                Ir a fecha
              </label>
              <input
                id="agenda-goto"
                type="date"
                className={styles.inputField}
                value={selectedDate}
                onChange={e => handleGoToDate(e.target.value)}
              />
            </div>
            <h3 className={styles.panelTitle}>Eventos del {selectedDate}</h3>
            {dayEvents.length === 0 ? (
              <p className={styles.noEvents}>Sin eventos programados</p>
            ) : (
              <ul className={styles.eventsList} aria-label="Eventos del día">
                {dayEvents.map(ev => (
                  <li key={ev.id} className={styles.eventItem}>
                    <span
                      className={styles.eventSwatch}
                      style={{ backgroundColor: CATEGORY_COLORS[categoryOf(ev)].color }}
                      aria-hidden="true"
                    />
                    <div className={styles.eventInfo}>
                      <span className={styles.eventTitle}>{ev.title}</span>
                      <span className={styles.eventMeta}>
                        <span>{`${timeLabel(ev)} · ${FILTER_LABELS[categoryOf(ev)]}`}</span>
                        {ev.recurrence && (
                          <span>
                            <Repeat size={12} aria-hidden="true" /> Se repite
                          </span>
                        )}
                      </span>
                    </div>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      aria-label={`editar ${ev.title}`}
                      onClick={() => setForm(eventFormFromEvent(ev))}
                    >
                      <Pencil size={16} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      aria-label={`eliminar ${ev.title}`}
                      onClick={() => handleDelete(ev)}
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <form
            className={styles.panelCard}
            onSubmit={handleSubmit}
            aria-label={form.editingId ? 'Editar evento' : 'Nuevo evento'}
          >
            <h3 className={styles.panelTitle}>
              {form.editingId ? 'Editar evento' : `Nuevo evento para ${form.date}`}
            </h3>
            {form.editingId && form.repeatWeekly && (
              <p className={styles.hint}>Los cambios se aplican a todas las repeticiones.</p>
            )}

            <div className={styles.formGroup}>
              <label className={styles.fieldLabel} htmlFor="agenda-title">
                Título
              </label>
              <input
                id="agenda-title"
                type="text"
                className={styles.inputField}
                placeholder="Título del evento"
                maxLength={MAX_TITLE_LENGTH}
                value={form.title}
                onChange={e => update({ title: e.target.value })}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.fieldLabel} htmlFor="agenda-date">
                Fecha
              </label>
              <input
                id="agenda-date"
                type="date"
                className={styles.inputField}
                value={form.date}
                onChange={e => update({ date: e.target.value })}
                required
              />
            </div>

            <label className={styles.checkRow}>
              <input type="checkbox" checked={form.allDay} onChange={e => update({ allDay: e.target.checked })} />
              Todo el día
            </label>

            {!form.allDay && (
              <div className={styles.timeRow}>
                <div className={styles.formGroup}>
                  <label className={styles.fieldLabel} htmlFor="agenda-start">
                    Hora de inicio
                  </label>
                  <input
                    id="agenda-start"
                    type="time"
                    className={styles.inputField}
                    value={form.startTime}
                    onChange={e => update({ startTime: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.fieldLabel} htmlFor="agenda-end">
                    Hora de término
                  </label>
                  <input
                    id="agenda-end"
                    type="time"
                    className={styles.inputField}
                    value={form.endTime}
                    onChange={e => update({ endTime: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className={styles.formGroup}>
              <label className={styles.fieldLabel} htmlFor="agenda-category">
                Categoría
              </label>
              <select
                id="agenda-category"
                className={styles.inputField}
                value={form.category}
                onChange={e => update({ category: e.target.value as EventCategory })}
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>
                    {FILTER_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>

            <label className={styles.checkRow}>
              <input
                type="checkbox"
                checked={form.repeatWeekly}
                onChange={e => update({ repeatWeekly: e.target.checked })}
              />
              Repetir semanalmente
            </label>

            {form.repeatWeekly && (
              <fieldset className={styles.repeatFieldset}>
                <legend className={styles.fieldLabel}>Días de repetición</legend>
                <div className={styles.daysRow}>
                  {WEEK_DAYS.map(d => (
                    <label key={d.value} className={styles.dayChip}>
                      <input
                        type="checkbox"
                        aria-label={d.long}
                        checked={form.daysOfWeek.includes(d.value)}
                        onChange={() => toggleDay(d.value)}
                      />
                      <span aria-hidden="true">{d.short}</span>
                    </label>
                  ))}
                </div>
                <label className={styles.fieldLabel} htmlFor="agenda-until">
                  Repetir hasta (opcional)
                </label>
                <input
                  id="agenda-until"
                  type="date"
                  className={styles.inputField}
                  min={form.date}
                  value={form.until}
                  onChange={e => update({ until: e.target.value })}
                />
              </fieldset>
            )}

            <div className={styles.formActions}>
              <button type="submit" className={styles.btnPrimary}>
                {form.editingId ? 'Guardar cambios' : 'Agregar evento'}
              </button>
              {form.editingId && (
                <button type="button" className={styles.btnSecondary} onClick={() => selectDay(selectedDate)}>
                  Cancelar edición
                </button>
              )}
            </div>
          </form>
        </aside>
      </div>
    </div>
  );
};
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm exec vitest run src/tests/AgendaView.test.tsx`
Expected: PASS (13 tests).

- [ ] **Step 7: Run the full suite, types and lint**

Run: `pnpm exec vitest run && pnpm exec tsc -b && pnpm lint`
Expected: todas las suites en verde (incluidas `routes.test.tsx` y `App.test.tsx`, que montan la Agenda por ruta), `tsc` sin errores y `eslint` sin errores.

- [ ] **Step 8: Commit**

```bash
git add src/components/AgendaView.tsx src/components/AgendaView.module.css src/components/agenda/fullcalendar-palette.css src/tests/AgendaView.test.tsx
git commit -m ":sparkles: feat(agenda): integrar fullcalendar con vistas mes semana y dia" -m "Agrega edicion por formulario como alternativa al arrastre (WCAG 2.5.7), filtro por categoria con contador, panel del dia, recurrencia semanal y manejo de almacenamiento lleno."
```

---

### Task 7: Verificación integral y medición

**Files:** ninguno, salvo que la verificación encuentre defectos. Cada fix es un ciclo TDD propio con su commit `:bug: fix(agenda): …`.

**Interfaces:**
- Consumes: la rama completa.
- Produces: números de bundle y checklist manual para la descripción del merge.

- [ ] **Step 1: Build and measure**

```bash
pnpm build
for f in dist/assets/*.js dist/assets/*.css; do printf "%7d gz  %s\n" $(gzip -c "$f" | wc -c) "$(basename $f)"; done | sort -rn | head -8
grep -oE '(src|href)="\./assets/[^"]+"' dist/index.html | sed 's/.*assets\///;s/"//' | while read f; do printf "%7d %s\n" $(gzip -c dist/assets/$f | wc -c) $f; done
```

Expected:
- el build termina sin errores;
- el chunk `AgendaView-*.js` queda alrededor de 85 KB gzip (dato del spike: 84.5);
- la carga inicial de `index.html` no cambia respecto de `develop` (~188.5 KB).

Registrar los dos números. Por D1 no bloquean.

- [ ] **Step 2: Manual verification in the browser** — correr `pnpm dev`, abrir la app, entrar con un perfil de prueba e ir a Agenda. Verificar uno por uno:
  1. Mes, Semana y Día cambian desde la barra; "Hoy" vuelve a la fecha actual.
  2. Clic en un día lo selecciona en el panel; arrastrar un rango en Semana precarga inicio y término.
  3. Arrastrar un evento a otra hora y otro día lo persiste: recargar la página y sigue ahí.
  4. Redimensionar un evento en Semana cambia su término y persiste.
  5. Arrastrar un evento para que termine pasada la medianoche lo revierte y muestra el toast "Los eventos deben empezar y terminar el mismo día".
  6. Crear un evento recurrente lunes y miércoles hasta dentro de 3 semanas: aparece solo esos días y hasta esa fecha. Al hacer clic en una ocurrencia, el panel muestra el día de esa ocurrencia (Review Focus 5).
  7. Navegar a la semana del 6 de abril de 2027 (cambio de horario en Chile): la serie de las 18:00 sigue a las 18:00 (Review Focus 3).
  8. DevTools a 320 px de ancho: no hay scroll horizontal de página; la barra del calendario muestra las vistas en el pie; un título de 120 caracteres sin espacios no desborda el panel (Review Focus 4).
  9. Solo teclado: Tab recorre filtros, barra, "Ir a fecha", formulario y botones editar/eliminar, con foco visible en todos.
  10. Lighthouse → Accessibility en la vista Agenda: sin errores. Anotar el puntaje.
  11. Colores por categoría visibles en los eventos y texto legible.

Si un punto falla, abrir un ciclo TDD (test que reproduce, fix, suite completa) y hacer un commit `:bug: fix(agenda): <qué>`. Si no es automatizable (visual), describir el fix en el cuerpo del commit.

- [ ] **Step 3: Final gate**

Run: `pnpm exec vitest run && pnpm exec tsc -b && pnpm lint && pnpm build`
Expected: todo en verde.

- [ ] **Step 4: Hand off** — usar superpowers:finishing-a-development-branch. El destino es `develop` con `git merge --no-ff feature/agenda-fullcalendar`, local; el push solo con aprobación (§12). La descripción del merge incluye los números del Step 1 y el resultado del checklist del Step 2.
