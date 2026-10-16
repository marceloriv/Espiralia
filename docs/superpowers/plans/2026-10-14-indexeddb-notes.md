# IndexedDB + Notas, Reflexiones, Carpetas y Vínculos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Implementar la persistencia nativa con IndexedDB y dotar a Espiralia de un Cuaderno digital de Reflexiones (para proceso terapéutico y notas de estudio extensas), sistema de Carpetas temáticas y guardado de Vínculos/documentos web, integrados en la navegación principal.

**Architecture:** Se implementa un motor nativo en `src/services/idb.ts` para `IndexedDB` con detección automática de entorno y fallback resiliente para pruebas/modo incógnito. `StorageService` expone métodos síncronos con write-through asíncrono para mantener intacta la compatibilidad con F1–F5. Se desarrollan las vistas `NotesView` y `FoldersView` con editor de reflexiones sin límite de longitud, categorización por carpetas y sanitización de URLs de enlaces.

**Tech Stack:** React 19.2, TypeScript 5.8, Lucide React, IndexedDB nativo (sin dependencias externas), CSS Modules con tokens antislop oficiales, Vitest 3.x, Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-14-indexeddb-notes-design.md`

## Global Constraints

- 100% en cliente sin backend, particionado por `profileId` en `localStorage` e IndexedDB (AGENTS.md §10 A01).
- Cero dependencias npm nuevas; uso de la API nativa de `IndexedDB` del navegador.
- Estilos aislados con CSS Modules (`*.module.css`) y tokens oficiales de `src/index.css` / `DESIGN.md`.
- Touch target ≥ 44 px en todos los botones y checkboxes interactivos (WCAG 2.2 AA).
- Sanitización estricta de URLs en vínculos para evitar inyecciones `javascript:`.
- Pruebas exclusivamente en `src/tests/` con Vitest + Testing Library.
- Commits en formato Conventional Commits + Gitmoji en español sin firmas de agente.

## Review Focus

1. **Aislamiento estricto de notas y carpetas:** Las notas, carpetas y links de `perfil-1` no se filtran ni se acceden desde `perfil-2`.
2. **Resiliencia ante ausencia de IndexedDB:** En entornos donde `window.indexedDB` es `undefined` (jsdom en tests o modo incógnito restrictivo), la aplicación opera fluidamente con fallback en memoria/localStorage sin provocar pantalla blanca.
3. **Seguridad en enlaces web:** Validación de esquemas en URLs (`http://`, `https://`) y apertura segura con `rel="noopener noreferrer"` y `target="_blank"`.
4. **Borrado en cascada consistente:** `StorageService.deleteProfile(profileId)` elimina todas las notas, carpetas y vínculos tanto de `localStorage` como de IndexedDB.
5. **Persistencia de textos extensos:** Redacción de reflexiones largas (> 10.000 caracteres) sin truncamiento ni corrupción de datos.

---

### Task 1: Modelos de datos para Notas, Carpetas y Vínculos (`src/types/index.ts`)

**Files:**
- Modify: `src/types/index.ts`
- Create: `src/tests/notesTypes.test.ts`

**Interfaces:**
- Produces: `Folder`, `Note`, `LinkItem`, actualización de `ViewType` (`'notes' | 'folders'`).

- [x] **Step 1: Escribir prueba de validación de tipos para notas, carpetas y links**

Crear `src/tests/notesTypes.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import type { Note, Folder, LinkItem, ViewType } from '../types';

describe('Notes, Folders and Links Types', () => {
  it('permite estructurar notas normales y reflexiones terapéuticas extensas', () => {
    const reflection: Note = {
      id: 'note-1',
      profileId: 'p-1',
      title: 'Reflexión de sesión terapéutica',
      content: 'Contenido extenso sobre el proceso de autorregulación...',
      isReflection: true,
      tags: ['terapia', 'proceso'],
      createdAt: '2026-10-14T20:00:00Z',
      updatedAt: '2026-10-14T20:30:00Z',
    };

    expect(reflection.isReflection).toBe(true);
    expect(reflection.tags).toHaveLength(2);
  });

  it('permite asociar carpetas y vínculos web', () => {
    const folder: Folder = {
      id: 'f-1',
      profileId: 'p-1',
      name: 'Conducción Clase B',
      color: '#3b82f6',
      createdAt: '2026-10-14T10:00:00Z',
    };

    const link: LinkItem = {
      id: 'l-1',
      profileId: 'p-1',
      folderId: 'f-1',
      title: 'Simulador Conaset',
      url: 'https://conaset.cl/simulador',
      description: 'Práctica para examen teórico',
      createdAt: '2026-10-14T10:05:00Z',
    };

    expect(link.folderId).toBe(folder.id);
  });

  it('amplía ViewType para incluir notes y folders', () => {
    const v1: ViewType = 'notes';
    const v2: ViewType = 'folders';
    expect(v1).toBe('notes');
    expect(v2).toBe('folders');
  });
});
```

