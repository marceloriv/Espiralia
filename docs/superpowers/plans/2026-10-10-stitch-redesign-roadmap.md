# Rediseño Stitch + FullCalendar — Plan maestro (roadmap)

> **For agentic workers:** este documento es un plan maestro, no un plan de implementación ejecutable. Cada fase de abajo necesita su propio spec (`docs/superpowers/specs/`) y su propio plan detallado (`docs/superpowers/plans/`) antes de escribir código. No ejecutar fases directamente desde este archivo.

**Goal:** Llevar Espiralia al diseño completo generado en Stitch e integrar FullCalendar v7 en la Agenda, en fases independientes, verificables y sin romper el aislamiento por perfil.

**Architecture:** El trabajo se descompone en 9 fases (F0–F8). F0 fija las decisiones transversales. F1–F5 reestructuran las vistas existentes sobre `localStorage`. F6 introduce IndexedDB y las features nuevas que lo requieren. F7 y F8 se apoyan en F6. Cada fase deja la app desplegable y la suite en verde.

**Tech Stack:** React 19.2, TypeScript, Vite, CSS Modules + tokens de `src/index.css`, Lucide, Vitest + Testing Library, FullCalendar v7 (`@fullcalendar/react`), `temporal-polyfill`.

**Spec:** no hay spec escrito. Las fuentes son la sesión de brainstorming del 2026-10-10 y el proyecto Stitch `projects/2198597521553671013` ("Espiralia"). Cada fase debe producir su propio spec antes de su plan.

## Global Constraints

- Sin backend. Todo dato queda en el navegador y particionado por `profileId` (AGENTS.md §10 A01).
- Estilos solo con CSS Modules y tokens de `src/index.css` / `DESIGN.md`. Nada de Tailwind, nada de CDN de estilos ni de Material Symbols: el HTML de Stitch es referencia visual, no código a copiar.
- Iconos: `lucide-react`, ya instalado. No agregar otra librería de iconos.
- Fuentes actuales: `--font-primary: "Copernicus", "Tiempos Headline", serif`, `--font-family-2: "StyreneB", Inter, sans-serif` y `--font-family-3: "JetBrains Mono"`. Stitch sustituyó por Newsreader; adoptar Newsreader es una decisión de F0 y no se hace en silencio.
- Prohibido mostrar en la UI afirmaciones de seguridad que el código no cumpla: "Cifrado AES", "Encriptación local AES", "Sincronización criptográfica", "IndexedDB activo" mientras se use `localStorage`. Un texto de seguridad solo aparece cuando la fase que lo implementa está en verde.
- Los datos de ejemplo de Stitch ("Valentina", "Sesión Terapéutica", "Dra. Claudia M.", "ansiedad") no entran al código ni a los fixtures de tests.
- Versiones de dependencias nuevas fijadas exactas y con al menos 14 días de publicación al momento de instalar. Para FullCalendar: `@fullcalendar/react@7.1.0` (publicada 2026-09-05); `7.1.1` (2026-10-06) recién cumple el plazo el 2026-10-20.
- Agregar dependencias requiere aprobación explícita (AGENTS.md §12) y `pnpm audit` limpio (§10 A03).
- WCAG 2.2 AA: contraste ≥ 4.5:1, objetivos táctiles ≥ 44 px, operable por teclado, reflow desde 320 px (§17.1).
- Tests solo en `src/tests/`. Cobertura de rama ≥ 80% en la lógica que toque cada fase (§7).
- Commits: Conventional Commits + Gitmoji, en español y sin trailers de agente (§11). Una rama `feature/*` por fase desde `develop` (§11.3).

## Review Focus

1. **Migración de datos existentes:** un perfil con eventos, bloques o tareas guardados con el esquema actual debe abrir sin pantalla blanca y sin perder registros tras F1, F4, F5 y F6. Cada fase que cambie un tipo lleva un test con datos del esquema viejo.
2. **Aislamiento entre perfiles en las vistas nuevas:** el calendario, las notas, los vínculos y la búsqueda de un perfil nunca muestran datos de otro. Cada fase incluye un test con dos perfiles poblados.
3. **Zona horaria y cambio de día:** un evento creado a las 23:30 se ve en el día correcto en las vistas mes, semana y día. Hoy `AgendaView` usa `toISOString()`, que convierte a UTC y puede correr la fecha en Chile (UTC−3/−4).
4. **`QuotaExceededError` y fallos de almacenamiento:** guardar con el almacenamiento lleno muestra un error comprensible y no deja la vista en blanco (§10 A10). Es crítico en F6 por los adjuntos.
5. **Accesibilidad del calendario:** la grilla de FullCalendar debe ser navegable con teclado y anunciar fecha y evento a lectores de pantalla. El arrastre y el redimensionado necesitan una alternativa por formulario (WCAG 2.5.7, movimientos de arrastre).

