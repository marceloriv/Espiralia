# Planner semanal en grilla de 7 días y Metas con progreso — Especificación de Diseño (F5)

**Fecha:** 2026-10-14  
**Rama:** `feature/planner-weekly` (desde `develop`)  
**Roadmap:** `docs/superpowers/plans/2026-10-10-stitch-redesign-roadmap.md`, fase F5  
**Referencia visual:** Stitch screen "Espiralia — Planner por Bloques & Prioridades" (`projects/2198597521553671013/screens/101cab70f79e45a192ef8069fada0140`) adaptada sin defectos de superposición ni textos truncados.

---

## 1. Contexto y Objetivos

La vista actual `PlannerView` opera como una lista plana agrupada por franjas fijas (`mañana`, `tarde`, `noche`, `meta`), sin noción de día de la semana ni seguimiento cuantitativo de objetivos.

La pantalla Stitch para el Planner plantea una **grilla Bento semanal de 7 días (Lunes a Domingo)** con bloques de rutina y enfoque por franja, combinada con un **panel lateral de Metas Semanales del Semestre con sub-items y barra de progreso**.

### Objetivos de F5:
1. **Grilla semanal Lunes–Domingo:** organizar los bloques de enfoque por día concreto de la semana, permitiendo programar rutinas diarias estructuradas (Matutina, Foco Profundo, Tarde, Cierre).
2. **Compatibilidad y no-pérdida de datos:** los bloques legados que no tengan día asignado no se descartan; se muestran en una columna/sección accesible "Sin día asignado" y permiten ser reasignados.
3. **Metas con progreso:** introducir la entidad `Goal` persistida en `localStorage` con sub-items tipo checklist, calculando automáticamente el porcentaje de avance y reflejándolo en barra de progreso.
4. **Medidor de cumplimiento semanal:** calcular y mostrar en la cabecera el porcentaje global de bloques/metas completados en la semana seleccionada.
5. **Navegación de semanas:** selector de semana (Semana actual, anterior, siguiente) para navegar y visualizar bloques en contexto temporal.
6. **Accesibilidad WCAG 2.2 AA:** controles interactivos con touch targets ≥ 44 px, contraste ≥ 4.5:1, navegación completa por teclado, reflow fluido desde 320 px (con scroll horizontal interno acotado a la grilla semanal).

---

## 2. Modelo de Datos y Contratos

### 2.1 Tipos en `src/types/index.ts`

```typescript
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado

export interface PlannerBlock {
  id: string;
  profileId: string;
  period: PlannerPeriod; // 'semanal' | 'mensual'
  timeSlot: TimeSlot; // 'mañana' | 'tarde' | 'noche' | 'meta'
  title: string;
  priority: Priority; // 'alta' | 'media' | 'baja'
  notes?: string;
  completed: boolean;
  dayOfWeek?: DayOfWeek; // 1 (Lunes) a 6 (Sábado), 0 (Domingo); undefined = Sin día asignado
  time?: string; // HH:mm opcional
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
  category?: string; // ej. 'Metas Académicas', 'Metas Personales', 'Proyecto'
  period: PlannerPeriod; // 'semanal' | 'mensual'
  items: GoalSubItem[];
  createdAt: string;
}
```

### 2.2 Almacenamiento y `StorageService` (`src/services/storage.ts`)

- Clave para metas: `espiralia_${profileId}_goals`.
- Clave para planner: `espiralia_${profileId}_planner`.
- Métodos CRUD para metas:
  - `getGoals(profileId: string): Goal[]`
  - `saveGoal(goal: Goal): void`
  - `deleteGoal(profileId: string, id: string): void`
- Borrado en cascada: `deleteProfile(profileId)` debe limpiar `localStorage.removeItem('espiralia_${profileId}_goals')`.
- Migración de bloques: `getPlanner(profileId)` garantiza que objetos serializados sin `dayOfWeek` se retornen intactos sin romper tipado ni lógica.

---

## 3. Arquitectura de UI y Componentes

### 3.1 Estructura en `src/components/planner/`
- `PlannerView.tsx`: contenedor principal de la vista.
- `PlannerWeeklyGrid.tsx`: grilla horizontal responsive con las 7 columnas (Lunes a Domingo) más la columna condicional "Sin día".
- `PlannerDayColumn.tsx`: columna de un día con cabecera (día, fecha corta, contador de bloques), botón rápido "+ Bloque" y lista de tarjetas.
- `PlannerBlockCard.tsx`: tarjeta de bloque con franja horaria, hora opcional, título, chip de prioridad, checkbox accesible (≥ 44 px) y acción de eliminar.
- `PlannerBlockModal.tsx`: modal accesible para crear/editar bloque con selección de día, franja, hora, título y prioridad.
- `GoalsDrawer.tsx`: panel lateral de Metas Semanales con lista de metas, medidor de progreso, checklist interactivo y modal/formulario "+ Nueva Meta".
- `GoalCard.tsx`: tarjeta individual de meta con cabecera de categoría, barra de progreso y sub-items cliqueables.

### 3.2 Sub-header y Controles
- Alternador de período: `Planner Semanal` vs `Metas Mensuales`.
- Controles de navegación temporal: botones anterior (`<`), hoy / actual, siguiente (`>`) y etiqueta de rango (ej. "19 Oct – 25 Oct 2026").
- Indicador de cumplimiento semanal: barra y píldora porcentual que calcula `(bloques_completados / bloques_totales) * 100%`.
- Filtros por prioridad: píldoras accesibles `Todas`, `Alta`, `Media`, `Baja`.

### 3.3 Comportamiento Responsivo
- Desktop (≥ 1280 px): Grilla de 7 columnas visible en viewport y panel lateral de Metas a la derecha.
- Tablet (768 px – 1279 px): Grilla con scroll horizontal contenido y panel de Metas inferior o colapsable.
- Mobile (< 768 px): Selector de día activo o scroll horizontal por tarjetas, panel de metas accesible vía pestaña/drawer.

---

## 4. Criterios de Aceptación y Pruebas

1. **Aislamiento de perfiles:** Las metas y bloques de `perfil-A` jamás se muestran ni se modifican cuando está activo `perfil-B`.
2. **Persistencia y cascada:** Al eliminar un perfil con `StorageService.deleteProfile`, se borran completamente `espiralia_${id}_planner` y `espiralia_${id}_goals`.
3. **Retrocompatibilidad:** Perfiles con bloques creados en versiones previas (sin `dayOfWeek`) no provocan errores y se agrupan visiblemente en la sección "Sin día asignado".
4. **Cálculo de progreso de metas:** Si una meta tiene 4 sub-items y 3 están marcados, el progreso reporta exactamente 75%. Al alternar un sub-item, se actualiza el estado y persiste en `localStorage`.
5. **Cálculo de cumplimiento semanal:** Si la semana tiene 10 bloques y 5 están completados, el indicador muestra 50%.
6. **Accesibilidad:** Cero violaciones WCAG en contraste, roles aria de botones/checkboxes y objetivos táctiles ≥ 44 px.
