# Planner Semanal de 7 Días y Metas con Progreso — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar el Planner en una grilla semanal de 7 días (Lunes a Domingo) con bloques de enfoque por franja horaria y un panel lateral de Metas Semanales con sub-items tipo checklist y barra de progreso.

**Architecture:** Se extiende el modelo `PlannerBlock` con día de la semana opcional y hora, preservando total retrocompatibilidad para bloques legados en una columna "Sin día asignado". Se introduce la entidad `Goal` persistida en `localStorage` particionada por `profileId` con cascada en `StorageService`. La interfaz se descompone en componentes modulares (`PlannerWeeklyGrid`, `PlannerDayColumn`, `PlannerBlockCard`, `GoalsDrawer`, `GoalCard`) consumiendo tokens oficiales de `src/index.css`.

**Tech Stack:** React 19.2, TypeScript 5.8, Lucide React, Sileo (toasts), CSS Modules, Vitest 3.x, Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-14-planner-weekly-design.md`

## Global Constraints

- 100% en cliente sin backend, particionado por `profileId` en `localStorage` (AGENTS.md §10 A01).
- Estilos aislados con CSS Modules (`*.module.css`) y tokens oficiales de `src/index.css` / `DESIGN.md`. Sin Tailwind ni estilos globales nuevos.
- Sin librerías externas adicionales; iconos solo con `lucide-react`.
- Touch target ≥ 44 px en todos los botones y checkboxes interactivos (WCAG 2.2 AA).
- Contraste de texto y etiquetas ≥ 4.5:1.
- Pruebas exclusivamente en `src/tests/` con Vitest + Testing Library.
- Commits en formato Conventional Commits + Gitmoji en español sin firmas de agente.

## Review Focus

1. **Bloques legados sin `dayOfWeek`:** Al cargar bloques creados con versiones anteriores, se renderizan en la sección accesible "Sin día asignado" sin generar errores de runtime.
2. **Aislamiento estricto de datos:** Bloques y metas creados en `perfil-1` no se filtran ni aparecen en `perfil-2`.
3. **División por cero en métricas:** Semanas con 0 bloques o metas sin sub-items muestran 0% de cumplimiento/progreso de forma segura sin `NaN` o pantalla blanca.
4. **Borrado en cascada consistente:** `StorageService.deleteProfile(profileId)` elimina tanto `espiralia_${profileId}_planner` como `espiralia_${profileId}_goals`.
5. **Accesibilidad y reflow responsivo:** La grilla semanal soporta scroll horizontal interno sin romper el layout en pantallas de 320 px a 1024 px.

---

### Task 1: Modelos de datos y tipos para Planner semanal y Metas

**Files:**
- Modify: `src/types/index.ts:39-49`
- Create: `src/tests/plannerTypes.test.ts`

**Interfaces:**
- Produces: `DayOfWeek`, `PlannerBlock` actualizado (`dayOfWeek?: DayOfWeek`, `time?: string`), `GoalSubItem`, `Goal`.

- [ ] **Step 1: Escribir prueba de validación de tipos e invariantes de datos**

Crear `src/tests/plannerTypes.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import type { PlannerBlock, Goal, DayOfWeek } from '../types';

describe('Planner and Goals Types', () => {
  it('permite definir bloques con día de la semana y bloques legados sin día', () => {
    const modernBlock: PlannerBlock = {
      id: 'pb-1',
      profileId: 'p-1',
      period: 'semanal',
      timeSlot: 'mañana',
      title: 'Foco matutino',
      priority: 'alta',
      completed: false,
      dayOfWeek: 1, // Lunes
      time: '08:00',
    };

    const legacyBlock: PlannerBlock = {
      id: 'pb-legacy',
      profileId: 'p-1',
      period: 'semanal',
      timeSlot: 'tarde',
      title: 'Bloque antiguo',
      priority: 'media',
      completed: true,
    };

    expect(modernBlock.dayOfWeek).toBe(1);
    expect(legacyBlock.dayOfWeek).toBeUndefined();
  });

  it('permite estructurar metas con checklist de sub-items', () => {
    const goal: Goal = {
      id: 'goal-1',
      profileId: 'p-1',
      title: 'Aprobar examen teórico',
      category: 'Metas Académicas',
      period: 'semanal',
      items: [
        { id: 'sub-1', title: 'Módulo 1: Señalética', completed: true },
        { id: 'sub-2', title: 'Módulo 2: Velocidades', completed: false },
      ],
      createdAt: '2026-10-14',
    };

    expect(goal.items).toHaveLength(2);
    expect(goal.items[0].completed).toBe(true);
  });
});
```

- [ ] **Step 2: Ejecutar prueba para verificar fallo o compilación**

Ejecutar: `corepack pnpm exec vitest run src/tests/plannerTypes.test.ts`  
Resultado esperado: Error de TypeScript por tipos no definidos aún.

- [ ] **Step 3: Actualizar `src/types/index.ts`**

Agregar `DayOfWeek`, actualizar `PlannerBlock`, y declarar `GoalSubItem` y `Goal`:
```typescript
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado

