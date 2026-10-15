# IndexedDB + Notas, Reflexiones, Carpetas y Vínculos — Especificación de Diseño (F6)

**Fecha:** 2026-10-14  
**Rama:** `feature/indexeddb-notes` (desde `develop`)  
**Roadmap:** `docs/superpowers/plans/2026-10-10-stitch-redesign-roadmap.md`, fase F6  
**Requerimientos de usuario:** `Feedback.txt` (cuaderno de reflexiones para proceso terapéutico, creación de carpetas para guardar documentos y vínculos de estudio/universidad).

---

## 1. Contexto y Objetivos

Hasta la fase F5, Espiralia ha persistido todos sus datos en `localStorage`. Sin embargo:
1. `localStorage` tiene un límite estricto de ~5 MB por origen (`QuotaExceededError`).
2. El usuario ha manifestado explícitamente en `Feedback.txt`:
   - Necesidad de escribir **reflexiones extensas** sobre su proceso terapéutico (donde el espacio físico de un cuaderno no alcanza).
   - Necesidad de un apartado para **crear carpetas** y guardar en ellas **documentos y vínculos** (ej. certificados académicos, postulaciones universitarias, recursos para la licencia Clase B).
   - Necesidad de acceso rápido a "Nueva Nota" desde la barra superior.

### Objetivos de F6:
1. **Capa nativa de almacenamiento IndexedDB:** Proveer un motor de persistencia estructurada local de alta capacidad (`espiralia_db`), con partición estricta por `profileId` y fallback resiliente para entornos sin IndexedDB o con almacenamiento restringido.
2. **Entidades para Notas y Carpetas:**
   - `Note`: notas rápidas y reflexiones profundas de diario con soporte para texto enriquecido/multilínea, categorización por área o carpeta y fecha de creación/edición.
   - `Folder`: contenedores lógicos con color e icono para clasificar recursos de estudio, salud y proyectos.
   - `LinkItem`: enlaces y accesos a documentos web guardados dentro de carpetas.
3. **Vistas dedicadas integradas:**
   - `NotesView` (`/notes`): Cuaderno digital con alternador entre "Reflexiones & Diario" y "Notas Rápidas", búsqueda instantánea y editor accesible.
   - `FoldersView` (`/folders`): Gestión visual de carpetas temáticas con lista de notas asociadas y vínculos directos con validación de URL.
4. **Conexión en Layout y Topbar:**
   - Botón "+ Nueva Nota" en la barra superior funcional.
   - Enlaces "Notas" y "Carpetas" en el menú de navegación del sidebar.
5. **Aislamiento y Borrado en Cascada:**
   - Ningún dato de notas, carpetas o vínculos de un perfil se filtra a otro.
   - `deleteProfile(profileId)` limpia íntegramente las notas, carpetas y enlaces del perfil en `localStorage` e IndexedDB.

---

## 2. Modelo de Datos y Contratos

### 2.1 Tipos en `src/types/index.ts`

```typescript
export type ViewType = 'dashboard' | 'agenda' | 'planner' | 'todo' | 'notes' | 'folders';

export interface Folder {
  id: string;
  profileId: string;
  name: string;
  color?: string;
  createdAt: string;
}

export interface Note {
  id: string;
  profileId: string;
  folderId?: string;
  areaId?: string;
  title: string;
  content: string;
  isReflection?: boolean;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LinkItem {
  id: string;
  profileId: string;
  folderId?: string;
  title: string;
  url: string;
  description?: string;
  createdAt: string;
}
```

### 2.2 Motor IndexedDB (`src/services/idb.ts`)

- **Base de datos:** `espiralia_db` (versión 1).
- **Stores:**
  - `notes` (keyPath `id`, index `by_profileId`, index `by_folderId`).
  - `folders` (keyPath `id`, index `by_profileId`).
  - `links` (keyPath `id`, index `by_profileId`, index `by_folderId`).
- **Resiliencia (Graceful Degradation):** Si `window.indexedDB` no está disponible (ej. modo incógnito restrictivo o jsdom en tests), conmuta automáticamente a almacenamiento síncrono/in-memory sin romper la ejecución.

### 2.3 `StorageService` (`src/services/storage.ts`)

Extensión de métodos CRUD:
- `getNotes(profileId: string): Note[]`
- `saveNote(note: Note): void`
- `deleteNote(profileId: string, id: string): void`
- `getFolders(profileId: string): Folder[]`
- `saveFolder(folder: Folder): void`
- `deleteFolder(profileId: string, id: string): void`
- `getLinks(profileId: string): LinkItem[]`
- `saveLink(link: LinkItem): void`
- `deleteLink(profileId: string, id: string): void`
- `deleteProfile(profileId: string)`: elimina `espiralia_${profileId}_notes`, `espiralia_${profileId}_folders`, `espiralia_${profileId}_links` y purga los registros de IndexedDB para ese `profileId`.

---

## 3. Arquitectura de Interfaz y Vistas

### 3.1 `NotesView.tsx` (`/notes`)
- **Cabecera con controles:**
  - Selector de pestaña: `Reflexiones & Diario` vs `Notas Rápidas` vs `Todas`.
  - Buscador en tiempo real por título o contenido.
  - Botón accesible `+ Nueva Nota`.
- **Panel / Grilla de Notas:**
  - Tarjetas de notas con título, fragmento de contenido, indicador de fecha/hora, badge de carpeta o tag.
  - Modo visualización / edición en modal o panel integrado para redacción cómoda sin límites de longitud.

### 3.2 `FoldersView.tsx` (`/folders`)
- **Barra de carpetas:**
  - Tarjetas de carpetas (con nombre, color y contador de elementos contenidos).
  - Botón `+ Nueva Carpeta`.
- **Contenido de la carpeta seleccionada:**
  - Sección de Notas vinculadas a la carpeta.
  - Sección de Vínculos / Documentos web: lista de enlaces con botón de agregar vínculo (`Título`, `URL`, `Descripción`) y apertura en pestaña segura (`rel="noopener noreferrer"`).

### 3.3 Integración en `AppLayout.tsx`
- Botón "+ Nueva Nota" en la barra superior abre el modal de creación de nota desde cualquier vista.
- Navegación sidebar incorpora `Notas` (icono `FileText` / `BookOpen`) y `Carpetas` (icono `Folder`).

---

## 4. Criterios de Aceptación y Pruebas

1. **Aislamiento de perfiles:** Las notas y carpetas del perfil A no aparecen en el perfil B.
2. **Borrado en cascada:** Al eliminar un perfil, todas sus notas, carpetas y enlaces son removidos de raíz.
3. **Validación de URLs:** Los vínculos con URL inválida no se guardan o se sanitizan para evitar esquemas peligrosos como `javascript:`.
4. **Reflexiones extensas:** El usuario puede redactar textos de más de 10.000 caracteres sin degradación ni pérdida ante recargas.
5. **Navegación accesible:** Navegación por teclado completa, touch targets ≥ 44 px y contraste ≥ 4.5:1 en todas las nuevas pantallas.
