# Espiralia — Sistema de Diseño Visual Maestro & Especificación de Papelería Editorial (DESIGN.md)
>
> Documento técnico y artístico unificado para **Espiralia**. Fusiona la precisión arquitectónica y tokens exhaustivos de la referencia editorial inicial con la riqueza táctil, sensorial y emocional del sistema **«Warm Editorial Stationery & Papercraft UI»** (inspirado en las láminas de referencia *Student University Planner*, *Focus Plan* y *Daily Planner*).

**Theme:** warm-editorial-stationery (Lienzo cálido de imprenta artesanal, libre de blancos clínicos a nivel global, con acentos orquídea/magenta de identidad y tonos orgánicos de cuaderno de autor).

**Dial:** ENERGY 2 / RHYTHM 2 / MOTION 1 (antislop, núcleo Parte 3). ENERGY 2: presencia editorial sin estridencia. RHYTHM 2: las secciones alternan composición (un elemento a ancho completo, listas, pares) en vez de repetir tres tarjetas. MOTION 1: solo estados de interacción (hover, foco, transiciones breves); sin animaciones en bucle.

---

## 0. Dirección de Impacto Visual: el cuaderno de espiral (plan v2)

> Estado: **plan en ejecución, pasos 0 a 6 hechos** (§0.8). Implementado: fuentes autoalojadas (`9bcc46a`), `Pliego` (`ef8acfd`), acceso por PIN en un solo diálogo (`0dc8f1a`), respaldo del acceso alineado con la bóveda (`9dd66a5`), primitivo `Papel` y tokens `--papel-*` (`c6647af`) y el Dashboard con Papel por módulo y fecha como hoja (`b6791eb`). Lo demás de esta sección es *por implementar*. El resto del documento (§1 a §6) describe lo vigente en el código. Restricción dura: nada de esto cambia claves, formas ni valores guardados en `localStorage`; es solo presentación.

### 0.1 Tesis

El marfil cálido con serif de alto contraste y acento magenta es lo que cualquier página "de papelería" tendría. La idea propia de Espiralia está en su nombre: es un cuaderno de espiral que vive en el navegador, y un cuaderno real se compone de **papeles distintos con trabajos distintos**. La dirección v2 convierte eso en un sistema de materiales: pocos, con significado, y con un solo gesto memorable (las anillas).

### 0.2 Qué cambió respecto de la v1 y por qué

| Problema de la v1 | Corrección en la v2 |
| :--- | :--- |
| Dos firmas compitiendo: anillas en el pliego y papeles rasgados en diez elementos del mock. Se perdía la regla "una sola cosa memorable". | Sistema de **tres materiales** con trabajos distintos (§0.3). Las anillas siguen siendo la firma; el papel rasgado es un material secundario con presupuesto. |
| Los tintes de los papeles eran decorativos y aleatorios. | **El color codifica el módulo** (§0.4): el mismo tinte significa lo mismo en toda la app. |
| La v1 vendía las fuentes autoalojadas como mejora estética. En realidad `index.html` carga hoy Caveat, Inter, JetBrains Mono y Newsreader desde Google Fonts: la app no funciona del todo sin red y hace una petición a un tercero, lo que contradice "100% local". | Autoalojar las fuentes pasa a ser el **paso 0**, independiente de la estética y sin cambio visual (§0.8). La tipografía nueva llega después, con peso medido. |
| El borde rasgado del mock se generaba con JavaScript al medir el DOM, con `mix-blend-mode` y un filtro SVG por elemento. Costoso en móviles y frágil. | Un único primitivo `Papel` con formas de borde precalculadas en CSS (la forma de `bentoCardTorn`) y una sola textura de fondo. Sin JavaScript de medición ni mezcla de capas. |
| La fecha enorme empujaba la tarea principal fuera de la primera pantalla en móvil. | Criterio medible: la primera tarea crítica empieza dentro de los primeros 600px a 375x812 (§0.10). |
| La doble tinta (sombra desplazada) en titulares corridos puede fatigar la lectura. | La doble tinta se limita a **un solo elemento: el numeral de la fecha**. |
| Presupuestos ("un pliego por pantalla") solo escritos. | Se vuelven **tests** que cuentan usos por vista (§0.10). |
| El aforismo post-it está en inglés en una app en español. | Decisión abierta: traducirlo (§0.9). |

### 0.3 Los tres materiales

```
 PLIEGO              PAPEL (rasgado + tinte)           CARTULINA
 anillas, sombra     bordes arriba/abajo irregulares   borde recto, sin textura
 de apilado          cuadrícula bujo, tinte de módulo  sombra de papel simple
 la tarea            lo que se lee de un vistazo       lo que se edita o se decide
 principal de hoy    (resúmenes, vacíos, métricas)     (foco, formularios, modales)
 máx. 1 por vista    máx. 4 tarjetas y 3 piezas               sin límite
```

- **Pliego** (vigente, `src/components/common/Pliego.tsx`): contiene la tarea principal de la vista. Anillas laterales en escritorio y superiores en móvil. Un solo pliego por vista.
- **Papel** (por implementar, `src/components/common/Papel.tsx`): superficie de lectura. Se extrae del `bentoCardTorn` actual: bordes superior e inferior rasgados, cuadrícula de puntos (`--color-grid-bujo`) y un tinte claro. Recibe el tinte (`TINTE_DE_MODULO` lo asigna por módulo) y tiene dos formas: `tarjeta` (cuadrícula bujo, bordes superior e inferior rasgados) y `pieza` (etiqueta, pestaña u hoja pequeña, rasgada en los lados). `HabitModal` conserva su propio recorte, casi igual a la forma `tarjeta` (2px de diferencia), y la tira de la landing conserva una forma más suave: no están rotos y no se tocan.
- **Cartulina**: el contenedor liso de hoy (`.card`). Se reserva para lo que la persona edita o decide: foco principal, formularios, modales. Así se distingue de lo que solo se lee.
- **Pestañas, etiquetas y la hoja de la fecha** son piezas pequeñas de Papel (`forma="pieza"`, sin cuadrícula). **Presupuesto por vista: 4 tarjetas y 3 piezas**, medido por `src/tests/papelBudget.test.ts` (cuenta los `<Papel` de cada archivo de vista; las listas de tarjetas repetidas, como las notas, usan sus propios componentes y no cuentan).
- Clips de latón, cintas washi y notas adhesivas dejan de ser una capa por tarjeta. Queda como máximo **un** clip por pantalla.

### 0.4 El color codifica el módulo

| Módulo | Tinte | Token | Valor |
| :--- | :--- | :--- | :--- |
| Dashboard, neutro | Arena | `--papel-arena` | `#ece0cb` |
| Agenda y fechas | Pizarra | `--papel-pizarra` | `#ccdaea` |
| Planner | Salvia | `--papel-salvia` | `#d0e6cc` |
| To-Do y prioridad | Terracota | `--papel-terracota` | `#f1cfc5` |
| Notas | Ámbar | `--papel-ambar` | `#fae1bd` |
| Carpetas | Rosa | `--papel-rosa` | `#f8cee8` |
| Integraciones | Turquesa | `--papel-turquesa` | `#c7efe7` |

- Una tarjeta resumen del Dashboard lleva el tinte del módulo que resume (Horario: pizarra; Planner de la semana: salvia; Recordatorios: terracota).
- Las piezas pequeñas (etiqueta, pestaña) llevan una versión más intensa del mismo tinte (`--papel-<tinte>-fuerte`, unos 6 puntos de luminosidad menos).
- **El Acceso y la landing no son módulos.** Allí los tintes se reparten por tema y cada uno se usa una sola vez por pantalla (datos locales: pizarra; PIN: rosa; respaldo: salvia; aforismo: ámbar), sin pretender que signifiquen un módulo.
- Los tintes se declaran como tokens (`--papel-arena`, `--papel-pizarra`, etc.) con valor directo (hex) en `src/index.css`. Los acentos de origen son tan tenues (pizarra 15 % y salvia 18 % de saturación) que mezclarlos con el canvas dejaba papeles grises casi iguales; el test de `textTokensContrast.test.ts` exige saturación mínima de 30 % y una distancia entre tintes de al menos 15 en RGB.
- El texto sobre cualquier tinte usa `--color-ink` o `--color-body` y debe pasar 4.5:1 (test en `textTokensContrast.test.ts`). Dentro del Papel, el texto secundario y de estado (`--color-muted` y los `--color-text-*`) se redefine con variantes un 6 a 7 % más oscuras (`--papel-texto-*`), porque sobre tintes saturados los tokens globales bajan de 4.5:1.
- **El magenta queda reservado para acciones y para el subrayado de la fecha.** No se usa como tinte de superficie.

### 0.5 La fecha como hoja de calendario

Solo en el **Dashboard** y en el **hero de la landing**. El numeral del día va sobre una pieza de Papel arena rasgada por arriba, como una hoja arrancada de un taco. Es la única pieza con doble tinta: sombra desplazada 2px en pizarra al 55 %. Junto a la hoja: etiqueta de Agenda (pizarra) con día de la semana y semana ISO (`isoWeekNumber`) en monoespaciada, el mes en el titular y un subrayado magenta.

- Agenda y Planner **no** repiten el numeral: ya muestran la fecha en su propio calendario. Solo suman la semana ISO en monoespaciada.
- Con `prefers-contrast: more` y `forced-colors: active` se quita la sombra desplazada.

### 0.6 Tipografía (después del paso 0)

| Rol | Familia | Uso |
| :--- | :--- | :--- |
| Display | **Fraunces** (variable; ejes `opsz` y `wght`, `SOFT` fijo en 100) | Fecha, titulares y citas. |
| Título | **Playball** (un solo peso, 400) | Todo `h1` de la app, incluida la marca de la barra lateral. A 22px o más (`--text-script-min`), sin interletraje negativo: es una caligrafía enlazada. |
| Cuerpo | **Atkinson Hyperlegible Next** | Listas, formularios, controles. Reemplaza a Inter, que es la sans por defecto de este tipo de interfaz. |
| Manuscrito | **Reenie Beanie** | Aforismos y notas, a 22px o más. Reemplaza a Caveat. |
| Técnica | **Spline Sans Mono** | Semana ISO, horas, almacenamiento, metadatos. Reemplaza a JetBrains Mono. |