export interface PlannerBlock {
  id: string;
  profileId: string;
  period: PlannerPeriod;
  timeSlot: TimeSlot;
  title: string;
  priority: Priority;
  notes?: string;
  completed: boolean;
  dayOfWeek?: DayOfWeek;
  time?: string;
}

export interface GoalSubItem {
  id: string;
  title: string;
  completed: boolean;
}

export interface Goal {
  id: string;
  profileId: string;
  title: string;
  description?: string;
  category?: string;
  period: PlannerPeriod;
  items: GoalSubItem[];
  createdAt: string;
}
```

- [ ] **Step 4: Ejecutar prueba para verificar que pasa**

Ejecutar: `corepack pnpm exec vitest run src/tests/plannerTypes.test.ts`  
Resultado esperado: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/types/index.ts src/tests/plannerTypes.test.ts
git commit -m ":sparkles: feat(types): extender modelo planner con dias y definir metas con subitems"
```

---

### Task 2: Persistencia de Metas y Borrado en Cascada en `StorageService`

**Files:**
- Modify: `src/services/storage.ts`
- Create: `src/tests/plannerStorage.test.ts`

**Interfaces:**
- Consumes: `Goal`, `PlannerBlock` desde `src/types`.
- Produces: `StorageService.getGoals(profileId)`, `StorageService.saveGoal(goal)`, `StorageService.deleteGoal(profileId, id)`, cascada en `deleteProfile(profileId)`.

- [ ] **Step 1: Escribir pruebas unitarias de persistencia y cascada de metas**

