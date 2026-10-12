# Dashboard rediseñado según Stitch — Diseño (F3)

**Fecha:** 2026-10-10
**Rama:** `feature/dashboard-stitch` (desde `develop` 643604b)
**Roadmap:** `docs/superpowers/plans/2026-10-10-stitch-redesign-roadmap.md`, fase F3
**Referencia visual:** pantalla Stitch "Espiralia — Dashboard Centralizado" (`projects/2198597521553671013/screens/dcdd99161a134d958aba08d620dd6217`)
**Decisiones del usuario:** sin aforismo del día (2026-10-10).

## 1. Objetivo

Que el contenido del Dashboard se vea y se organice como la pantalla de Stitch, usando solo datos que la app ya tiene:
- saludo editorial;
- atajos de creación;
- eventos de hoy;
- tareas críticas;
- resumen del planner;
- métricas.

Nada de lo que muestre puede depender de features inexistentes ni afirmar cosas falsas sobre el almacenamiento.

**Criterio de éxito:** una persona con datos en Agenda, Tareas y Planner abre el Dashboard. Ve en un vistazo qué tiene hoy y qué es crítico, puede saltar a crear una tarea o un evento con un clic, y la vista se lee igual de bien a 1440, 900 y 320 px.

## 2. Alcance

**Dentro:**

| Bloque de Stitch | Qué muestra en F3 | Datos |
|---|---|---|
| Saludo editorial | "Buen día", "Buenas tardes" o "Buenas noches" + nombre, fecha local en mono, subtítulo y chips de resumen: "N pendientes" y "N críticos" | perfil, tareas |
| "A un solo clic" | Dos atajos: "+ Nueva tarea" (va a To-Do) y "+ Evento" (va a Agenda) | navegación existente |
| "Eventos de hoy en Agenda" | Hasta 4 eventos de hoy, incluidas las series, ordenados por hora, con bloque de hora en mono, título y badge de categoría con sus colores; "Ver todo" va a Agenda | `occursOn`, `CATEGORY_COLORS`, `FILTER_LABELS` (F1) |
| "No olvidar / Críticos" | Tareas pendientes de prioridad `alta`, ordenadas por `dueDate` (las que no tienen fecha al final), con casilla para completarlas, fecha de vencimiento si existe y acento lateral rojo; "Ver todas" va a To-Do | tareas |
| Resumen del Planner | Se mantiene (Stitch no lo trae, pero son datos propios del usuario): hasta 4 bloques del periodo semanal con su franja, con estilo de tarjeta Stitch | planner |
| Métricas | Los dos gráficos de `@tanstack/charts` que ya existen, en la sección "Métricas y rendimiento" al final | tareas, planner |

**Fuera:**
- **Aforismo del día:** el usuario decidió no incluirlo.
- **"Áreas temáticas clave"** con progreso: necesita el modelo de áreas de F4.
- **"Documentos & Vínculos":** F6.
- **Atajos "+ Reflexión" y "+ Enlace":** F6. Ya están en la deuda técnica como "Acción Rápida".
- **Banner "Almacenamiento local IndexedDB activo 100% privado":** sería falso, la app usa `localStorage`.
- **Cambios en el layout (sidebar y barra superior):** ya están cerrados en F2.

## 3. Arquitectura

```
src/components/
├── DashboardView.tsx            reescrito: orquesta datos y secciones
├── DashboardView.module.css     reescrito
└── dashboard/
    └── dashboardData.ts         NUEVO: funciones puras de selección y formato
```

**`dashboardData.ts`** es puro, sin React:
- `greetingFor(date: Date): 'Buen día' | 'Buenas tardes' | 'Buenas noches'`. Cortes en hora local: de 05:00 a 11:59 "Buen día", de 12:00 a 19:59 "Buenas tardes", el resto "Buenas noches".
- `todayEventsSorted(events: AgendaEvent[], todayStr: string, limit = 4): AgendaEvent[]`. Filtra con `occursOn`, pone primero los de todo el día y después ordena por `startTime`.
- `criticalTodos(todos: TodoItem[], limit = 4): TodoItem[]`. Toma las tareas con `!completed && priority === 'alta'`, ordenadas por `dueDate` ascendente y con las que no tienen fecha al final.
- `dueLabel(dueDate: string | undefined, todayStr: string): string | null`. Devuelve "Vencida", "Hoy", "Mañana", la fecha corta `es-CL` (por ejemplo "18 oct") o `null` si no hay fecha.

**`DashboardView`** mantiene sus props `{ profile, onNavigate }`, de modo que `routes` no cambia, y su carga diferida (F2-A). Sigue leyendo `StorageService` en el render inicial (sin parpadeo vacío, como hoy) y reutiliza `TaskCompletionChart` y `CategoryDistributionChart` sin cambios.

## 4. Diseño visual

