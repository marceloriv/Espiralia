# Changelog

Todas las modificaciones notables de este proyecto se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [0.4.0] - 2026-10-25

### Added

- **Sistema de papeles (`Papel` y `Pliego`)**: cada módulo tiene su tinte (arena en el Dashboard, pizarra en Agenda, salvia en Planner, terracota en To-Do, ámbar en Notas, rosa en Carpetas y turquesa en Integraciones). Las tarjetas son de papel rasgado con cuadrícula y el pliego encuadernado con anillas lleva la tarea principal de cada vista.
- **Degradados por tinte y hoja de origami**: cada superficie nace de su tinte y vuelve al papel claro; la barra lateral estrena un degradado y una hoja con tres figuras plegadas en CSS (molinillo, caracol y rosa). La hoja solo se muestra desde 1024px de ancho y 900px de alto, y el giro del molinillo se detiene con `prefers-reduced-motion`.
- **Borrar un perfil desde Ajustes**: elimina el perfil y todos sus datos. En un perfil protegido exige el PIN actual.
- **Respaldo y restauración por perfil** con cifrado opcional; el respaldo del acceso usa el mismo formato que la Bóveda Offline.
- **Planner**: columna del día de hoy resaltada, bloques ordenados por hora con la hora a la cabeza, y hábitos y energía reales en el cajón de la semana.
- **Dashboard**: franja de cuatro indicadores de serenidad, fecha como hoja de calendario, bloques y hábitos del domingo, y orden pensado para móvil con las tareas primero.
- **Barra inferior móvil** con cuatro destinos y un botón "Más" (Notas, Carpetas, Integraciones).
- **Transición de página** de 240ms al cambiar de vista y grano de papel en el fondo, ambos sin movimiento con `prefers-reduced-motion`.
- **Medición de cobertura** con `@vitest/coverage-v8` y umbral de 80% en líneas y ramas; eslint corre ahora antes del despliegue. El reporte `lcov` alimenta el análisis de SonarQube local.
- **Aviso ante errores de render**: si una vista falla, la app muestra "Algo salió mal" con un botón para recargar en vez de una pantalla en blanco; los datos siguen guardados.
- **Buscadores**: `robots.txt` y una descripción más completa de la página.

### Changed

- **Tipografía autoalojada**: Fraunces, Atkinson Hyperlegible Next, Reenie Beanie y Spline Sans Mono, con escala fluida en los titulares. Ya no se carga nada desde Google Fonts.
- **Acceso por PIN** unificado en un solo diálogo; el acceso y el fondo de la app quedan en marfil liso, sin cuadrícula de puntos.
- **Textos**: la interfaz queda en español, sin contenido personal de ejemplo, sin números de versión ni afirmaciones que la app no cumple (certificaciones, cifrado en la landing). Los perfiles nuevos ven estados vacíos honestos.
- **Contraste**: tokens de texto con 4.5:1 como mínimo, incluido el texto del Papel en la esquina más oscura del degradado; piso de 11px en tipografía.
- **Áreas táctiles** de 44px como mínimo en controles y checkboxes de To-Do y Planner, con anillo de foco visible.
- Umbral de bundle de `AGENTS.md` §17.1 medido sobre la carga inicial real.
- **Carga**: las cuatro fuentes se precargan, lo que lleva el salto de diseño de la Landing de 0.20 a 0.00 y su carga principal de 1.18 s a 0.85 s.
- **Foco de los diálogos**: al abrirse llevan el foco a su primer control y lo devuelven al cerrarse; los campos que el usuario revela con un clic reciben el foco al montarse.

### Fixed

- Aviso de PIN olvidado: ya no promete una recuperación que no existe.
- `QuotaExceededError` de `localStorage` se captura y avisa sin dejar la interfaz en blanco.
- Desbordes horizontales en el encabezado entre 769px y 1280px, en Carpetas a 1440px y en el Planner en móvil.
- Los diálogos de foco, área y metas se cierran con Escape.
- Métricas del Dashboard (semana, rendimiento y almacenamiento) calculadas con datos reales.
- La copia completa de Integraciones se puede restaurar.
- Accesibilidad: el buscador y la zona de arrastre `.ics` tienen un nombre accesible igual a su texto visible; las reflexiones del Dashboard y las opciones de restauración de la Bóveda tienen etiqueta asociada; el Planner ya no anida un segundo `main`; el pie de la Landing es una navegación con nombre.
- Contraste de las notas, de la insignia oscura y de los textos del Papel en la Landing, con 4.5:1 como mínimo.
- Los últimos textos en inglés de la interfaz ("Energy Check", "Client-Side") quedan en español.

### Security

- Fuentes servidas desde el propio sitio: la app no hace peticiones a dominios externos (guardián en `noExternalRequests.test.ts`).
- Política de seguridad de contenido en la build: solo recursos del propio sitio, sin objetos incrustados ni formularios hacia otros dominios.
- Los identificadores nuevos de notas diarias, subtareas y eventos importados usan `crypto.getRandomValues` en vez de `Math.random`.
- Dependencias de desarrollo `zod` 4.6.7 y `undici` 8.12.3, con los avisos de `pnpm audit` corregidos; `pnpm audit --prod` estaba limpio.
- Sin cambios en las claves ni en la forma de los datos guardados: los datos de versiones anteriores se leen igual (`legacyDataCompat.test.tsx`).

