# Búsqueda Global: Buscador Rápido y Accesible — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar un buscador global instantáneo y accesible para Espiralia que permite localizar eventos, tareas, bloques de planner, metas, notas y vínculos web del perfil activo mediante coincidencia multi-palabra y normalización de acentos, navegable vía atajo `Ctrl+K` y teclado accesible.

**Architecture:** Módulo de búsqueda local en memoria `src/services/searchService.ts` que consulta las entidades de `StorageService` del perfil activo con normalización lingüística. Diálogo accesible `GlobalSearchModal` en `src/components/search/` con región viva `aria-live`, navegación con flechas de teclado y disparador en la cabecera `AppLayout`.

**Tech Stack:** TypeScript 5.8, React 19.2, CSS Modules con tokens oficiales Claude/Espiralia, Lucide React (`Search`, `Calendar`, `CheckSquare`, `FileText`, `Target`, `Clock`, `ExternalLink`), Vitest 3.x y Testing Library React 16.x.

**Spec:** `docs/superpowers/specs/2026-10-15-busqueda-global-design.md`

## Global Constraints

- 100% en cliente sin servidores remotos ni telemetría (AGENTS.md §1, §10).
- Cero dependencias externas para búsqueda difusa: usar filtrado nativo con normalización Unicode `String.prototype.normalize('NFD')` (Ponytail discipline).
- Aislamiento estricto de datos por `profileId`: nunca retornar registros de otros perfiles locales (§10 A01).
- Touch target ≥ 44 px en todos los botones y filas interactivas de resultados (WCAG 2.2 AA).
- Commits en formato Conventional Commits + Gitmoji en español sin firmas de autoría de IA (§11).

## Review Focus

1. **Aislamiento estricto de perfiles:** Búsqueda en perfil B jamás debe retornar datos del perfil A, aun si las entidades tienen títulos idénticos o están almacenadas bajo claves similares.
2. **Normalización y caracteres diacríticos:** Búsqueda de "canción", "cancion", "CANCION" o "Reunión" debe encontrar indistintamente los registros sin importar mayúsculas o tildes.
3. **Manejo de entradas vacías o cortas:** Consultas de 0 o 1 carácter deben responder de inmediato con 0 resultados y mensaje orientador sin iterar colecciones ni congelar la interfaz.
4. **Navegación accesible con teclado en resultados:** El usuario puede recorrer la lista plana de resultados con flechas arriba/abajo sin perder el foco ni desbordar el índice, y presionar `Enter` debe navegar a la vista de la entidad y cerrar el modal.
5. **Comportamiento seguro de atajos globales:** El atajo `/` solo debe abrir el buscador cuando el usuario NO esté enfocado en un campo de texto o textarea editable, evitando interceptar la escritura ordinaria.

---

### Task 1: Motor de Búsqueda Local Reactivo (`src/services/searchService.ts`)

**Files:**
- Create: `src/services/searchService.ts`
- Create: `src/tests/searchService.test.ts`

**Interfaces:**
- Produces: `SearchResultType`, `SearchResultItem`, `GroupedSearchResults`, `normalizeSearchText(text)`, `SearchService.search(profileId, query)`.

- [x] **Step 1: Escribir pruebas unitarias del motor de búsqueda**

