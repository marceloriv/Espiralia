# To-Do con estados, áreas temáticas y fecha de vencimiento editable — Diseño (F4)

**Fecha:** 2026-10-10  
**Rama:** `feature/todo-areas` (desde `develop`)  
**Roadmap:** `docs/superpowers/plans/2026-10-10-stitch-redesign-roadmap.md`, fase F4  
**Referencia visual:** pantalla Stitch "Espiralia — To-Do & Áreas Temáticas" (`projects/2198597521553671013/screens/0056f6977f9d4346b9acd687192453f7`, [scratchpad/stitch-screens/todo.png](file:///C:/Users/Marcelo-HP/Desktop/Espiralia/scratchpad/stitch-screens/todo.png))  
**Decisiones del usuario (2026-10-10):**
- Entidad `Area` con `{ id, profileId, name, color, createdAt }` y relación `areaId` en `TodoItem`. Catálogo inicial sembrado: `Trabajo`, `Personal`, `Estudio`, `General`.
- Tres estados de tarea: `pendiente`, `en_progreso`, `completada`. Checkbox accesible (≥ 44 px) para alternancia rápida `pendiente` ↔ `completada` y chip interactivo para marcar `en_progreso`.
- Fecha de vencimiento editable: `<input type="date">` en creación y pill interactiva en fila de tarea para asignar, modificar o remover.
- Barra de áreas superior con contadores y filtro activo. Modal accesible para crear y editar áreas temáticas.
- Resolución de los 4 menores diferidos de F1–F3 dentro del alcance de F4:
  1. Casilla de completar con touch target ≥ 44 px.
  2. Contraste de texto gris secundario ≥ 4.5:1.
  3. Fecha de saludo en Dashboard formateada en minúsculas estándar en español.
  4. Tests de aislamiento de perfiles, cascada y migración de esquemas legados.

---

## 1. Objetivo

Modernizar la gestión de tareas de Espiralia incorporando:
- Estados de avance (`pendiente`, `en_progreso`, `completada`).
- Áreas temáticas estructuradas como entidad de primer nivel.
- Asignación y edición ágil de fechas de vencimiento.
- Experiencia visual alineada a Stitch (columna To-Do y barra superior de áreas).
- Corrección de la deuda técnica de accesibilidad y formateo acumulada de F1–F3.

Todo funciona 100% en cliente con `localStorage`, manteniendo estricto aislamiento por `profileId` y migración automática transparente sin pérdida de datos para perfiles existentes.

---

## 2. Alcance

### Dentro del alcance
1. **Entidades y tipos:**
   - Tipo `TaskStatus = 'pendiente' | 'en_progreso' | 'completada'`.
   - Interface `Area`: `{ id: string; profileId: string; name: string; color: string; createdAt: string }`.
   - Modificación de `TodoItem`:
     - `status: TaskStatus` (reemplaza `completed: boolean`, conservando compatibilidad en lectura).
     - `areaId: string` (reemplaza `category: string`).
     - `dueDate?: string` (formato `YYYY-MM-DD` en hora local).
2. **Servicio de persistencia (`StorageService`):**
   - CRUD para áreas: `getAreas(profileId)`, `saveArea(area)`, `deleteArea(profileId, areaId)`.
   - Sembrado automático de áreas iniciales (`Trabajo`, `Personal`, `Estudio`, `General`) si el perfil no tiene áreas registradas.
   - Reasignación automática de tareas huérfanas a "General" al borrar un área.
   - Cascada en `deleteProfile(profileId)`: elimina `espiralia_${profileId}_areas`.
   - Migración al vuelo en `getTodos(profileId)`:
     - Tareas con `completed === true` pasan a `status: 'completada'`; `completed === false` a `status: 'pendiente'`.
     - Tareas con `category` en texto se enlazan con el `areaId` del área con nombre coincidente (o se crea el área correspondiente).
     - Se mantiene la propiedad computada o compatibilidad `completed: boolean` para evitar roturas inmediatas en consumidores.
3. **Componente `TodoView`:**
   - Barra superior de tarjetas/chips de áreas temáticas con contadores y filtro activo ("Todas" + cada área).
   - Barra de filtros de estado por píldoras con conteos: `Todas (N)`, `Pendientes (N)`, `En Progreso (N)`, `Completadas (N)`.
   - Formulario de creación rápida con título, selector de área (con opción "+ Nueva área"), selector de prioridad y selector de fecha de vencimiento (`<input type="date">`).
   - Lista de tareas con tarjetas estilo Stitch:
     - Checkbox accesible con touch target ≥ 44 px.
     - Título editable/legible con tachado en completadas.
     - Píldora de estado (`En Progreso`, `Pendiente`, `Completada`) cliqueable para alternar a "en progreso".
     - Píldora de fecha de vencimiento interactiva para asignar/cambiar fecha.
     - Badge de prioridad (`Alta`, `Media`, `Baja`).
     - Botón de eliminación accesible.
   - Modal/diálogo accesible para crear y editar áreas temáticas (nombre + selector de color entre 6 tokens del sistema).
4. **Adaptación de componentes dependientes:**
   - `dashboardData.ts` / `DashboardView.tsx`: adaptar `isCritical` y `criticalTodos` para filtrar por `status !== 'completada' && priority === 'alta'`. Checkbox de críticos en Dashboard con touch target ≥ 44 px.
   - `TaskCompletionChart.tsx`: soporte para contar completadas vía `status === 'completada' || t.completed`.
   - `CategoryDistributionChart.tsx`: actualizar cálculo de barras para agrupar por nombre de área temática vinculada.
5. **Corrección de menores diferidos:**
   - Touch target ≥ 44 px en checkboxes de tareas (`TodoView` y `DashboardView`).
   - Ajuste de contraste para textos secundarios grises a ≥ 4.5:1 según WCAG 2.2 AA.
   - Formato de fecha del saludo en `DashboardView`: "Miércoles, 10 de octubre de 2026" (minúsculas naturales en español, evitando Title Case artificial).

### Fuera del alcance
- Columnas 2 y 3 de Stitch ("Nota Importante / Diario Extendido" y "Carpetas & Vínculos con adjuntos"): corresponden a F6 según roadmap.
- Migración a IndexedDB: corresponde a F6.

---

## 3. Arquitectura y Modelo de Datos

### 3.1 Tipos (`src/types/index.ts`)

```typescript
export type TaskStatus = 'pendiente' | 'en_progreso' | 'completada';

export interface Area {
  id: string;
  profileId: string;
  name: string;
  color: string; // Token o variable de color hexadecimal segura
  createdAt: string;
}

export interface TodoItem {
  id: string;
  profileId: string;
  title: string;
  areaId: string;
  priority: Priority;
  status: TaskStatus;
  completed?: boolean; // Compatibilidad retroactiva opcional
  dueDate?: string; // YYYY-MM-DD hora local
  createdAt: string;
}
```

### 3.2 Almacenamiento y Migración (`src/services/storage.ts`)

- Clave de áreas: `espiralia_${profileId}_areas`.
- Si `getAreas(profileId)` encuentra vacío, genera y persiste las 4 áreas por defecto:
  1. `Trabajo` (color azul / primary)
  2. `Personal` (color verde / success)
  3. `Estudio` (color púrpura / accent)
  4. `General` (color gris / neutral)
- `getTodos(profileId)` lee el array crudo y aplica normalización:
  ```typescript
  const normalizeTodo = (raw: any, areas: Area[]): TodoItem => {
    const status: TaskStatus = raw.status ?? (raw.completed ? 'completada' : 'pendiente');
    let areaId = raw.areaId;
    if (!areaId && raw.category) {
      const match = areas.find(a => a.name.toLowerCase() === raw.category.toLowerCase());
      areaId = match ? match.id : (areas[0]?.id ?? 'default');
    }
    return {
      ...raw,
      status,
      completed: status === 'completada',
      areaId: areaId ?? 'default',
    };
  };
  ```

---

## 4. Diseño de Interfaz (`src/components/TodoView.tsx`)

### 4.1 Barra de Áreas
- Contenedor horizontal superior con scroll suave en pantallas pequeñas.
- Píldoras/tarjetas de área con indicador de color, nombre y contador de tareas abiertas (`status !== 'completada'`).
- Botón "+ Área" que abre el modal de gestión de áreas.

### 4.2 Filtros de Estado
- Píldoras con estilos según token `--color-surface-elevated` y `--color-primary`.
- Filtros: `Todas`, `Pendientes`, `En Progreso`, `Completadas`.
- Contadores dinámicos calculados sobre el área actualmente seleccionada.

### 4.3 Fila de Tarea (Tarjeta)
- Checkbox con contenedor envolvente de `min-width: 44px; min-height: 44px; display: flex; align-items: center; justify-content: center;`.
- Píldora de estado con tres apariencias visuales:
  - `pendiente`: borde sutil, fondo neutro.
  - `en_progreso`: fondo suave ámbar/azul con texto `--color-primary`.
  - `completada`: fondo suave verde con texto `--color-success`.
- Píldora de fecha de vencimiento:
  - Si no tiene fecha: botón discreto "+ Vence".
  - Si tiene fecha: badge con icono de calendario y etiqueta relativa ("Hoy", "Mañana", "Vencida", o fecha corta). Al hacer clic abre `<input type="date">` o menú rápido para cambiarla o quitarla.

---

## 5. Accesibilidad (WCAG 2.2 AA)

1. **Touch Targets (Criterio 2.5.8 & 2.5.5):** Todo botón, casilla de verificación y enlace interactivo dispone de un área mínima de 44x44 px.
2. **Contraste de color (Criterio 1.4.3):** Textos secundarios y badges verificados con ratio de contraste ≥ 4.5:1 contra sus fondos respectivos.
3. **Navegación por teclado (Criterio 2.1.1):** Operable vía `Tab` y `Enter`/`Space` para marcar estados, cambiar fechas y eliminar tareas.
4. **Lectores de pantalla (Criterio 4.1.2):** Botones con `aria-label` descriptivos (ej. "Marcar tarea X como completada", "Cambiar estado de tarea X a en progreso", "Eliminar tarea X").

---

## 6. Plan de Pruebas y Criterios de Aceptación

1. **Pruebas de migración de datos viejos:**
   - Tarea con `completed: true` y `category: 'Trabajo'` se renderiza como `completada` y asociada al área `Trabajo`.
   - Tarea con `completed: false` sin `status` se renderiza como `pendiente`.
2. **Pruebas de aislamiento entre perfiles:**
   - Perfil A crea áreas y tareas; Perfil B no ve ninguna área ni tarea de A.
   - `deleteProfile(profileId)` limpia tanto `todos` como `areas` del perfil sin tocar los del otro perfil.
3. **Pruebas de interacción y flujo:**
   - Alternar checkbox cambia estado entre `pendiente` y `completada`.
   - Clic en pill de "En progreso" cambia estado a `en_progreso`.
   - Filtrar por área o estado muestra únicamente las tareas correspondientes y actualiza contadores.
   - Creación de nueva tarea con fecha de vencimiento persiste el valor `dueDate`.
4. **Pruebas de regresión:**
   - `DashboardView` sigue mostrando tareas críticas (`status !== 'completada' && priority === 'alta'`) y completarlas persiste.
   - `TaskCompletionChart` y `CategoryDistributionChart` renderizan correctamente con el nuevo esquema.
   - Formateo de fecha de saludo en Dashboard sin palabras en mayúsculas arbitrarias.