## [0.3.0] - 2026-10-16

### Added

- **Página de inicio editorial Stitch (`LandingView`)**:
  - Vista de bienvenida y mesa de trabajo editorial en `/inicio` con acceso público sin requerir perfil activo.
  - Widget interactivo de intenciones diarias (calma mental, foco profundo, arranque suave) con persistencia temporal y anuncios accesibles en vivo (`aria-live="polite"`).
  - Mesa de trabajo editorial interactiva con vista previa de columnas (Enfoque, Tareas, Espacio Mental) y barras de progreso con `role="progressbar"` y valores accesibles.
  - Gráfico dinámico de ritmo semanal integrado con `@polar-sh/react`, renderizando el progreso de bloques completados con anillos concéntricos y etiqueta textual accesible.
- **Áreas temáticas clave integradas en To-Do**:
  - Vista de espacio de trabajo unificado (`AreaIntegratedWorkspace`) combinando tareas del área, agenda contextual de eventos y notas vinculadas en una sola pantalla.
  - Sembrado contextual de áreas iniciales con paletas cromáticas diferenciadas y filtros dedicados.
- **Centro de integraciones externas (`IntegrationsView`)**:
  - Pantalla editorial de integraciones con soporte para exportación e importación de calendarios en formato `.ics` estándar (`IcsService`).
  - Atajos directos a Google Calendar Web con parámetros seguros (`action=TEMPLATE`) y plantillas de correo para Gmail precompiladas con enlaces `mailto:`.
  - Banner informativo de privacidad garantizando arquitectura 100% local en cliente sin fuga de datos a servidores externos.
- **Mejoras del Dashboard principal**:
  - Aforismo reflexivo dinámico y sección de 4 accesos instantáneos ("A un solo clic") para captura y navegación rápida.

### Changed

- **Refinamiento visual y accesibilidad (H1-H7)**:
  - Tokens globales de Claude/Espiralia en `src/index.css` (`--font-headline`, `--color-accent`, `--color-ink-muted`).
  - Ajuste de dimensiones táctiles mínimas a 44px en controles interactivos de modales y dashboard (WCAG 2.5.5 / 2.5.8).
  - Optimización de contrastes cromáticos y visibilidad de anillos de enfoque en estados hover y focus.
  - Desplazamiento horizontal fluido y scroll suave en cuadrícula semanal de Planner en pantallas medianas y tablets.
- **Optimización de servicios (disciplina Ponytail)**:
  - Simplificación radical de `StorageService` (-180 líneas), unificando serialización directa en `localStorage` con fallbacks seguros.
  - Adopción de `scheduler.yield()` nativo con fallback a `Promise.resolve()` en bucles de búsqueda cooperativa.
  - Centralización de utilidades de codificación hexadecimal (`toHex`, `fromHex`) en módulo compartido `src/utils/hex.ts`.

### Removed

- Eliminación de capa en sombra `EspiraliaIDB` (`src/services/idb.ts`), suite asociada y duplicación en `localStorage`.
- Eliminación de assets huérfanos no referenciados (`hero.png`, `react.svg`, `vite.svg`).

## [0.2.0] - 2026-10-15

### Added

- Vista de Planner Semanal con grilla de 7 días (Lunes a Domingo), asignación de franjas horarias y panel lateral interactivo de metas (`GoalsDrawer`) con cálculo de avance porcentual en tiempo real.
- Motor de persistencia estructurada local con IndexedDB (`EspiraliaIDB`) para notas de texto enriquecidas, vista de carpetas temáticas con contadores reactivos y catálogo de enlaces web con metadatos.
- Sistema de Bóveda Offline (`VaultModal`) con respaldo y restauración cifrada punto a punto mediante Web Crypto API (AES-GCM de 256 bits y derivación de clave con PBKDF2).
- Modal de búsqueda global unificado (`GlobalSearchModal`) con atajo de teclado global Ctrl+K / Cmd+K, navegación accesible por teclado y chunking cooperativo de iteraciones mediante `scheduler.yield` / `yieldNow` para optimizar INP.
- Configuración oficial de React Doctor (`doctor.config.json`) certificando una salud de código de 100/100 (0 errores de compilación, 0 advertencias de accesibilidad y hooks).

### Changed

- Reemplazo de cascadas de actualización de estado (`setState` en `useEffect`) por montaje condicional en los 7 modales principales del sistema (`QuickActionModal`, `VaultModal`, `GlobalSearchModal`, `FolderModal`, `LinkModal`, `NoteModal`, `PlannerBlockModal`).
- Eliminación de prop-mirroring en `AppLayout` y establecimiento de flujo de datos unidireccional para el perfil activo a través de rutas protegidas.
- Desacoplamiento de operaciones asíncronas criptográficas a módulo puro `profileOperations.ts` para total compatibilidad con el compilador de React 19.
- Promoción semántica del título de la vista activa a encabezado `<h2>` en `AppLayout` (WCAG 1.3.1).
- Activación de desplazamiento suave global (`scroll-behavior: smooth`) y tamaño tipográfico legible en etiquetas de atajo `kbd` (12px).