Crear `src/tests/plannerStorage.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { StorageService } from '../services/storage';
import type { Goal } from '../types';

describe('StorageService - Goals & Planner persistence', () => {
  const profileA = 'p-alpha';
  const profileB = 'p-beta';

  beforeEach(() => {
    localStorage.clear();
  });

  it('guarda, recupera y elimina metas con aislamiento estricto por perfil', () => {
    const goalA: Goal = {
      id: 'g-1',
      profileId: profileA,
      title: 'Meta Perfil A',
      period: 'semanal',
      items: [{ id: 'sub-1', title: 'Paso 1', completed: false }],
      createdAt: '2026-10-14',
    };

    StorageService.saveGoal(goalA);

    expect(StorageService.getGoals(profileA)).toHaveLength(1);
    expect(StorageService.getGoals(profileB)).toHaveLength(0);

    // Actualizar sub-item
    const updatedGoal = {
      ...goalA,
      items: [{ id: 'sub-1', title: 'Paso 1', completed: true }],
    };
    StorageService.saveGoal(updatedGoal);
    expect(StorageService.getGoals(profileA)[0].items[0].completed).toBe(true);

    // Eliminar meta
    StorageService.deleteGoal(profileA, 'g-1');
    expect(StorageService.getGoals(profileA)).toHaveLength(0);
  });

  it('borra metas y bloques en cascada al eliminar un perfil', () => {
    StorageService.saveGoal({
      id: 'g-cascade',
      profileId: profileA,
      title: 'Meta a borrar',
      period: 'semanal',
      items: [],
      createdAt: '2026-10-14',
    });

    StorageService.savePlanner({
      id: 'pb-cascade',
      profileId: profileA,
      period: 'semanal',
      timeSlot: 'mañana',
      title: 'Bloque a borrar',
      priority: 'alta',
      completed: false,
      dayOfWeek: 1,
    });

    StorageService.deleteProfile(profileA);

    expect(StorageService.getGoals(profileA)).toHaveLength(0);
    expect(StorageService.getPlanner(profileA)).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Ejecutar prueba para verificar fallo**

Ejecutar: `corepack pnpm exec vitest run src/tests/plannerStorage.test.ts`  
Resultado esperado: FAIL por métodos `getGoals`, `saveGoal`, `deleteGoal` inexistentes.

- [ ] **Step 3: Implementar métodos de metas y cascada en `StorageService`**

En `src/services/storage.ts`:
- Agregar clave helper: `private static getGoalsKey(profileId: string): string { return \`espiralia_\${profileId}_goals\`; }`
- Implementar `getGoals(profileId: string): Goal[]` con `getItem` y parseo seguro con fallback `[]`.
- Implementar `saveGoal(goal: Goal): void`.
- Implementar `deleteGoal(profileId: string, id: string): void`.
- Actualizar `deleteProfile(profileId: string): void` para incluir `localStorage.removeItem(this.getGoalsKey(profileId))`.

- [ ] **Step 4: Ejecutar prueba para verificar que pasa**

Ejecutar: `corepack pnpm exec vitest run src/tests/plannerStorage.test.ts`  
Resultado esperado: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/storage.ts src/tests/plannerStorage.test.ts
git commit -m ":sparkles: feat(storage): agregar persistencia y borrado en cascada para metas"
```

---

### Task 3: Componentes de Metas: `GoalCard` y `GoalsDrawer`

**Files:**
- Create: `src/components/planner/GoalCard.tsx`
- Create: `src/components/planner/GoalCard.module.css`
- Create: `src/components/planner/GoalsDrawer.tsx`
- Create: `src/components/planner/GoalsDrawer.module.css`
- Create: `src/tests/GoalsDrawer.test.tsx`

**Interfaces:**
- Consumes: `Goal`, `GoalSubItem`, `StorageService`.
- Produces: `GoalCard` (tarjeta con progreso % y checklist interactivo), `GoalsDrawer` (panel lateral de metas con botón "+ Nueva Meta").

- [ ] **Step 1: Escribir pruebas para `GoalsDrawer` y `GoalCard`**

Crear `src/tests/GoalsDrawer.test.tsx`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GoalsDrawer } from '../components/planner/GoalsDrawer';
import { StorageService } from '../services/storage';
import type { Goal } from '../types';

describe('GoalsDrawer', () => {
  const profileId = 'p-goals-test';

  beforeEach(() => {
    localStorage.clear();
  });

  it('renderiza metas, calcula el porcentaje de progreso y permite alternar sub-items', async () => {
    const user = userEvent.setup();
    const testGoal: Goal = {
      id: 'g-test-1',
      profileId,
      title: 'Avanzar módulos Clase B',
      category: 'Metas Académicas',
      period: 'semanal',
      items: [
        { id: 'sub-1', title: 'Módulo 1: Señales', completed: true },
        { id: 'sub-2', title: 'Módulo 2: Velocidad', completed: false },
      ],
      createdAt: '2026-10-14',
    };
    StorageService.saveGoal(testGoal);

    render(<GoalsDrawer profileId={profileId} onGoalsChange={() => {}} />);

    expect(screen.getByText('Avanzar módulos Clase B')).toBeInTheDocument();
    expect(screen.getByText(/50%/)).toBeInTheDocument();

    const checkbox = screen.getByRole('checkbox', { name: /módulo 2: velocidad/i });
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(screen.getByText(/100%/)).toBeInTheDocument();
  });

  it('permite crear una nueva meta con sub-items', async () => {
    const user = userEvent.setup();
    render(<GoalsDrawer profileId={profileId} onGoalsChange={() => {}} />);

    const openModalBtn = screen.getByRole('button', { name: /\+ nueva meta/i });
    await user.click(openModalBtn);

    const titleInput = screen.getByLabelText(/título de la meta/i);
    await user.type(titleInput, 'Lectura semanal');

    const subItemInput = screen.getByPlaceholderText(/agregar sub-tarea o paso/i);
    await user.type(subItemInput, 'Capítulo 1{enter}');

    const submitBtn = screen.getByRole('button', { name: /guardar meta/i });
    await user.click(submitBtn);

    expect(screen.getByText('Lectura semanal')).toBeInTheDocument();
    expect(screen.getByText('Capítulo 1')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Ejecutar prueba para verificar fallo**

Ejecutar: `corepack pnpm exec vitest run src/tests/GoalsDrawer.test.tsx`  
Resultado esperado: FAIL por módulos no encontrados.

- [ ] **Step 3: Implementar `GoalCard` y `GoalsDrawer`**

- `GoalCard`:
  - Recibe `goal: Goal`, `onToggleSubItem(subId: string)`, `onDeleteGoal(id: string)`.
  - Muestra título, categoría en pill de color, barra de progreso (`width: ${(completed/total)*100}%`), y lista de checkboxes accesibles con touch target ≥ 44 px.
- `GoalsDrawer`:
  - Cabecera con título "Metas Semanales", icono `Target` de Lucide, botón "+ Nueva Meta".
  - Lista de `GoalCard` con empty state contextual ("Sin metas registradas para esta semana").
  - Modal o formulario desplegable accesible para nueva meta con campos de título, categoría y agregado dinámico de sub-items.

- [ ] **Step 4: Ejecutar prueba para verificar que pasa**

Ejecutar: `corepack pnpm exec vitest run src/tests/GoalsDrawer.test.tsx`  
Resultado esperado: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/planner/GoalCard* src/components/planner/GoalsDrawer* src/tests/GoalsDrawer.test.tsx
git commit -m ":sparkles: feat(planner): implementar tarjetas y panel drawer de metas con progreso"
```

---

### Task 4: Tarjetas de Bloque y Columnas de la Grilla Semanal

**Files:**
- Create: `src/components/planner/PlannerBlockCard.tsx`
- Create: `src/components/planner/PlannerBlockCard.module.css`
- Create: `src/components/planner/PlannerDayColumn.tsx`
- Create: `src/components/planner/PlannerDayColumn.module.css`
- Create: `src/tests/PlannerWeeklyGrid.test.tsx`

**Interfaces:**
- Consumes: `PlannerBlock`, `DayOfWeek`, `TimeSlot`.
- Produces: `PlannerBlockCard` (tarjeta individual accesible con franja, hora, título y prioridad), `PlannerDayColumn` (columna de un día con cabecera y botón de adición).

- [ ] **Step 1: Escribir pruebas unitarias para tarjetas y columnas del día**

Crear `src/tests/PlannerWeeklyGrid.test.tsx`:
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlannerBlockCard } from '../components/planner/PlannerBlockCard';
import { PlannerDayColumn } from '../components/planner/PlannerDayColumn';
import type { PlannerBlock } from '../types';