Crear `src/tests/searchService.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { SearchService, normalizeSearchText } from '../services/searchService';
import { StorageService } from '../services/storage';

describe('SearchService (Motor de Búsqueda Local)', () => {
  const profileA = 'p-search-a';
  const profileB = 'p-search-b';

  beforeEach(() => {
    localStorage.clear();
    // Perfil A con datos variados
    StorageService.saveProfile({ id: profileA, name: 'Perfil A', avatar: 'A', createdAt: '2026-10-15' });
    StorageService.saveTodo({ id: 't-1', profileId: profileA, title: 'Revisión médica anual', priority: 'alta', status: 'pendiente', createdAt: '2026-10-15' });
    StorageService.saveEvent({ id: 'e-1', profileId: profileA, title: 'Sesión de Terapia', date: '2026-10-20', startTime: '15:00', endTime: '16:00', category: 'salud' });
    StorageService.saveNote({ id: 'n-1', profileId: profileA, title: 'Reflexión sobre el descanso', content: 'Es crucial dormir 8 horas y desconectar pantallas.', createdAt: '2026-10-15', updatedAt: '2026-10-15' });
    StorageService.saveGoal({ id: 'g-1', profileId: profileA, title: 'Aprender TypeScript Avanzado', period: 'semanal', items: [{ id: 'gi-1', title: 'Leer sobre Template Literals', completed: false }], createdAt: '2026-10-15' });
    StorageService.savePlanner({ id: 'b-1', profileId: profileA, title: 'Bloque de estudio matutino', period: 'semanal', timeSlot: 'mañana', dayOfWeek: 1, completed: false });
    StorageService.saveLink({ id: 'l-1', profileId: profileA, title: 'Portal de Documentación React', url: 'https://react.dev', description: 'Referencia oficial de hooks', createdAt: '2026-10-15' });

    // Perfil B para validar aislamiento
    StorageService.saveProfile({ id: profileB, name: 'Perfil B', avatar: 'B', createdAt: '2026-10-15' });
    StorageService.saveTodo({ id: 't-b', profileId: profileB, title: 'Revisión médica oculta', priority: 'baja', status: 'pendiente', createdAt: '2026-10-15' });
  });

  it('normaliza texto eliminando acentos, espacios y convirtiendo a minúsculas', () => {
    expect(normalizeSearchText('  ¡Canción de Éxito!  ')).toBe('¡cancion de exito!');
    expect(normalizeSearchText('TERAPIA')).toBe('terapia');
  });

  it('retorna resultados vacíos si la consulta tiene menos de 2 caracteres', () => {
    const results = SearchService.search(profileA, 'a');
    expect(results.totalCount).toBe(0);
    expect(results.todos).toHaveLength(0);
  });

  it('encuentra tareas por coincidencia en título independientemente de tildes y mayúsculas', () => {
    const results = SearchService.search(profileA, 'revision medica');
    expect(results.todos).toHaveLength(1);
    expect(results.todos[0].title).toBe('Revisión médica anual');
    expect(results.todos[0].targetView).toBe('todo');
  });

  it('encuentra eventos de agenda y asigna targetView agenda', () => {
    const results = SearchService.search(profileA, 'terapia');
    expect(results.events).toHaveLength(1);
    expect(results.events[0].title).toBe('Sesión de Terapia');
    expect(results.events[0].targetView).toBe('agenda');
  });

  it('encuentra notas tanto por título como por contenido interior', () => {
    const byTitle = SearchService.search(profileA, 'descanso');
    expect(byTitle.notes).toHaveLength(1);

    const byContent = SearchService.search(profileA, 'dormir 8 horas');
    expect(byContent.notes).toHaveLength(1);
    expect(byContent.notes[0].targetView).toBe('notes');
  });

  it('encuentra metas y bloques de planner asignando sus vistas respectivas', () => {
    const goalRes = SearchService.search(profileA, 'typescript');
    expect(goalRes.goals).toHaveLength(1);
    expect(goalRes.goals[0].targetView).toBe('planner');

    const blockRes = SearchService.search(profileA, 'estudio');
    expect(blockRes.planner).toHaveLength(1);
    expect(blockRes.planner[0].targetView).toBe('planner');
  });

  it('encuentra vínculos web por título o descripción', () => {
    const linkRes = SearchService.search(profileA, 'react');
    expect(linkRes.links).toHaveLength(1);
    expect(linkRes.links[0].targetView).toBe('folders');
  });

  it('respeta aislamiento estricto y jamás retorna datos de otro perfil', () => {
    const results = SearchService.search(profileA, 'revision');
    expect(results.todos).toHaveLength(1);
    expect(results.todos[0].id).toBe('t-1');
    expect(results.todos.some(t => t.id === 't-b')).toBe(false);
  });
});
```