- Las cinco familias se publican con licencia abierta (OFL); se confirma al descargar cada una.
- **Los `h1` van en Playball** (descargada de Google Fonts el 2026-10-26). Cada `h1` tiene una clase de CSS Modules con su propia `font-family`, así que la regla `h1[class]` de `src/index.css` los cubre a todos con un selector más específico; los `h1` nuevos la heredan sin tocar su módulo.
- Se sirven desde el sitio, en `woff2`, con subconjunto latino y `font-display: swap`. Para bajar el peso se fijan los ejes que no se usan (`WONK`, `SOFT`) con `fonttools`.
- **El presupuesto se mide antes de comprometerlo.** Display, cuerpo y título (Fraunces, Atkinson y Playball) no superan 130KB en la ruta crítica: miden 127KB, y Playball pesa 31KB y se precarga porque el `h1` está sobre el pliegue en todas las vistas. El tope era 120KB antes de sumar Playball. El manuscrito y la monoespaciada se cargan por `unicode-range` solo si se usan.
- Escala fluida: `display-xl: clamp(3rem, 1.5rem + 6vw, 6rem)`, `display-lg: clamp(2.25rem, 1.4rem + 3.5vw, 4rem)`, `display-md: clamp(1.75rem, 1.3rem + 2vw, 2.5rem)`. Cuerpo mínimo de 15px; el mínimo absoluto sigue siendo `--text-micro` (11px).

### 0.7 Movimiento y grano

- **Una sola escena: pasar la página** al cambiar de vista (240ms, desplazamiento de 8px), con la View Transitions API como mejora progresiva. Sin soporte o con `prefers-reduced-motion`, no hay transición. Es el último paso del plan.
- **Grano de papel** al 3 %: una textura SVG como `background-image` del `body` (no una capa fija a pantalla completa, para no repintar al hacer scroll). Sin brillos, sin desenfoque, sin `mix-blend-mode`. Los degradados por tinte sí están permitidos desde el 2026-10-25 (§0.12).

### 0.8 Orden de ejecución (cada paso se puede entregar y revertir por separado)

| Paso | Qué | Cómo se verifica |
| :--- | :--- | :--- |
| 0 | **Autoalojar las fuentes actuales**, sin cambio visual. **Hecho** (`9bcc46a`): Caveat, Inter y JetBrains Mono, solo latino, 151 KB en total. Newsreader se descartó porque nunca se usaba (solo era respaldo de una variable siempre definida). | Medido: un solo host (`localhost`) en 5 rutas, y las tres fuentes cargan. Test `noExternalRequests.test.ts`. |
| 1 | **Primitivos**: `Papel`, tokens `--papel-*`, `Pliego` y los tests de presupuesto. **Hecho** (`c6647af`). | Tests rojos antes y verdes después; 14 tintes con 4.5:1 sobre la tinta y el texto de cuerpo. |
| 2 | **Dashboard**: recortar ornamentos, tintes por módulo, hoja de la fecha. **Hecho** (`b6791eb`), con una excepción medida en §0.10 (criterio 4). | Capturas a 375 y 1440px; suite de 90 archivos y 657 tests en verde. **Punto de revisión con la persona dueña (pendiente).** |
| 3 | **Acceso**: pliego en la tarjeta de cuadernos, panel derecho con papeles de datos reales, aforismo en español y corrección de los textos falsos del respaldo y del PIN olvidado (§0.9). **Hecho**: el respaldo y el aviso del PIN en `9dd66a5`; el pliego, los tres papeles de datos y el lema en español en el commit del paso 3. | Capturas a 375, 768 y 1440px; 5 tests nuevos de texto y estructura. **Punto de revisión con la persona dueña (pendiente).** |
| 4 | **Resto de vistas**, una por commit. **Hecho**: Agenda (`0a78dc5`), Planner (`29641b0`), To-Do (`2c43629`), Notas (`ef826c8`), Carpetas (`4010fd1`) e Integraciones (`455ace8`). Además de aplicar Papel y Pliego, cada vista perdió sus ornamentos y el relleno de ejemplo, y Carpetas ganó la corrección de un desborde horizontal a 1440px. | Suite de 91 archivos y 686 tests en verde en cada commit; sin desborde horizontal a 485px (mínimo de la ventana de Chrome) y a 1440px en Notas, Carpetas e Integraciones; pendiente medir Agenda y Planner a 1440px y 375px exactos (la lista de pendientes está en `.projectmem/plan.md`). **Punto de revisión con la persona dueña (pendiente).** |
| 5 | **Tipografía nueva** (§0.6). **Hecho**: Fraunces, Atkinson Hyperlegible Next, Reenie Beanie y Spline Sans Mono, autoalojadas en `woff2` latino (Google Fonts, 2026-10-23). Escala fluida `--text-display-xl/lg/md` aplicada a los H1 de las vistas; manuscrito con mínimo de 22px (`--text-script-min`). | Medido: ruta crítica 96KB (Fraunces 62KB + Atkinson 34KB, tope 120KB); manuscrito 28KB y monoespaciada 36KB, 160KB en total contra 151KB de antes. Un solo host (`localhost`) y las cuatro familias cargan. Sin desborde a 375px, 900px y 1440px, ni controles menores de 44px a 375px. Tests `fontBudget.test.ts` y `noExternalRequests.test.ts`. |
| 6 | **Pasar la página** (§0.7). **Hecho**: `turnPage` (`src/utils/pageTurn.ts`) envuelve el cambio de vista en `document.startViewTransition` con `flushSync`; el contenido (`view-transition-name: pagina`) entra en 240ms con 8px de desplazamiento y sale en 120ms, y el resto de la pantalla no se anima. Grano de papel al 3 % como fondo SVG del `body`. | Con `prefers-reduced-motion` o sin la API el cambio es inmediato (`pageTurn.test.ts`, 6 casos). Medido en el navegador: la transición se inicia al cambiar de vista; la animación no se pudo ver porque el navegador de pruebas tiene movimiento reducido activo. |

### 0.9 Mapa de aplicación y decisiones abiertas

| Pantalla | Pliego | Papel (máx. 4) | Cartulina | Fecha |
| :--- | :--- | :--- | :--- | :--- |
| Dashboard | Prioridades de hoy | Hoja de fecha, Horario, Recordatorios, Planner de la semana | Foco principal | Hoja, solo aquí |
| Landing (hero) | Hero | Etiquetas y vacíos | Formularios | Hoja con la fecha de hoy |
| Acceso | La tarjeta de cuadernos registrados | Los papeles de datos del panel derecho | Diálogo del PIN | No |
| Agenda | El almanaque | Resumen lateral (pizarra) | Formulario de evento | Semana ISO en mono |
| Planner | La semana | Metas (salvia) | Formulario de bloque | Semana ISO en mono |
| Notas | La nota abierta | Tarjetas de nota (ámbar) | Editor | No |
| To-Do, Carpetas, Integraciones | No | Tarjetas de cada módulo con su tinte | Formularios | No |

Decisiones tomadas por la persona dueña (2026-10-22):
1. **Aforismo en español.** "discipline today, peace tomorrow" pasa a «Disciplina hoy, paz mañana.» en los cuatro sitios donde aparece: post-it del Dashboard (`DashboardView.tsx`), nota del Planner (`PlannerView.tsx`), post-it de To-Do (`TodoView.tsx`) y panel del Acceso (`ProfileGateView.tsx`). Los tests que hoy buscan el texto en inglés (`PlannerView.test.tsx`, `ProfileGateView.test.tsx`) se actualizan en el mismo commit. Se hace en el paso 2 (Dashboard), el paso 3 (Acceso) y el paso 4 (Planner y To-Do).
2. **Se mantienen 4 piezas de Papel por pantalla.** El presupuesto de §0.3 y el test de §0.10 no cambian.
3. **El texto del respaldo se verificó contra el código** (resultado abajo) y se corrige antes de usarlo.

**Verificación del respaldo y la restauración** (código leído, 2026-10-22):

| Afirmación | Resultado | Evidencia |
| :--- | :--- | :--- |
| Se puede respaldar un perfil y restaurarlo en otro equipo. | **Cierta, pero solo desde dentro del cuaderno**, con el perfil ya desbloqueado. | `VaultModal` (pestañas exportar e importar), `VaultService.exportProfile` y `restoreProfile` con los modos reemplazar y crear perfil nuevo. |
| El respaldo se puede cifrar. | **Cierta, es opcional.** AES-GCM con clave derivada por PBKDF2 a partir de una frase. | `vaultCrypto.ts`, `encryptBackup` y `decryptBackup`. |
| "Exportar bóveda local (.json)" del Acceso sirve para restaurar. | **Falsa.** Genera otro formato (`version: "1.0"`, todos los perfiles) que ninguna parte de la app importa. Es un JSON sin cifrar con los datos y los hash de PIN. | `StorageService.exportVault`, usado solo en `ProfileGateView.tsx`; `VaultModal` solo acepta `ProfileBackup` con `version: 1`. |
| "Para restablecer tu PIN, exporta y restaura tu bóveda local." | **Falsa.** No existe recuperación de PIN: la restauración conserva el hash y la sal del perfil, y el modal de respaldo solo se alcanza con el perfil desbloqueado. | `restoreProfile` copia `backup.profile` completo; `VaultModal` se monta en `AppLayout`. |

Consecuencias para el plan (paso 3, Acceso), con revisión de la persona dueña antes de implementar:
- **Texto del papel salvia:** «Respalda desde dentro del cuaderno, con cifrado opcional, y restaura en otro equipo.»
- **Aviso de PIN olvidado:** reemplazar el texto falso por «Espiralia no puede restablecer un PIN: solo guarda su hash en este navegador.» Es un cambio de texto; no cambia ningún dato.
- **Botón "Exportar bóveda local" del Acceso:** quitarlo del Acceso (propuesta) o alinear su formato con el de `VaultModal`. Decisión pendiente: quitarlo deja sin copia a quien no pueda entrar; alinearlo implica un cambio de comportamiento y un test de ida y vuelta.

**Decisión tomada tras el paso 2: orden del Dashboard en móvil (opción B, aplicada).** El criterio de §0.10.4 no se cumple porque, antes de las prioridades, el Dashboard muestra el encabezado completo, el aforismo, el lema del día, los cuatro accesos rápidos y las tres tarjetas de serenidad (pliego a 2436px en móvil). Opciones:
- **A. Solo reordenar:** en móvil, las tres tarjetas de serenidad pasan después de las prioridades (CSS `order`, sin tocar el contenido). Mejora, pero el encabezado sigue siendo largo y no alcanza los 600px.
- **B. Reordenar y compactar (recomendada):** en móvil el encabezado queda en fecha, saludo y contadores; el aforismo, el lema, los accesos rápidos y las tarjetas de serenidad van después de Foco y Prioridades. Cumple el criterio y no cambia el contenido ni el orden en escritorio.
- **C. Relajar el criterio:** en el Dashboard se acepta que las prioridades queden más abajo, a cambio de conservar el encabezado completo.