---

## Hallazgos que motivan el plan

### Pantallas de Stitch (proyecto `2198597521553671013`)

| Pantalla | Screen ID | Estado | Uso recomendado |
|---|---|---|---|
| Dashboard Centralizado | `dcdd99161a134d958aba08d620dd6217` | Sólida | Referencia directa para F3 |
| Agenda & Calendario | `59f6cfe02ea0401fa8307f0e676e79dd` | Sólida | Referencia visual para F1 |
| Planner por Bloques & Prioridades | `101cab70f79e45a192ef8069fada0140` | **Defectuosa**: columnas superpuestas, textos cortados, "To-Do" partido en la barra superior, botón "Nueva Nota" cortado | Corregir en Stitch (`edit_screens`) o rediseñar en F5 antes de usarla |
| To-Do & Áreas Temáticas | `0056f6977f9d4346b9acd687192453f7` | **Defectuosa**: el FAB tapa la lista de documentos, título truncado | Corregir antes de usarla en F4/F6 |

Copias locales temporales (efímeras, se borran con la sesión): `scratchpad/stitch-screens/{dashboard,agenda,planner,todo}.{html,png}`. La fuente durable es el proyecto Stitch: se vuelven a traer con `mcp__stitch__get_screen`.

Elementos que las cuatro pantallas comparten: barra superior (logo, buscador global, pestañas, "Bloquear PIN", "Nueva Nota", avatar) y sidebar ("Acción Rápida", navegación, "Ajustes & PIN", "Bóveda Offline").

### Estado actual del código

- `AgendaEvent`: `{ id, profileId, title, date: 'YYYY-MM-DD', startTime?: 'HH:mm', endTime?: 'HH:mm', category?: EventCategory, notes? }`. Sin recurrencia ni duración.
- `TodoItem`: `completed: boolean`, sin estado intermedio; `category: string` libre.
- `PlannerBlock`: `period: 'semanal' | 'mensual'` + `timeSlot: 'mañana' | 'tarde' | 'noche' | 'meta'`, sin día de la semana.
- `StorageService` (`src/services/storage.ts`): `localStorage` con clave `espiralia_${profileId}_${domain}`. `JSON.parse` envuelto en `try/catch` con fallback `[]`. `deleteProfile` borra en cascada eventos, bloques y tareas.
- Bundle de producción: **~195 KB gzip** en total (vendor-react 79, vendor-toast 46, vendor-charts 44, index 10). §17.1 fija **< 150 KB**, así que el presupuesto **ya está excedido** antes de este plan.

### FullCalendar v7

- `7.0.0` estable desde 2026-06-19; `7.1.0` desde 2026-09-05. Licencia MIT.
- Las vistas e interacción vienen como entrypoints de `@fullcalendar/react`: `/daygrid`, `/timegrid`, `/interaction`, `/list`, `/multimonth`, `/locales-all` y temas `/themes/{breezy,classic,forma,monarch,pulse}`.
- Peer obligatorio: `temporal-polyfill@^1.0.1` (última 1.0.5).
- El core ya no trae CSS. El tema se arma con **class names por props**: cada prop acepta un string o una función que recibe el estado. Esto permite pasar directamente las clases de CSS Modules, que resuelve la preocupación por el "CSS denso".
- Recurrencia: `@fullcalendar/rrule@7.1.0` requiere `rrule@^2.6.0` como peer. Es más peso; ver la decisión D4.

### Resultados del spike F1 (2026-10-10, rama local `spike/fullcalendar`, commit `81d03e8`)

