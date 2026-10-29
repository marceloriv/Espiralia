# Changelog

Todas las modificaciones notables de este proyecto se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [0.6.0] - 2026-10-29

### Added

- **Subir PDF a las carpetas**: ahora se pueden subir archivos del computador a Carpetas. Por ahora solo se admiten PDF.
  - El tamaño máximo es 10 MB.
  - La subida revisa el contenido, no solo la extensión: el archivo debe empezar por `%PDF-`.
  - Cada PDF aparece en la tabla de su carpeta con Abrir (en el visor del navegador), Descargar y Eliminar con confirmación.
  - Los PDF se guardan en IndexedDB, porque `localStorage` admite unos 5 MB y un solo PDF lo llenaría.
  - Borrar una carpeta borra sus PDF, y la confirmación lo avisa. Borrar un perfil también borra sus PDF.
  - El módulo de archivos se carga solo cuando hace falta, así que no suma peso a la carga inicial.
- **PDF en el respaldo**: los tres puntos de exportación (Bóveda Offline, acceso e Integraciones) incluyen los PDF.
  - Los PDF viajan en base64 en un campo opcional `files`. Los respaldos anteriores siguen siendo válidos.
  - Si IndexedDB falla, el respaldo sale igual sin los PDF y la app lo avisa.
  - Al restaurar, cada PDF se valida igual que una subida y se guarda con un id nuevo. Así no pisa archivos de otro perfil.
- **Limpiar semana** en el Planner: borra todos los bloques semanales del perfil tras confirmar. Los bloques mensuales se conservan. Antes había que borrarlos uno por uno.
- **Editar compromisos** en el Dashboard: pulsar el texto de un compromiso lo vuelve editable.
  - Enter o salir del campo guarda el cambio. Escape cancela.
  - Dejar el texto vacío no borra el compromiso. Para borrarlo sigue la X.

### Changed

- **Superficies con el color de su módulo**: Agenda, el cuaderno de Notas, "Notas y vaciado mental", "Reflexión del día" y "Ritmo & Estado de Ánimo" se veían casi blancos. Ahora conservan su tinte.
  - El degradado por tinte (`--superficie-<tinte>`) va del 72 % al 40 % del tinte y ya no llega a blanco.
  - El almanaque de Agenda lleva pizarra en el marco y en la grilla de días. El cuaderno de Notas lleva ámbar.
  - El texto sigue en 4.5:1 de contraste o más en ambos extremos.
- **To-Do igual que las demás vistas**: conservaba un degradado hasta blanco y se veía más pálido. Ahora usa la misma superficie que el resto.
- **Contenedores más suaves** en Áreas y Métricas, que solo agrupan tarjetas: pasan del 45 % al 20 % del tinte (`--contenedor-<tinte>`). Así sus tarjetas resaltan y la superficie grande del Dashboard no le quita el foco al saludo.
- **Favicon propio**: la pestaña ya no muestra el logo de Vite. El ícono nuevo es una hoja rosa con la esquina doblada y una espiral en el morado de marca, en línea con las fichas de papel de la app.

### Fixed

- **Próximos hitos**: mostraba los 3 eventos más antiguos, incluidos los ya pasados. Ahora muestra la próxima ocurrencia de cada evento desde hoy. Las series aparecen en su siguiente fecha dentro de 7 días.
- **Enlace a Agenda**: "Ver vista semanal extendida en Agenda" no hacía nada. Ahora lleva a Agenda.
- **Botón + de compromisos**: aparecía bloqueado con el campo vacío y parecía imposible escribir. Ahora siempre está activo y, si no hay texto, lleva el foco al campo.
- **Tomos vacíos de Notas**: los tomos 02 y 03 mostraban texto de ejemplo con jerga de desarrollo, y parecía que la función no estaba lista. Ahora muestran el mismo aviso de tomo vacío que el tomo 01.
- **Tamaño de archivos pequeños**: un PDF de pocos bytes se mostraba como 0 KB y parecía vacío. Todo archivo que no esté vacío muestra al menos 1 KB.
- **Contraste AA en las etiquetas de área**: el texto usaba el color del área y quedaba entre 1.8:1 (ámbar) y 3.9:1, bajo el mínimo de 4.5:1. Ahora mezcla el color del área al 55 % con la tinta y cumple 4.5:1 con toda la paleta de áreas.
- **Contraste del sello HECHO**: usaba un carmín translúcido que quedaba en 4.49:1 sobre la superficie terracota. Ahora usa `--color-text-error`.
- **Accesibilidad**: se corrigen los avisos de react-doctor.
  - Los campos Nuevo compromiso y Título del evento tenían solo placeholder. Ahora tienen `aria-label`.
  - El botón ✕ del evento rápido se anunciaba como multiplicación. Ahora se llama "Cancelar evento nuevo".
  - La línea de tiempo de Horario de hoy y los pilares de la landing usan `ul` y `li` en lugar de `div` y `article` con rol de lista.
  - Se quitan roles redundantes en la sección de áreas y en el pie de la landing.