Aplicada la B: hasta 960px el encabezado esencial (fecha, saludo, subtítulo y contadores) va primero, luego las tareas del día, los accesos rápidos en dos columnas, el aforismo, el lema y las tarjetas de serenidad. De 600 a 960px la columna derecha pasa a dos columnas. El orden se fija con `order` (el hero deja de ser tarjeta en móvil con `display: contents`) y lo vigila `src/tests/dashboardMobileOrder.test.ts`. Medido sin desborde horizontal en 8 rutas a 375, 768 y 1440px; el único objetivo táctil pequeño es un enlace de texto de Integraciones, previo a este plan.

### 0.10 Criterios de aceptación (verificables)

1. Como máximo un `<Pliego`, cuatro tarjetas y tres piezas de `<Papel` por archivo de vista (`papelBudget.test.ts`).
2. Texto sobre cada tinte: 4.5:1 como mínimo, medido con la fórmula WCAG en `textTokensContrast.test.ts`.
3. Ningún control menor de 44x44px; foco visible con 3:1 contra su entorno.
4. A 375, 768 y 1440px: sin desborde horizontal (**cumplido** en el Dashboard a 375 y 1440). A 375x812, la primera tarea crítica del Dashboard empieza dentro de los primeros 600px (**cumplido** con la opción B de §0.9: en móvil el pliego queda a 605px, antes 2454px, y la tarea de "Foco principal" empieza antes de los 600px; en escritorio no cambia, 1380px).
5. Cero peticiones a dominios externos al cargar cualquier ruta; peso de fuentes medido y dentro del presupuesto fijado en el paso 5.
6. Con `prefers-reduced-motion` no hay transición de página; con `prefers-contrast: more` y `forced-colors: active`, sin sombra desplazada, y los papeles conservan un borde visible (`border` de respaldo, `clip-path: none`).
7. Sin `mix-blend-mode` ni más de cuatro `filter: drop-shadow` por pantalla. La pantalla se desplaza sin saltos en una grabación de rendimiento en emulación móvil.
8. Los datos guardados antes de este cambio se leen igual (`src/tests/legacyDataCompat.test.tsx` sigue en verde).

### 0.11 Qué se descartó y por qué

- **Fondo casi negro con un acento ácido:** no tiene relación con un cuaderno de papel; el pliego nocturno del manifiesto (§5.C.7) ya cubre el uso nocturno.
- **Diseño tipo periódico (columnas densas, filetes finos, esquinas rectas):** choca con el tono íntimo.
- **Un tinte distinto por tarjeta sin criterio:** se ve festivo y no enseña nada; por eso el color codifica el módulo.
- **Borde rasgado generado con JavaScript:** mide el DOM en cada cambio de tamaño y no escala a todas las vistas.
- **Más washi, clips y notas adhesivas en cada tarjeta:** competiría con la firma.
- **Doble tinta en titulares corridos:** reduce la legibilidad sin aportar información.

### 0.12 Degradados por tinte y hoja de origami (decisión de la persona dueña, 2026-10-25)

La persona dueña aprobó el mock del Dashboard (capa `propuesta.css`), que reemplaza dos reglas anteriores: "sin degradados" (§0.7) y "el color solo en el Papel" (§0.4). Se llevó a `src/` y se extendió a las demás vistas.

- **Regla:** una superficie con función lleva un degradado de su tinte de módulo hacia el papel claro (`--bg-card`), nunca un velo sobre toda la pantalla. El lienzo de la app es marfil liso, sin cuadrícula de puntos.
- **Tarjeta de Papel** (`Papel.module.css`): la esquina inferior derecha se oscurece hacia `--papel-<tinte>-fuerte` (155°, desde 54 %, mezclado al 58 %). Vale para toda tarjeta, en cualquier vista.
- **Superficies planas:** cada vista aplica el tinte de su módulo (§0.4) en el encabezado, los formularios y los vacíos; energía y hábitos llevan salvia, y las lecturas de métricas, turquesa. Los datos y el texto no se tiñen.
- **Superficies planas sin blanco (feedback de usuarios, 2026-10-26):** el degradado que terminaba en `--bg-card` dejaba casi toda la superficie blanca, y una persona reportó que tenía que forzar la vista en Agenda, Notas, "Notas y vaciado mental", "Reflexión del día" y "Ritmo & Estado de Ánimo". Ahora cada superficie plana usa `var(--superficie-<tinte>)` (`src/index.css`): del tinte al 72 % al tinte al 40 %, sin llegar a blanco. El almanaque de Agenda lleva pizarra en el marco y una pizarra más clara (35 %) en la grilla de días (`--fc-forma-background`), y el cuaderno de Notas lleva ámbar bajo su trama. En los tres valores el texto global pasa 4.5:1 (`textTokensContrast.test.ts`). To-Do, que la persona tomó como referencia ("ni tan fuerte ni tan suave"), usa la misma superficie, para no quedar más pálido que el resto.
- **Dos intensidades, no una:** las superficies donde se lee o se escribe (calendario, cuaderno, notas, reflexión, energía, To-Do) van al 72→40 %. Los contenedores que solo agrupan tarjetas (Áreas y Métricas del Dashboard) van un nivel más suave, `var(--contenedor-<tinte>)` al 45→20 %, para que sus tarjetas resalten y la superficie más grande de la página no le quite el foco al saludo.
- **Landing y Acceso** (no son módulos, §0.4): la mesa de trabajo lleva arena; los tres pilares, pizarra, salvia y ámbar (el color de su solapa); los tres momentos del día, rosa, terracota y turquesa (el de su cinta); la intención de hoy, salvia. El Acceso pierde la cuadrícula de puntos del fondo y conserva sus papeles, que ya traen el degradado de esquina.
- **Contraste del degradado de esquina:** al 58% el texto secundario del Papel bajaba a 4.18:1; los seis `--papel-texto-*` se oscurecieron un 6% y `textTokensContrast.test.ts` mide la esquina de los siete tintes.
- **Barra lateral:** degradado pizarra, arena y rosa (160°), y debajo de la navegación una hoja de origami en CSS (`OrigamiHoja`: molinillo, caracol y rosa, con el alfiler magenta de las tres figuras). Solo se muestra con 1024px de ancho y 900px de alto o más; el riel de íconos, el móvil y `forced-colors` la ocultan.
- **Excepción a R-19 (movimiento sin propósito), mantenida por la persona dueña:** el molinillo gira una vuelta cada 24 s, solo con `prefers-reduced-motion: no-preference`. Junto con el Nautilus de la página 404, es la única animación infinita de la app fuera del spinner de carga (`antislopMotion.test.ts`).
- **Página 404 y Nautilus (decisión de la persona dueña, 2026-10-26):** una dirección desconocida muestra `NotFoundView`, a pantalla completa y con o sin sesión, en vez de redirigir en silencio a la raíz. La ilustra `OrigamiNautilus`, un origami en CSS con la técnica de `OrigamiHoja`: caparazón de franjas radiales que nacen del centro de la espiral, cuatro cámaras como anillos, capucha de dos tonos con el alfiler magenta y cinco tentáculos. Va fuera del árbol de accesibilidad, sin `drop-shadow` y oculto con `forced-colors`.
- **Movimiento del Nautilus (segunda excepción a R-19):** el caparazón se pliega una vez al entrar y después el animal flota 8 s por ciclo, con los tentáculos ondulando 5 s. Todo bajo `prefers-reduced-motion: no-preference`; sin movimiento queda quieto y completo.
- **`public/404.html`:** GitHub Pages lo sirve para cualquier URL inexistente. Lleva `/Espiralia/<ruta>` a `/Espiralia/#/<ruta>` para que la app decida si la ruta existe y, si no, muestre su 404; sin JavaScript queda como página mínima con enlace de regreso.
- **Movimiento del donut de Progreso de Tareas (tercera excepción a MOTION 1, decisión de la persona dueña, 2026-10-30):** al elegir otra área, la porción, el anillo exterior y el texto del centro se mueven con el resorte del ejemplo oficial de TanStack Charts (`motion()`, rigidez 190, amortiguación 21). Es respuesta a una acción, no un bucle: sin animación de entrada (`initial: false`) y sin movimiento propio. `motion()` respeta `prefers-reduced-motion`; con movimiento reducido el cambio es inmediato. El pastel de Distribución por Categoría no se anima.
- **Presupuesto de sombras (§0.10.7):** la hoja de origami no usa `filter: drop-shadow`, para no sumar a las cuatro de las tarjetas de Papel.

---

## 1. Filosofía & Principios Visuales

1. **Metáfora del Escritorio Analógico (*Papercraft UI*)**:
   - Cada contenedor, tarjeta o módulo interactivo evoca elementos de un escritorio físico de papelería: pliegos de papel marfil de alto gramaje, hojas con textura de borde rasgado, fichas con solapas superiores de archivador de biblioteca (*folder tabs*), tramas milimetradas de *bullet journal* y notas adhesivas (*post-its*) sujetas con clips metálicos dorados o franjas de *washi tape* semitransparente.
   - Rompe deliberadamente la frialdad utilitaria de las interfaces de software corporativo convencional, ofreciendo una experiencia sosegada, íntima y de baja carga cognitiva.

2. **Tipografía Tríadica de Autor**:
   - **Display / Titulares**: Serif de alto contraste (*Newsreader, Copernicus, Tiempos Headline, Playfair Display, Georgia*) para títulos de impacto, lemas inspiradores, aforismos matutinos y manifiestos.
   - **Cuerpo & Control**: Sans geométrica-humanista (*Inter, StyreneB, Plus Jakarta Sans, system-ui*) para máxima legibilidad en listas de tareas, tablas de tiempo, modales y controles de formulario.
   - **Acento Manuscrito Emocional**: Script caligráfico (*Caveat, Reenie Beanie, Playfair Italic, cursive*) para aforismos, lemas en notas adhesivas (*"discipline today, peace tomorrow ♡"*, *"small steps every day lead to big results"*) y escritura libre en diarios reflexivos.
   - **Monospace Técnico**: Monospace humanista (*JetBrains Mono, ui-monospace*) para metadatos, tags de código, timestamps y registros de boveda local.