- **Render en jsdom: OK.** Vista mes, locale `es` (`@fullcalendar/react/locales/es`) y recurrencia nativa (`daysOfWeek` + `startTime`/`endTime`) se renderizan en Vitest sin mocks.
- **Peso:** el chunk de `AgendaView` pasa de **3.6 a 84.5 KB gzip** de JS y su CSS de 1.2 a 4.7 KB. El total del bundle pasa de 194.9 a 279.2 KB gzip. FullCalendar queda **solo en el chunk lazy de la Agenda** y no entra en la carga inicial.
- **Carga inicial actual (sin FullCalendar): ~188.5 KB gzip.** `index.html` precarga `vendor-react` (79), `vendor-toast` (46) y `vendor-charts` (44). `vendor-charts` solo lo usa el Dashboard, pero `manualChunks` lo saca del chunk lazy. Es un hallazgo independiente de este plan: el tope de §17.1 ya se incumple por la configuración de chunks.
- **Tema:** `themes/forma` expone unos 15 tokens `--fc-forma-*`. Mapearlos a `src/index.css` cuesta ~15 líneas de CSS (`src/components/agenda/fullcalendar-palette.css` en el spike), contra ~90 props `*Class` para un tema propio.
- `pnpm audit --prod`: sin vulnerabilidades. `pnpm peers check`: sin problemas.

## Decisiones pendientes (F0)

Cada una se resuelve con el usuario antes de abrir la fase que la necesita.

| # | Decisión | Opciones | Recomendación | La necesita |
|---|---|---|---|---|
| D1 | Presupuesto de bundle (§17.1 dice < 150 KB y hoy son ~195 KB) | (a) mantener el tope y recortar; (b) redefinirlo como "chunk inicial < 150 KB" con las vistas cargadas perezosamente | **Decidido 2026-10-10: sin tope por ahora.** Cada fase mide y reporta la carga inicial y su chunk, sin bloquear el merge | F1 |
| D2 | Fuente serif | Copernicus/Tiempos (actual) vs Newsreader (Stitch) | **Decidido 2026-10-10: Copernicus** con Georgia como respaldo (no Newsreader) | F2 |
| D3 | Persistencia | seguir en `localStorage` vs migrar a IndexedDB | `localStorage` hasta F5; IndexedDB en F6, que la exige por los adjuntos | F6 |
| D4 | Recurrencia en la Agenda | recurrencia simple nativa de FullCalendar (`daysOfWeek`, `startRecur`, `endRecur`) vs plugin `rrule` | **Decidido 2026-10-10: nativa simple** (`daysOfWeek`, `startRecur`, `endRecur`); `rrule` solo si se piden reglas RFC 5545 | F1 |
| D5 | Tema base de FullCalendar | tema propio con class names vs partir de `themes/forma` | **Decidido 2026-10-10: `forma` + paleta mapeada a tokens** (resultado del spike: ~15 líneas de CSS vs ~90 props); class props solo donde forma no alcance | F1 |
| D6 | Pantallas defectuosas de Stitch | corregirlas en Stitch vs corregir al implementar | Corregirlas en Stitch con `edit_screens` antes de F4/F5 | F4, F5 |

## Fases

Orden y dependencias:

```
F0 decisiones ─┬─> F1 Agenda/FullCalendar ──┐
               ├─> F2 Layout shell ─────────┼─> F3 Dashboard
               │                            ├─> F4 To-Do estados/áreas
               │                            └─> F5 Planner semanal + metas
               └─> F6 IndexedDB + Notas/Vínculos/Adjuntos ─┬─> F7 Bóveda (export/import + cifrado)
                                                           └─> F8 Búsqueda global
```

F1 y F2 son independientes y pueden ir en paralelo. F3 a F5 dependen de F2 para el aspecto final. F7 y F8 dependen de F6.

### F1 — Agenda con FullCalendar v7

- **Objetivo:** reemplazar la grilla manual de `AgendaView` por FullCalendar, con vistas mes, semana con franja horaria y día; crear, mover y redimensionar eventos; recurrencia simple (según D4).
- **Dentro del alcance:** `src/components/AgendaView.tsx` y su `.module.css`; módulo nuevo `src/components/agenda/` para el mapeo `AgendaEvent` ↔ evento de FullCalendar y las class names del tema; filtro por categoría con contador (diseño Stitch); panel lateral "Día seleccionado".
- **Fuera del alcance:** layout de Stitch (F2) y zonas horarias múltiples (YAGNI: un dispositivo, una zona).
- **Modelo:** `AgendaEvent` pasa a tener `start` y `end` completos y un `recurrence?` opcional. Migración en lectura desde `date` + `startTime` + `endTime`, sin reescribir hasta el próximo guardado; los registros viejos siguen siendo legibles.
- **Dependencias nuevas:** `@fullcalendar/react@7.1.0` y `temporal-polyfill@1.0.5` (más `@fullcalendar/rrule` + `rrule` solo si D4 = rrule).
- **Riesgos:** peso en bundle (D1); conversión de fechas a UTC (Review Focus 3); accesibilidad de la grilla y del arrastre (Review Focus 5); tests de FullCalendar en jsdom, que no calcula layout.
- **Aceptación:**
  - Las tres vistas se renderizan con datos del perfil activo.
  - Crear, mover y redimensionar persiste y sobrevive a una recarga.
  - Cada acción de arrastre tiene una alternativa por formulario.
  - Eventos del esquema viejo se muestran en su día correcto.
  - El test con dos perfiles no filtra datos de uno al otro.
  - El chunk de la Agenda queda medido y reportado.
  - axe sin violaciones.