- **Borrar un compromiso mientras se edita otro**: ahora cierra la edición en curso, porque la edición se ubica por índice.
- **Fecha del día**: la fecha se fija al montar la vista y se renueva cuando la pestaña vuelve a verse en otro día. Una sesión abierta de un día a otro ya no muestra la fecha vieja. Lo usan Agenda, To-Do, Notas, Planner e Integraciones.

### Operations

- **oxlint en CI**: el job Lint ahora ejecuta oxlint, que revisa con las reglas de React la pureza del render y el `setState` dentro de efectos. ESLint no cubre esos casos.
- **15 errores de oxlint corregidos** en las vistas.
  - 12 eran llamadas a `Date` durante el render. Ahora pasan por el hook nuevo `useHoy`, que entra a las dependencias del `useMemo` en Planner y Notas.
  - 3 eran `setState` dentro de un efecto, en HabitModal, IntegrationsView y AreaIntegratedWorkspace. Se reemplazan por el ajuste de estado durante el render que documenta React.
  - Se agregaron pruebas de caracterización de los tres casos y pruebas de `useHoy`.
  - Sin cambios en las claves ni en la forma de los datos guardados.
- **Cambios de vista con `startTransition`**: `turnPage` ejecuta el cambio de vista dentro de `startTransition` en sus tres caminos (View Transitions, `prefers-reduced-motion` y navegador sin soporte).
  - Una medición con Chrome sin interfaz no muestra diferencia con el código anterior, porque React Router ya actualiza su estado dentro de una transición.
  - El cambio fija el contrato con una prueba nueva, que falla con el `pageTurn.ts` anterior.
- **Herramientas de trabajo local**: `.agents/` queda en `.gitignore` y se sacan del índice 133 archivos que seguían versionados. En disco siguen. Se quita `Feedback.txt` del repositorio, aunque sigue en el historial de Git.
  - Al integrar este cambio, Git borra del disco los archivos de `.agents/` sin cambios locales. Conviene respaldar la carpeta antes.
- **Dependencias** (Dependabot):
  - `actions/deploy-pages` pasa de 4 a 5.
  - `temporal-polyfill` pasa de 1.0.5 a 1.0.6.
  - `@types/node` pasa de 24.19.1 a 26.6.5.

## [0.5.0] - 2026-10-26

### Added

- **Página 404 propia**: toda ruta desconocida muestra una pantalla a pantalla completa, con o sin sesión.
  - Tiene un único `h1` que recibe el foco, porque un cambio de ruta no anuncia nada a un lector de pantalla.
  - El título del documento es "Página no encontrada · Espiralia".
  - La dirección pedida aparece escrita como texto.
  - Un botón de 44 px lleva al Dashboard con sesión y al inicio sin ella.
  - El diseño es un pliego de cuaderno con cinta washi, perforaciones y sello "404".
  - Va en un chunk perezoso, así que no suma a la carga inicial.
- **Nautilus de origami** en la 404, hecho solo con CSS: caparazón de franjas radiales, cuatro cámaras, capucha de dos tonos, alfiler magenta, ojo y cinco tentáculos.
  - Es decorativo (`aria-hidden`) y se oculta con colores forzados.
  - Solo se anima con `prefers-reduced-motion: no-preference`: el caparazón se pliega una vez y después flota en ciclos de 8 s, con los tentáculos ondulando cada 5 s. Sin esa preferencia queda quieto.
  - La flotación infinita amplía la excepción a la regla R-19 de movimiento, que cubría solo el molinillo de la barra lateral, por decisión de la persona dueña.