3. **Colorimetría Sensorial y Papel Marfil**:
   - Fondo general (*canvas*) en tono marfil cálido (`#FCF9F6` / `#FAF9F5`), eliminando los fondos blancos clínicos puros (`#FFFFFF`), los cuales quedan confinados exclusivamente a fichas y cartulinas superpuestas.
   - Identidad de marca Espiralia en **Magenta Orquídea** (`#8E1EA2`, `#C654C3`), complementada con matices de papelería clásica: azul pizarra suave (`#7B8C9E`), terracota cálido (`#9C4A3B`), verde salvia botánico (`#5A826D`), crema tostado (`#EFE9DE` / `#F6F2EC`) y carbón nocturno (`#1A1817`).

4. **Soberanía y Serenidad Local**:
   - Representación visual de la arquitectura *100% Client-Side* (sin registro en la nube, datos en el `localStorage` del navegador, cero telemetría externa) con textos que dicen lo que la app hace, sin certificaciones ni cifrado que no existan. Los timbres de imprenta quedan como recurso decorativo y nunca afirman seguridad.

---

## 2. Tokens de Diseño — Colores

| Nombre de Token | Valor Hex / RGBA | Variable CSS | Rol y Aplicación |
| :--- | :--- | :--- | :--- |
| **`primary`** | `#8E1EA2` | `--color-primary` | Magenta editorial representativo; botones primarios, marca y acentos tipográficos clave. |
| **`primary-active`** | `#C654C3` | `--color-primary-active` | Acento claro: rellenos de progreso, estados activos y foco. No es fondo de botón con texto blanco (3,85:1). |
| **`primary-hover`** | `#741787` | `--color-primary-hover` | Fondo de un botón relleno en *hover*: más oscuro que `primary`, 9,5:1 con texto blanco en ambos temas. |
| **`primary-soft`** | `#ED96D7` | `--color-primary-soft` | Fondos de insignias suaves, píldoras y barras de avance sutiles. |
| **`primary-light`** | `#FDF4FA` | `--color-primary-light` | Tinte sutil para fondos de selección activa o tarjetas destacadas. |
| **`primary-disabled`** | `#FFC0DE` | `--color-primary-disabled` | Estados deshabilitados o tintes de fondo ultra suaves. |
| **`canvas-paper`** | `#FCF9F6` (`#FAF9F5`) | `--color-canvas` | Fondo base unificador; simula pliego de papel bond / lino marfil cálido de alto gramaje. |
| **`surface-card`** | `#FFFFFF` | `--color-surface-card` | Fichas de cartulina superpuesta, hojas de notas y campos de entrada. |
| **`surface-warm`** | `#F6F2EC` (`#EFE9DE`) | `--color-surface-warm` | Solapas de ficheros, contenedores secundarios y fondos de cuadrícula. |
| **`surface-cream-strong`** | `#E8E0D2` | `--color-surface-cream-strong` | Cartulina envejecida para acentos de libreta física. |
| **`surface-slate`** | `#E8EDF2` | `--color-surface-slate` | Bloque con efecto papel rasgado para *Focus Schedule* y rutinas horarias. |
| **`surface-tape-primary`** | `rgba(142, 30, 162, 0.15)` | `--color-washi-primary` | Franja decorativa de cinta adhesiva washi tape magenta. |
| **`surface-tape-slate`** | `rgba(123, 140, 158, 0.25)` | `--color-washi-slate` | Franja decorativa de cinta adhesiva washi tape azul pizarra. |
| **`ink`** | `#1A1917` (`#141413`) | `--color-ink` | Tinta de pluma estilográfica; titulares principales de máximo contraste. |
| **`body`** | `#3D3D3A` | `--color-body` | Color de texto para lectura corrida, tareas e instrucciones. |
| **`body-strong`** | `#252523` | `--color-body-strong` | Texto de peso medio para énfasis y etiquetas destacadas. |
| **`muted`** | `#57554F` | `--color-muted` | Metadatos, horas, subtítulos, etiquetas y números monumentales de agua. Oscurecido en 2026-10-22 (de `#8E8B82`) y otra vez el 2026-10-30 (de `#64625C`): a 11px el texto quedaba en 4.6:1 sobre los tintes y con poco brillo se leía mal. Ahora 5.5:1 o más sobre las superficies y 4.5:1 sobre los tintes. |
| **`muted-soft`** | `#8E8B82` | `--color-muted-soft` | Elementos terciarios de baja jerarquía visual. |
| **`hairline`** | `#E8E2D8` (`#E6DFD8`) | `--color-hairline` | Renglones de cuaderno, divisores finos y bordes sutiles de papel. |
| **`hairline-soft`** | `#EBE6DF` | `--color-hairline-soft` | Divisores interiores ultra tenues. |
| **`border-control`** | `#76716A` | `--color-border-control` | Borde de botones, campos y selectores (desde 2026-10-30). 3:1 o más (WCAG 1.4.11) sobre toda superficie, incluida la esquina oscura de la tarjeta de Papel; 4.6:1 sobre el marfil. El `--color-hairline` (1.2:1) solo se usa en divisores y contenedores, nunca como borde de un control. |
| **`grid-bujo`** | `#DFD8CC` | `--color-grid-bujo` | Trama de puntos y cuadrícula milimetrada (*bullet journal* / *brain dump*). |
| **`botanical-sage`** | `#5A826D` | `--color-accent-sage` | Seguimiento de bienestar, hábitos cumplidos y estados armónicos. |
| **`terracotta`** | `#9C4A3B` | `--color-accent-terracotta` | Alertas amables, prioridades críticas y washi tape de destaque. |
| **`accent-teal`** | `#5DB8A6` | `--color-accent-teal` | Acento editorial secundario para métricas y categorías de estudio. |
| **`accent-amber`** | `#E8A55A` | `--color-accent-amber` | Tono cálido para recordatorios y notas pendientes. |
| **`success`** | `#5DB872` | `--color-success` | Indicador de confirmación y tarea finalizada (fondos, bordes e iconos; no como color de texto). |
| **`text-success`** | `#316F3F` | `--color-text-success` | Variante de texto de `success` (5.0:1 o más sobre las superficies del tema). |
| **`text-teal`** | `#2F6B60` | `--color-text-teal` | Variante de texto de `accent-teal`. |
| **`text-amber`** | `#8E5414` | `--color-text-amber` | Variante de texto de `accent-amber`. |
| **`text-primary-active`** | `#9E359B` | `--color-text-primary-active` | Variante de texto de `primary-active`. |
| **`warning`** | `#D4A017` | `--color-warning` | Notificación preventiva de plazos o advertencias de bóveda. |
| **`error`** | `#C64545` | `--color-error` | Errores de validación o alertas críticas. |
| **`surface-dark`** | `#1A1817` (`#181715`) | `--color-surface-dark` | Bloque nocturno del manifiesto y modo de concentración profunda. |
| **`surface-dark-elevated`**| `#252320` | `--color-surface-dark-elevated` | Tarjetas y botones sobre fondo oscuro. |
| **`surface-dark-soft`** | `#1F1E1B` | `--color-surface-dark-soft` | Fondos intermedios en superficies oscuras. |
| **`on-primary`** | `#FFFFFF` | `--color-on-primary` | Texto sobre botones y chips primarios. |
| **`on-dark`** | `#FCF9F6` (`#FAF9F5`) | `--color-on-dark` | Texto principal sobre superficies oscuras. |
| **`on-dark-soft`** | `#A09D96` | `--color-on-dark-soft` | Texto secundario y créditos sobre superficies oscuras. |

---

## 3. Tokens de Diseño — Tipografía

### Familias Tipográficas

1. **Display & Serif Editorial (`--font-display`, `--font-primary`)**:
   - `Newsreader`, `Copernicus`, `Tiempos Headline`, `Georgia`, serif.
   - Uso: Titulares monumentales, cabeceras de página (*"focus plan."*, *"daily planner"*), aforismos y manifiestos.
2. **Cuerpo & Control Sans (`--font-body`, `--font-sans`, `--font-family-2`)**:
   - `Inter`, `StyreneB`, `Plus Jakarta Sans`, system-ui, sans-serif.
   - Uso: Tareas, tablas horarias, campos de texto, botones, insignias y navegación.
3. **Acento Caligráfico / Manuscrito (`--font-script`, `--font-handwriting`)**:
   - `Caveat`, `Reenie Beanie`, `Playfair Italic`, cursive.
   - Uso: Frases motivacionales, notas adhesivas (*post-its*), recordatorios amables y reflexiones terapéuticas libres.
4. **Monospace Técnico (`--font-code`, `--font-family-3`)**:
   - `JetBrains Mono`, `ui-monospace`, monospace.
   - Uso: Tiempos de ejecución, contadores, etiquetas de sistema, hashes de IndexedDB y metadatos técnicos.

### Escala Tipográfica (Type Scale)

| Rol | Tamaño | Altura de Línea | Espaciado (Tracking) | Peso | Familia / Token |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **display-xl** | 48px – 64px | 1.05 – 1.10 | -0.02em (-1.5px) | Serif 400 | `--text-display-xl` |
| **display-lg** | 36px – 48px | 1.10 – 1.15 | -0.015em (-1px) | Serif 400 | `--text-display-lg` |
| **display-md** | 28px – 36px | 1.15 – 1.20 | -0.01em (-0.5px) | Serif 400 | `--text-display-md` |
| **display-sm** | 24px – 28px | 1.20 – 1.25 | -0.3px | Serif 400 | `--text-display-sm` |
| **title-lg** | 22px – 24px | 1.25 – 1.30 | 0 | Serif 500 / Sans 600 | `--text-title-lg` |
| **title-md** | 18px – 20px | 1.35 – 1.40 | 0 | Serif / Sans 600 | `--text-title-md` |
| **title-sm** | 16px | 1.40 | 0 | Sans 600 | `--text-title-sm` |
| **body-md** | 15px – 16px | 1.55 | 0 | Sans 400 | `--text-body-md` |
| **body-sm** | 13px – 14px | 1.50 – 1.55 | 0 | Sans 400/500 | `--text-body-sm` |
| **script-quote** | 17px – 21px | 1.40 | 0.01em | Script 400 | `--text-script-quote` |
| **caption** | 11px – 13px | 1.40 | 0 | Sans 500/600 | `--text-caption` (13px) y `--text-micro` (11px, mínimo absoluto de la interfaz) |
| **caption-uppercase** | 11px – 12px | 1.40 | 1.5px (0.08em) | Sans 600 Uppercase | `--text-caption-uppercase` |
| **button** | 14px | 1.00 | 0 | Sans 500/600 | `--text-button` |
| **nav-link** | 14px | 1.40 | 0 | Sans 500 | `--text-nav-link` |
| **code / timestamp** | 12px – 14px | 1.50 – 1.60 | 0 | Monospace 400 | `--text-code` |