describe('PlannerWeeklyGrid components', () => {
  it('renderiza tarjeta de bloque con franja, prioridad y permite alternar completado', async () => {
    const user = userEvent.setup();
    let toggled = false;
    const block: PlannerBlock = {
      id: 'b-1',
      profileId: 'p-1',
      period: 'semanal',
      timeSlot: 'mañana',
      title: 'Lectura matutina',
      priority: 'alta',
      completed: false,
      dayOfWeek: 1,
      time: '07:30',
    };

    render(
      <PlannerBlockCard
        block={block}
        onToggle={() => { toggled = true; }}
        onDelete={() => {}}
      />
    );

    expect(screen.getByText('Lectura matutina')).toBeInTheDocument();
    expect(screen.getByText('07:30')).toBeInTheDocument();
    expect(screen.getByText('Alta')).toBeInTheDocument();

    const checkbox = screen.getByRole('checkbox', { name: /completar lectura matutina/i });
    await user.click(checkbox);
    expect(toggled).toBe(true);
  });

  it('PlannerDayColumn renderiza cabecera del día, contador de bloques y botón de agregar', async () => {
    const user = userEvent.setup();
    let addClicked = false;

    render(
      <PlannerDayColumn
        dayName="Lunes"
        dateLabel="19 Oct"
        blocks={[]}
        onAddBlock={() => { addClicked = true; }}
        onToggleBlock={() => {}}
        onDeleteBlock={() => {}}
      />
    );

    expect(screen.getByText('Lunes')).toBeInTheDocument();
    expect(screen.getByText('19 Oct')).toBeInTheDocument();
    expect(screen.getByText('0 Bloques')).toBeInTheDocument();

    const addBtn = screen.getByRole('button', { name: /agregar bloque lunes/i });
    await user.click(addBtn);
    expect(addClicked).toBe(true);
  });
});
```

- [ ] **Step 2: Ejecutar prueba para verificar fallo**

Ejecutar: `corepack pnpm exec vitest run src/tests/PlannerWeeklyGrid.test.tsx`  
Resultado esperado: FAIL por componentes inexistentes.

- [ ] **Step 3: Implementar `PlannerBlockCard` y `PlannerDayColumn`**

- `PlannerBlockCard`:
  - Contenedor con borde y acento según franja (`mañana`, `tarde`, `noche`, `meta`).
  - Badges de prioridad estilizados según paleta antislop de Espiralia (`alta` = fondo rojizo suave, `media` = ámbar suave, `baja` = teal/suave).
  - Checkbox con touch target mínimo de 44x44 px y botón accesible de eliminación con icono `Trash2`.
- `PlannerDayColumn`:
  - Contenedor con `min-width: 190px`, cabecera con día, fecha y píldora de conteo de bloques.
  - Botón accesible `+ Bloque` en la cabecera.
  - Lista mapeada de `PlannerBlockCard`.

- [ ] **Step 4: Ejecutar prueba para verificar que pasa**

Ejecutar: `corepack pnpm exec vitest run src/tests/PlannerWeeklyGrid.test.tsx`  
Resultado esperado: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/planner/PlannerBlockCard* src/components/planner/PlannerDayColumn* src/tests/PlannerWeeklyGrid.test.tsx
git commit -m ":sparkles: feat(planner): implementar tarjetas de bloque y columnas de dia"
```

