# Vista de Área Integrada, Dashboard Stitch e Integraciones Stitch — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar en Espiralia el Dashboard completo con aforismo y 4 accesos rápidos, el sembrado de las 3 áreas clave con datos contextuales, la vista de área 100% integrada (Mini-Agenda + To-Do + Notas + Vínculos) y la pantalla completa de Stitch **"Espiralia — Integraciones Google Calendar, Gmail & .ics"** con exportación/importación `.ics`, atajos de acción a Google Calendar Web y plantillas de correo Gmail.

**Architecture:** Módulos desacoplados en React 19 y TypeScript sobre persistencia 100% cliente (`localStorage` + `IndexedDB`), con servicio utilitario `IcsService` para parseo y serialización RFC 5545, extensión de `TodoView` con el workspace unificado de 3 columnas para áreas activas, y `IntegrationsView` basada fielmente en la maqueta Stitch `bbf7cc7b4e1746069c003722927828b3`.

**Tech Stack:** React 19.2, TypeScript 5.8, Lucide React, Sileo (notificaciones accesibles), CSS Modules con tokens oficiales de `src/index.css`, Vitest 3 + Testing Library React 16.

**Spec:** `docs/superpowers/specs/2026-10-16-areas-dashboard-integrations-design.md`  
**Referencia visual Stitch:** `projects/2198597521553671013/screens/bbf7cc7b4e1746069c003722927828b3`

## Global Constraints

- 100% ejecución en cliente: sin servidores backend, sin bases de datos remotas y sin OAuth en la nube (`ERS.md`).
- Aislamiento estricto de datos particionados por `profileId` en `localStorage` (OWASP A01, AGENTS.md §10).
- Estilos exclusivamente con CSS Modules (`*.module.css`) y consumo de variables CSS de `src/index.css`. Prohibido Tailwind.
- Accesibilidad WCAG 2.2 AA: contraste ≥ 4.5:1, touch targets ≥ 44 px, soporte completo para teclado y lectores de pantalla.
- Convención de commits: Conventional Commits con Gitmoji en español sin firmas ni trailers de IA (AGENTS.md §11).
- Pruebas exclusivamente en `src/tests/` (AGENTS.md §3 y §7).

## Review Focus

1. **Migración de perfiles existentes**: un perfil previo con áreas antiguas (`Trabajo`) no debe perder tareas ni sufrir fallas de render; las nuevas áreas se agregan sin eliminar las creadas por el usuario.
2. **Archivo .ics malformado o con zonas horarias ambiguas**: el parser no debe lanzar excepciones no capturadas al recibir fechas inválidas o contenido truncado; debe descartar entradas corruptas y notificar al usuario.
3. **Áreas vacías sin eventos ni notas**: al abrir un área temática sin contenido previo, las columnas deben mostrar estados vacíos accesibles con llamadas claras a la acción ("+ Nota", "+ Evento").
4. **Seguridad en enlaces externos**: los accesos directos a Google Calendar (`action=TEMPLATE`) y Gmail (`mailto:`) deben emplear `target="_blank"` y `rel="noopener noreferrer"` evitando ataques de reverse tabnabbing.
5. **Responsividad en pantallas móviles (320px–480px)**: la cuadrícula de 4 accesos rápidos, la vista unificada de 3 columnas y el bento grid de Integraciones deben apilarse en una sola columna fluida sin provocar desbordamiento horizontal.

---

### Task 1: Sembrado de Áreas Clave y Datos Contextuales Iniciales

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/services/storage.ts`
- Test: `src/tests/areaSeeding.test.ts`

**Interfaces:**
- Consumes: `Area`, `TodoItem`, `Note`, `LinkItem` de `src/types`
- Produces: `DEFAULT_AREAS` actualizado (`Estudios`, `Personal`, `Universidad`, `General`) y función `seedAreaSampleData(profileId: string)` en `StorageService` para perfiles nuevos.

- [ ] **Step 1: Escribir el test que falla para el sembrado de áreas clave**

```typescript
// src/tests/areaSeeding.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { StorageService } from '../services/storage';