---

## 4. Tokens de Espaciado, Formas & Sombras

**Densidad:** Comfortable (holgada, sin sensación de hacinamiento).

### Escala de Espaciado (Spacing Scale)

| Nombre | Valor | Token | Aplicación Típica |
| :--- | :--- | :--- | :--- |
| **xxs** | 4px | `--spacing-xxs` | Micro-separadores y padding de tags mínimos. |
| **xs** | 8px | `--spacing-xs` | Gaps entre iconos y textos, padding de botones compactos. |
| **sm** | 12px | `--spacing-sm` | Espacio entre elementos de lista y chips. |
| **md** | 16px | `--spacing-md` | Padding base interior de tarjetas pequeñas e inputs. |
| **lg** | 24px | `--spacing-lg` | Padding estándar de cartulinas (*card padding*) y gutters. |
| **xl** | 32px | `--spacing-xl` | Separación entre módulos principales de una sección. |
| **xxl** | 48px | `--spacing-xxl` | Separación vertical entre bloques de contenido. |
| **section** | 64px – 96px | `--spacing-section` | Margen vertical entre grandes secciones de página. |

### Radio de Bordes (Border Radius)

| Nombre | Valor | Token | Elemento Asociado |
| :--- | :--- | :--- | :--- |
| **xs** | 4px | `--radius-xs` | Micro-chips, esquinas de washi tape. |
| **sm** | 6px | `--radius-sm` | Solapas de fichas pequeñas, selectores. |
| **md** | 8px | `--radius-md` | Botones, inputs, tabs de archivador (`8px 8px 0 0`). |
| **lg** | 12px | `--radius-lg` | Tarjetas de cartulina, módulos de foco y paneles. |
| **xl** | 16px | `--radius-xl` | Contenedores mayores, mesa de trabajo viva y modales. |
| **pill / full** | 9999px | `--radius-pill` | Badges, avatar circular y botones de píldora. |

### Sombras Táctiles de Papel (*Elevation & Paper Shadows*)

- **Papel plano sobre escritorio**: `0 1px 3px rgba(26, 25, 23, 0.04), 0 4px 12px rgba(26, 25, 23, 0.02)`
- **Ficha superpuesta (*Folder Tab Card*)**: `0 4px 14px rgba(26, 25, 23, 0.03), 0 12px 28px rgba(26, 25, 23, 0.02)`
- **Nota adhesiva en ángulo (*Post-it*)**: `0 6px 16px rgba(26, 25, 23, 0.06), 0 1px 2px rgba(26, 25, 23, 0.08)`
- **Bloque elevado nocturno**: `0 8px 30px rgba(0, 0, 0, 0.12)`

---

## 5. Biblioteca Exhaustiva de Componentes (*Component & Stationery Kit*)

### A. Botones & Acciones Interactivas

1. **Button Primary (`--btn-primary`)**:
   - `bg: var(--color-primary)` (`#8E1EA2`), `color: #FFFFFF`, `border-radius: var(--radius-md)` (8px), `padding: 12px 20px`, `min-height: 44px`, `font: var(--text-button)`. Hover: `bg: var(--color-primary-hover)` (`#741787`), escala sutil `active:scale-[0.98]`.
2. **Button Secondary (`--btn-secondary`)**:
   - `bg: var(--color-canvas)`, `border: 1px solid var(--color-hairline)`, `color: var(--color-ink)`, `border-radius: var(--radius-md)`, `padding: 12px 20px`.
3. **Button Secondary on Dark (`--btn-secondary-dark`)**:
   - `bg: var(--color-surface-dark-elevated)` (`#252320`), `color: var(--color-on-dark)`, `border: 1px solid rgba(255,255,255,0.1)`.
4. **Button Icon Circular**:
   - `size: 44px`, `border-radius: full`, `bg: var(--color-canvas)`, `border: 1px solid var(--color-hairline)`.
5. **Text Link**:
   - `color: var(--color-primary)`, `hover:underline`, `font: var(--text-body-md)`.

### B. Elementos de Formulario & Captura

1. **Text Input & Focused**:
   - `bg: var(--color-canvas-paper)`, `border: 1px solid var(--color-hairline)`, `border-radius: var(--radius-md)`, `padding: 10px 14px`, `min-height: 44px`, `font: var(--text-body-md)`. En foco: `border-color: var(--color-primary)`, sombra de anillo `box-shadow: 0 0 0 3px rgba(142, 30, 162, 0.12)`.
2. **Category Tabs & Active State**:
   - Tab inactivo: `color: var(--color-muted)`, `hover:color: var(--color-ink)`.
   - Tab activo: `bg: var(--color-surface-warm)`, `border-bottom: 2px solid var(--color-primary)`, `color: var(--color-primary)`.
3. **Badge Pill & Badge Primary**:
   - Badge neutro: `bg: var(--color-surface-warm)`, `color: var(--color-ink)`, `border-radius: 9999px`, `padding: 4px 12px`.
   - Badge primario: `bg: var(--color-primary)`, `color: #FFFFFF`, `text-transform: uppercase`, `font-size: 11px`.

### C. Componentes de Papelería Artesanal (*Papercraft Specifics*)

1. **Ficha de Archivador con Tab Superior (*Folder Tab Card*)**:
   - **Estructura**: Solapa superior desfasada (`border-radius: 8px 8px 0 0` en el tab, fondo `surface-warm`), cuerpo en `surface-card`, borde fino `hairline` y número monumental de agua de fondo (`01`, `02`, `03`) en color `muted` con opacidad `0.15`.
   - **Aplicación**: Las 3 Áreas de Vida (`01. Estudios & Foco Práctico`, `02. Introspección & Diario`, `03. Horizonte & Universidad`).
2. **Bloque Horario en Renglones (*Focus Schedule / Time Blocking*)**:
   - Renglones continuos en `hairline`, acabado superior con borde rasgado (*torn paper edge*) o fijado con franja de *washi tape*. Chips tonales de micro-rutina (*Vital*, *Prioridad*, *Pausa Consciente*).
3. **Cuadrícula de Notas y Reflexión (*Bujo Grid & Brain Dump*)**:
   - Patrón de puntos o trama milimetrada de 20px x 20px en `--color-grid-bujo`, tipografía itálica o manuscrita libre para volcado terapéutico sin límites de caracteres.
4. **Rastreos Visuales de Bienestar (*Sensory Trackers*)**:
   - *Mood & Energy Check*: Selector con fases lunares y caritas lineales de expresión (*Plena, En calma, Neutra, Cansada, Drenada*).
   - *Water Tracker*: 8 vasos ilustrados con trazo editorial que se rellenan gradualmente.
   - *Habit Tracker Semanal*: Matriz minimalista `L M X J V S D` con círculos de cumplimiento en verde salvia (`--color-accent-sage`).
5. **Notas Adhesivas Flotantes & Washi Tape (*Post-its & Paper Clips*)**:
   - Tarjetas amarillas o lavanda suaves con micro-rotación (`transform: rotate(-1.5deg)` o `rotate(1.2deg)`), clip metálico dorado en la parte superior y lemas motivacionales manuscritos (*"discipline today, peace tomorrow ♡"*).
6. **Widget "Brújula Interior Inmediata"**:
   - Selector interactivo de estado de saturación que despliega una tarjeta de respiración guiada en 3 pasos: *01. Pausa, 02. Descarga, 03. Un solo paso*.
7. **Bloque Manifiesto en Pliego Nocturno**:
   - Contenedor en `--color-surface-dark` (`#1A1817`), tipografía serif clara de imprenta (*Newsreader*) y llamada a la acción local-first sin registro ni telemetría.

### D. Layouts & Módulos Shell

1. **Top Nav**: `bg: var(--color-canvas)`, altura 64px, borde inferior `hairline`, enlaces editoriales y botón de acceso directo al cuaderno.
2. **Hero Band**: Espaciado generoso (64px – 96px), gran titular serif display, aforismo matutino y notas adhesivas perimetrales.
3. **Footer**: Fondo `surface-dark`, tipografía `body-sm`, enlaces de filosofía local-first, privacidad y exportación offline.

---

## 6. Reglas de Oro del Sistema (Do's and Don'ts)

### Hacer (Do)
- **Mantener el pliego marfil cálido (`#FCF9F6`)**: El lienzo unificador de toda la plataforma debe sentirse como papel bond/lino artesanal.
- **Armonizar control operativo y serenidad emocional**: Acompañar siempre las listas de tareas y tablas de tiempo con lemas inspiradores, aforismos diarios y sellos de racha.
- **Respetar la jerarquía tríadica**: Serif para cabeceras y citas, sans para lectura y control operativo, script para notas afectivas, mono para metadatos y bóveda.
- **Soporte de exportación e impresión** *(por implementar: hoy solo existe la exportación de la agenda a `.ics` y el respaldo de la bóveda; no hay hoja de estilos de impresión)*: diagramación limpia con `@media print` para quienes combinan soporte digital y físico.
- **Un solo logo**: el monograma "Es" (serif, sobre el cuadrado magenta `--color-primary`) en la barra superior de la landing, la barra lateral y la pantalla de acceso. No usar otros glifos ni iconos como marca.
- **Objetivo táctil mínimo de 44x44px**: botones, inputs, selects, tabs y enlaces con clase usan `--tap-min` (regla global en `src/index.css`). Decisión del dueño, 2026-10-22: sube el 40px anterior.
- **Preservar los tokens exactos**: Usar siempre las variables documentadas (`--color-primary`, `--color-canvas`, etc.) para consistencia absoluta en todo el proyecto.

### No Hacer (Don't)
- **No utilizar fondos blancos clínicos (`#FFFFFF` puro) como fondo general de página**: El blanco queda restringido exclusivamente a cartulinas y notas superpuestas.
- **No emplear sombras oscuras, duras o plásticas**: Emplear siempre sombras multicapa difusas que simulen hojas de papel reposando sobre un escritorio.
- **No omitir las frases y aforismos motivacionales**: Son parte nuclear de la experiencia de calma y bienestar solicitada por el usuario.
- **No usar colores neón estridentes ni esquemas corporativos fríos**: Preservar siempre la atmósfera íntima de cuaderno personal y papelería física de autor.
- **No introducir colores fuera de los tokens documentados**: Mantener la disciplina cromática entre el magenta identitario, tonos marfil y acentos orgánicos (pizarra, salvia, terracota).