Todo con tokens de `src/index.css`:
- **Saludo:** título en `--font-primary` (serif) de tamaño display, y fecha en `--font-family-3` (mono) como etiqueta superior.
- **Tarjetas:** fondo `--color-surface-card`, borde `--color-hairline` y radio `--radius-lg`.
- **Atajos:** tarjetas de 44 px de alto o más, con ícono en una cápsula de color (primary para tarea, teal para evento), título y subtítulo en mono.
- **Eventos de hoy:** bloque de hora en mono a la izquierda y badge de categoría con `CATEGORY_COLORS[categoria].color` de fondo y su `textColor`.
- **Críticos:** `box-shadow: inset 3px 0 0 var(--color-error)` y vencimiento en `--color-error`.

Grilla según ancho:

| Ancho | Saludo y atajos | Eventos / Críticos / Planner | Métricas |
|---|---|---|---|
| 1024 px o más | ancho completo; atajos en 2 columnas | 3 columnas | 2 columnas |
| 769–1023 px | ancho completo; atajos en 2 columnas | 2 columnas (el Planner baja) | 2 columnas |
| 768 px o menos | 1 columna | 1 columna | 1 columna |

**Corrección incluida:** el contador "Completadas" que hoy se corta a 320 px. Los chips de resumen pasan a hacer wrap bajo el saludo, sin columnas fijas.

## 5. Accesibilidad (WCAG 2.2 AA)

- Cada bloque es un `<section>` con `aria-labelledby` apuntando a su `<h3>`. El saludo es el `<h2>` de la vista (el layout ya tiene el `<h1>`).
- Las listas de eventos, críticos y planner son `<ul>`.
- Los atajos son `<button>` con nombre accesible ("Nueva tarea", "Nuevo evento"), objetivo de 44 px o más y foco visible.
- La casilla de completar mantiene la etiqueta `completar <título>`.
- Contraste de 4.5:1 o más en badges (los colores de categoría ya están verificados en F1) y en el texto de vencimiento rojo sobre la tarjeta.
- Los empty states son contextuales: "No hay eventos para hoy", "Nada crítico pendiente" y "Sin bloques esta semana".

## 6. Errores y casos borde

| Caso | Comportamiento |
|---|---|
| Sin datos | Cada bloque muestra su empty state; chips "0 pendientes" y "0 críticos" |
| Más de 4 elementos | Se muestran 4, y "Ver todo" o "Ver todas" lleva a la vista completa |
| Evento recurrente de hoy | Aparece (vía `occursOn`) |
| Tarea crítica vencida | Aparece primero con la etiqueta "Vencida" |
| Nombre de perfil largo | El saludo hace wrap (`overflow-wrap: anywhere`) sin desbordar a 320 px |
| JSON corrupto en almacenamiento | `StorageService` ya devuelve `[]`, sin cambios |
| Cambio de día con la vista abierta | Igual que hoy: la fecha se calcula al montar (limitación ya registrada como menor) |

## 7. Pruebas

En `src/tests/`, con técnica declarada:
- **`dashboardData.test.ts`:**
  - `greetingFor` con valores límite (04:59, 05:00, 11:59, 12:00, 19:59, 20:00 y 00:00);
  - `todayEventsSorted` con partición de equivalencia (único de hoy, serie que cae hoy, de otro día y de todo el día primero) y límite de 4;
  - `criticalTodos` con tabla de decisión (completada o pendiente × prioridad × con o sin fecha);
  - `dueLabel` con valores límite (ayer, hoy, mañana, en 7 días y sin fecha).
- **`DashboardView.test.tsx`**, reescrito y conservando lo que ya cubre:
  - saludo con el nombre y chips con los conteos;
  - los atajos llaman a `onNavigate('todo')` y `onNavigate('agenda')`;
  - eventos de hoy ordenados con badge de categoría, incluida una serie;
  - críticos: solo los de prioridad alta y pendientes, y completar uno desde el Dashboard lo persiste;
  - **dos perfiles: no se mezclan**;
  - los gráficos siguen presentes (los `aria-label` actuales);
  - render síncrono inicial (sin parpadeo vacío);
  - no hay aforismo, áreas, documentos ni textos de IndexedDB o cifrado.

## 8. Criterios de aceptación

1. `pnpm exec vitest run`, `pnpm exec tsc -b`, `pnpm lint` y `pnpm build` en verde.
2. Todos los casos de §7 existen y pasan.
3. Verificación manual en Chrome a 1440, 900 y 320 px:
   - sin scroll horizontal;
   - "Completadas" (o su equivalente) ya no se corta;
   - foco visible en atajos, casillas y enlaces;
   - colores de categoría legibles.
4. La carga inicial no crece: el Dashboard sigue siendo diferido, y el número se registra en el merge.
5. Merge `--no-ff` a `develop`, local y sin push.