- **Primer paso:** spike de 1 hora (instalar en una rama desechable, montar el calendario con 3 eventos, medir gzip del chunk y comprobar que Vitest/jsdom lo renderiza) para cerrar D1 y D5 con datos.

### F2 — Layout shell de Stitch

- **Objetivo:** reemplazar `AppLayout` por la estructura de Stitch: barra superior con pestañas, "Bloquear PIN" y avatar; sidebar con navegación y "Ajustes & PIN".
- **Dentro del alcance:** `src/components/AppLayout.tsx` y su CSS; tokens nuevos en `src/index.css` si D2 cambia la fuente; responsive (sidebar colapsable bajo 1024 px y navegación inferior o drawer en móvil).
- **Fuera del alcance:** botones de features inexistentes ("Nueva Nota", "Bóveda Offline", buscador): no se renderizan hasta que exista su fase. Nada de controles muertos.
- **Riesgos:** regresión en `routes.test.tsx` y `AppLayout.test.tsx`; foco y orden de tabulación.
- **Aceptación:** las 4 rutas navegables por teclado; "Bloquear PIN" sigue limpiando la sesión del perfil; reflow sin scroll horizontal desde 320 px.

### F3 — Dashboard rediseñado

- **Objetivo:** saludo editorial, atajos "A un solo clic" (solo los que llevan a features existentes), eventos de hoy y "No olvidar / críticos" derivados de tareas de prioridad alta.
- **Fuera del alcance:** "Áreas temáticas" con progreso (requiere el modelo de áreas de F4); "Documentos & Vínculos" (F6); aforismo del día (contenido sin fuente: preguntar antes de incluirlo).
- **Aceptación:** los datos vienen solo de `StorageService` del perfil activo; los empty states tienen mensaje contextual; los gráficos de `@tanstack/charts` existentes se conservan o se reubican explícitamente.

### F4 — To-Do con estados y áreas (Completada — 2026-10-10)

- **Objetivo:** estados `pendiente | en_progreso | completada` y áreas temáticas como entidad con colores y persistencia, filtros por área y por estado, modal de gestión de áreas, fecha de vencimiento editable en tarjeta y en formulario.
- **Modelo:** `TodoItem.completed` + `TodoItem.status`. Migración transparente en lectura y en guardado. Áreas en `espiralia_${profileId}_areas` sembradas por defecto (`Trabajo`, `Personal`, `Estudio`, `General`) con cascada en `deleteProfile`.
- **Menores de F1–F3 resueltos:** touch target ≥ 44 px en checkboxes de tareas (To-Do y Dashboard), contraste de texto secundario ≥ 4.5:1, formato gramatical de fecha en minúsculas en el saludo del Dashboard ("sábado, 10 de octubre").
- **Aceptación:** 193/193 tests en verde, migración de esquemas legados verificada, build de producción limpio sin errores. Fusionada en `develop`.

### F5 — Planner en grilla semanal + metas (Completada — 2026-10-14)

- **Objetivo:** grilla Lunes–Domingo con bloques por franja y un panel de metas semanales con progreso.
- **Modelo:** `PlannerBlock` gana `dayOfWeek` y `time`, preservando bloques legados en columna "Sin día asignado". Se introduce la entidad `Goal` persistida en `localStorage` con sub-items checklist y cálculo de progreso.
- **Aceptación:** 221/221 tests en verde, scroll horizontal acotado a la grilla semanal, touch targets ≥ 44 px, build limpio en 9.12 KB gzip.

### F6 — IndexedDB + Notas, Vínculos y Adjuntos (Completada — 2026-10-14)