---

## 7. Consistencia entre componentes y modo oscuro (regla de diseño, 2026-10-30)

> Decisión de la persona dueña: **un mismo componente se ve y se comporta igual en todas las vistas**, y toda regla de diseño se documenta aquí, en `DESIGN.md`. Una decisión visual que solo vive en un `.module.css` o en la cabeza de quien la tomó no cuenta como regla. Estado: la regla rige desde hoy para todo cambio nuevo; la migración de lo existente y los tests que la vigilan están *por implementar* (§7.5).

### 7.1 La regla

1. **Un componente, un lenguaje.** Botón, tarjeta, campo y modal comparten forma, medida, borde, sombra, foco y estados en toda la app. La variación entre vistas la da **solo el tinte del módulo** (§0.4) y el contenido; nunca el radio, el relleno, la altura, la sombra ni la tipografía del control.
2. **Todo valor sale de un token.** Radio, espaciado, sombra, color, tamaño de texto y duración vienen de `src/index.css`. Prohibido en un componente: hex sueltos (`#ffffff`, `#e6dfd8` como respaldo), `rgba(...)` de sombra escritos a mano, radios en `px` o `rem` literales y alturas mínimas distintas de `--tap-min`. Si falta un token, se agrega a `src/index.css` y a §2 o §4 en el mismo cambio, no se inventa un valor local.
3. **Un componente nuevo busca primero al existente.** Antes de escribir `.btnSave`, `.cancelBtn` o `.modalBox` en un módulo, se usa el primitivo compartido (§7.2). Si el primitivo no alcanza, se extiende el primitivo, no se copia.
4. **Mismo estado, mismo aspecto.** Hover, foco visible, activo, deshabilitado, error y carga se ven igual en todos los controles de una misma familia (§7.3).
5. **Cualquier tema cumple lo mismo.** Las reglas 1 a 4 y los umbrales de contraste valen en claro y, si existe, en oscuro (§7.4). Un componente que solo se ve bien en uno de los dos temas no está terminado.

### 7.2 Contrato por familia de componente

Valores objetivo. Todos son tokens existentes salvo los marcados como nuevos en §7.4 y §7.5; la columna "Primitivo" es el archivo donde debe vivir el estilo único.

| Familia | Forma y medida | Color y borde | Sombra | Primitivo |
| :--- | :--- | :--- | :--- | :--- |
| **Botón primario** | `--radius-md`, `min-height: var(--tap-min)`, relleno `12px 20px`, `--text-button`, peso 600 | `bg: --color-primary`, `color: --color-on-primary`, sin borde; hover `--color-primary-hover` | ninguna | `common/Button.tsx` |
| **Botón secundario** | igual medida que el primario | `bg: transparent`, `1px solid --color-border-control`, `color: --color-ink` | ninguna | `common/Button.tsx` |
| **Botón destructivo** | igual medida; solo para borrar | `color: --color-error` sobre fondo claro; confirmación obligatoria | ninguna | `common/Button.tsx` |
| **Botón ícono** | 44x44px, `--radius-pill`, un solo `aria-label` | `bg: --color-canvas`, `1px solid --color-border-control` | ninguna | `common/Button.tsx` |
| **Campo** (texto, área, select, fecha) | `--radius-md`, `min-height: var(--tap-min)`, relleno `10px 14px`, `--text-body-md` | `bg: --color-canvas`, borde `--color-border-control`; foco `--color-primary` + anillo de 3px | ninguna | `common/Field.tsx` |
| **Tarjeta (Cartulina)** | `--radius-lg`, relleno `--spacing-lg` (`--spacing-md` en compacta) | `bg: --color-surface-card`, `1px solid --color-hairline` | `--shadow-paper` | `.card` de `src/index.css` |
| **Tarjeta de lectura (Papel)** | forma `tarjeta` o `pieza` de §0.3 | tinte del módulo (§0.4) | la del primitivo | `common/Papel.tsx` |
| **Modal** | `--radius-xl`, ancho máximo 480px (formularios), 540px (bóveda), 640px (búsqueda); relleno `--spacing-lg` | `bg: --color-surface-card`, `1px solid --color-hairline`; velo `--color-scrim` | `--shadow-lg` | `common/Modal.tsx` |
| **Insignia** | `--radius-pill`, `--text-caption` | tinte del módulo o `--color-surface-warm` | ninguna | clase compartida |

- **Estructura fija de un modal:** título (`h2` o `h3` en `--font-primary`), cuerpo, y una fila de acciones alineada a la derecha con **cancelar a la izquierda y la acción principal a la derecha**. La acción principal usa el verbo de lo que hace ("Guardar carpeta", "Borrar nota"), nunca "Aceptar" ni "Enviar". Cierra con Escape y con clic en el velo, devuelve el foco al elemento que lo abrió y atrapa el foco mientras está abierto.
- **Una sola forma de modal.** El recorte rasgado de `HabitModal` y `VaultModal` (`clip-path` de dientes arriba y abajo) es la única variación vigente y se reserva para modales de **ritual** (hábitos, bóveda), que usan el material Papel. Los modales de formulario y de decisión usan Cartulina lisa. No se crea una tercera forma.
- **Un solo velo.** `--color-scrim` (hoy `rgba(20, 20, 19, 0.45)` repetido a mano en cada modal) y `backdrop-filter: blur(2px)` como máximo; nunca otro desenfoque.
- **Un solo radio por tamaño de control.** Botón y campo comparten `--radius-md`. El botón en píldora (`--radius-pill`) queda solo para insignias, filtros tipo etiqueta y la acción primaria de una barra de herramientas, y se decide por **posición** (barra) y no por vista.

### 7.3 Estados compartidos

| Estado | Regla |
| :--- | :--- |
| **Foco visible** | `outline: 2px solid var(--color-focus)` con `outline-offset: 2px`; contraste mínimo 3:1 contra el fondo del control y el de la superficie. Nunca `outline: none` sin reemplazo. |
| **Hover** | solo en dispositivos con puntero (`@media (hover: hover)`). Primario: `--color-primary-hover`. Secundario: fondo `--color-surface-warm`. Sin `transform` que desplace la maquetación. |
| **Activo / pulsado** | escala `0.98` como máximo; sin cambio de color distinto del hover. |
| **Deshabilitado** | opacidad `0.5`, `cursor: not-allowed`, `aria-disabled` o `disabled`; el texto deshabilitado no está obligado a cumplir contraste, pero la etiqueta sí debe seguir legible. |
| **Error** | borde `--color-error`, texto de error en `--color-text-error` **y** un ícono o mensaje (el color no es el único canal), enlazado con `aria-describedby`. |
| **Carga** | esqueleto con la silueta del contenido (§7.7), con un texto que dice qué carga ("Cargando los PDF…") para el lector de pantalla; nunca un spinner ni un vacío. Un botón que envía se bloquea para evitar doble envío. |
| **Transición** | `--duration-fast` (150ms) en color, borde y sombra. `transition: all` queda prohibido. Con `prefers-reduced-motion: reduce` se anulan las transiciones de transformación. |

### 7.4 Modo oscuro

**Estado vigente (2026-10-30): el modo oscuro existe** y se activa con el conmutador de la cabecera (`ThemeToggle`) o, sin elección guardada, con la preferencia del sistema. Las superficies `--color-surface-dark*` del manifiesto, el pie de página y el "bloque nocturno" siguen siendo **superficies oscuras fijas**, presentes en cualquier tema; no son el modo oscuro.

Cómo está hecho (todo en `src/index.css`, `src/utils/theme.ts`, `src/components/common/ThemeToggle.tsx` y `public/theme-init.js`):
- **Dos bloques idénticos**: `:root[data-theme="dark"]:not([data-force-light])` (elección manual) y `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]):not([data-force-light]) }` (sistema). `textTokensContrast.test.ts` comprueba que declaran exactamente lo mismo.
- **`color-scheme: light`** en `:root` y `dark` en los bloques oscuros: controles nativos y barras de scroll siguen el tema.
- **Elección guardada** en `localStorage.espiralia_theme` (`light` o `dark`; sin valor manda el sistema), fuera de los datos de los perfiles. `public/theme-init.js` la aplica antes del primer pintado (va como archivo porque el CSP de `index.html` no admite scripts en línea).
- **Efecto del conmutador**: el de https://theme-toggle.rdsx.dev (View Transitions API, variante `circle-with-blur`: máscara SVG con un círculo y `feGaussianBlur stdDeviation=2`, no un recorte duro, que crece desde el botón; el viewBox de la máscara es de 60 y no de 40 como en la referencia, porque con 40 la caja corta la cola del blur y deja una línea recta), sin dependencia nueva. Con `prefers-reduced-motion` no hay círculo (es movimiento) pero sí un fundido de 600ms del tema nuevo sobre el viejo, porque un cambio instantáneo de todo el color de la pantalla se siente como un golpe; sin la API el cambio es inmediato. Es la cuarta excepción a MOTION 1: responde a una acción, dura 2000ms con arranque y llegada suaves y casi simétricos (`cubic-bezier(0.37, 0, 0.63, 1)`: una curva más asimétrica concentra el avance en la primera mitad y el círculo parece más rápido de lo que dura) y no se repite. Mientras dura, `data-theme-switching` anula el nombre `pagina` y la mezcla `plus-lighter` del navegador (`mix-blend-mode: normal`, el único valor permitido).
- **La landing no se tematiza**: es una pieza de papelería con colores propios, así que `LandingView` pone `data-force-light` en `<html>` y siempre se ve en claro. Tampoco cambian los papeles fijos (post-its amarillos, latón, etiqueta del lomo, 404): llevan sus textos en `--on-papel-*`.
- **Divisores y puntos de papel sin hex**: los bordes y divisores de superficies usan `--color-hairline` y la trama punteada de los papeles `--color-grid-bujo`; un hex claro fijo en oscuro se ve como una línea o un punto casi blanco que cruza el texto (pasó en el modal de nota). Las superficies que sí son papel fijo (post-its, latón) conservan sus colores.
- **Texto sobre un color que no controlamos**: cuando la persona elige el color (solapa de carpeta), el texto no puede ser siempre blanco. `utils/folderTabColors.ts` elige la tinta (blanca u oscura) con más contraste y, si ninguna llega a 4,5:1, oscurece el relleno hasta que llegue; la misma función tiene un test por partición de colores. Un acento como color de texto (día de un evento, categoría) usa su token `--color-text-*` y el acento queda para el borde o el relleno.
- **Texto sobre papeles fijos** usa `--on-papel-ink`, `--on-papel-ambar` y `--on-papel-magenta` (no cambian con el tema); el magenta como texto o icono usa `--color-text-primary`, y el anillo de foco `--color-focus`.