- [x] **Step 2: Ejecutar prueba para verificar compilación**

Ejecutar: `corepack pnpm exec vitest run src/tests/notesTypes.test.ts`  
Resultado esperado: Error de TypeScript por tipos no exportados aún.

- [x] **Step 3: Actualizar `src/types/index.ts` con `Folder`, `Note`, `LinkItem` y `ViewType` ampliado**

En `src/types/index.ts`:
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

- [x] **Step 4: Ejecutar prueba para verificar que pasa**

Ejecutar: `corepack pnpm exec vitest run src/tests/notesTypes.test.ts`  
Resultado esperado: PASS.

- [x] **Step 5: Commit**

```bash
git add src/types/index.ts src/tests/notesTypes.test.ts
git commit -m ":sparkles: feat(types): definir entidades Note, Folder y LinkItem y ampliar ViewType"
```

---

### Task 2: Capa de almacenamiento IndexedDB nativa con fallback seguro (`src/services/idb.ts`)

**Files:**
- Create: `src/services/idb.ts`
- Create: `src/tests/idb.test.ts`

**Interfaces:**
- Produces: `EspiraliaIDB.isAvailable()`, `EspiraliaIDB.getStore<T>(storeName, profileId)`, `EspiraliaIDB.put<T>(storeName, item)`, `EspiraliaIDB.delete(storeName, id)`, `EspiraliaIDB.clearProfile(profileId)`.

- [x] **Step 1: Escribir prueba unitaria para la capa IndexedDB y su resiliencia**

Crear `src/tests/idb.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { EspiraliaIDB } from '../services/idb';

describe('EspiraliaIDB Core Storage', () => {
  const profileId = 'p-idb-test';

  beforeEach(async () => {
    await EspiraliaIDB.clearProfile(profileId);
  });

  it('opera de forma segura incluso si window.indexedDB no está disponible', async () => {
    const item = { id: 'test-1', profileId, data: 'valor seguro' };
    await EspiraliaIDB.put('notes', item);

    const items = await EspiraliaIDB.getAll('notes', profileId);
    expect(items).toContainEqual(item);

    await EspiraliaIDB.delete('notes', 'test-1');
    const afterDelete = await EspiraliaIDB.getAll('notes', profileId);
    expect(afterDelete).toHaveLength(0);
  });

  it('purga todos los registros del perfil al invocar clearProfile', async () => {
    await EspiraliaIDB.put('notes', { id: 'n-1', profileId, title: 'Nota' });
    await EspiraliaIDB.put('folders', { id: 'f-1', profileId, name: 'Carpeta' });

    await EspiraliaIDB.clearProfile(profileId);

    const notes = await EspiraliaIDB.getAll('notes', profileId);
    const folders = await EspiraliaIDB.getAll('folders', profileId);
    expect(notes).toHaveLength(0);
    expect(folders).toHaveLength(0);
  });
});
```

- [x] **Step 2: Ejecutar prueba para verificar fallo**

Ejecutar: `corepack pnpm exec vitest run src/tests/idb.test.ts`  
Resultado esperado: FAIL por módulo `src/services/idb.ts` no encontrado.

- [x] **Step 3: Implementar `src/services/idb.ts` con detección y fallback**

- Crear `EspiraliaIDB`:
  - Detecta si `typeof window !== 'undefined' && 'indexedDB' in window && window.indexedDB !== undefined`.
  - Si está disponible, inicializa `openDB()` con stores `notes`, `folders`, `links`.
  - Si no está disponible, mantiene un `Map<string, Map<string, any>>` en memoria con espejo en `localStorage` usando prefijo `idb_fallback_`.
  - Expone API async unificada: `getAll<T>(store, profileId)`, `getById<T>(store, id)`, `put<T>(store, item)`, `delete(store, id)`, `clearProfile(profileId)`.