- [x] **Step 2: Ejecutar prueba para verificar fallo**

Ejecutar: `corepack pnpm exec vitest run src/tests/searchService.test.ts`  
Resultado esperado: FAIL por módulo inexistente.

- [x] **Step 3: Implementar `src/services/searchService.ts`**

Crear `src/services/searchService.ts`:
- Exportar `normalizeSearchText(text: string): string`.
- Exportar interfaces `SearchResultType`, `SearchResultItem`, `GroupedSearchResults`.
- Implementar `SearchService.search(profileId: string, query: string): GroupedSearchResults`:
  - Obtener colecciones con `StorageService.getTodos`, `getEvents`, `getNotes`, `getGoals`, `getPlanner`, `getLinks`, `getAreas`, `getFolders`.
  - Crear mapas auxiliares de áreas (`areaId -> Area.name`) y carpetas (`folderId -> Folder.name`).
  - Normalizar términos de búsqueda (`query.trim().split(/\s+/)`).
  - Calcular puntuación (título exacto/prefijo +10, título parcial +5, metadatos +2, contenido/cuerpo +1).
  - Ordenar descendente por puntuación.

- [x] **Step 4: Ejecutar prueba para verificar que pasa**

Ejecutar: `corepack pnpm exec vitest run src/tests/searchService.test.ts`  
Resultado esperado: PASS.

- [x] **Step 5: Commit**

```bash
git add src/services/searchService.ts src/tests/searchService.test.ts
git commit -m ":sparkles: feat(search): implementar motor de busqueda local en memoria para entidades de perfil"
```

---

### Task 2: Componente `GlobalSearchModal` Accesible (`src/components/search/GlobalSearchModal.tsx`)

**Files:**
- Create: `src/components/search/GlobalSearchModal.tsx`
- Create: `src/components/search/GlobalSearchModal.module.css`
- Create: `src/tests/GlobalSearchModal.test.tsx`

**Interfaces:**
- Consumes: `SearchService`, `ViewType`, Lucide icons (`Search`, `Calendar`, `CheckSquare`, `FileText`, `Target`, `Clock`, `ExternalLink`, `X`).
- Produces: `GlobalSearchModal` component con props `{ isOpen, onClose, onNavigate, profileId }`.

- [x] **Step 1: Escribir pruebas unitarias e interacción accesible de `GlobalSearchModal`**

Crear `src/tests/GlobalSearchModal.test.tsx`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GlobalSearchModal } from '../components/search/GlobalSearchModal';
import { StorageService } from '../services/storage';