### Fixed

- Corrección de visibilidad de anillos de enfoque (`:focus-visible`) reemplazando reglas `outline: none` en todos los controles interactivos, modales y formularios (WCAG 2.4.7).
- Elevación de dimensiones mínimas táctiles a 44px en botones de ajustes, acción rápida y cancelación de fechas (WCAG 2.5.5 / WCAG 2.5.8).
- Adición del atributo accesible dinámico `aria-pressed` en selectores de paleta de colores de áreas temáticas en `TodoView` y `FolderModal` (WCAG 4.1.2).
- Eliminación de botones interactivos anidados en el explorador de carpetas (`FoldersView`) para cumplimiento estricto del estándar HTML.
- Inclusión de nombre accesible explícito (`aria-label`) en el botón de agregado de sub-tareas de `GoalsDrawer`.

## [0.1.3] - 2026-10-12

### Added

- Modal accesible de captura rápida (`QuickActionModal`) para creación inmediata de tareas (con área y prioridad) y eventos de agenda (con fecha y categoría).
- Modal de gestión de perfiles y seguridad (`ProfileSettingsModal`) para fijar, modificar o remover PIN numérico con hashing criptográfico PBKDF2 en Web Crypto.
- Integración en barra lateral (`AppLayout`) de botón prominente "+ Acción Rápida" y acceso "Ajustes & PIN" en el pie del menú.
- Sección de "Áreas Temáticas Clave" en el Dashboard principal (`DashboardView`) con métricas calculadas y barras de progreso por área según diseño de Stitch.
- Plan detallado de refinamiento visual y resolución de deuda técnica de Stitch en `docs/superpowers/plans/2026-10-12-stitch-visual-refinements-and-backlog.md`.

### Fixed

- Corrección de nombres accesibles y prevención de etiquetas con `undefined` en botones de completar y eliminar bloques del planificador (`PlannerView`).
- Vinculación explícita de atributos `id` y `name` en controles de formulario de bloques en `PlannerView`.
- Eliminación de advertencias de linter y tipado estricto en serialización de tareas y tipos de bloques legados en `StorageService`.

### Changed

- Actualización de contratos de interfaz y pruebas en `AppLayout.test.tsx` para reflejar controles activos de Acción Rápida y Ajustes de PIN.
- Actualización de hoja de ruta de diseño de Stitch en `docs/superpowers/plans/2026-10-10-stitch-redesign-roadmap.md` marcando controles resueltos.

## [0.1.2] - 2026-10-09

### Changed

- Actualización de entorno de ejecución a Node.js 24 en workflow de GitHub Actions y especificación del proyecto.

## [0.1.1] - 2026-10-09

### Fixed

- Actualización de versión de Node.js a 22 (LTS) en workflow de GitHub Actions para compatibilidad de WebIDL (`markAsUncloneable`) en runtime de jsdom y undici.

## [0.1.0] - 2026-10-09

### Added

- Arquitectura Single Page Application cliente con React 19, TypeScript y Vite.
- Sistema de perfiles locales independientes con aislamiento en localStorage.
- Protección opcional de perfil mediante PIN numérico con teclado integrado.
- Vista de Agenda con vista de calendario mensual y agenda diaria de eventos.
- Vista de Planner con división por franjas horarias y gestión de bloques de enfoque.
- Vista de Tareas (To-Do) con filtros por estado, selector de prioridades y mensajes explicativos contextuales para listas vacías.
- Dashboard centralizado con métricas de productividad y accesos directos.
- Sistema de navegación responsiva con sidebar de escritorio y barra inferior para dispositivos móviles.
- Enrutamiento modular con HashRouter (`react-router-dom`) para compatibilidad completa con despliegues estáticos.
- Tokens de diseño globales con paleta cálida y soporte de alto contraste accesible (WCAG AA).

### Changed

- Optimización táctil con áreas de interacción de 44px mínimo en botones de acción y controles móviles.
- Reflow adaptativo y apilamiento vertical en vistas de Agenda y Planner para pantallas estrechas.
- Sincronización y persistencia de estado reactivo mediante StorageService aislado por identificador de perfil.

### Fixed

- Eliminación de dependencias y referencias de importación no utilizadas para compilación estricta de TypeScript.
- Manejo seguro de cuota y serialización JSON ante excepciones de almacenamiento local.

### Operations

- Pipeline de CI/CD automatizado en GitHub Actions (`.github/workflows/deploy.yml`) para despliegue continuo en GitHub Pages.
- Suite de pruebas automatizadas con Vitest y Testing Library React con cobertura integral en `src/tests/`.
- Configuración de resolución de rutas relativas en Vite para entornos con subruta.