- [x] **Step 4: Ejecutar prueba para verificar que pasa**

Ejecutar: `corepack pnpm exec vitest run src/tests/idb.test.ts`  
Resultado esperado: PASS.

- [x] **Step 5: Commit**

```bash
git add src/services/idb.ts src/tests/idb.test.ts
git commit -m ":sparkles: feat(storage): implementar motor de persistencia nativo EspiraliaIDB con fallback"
```

---

### Task 3: Persistencia de Notas, Carpetas y Vínculos con cascada en `StorageService`

**Files:**
- Modify: `src/services/storage.ts`
- Create: `src/tests/notesStorage.test.ts`

**Interfaces:**
- Consumes: `Note`, `Folder`, `LinkItem`, `EspiraliaIDB`.
- Produces: CRUD para `notes`, `folders` y `links` en `StorageService`, y cascada en `deleteProfile`.

- [x] **Step 1: Escribir pruebas unitarias de persistencia y cascada**

Crear `src/tests/notesStorage.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { StorageService } from '../services/storage';
import type { Note, Folder, LinkItem } from '../types';

describe('StorageService - Notes, Folders & Links', () => {
  const profileId = 'p-notes-test';

  beforeEach(() => {
    localStorage.clear();
  });

  it('guarda, recupera y elimina notas con aislamiento por perfil', () => {
    const note: Note = {
      id: 'n-1',
      profileId,
      title: 'Nota 1',
      content: 'Contenido de prueba',
      createdAt: '2026-10-14',
      updatedAt: '2026-10-14',
    };

    StorageService.saveNote(note);
    expect(StorageService.getNotes(profileId)).toHaveLength(1);
    expect(StorageService.getNotes('otro-perfil')).toHaveLength(0);

    StorageService.deleteNote(profileId, 'n-1');
    expect(StorageService.getNotes(profileId)).toHaveLength(0);
  });

  it('gestiona carpetas y vínculos asociados', () => {
    const folder: Folder = {
      id: 'f-1',
      profileId,
      name: 'Estudios',
      createdAt: '2026-10-14',
    };
    StorageService.saveFolder(folder);
    expect(StorageService.getFolders(profileId)).toHaveLength(1);

    const link: LinkItem = {
      id: 'l-1',
      profileId,
      folderId: 'f-1',
      title: 'Portal Universidad',
      url: 'https://universidad.cl',
      createdAt: '2026-10-14',
    };
    StorageService.saveLink(link);
    expect(StorageService.getLinks(profileId)).toHaveLength(1);
  });

  it('borra notas, carpetas y enlaces al eliminar el perfil', () => {
    StorageService.saveNote({
      id: 'n-del',
      profileId,
      title: 'Nota a borrar',
      content: '...',
      createdAt: '2026-10-14',
      updatedAt: '2026-10-14',
    });
    StorageService.saveFolder({ id: 'f-del', profileId, name: 'Carpeta a borrar', createdAt: '2026-10-14' });
    StorageService.saveLink({ id: 'l-del', profileId, title: 'Link', url: 'https://test.com', createdAt: '2026-10-14' });

    StorageService.deleteProfile(profileId);

    expect(StorageService.getNotes(profileId)).toHaveLength(0);
    expect(StorageService.getFolders(profileId)).toHaveLength(0);
    expect(StorageService.getLinks(profileId)).toHaveLength(0);
  });
});
```

- [x] **Step 2: Ejecutar prueba para verificar fallo**

Ejecutar: `corepack pnpm exec vitest run src/tests/notesStorage.test.ts`  
Resultado esperado: FAIL por métodos `getNotes`, `saveNote`, etc., inexistentes.

- [x] **Step 3: Implementar métodos en `src/services/storage.ts` y sincronización con IDB**

- Importar `Note`, `Folder`, `LinkItem` de `../types`.
- Agregar `getNotes`, `saveNote`, `deleteNote`.
- Agregar `getFolders`, `saveFolder`, `deleteFolder`.
- Agregar `getLinks`, `saveLink`, `deleteLink`.
- En `deleteProfile(id)`:
  - Eliminar de `localStorage`: `notes`, `folders`, `links`.
  - Disparar `EspiraliaIDB.clearProfile(id)`.

