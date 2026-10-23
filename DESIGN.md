# Espiralia — Sistema de Diseño Visual Maestro & Especificación de Papelería Editorial (DESIGN.md)
>
> Documento técnico y artístico unificado para **Espiralia**. Fusiona la precisión arquitectónica y tokens exhaustivos de la referencia editorial inicial con la riqueza táctil, sensorial y emocional del sistema **«Warm Editorial Stationery & Papercraft UI»** (inspirado en las láminas de referencia *Student University Planner*, *Focus Plan* y *Daily Planner*).

**Theme:** warm-editorial-stationery (Lienzo cálido de imprenta artesanal, libre de blancos clínicos a nivel global, con acentos orquídea/magenta de identidad y tonos orgánicos de cuaderno de autor).

**Dial:** ENERGY 2 / RHYTHM 2 / MOTION 1 (antislop, núcleo Parte 3). ENERGY 2: presencia editorial sin estridencia. RHYTHM 2: las secciones alternan composición (un elemento a ancho completo, listas, pares) en vez de repetir tres tarjetas. MOTION 1: solo estados de interacción (hover, foco, transiciones breves); sin animaciones en bucle.

---

## 0. Dirección de Impacto Visual: el cuaderno de espiral (plan v2)

> Estado: **plan en ejecución, pasos 0 a 2 hechos** (§0.8). Implementado: fuentes autoalojadas (`9bcc46a`), `Pliego` (`ef8acfd`), acceso por PIN en un solo diálogo (`0dc8f1a`), respaldo del acceso alineado con la bóveda (`9dd66a5`), primitivo `Papel` y tokens `--papel-*` (`c6647af`) y el Dashboard con Papel por módulo y fecha como hoja (`b6791eb`). Lo demás de esta sección es *por implementar*. El resto del documento (§1 a §6) describe lo vigente en el código. Restricción dura: nada de esto cambia claves, formas ni valores guardados en `localStorage`; es solo presentación.

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

| Módulo | Tinte | Base (token) | Mezcla con `--color-canvas` |
| :--- | :--- | :--- | :--- |
| Dashboard, neutro | Arena | `--color-surface-card` | sin mezcla |
| Agenda y fechas | Pizarra | `--color-accent-slate` | 14 % |
| Planner | Salvia | `--color-accent-sage` | 14 % |
| To-Do y prioridad | Terracota | `--color-accent-terracotta` | 12 % |
| Notas | Ámbar | `--color-accent-amber` | 16 % |
| Carpetas | Rosa | `--color-primary-soft` | 16 % |
| Integraciones | Turquesa | `--color-accent-teal` | 14 % |

- Una tarjeta resumen del Dashboard lleva el tinte del módulo que resume (Horario: pizarra; Planner de la semana: salvia; Recordatorios: terracota).
- Las piezas pequeñas (etiqueta, pestaña) llevan una versión más intensa (28 a 42 %) del mismo tinte.
- **El Acceso y la landing no son módulos.** Allí los tintes se reparten por tema y cada uno se usa una sola vez por pantalla (datos locales: pizarra; PIN: rosa; respaldo: salvia; aforismo: ámbar), sin pretender que signifiquen un módulo.
- Los tintes se declaran como tokens (`--papel-arena`, `--papel-pizarra`, etc.) calculados con `color-mix` sobre los tokens base; no se escriben hex nuevos.
- El texto sobre cualquier tinte usa `--color-ink` o `--color-body` y debe pasar 4.5:1 (test en `textTokensContrast.test.ts`).
- **El magenta queda reservado para acciones y para el subrayado de la fecha.** No se usa como tinte de superficie.

### 0.5 La fecha como hoja de calendario

Solo en el **Dashboard** y en el **hero de la landing**. El numeral del día va sobre una pieza de Papel arena rasgada por arriba, como una hoja arrancada de un taco. Es la única pieza con doble tinta: sombra desplazada 2px en pizarra al 55 %. Junto a la hoja: etiqueta de Agenda (pizarra) con día de la semana y semana ISO (`isoWeekNumber`) en monoespaciada, el mes en el titular y un subrayado magenta.

- Agenda y Planner **no** repiten el numeral: ya muestran la fecha en su propio calendario. Solo suman la semana ISO en monoespaciada.
- Con `prefers-contrast: more` y `forced-colors: active` se quita la sombra desplazada.

### 0.6 Tipografía (después del paso 0)

| Rol | Familia | Uso |
| :--- | :--- | :--- |
| Display | **Fraunces** (variable; ejes `opsz` y `wght`, `SOFT` fijo en 100) | Fecha, titulares y citas. |
| Cuerpo | **Atkinson Hyperlegible Next** | Listas, formularios, controles. Reemplaza a Inter, que es la sans por defecto de este tipo de interfaz. |
| Manuscrito | **Reenie Beanie** | Aforismos y notas, a 22px o más. Reemplaza a Caveat. |
| Técnica | **Spline Sans Mono** | Semana ISO, horas, almacenamiento, metadatos. Reemplaza a JetBrains Mono. |