- **`public/404.html`**: GitHub Pages lo sirve para cualquier URL inexistente.
  - Con JavaScript, lleva `/Espiralia/<ruta>` a `/Espiralia/#/<ruta>`, de modo que la app decide si la ruta existe y muestra su 404.
  - Sin JavaScript, es una página completa y autónoma con el mismo pliego y el Nautilus.
- **Pruebas**: de 760 a 791, con 4 nuevas de la tipografía y 27 de la 404. Incluye el plan de la página en la documentación.

### Changed

- **Rutas desconocidas**: antes redirigían en silencio a la raíz; ahora muestran la página 404.
- **Títulos en Playball**: todos los `h1` de la app pasan a Playball, una caligrafía enlazada de un solo peso, autoalojada, de 31 KB y con licencia OFL.
  - Se aplica con una sola regla `h1[class]` y sin interletraje negativo.
  - La marca de la barra lateral y el título del Planner en móvil suben de 20 px a 22 px, el piso de esta caligrafía.
  - La fuente se precarga.
  - La ruta crítica de fuentes pasa de 96 KB a 127 KB y el tope sube de 120 KB a 130 KB.
  - La carga inicial mide 181.2 KB de 182 KB.
- **Herramientas de trabajo local**: `.projectmem/`, `anti-slop/` y `.superpowers/` quedan ignorados y se sacan del índice 8 archivos que seguían versionados.
- Sin cambios en las claves ni en la forma de los datos de `localStorage`.

## [0.4.1] - 2026-10-26

### Added

- **Integración continua** en `.github/workflows/ci.yml`: corre en PRs a `develop` y `main`, en push a `develop`, los lunes a las 06:30 (hora de Santiago) y de forma manual. Jobs:
  - **Lint** con eslint.
  - **Tipos** con `tsc -b`.
  - **Pruebas** con cobertura y umbral de 80 % en líneas y ramas.
  - **Build** con presupuesto de 182 KB comprimidos para la carga inicial.
  - **Auditoría** con `pnpm audit`: en producción con cualquier severidad y en todo el árbol con severidad alta.
  - **Commits**: valida Gitmoji y Conventional Commits, rechaza firmas de agente y omite los PRs y commits de Dependabot.
  - **CI**: estado único que resume los anteriores.
- Las acciones del workflow de CI están fijadas a SHA, con permisos `contents: read` y sin secretos.
- **`.gitattributes`** con `* text=auto eol=lf` para fijar el fin de línea LF en todo el repositorio.

### Changed

- **Dependencias de producción**: `react` y `react-dom` 19.3.1, `lucide-react` 1.61.0, `sileo` 0.1.6 y `@fullcalendar/react` 7.1.3.
- **Dependencias de desarrollo**: `vite` 8.3.5, `vitest` y `@vitest/coverage-v8` 5.0.5, `@testing-library/user-event` 14.6.8, `jsdom` 30.1.3, `eslint` 10.13.0, `oxlint` 1.89.0 y `typescript-eslint` 8.72.0. Quedan fuera `@types/node` 26 (el runtime es Node 24.x) y `oxc-transform-react` 0.155.0. `pnpm audit` sin avisos; la carga inicial mide 181.0 KB de 182 KB.
- **GitHub Actions** actualizadas: `actions/checkout` 7, `actions/setup-node` 7, `actions/upload-pages-artifact` 5, `github/codeql-action` 4 y `pnpm/action-setup` 6.
- **`.gitignore`** ampliado y ordenado: ignora todas las variantes de `.env` salvo `.env.example` (antes `.env.production` quedaba fuera), además de `.tgrep/`, `.projectmem/.current_issue`, `Thumbs.db` y `desktop.ini`.
- Sin cambios en el código de la app ni en las claves o la forma de los datos de `localStorage`.

### Fixed

- `dashboardMobileOrder.test.ts` fallaba en clones nuevos de Windows con `core.autocrlf=true` porque el checkout traía CRLF; `.gitattributes` fuerza LF y la prueba pasa.

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