La definición que sigue se escribió antes de implementarlo; los valores finales están en la tabla de abajo (se ajustaron al medir contra los tintes oscuros).

Reglas del mecanismo, sin excepciones locales:

1. **Mecanismo.** Un solo conjunto de tokens redefinidos, en `src/index.css`:
   - `:root:not([data-theme="light"])` dentro de `@media (prefers-color-scheme: dark)`, y `:root[data-theme="dark"]` para la elección manual.
   - `color-scheme: light dark` en `:root` para que controles nativos, barras de scroll y autocompletado sigan el tema.
   - Una preferencia explícita de la persona (claro, oscuro, sistema) se guarda en `localStorage` con una clave propia (`espiralia_theme`), fuera de los datos de los perfiles, y se lee **antes** del primer pintado para no parpadear.
2. **Ningún componente conoce el tema.** Un `.module.css` no contiene `@media (prefers-color-scheme)` ni `[data-theme]`: solo consume tokens. Si un componente "necesita" una regla de oscuro, falta un token.
3. **Tokens semánticos, no de tinte.** Se redefinen los semánticos; los tintes de módulo (`--papel-*`) tienen su propia versión oscura y siguen codificando el mismo módulo.

Valores vigentes (contraste medido con la fórmula WCAG; `textTokensContrast.test.ts` los recorre sobre las superficies oscuras, sus tintes y la esquina de la tarjeta de Papel). Lo que cambió respecto de la propuesta inicial, tras medir: `--color-muted` pasa de `#A09D96` a **`#BCB8B0`** (sobre los tintes oscuros daba 3.5:1 a 4.3:1), `--color-border-control` de `#8A857A` a **`#9C978C`** y `--color-text-error` de `#F08A8A` a **`#F6A0A0`** (la esquina del tinte pizarra daba 2.9:1 y 4.4:1); los tintes `terracota`, `ambar`, `pizarra` y `turquesa` se separaron para mantener los 15 de distancia entre tintes, y los textos del Papel (`--papel-texto-*`) se aclararon.

| Token | Claro (vigente) | Oscuro (vigente) | Contraste oscuro |
| :--- | :--- | :--- | :--- |
| `--color-canvas` | `#FCF9F6` | `#1A1817` | base |
| `--color-surface-card` | `#FFFFFF` | `#252320` | 1.13:1 con el canvas (separa por borde y sombra, no por contraste) |
| `--color-ink` | `#1A1917` | `#F2EEE8` | 15.3:1 sobre canvas |
| `--color-body` | `#3D3D3A` | `#D4D0C8` | 11.5:1 sobre canvas |
| `--color-muted` | `#57554F` | `#BCB8B0` | 7.8:1 sobre canvas; 4.7:1 o más sobre los tintes oscuros |
| `--color-hairline` | `#E8E2D8` | `#3A3732` | 1.5:1; solo para divisores decorativos |
| `--color-border-control` (claro vigente desde 2026-10-30) | `#76716A` | `#9C978C` | 3.5:1 o más sobre toda superficie, esquina oscura de los tintes incluida |
| `--color-primary` (relleno de botón) | `#8E1EA2` | `#8E1EA2` | texto blanco 7.4:1 |
| **`--color-text-primary`** (nuevo: enlaces y texto magenta) | `#8E1EA2` | `#E3A6F0` | 9.3:1 sobre canvas, 8.2:1 sobre tarjeta |
| **`--color-focus`** (nuevo) | `#8E1EA2` | `#E3A6F0` | 8.2:1 sobre tarjeta |
| `--color-text-success` | `#316F3F` | `#7FD08F` | 8.5:1 sobre tarjeta |
| `--color-text-error` | `#B13636` | `#F6A0A0` | 5.1:1 o más sobre toda superficie y tinte oscuro |
| `--color-text-teal` | `#2F6B60` | `#7FD3C2` | 9.0:1 sobre tarjeta |
| `--color-text-amber` | `#8E5414` | `#F0BE7A` | 9.2:1 sobre tarjeta |
| **`--color-scrim`** (nuevo) | `rgba(20, 20, 19, 0.45)` | `rgba(0, 0, 0, 0.6)` | n/a |

Reglas propias del oscuro:

- **El magenta `#8E1EA2` no se usa como texto, ícono ni borde sobre fondo oscuro** (2.4:1 contra el canvas). Como relleno de botón con texto blanco sí (7.4:1). Para texto y foco se usa `--color-text-primary` y `--color-focus`.
- **El borde de un campo o control no puede ser el `--color-hairline` oscuro** (1.5:1): un control debe distinguirse con 3:1 o más (WCAG 1.4.11), así que los campos usan `--color-border-control`.
- **Sombras:** sobre fondo oscuro una sombra negra casi no se ve. La elevación se expresa con superficie más clara (`--color-surface-card`) y un borde de `--color-hairline`; la sombra `--shadow-paper` se reduce a opacidad `0.35` sobre negro puro. Nada de `box-shadow` con color claro ni brillos.
- **El Papel conserva su lógica.** Los siete tintes (§0.4) tienen versión oscura: mismo matiz, luminosidad baja, saturación suficiente para que sigan distinguiéndose entre sí (mismo criterio que el de §0.4: distancia mínima entre tintes). Ejemplos de partida: arena `#3A3228`, pizarra `#2B3541`; con texto `--color-ink` rinden 10.9:1 y 10.8:1. El degradado de esquina (§0.12) oscurece hacia `--papel-<tinte>-fuerte` en su versión oscura. El grano de papel baja a `1.5 %`.
- **Imágenes, íconos y SVG** usan `currentColor` o tokens; ninguno lleva color fijo. Prohibido `filter: invert()` para "generar" el tema oscuro.
- **Datos de usuario no se tocan.** El color de un área o de una carpeta que la persona eligió se guarda como dato y **no cambia con el tema**; lo que cambia es el color del texto que se pone encima (se elige por contraste, no por tema). Los gráficos usan esos colores de área con contorno `--color-ink` para sostener 3:1.
- **`forced-colors: active` y `prefers-contrast: more`** mandan sobre ambos temas: borde visible en todo control, sin sombras desplazadas, sin `clip-path` en los papeles (§0.10.6).
- **Verificación obligatoria al añadirlo:** capturas de las ocho rutas a 375 y 1440px en los dos temas; `textTokensContrast.test.ts` ampliado para recorrer cada par texto/fondo en ambos temas; sin parpadeo del tema claro al cargar con preferencia oscura guardada.

### 7.5 Estado actual medido (2026-10-30) y plan de migración

Inventario: hay **101 definiciones de clases de botón, campo, modal y tarjeta repartidas en 20 archivos `.module.css`**, sin primitivos compartidos (`src/components/common/` solo tiene `Pliego` y `Papel`). Divergencias encontradas:

| Elemento | Qué varía hoy |
| :--- | :--- |
| Botón primario | radio `--radius-pill` en Agenda, `--radius-md` en Acceso, `--radius-sm` en `FolderModal`, `6px` literal en `HabitModal`; relleno `8px 18px`, `10px 16px`, `0.5rem 1.25rem` y `0 18px`; texto `#ffffff` literal en `HabitModal` en lugar de `--color-on-primary`. |
| Botón secundario | cinco definiciones (`FoldersView`, `AgendaView`, `FolderModal`, `HabitModal`, `ProfileGateView`) con colores de texto distintos (`--color-ink`, `--color-body`, `--color-ink-muted` con respaldo `#666`). |
| Modal | radio `--radius-lg` (Planner, búsqueda), `--radius-xl` (acción rápida) y recorte `clip-path` (hábitos, bóveda); sombra `--shadow-lg`, `0 10px 25px rgba(0,0,0,0.1)` literal y `drop-shadow` literal; fondo `--color-surface-card`, `--color-surface` (inexistente, con respaldo) y `--color-canvas`; velo `rgba(20, 20, 19, 0.45)` repetido en cada archivo. |
| Respaldos de hex en `var()` y alias | muchos `var(--x, #e6dfd8)`: el respaldo en hex congela el color claro y no cambiaría con el tema oscuro. Además conviven alias distintos para el mismo rol (`--color-surface`, `--color-surface-card`, `--bg-card`, `--color-canvas` para el fondo de una caja; `--color-ink-muted` y `--color-muted` para el texto secundario; `--font-headline` y `--font-primary` para titulares). Todos existen en `src/index.css`, pero cada vista elige uno distinto. |

