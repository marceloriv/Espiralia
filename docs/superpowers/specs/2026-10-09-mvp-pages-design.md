# Espiralia MVP — Design Specification

**Fecha:** 2026-10-09  
**Estado:** Aprobado  
**Alcance:** Páginas y arquitectura de interfaz para el MVP de Espiralia (Agenda, Planner, To-Do, Dashboard y Perfiles Locales).

---

## 1. Contexto y Objetivos

Espiralia es una aplicación web SPA para organización personal centralizada, construida con React 19, TypeScript y Vite. No utiliza backend remoto ni servidores; opera 100% en el cliente con persistencia en IndexedDB y Web Storage.

### Objetivos del MVP
- Proveer una interfaz rápida y responsiva con la paleta de diseño oficial (#8E1EA2, #C654C3, #ED96D7, #FFC0DE) y tipografía editorial definida en `DESIGN.md`.
- Proteger el acceso local mediante una pantalla de selección/creación de perfil (Profile Gate) con PIN opcional.
- Ofrecer navegación consistente vía Sidebar persistente entre 4 secciones principales: Dashboard, Agenda, Planner y To-Do.
- Garantizar persistencia inmediata por perfil en el almacenamiento local sin pérdida ante recargas.

---

## 2. Arquitectura de UI y Navegación

### Flujo de Navegación
```
[Inicio de Aplicación]
         │
         ▼
[ProfileGateView] ── (Selecciona / Desbloquea con PIN) ──► [AppLayout Activo]
                                                                    │
                                   ┌────────────────────────────────┼────────────────────────────────┐
                                   ▼                                ▼                                ▼
                            [DashboardView]                   [AgendaView]                     [PlannerView]
                                   │                                                                 │
                                   └────────────────────────► [TodoView] ◄───────────────────────────┘
```

- **Enrutamiento:** Router basado en estado/hash interno (`currentView: 'dashboard' | 'agenda' | 'planner' | 'todo'`) para garantizar compatibilidad total con despliegues en GitHub Pages sin rutas rotas.
- **Estado de Sesión:** `activeProfileId: string | null`. Si es `null`, se monta `ProfileGateView`. Si tiene id, se monta `AppLayout` con la vista activa.

---

## 3. Modelo de Datos Local

### `Profile`
```ts
export interface Profile {
  id: string;
  name: string;
  avatar: string; // iniciales o emoji/color
  pin?: string;   // 4 dígitos opcional
  createdAt: string;
}
```

### `AgendaEvent`
```ts
export interface AgendaEvent {
  id: string;
  profileId: string;
  title: string;
  date: string;       // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string;   // HH:mm
  category?: 'trabajo' | 'personal' | 'urgente' | 'estudio';
  notes?: string;
}
```

### `PlannerBlock`
```ts
export interface PlannerBlock {
  id: string;
  profileId: string;
  period: 'semanal' | 'mensual';
  timeSlot: 'mañana' | 'tarde' | 'noche' | 'meta';
  title: string;
  priority: 'alta' | 'media' | 'baja';
  notes?: string;
  completed: boolean;
}
```

### `TodoItem`
```ts
export interface TodoItem {
  id: string;
  profileId: string;
  title: string;
  category: string; // ej: 'General', 'Personal', 'Trabajo'
  priority: 'alta' | 'media' | 'baja';
  completed: boolean;
  dueDate?: string;
  createdAt: string;
}
```

---

## 4. Vistas y Componentes Principales

1. **`ProfileGateView`**
   - Lista de perfiles creados localmente.
   - Botón para crear perfil con nombre, avatar y PIN opcional.
   - Diálogo modal para solicitar PIN si el perfil seleccionado lo requiere.
   - Botón para eliminar perfil local.

2. **`AppLayout`**
   - **Sidebar:**
     - Logotipo "Espiralia" con estilo editorial y acento `#8E1EA2`.
     - Links de navegación: Dashboard, Agenda, Planner, To-Do con conteo de pendientes y estado activo resaltado.
     - Botón inferior "Cambiar perfil" que devuelve al Profile Gate y bloquea la sesión.
   - **Main Area:**
     - Header contextual con título de la vista, fecha actual y selector rápido.
     - Contenedor scrollable responsivo con fondo canvas `#faf9f5`.

3. **`DashboardView`**
   - Tarjeta de bienvenida con saludo personalizado al perfil activo.
   - **Grid de resumen (3 columnas/widgets):**
     - Widget Agenda: Eventos programados para hoy con hora y categoría.
     - Widget Planner: Objetivos y bloques de hoy/semana con estado de avance.
     - Widget To-Do: Top tareas pendientes con checkbox para completar en 1 clic.
   - Métricas clave: Total completadas hoy vs tareas pendientes.

4. **`AgendaView`**
   - Mini selector de mes / semana con controles de navegación (anterior/siguiente).
   - Cuadrícula de calendario mensual simple con días del mes actual e indicador del día seleccionado.
   - Panel lateral o inferior con eventos del día seleccionado.
   - Formulario modal para añadir/editar eventos.

5. **`PlannerView`**
   - Filtro de período: Semanal / Mensual.
   - Secciones visuales por bloques de enfoque (Mañana, Tarde, Noche, Metas del período).
   - Lista de bloques con tag de prioridad (Alta: `#8E1EA2`, Media: `#C654C3`, Baja: `#ED96D7`).
   - Acciones: agregar bloque, alternar completado, eliminar.

6. **`TodoView`**
   - Barra superior de creación rápida: input de texto + botón "Añadir tarea" (soporta pulsar Enter).
   - Filtros de estado: Todas / Pendientes / Completadas.
   - Filtros por categoría/lista: chips interactivos para filtrar por etiqueta.
   - Lista de tareas con checkboxes, indicador de prioridad y botón eliminar.

---

## 5. Tokens de Diseño y Estilos

- Colores principales tomados de `DESIGN.md`:
  - Primario oscuro / CTA: `#8E1EA2`
  - Primario medio / Hover: `#C654C3`
  - Primario suave / Badges: `#ED96D7`
  - Primario claro / Contenedores: `#FFC0DE`
  - Canvas base: `#faf9f5`
  - Texto / Ink: `#141413`
  - Texto secundario / Muted: `#6c6a64`
- Tipografía: Copernicus / Serif display para títulos principales, Inter / sans-serif para UI y textos de cuerpo.
- Iconos: `lucide-react` para consistencia visual (Calendar, CheckSquare, LayoutDashboard, Compass, User, Lock, Plus, Trash2, etc.).

---

## 6. Persistencia y Almacenamiento

- Capa `StorageService` con adaptadores tipados:
  - Manejo inicial transparente sobre `localStorage` particionado por clave `espiralia_${profileId}_*` o `espiralia_profiles` para bootstrapping y pruebas instantáneas sin asincronía bloqueante.
  - Preparado para sincronizar con IndexedDB según RNF-7.