- **Objetivo:** persistencia nativa con IndexedDB (`EspiraliaIDB`) con fallback seguro y Cuaderno digital de Reflexiones (para proceso terapéutico y autorregulación sin límite de longitud), sistema de Carpetas temáticas y guardado de Vínculos/documentos web (licencia clase B, universidad, etc.).
- **Dentro del alcance:** motor `src/services/idb.ts`, extensiones a `StorageService` preservando firmas síncronas con sincronización asíncrona a IDB; vistas `NotesView` y `FoldersView`; modales accesibles `NoteModal`, `FolderModal`, `LinkModal`; rutas `/notes` y `/folders`; integración en `AppLayout` (sidebar y botón "+ Nueva Nota" en cabecera).
- **Aceptación:** 239/239 tests en verde, resiliencia total ante ausencia de IndexedDB (jsdom/modo incógnito), borrado en cascada consistente, build limpio de producción.

### F7 — Bóveda: exportar/importar y cifrado (Completada — 2026-10-15)

- **Objetivo:** respaldo JSON por perfil (derechos ARCO y portabilidad, Ley 21.719, §17.4) e importación con validación de esquema. Cifrado opcional con Web Crypto (AES-GCM, clave derivada con PBKDF2 desde una contraseña del usuario).
- **Seguridad:** sin criptografía propia (§17.2 A.8.24); el import valida todo como input no confiable (§10 A08); `security-review` obligatorio. Recién aquí la UI puede mostrar "cifrado", y solo si está activado.
- **Aceptación:** 249/249 tests en verde, cifrado AES-GCM + PBKDF2 sin dependencias externas, validación estricta de esquemas, restauración sin colisiones y build de producción verificado.

### F8 — Búsqueda global (Completada — 2026-10-15)

- **Objetivo:** el buscador de la barra superior busca en eventos, tareas, bloques, notas y vínculos del perfil activo con coincidencia multi-palabra y normalización de acentos.
- **Fuera del alcance:** búsqueda difusa con librería externa; `filter` + normalización de acentos nativa alcanza para volúmenes locales.
- **Aceptación:** 266/266 tests en verde, atajos accesibles `Ctrl+K` / `⌘K` y `/`, buscador local en memoria multientidad y navegación fluida entre vistas. Cierre total de deuda técnica de layout.

## Estado de herramientas al 2026-10-10

- **Stitch MCP:** registrado con scope user y funcionando. API key rotada tras la sesión del 2026-10-10.
- **codebase-memory-mcp:** instalado en prueba (scope local); recomendación: no adoptarlo (ver `2026-10-10-codebase-memory-mcp-trial.md`).
- **Git Flow (decidido 2026-10-10):** `feature/tanstack-charts-migration` se integra a `develop` con `--no-ff` (local, sin push). Cada fase abre su propia `feature/*` desde `develop` y vuelve a `develop`. Nada pasa a `main` sin un `release/*` pedido explícitamente.

## Deuda técnica registrada

Controles del layout de Stitch que F2 (2026-10-10) dejó fuera a propósito porque la feature que los respalda todavía no existía. **Con la culminación de F8, todos los controles del rediseño editorial han sido completamente implementados y respaldados por tests.**

| Control de Stitch | Ubicación en el diseño | Estado | Nota |
|---|---|---|---|
| Buscador global | Barra superior | **Resuelto (2026-10-15)** | Disparador en cabecera con atajo Ctrl+K conectado a GlobalSearchModal |
| "Nueva Nota" | Barra superior | **Resuelto (2026-10-14)** | Botón "+ Nueva Nota" conectado en cabecera con NoteModal |
| "Acción Rápida" | Sidebar | **Resuelto (2026-10-12)** | Modal rápido de tareas y eventos conectado en layout |
| "Ajustes & PIN" | Sidebar (pie) | **Resuelto (2026-10-12)** | Modal de gestión de PIN y acceso libre con Web Crypto PBKDF2 |
| "Bóveda Offline" | Sidebar (pie) | **Resuelto (2026-10-15)** | Botón accesible en pie de sidebar conectado a VaultModal |
| "Notas Rápidas" | Sidebar | **Resuelto (2026-10-14)** | Enlace "Notas" en navegación conectado a NotesView |
| "Carpetas & Vínculos" | Sidebar | **Resuelto (2026-10-14)** | Enlace "Carpetas" en navegación conectado a FoldersView |
| Pestañas de navegación duplicadas | Barra superior | No se implementan | Decisión de accesibilidad: un solo `<nav>` |

## Siguiente paso

1. Ciclo completo de rediseño Stitch F0–F8 finalizado con 38 suites y 266/266 tests en verde.
2. Build de producción verificado y optimizado.
3. Fusión de `feature/busqueda-global` en `develop` y preparación de release v0.2.0.
