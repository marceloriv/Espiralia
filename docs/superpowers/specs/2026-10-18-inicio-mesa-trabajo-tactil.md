# Espiralia — Especificación: Mesa de Trabajo Táctil y Papelería Viva en Inicio

**Fecha:** 2026-10-18  
**Componentes:** `src/components/landing/LandingDeskPreview.tsx`, `src/components/landing/LandingHeroCard.tsx`  
**Estado:** Propuesto para implementación  

---

## 1. Visión y Propósito

La página de Inicio de Espiralia introduce a los usuarios a la filosofía de la aplicación: un santuario de orden personal sin distracciones, ejecutado 100% en el navegador con la nobleza estética de la papelería analógica japonesa y la arquitectura de un escritorio de estudio real.

Para elevar la experiencia táctil y tangible acordada en la sesión de diseño, esta especificación define:
1. **Micro-interacción de pluma estilográfica en la Mesa de Trabajo (`LandingDeskPreview`)**: Al marcar o desmarcar tareas en la lista de prioridades, el tachado no es una línea genérica del navegador, sino un trazo caligráfico animado en tinta violeta imperial Espiralia (`#7B188E` / `#9426A8`) que emula el deslizamiento físico del plumín sobre papel de 120 gsm.
2. **Medidor de Biorritmo y Foco reactivo en tiempo real (`LandingDeskPreview`)**: La tasa de serenidad y el indicador circular SVG de biorritmo se recalculan instantáneamente en función de las tareas completadas, comunicando cambios dinámicos a tecnologías asistivas mediante `aria-live="polite"`.
3. **Despliegue táctil de capas en el Hero (`LandingHeroCard`)**: Al pasar el cursor o interactuar con el bodegón de papelería del Hero (carpeta dossier manila, pliego rasgado de biorritmo y nota adhesiva), las tres piezas se abanican sutilmente con una inclinación orgánica de papel suelto retenido por un clip de latón con brillo especular.
4. **Accesibilidad y movimiento reducido**: Pleno respeto a la preferencia `@media (prefers-reduced-motion: reduce)`, eliminando animaciones de trazado y abanicado dinámico en favor de estados estáticos claros e inmediatos.

---

## 2. Requisitos Funcionales

### 2.1 Micro-Interacción de Tachado con Pluma Estilográfica (`LandingDeskPreview`)

1. **Trazo Caligráfico de Tinta**:
   - Cada tarea completada en la lista de prioridades (`.priorityItem`) renderiza un trazo de pluma estilográfica superpuesto al título.
   - **Propiedades visuales del trazo**:
     - Color: Gradiente de tinta violeta imperial Espiralia (`linear-gradient(90deg, #7B188E 0%, #9426A8 65%, #7B188E 100%)`).
     - Grosor: 2px con inclinación manual de -0.4deg que simula la inclinación natural del trazo de una pluma estilográfica.
     - Extensión: Se extiende ligeramente más allá del texto (sangría horizontal de 4px a cada lado).
   - **Animación de Dibujo (`inkStrokeDraw`)**:
     - Duración: 320ms con curva de aceleración física `cubic-bezier(0.22, 1, 0.36, 1)`.
     - Implementación técnica mediante pseudo-elemento `::after` con animación de ancho (`width: 0%` a `100%` o `clip-path: inset(0 100% 0 0)` a `inset(0 0 0 0)`).
   - **Color del texto**:
     - El texto de la tarea transiciona suavemente a color carbón sumi atenuado (`var(--color-muted, #6c6a64)`).

2. **Desmarcado de Tarea**:
   - Al desmarcar una tarea, el trazo de tinta se retrae o desaparece de inmediato, restableciendo el color del texto a `var(--color-body-strong)`.

3. **Movimiento Reducido (`prefers-reduced-motion: reduce`)**:
   - El trazo aparece de forma instantánea al 100% sin animación progresiva de ancho ni curvatura.

---

### 2.2 Medidor de Biorritmo y Serenidad Reactivo en Tiempo Real

1. **Cálculo Dinámico**:
   - Total de tareas en la mesa de muestra: 3 prioridades del día.
   - Fórmula de serenidad y foco:
     - 0 tareas completadas: `60% Serenidad` (estado inicial de calma matutina).
     - 1 tarea completada (estado inicial por defecto): `75% Serenidad` (o `84% Serenidad` base armónica: `Math.round(55 + (completedCount / totalCount) * 45)` donde 1/3 = 70%, 2/3 = 85%, 3/3 = 100%; para compatibilidad se parte de 70% o escalonado armonioso `60%`, `75%`, `90%`, `100%`).
     - Al alternar cualquier tarea, el valor porcentual se recalcula instantáneamente.