describe('Area Seeding', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('siembra las 3 áreas clave solicitadas (Estudios, Personal, Universidad) más General', () => {
    const areas = StorageService.getAreas('p-test');
    const names = areas.map(a => a.name);
    expect(names).toContain('Estudios');
    expect(names).toContain('Personal');
    expect(names).toContain('Universidad');
  });

  it('siembra datos contextuales de inicio para el perfil nuevo', () => {
    StorageService.seedInitialProfileData('p-test');
    const todos = StorageService.getTodos('p-test');
    const links = StorageService.getLinks('p-test');
    expect(todos.some(t => t.title.includes('Conaset'))).toBe(true);
    expect(links.some(l => l.url.includes('conaset.cl'))).toBe(true);
  });
});
```

- [ ] **Step 2: Ejecutar test para verificar que falla**

Run: `pnpm exec vitest run src/tests/areaSeeding.test.ts`  
Expected: FAIL porque `DEFAULT_AREAS` contiene `Trabajo`/`Estudio` y `seedInitialProfileData` no existe.

- [ ] **Step 3: Implementar actualización de `DEFAULT_AREAS` y `seedInitialProfileData` en `src/services/storage.ts`**

Actualizar lista de áreas por defecto con `Estudios`, `Personal`, `Universidad`, `General`. Añadir método idempotente `seedInitialProfileData(profileId: string)` que crea tareas de ejemplo para Conaset y postulaciones 2026-II, nota de bitácora terapéutica y enlace a `conaset.cl` solo si las colecciones están vacías.

- [ ] **Step 4: Ejecutar test para verificar que pasa**

Run: `pnpm exec vitest run src/tests/areaSeeding.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/types/index.ts src/services/storage.ts src/tests/areaSeeding.test.ts
git commit -m ":sparkles: feat(storage): actualizar áreas clave y sembrado contextual inicial"
```

---

### Task 2: Dashboard con Aforismo Motivacional y 4 Accesos Instantáneos

**Files:**
- Modify: `src/components/DashboardView.tsx`
- Modify: `src/components/DashboardView.module.css`
- Modify: `src/components/AppLayout.tsx`
- Test: `src/tests/DashboardView.test.tsx`
- Test: `src/tests/DashboardView.hero.test.tsx`

**Interfaces:**
- Consumes: `DashboardViewProps`, `onNavigate`
- Produces: Banner de aforismo motivacional en el Hero y cuadrícula de 4 botones rápidos ("+ Nueva tarea", "+ Evento agenda", "+ Reflexión", "+ Enlace / Doc").

- [ ] **Step 1: Escribir el test que falla para aforismo y los 4 accesos rápidos**

```typescript
// En src/tests/DashboardView.hero.test.tsx
it('despliega el aforismo motivacional oficial en el hero', () => {
  render(<DashboardView profile={mockProfile} onNavigate={vi.fn()} />);
  expect(screen.getByText(/El orden no es una restricción, es el espacio donde florecen tus ideas y tu calma/i)).toBeInTheDocument();
});