---

### Task 5: Modal accesible de creación y edición de Bloques (`PlannerBlockModal`)

**Files:**
- Create: `src/components/planner/PlannerBlockModal.tsx`
- Create: `src/components/planner/PlannerBlockModal.module.css`
- Create: `src/tests/PlannerModals.test.tsx`

**Interfaces:**
- Consumes: `PlannerBlock`, `DayOfWeek`, `TimeSlot`, `Priority`.
- Produces: `PlannerBlockModal` accesible con diálogo, foco automático y validación.

- [ ] **Step 1: Escribir prueba unitaria de `PlannerBlockModal`**

Crear `src/tests/PlannerModals.test.tsx`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlannerBlockModal } from '../components/planner/PlannerBlockModal';

describe('PlannerBlockModal', () => {
  it('permite crear un bloque para un día específico con franja y prioridad', async () => {
    const user = userEvent.setup();
    const handleSave = vi.fn();

    render(
      <PlannerBlockModal
        isOpen={true}
        initialDay={2} // Martes
        onClose={() => {}}
        onSave={handleSave}
      />
    );

    const titleInput = screen.getByLabelText(/título del bloque/i);
    await user.type(titleInput, 'Estudio de Conducción');

    const timeInput = screen.getByLabelText(/hora/i);
    await user.type(timeInput, '10:00');

    const submitBtn = screen.getByRole('button', { name: /guardar bloque/i });
    await user.click(submitBtn);

    expect(handleSave).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Estudio de Conducción',
        dayOfWeek: 2,
        time: '10:00',
      })
    );
  });
});
```

- [ ] **Step 2: Ejecutar prueba para verificar fallo**

Ejecutar: `corepack pnpm exec vitest run src/tests/PlannerModals.test.tsx`  
Resultado esperado: FAIL por componente inexistente.

- [ ] **Step 3: Implementar `PlannerBlockModal`**

- Formulario con `role="dialog"`, `aria-modal="true"` y `aria-labelledby`.
- Campos:
  - Día de la semana (`<select>` con Lunes a Domingo y opción "Sin día asignado").
  - Franja horaria (`mañana`, `tarde`, `noche`, `meta`).
  - Hora opcional (`<input type="time">`).
  - Título (`<input type="text">`, requerido).
  - Prioridad (`alta`, `media`, `baja`).
- Botones de acción "Cancelar" y "Guardar Bloque" con touch target ≥ 44 px.

- [ ] **Step 4: Ejecutar prueba para verificar que pasa**

Ejecutar: `corepack pnpm exec vitest run src/tests/PlannerModals.test.tsx`  
Resultado esperado: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/planner/PlannerBlockModal* src/tests/PlannerModals.test.tsx
git commit -m ":sparkles: feat(planner): implementar modal accesible para creacion y edicion de bloques"
```