2. **Gráfico Circular SVG de Biorritmo (`biorhythmGauge`)**:
   - Integrado en la tarjeta de Estado Vital & Ritmo:
     - SVG circular de radio 24 (perímetro `2 * π * 24 ≈ 150.8px`).
     - Trazo de fondo: gris hairline suave (`var(--color-surface-soft, #f5f0e8)`).
     - Trazo activo: violeta Espiralia (`var(--color-primary, #7B188E)` / `#9426A8`) con `strokeDasharray` y `strokeDashoffset` proporcional al porcentaje de serenidad actual.
     - Transición suave de `stroke-dashoffset` en 400ms `ease-out`.
3. **Métricas Secundarias Sincronizadas**:
   - La fila "Módulos Completados" se actualiza dinámicamente con `{completedCount} de 3` y actualiza el ancho de su barra de progreso.
4. **Accesibilidad ARIA**:
   - El badge de serenidad y el medidor incluyen `aria-live="polite"` y `role="status"` para que los cambios sean comunicados a lectores de pantalla sin interrumpir la lectura del usuario.

---

### 2.3 Despliegue Táctil de Capas en Hero (`LandingHeroCard`)

1. **Bodegón Analógico Abanicado (Hover / Focus-Within)**:
   - En estado de reposo:
     - Capa 1 (Carpeta Dossier Manila): `transform: rotate(-1.5deg);`
     - Capa 2 (Pliego Rasgado de Biorritmo): `transform: rotate(1deg);`
     - Capa 3 (Nota Adhesiva Amarilla): `transform: rotate(2.5deg);`
   - En estado activo / hover sobre el contenedor (`.heroVignetteContainer:hover`, `:focus-within`):
     - Capa 1: se asienta con mayor estabilidad `transform: rotate(-2.8deg) translate(-6px, 2px);`
     - Capa 2: se abre hacia la derecha `transform: rotate(2.2deg) translate(8px, -4px);`
     - Capa 3: se eleva ligeramente hacia adelante `transform: rotate(4.8deg) translate(14px, -8px);`
   - **Curva y sensación de papel**:
     - `transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.35s ease;`
     - Incremento sutil de sombra direccional suave que evoca profundidad física tridimensional.

2. **Brillo Especular en Clips Metálicos**:
   - Los clips de latón dorado (`.binderClip`, `.paperClipBrass`, `.brassClip`) poseen un pseudoelemento de brillo que recorre sutilmente la superficie metálica en hover, simulando reflejo de luz de escritorio.

3. **Soporte Táctil Móvil**:
   - En pantallas móviles (≤768px), las capas se ordenan verticalmente sin rotaciones agresivas que causen desbordamiento horizontal (`overflow-x`), manteniendo legibilidad absoluta.

---

## 3. Paleta de Color y Tokens Visuales

| Elemento | Token / Valor | Rol |
|---|---|---|
| Tinta Estilográfica Principal | `#7B188E` (`var(--color-primary)`) | Trazo animado de pluma y acento de foco |
| Tinta Estilográfica Acento | `#9426A8` | Reflejo central del trazo de tinta fresca |
| Papel Washi / Arroz | `#faf9f5` (`var(--color-canvas)`) | Fondo de pliego A4 |
| Latón Envejecido | `linear-gradient(135deg, #d4af37, #aa820a, #f3e5ab)` | Clips de sujeción física |
| Carbón Sumi Atenuado | `#6c6a64` (`var(--color-muted)`) | Texto de tarea completada bajo el trazo |

---

## 4. Criterios de Aceptación (Verificación)

1. **Tachado de Tarea**: Al marcar una casilla en la lista de prioridades de la Mesa de Trabajo, el texto de la tarea recibe la clase de pluma estilográfica y renderiza el trazo con color violeta imperial.
2. **Desmarcado Limpio**: Al desmarcar la tarea, la clase de trazo se remueve inmediatamente y el texto vuelve a su color activo.
3. **Actualización de Porcentaje**: Al marcar tareas, el badge de serenidad y el indicador circular reflejan el incremento porcentual y actualizan el contador `{completedCount} de 3`.
4. **Anuncio Accesible**: El contenedor del porcentaje tiene atributos `aria-live="polite"` y `role="status"`.
5. **Abanicado en Hero**: Al pasar el ratón o activar `:focus-within` sobre `LandingHeroCard`, las capas aplican las transformaciones de apertura de abanico.
6. **Movimiento Reducido**: Con `prefers-reduced-motion: reduce`, no existen transiciones de rotación ni trazado progresivo; el estado es inmediato.
7. **Suite de Pruebas**: Todos los tests existentes en `LandingDeskPreview.test.tsx`, `LandingHeroCard.test.tsx` y `LandingView.test.tsx` permanecen en verde, junto con los nuevos tests que validan las micro-interacciones.
