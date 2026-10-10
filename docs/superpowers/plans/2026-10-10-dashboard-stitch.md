# Dashboard según Stitch (F3) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rediseñar el contenido del Dashboard como la pantalla de Stitch: saludo editorial, atajos, eventos de hoy, tareas críticas, resumen del planner y métricas, solo con datos existentes.

**Architecture:** La lógica de selección y formato va en `src/components/dashboard/dashboardData.ts` (puro y testeable). `DashboardView` se reescribe para orquestar secciones, conserva sus props `{ profile, onNavigate }` y su carga diferida, y reutiliza los dos gráficos sin cambios.

**Tech Stack:** React 19.2, TypeScript, CSS Modules + tokens de `src/index.css`, `lucide-react`, Vitest + Testing Library. Reutiliza `occursOn`, `categoryOf`, `CATEGORY_COLORS` y `FILTER_LABELS` (F1) y `toLocalDateStr`/`addDaysToDateStr` (F1).

**Spec:** `docs/superpowers/specs/2026-10-10-dashboard-stitch-design.md` (aprobado 2026-10-10: el usuario eligió "F3 como está en el spec"; Áreas en F4 y Notas/Enlaces/Documentos con archivos en F6, cada uno con spec propio).

## Global Constraints

- Rama `feature/dashboard-stitch` (ya existe, con el spec committeado). Merge `--no-ff` a `develop`, local y sin push. Nada va a `main`.
- Sin dependencias nuevas. Iconos solo de `lucide-react` (verificados: `Calendar`, `Compass`, `BarChart2`, `Flag`, `CalendarPlus`, `ListPlus`).
- Estilos solo con CSS Modules y tokens de `src/index.css`.
- Prohibido: aforismo, "Áreas temáticas", "Documentos", atajos "Reflexión"/"Enlace", y textos de IndexedDB o cifrado.
- Fechas en hora local (`toLocalDateStr`); prohibido `toISOString()` para derivar fechas.
- WCAG 2.2 AA: objetivos de 44 px o más, foco visible, `<section aria-labelledby>` por bloque y listas `<ul>`.
- Tests solo en `src/tests/`, con la técnica declarada (§7). Commits Gitmoji + Conventional, en español, sin trailers (§11). Alcance `dashboard`.
- Comandos: `pnpm exec vitest run <ruta>`, `pnpm exec vitest run`, `pnpm exec tsc -b`, `pnpm lint` y `pnpm build`.

## Review Focus

1. **`dueDate` no tiene interfaz de edición:** hoy ninguna pantalla asigna `dueDate` (solo existe en `TodoItem`). El bloque de críticos debe verse bien sin fechas (orden estable por inserción) y mostrar la etiqueta solo si existe. Lo cubre el test "críticos sin fecha conservan el orden" de la Task 1.
2. **Evento de todo el día junto a eventos con hora:** aparece primero y su bloque de hora dice "Todo el día", sin romper el ancho del bloque a 320 px. La Task 3 lo verifica a mano.
3. **Saludo según la hora en el borde de las 05:00, 12:00 y 20:00:** lo cubren los valores límite de la Task 1.
4. **Nombre de perfil largo en el saludo a 320 px:** hace wrap sin desbordar (`overflow-wrap: anywhere`). La Task 3 lo verifica a mano.
5. **Completar una tarea crítica desde el Dashboard:** desaparece de "No olvidar" y los chips se actualizan. Lo cubre un test de la Task 2.

---

## File Structure

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `src/components/dashboard/dashboardData.ts` | Crear | `greetingFor`, `todayEventsSorted`, `isCritical`, `criticalTodos`, `dueLabel` |
| `src/tests/dashboardData.test.ts` | Crear | |
| `src/components/DashboardView.tsx` | Reescribir | Secciones del Dashboard |
| `src/components/DashboardView.module.css` | Reescribir | Estilos Stitch |
| `src/tests/DashboardView.test.tsx` | Reescribir | |
| `src/tests/App.test.tsx`, `src/tests/routes.test.tsx` | Modificar | El saludo cambia de "¡Hola, X!" a "<saludo>, X." |

---

### Task 1: Datos puros del Dashboard

**Files:**
- Create: `src/components/dashboard/dashboardData.ts`
- Create: `src/tests/dashboardData.test.ts`

**Interfaces:**
- Consumes:
  - `occursOn(ev: AgendaEvent, dateStr: string): boolean` (`components/agenda/eventMapping.ts`)
  - `addDaysToDateStr(dateStr: string, days: number): string` (`utils/localDate.ts`)