- Las cuatro familias se publican con licencia abierta (OFL); se confirma al descargar cada una.
- Se sirven desde el sitio, en `woff2`, con subconjunto latino y `font-display: swap`. Para bajar el peso se fijan los ejes que no se usan (`WONK`, `SOFT`) con `fonttools`.
- **El presupuesto se mide antes de comprometerlo.** Hasta tener el número real, la ruta crítica (display y cuerpo) no supera 120KB; el manuscrito y la monoespaciada se cargan por `unicode-range` solo si se usan.
- Escala fluida: `display-xl: clamp(3rem, 1.5rem + 6vw, 6rem)`, `display-lg: clamp(2.25rem, 1.4rem + 3.5vw, 4rem)`, `display-md: clamp(1.75rem, 1.3rem + 2vw, 2.5rem)`. Cuerpo mínimo de 15px; el mínimo absoluto sigue siendo `--text-micro` (11px).

### 0.7 Movimiento y grano

- **Una sola escena: pasar la página** al cambiar de vista (240ms, desplazamiento de 8px), con la View Transitions API como mejora progresiva. Sin soporte o con `prefers-reduced-motion`, no hay transición. Es el último paso del plan.
- **Grano de papel** al 3 %: una textura SVG como `background-image` del `body` (no una capa fija a pantalla completa, para no repintar al hacer scroll). Sin degradados, sin brillos, sin desenfoque, sin `mix-blend-mode`.

### 0.8 Orden de ejecución (cada paso se puede entregar y revertir por separado)

| Paso | Qué | Cómo se verifica |
| :--- | :--- | :--- |
| 0 | **Autoalojar las fuentes actuales**, sin cambio visual. **Hecho** (`9bcc46a`): Caveat, Inter y JetBrains Mono, solo latino, 151 KB en total. Newsreader se descartó porque nunca se usaba (solo era respaldo de una variable siempre definida). | Medido: un solo host (`localhost`) en 5 rutas, y las tres fuentes cargan. Test `noExternalRequests.test.ts`. |
| 1 | **Primitivos**: `Papel`, tokens `--papel-*`, `Pliego` y los tests de presupuesto. **Hecho** (`c6647af`). | Tests rojos antes y verdes después; 14 tintes con 4.5:1 sobre la tinta y el texto de cuerpo. |
| 2 | **Dashboard**: recortar ornamentos, tintes por módulo, hoja de la fecha. **Hecho** (`b6791eb`), con una excepción medida en §0.10 (criterio 4). | Capturas a 375 y 1440px; suite de 90 archivos y 657 tests en verde. **Punto de revisión con la persona dueña (pendiente).** |
| 3 | **Acceso**: pliego en la tarjeta de cuadernos, panel derecho con papeles de datos reales, aforismo en español y corrección de los textos falsos del respaldo y del PIN olvidado (§0.9). | Idem, más tests de texto. **Punto de revisión.** |
| 4 | **Resto de vistas**, una por commit: Agenda, Planner, To-Do, Notas, Carpetas, Integraciones. | Suite completa y capturas por vista. |
| 5 | **Tipografía nueva** (§0.6). | Peso medido contra el presupuesto; contraste y escala sin regresiones. |
| 6 | **Pasar la página** (§0.7). | Con y sin `prefers-reduced-motion`. |

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
| **`primary-active`** | `#C654C3` | `--color-primary-active` | Estado *hover*, foco y elementos interactivos activos. |
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
| **`muted`** | `#64625C` | `--color-muted` | Metadatos, horas, subtítulos, etiquetas y números monumentales de agua. Oscurecido en 2026-10-22 para cumplir 4.5:1 sobre todas las superficies cálidas. |
| **`muted-soft`** | `#8E8B82` | `--color-muted-soft` | Elementos terciarios de baja jerarquía visual. |
| **`hairline`** | `#E8E2D8` (`#E6DFD8`) | `--color-hairline` | Renglones de cuaderno, divisores finos y bordes sutiles de papel. |
| **`hairline-soft`** | `#EBE6DF` | `--color-hairline-soft` | Divisores interiores ultra tenues. |
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
   - `bg: var(--color-primary)` (`#8E1EA2`), `color: #FFFFFF`, `border-radius: var(--radius-md)` (8px), `padding: 12px 20px`, `min-height: 44px`, `font: var(--text-button)`. Hover: `bg: var(--color-primary-active)` (`#C654C3`), escala sutil `active:scale-[0.98]`.
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