---

### Task 6: Integración completa de `PlannerView` (Grilla 7 días + Columna Sin Día + Cumplimiento + Navegación)

**Files:**
- Modify: `src/components/PlannerView.tsx`
- Modify: `src/components/PlannerView.module.css`
- Modify: `src/tests/PlannerView.test.tsx`

**Interfaces:**
- Consumes: Todos los componentes de `src/components/planner/`, `StorageService`.
- Produces: Vista completa integrada de `PlannerView`.

- [ ] **Step 1: Actualizar pruebas de integración de `PlannerView.test.tsx`**

En `src/tests/PlannerView.test.tsx`, expandir pruebas para cubrir:
1. Renderizado de las 7 columnas de días (Lunes a Domingo).
2. Renderizado de bloques legados en la columna especial "Sin día asignado".
3. Cálculo del medidor de cumplimiento semanal (ej. 2 de 4 completados = 50%).
4. Navegación por semanas (botones anterior/siguiente) y apertura del modal de creación.

- [ ] **Step 2: Ejecutar pruebas para verificar fallos en vista actual**

Ejecutar: `corepack pnpm exec vitest run src/tests/PlannerView.test.tsx`  
Resultado esperado: FAIL en los nuevos asertos de grilla semanal.

- [ ] **Step 3: Reestructurar `PlannerView.tsx` y su CSS Module**

- Implementar selector de semanas con cálculo de fechas relativas a la semana actual (Lunes a Domingo).
- Calcular ratio de cumplimiento semanal: `const fulfillment = totalBlocks > 0 ? Math.round((completedBlocks / totalBlocks) * 100) : 0`.
- Sub-header con:
  - Selector de período (Semanal vs Metas del Semestre).
  - Controles de navegación temporal (`<`, `Semana actual`, `>`).
  - Medidor de cumplimiento con barra y píldora porcentual.
  - Filtro por prioridad (`Todas`, `Alta`, `Media`, `Baja`).
- Grilla principal:
  - 7 columnas para los días Lunes a Domingo.
  - Si existen bloques con `dayOfWeek === undefined`, se renderiza una columna adicional destacada "Sin día asignado" para que el usuario pueda verlos, editarlos o completarlos.
- Integración del panel lateral `GoalsDrawer` en desktop a la derecha y en pantallas menores como sección inferior fluida.

- [ ] **Step 4: Ejecutar suite de pruebas de Planner**

Ejecutar: `corepack pnpm exec vitest run src/tests/PlannerView.test.tsx`  
Resultado esperado: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/PlannerView* src/tests/PlannerView.test.tsx
git commit -m ":sparkles: feat(planner): integrar grilla semanal de 7 dias, seccion sin dia y drawer de metas"
```

---

### Task 7: Verificación Integral de Suite, Compatibilidad y Build de Producción

**Files:**
- Test: Toda la suite en `src/tests/`

- [ ] **Step 1: Ejecutar suite completa de pruebas unitarias y de integración**

Ejecutar: `corepack pnpm exec vitest run`  
Resultado esperado: Todos los tests pasan sin regresiones.

- [ ] **Step 2: Ejecutar compilación de producción para validar tipos y bundle**

Ejecutar: `corepack pnpm build`  
Resultado esperado: Build exitoso sin errores de TypeScript ni advertencias de importación.

- [ ] **Step 3: Actualizar roadmap en `docs/superpowers/plans/2026-10-10-stitch-redesign-roadmap.md`**

Marcar la fase F5 como completada en la documentación del roadmap maestro.

- [ ] **Step 4: Commit de documentación de release F5**

```bash
git add docs/superpowers/plans/2026-10-10-stitch-redesign-roadmap.md
git commit -m ":memo: docs(roadmap): actualizar estado de fase F5 a completada"
```
