# Espiralia — Especificación de Diseño: Página de Inicio de Alto Impacto (Stitch)

**Fecha:** 2026-10-16  
**Origen:** Pantalla Stitch `projects/2198597521553671013/screens/b96b1520d8d5487bac12a2f22fd98b78` (*"Espiralia — Página de Inicio de Alto Impacto"*, etiqueta *"Inicio"*)  
**Estado:** Aprobado para implementación  

---

## 1. Visión y Propósito

La **Página de Inicio** de Espiralia es una portada editorial de alto impacto visual y conceptual que presenta el valor diferencial de la aplicación: una herramienta de productividad y contemplación personal 100% cliente, privada, sin servidores remotos ni telemetría invasiva, estructurada en torno a la metáfora de un cuaderno físico de tapas duras y papel cálido.

La página cumple tres roles:
1. **Presentación de identidad**: Transmite la filosofía editorial de Espiralia (basada en los tokens de `DESIGN.md`, tipografía Newsreader/Inter y canvas cálido `#faf9f5`).
2. **Demostración viva del producto**: Muestra una mesa de trabajo en 3 columnas representativa del sistema real (Proceso Terapéutico, Ritmo Semanal con gráfico circular, y Tareas Prioritarias de Clase B y Universidad).
3. **Punto de entrada accesible**: Facilita el acceso inmediato a la bóveda local mediante botones de acción hacia el selector de perfiles (`/login`) o navegación directa a la aplicación.

---

## 2. Secciones de la Portada

### 2.1 Top App Bar (Header Editorial)
- **Marca**: Logotipo con tipografía display `Espiralia` + sello editorial *"Edición Cuaderno 2026"*.
- **Indicador de Bóveda Local**: Píldora con indicador visual verde pulsante (*"Bóveda Local"*), certificando ejecución 100% desconectada y segura.
- **Navegación Desktop**: Enlaces ancla a secciones: *Manifiesto*, *Cuaderno*, *Ritmos*, *Metodología*.
- **Acciones**: Botón secundario *"Acceder"* y CTA principal con gradiente cálido *"Comenzar Cuaderno"* (ambos enlazan a `/login` o `/dashboard`).

### 2.2 Hero Section (Impacto & Aforismo)
- **Insignia superior**: *"El Santuario de tu Orden Cotidiano"*.
- **Titular Display**: *"Tu caos mental transformado en arte cotidiano."* (con serif itálica destacada).
- **Subtítulo**: Explicación de la disciplina amable y soberanía de datos.
- **Acciones principales**:
  - `Abrir Cuaderno Personal`: botón primario con icono de pluma/estilo.
  - `Explorar sin registro`: botón secundario que desliza suavemente hacia los pilares del sistema.
- **Tarjeta del Aforismo**:
  - Aforismo oficial: *“El orden no es una restricción fría, es el espacio fértil donde florecen tus mejores ideas y tu calma más honda.”*
  - Metadatos: *"Cuaderno de Hoy • 09:15 AM"*, autoría *"Cuaderno Espiralia"*, etiqueta *"Inspiración Matutina"*.

### 2.3 Showcase Visual: La Mesa de Trabajo Viva (Mockup Editorial en 3 Columnas)
Representa un cuaderno abierto sobre escritorio con separador central:
1. **Columna Izquierda (Introspección)**: Ficha de proceso terapéutico (Sesión #14, hallazgo de Licencia Clase B, 420 palabras, estado "Guardado localmente").
2. **Columna Central (Ritmo Semanal)**: Widget circular SVG con 84% de cumplimiento, leyenda de áreas y tira interactiva de días lunes a domingo.
3. **Columna Derecha (Acción Inmediata)**: Lista de tareas prioritarias (Examen teórico Clase B con 33/35, Postulación Universidad 2026, Práctica en circuito cerrado, atajo visual `⌘N`).

### 2.4 Tres Pilares de Enfoque (Arquitectura de Vida)
Tarjetas tipo bento con iconografía y barras de avance:
1. **01. Estudios & Foco Práctico**: Preparación Licencia Clase B, simuladores CONASET (92% de éxito).
2. **02. Introspección & Diario**: Escritura terapéutica y registro de bienestar sin límites de caracteres.
3. **03. Horizonte & Universidad**: Postulaciones 2026, repositorio de certificaciones y expediente (6 de 8 documentos).

### 2.5 Brújula Interior Inmediata (Widget Interactivo de Intenciones)
Widget dinámico que permite elegir la energía del día con respuesta inmediata:
- **Opciones**: *Calma mental*, *Foco implacable*, *Claridad de metas*, *Gratitud & Reflexión*.
- **Panel de salida**:
  - Cita inspiradora contextual.
  - Subtítulo de recomendación.
  - Plan guiado de 3 pasos numerados (`01. Pausa`, `02. Descarga`, `03. Un solo paso`).

### 2.6 Métricas de Soberanía Digital & Local-First
- **100% Client-Side & Privado**: Sin servidores remotos ni procesamiento en nube.
- **0 Telemetría Externa**: Sin trackers, analíticas ni venta de atención.
- **Persistencia Perpetua**: Motor IndexedDB local con exportación en JSON y Markdown.

### 2.7 Manifiesto Banner & Footer
- **Manifiesto**: Tarjeta contrastada en tono oscuro (`surface-dark`) con la frase: *“Tu tiempo no es un recurso corporativo para exprimir; es el lienzo de tu existencia.”*
- **Footer**: Copyright de Espiralia, enlaces a filosofía local-first, privacidad y contacto.

---

## 3. Integración en el Stack Técnico

- **Tecnología**: React 19 + TypeScript + CSS Modules (`LandingView.module.css`).
- **Iconografía**: Lucide React (`Sparkles`, `Car`, `BookOpen`, `GraduationCap`, `CheckCircle2`, `Lock`, `EyeOff`, `Database`, `Feather`, `Calendar`, etc.). Sin dependencias de fuentes externas pesadas en runtime.
- **Tipografía y Tokens**: Consumo de variables oficiales de `src/index.css` (`--color-primary`, `--color-canvas`, `--font-primary`, `--font-family-2`, `--font-family-3`).
- **Enrutamiento**:
  - Ruta pública `/inicio` (y renderizado condicional en `/` cuando no hay perfil autenticado).
  - Botón de acceso directo en `ProfileGateView` (*"Conoce más sobre Espiralia"*) para regresar a la landing.
- **Accesibilidad**:
  - Cumplimiento estricto WCAG 2.2 AA.
  - Atributos `aria-pressed` en los botones de intención.
  - Navegación completa por teclado con indicadores de foco visibles.

---

## 4. Criterios de Aceptación

1. La ruta `/inicio` renderiza la totalidad de las 7 secciones descritas sin errores de consola.
2. El widget de intención reacciona instantáneamente a clics y teclado actualizando la cita y los 3 pasos.
3. Todos los botones de acción principal navegan adecuadamente hacia `/login` (o `/dashboard` si ya hay sesión).
4. El diseño es 100% responsivo (escritorio, tablet y teléfono móvil sin desbordes horizontales).
5. La suite de pruebas de regresión se mantiene en 100% verde con pruebas unitarias para `LandingView`.