it('despliega los 4 accesos instantáneos requeridos en A un solo clic', () => {
  render(<DashboardView profile={mockProfile} onNavigate={vi.fn()} />);
  expect(screen.getByRole('button', { name: /nueva tarea/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /nuevo evento/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /nueva reflexión|reflexión/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /nuevo enlace|enlace/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Ejecutar test para verificar que falla**

Run: `pnpm exec vitest run src/tests/DashboardView.hero.test.tsx`  
Expected: FAIL por ausencia del aforismo y de los botones de Reflexión y Enlace.

- [ ] **Step 3: Implementar aforismo y 4 botones rápidos en `DashboardView.tsx` y `DashboardView.module.css`**

- Agregar bloque de aforismo en el Hero con estilo editorial y tipografía serif adecuada.
- Ampliar la cuadrícula de accesos rápidos a 4 botones utilizando los iconos `ListPlus`, `CalendarPlus`, `BookOpen` y `LinkIcon`.
- Enlazar eventos para abrir modal de reflexión o navegar a Notas con modo reflexión, y modal de enlace o navegación a Carpetas.

- [ ] **Step 4: Ejecutar tests para verificar que pasan**

Run: `pnpm exec vitest run src/tests/DashboardView.hero.test.tsx src/tests/DashboardView.test.tsx`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/DashboardView.tsx src/components/DashboardView.module.css src/components/AppLayout.tsx src/tests/DashboardView.hero.test.tsx
git commit -m ":sparkles: feat(dashboard): incorporar aforismo motivacional y 4 accesos instantáneos"
```

---

### Task 3: Servicio de Importación y Exportación iCalendar RFC 5545 (`IcsService`)

**Files:**
- Create: `src/services/icsService.ts`
- Test: `src/tests/icsService.test.ts`

**Interfaces:**
- Consumes: `AgendaEvent` de `src/types`
- Produces: `IcsService.exportToIcs(events: AgendaEvent[], options?: { areaName?: string }): string` y `IcsService.parseIcs(content: string, profileId: string): AgendaEvent[]`.

- [ ] **Step 1: Escribir el test que falla para exportación y parseo .ics**

```typescript
// src/tests/icsService.test.ts
import { describe, it, expect } from 'vitest';
import { IcsService } from '../services/icsService';
import type { AgendaEvent } from '../types';

describe('IcsService', () => {
  const sampleEvents: AgendaEvent[] = [
    {
      id: 'ev-1',
      profileId: 'p-1',
      title: 'Práctica de Manejo Conaset',
      date: '2026-10-20',
      startTime: '10:00',
      endTime: '11:30',
      category: 'estudio',
      notes: 'Practicar estacionamiento',
    },
  ];

  it('exporta eventos a formato VCALENDAR válido', () => {
    const ics = IcsService.exportToIcs(sampleEvents);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('SUMMARY:Práctica de Manejo Conaset');
    expect(ics).toContain('DTSTART:20261020T100000');
    expect(ics).toContain('END:VCALENDAR');
  });

  it('permite filtrar la exportación por área o categoría', () => {
    const ics = IcsService.exportToIcs(sampleEvents, { category: 'estudio' });
    expect(ics).toContain('SUMMARY:Práctica de Manejo Conaset');
  });

  it('parsea contenido VCALENDAR a eventos AgendaEvent válidos', () => {
    const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:test-123
SUMMARY:Entrega Portafolio U 2026-II
DTSTART:20261115T090000
DTEND:20261115T100000
DESCRIPTION:Cartas de recomendación
END:VEVENT
END:VCALENDAR`;

    const parsed = IcsService.parseIcs(ics, 'p-1');
    expect(parsed).toHaveLength(1);
    expect(parsed[0].title).toBe('Entrega Portafolio U 2026-II');
    expect(parsed[0].date).toBe('2026-11-15');
    expect(parsed[0].startTime).toBe('09:00');
    expect(parsed[0].profileId).toBe('p-1');
  });
});
```

- [ ] **Step 2: Ejecutar test para verificar que falla**

Run: `pnpm exec vitest run src/tests/icsService.test.ts`  
Expected: FAIL porque `IcsService` no existe.

- [ ] **Step 3: Implementar `IcsService` en `src/services/icsService.ts`**

Desarrollar funciones puras para generar strings compatibles con RFC 5545 y parsear eventos extrayendo fechas ISO y horas locales, sanitizando caracteres especiales (`\n`, comas) y manejando errores con arrays vacíos seguros ante archivos corruptos.

- [ ] **Step 4: Ejecutar test para verificar que pasa**

Run: `pnpm exec vitest run src/tests/icsService.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/icsService.ts src/tests/icsService.test.ts
git commit -m ":sparkles: feat(agenda): agregar servicio IcsService para exportación e importación"
```

---

### Task 4: Vista de Integraciones Stitch ("Espiralia — Integraciones Google Calendar, Gmail & .ics")

**Files:**
- Create: `src/components/IntegrationsView.tsx`
- Create: `src/components/IntegrationsView.module.css`
- Modify: `src/types/index.ts` (`ViewType = ... | 'integrations'`)
- Modify: `src/components/AppLayout.tsx` (añadir ítem 'Integraciones' con icono `Share2`/`Hub` y navegación)
- Modify: `src/routes/index.tsx` (ruta `/integrations`)
- Test: `src/tests/IntegrationsView.test.tsx`

**Interfaces:**
- Consumes: `IcsService`, `StorageService`, `Profile`
- Produces: Vista completa basada en la pantalla Stitch `bbf7cc7b4e1746069c003722927828b3` con:
  1. Hero con badge "Módulo Descentralizado • v4.8 Local-First", chips de área y declaración *Privacy-by-Design*.
  2. Banner de privacidad "Aislamiento Estricto Verificado • 0 bytes transmitidos".
  3. Tarjeta Google Calendar & .ics con:
     - Opción A: Selector de rango, selector de área temáticas y botón de descarga `.ics`.
     - Opción B: Dropzone de importación `.ics` vía FileReader API local.
     - Opción C: Atajos directos a Google Calendar Web vía URI template (`action=TEMPLATE`).
  4. Tarjeta Gmail & Plantillas:
     - Plantilla Universidad 2026 (Justificativo académico/postulación) con trigger `mailto:`.
     - Plantilla Personal (Auto-envío de notas) con trigger `mailto:`.
  5. Tarjeta Auditoría Local: Resumen en vivo de eventos y estado de almacenamiento en cliente.

- [ ] **Step 1: Escribir el test que falla para la vista de integraciones Stitch**

```typescript
// src/tests/IntegrationsView.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IntegrationsView } from '../components/IntegrationsView';
import { StorageService } from '../services/storage';

describe('IntegrationsView', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const profile = { id: 'p-1', name: 'Usuario' };

  it('renderiza la cabecera editorial de Stitch y el banner de privacidad', () => {
    render(<IntegrationsView profile={profile} />);
    expect(screen.getByRole('heading', { name: /integraciones & enlace externo/i })).toBeInTheDocument();
    expect(screen.getByText(/0 bytes transmitidos al exterior/i)).toBeInTheDocument();
  });

  it('despliega las 3 opciones de Google Calendar & iCal (.ics)', () => {
    render(<IntegrationsView profile={profile} />);
    expect(screen.getByText(/generar archivo de exportación/i)).toBeInTheDocument();
    expect(screen.getByText(/importar eventos hacia bóveda local/i)).toBeInTheDocument();
    expect(screen.getByText(/atajos directos "a un solo clic"/i)).toBeInTheDocument();
  });

  it('despliega la sección de Gmail con plantillas mailto seguras', () => {
    render(<IntegrationsView profile={profile} />);
    expect(screen.getByText(/gmail & plantillas/i)).toBeInTheDocument();
    const draftLink = screen.getByRole('link', { name: /abrir borrador en gmail/i });
    expect(draftLink).toHaveAttribute('href', expect.stringContaining('mailto:'));
  });
});
```

- [ ] **Step 2: Ejecutar test para verificar que falla**

Run: `pnpm exec vitest run src/tests/IntegrationsView.test.tsx`  
Expected: FAIL porque `IntegrationsView` no existe.

- [ ] **Step 3: Implementar `IntegrationsView.tsx`, `IntegrationsView.module.css` e integrarla en `AppLayout` y rutas**

Implementar el componente y estilos reproduciendo la composición de Stitch:
- Paleta warm editorial magenta, canvas suave, tarjetas con bordes finos `var(--color-hairline)`.
- Manejadores de descarga de `.ics` usando `IcsService.exportToIcs`.
- Manejador drag-and-drop y selector de archivo `.ics` con `IcsService.parseIcs` y guardado en `StorageService`.
- Enlaces con `target="_blank"` y `rel="noopener noreferrer"`.
- Registro de auditoría local que muestra el total de eventos persistidos en el perfil.
- Enlazar en `AppLayout.tsx` en `NAV_ITEMS` y en `routes/index.tsx`.

- [ ] **Step 4: Ejecutar test para verificar que pasa**

Run: `pnpm exec vitest run src/tests/IntegrationsView.test.tsx`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/types/index.ts src/components/IntegrationsView.tsx src/components/IntegrationsView.module.css src/components/AppLayout.tsx src/routes/index.tsx src/tests/IntegrationsView.test.tsx
git commit -m ":sparkles: feat(integrations): implementar vista completa de Stitch Integraciones Google Calendar, Gmail e ICS"
```

---

### Task 5: Vista de Área Integrada (To-Do + Mini-Agenda + Notas + Vínculos)

**Files:**
- Create: `src/components/todo/AreaIntegratedWorkspace.tsx`
- Create: `src/components/todo/AreaIntegratedWorkspace.module.css`
- Modify: `src/components/TodoView.tsx`
- Modify: `src/components/TodoView.module.css`
- Test: `src/tests/AreaIntegratedWorkspace.test.tsx`

**Interfaces:**
- Consumes: `Area`, `profileId`, `StorageService`
- Produces: Cuadrícula integrada de 3 columnas activable al seleccionar un área específica (`Estudios`, `Personal`, `Universidad`) que muestra simultáneamente:
  1. Tareas To-Do del área con sus estados y botón "+ Tarea".
  2. Agenda contextual: eventos del área/categoría y botón "+ Agendar".
  3. Notas / Reflexiones del área y enlaces directos con botón "+ Nota".

- [ ] **Step 1: Escribir el test que falla para la vista integrada de área**

```typescript
// src/tests/AreaIntegratedWorkspace.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AreaIntegratedWorkspace } from '../components/todo/AreaIntegratedWorkspace';

describe('AreaIntegratedWorkspace', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const area = { id: 'area-estudios', profileId: 'p-1', name: 'Estudios', color: '#3b82f6', createdAt: '' };

  it('despliega simultáneamente las secciones de Tareas, Agenda Contextual y Notas/Recursos', () => {
    render(<AreaIntegratedWorkspace area={area} profileId="p-1" onNavigateAgenda={() => {}} />);
    expect(screen.getByRole('heading', { name: /tareas de estudios/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /agenda de estudios/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /notas y recursos/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Ejecutar test para verificar que falla**

Run: `pnpm exec vitest run src/tests/AreaIntegratedWorkspace.test.tsx`  
Expected: FAIL porque `AreaIntegratedWorkspace` no existe.

- [ ] **Step 3: Implementar `AreaIntegratedWorkspace` e integrarlo en `TodoView.tsx`**

- Crear `AreaIntegratedWorkspace.tsx` con el layout responsivo de 3 columnas estilo Stitch (`0056f6977f9d4346b9acd687192453f7`).
- Columna 1: Lista de tareas del área con estado interactivo y creación inmediata.
- Columna 2: Eventos contextuales de la agenda filtrados por la categoría/nombre del área con accesos directos a crear evento.
- Columna 3: Notas filtradas por el área activa y enlaces/carpetas asociados.
- En `TodoView.tsx`, cuando `selectedAreaId !== 'todas'`, renderizar el workspace integrado manteniendo la barra superior de selección.

- [ ] **Step 4: Ejecutar tests para verificar que pasan**

Run: `pnpm exec vitest run src/tests/AreaIntegratedWorkspace.test.tsx src/tests/TodoView.test.tsx`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/todo/AreaIntegratedWorkspace.tsx src/components/todo/AreaIntegratedWorkspace.module.css src/components/TodoView.tsx src/components/TodoView.module.css src/tests/AreaIntegratedWorkspace.test.tsx
git commit -m ":sparkles: feat(todo): integrar vista unificada de área con agenda y notas contextuales"
```

---

### Task 6: Verificación Global, Tests de Regresión y Accesibilidad

**Files:**
- Modify: `src/tests/routes.test.tsx` (estabilizar timeout de carga lazy si es necesario)
- Test: Toda la suite `src/tests/`

**Interfaces:**
- Consumes: Todo el sistema integrado
- Produces: 100% de la suite de pruebas en verde y build de producción verificado.

- [ ] **Step 1: Ejecutar la suite completa de tests de Vitest**

Run: `pnpm exec vitest run`  
Expected: 100% passing (300+ tests en verde).

- [ ] **Step 2: Ejecutar validación de tipos y build de producción**

Run: `pnpm build`  
Expected: Build exitoso sin errores de TypeScript ni advertencias de empaquetado.

- [ ] **Step 3: Commit de cierre de integración**

```bash
git commit --allow-empty -m ":white_check_mark: test: verificar suite completa y build de producción para áreas e integraciones"
```