- [x] **Step 4: Ejecutar prueba para verificar que pasa**

Ejecutar: `corepack pnpm exec vitest run src/tests/notesStorage.test.ts`  
Resultado esperado: PASS.

- [x] **Step 5: Commit**

```bash
git add src/services/storage.ts src/tests/notesStorage.test.ts
git commit -m ":sparkles: feat(storage): incorporar CRUD y cascada para notas, carpetas y vinculos"
```

---

### Task 4: Vista de Notas & Cuaderno de Reflexiones (`NotesView`)

**Files:**
- Create: `src/components/NotesView.tsx`
- Create: `src/components/NotesView.module.css`
- Create: `src/components/notes/NoteModal.tsx`
- Create: `src/components/notes/NoteModal.module.css`
- Create: `src/tests/NotesView.test.tsx`

**Interfaces:**
- Consumes: `Note`, `Folder`, `StorageService`.
- Produces: `NotesView` con filtrado por pestaña ("Reflexiones & Diario", "Notas Rápidas", "Todas"), búsqueda por texto y creación/edición de notas extensas.

- [x] **Step 1: Escribir pruebas unitarias e integración de `NotesView`**

Crear `src/tests/NotesView.test.tsx`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotesView } from '../components/NotesView';
import { StorageService } from '../services/storage';

