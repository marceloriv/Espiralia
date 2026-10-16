# Vista de Área Integrada, Dashboard Stitch y Vista de Integraciones Stitch — Especificación de Diseño

**Fecha:** 2026-10-16  
**Rama propuesta:** `feature/areas-dashboard-integrations` (desde `develop`)  
**Roadmap de referencia:** `docs/ERS.md`, `docs/superpowers/plans/2026-10-10-stitch-redesign-roadmap.md`  
**Referencia visual Stitch (proyecto `2198597521553671013`):**
- `0056f6977f9d4346b9acd687192453f7` ("Espiralia — To-Do & Áreas Temáticas")
- `dcdd99161a134d958aba08d620dd6217` ("Espiralia — Dashboard Centralizado")
- `bbf7cc7b4e1746069c003722927828b3` (**"Espiralia — Integraciones Google Calendar, Gmail & .ics"**)

---

## 1. Contexto y Objetivos

El diseño conceptual y las maquetas de Stitch definieron una experiencia integrada que reúne:
1. **Dashboard Centralizado**: Hero con frase motivacional/aforismo, resumen de áreas y barra de 4 accesos instantáneos ("+ Nueva Tarea", "+ Evento Agenda", "+ Reflexión", "+ Enlace / Doc").
2. **Tres Áreas Clave precargadas**:
   - `Estudios`: Preparación teórica para licencia Clase B, banco de preguntas Conaset y simuladores.
   - `Personal`: Espacio de introspección para proceso terapéutico, bitácora y reflexiones extendidas.
   - `Universidad`: Postulaciones semestre 2026-II, portafolio, cartas de recomendación y becas.
3. **Vista de Área Integrada**: Pantalla unificada por área activa que despliega simultáneamente:
   - To-Do específico con estados y fechas.
   - Mini-agenda / próximos eventos contextuales del área.
   - Notas / Diario de reflexión extendido del área.
   - Carpetas y vínculos directos del área.
4. **Vista de Integraciones Stitch ("Espiralia — Integraciones Google Calendar, Gmail & .ics", screen `bbf7cc7b4e1746069c003722927828b3`)**:
   - Vista completa de primer orden en la navegación (o modal de pantalla completa) con diseño editorial y bento grid:
     - **Hero & Badge**: "Módulo Descentralizado • v4.8 Local-First", chips de categorías y título con cita a *Privacy-by-Design*.
     - **Banner de Privacidad y Auditoría**: "Aislamiento Estricto Verificado • 0 bytes transmitidos al exterior", protocolo IndexedDB y verificación de cero tráfico de red.
     - **Tarjeta 1 (Col 7/12) — Google Calendar & iCal (.ics)**:
       - *Opción A*: Exportar agenda filtrada por área (`Estudios`, `Personal`, `Universidad`) y rango temporal en archivo estándar `.ics` (RFC 5545).
       - *Opción B*: Dropzone interactivo de importación `.ics` vía `FileReader` API en cliente.
       - *Opción C*: Atajos "A un solo clic" mediante Google Calendar Web (`https://calendar.google.com/calendar/render?action=TEMPLATE&text=...`).
     - **Tarjeta 2 (Col 5/12) — Gmail & Plantillas**:
       - Integración sin backend vía protocolo `mailto:` y web intent con parámetros de asunto y cuerpo precompilados (Plantilla académica de Universidad y Auto-envío de notas de Personal).
     - **Tarjeta 3 (Col 5/12) — Registro de Auditoría Local**:
       - Monitor en vivo de estado offline, conteo de eventos guardados y confirmación de almacenamiento en dispositivo.

---

## 2. Alcance Funcional y Arquitectura

### 2.1 Módulo 1: Dashboard y Aforismos
- **Frase motivacional en Hero**: Banner de aforismo inspiracional con soporte para la frase oficial: *"El orden no es una restricción, es el espacio donde florecen tus ideas y tu calma"*.
- **Cuatro accesos rápidos ("A un solo clic")**:
  - `+ Nueva Tarea` -> Desencadena modal de tarea rápida.
  - `+ Evento Agenda` -> Desencadena modal de evento rápido.
  - `+ Reflexión` -> Desencadena modal de nueva nota en modo reflexión (`isReflection: true`).
  - `+ Enlace / Doc` -> Desencadena modal de nuevo enlace web / recurso.

### 2.2 Módulo 2: Sembrado de las 3 Áreas Temáticas Clave
- Actualizar `DEFAULT_AREAS` en `StorageService`:
  1. `Estudios` (Color: `#3b82f6` - Azul)
  2. `Personal` (Color: `#10b981` - Esmeralda)
  3. `Universidad` (Color: `#8b5cf6` - Púrpura)
  4. `General` (Color: `#6b7280` - Gris)
- Mecanismo de sembrado inicial de datos demo/contextuales para nuevos perfiles:
  - Tareas para Conaset (Estudios), Bitácora (Personal) y Postulaciones 2026-II (Universidad).
  - Enlace oficial al Simulador Conaset.
  - Nota inicial de reflexión en área Personal.

### 2.3 Módulo 3: Vista de Área Integrada (`AreaIntegratedWorkspace` en `TodoView`)
- Al seleccionar un área temática específica en la vista To-Do/Áreas, activar layout de 3 columnas responsivo:
  - **Columna 1 (Tareas)**: Lista de tareas del área con filtro por estado, cambio rápido y fecha de vencimiento.
  - **Columna 2 (Agenda Contextual)**: Próximos eventos asociados a la categoría/área temática, botón para agendar evento con categoría preseleccionada.
  - **Columna 3 (Recursos y Reflexión)**: Notas del área y accesos a vínculos/carpetas del área con apertura modal directa.

### 2.4 Módulo 4: Vista de Integraciones Stitch (`IntegrationsView`) y Servicio `IcsService`
- **Servicio `IcsService` (`src/services/icsService.ts`)**:
  - `exportToIcs(events: AgendaEvent[], options?: { areaName?: string; dateRange?: string }): string`: Genera contenido iCalendar estándar (`BEGIN:VCALENDAR...`).
  - `parseIcs(icsContent: string, profileId: string): AgendaEvent[]`: Parser ligero RFC 5545 para extraer `SUMMARY`, `DTSTART`, `DTEND`, `DESCRIPTION`.
- **Vista de Integraciones (`src/components/IntegrationsView.tsx`)**:
  - Implementación fidedigna de la pantalla Stitch `bbf7cc7b4e1746069c003722927828b3`.
  - Integrada en el enrutamiento y navegación (`ViewType = ... | 'integraciones'`).
  - Bento grid con:
    1. Sección Google Calendar & .ics (Exportación con selector de área y rango, Dropzone de importación y botones Action Template a Google Calendar Web).
    2. Sección Gmail con plantillas para Universidad y Personal (disparadores de correo nativo / web).
    3. Monitor de auditoría de privacidad y almacenamiento local.

---

## 3. Interfaces y Tipos

```typescript
export type ViewType = 'dashboard' | 'agenda' | 'planner' | 'todo' | 'notes' | 'folders' | 'integrations';

export interface IcsExportOptions {
  areaName?: string;
  startDate?: string;
  endDate?: string;
}
```

Persistencia 100% aislada por `profileId` en `localStorage` / `IndexedDB`, respetando OWASP A01 y WCAG 2.2 AA.