**Avance (2026-10-30):**
- **Paso 1, hecho:** `--color-scrim`, `--color-focus`, `--color-text-primary` y `--duration-fast` existen en `src/index.css` con su valor claro (`--color-border-control` y `--color-text-error` ya estaban).
- **Pasos 2 y 3, hechos en CSS:** los primitivos viven en `src/components/common/Dialogo.module.css` (`velo`, `caja`, `titulo`, `campo`, `etiqueta`, `control`, `acciones`, `btnPrimario`, `btnSecundario`, `btnPeligro`) y cada modal los toma con `composes`. Migrados: carpetas, bloque del Planner, metas, nota, ajustes de perfil, acción rápida, hábitos y bóveda (72 reglas, 34 reglas de hover y foco repetidas eliminadas). Todos miden igual: controles de 44px con radio `--radius-md` y borde `--color-border-control`, botones con radio `--radius-md` y relleno `12px 20px`, un solo velo. `HabitModal`, `VaultModal`, `NoteModal` y `ProfileSettingsModal` conservan su caja de ritual (papel y recorte); `QuickActionModal` conserva su caja con encabezado. Fuera de esta pasada: la búsqueda global (solo toma el velo) y el modal de foco del Dashboard (solo el velo).
- **Paso 4, hecho (2026-10-30):** se quitaron 354 respaldos de color de `var(--token, #hex)` en 27 `.module.css` (el token siempre existía en `src/index.css`, así que el respaldo no se usaba y congelaría el color claro) y se unificaron los alias que valían lo mismo: `--color-ink-muted` pasa a `--color-muted` y `--font-headline` a `--font-primary`. **No se unificaron** `--color-surface`, `--color-surface-card` ni `--bg-card`, porque son tres colores distintos (`#EFE9DE` es la cartulina y `#FCF9F6` el papel); decidir cuál va en cada caja es una decisión de diseño, no una limpieza.
- **Paso 5, hecho (2026-10-30):** modo oscuro con conmutador (§7.4). Medido en el navegador con una auditoría de contraste de cada texto contra su fondo (incluidos los degradados): Dashboard, Agenda, Planner, Notas y Carpetas quedan sin fallos; Integraciones y To-Do solo conservan la marca de agua decorativa de las solapas (`.tabWatermark`, 8 % de opacidad a propósito). Para llegar ahí se pasaron a token 35 colores que valían exactamente lo mismo que un token, 6 blancos translúcidos, 26 fondos neutros cálidos y 12 translúcidos cremas, 95 textos magenta (`--color-primary` pasa a `--color-text-primary`) y 32 anillos de foco (`--color-focus`), más una decena de textos con color fijo (verdes, ámbares y azules grisáceos); en claro cada reemplazo vale lo mismo que antes, salvo los neutros cálidos y esos textos, que convergen al token más cercano.
- **Pendiente:** los componentes React `Button`, `Field` y `Modal` (hoy el estilo común es CSS compartido, no un componente); unificar los tres fondos de caja; revisar en oscuro la pantalla de Acceso, los modales de hábitos y carpetas y los 404 (no se auditaron); y los 274 colores literales que quedan fuera de la landing, el origami, el ornamento y el 404 (sobre todo sombras, adornos y papeles fijos) que la auditoría de contraste no marca pero siguen sin tokenizar.

Orden de migración propuesto (cada paso se entrega y revierte por separado, con la suite en verde):

| Paso | Qué | Verificación |
| :--- | :--- | :--- |
| 1 | Agregar tokens faltantes a `src/index.css` (`--color-scrim`, `--color-focus`, `--duration-fast`, `--color-text-primary`; `--color-text-error` y `--color-border-control` ya existen) y fijar un solo alias por rol (fondo de caja: `--color-surface-card`; texto secundario: `--color-muted`; titulares: `--font-primary`) con su valor claro actual; sin cambio visual. | Suite y `textTokensContrast.test.ts` en verde; capturas idénticas. |
| 2 | `common/Modal` (velo, caja, título, fila de acciones, foco y Escape) y migrar los 9 modales (Planner, acción rápida, búsqueda, carpeta, enlace, nota, ajustes de perfil, hábitos y bóveda), uno por commit. | Tests por modal; Escape, devolución del foco y atrape del foco. |
| 3 | `common/Button` y `common/Field`; migrar por vista, empezando por los modales ya migrados. | Sin controles menores de 44px; foco visible 3:1. |
| 4 | Quitar los hex de respaldo y los tokens inexistentes de los `.module.css`. | Test de consistencia de §7.6. |
| 5 | Si se decide, activar el modo oscuro (§7.4). | Lista de verificación de §7.4. |

### 7.6 Cómo se vigila (parcial: ya vigilado en `src/tests/textTokensContrast.test.ts`; el resto por implementar en `src/tests/designConsistency.test.ts`)

La regla no es solo texto: se vuelve test, igual que el presupuesto de Papel (§0.10). **Ya vigilado (2026-10-30):** `--color-border-control` con 3:1 o más sobre toda superficie y esquina de Papel; `--color-muted` con 5.5:1 sobre las superficies y 4.5:1 sobre los tintes; y que ningún botón, campo ni selector (fuera de la landing) use `--color-hairline` como borde. Lo que sigue en la lista es lo que falta. **Desde el 2026-10-30 también vigila `src/tests/designConsistency.test.ts`:** los 8 modales toman sus controles de `common/Dialogo.module.css` y ninguno redefine el radio de sus botones; el velo sale de `--color-scrim` y no de un `rgba()` propio; `Dialogo.module.css` no tiene colores sueltos ni `transition: all`; y cada `var(--token)` que usa existe en `src/index.css`. Del paso 4 vigila además que ningún módulo use `var(--token, color)` con un token definido en `src/index.css`, que cada `var(--token)` de un módulo esté definido en `src/index.css`, en otro módulo o en un estilo en línea, y que no se usen los alias `--color-ink-muted` ni `--font-headline`.

- **Tokens inexistentes:** cada `var(--nombre)` de un `.module.css` debe existir en `src/index.css`; un `var(--x, #hex)` cuyo `--x` no existe falla.
- **Sin color suelto:** ningún `.module.css` de componente contiene un `#hex` ni un `rgb()` o `rgba()` fuera de `src/index.css` y de los archivos de ilustración (`Origami*`), que quedan en una lista cerrada.
- **Un solo velo y una sola sombra de modal:** el velo y la sombra de un modal solo pueden venir de `--color-scrim` y `--shadow-lg`.
- **Radios:** botones y campos solo usan `--radius-md`, salvo la lista cerrada de píldoras.
- **Sin `transition: all`.**
- **Modo oscuro (si existe):** cada token semántico redefinido cumple su umbral de §7.4 en ambos temas, y ningún `.module.css` contiene `prefers-color-scheme` ni `data-theme`.

Mientras el test no exista, la revisión de PR aplica esta lista a mano: un cambio que agrega un botón, tarjeta, campo o modal con estilo propio se devuelve.

### 7.7 Estados de carga: esqueleto, no spinner ni vacío (regla de diseño, 2026-10-31)

> Decisión de la persona dueña: **todo estado de carga se resuelve con un esqueleto**. Un espacio en blanco o un spinner solitario no dicen qué viene ni cuánto falta, y el contenido salta cuando llega; un esqueleto muestra la forma de lo que se está cargando y la maquetación no se mueve al terminar.

- **Qué es:** piezas grises con la silueta del contenido real (línea de texto, bloque de tarjeta, círculo de avatar), compuestas con `common/Esqueleto.tsx`. El color sale de `--color-surface-card` y `--color-hairline`, así que sirve en ambos temas sin código propio.
- **Misma silueta, misma medida:** el esqueleto reserva el alto y el ancho de lo que sustituye (tarjetas de 9rem, filas de 2.25rem). Si el contenido cambia de forma, el esqueleto cambia con él.
- **Se anuncia una vez:** el conjunto va dentro de un `role="status"` con `aria-busy="true"` y un texto en `.visually-hidden` que dice qué carga ("Cargando espacio…"). Las piezas son `aria-hidden`, para que el lector no las lea una por una.
- **Movimiento:** un pulso de opacidad (`respirar`, 1,8s, hasta 0,55) mientras algo carga; no se desplaza nada ni hay brillo que cruce. Con `prefers-reduced-motion: reduce` el esqueleto queda quieto. Es la quinta excepción a MOTION 1 y la única animación infinita de carga: el spinner giratorio **queda prohibido** (`esqueleto.test.tsx` lo vigila).
- **Dónde rige hoy:** la carga de cada vista (`RouteLoadingFallback`, silueta de encabezado, bajada y tarjetas) y los PDF de una carpeta mientras se leen de IndexedDB. Los datos de `localStorage` se leen de forma síncrona y no necesitan esqueleto.
- **Cuándo se agrega uno nuevo:** cualquier espera visible que no sea instantánea (red, IndexedDB, un `lazy`). Un estado vacío real ("no hay notas todavía") **no** es una carga y sigue siendo un vacío con su acción (§7.3).

### 7.8 Ventana de carga: el momento de alto impacto (regla de diseño, 2026-10-31)

> Decisión de la persona dueña: además del esqueleto, la app tiene **una ventana de carga a pantalla completa con un efecto de alto impacto visual**, funcional y no decorativa. Cubre dos momentos: el arranque y el cambio de perfil. Dentro de la app, una espera normal sigue siendo un esqueleto (§7.7).

- **Efecto: origami que se pliega.** Una hoja cuadrada de papel (`--papel-arena`) se pliega dos veces, primero por la diagonal y luego por la mitad, y se disuelve en el Nautilus de la marca (`OrigamiNautilus`, §0.12). Es CSS puro (`clip-path` y `rotate3d`), sin imagen ni dependencia, y se reproduce **una sola vez**: termina con el Nautilus completo y queda quieto, sin bucle (R-19).
- **Es funcional:** quien la monta decide cuándo hay una carga real y la desmonta al terminar; no hay temporizador falso ni porcentaje inventado. Hoy la monta `RouteLoadingFallback` en la primera espera del `Suspense` tras abrir la app o cambiar de perfil ("Abriendo Espiralia…"), y `ProfileGateView` mientras `busy` (verificación de PIN con PBKDF2: "Verificando tu PIN…"; creación de perfil: "Creando tu cuaderno…"). `utils/arranqueCarga.ts` guarda si falta la primera espera; `reiniciarArranque()` se llama al elegir un perfil.
- **Sin destello:** no se ve hasta pasados **300ms** (retraso de la animación de entrada). Una carga rápida no la muestra nunca; una lenta la muestra con el efecto ya en marcha.
- **Etiqueta:** siempre dice qué se hace, en palabras de quien usa la app, y es lo único que se anuncia (`role="status"`, `aria-busy="true"`). El efecto va en `aria-hidden`.
- **Movimiento reducido:** sin pliegue; tras los 300ms se ve el Nautilus ya formado.
- **Tokens, no hex:** fondo `--color-canvas`, papel `--papel-arena` y `--papel-arena-fuerte`, texto `--color-muted`; funciona en ambos temas sin código propio. Capa `z-index: 60`, por encima del velo de los modales (50).
- **Es la sexta excepción a MOTION 1** y no suma bucles: `ventanaCarga.test.tsx` vigila el retraso de 300ms, que no haya `infinite`, el modo sin movimiento y que no haya colores sueltos.
- **Peso (medido el 2026-10-31):** el Nautilus se carga diferido dentro de la ventana, pero la ventana y el esqueleto suman 1,2 KB a la carga inicial: 183,9 KB sin ellos y **185,1 KB con ellos**, contra un tope de 184 KB. **Pendiente de la persona dueña:** subir `PRESUPUESTO_KB` en `.github/workflows/ci.yml` (y el tope de `AGENTS.md` §17.1) o recortar peso en otro lado; el Build del PR falla mientras no se decida.