- Produces:
  - `type Greeting = 'Buen día' | 'Buenas tardes' | 'Buenas noches'`
  - `greetingFor(date: Date): Greeting`
  - `todayEventsSorted(events: AgendaEvent[], todayStr: string, limit?: number): AgendaEvent[]` (`limit` por defecto 4)
  - `isCritical(todo: TodoItem): boolean`
  - `criticalTodos(todos: TodoItem[], limit?: number): TodoItem[]` (`limit` por defecto 4)
  - `dueLabel(dueDate: string | undefined, todayStr: string): string | null`

- [ ] **Step 1: Write the failing test** — crear `src/tests/dashboardData.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { criticalTodos, dueLabel, greetingFor, isCritical, todayEventsSorted } from '../components/dashboard/dashboardData';
import type { AgendaEvent, TodoItem } from '../types';

describe('greetingFor', () => {
  // Técnica: valores límite en los cortes 05:00, 12:00 y 20:00.
  it.each([
    [0, 0, 'Buenas noches'],
    [4, 59, 'Buenas noches'],
    [5, 0, 'Buen día'],
    [11, 59, 'Buen día'],
    [12, 0, 'Buenas tardes'],
    [19, 59, 'Buenas tardes'],
    [20, 0, 'Buenas noches'],
  ])('%i:%i → %s', (h, m, expected) => {
    expect(greetingFor(new Date(2026, 9, 10, h, m))).toBe(expected);
  });
});

const ev = (patch: Partial<AgendaEvent> & Pick<AgendaEvent, 'id' | 'title'>): AgendaEvent => ({
  profileId: 'p',
  date: '2026-10-14',
  ...patch,
});

describe('todayEventsSorted', () => {
  // Técnica: partición de equivalencia (único de hoy, serie de hoy, otro día, todo el día) + límite.
  it('filtra hoy, incluye series, pone todo el día primero y ordena por hora', () => {
    const events = [
      ev({ id: 'b', title: 'Once', startTime: '11:00' }),
      ev({ id: 'a', title: 'Nueve', startTime: '09:00' }),
      ev({ id: 'x', title: 'Otro día', date: '2026-10-15', startTime: '08:00' }),
      ev({ id: 'd', title: 'Todo el día' }),
      ev({ id: 's', title: 'Serie', date: '2026-10-07', startTime: '20:00', recurrence: { daysOfWeek: [3] } }),
    ];
    expect(todayEventsSorted(events, '2026-10-14').map(e => e.id)).toEqual(['d', 'a', 'b', 's']);
  });

  it('respeta el límite', () => {
    const events = ['06', '07', '08', '09', '10'].map(h => ev({ id: h, title: h, startTime: `${h}:00` }));
    expect(todayEventsSorted(events, '2026-10-14')).toHaveLength(4);
  });
});

const todo = (patch: Partial<TodoItem> & Pick<TodoItem, 'id'>): TodoItem => ({
  profileId: 'p',
  title: patch.id,
  category: 'General',
  priority: 'alta',
  completed: false,
  createdAt: '2026-10-01',
  ...patch,
});

describe('criticalTodos', () => {
  // Técnica: tabla de decisión (completada × prioridad × fecha).
  it('solo pendientes de prioridad alta', () => {
    const todos = [
      todo({ id: 'alta' }),
      todo({ id: 'media', priority: 'media' }),
      todo({ id: 'hecha', completed: true }),
    ];
    expect(criticalTodos(todos).map(t => t.id)).toEqual(['alta']);
    expect(isCritical(todos[0])).toBe(true);
    expect(isCritical(todos[2])).toBe(false);
  });

  it('ordena por dueDate ascendente y deja sin fecha al final', () => {
    const todos = [
      todo({ id: 'sin' }),
      todo({ id: 'tarde', dueDate: '2026-10-20' }),
      todo({ id: 'pronto', dueDate: '2026-10-12' }),
    ];
    expect(criticalTodos(todos).map(t => t.id)).toEqual(['pronto', 'tarde', 'sin']);
  });

  // Review Focus 1: sin interfaz de fechas, el orden de inserción se conserva.
  it('críticos sin fecha conservan el orden', () => {
    const todos = [todo({ id: 'uno' }), todo({ id: 'dos' }), todo({ id: 'tres' })];
    expect(criticalTodos(todos).map(t => t.id)).toEqual(['uno', 'dos', 'tres']);
  });

  it('respeta el límite', () => {
    const todos = ['a', 'b', 'c', 'd', 'e'].map(id => todo({ id }));
    expect(criticalTodos(todos)).toHaveLength(4);
  });
});

describe('dueLabel', () => {
  // Técnica: valores límite alrededor de hoy.
  it.each([
    [undefined, null],
    ['2026-10-09', 'Vencida'],
    ['2026-10-10', 'Hoy'],
    ['2026-10-11', 'Mañana'],
  ])('%s → %s', (due, expected) => {
    expect(dueLabel(due, '2026-10-10')).toBe(expected);
  });

  it('formatea fechas lejanas en corto es-CL', () => {
    expect(dueLabel('2026-10-17', '2026-10-10')).toMatch(/^17 oct/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/tests/dashboardData.test.ts`
