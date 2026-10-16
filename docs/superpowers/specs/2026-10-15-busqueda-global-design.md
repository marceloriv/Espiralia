# F8 — Búsqueda Global: Buscador Rápido y Accesible — Especificación de Diseño

**Fecha:** 2026-10-15  
**Estado:** Aprobado  
**Fase del Roadmap:** F8  
**Referencias:** `docs/superpowers/plans/2026-10-10-stitch-redesign-roadmap.md`, `AGENTS.md` (§1 Resumen, §5 Estilo, §6 Ponytail, §7 Pruebas, §10 Seguridad A01, A08).

---

## 1. Contexto y Objetivos

Espiralia centraliza múltiples dominios de productividad personal y bienestar emocional: Agenda de eventos con FullCalendar v7, Planner semanal con metas, lista To-Do con estados y áreas temáticas, Cuaderno digital de Reflexiones (Notas) y Carpetas con vínculos web guardados.

Para permitir que el usuario localice instantáneamente cualquier registro sin tener que alternar manualmente de vista en vista, la aplicación incorpora una **Búsqueda Global**:

1. **Disparador en cabecera (`topHeader`):** Acceso visible y permanente en la barra superior con diseño sobrio tipo input/botón con etiqueta "Buscar en Espiralia..." y atajo contextual `Ctrl+K` / `⌘K`.
2. **Modal / Command Palette accesible (`GlobalSearchModal`):** Diálogo modal accesible (`role="dialog"`, `aria-modal="true"`) centrado en pantalla, con autofocus en el input de búsqueda (`role="searchbox"`), soporte de atajos de teclado globales (`Ctrl+K`, `Cmd+K`, y tecla `/` cuando no se esté en un campo de texto editable).
3. **Motor de búsqueda local reactivo (`searchService.ts`):** Indexación y filtrado en memoria sobre `StorageService` del perfil activo abarcando:
   - **Tareas To-Do:** título, notas, nombre del área temática asociada (resuelto desde `Area.name`), prioridad y estado.
   - **Eventos de Agenda:** título, categoría, notas descriptivas y fecha programada.
   - **Notas y Reflexiones:** título, contenido de la nota.
   - **Metas y Objetivos:** título, descripción y nombres de sub-items checklist.
   - **Bloques de Planner:** título, franja horaria (`mañana`, `tarde`, `noche`) y día de la semana.
   - **Vínculos Web:** título, URL, descripción y nombre de la carpeta contenedora.
4. **Normalización lingüística sin dependencias pesadas (Ponytail discipline):**
   - Comparación case-insensitive e insensible a acentos mediante `String.prototype.normalize('NFD')`.
   - Matching multi-palabra (todas las palabras de la consulta deben coincidir en algún campo del elemento).
   - Relevancia simple: mayor puntuación a coincidencias en el título que en campos secundarios.
5. **Navegación interactiva inmediata:** Al hacer clic o presionar `Enter` sobre un resultado, el sistema transiciona a la vista correspondiente (`todo`, `agenda`, `planner`, `notes`, `folders`) y cierra el buscador.
6. **Aislamiento estricto de perfiles:** Nunca se exponen ni buscan registros de otros perfiles locales (§10 A01).
7. **Accesibilidad completa (WCAG 2.2 AA):**
   - Navegación con teclado mediante flechas arriba/abajo (`aria-activedescendant`).
   - Notificación a tecnologías asistivas del número de coincidencias mediante región viva (`aria-live="polite"`).
   - Contraste estricto según tokens oficiales Claude/Espiralia y touch targets ≥ 44 px.

---

## 2. Requisitos Funcionales

### RF-01: Disparador en la Cabecera (`AppLayout`)
- Ubicado en `topHeader` entre el título de la vista actual y las acciones del perfil/nueva nota.
- Botón accesible con icono de lupa (`Search`), texto "Buscar en Espiralia..." y etiqueta visual de atajo `<kbd>Ctrl+K</kbd>` (o `⌘K` en macOS).
- Al hacer clic o al presionar `Ctrl+K` / `Cmd+K` en cualquier parte de la aplicación, se despliega `GlobalSearchModal`.
- Tecla `/` también abre el buscador si el foco no está en un `<input>`, `<textarea>` o elemento con `contenteditable`.

### RF-02: Modelo de Resultados (`SearchResultItem`)
```typescript
export type SearchResultType = 'todo' | 'event' | 'note' | 'goal' | 'planner' | 'link';

export interface SearchResultItem {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  badge?: string;       // Ej: 'Trabajo', 'Salud', 'Lunes'
  dateInfo?: string;    // Ej: '15 oct 2026', '10:00 - 11:30'
  targetView: ViewType; // 'todo' | 'agenda' | 'planner' | 'notes' | 'folders'
  score: number;
}

export interface GroupedSearchResults {
  todos: SearchResultItem[];
  events: SearchResultItem[];
  notes: SearchResultItem[];
  goals: SearchResultItem[];
  planner: SearchResultItem[];
  links: SearchResultItem[];
  totalCount: number;
}
```

### RF-03: Motor de Búsqueda Local (`searchService.ts`)
- Módulo `SearchService.search(profileId: string, query: string): GroupedSearchResults`.
- Normalización con:
  ```typescript
  export function normalizeSearchText(text: string): string {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }
  ```
