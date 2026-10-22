# Espiralia — Sistema de Diseño Visual Maestro & Especificación de Papelería Editorial (DESIGN.md)
>
> Documento técnico y artístico unificado para **Espiralia**. Fusiona la precisión arquitectónica y tokens exhaustivos de la referencia editorial inicial con la riqueza táctil, sensorial y emocional del sistema **«Warm Editorial Stationery & Papercraft UI»** (inspirado en las láminas de referencia *Student University Planner*, *Focus Plan* y *Daily Planner*).

**Theme:** warm-editorial-stationery (Lienzo cálido de imprenta artesanal, libre de blancos clínicos a nivel global, con acentos orquídea/magenta de identidad y tonos orgánicos de cuaderno de autor).

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
   - Representación visual de la arquitectura *100% Client-Side* (sin registro en la nube, IndexedDB reactivo, cero telemetría externa) mediante insignias, certificados tipográficos y timbres de imprenta que transmiten privacidad íntima.

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
| **caption** | 11px – 13px | 1.40 | 0 | Sans 500/600 | `--text-caption` |
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

### ✅ Hacer (Do)
- **Mantener el pliego marfil cálido (`#FCF9F6`)**: El lienzo unificador de toda la plataforma debe sentirse como papel bond/lino artesanal.
- **Armonizar control operativo y serenidad emocional**: Acompañar siempre las listas de tareas y tablas de tiempo con lemas inspiradores, aforismos diarios y sellos de racha.
- **Respetar la jerarquía tríadica**: Serif para cabeceras y citas, sans para lectura y control operativo, script para notas afectivas, mono para metadatos y bóveda.
- **Garantizar soporte de exportación/impresión**: Diagramación limpia con soporte para impresión o exportación a PDF para quienes combinan soporte digital y físico.
- **Objetivo táctil mínimo de 44x44px**: botones, inputs, selects, tabs y enlaces con clase usan `--tap-min` (regla global en `src/index.css`). Decisión del dueño, 2026-10-22: sube el 40px anterior.
- **Preservar los tokens exactos**: Usar siempre las variables documentadas (`--color-primary`, `--color-canvas`, etc.) para consistencia absoluta en todo el proyecto.

### ❌ No Hacer (Don't)
- **No utilizar fondos blancos clínicos (`#FFFFFF` puro) como fondo general de página**: El blanco queda restringido exclusivamente a cartulinas y notas superpuestas.
- **No emplear sombras oscuras, duras o plásticas**: Emplear siempre sombras multicapa difusas que simulen hojas de papel reposando sobre un escritorio.
- **No omitir las frases y aforismos motivacionales**: Son parte nuclear de la experiencia de calma y bienestar solicitada por el usuario.
- **No usar colores neón estridentes ni esquemas corporativos fríos**: Preservar siempre la atmósfera íntima de cuaderno personal y papelería física de autor.
- **No introducir colores fuera de los tokens documentados**: Mantener la disciplina cromática entre el magenta identitario, tonos marfil y acentos orgánicos (pizarra, salvia, terracota).