Expected: FAIL con `Failed to resolve import "../components/dashboard/dashboardData"`.

- [ ] **Step 3: Write minimal implementation** — crear `src/components/dashboard/dashboardData.ts`:

```ts
import type { AgendaEvent, TodoItem } from '../../types';
import { occursOn } from '../agenda/eventMapping';
import { addDaysToDateStr } from '../../utils/localDate';

export type Greeting = 'Buen día' | 'Buenas tardes' | 'Buenas noches';

export const greetingFor = (date: Date): Greeting => {
  const h = date.getHours();
  if (h >= 5 && h < 12) return 'Buen día';
  if (h >= 12 && h < 20) return 'Buenas tardes';
  return 'Buenas noches';
};

/** Eventos que ocurren hoy (incluidas series): todo el día primero ('' < 'HH:mm'), luego por hora. */
export const todayEventsSorted = (events: AgendaEvent[], todayStr: string, limit = 4): AgendaEvent[] =>
  events
    .filter(e => occursOn(e, todayStr))
    .sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? ''))
    .slice(0, limit);

export const isCritical = (todo: TodoItem): boolean => !todo.completed && todo.priority === 'alta';

/** Críticos por vencimiento ascendente; sin fecha al final, en orden de inserción (sort estable). */
export const criticalTodos = (todos: TodoItem[], limit = 4): TodoItem[] =>
  todos
    .filter(isCritical)
    .sort((a, b) => {
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return 0;
    })
    .slice(0, limit);

const shortDateFormatter = new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short' });

export const dueLabel = (dueDate: string | undefined, todayStr: string): string | null => {
  if (!dueDate) return null;
  if (dueDate < todayStr) return 'Vencida';
  if (dueDate === todayStr) return 'Hoy';
  if (dueDate === addDaysToDateStr(todayStr, 1)) return 'Mañana';
  const [y, m, d] = dueDate.split('-').map(Number);
  return shortDateFormatter.format(new Date(y, m - 1, d));
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/tests/dashboardData.test.ts`
Expected: PASS (18 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/dashboardData.ts src/tests/dashboardData.test.ts
git commit -m ":sparkles: feat(dashboard): agregar seleccion de eventos de hoy, criticos y saludo por hora"
```

### Task 2: DashboardView con el diseño de Stitch

**Files:**
- Rewrite: `src/tests/DashboardView.test.tsx`
- Rewrite: `src/components/DashboardView.tsx`
- Rewrite: `src/components/DashboardView.module.css`
- Modify: `src/tests/App.test.tsx:51` y `src/tests/routes.test.tsx:47` (texto del saludo)

**Interfaces:**
- Consumes: Task 1; `CATEGORY_COLORS`, `FILTER_LABELS`, `categoryOf` (`agenda/eventMapping`); `toLocalDateStr`; `TaskCompletionChart`; `CategoryDistributionChart`.
- Produces: `DashboardView: React.FC<{ profile: Profile; onNavigate: (view: ViewType) => void }>`, con la misma firma.

- [ ] **Step 1: Write the failing test** — reemplazar todo `src/tests/DashboardView.test.tsx` por:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardView } from '../components/DashboardView';
import { StorageService } from '../services/storage';
import { toLocalDateStr } from '../utils/localDate';
import type { Profile, TodoItem } from '../types';

const profile: Profile = { id: 'p-dash', name: 'Andrés', avatar: 'A', createdAt: '2026-10-09' };

const saveTodo = (patch: Partial<TodoItem> & Pick<TodoItem, 'id' | 'title'>) =>
  StorageService.saveTodo({
    profileId: profile.id,
    category: 'General',
    priority: 'alta',
    completed: false,
    createdAt: '2026-10-09',
    ...patch,
  });

const renderDashboard = (onNavigate = vi.fn()) => {
  render(<DashboardView profile={profile} onNavigate={onNavigate} />);
  return onNavigate;
};

describe('DashboardView', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Técnica: valor límite representativo (09:00 cae en "Buen día").
  it('saluda según la hora y muestra los chips de resumen', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 10, 9, 0));
    saveTodo({ id: 't1', title: 'Crítica uno' });
    saveTodo({ id: 't2', title: 'Crítica dos' });
    saveTodo({ id: 't3', title: 'Normal', priority: 'media' });
    saveTodo({ id: 't4', title: 'Hecha', completed: true });

    renderDashboard();

    expect(screen.getByRole('heading', { level: 2, name: 'Buen día, Andrés.' })).toBeInTheDocument();
    const chips = within(screen.getByRole('list', { name: /resumen/i }));
    expect(chips.getByText('3 pendientes')).toBeInTheDocument();
    expect(chips.getByText('2 críticos')).toBeInTheDocument();
  });

  it('los atajos llevan a To-Do y a Agenda', async () => {
    const user = userEvent.setup();
    const onNavigate = renderDashboard();

    await user.click(screen.getByRole('button', { name: /nueva tarea/i }));
    await user.click(screen.getByRole('button', { name: /nuevo evento/i }));

    expect(onNavigate).toHaveBeenNthCalledWith(1, 'todo');
    expect(onNavigate).toHaveBeenNthCalledWith(2, 'agenda');
  });

  // Técnica: partición de equivalencia (con hora, serie de hoy, otro perfil).
  it('lista los eventos de hoy ordenados, con badge de categoría e incluyendo series', () => {
    const today = toLocalDateStr(new Date());
    StorageService.saveEvent({ id: 'e2', profileId: profile.id, title: 'Reunión', date: today, startTime: '11:00', category: 'trabajo' });
    StorageService.saveEvent({ id: 'e1', profileId: profile.id, title: 'Clase', date: today, startTime: '09:00', category: 'estudio' });
    StorageService.saveEvent({
      id: 's1',
      profileId: profile.id,
      title: 'Gimnasio',
      date: today,
      startTime: '20:00',
      recurrence: { daysOfWeek: [new Date().getDay()] },
    });
    StorageService.saveEvent({ id: 'o1', profileId: 'p-otro', title: 'Ajeno', date: today, startTime: '10:00' });

    renderDashboard();

    const list = within(screen.getByRole('list', { name: /eventos de hoy/i }));
    expect(list.getAllByRole('listitem').map(li => li.textContent)).toEqual([
      expect.stringContaining('Clase'),
      expect.stringContaining('Reunión'),
      expect.stringContaining('Gimnasio'),
    ]);
    expect(list.getByText('Estudio')).toBeInTheDocument();
    expect(screen.queryByText('Ajeno')).not.toBeInTheDocument();
  });

  // Review Focus 5.
  it('muestra solo críticos y completar uno lo persiste y lo saca de la lista', async () => {
    const user = userEvent.setup();
    saveTodo({ id: 'c1', title: 'Pagar arriendo' });
    saveTodo({ id: 'n1', title: 'Leer', priority: 'media' });

    renderDashboard();

    const critical = within(screen.getByRole('list', { name: /no olvidar/i }));
    expect(critical.getByText('Pagar arriendo')).toBeInTheDocument();
    expect(critical.queryByText('Leer')).not.toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: /completar pagar arriendo/i }));

    expect(StorageService.getTodos(profile.id).find(t => t.id === 'c1')?.completed).toBe(true);
    expect(screen.getByText('Nada crítico pendiente')).toBeInTheDocument();
    expect(within(screen.getByRole('list', { name: /resumen/i })).getByText('0 críticos')).toBeInTheDocument();
  });

  it('muestra el planner semanal y los empty states', () => {
    StorageService.savePlanner({
      id: 'b1',
      profileId: profile.id,
      period: 'semanal',
      timeSlot: 'mañana',
      title: 'Bloque de foco',
      priority: 'alta',
      completed: false,
    });

    renderDashboard();

    expect(within(screen.getByRole('list', { name: /planner/i })).getByText('Bloque de foco')).toBeInTheDocument();
    expect(screen.getByText('No hay eventos para hoy')).toBeInTheDocument();
    expect(screen.getByText('Nada crítico pendiente')).toBeInTheDocument();
  });

  it('hidrata los datos de almacenamiento sincronicamente en el render inicial sin flash vacio', () => {
    saveTodo({ id: 't-sync', title: 'Verificacion sincrona CLS' });
    const { container } = render(<DashboardView profile={profile} onNavigate={vi.fn()} />);
    expect(container.textContent).toContain('Verificacion sincrona CLS');
  });

  it('conserva la sección de métricas con ambos gráficos', () => {
    saveTodo({ id: 't-chart', title: 'Tarea con métrica', category: 'Trabajo', completed: true });

    renderDashboard();

    expect(screen.getByRole('heading', { name: /métricas y rendimiento/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/cumplimiento de tareas: 1 de 1 completadas \(100%\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/distribución de actividades por categoría/i)).toBeInTheDocument();
  });

  it('no muestra bloques de features que todavía no existen', () => {
    renderDashboard();
    for (const label of [/aforismo/i, /áreas temáticas/i, /documentos/i, /reflexión/i, /enlace/i, /indexeddb/i, /cifrad/i]) {
      expect(screen.queryByText(label)).not.toBeInTheDocument();
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/tests/DashboardView.test.tsx`
Expected: FAIL en la mayoría de los casos. Por ejemplo: no existe un heading "Buen día, Andrés.", no existe la lista "Resumen" ni la lista "Eventos de hoy". Pasan los de render síncrono, métricas y features inexistentes.

- [ ] **Step 3: Rewrite the component** — reemplazar todo `src/components/DashboardView.tsx` por:

```tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BarChart2, Calendar, CalendarPlus, Compass, Flag, ListPlus } from 'lucide-react';
import type { Profile, AgendaEvent, PlannerBlock, TodoItem, ViewType } from '../types';
import { StorageService } from '../services/storage';
import { toLocalDateStr } from '../utils/localDate';
import { CATEGORY_COLORS, FILTER_LABELS, categoryOf, occursOn } from './agenda/eventMapping';
import { criticalTodos, dueLabel, greetingFor, isCritical, todayEventsSorted } from './dashboard/dashboardData';
import { TaskCompletionChart } from './charts/TaskCompletionChart';
import { CategoryDistributionChart } from './charts/CategoryDistributionChart';
import styles from './DashboardView.module.css';

interface DashboardViewProps {
  profile: Profile;
  onNavigate: (view: ViewType) => void;
}

const longDateFormatter = new Intl.DateTimeFormat('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });

const countLabel = (n: number, singular: string, plural: string) => `${n} ${n === 1 ? singular : plural}`;

export const DashboardView: React.FC<DashboardViewProps> = ({ profile, onNavigate }) => {
  const [events, setEvents] = useState<AgendaEvent[]>(() => StorageService.getEvents(profile.id));
  const [planner, setPlanner] = useState<PlannerBlock[]>(() => StorageService.getPlanner(profile.id));
  const [todos, setTodos] = useState<TodoItem[]>(() => StorageService.getTodos(profile.id));
  const [now] = useState(() => new Date());
  const isFirstMount = useRef(true);

  const loadData = useCallback(() => {
    setEvents(StorageService.getEvents(profile.id));
    setPlanner(StorageService.getPlanner(profile.id));
    setTodos(StorageService.getTodos(profile.id));
  }, [profile.id]);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    loadData();
  }, [loadData]);

  const todayStr = toLocalDateStr(now);
  const todayEvents = todayEventsSorted(events, todayStr);
  const todayEventsTotal = events.filter(e => occursOn(e, todayStr)).length;
  const pendingCount = todos.filter(t => !t.completed).length;
  const criticalCount = todos.filter(isCritical).length;
  const critical = criticalTodos(todos);
  const weekBlocks = planner.filter(b => b.period === 'semanal').slice(0, 4);

  const handleToggleTodo = (id: string) => {
    StorageService.toggleTodo(profile.id, id);
    loadData();
  };

  return (
    <div className={styles.dashboardContainer}>
      <section className={styles.hero} aria-labelledby="dash-greeting">
        <p className={styles.heroDate}>{longDateFormatter.format(now)}</p>
        <h2 id="dash-greeting" className={styles.heroTitle}>
          {greetingFor(now)}, {profile.name}.
        </h2>
        <p className={styles.heroSubtitle}>Aquí está el pulso de tu día y lo que no puede esperar.</p>
        <ul className={styles.heroChips} aria-label="Resumen">
          <li className={styles.chip}>{countLabel(pendingCount, 'pendiente', 'pendientes')}</li>
          <li className={`${styles.chip} ${styles.chipCritical}`}>{countLabel(criticalCount, 'crítico', 'críticos')}</li>
        </ul>
      </section>

      <section className={styles.quickSection} aria-labelledby="dash-quick">
        <h3 id="dash-quick" className={styles.sectionLabel}>
          A un solo clic
        </h3>
        <div className={styles.quickGrid}>
          <button type="button" className={styles.quickBtn} onClick={() => onNavigate('todo')}>
            <span className={`${styles.quickIcon} ${styles.quickIconTask}`} aria-hidden="true">
              <ListPlus size={18} />
            </span>
            <span className={styles.quickText}>
              <span className={styles.quickTitle}>Nueva tarea</span>
              <span className={styles.quickHint}>To-Do inmediato</span>
            </span>
          </button>
          <button type="button" className={styles.quickBtn} onClick={() => onNavigate('agenda')}>
            <span className={`${styles.quickIcon} ${styles.quickIconEvent}`} aria-hidden="true">
              <CalendarPlus size={18} />
            </span>
            <span className={styles.quickText}>
              <span className={styles.quickTitle}>Nuevo evento</span>
              <span className={styles.quickHint}>Horarios y citas</span>
            </span>
          </button>
        </div>
      </section>

      <div className={styles.cardsGrid}>
        <section className={styles.card} aria-labelledby="dash-events">
          <div className={styles.cardHeader}>
            <h3 id="dash-events" className={styles.cardTitle}>
              <Calendar size={18} aria-hidden="true" />
              <span>Eventos de hoy</span>
            </h3>
            <span className={styles.cardMeta}>{countLabel(todayEventsTotal, 'evento', 'eventos')}</span>
          </div>
          {todayEvents.length === 0 ? (
            <p className={styles.emptyNotice}>No hay eventos para hoy</p>
          ) : (
            <ul className={styles.list} aria-label="Eventos de hoy">
              {todayEvents.map(ev => {
                const category = categoryOf(ev);
                return (
                  <li key={ev.id} className={styles.eventRow}>
                    <span className={styles.timeBlock}>{ev.startTime ?? 'Todo el día'}</span>
                    <div className={styles.rowBody}>
                      <span className={styles.rowTitle}>{ev.title}</span>
                      <span
                        className={styles.badge}
                        style={{ backgroundColor: CATEGORY_COLORS[category].color, color: CATEGORY_COLORS[category].textColor }}
                      >
                        {FILTER_LABELS[category]}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <button type="button" className={styles.cardLink} onClick={() => onNavigate('agenda')}>
            Ver agenda completa
          </button>
        </section>

        <section className={styles.card} aria-labelledby="dash-critical">
          <div className={styles.cardHeader}>
            <h3 id="dash-critical" className={styles.cardTitle}>
              <Flag size={18} aria-hidden="true" />
              <span>No olvidar</span>
            </h3>
            <span className={styles.cardMeta}>{countLabel(criticalCount, 'crítico', 'críticos')}</span>
          </div>
          {critical.length === 0 ? (
            <p className={styles.emptyNotice}>Nada crítico pendiente</p>
          ) : (
            <ul className={styles.list} aria-label="No olvidar">
              {critical.map(t => {
                const due = dueLabel(t.dueDate, todayStr);
                return (
                  <li key={t.id} className={styles.criticalRow}>
                    <input
                      type="checkbox"
                      id={`dash-todo-${t.id}`}
                      className={styles.checkbox}
                      aria-label={`completar ${t.title}`}
                      checked={t.completed}
                      onChange={() => handleToggleTodo(t.id)}
                    />
                    <span className={styles.rowTitle}>{t.title}</span>
                    {due && <span className={styles.dueTag}>{due}</span>}
                  </li>
                );
              })}
            </ul>
          )}
          <button type="button" className={styles.cardLink} onClick={() => onNavigate('todo')}>
            Ver todas las tareas
          </button>
        </section>

        <section className={styles.card} aria-labelledby="dash-planner">
          <div className={styles.cardHeader}>
            <h3 id="dash-planner" className={styles.cardTitle}>
              <Compass size={18} aria-hidden="true" />
              <span>Planner de la semana</span>
            </h3>
            <span className={styles.cardMeta}>{countLabel(weekBlocks.length, 'bloque', 'bloques')}</span>
          </div>
          {weekBlocks.length === 0 ? (
            <p className={styles.emptyNotice}>Sin bloques esta semana</p>
          ) : (
            <ul className={styles.list} aria-label="Planner de la semana">
              {weekBlocks.map(b => (
                <li key={b.id} className={styles.plannerRow}>
                  <span className={`${styles.rowTitle} ${b.completed ? styles.rowTitleDone : ''}`}>{b.title}</span>
                  <span className={styles.slotTag}>{b.timeSlot}</span>
                </li>
              ))}
            </ul>
          )}
          <button type="button" className={styles.cardLink} onClick={() => onNavigate('planner')}>
            Ver planner completo
          </button>
        </section>
      </div>

      <section className={styles.metricsSection} aria-labelledby="dash-metrics">
        <h3 id="dash-metrics" className={styles.cardTitle}>
          <BarChart2 size={18} aria-hidden="true" />
          <span>Métricas y Rendimiento</span>
        </h3>
        <div className={styles.metricsGrid}>
          <TaskCompletionChart todos={todos} />
          <CategoryDistributionChart todos={todos} planner={planner} />
        </div>
      </section>
    </div>
  );
};
```

- [ ] **Step 4: Rewrite the styles** — reemplazar todo `src/components/DashboardView.module.css` por:

```css
.dashboardContainer {
  display: flex;
  flex-direction: column;
  gap: 28px;
  max-width: 1280px;
  margin: 0 auto;
}

/* ---------- Saludo ---------- */

.hero {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.heroDate {
  margin: 0;
  font-family: var(--font-family-3);
  font-size: var(--text-caption);
  color: var(--color-muted);
  text-transform: capitalize;
}

.heroTitle {
  margin: 0;
  font-family: var(--font-primary);
  font-size: var(--text-display-md);
  line-height: 1.15;
  color: var(--color-ink);
  overflow-wrap: anywhere;
}

.heroSubtitle {
  margin: 0;
  font-size: var(--text-body-md);
  color: var(--color-body);
}

.heroChips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 4px 0 0;
  padding: 0;
  list-style: none;
}

.chip {
  padding: 6px 12px;
  border: 1px solid var(--color-hairline);
  border-radius: var(--radius-pill);
  background-color: var(--color-surface-card);
  font-family: var(--font-family-3);
  font-size: var(--text-caption);
  color: var(--color-body);
}

.chipCritical {
  border-color: var(--color-error);
  color: var(--color-error);
}

/* ---------- Atajos ---------- */

.quickSection {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sectionLabel {
  margin: 0;
  font-family: var(--font-family-3);
  font-size: var(--text-caption);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-muted);
}

.quickGrid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.quickBtn {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 56px;
  padding: 12px 16px;
  border: 1px solid var(--color-hairline);
  border-radius: var(--radius-lg);
  background-color: var(--color-surface-card);
  color: var(--color-ink);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.quickBtn:hover {
  border-color: var(--color-primary-soft);
}

.quickIcon {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
}

.quickIconTask {
  background-color: var(--color-primary);
  color: var(--color-on-primary);
}

.quickIconEvent {
  background-color: var(--color-accent-teal);
  color: var(--color-ink);
}

.quickText {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.quickTitle {
  font-size: var(--text-body-md);
  font-weight: 600;
}

.quickHint {
  font-family: var(--font-family-3);
  font-size: var(--text-caption);
  color: var(--color-muted);
}

/* ---------- Tarjetas ---------- */

.cardsGrid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
  align-items: start;
}

.card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
  padding: 20px;
  border: 1px solid var(--color-hairline);
  border-radius: var(--radius-lg);
  background-color: var(--color-surface-card);
}

.cardHeader {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.cardTitle {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-family: var(--font-primary);
  font-size: var(--text-title-sm);
  color: var(--color-ink);
}

.cardTitle svg {
  color: var(--color-primary);
}

.cardMeta {
  font-family: var(--font-family-3);
  font-size: var(--text-caption);
  color: var(--color-muted);
}

.list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.eventRow,
.criticalRow,
.plannerRow {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  padding: 8px 10px;
  border: 1px solid var(--color-hairline-soft);
  border-radius: var(--radius-md);
  background-color: var(--color-canvas);
}

.criticalRow {
  box-shadow: inset 3px 0 0 var(--color-error);
}

.timeBlock {
  flex-shrink: 0;
  min-width: 56px;
  font-family: var(--font-family-3);
  font-size: var(--text-caption);
  font-weight: 600;
  color: var(--color-ink);
}

.rowBody {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.rowTitle {
  flex: 1;
  min-width: 0;
  font-size: var(--text-body-sm);
  font-weight: 500;
  color: var(--color-ink);
  overflow-wrap: anywhere;
}

.rowTitleDone {
  color: var(--color-muted);
  text-decoration: line-through;
}

.badge,
.slotTag {
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  font-family: var(--font-family-3);
  font-size: var(--text-caption);
}

.slotTag {
  background-color: var(--color-surface-soft);
  color: var(--color-primary);
  text-transform: capitalize;
}

.dueTag {
  flex-shrink: 0;
  font-family: var(--font-family-3);
  font-size: var(--text-caption);
  font-weight: 600;
  color: var(--color-error);
}

.checkbox {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  accent-color: var(--color-primary);
}

.emptyNotice {
  margin: 0;
  padding: 12px 0;
  font-size: var(--text-body-sm);
  color: var(--color-muted);
}

.cardLink {
  align-self: flex-start;
  min-height: 44px;
  padding: 0 4px;
  border: none;
  background: transparent;
  color: var(--color-primary);
  font-size: var(--text-body-sm);
  font-weight: 600;
  cursor: pointer;
}

.cardLink:hover {
  text-decoration: underline;
}

.quickBtn:focus-visible,
.cardLink:focus-visible,
.checkbox:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* ---------- Métricas ---------- */

.metricsSection {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.metricsGrid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

/* ---------- Responsive ---------- */

@media (min-width: 769px) and (max-width: 1023px) {
  .cardsGrid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .quickGrid,
  .cardsGrid,
  .metricsGrid {
    grid-template-columns: minmax(0, 1fr);
  }

  .heroTitle {
    font-size: var(--text-display-sm);
  }
}
```

- [ ] **Step 5: Update greeting in integration tests** — en `src/tests/App.test.tsx` reemplazar `name: /¡hola, ignacio!/i` por `name: /ignacio/i`; en `src/tests/routes.test.tsx` reemplazar `/¡hola, carolina!/i` por `/carolina\./i`.

- [ ] **Step 6: Run tests to verify they pass**

Run: `pnpm exec vitest run src/tests/DashboardView.test.tsx src/tests/App.test.tsx src/tests/routes.test.tsx`
Expected: PASS.

- [ ] **Step 7: Full gate**

Run: `pnpm exec vitest run && pnpm exec tsc -b && pnpm lint && pnpm build`
Expected: todo en verde.

- [ ] **Step 8: Commit**

```bash
git add src/components/DashboardView.tsx src/components/DashboardView.module.css src/tests/DashboardView.test.tsx src/tests/App.test.tsx src/tests/routes.test.tsx
git commit -m ":sparkles: feat(dashboard): rediseñar el dashboard segun stitch" -m "Saludo editorial por hora, atajos a tarea y evento, eventos de hoy con categoria, criticos con vencimiento, resumen del planner y metricas. Corrige el contador cortado a 320 px."
```

### Task 3: Verificación visual, medición y merge

**Files:** ninguno, salvo fixes. Cada fix es TDD si es testeable, y siempre lleva un commit `:bug: fix(dashboard): …`.

- [ ] **Step 1: Bundle**

```bash
pnpm build
T=0; for f in $(grep -oE '(src|href)="\./assets/[^"]+"' dist/index.html | sed 's/.*assets\///;s/"//'); do s=$(gzip -c dist/assets/$f | wc -c); T=$((T+s)); done; echo "initial gz: $T"
```

Expected: la carga inicial se mantiene en ~142.5 KB gzip (el Dashboard sigue diferido). Registrar el número.

- [ ] **Step 2: Manual** — correr `pnpm dev` con un perfil que tenga eventos de hoy (uno de todo el día, uno con hora y una serie), tareas de prioridad alta y bloques semanales. Revisar a 1440, 900 y 320 px (iframe del mismo origen si la ventana no se redimensiona):
  1. sin scroll horizontal;
  2. los chips hacen wrap;
  3. el bloque "Todo el día" no rompe la fila (Review Focus 2);
  4. un nombre largo en el saludo hace wrap (Review Focus 4);
  5. foco visible en atajos, casillas y "Ver …";
  6. badges de categoría legibles.

- [ ] **Step 3: Final gate**

Run: `pnpm exec vitest run && pnpm exec tsc -b && pnpm lint && pnpm build`
Expected: todo en verde.

- [ ] **Step 4: Merge**

```bash
git checkout develop
git merge --no-ff feature/dashboard-stitch -m ":twisted_rightwards_arrows: chore(dashboard): fusionar dashboard de stitch en develop"
pnpm exec vitest run
git branch -d feature/dashboard-stitch
```

Expected: merge sin conflictos, suite en verde y rama borrada. Sin push.