- Si la longitud de la consulta limpia es menor a 2 caracteres, retorna `totalCount: 0` y grupos vacíos.
- Las consultas con múltiples palabras se dividen por espacios: cada token debe estar presente en el conjunto de campos indexados del elemento.
- Scoring:
  - Coincidencia exacta o de prefijo en el título: +10 puntos.
  - Coincidencia parcial en el título: +5 puntos.
  - Coincidencia en subtítulos, áreas, carpetas o notas: +2 puntos.
  - Coincidencia en contenido extenso (cuerpo de notas o URLs): +1 punto.

### RF-04: Componente `GlobalSearchModal`
- Estructura DOM:
  - Overlay backdrop con clic para cerrar.
  - Contenedor modal con `role="dialog"`, `aria-modal="true"`, `aria-label="Búsqueda global"`.
  - Encabezado con icono de lupa, input de búsqueda (`role="searchbox"`, `autoFocus`, `aria-label="Buscar en toda la aplicación"`, placeholder "Buscar eventos, tareas, notas, metas o enlaces...").
  - Botón de limpiar consulta o botón cerrar con tecla Escape.
  - Región viva `aria-live="polite"` que anuncia: `"Se encontraron X resultados"` o `"Sin resultados"`.
  - Lista de resultados organizada por secciones colapsables o encabezados visuales claros:
    - **Tareas To-Do** (icono `CheckSquare`)
    - **Eventos de Agenda** (icono `Calendar`)
    - **Notas & Reflexiones** (icono `FileText`)
    - **Metas & Objetivos** (icono `Target`)
    - **Bloques de Planner** (icono `Clock`)
    - **Carpetas & Vínculos** (icono `ExternalLink` / `Bookmark`)
- Interacción por teclado:
  - Flecha abajo (`ArrowDown`): selecciona el siguiente elemento en la lista global plana.
  - Flecha arriba (`ArrowUp`): selecciona el elemento anterior.
  - Tecla `Enter`: activa el elemento seleccionado, ejecuta `onNavigate(item.targetView)` y cierra el modal.
  - Tecla `Escape`: cierra el modal y devuelve el foco al disparador.
- Estados vacíos:
  - Input vacío (< 2 caracteres): Mensaje de guía: "Escribe al menos 2 letras para buscar en todas tus tareas, eventos, notas, metas y vínculos".
  - Sin coincidencias: "No se encontraron resultados para '{query}'" con recomendación: "Intenta con palabras más cortas o revisa la ortografía".

### RF-05: Integración con `AppLayout` y Cierre de Deuda Técnica
- Se integra en `src/components/AppLayout.tsx`.
- Se actualiza el test de deuda técnica en `src/tests/AppLayout.test.tsx`:
  - Se remueve la prohibición de controles de búsqueda.
  - Se añade la prueba de renderizado del disparador de búsqueda.
  - Se prueba la apertura del modal al hacer clic en el disparador y mediante el atajo `Ctrl+K`.

---

## 3. Seguridad y Privacidad

1. **Aislamiento estricto por `profileId`:** Todas las llamadas a `StorageService` en `SearchService` reciben el `profileId` autenticado. Jamás se leen colecciones de otros perfiles locales (§10 A01).
2. **Sin persistencia de búsquedas ni telemetría:** El término de búsqueda se procesa puramente en memoria transitoria de React (`useState`). No se envía a ningún endpoint ni se guarda en cookies o analíticas externas (§10 A02).
3. **Sanitización de renderizado:** Todo texto coincidente se renderiza como contenido de texto de React libre de inyecciones de código o `dangerouslySetInnerHTML` (§10 A05).

---

## 4. Accesibilidad y Ergonomía

1. **Touch Targets:** Todos los botones del modal y cada ítem de resultado tienen una altura mínima de 44 px (WCAG 2.5.5 / 2.5.8).
2. **Contraste:** Textos con ratio ≥ 4.5:1 sobre fondo claro (`--color-canvas` y `--color-surface-card`).
3. **Anuncios para lectores de pantalla:** La región de anuncios expone de forma concisa el cambio en el número de coincidencias.
4. **Foco predecible:** Al abrirse el modal, el foco viaja automáticamente al input de búsqueda. Al cerrarse, el foco regresa al botón disparador de la barra superior.

---

## 5. Criterios de Aceptación

- [ ] `SearchService.search` filtra correctamente tareas, eventos, notas, metas, bloques y vínculos del perfil activo con acentos y mayúsculas normalizados.
- [ ] No se devuelven resultados de otros perfiles cuando existen múltiples perfiles en `localStorage`.
- [ ] El modal `GlobalSearchModal` permite navegar entre resultados con teclado (Flecha arriba, Flecha abajo y Enter) y cerrar con Escape.
- [ ] Al seleccionar un resultado, el sistema navega a la vista de destino correspondiente.
- [ ] El disparador de búsqueda en `AppLayout` responde a clics y al atajo `Ctrl+K` / `Cmd+K`.
- [ ] La suite de tests completa pasa al 100% (255+ tests) sin regresiones.
- [ ] `corepack pnpm build` compila limpiamente sin errores de tipos.