describe('NotesView', () => {
  const profileId = 'p-notes-view';

  beforeEach(() => {
    localStorage.clear();
  });

  it('renderiza la vista y permite crear una nueva reflexión terapéutica', async () => {
    const user = userEvent.setup();
    render(<NotesView profileId={profileId} />);

    expect(screen.getByRole('heading', { level: 2, name: /notas & reflexiones/i })).toBeInTheDocument();

    const addBtn = screen.getByRole('button', { name: /\+ nueva nota/i });
    await user.click(addBtn);

    const titleInput = screen.getByLabelText(/título/i);
    await user.type(titleInput, 'Reflexión Semanal');

    const contentInput = screen.getByLabelText(/contenido/i);
    await user.type(contentInput, 'Hoy logré identificar patrones de ansiedad y aplicar técnicas de respiración.');

    const isReflectionCheckbox = screen.getByLabelText(/marcar como reflexión de diario/i);
    await user.click(isReflectionCheckbox);

    const saveBtn = screen.getByRole('button', { name: /guardar nota/i });
    await user.click(saveBtn);

    expect(screen.getByText('Reflexión Semanal')).toBeInTheDocument();
    expect(screen.getByText(/patrones de ansiedad/i)).toBeInTheDocument();
  });

  it('permite alternar entre pestañas y filtrar notas', async () => {
    const user = userEvent.setup();
    StorageService.saveNote({
      id: 'n-1',
      profileId,
      title: 'Nota rápida de compras',
      content: 'Comprar lápices y libreta',
      isReflection: false,
      createdAt: '2026-10-14',
      updatedAt: '2026-10-14',
    });
    StorageService.saveNote({
      id: 'n-2',
      profileId,
      title: 'Reflexión profunda',
      content: 'Metacognición sobre el estudio',
      isReflection: true,
      createdAt: '2026-10-14',
      updatedAt: '2026-10-14',
    });

    render(<NotesView profileId={profileId} />);

    expect(screen.getByText('Nota rápida de compras')).toBeInTheDocument();
    expect(screen.getByText('Reflexión profunda')).toBeInTheDocument();

    const reflectionsTab = screen.getByRole('button', { name: /reflexiones & diario/i });
    await user.click(reflectionsTab);

    expect(screen.queryByText('Nota rápida de compras')).not.toBeInTheDocument();
    expect(screen.getByText('Reflexión profunda')).toBeInTheDocument();
  });
});
```

- [x] **Step 2: Ejecutar prueba para verificar fallo**

Ejecutar: `corepack pnpm exec vitest run src/tests/NotesView.test.tsx`  
Resultado esperado: FAIL por componente inexistente.

- [x] **Step 3: Implementar `NotesView`, `NoteModal` y sus estilos**

- `NoteModal`:
  - Diálogo accesible (`role="dialog"`, `aria-modal="true"`, foco en título).
  - Campos: título, selector de carpeta opcional, textarea multilínea expansible para reflexiones largas, checkbox "Marcar como reflexión de diario", tags separados por coma.
  - Cierre con Escape y backdrop click.
- `NotesView`:
  - Sub-header con buscador, pestañas `Todas`, `Reflexiones & Diario`, `Notas Rápidas`, contador de notas y botón `+ Nueva Nota`.
  - Grilla de tarjetas estilo editorial con tokens de `src/index.css`.
  - Acciones en tarjeta: editar, eliminar con confirmación y toast con `sileo`.

- [x] **Step 4: Ejecutar prueba para verificar que pasa**

Ejecutar: `corepack pnpm exec vitest run src/tests/NotesView.test.tsx`  
Resultado esperado: PASS.

- [x] **Step 5: Commit**

```bash
git add src/components/NotesView* src/components/notes/* src/tests/NotesView.test.tsx
git commit -m ":sparkles: feat(notes): implementar vista NotesView y editor de reflexiones y notas rapidas"
```

---

### Task 5: Vista de Carpetas & Vínculos/Documentos (`FoldersView`)

**Files:**
- Create: `src/components/FoldersView.tsx`
- Create: `src/components/FoldersView.module.css`
- Create: `src/components/folders/FolderModal.tsx`
- Create: `src/components/folders/LinkModal.tsx`
- Create: `src/tests/FoldersView.test.tsx`

**Interfaces:**
- Consumes: `Folder`, `LinkItem`, `Note`, `StorageService`.
- Produces: `FoldersView` con navegación de carpetas temáticas, agrupación de notas asociadas y catálogo de vínculos web con validación de URL y apertura segura.

- [x] **Step 1: Escribir pruebas unitarias para `FoldersView`**

Crear `src/tests/FoldersView.test.tsx`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FoldersView } from '../components/FoldersView';
import { StorageService } from '../services/storage';

describe('FoldersView', () => {
  const profileId = 'p-folders-view';

  beforeEach(() => {
    localStorage.clear();
  });

  it('permite crear una carpeta temática y registrar un vínculo web válido', async () => {
    const user = userEvent.setup();
    render(<FoldersView profileId={profileId} />);

    expect(screen.getByRole('heading', { level: 2, name: /carpetas & vínculos/i })).toBeInTheDocument();

    const addFolderBtn = screen.getByRole('button', { name: /\+ nueva carpeta/i });
    await user.click(addFolderBtn);

    const folderNameInput = screen.getByLabelText(/nombre de la carpeta/i);
    await user.type(folderNameInput, 'Conducción Clase B');

    const saveFolderBtn = screen.getByRole('button', { name: /guardar carpeta/i });
    await user.click(saveFolderBtn);

    expect(screen.getByText('Conducción Clase B')).toBeInTheDocument();

    // Agregar vínculo dentro de la carpeta
    const addLinkBtn = screen.getByRole('button', { name: /\+ agregar vínculo/i });
    await user.click(addLinkBtn);

    const titleInput = screen.getByLabelText(/título del enlace/i);
    await user.type(titleInput, 'Test de Señales');

    const urlInput = screen.getByLabelText(/dirección url/i);
    await user.type(urlInput, 'https://conaset.cl');

    const saveLinkBtn = screen.getByRole('button', { name: /guardar vínculo/i });
    await user.click(saveLinkBtn);

    expect(screen.getByText('Test de Señales')).toBeInTheDocument();
    const anchor = screen.getByRole('link', { name: /abrir test de señales/i });
    expect(anchor).toHaveAttribute('href', 'https://conaset.cl');
    expect(anchor).toHaveAttribute('target', '_blank');
    expect(anchor).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
```

- [x] **Step 2: Ejecutar prueba para verificar fallo**

Ejecutar: `corepack pnpm exec vitest run src/tests/FoldersView.test.tsx`  
Resultado esperado: FAIL por componente inexistente.

- [x] **Step 3: Implementar `FoldersView`, `FolderModal`, `LinkModal` y sus estilos**

- `FolderModal`: formulario accesible para crear carpetas con nombre y color personalizado.
- `LinkModal`: formulario accesible con título, URL (validada contra `^https?://`), descripción opcional.
- `FoldersView`:
  - Selector lateral / carrusel de carpetas con contador de elementos.
  - Vista del contenido de la carpeta activa con dos secciones: "Vínculos & Documentos Web" y "Notas de la Carpeta".
  - Apertura segura de URLs con `target="_blank"` y `rel="noopener noreferrer"`.

- [x] **Step 4: Ejecutar prueba para verificar que pasa**

Ejecutar: `corepack pnpm exec vitest run src/tests/FoldersView.test.tsx`  
Resultado esperado: PASS.

- [x] **Step 5: Commit**

```bash
git add src/components/FoldersView* src/components/folders/* src/tests/FoldersView.test.tsx
git commit -m ":sparkles: feat(folders): implementar vista de carpetas tematicas y catalogo de vinculos web"
```

---

### Task 6: Integración en Navegación, Rutas y Botón "Nueva Nota" en `AppLayout`

**Files:**
- Modify: `src/routes/index.tsx`
- Modify: `src/components/AppLayout.tsx`
- Modify: `src/tests/AppLayout.test.tsx`
- Modify: `src/tests/routes.test.tsx`

**Interfaces:**
- Consumes: `NotesView`, `FoldersView`, `NoteModal`, `NAV_ITEMS`.
- Produces: Rutas `/notes` y `/folders` protegidas y lazy-loaded, enlaces activos en sidebar y modal global "+ Nueva Nota" en cabecera.

- [x] **Step 1: Escribir pruebas para las nuevas rutas y acciones en `AppLayout.test.tsx` y `routes.test.tsx`**

En `src/tests/routes.test.tsx`:
- Verificar navegación a `/notes` y `/folders`.

En `src/tests/AppLayout.test.tsx`:
- Verificar que el sidebar contiene los enlaces "Notas" y "Carpetas".
- Verificar que el botón "+ Nueva Nota" en la cabecera abre el modal de nota.

- [x] **Step 2: Ejecutar pruebas para verificar fallos**

Ejecutar: `corepack pnpm exec vitest run src/tests/AppLayout.test.tsx src/tests/routes.test.tsx`  
Resultado esperado: FAIL en los nuevos asertos.

- [x] **Step 3: Actualizar `src/routes/index.tsx` y `src/components/AppLayout.tsx`**

- En `src/routes/index.tsx`:
  - `const NotesView = lazy(...)` y `const FoldersView = lazy(...)`.
  - Rutas `<Route path="/notes" ... />` y `<Route path="/folders" ... />`.
- En `src/components/AppLayout.tsx`:
  - Agregar `notes` (`BookOpen`) y `folders` (`Folder`) a `NAV_ITEMS`.
  - Conectar botón "Nueva Nota" en `headerRight` que abre `NoteModal`.

- [x] **Step 4: Ejecutar pruebas para verificar que pasan**

Ejecutar: `corepack pnpm exec vitest run src/tests/AppLayout.test.tsx src/tests/routes.test.tsx`  
Resultado esperado: PASS.

- [x] **Step 5: Commit**

```bash
git add src/routes/index.tsx src/components/AppLayout.tsx src/tests/AppLayout.test.tsx src/tests/routes.test.tsx
git commit -m ":sparkles: feat(layout): conectar rutas de notas y carpetas y boton nueva nota en cabecera"
```

---

### Task 7: Verificación Integral de Suite, Compatibilidad y Build de Producción

**Files:**
- Test: Toda la suite en `src/tests/`
- Modify: `docs/superpowers/plans/2026-10-10-stitch-redesign-roadmap.md`

- [x] **Step 1: Ejecutar suite completa de pruebas unitarias y de integración**

Ejecutar: `corepack pnpm exec vitest run`  
Resultado esperado: Todos los tests pasan sin regresiones.

- [x] **Step 2: Ejecutar compilación de producción para validar tipos y bundle**

Ejecutar: `corepack pnpm build`  
Resultado esperado: Build exitoso sin errores de TypeScript ni advertencias de importación.

- [x] **Step 3: Actualizar roadmap en `docs/superpowers/plans/2026-10-10-stitch-redesign-roadmap.md`**

Marcar la fase F6 como completada en la documentación del roadmap maestro y actualizar el siguiente paso (F7 Bóveda).

- [x] **Step 4: Commit de documentación de release F6**

```bash
git add docs/superpowers/plans/2026-10-10-stitch-redesign-roadmap.md
git commit -m ":memo: docs(roadmap): actualizar estado de fase F6 a completada"
```