describe('GlobalSearchModal', () => {
  const profileId = 'p-modal-search';

  beforeEach(() => {
    localStorage.clear();
    StorageService.saveProfile({ id: profileId, name: 'Usuario Prueba', avatar: 'U', createdAt: '2026-10-15' });
    StorageService.saveTodo({ id: 't-10', profileId, title: 'Comprar cuaderno de notas', priority: 'alta', status: 'pendiente', createdAt: '2026-10-15' });
    StorageService.saveNote({ id: 'n-10', profileId, title: 'Notas de diseño editorial', content: 'Estilo tipográfico Claude', createdAt: '2026-10-15', updatedAt: '2026-10-15' });
  });

  it('renderiza diálogo accesible con input de búsqueda cuando isOpen es true', () => {
    render(<GlobalSearchModal isOpen={true} onClose={vi.fn()} onNavigate={vi.fn()} profileId={profileId} />);

    expect(screen.getByRole('dialog', { name: /búsqueda global/i })).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: /buscar en toda la aplicación/i })).toBeInTheDocument();
    expect(screen.getByText(/escribe al menos 2 letras/i)).toBeInTheDocument();
  });

  it('busca y muestra resultados agrupados al escribir en el input', async () => {
    const user = userEvent.setup();
    render(<GlobalSearchModal isOpen={true} onClose={vi.fn()} onNavigate={vi.fn()} profileId={profileId} />);

    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'cuaderno');

    expect(screen.getByText('Comprar cuaderno de notas')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/se encontró 1 resultado|se encontraron 1 resultados/i);
  });

  it('permite seleccionar un resultado y dispara onNavigate a la vista adecuada', async () => {
    const user = userEvent.setup();
    const handleNavigate = vi.fn();
    render(<GlobalSearchModal isOpen={true} onClose={vi.fn()} onNavigate={handleNavigate} profileId={profileId} />);

    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'editorial');

    const resultItem = screen.getByText('Notas de diseño editorial');
    await user.click(resultItem);

    expect(handleNavigate).toHaveBeenCalledWith('notes');
  });

  it('cierra el diálogo al presionar la tecla Escape', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    render(<GlobalSearchModal isOpen={true} onClose={handleClose} onNavigate={vi.fn()} profileId={profileId} />);

    await user.keyboard('{Escape}');
    expect(handleClose).toHaveBeenCalled();
  });
});
```

- [x] **Step 2: Ejecutar prueba para verificar fallo**

Ejecutar: `corepack pnpm exec vitest run src/tests/GlobalSearchModal.test.tsx`  
Resultado esperado: FAIL por componente inexistente.

- [x] **Step 3: Implementar `GlobalSearchModal.module.css` y `GlobalSearchModal.tsx`**

- Estilos en `GlobalSearchModal.module.css`:
  - Backdrop desenfocado con `backdrop-filter: blur(4px)`.
  - Contenedor flotante centrado con tokens oficiales de Claude/Espiralia (`--color-canvas`, `--color-hairline`, `--radius-lg`, `--shadow-lg`).
  - Campo de búsqueda con icono de lupa, input estilizado y botón de limpiar `X`.
  - Lista de resultados scrollable con headers por grupo (`Tareas`, `Eventos`, `Notas`, `Metas`, `Planner`, `Vínculos`).
  - Tarjetas de resultado con altura mínima 44 px, iconos temáticos y badges.
  - Pie del modal con tips de teclado (`↑↓ para navegar`, `↵ para abrir`, `esc para salir`).
- Lógica en `GlobalSearchModal.tsx`:
  - Trampa de foco y autofocus en el input.
  - Manejo de navegación por teclado: flechas `ArrowDown`/`ArrowUp` para mover el índice seleccionado, `Enter` para activar.
  - Región viva `role="status"` con `aria-live="polite"`.

- [x] **Step 4: Ejecutar prueba para verificar que pasa**

Ejecutar: `corepack pnpm exec vitest run src/tests/GlobalSearchModal.test.tsx`  
Resultado esperado: PASS.

- [x] **Step 5: Commit**

```bash
git add src/components/search/* src/tests/GlobalSearchModal.test.tsx
git commit -m ":sparkles: feat(search): implementar modal accesible GlobalSearchModal con navegacion por teclado"
```

---

### Task 3: Integración en `AppLayout` y Atajo Global `Ctrl+K` (`src/components/AppLayout.tsx`)

**Files:**
- Modify: `src/components/AppLayout.tsx`
- Modify: `src/components/AppLayout.module.css`
- Modify: `src/tests/AppLayout.test.tsx`

**Interfaces:**
- Consumes: `GlobalSearchModal`, `Search` icon.
- Produces: Botón disparador en `topHeader`, atajos de teclado globales `Ctrl+K` / `Cmd+K` y `/`, resolución de deuda técnica en tests de layout.

- [x] **Step 1: Actualizar `src/tests/AppLayout.test.tsx`**

- En `it('no muestra controles de features que todavía no existen')`:
  - Remover la prohibición de controles de búsqueda (el buscador global ya existe en F8).
  - Incluir el botón disparador de búsqueda en la lista esperada de botones accesibles (`names`).
- Añadir pruebas:
```typescript
it('abre el modal de Búsqueda Global al hacer click en el disparador de la cabecera', async () => {
  const user = userEvent.setup();
  renderLayout();

  const searchBtn = screen.getByRole('button', { name: /buscar en espiralia/i });
  await user.click(searchBtn);

  expect(screen.getByRole('dialog', { name: /búsqueda global/i })).toBeInTheDocument();
});

it('abre el modal de Búsqueda Global al pulsar el atajo Ctrl+K', async () => {
  const user = userEvent.setup();
  renderLayout();

  await user.keyboard('{Control>}k{/Control}');

  expect(screen.getByRole('dialog', { name: /búsqueda global/i })).toBeInTheDocument();
});
```

- [x] **Step 2: Ejecutar prueba para verificar fallo**

Ejecutar: `corepack pnpm exec vitest run src/tests/AppLayout.test.tsx`  
Resultado esperado: FAIL por ausencia del disparador y modal de búsqueda.

- [x] **Step 3: Implementar disparador y modal en `src/components/AppLayout.tsx` y estilos en `AppLayout.module.css`**

- En `AppLayout.module.css`:
  - `.searchTrigger`: botón con aspecto de campo de búsqueda editorial, borde hairline, fondo surface card, icono de lupa, texto placeholder y `<kbd className={styles.searchKbd}>Ctrl+K</kbd>`. Touch target ≥ 44 px.
- En `AppLayout.tsx`:
  - Estado `const [isSearchOpen, setIsSearchOpen] = useState(false);`
  - Efecto `useEffect` global de teclado para detectar `(e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k'`, previniendo default y activando `setIsSearchOpen(prev => !prev)`.
  - Disparador en `topHeader` entre el título de la vista y las acciones de la derecha:
  ```tsx
  <button
    type="button"
    className={styles.searchTrigger}
    onClick={() => setIsSearchOpen(true)}
    aria-label="Buscar en Espiralia (Ctrl+K)"
  >
    <Search size={16} aria-hidden="true" />
    <span className={styles.searchPlaceholder}>Buscar en Espiralia...</span>
    <kbd className={styles.searchShortcut}>Ctrl+K</kbd>
  </button>
  ```
  - Renderizar `<GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} onNavigate={(view) => onViewChange(view)} profileId={currentProfile.id} />`.

- [x] **Step 4: Ejecutar prueba para verificar que pasa**

Ejecutar: `corepack pnpm exec vitest run src/tests/AppLayout.test.tsx`  
Resultado esperado: PASS.

- [x] **Step 5: Commit**

```bash
git add src/components/AppLayout* src/tests/AppLayout.test.tsx
git commit -m ":sparkles: feat(layout): integrar disparador de busqueda global y atajo Ctrl+K en cabecera"
```

---

### Task 4: Verificación Integral, Cierre de Deuda Técnica y Actualización de Roadmap

**Files:**
- Modify: `docs/superpowers/plans/2026-10-10-stitch-redesign-roadmap.md`
- Test: Toda la suite en `src/tests/`

- [x] **Step 1: Ejecutar suite completa de pruebas**

Ejecutar: `corepack pnpm exec vitest run`  
Resultado esperado: 37 suites de pruebas y 255+ tests pasando al 100%.

- [x] **Step 2: Ejecutar compilación de producción**

Ejecutar: `corepack pnpm build`  
Resultado esperado: Build exitoso sin errores de TypeScript ni advertencias.

- [x] **Step 3: Actualizar roadmap en `docs/superpowers/plans/2026-10-10-stitch-redesign-roadmap.md`**

Marcar la fase F8 como completada en la documentación del roadmap maestro, resolver "Buscador global" en la tabla de deuda técnica y documentar la culminación del ciclo de fases F1–F8 de Espiralia.

- [x] **Step 4: Commit de documentación de release F8**

```bash
git add docs/superpowers/plans/2026-10-10-stitch-redesign-roadmap.md docs/superpowers/plans/2026-10-15-busqueda-global.md
git commit -m ":memo: docs(roadmap): actualizar estado de fase F8 a completada y cerrar deuda tecnica"
```
