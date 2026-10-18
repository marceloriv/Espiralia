# Espiralia — Especificación: Teclado Físico y Feedback Táctil en Login (ProfileGate)

**Fecha:** 2026-10-18  
**Componente:** `src/components/ProfileGateView.tsx`  
**Estado:** Propuesto para implementación  

---

## 1. Visión y Propósito

En la pantalla de desbloqueo y selector de perfiles (`ProfileGateView`), el usuario interactúa con la metáfora de un candado de combinación cilíndrica y un teclado numérico táctil de latón sobre pliego papercraft. 

Para ofrecer una experiencia de tipeo natural y altamente responsiva tanto en ordenadores de sobremesa como en portátiles, la interfaz debe capturar directamente las pulsaciones del teclado físico, restringir estrictamente la entrada a caracteres numéricos (descartando letras y símbolos) y proporcionar **retroalimentación táctil visual inmediata**: cada número pulsado en el teclado físico debe iluminar y presionar visiblemente el botón correspondiente en la cuadrícula en pantalla (`keypadBtn`), emulando la física de una calculadora mecánica o cerradura de combinación.

---

## 2. Requisitos Funcionales

### 2.1 Restricción Estricta a Dígitos Numéricos (`0`-`9`)
1. **Entrada por Teclado Físico (`window.onkeydown`)**:
   - Solo se procesan las teclas del `'0'` al `'9'` (incluyendo teclado numérico estándar y teclado numérico auxiliar `Numpad0`-`Numpad9`).
   - Cualquier tecla alfabética (`a-z`, `A-Z`), símbolos (`!`, `@`, `#`, `.`, `,`, `/`, etc.) y la barra espaciadora (`Space`) deben ser bloqueadas e ignoradas completamente.
   - Longitud máxima del PIN: 6 dígitos (definida por la constante `PIN_PATTERN`). Una vez alcanzados 6 dígitos, no se aceptan más dígitos adicionales.
2. **Teclas de Control Permitidas**:
   - `Backspace`: elimina el último dígito del PIN actual (`pinInput.slice(0, -1)`).
   - `Enter`: ejecuta la verificación del PIN (`handleVerifyPin`).
   - `Escape`: si hay un modal abierto o dígitos ingresados, cancela o limpia el PIN actual.
   - Teclas de navegación accesibles (`Tab`, `Shift`, `Alt`, `Control`, `Meta`, flechas direccionales): no alteran el PIN ni producen efectos colaterales.
3. **Aislamiento de Foco**:
   - Si el foco activo del navegador está dentro de un campo de texto no relacionado (como el `<input id="create-profile-name">` del modal de creación de perfil), el listener global de teclado debe abstenerse de capturar teclas para permitir que el usuario escriba su nombre libremente.
4. **Sanitización en Campos de Entrada (`<input>`)**:
   - En el campo de PIN del modal de acceso (`#verify-pin-input`) y en el de creación (`#create-profile-pin`), el evento `onChange` filtra de inmediato cualquier carácter no numérico (`value.replace(/\D/g, '')`).

### 2.2 Retroalimentación Visual Táctil en Botones en Pantalla
1. **Pulsación Activa (`keypadBtnPressed`)**:
   - Al recibir un evento `keydown` válido (`0`-`9`, `Backspace`, `Enter`):
     - El componente activa el estado `activeKey` con el identificador de la tecla presionada.
     - El botón correspondiente en el teclado táctil 3x4 (`keypadGrid`) recibe la clase CSS `.keypadBtnPressed` (o `.keypadSubmitPressed` para el botón de confirmar `➔`).
   - **Estilo visual de pulsación (Papercraft / Latón)**:
     - `transform: translateY(1.5px) scale(0.96);`
     - Sombra de profundidad interior: `inset 1px 1px 2px rgba(40, 30, 15, 0.25);`
     - Tono de fondo hundido: `#ede3d2` (o tonalidad más profunda para submit).
2. **Liberación de Tecla (`keyup`)**:
   - Al producirse `keyup`, `activeKey` vuelve a `null`.
   - Para prevenir estados pegados en pulsaciones ultrarrápidas o pérdidas de foco de ventana, se incluye un temporizador de seguridad de 160ms que limpia `activeKey`.

### 2.3 Correspondencia de Teclas Físicas a Botones en Pantalla
| Tecla Física | Acción en `pinInput` | Botón en Pantalla que Reacciona |
|---|---|---|
| `0` .. `9` / `Numpad0` .. `Numpad9` | Agrega dígito al final (máximo 6 dígitos) | Botón `'0'` .. `'9'` (`keypadBtn`) |
| `Backspace` | Borra el último dígito | Botón `'⌫'` (`keypadBtn`) |
| `Enter` / `NumpadEnter` | Envía verificación (`handleVerifyPin`) | Botón `'➔'` (`keypadSubmit`) |
| Letras / Símbolos / Espacio | Descartado sin acción | Ninguno |

### 2.4 Selección Automática y Vinculación de Perfil
1. Si existe un perfil en el sistema protegido por PIN y no hay perfil seleccionado aún, se asocia automáticamente como objetivo del panel de PIN derecho para que el usuario pueda escribir de inmediato.
2. Al hacer clic en un perfil protegido de la lista izquierda, se resalta como activo y se enfoca el flujo de desbloqueo.

---

## 3. Accesibilidad (a11y) y Estándares WCAG 2.2
1. **Atributos ARIA**:
   - Las cajas de dígitos del candado cilíndrico (`pinBoxes`) o el contenedor del PIN informan el recuento de dígitos mediante `aria-live="polite"` o `aria-label`.
   - Cada botón del teclado táctil conserva su `aria-label` descriptivo (`"Borrar dígito"`, `"Confirmar PIN"`).
2. **Soporte para Movimiento Reducido (`prefers-reduced-motion`)**:
   - La transición física de traslación (`transform: translateY(...)`) se deshabilita o simplifica si el usuario tiene activada la preferencia de reducción de movimiento en su sistema operativo.

---

## 4. Criterios de Aceptación (Verificación)
1. **Solo números**: Al presionar letras (`a`, `z`, `k`), espacios o signos en la página de login, no se agrega ningún carácter a las cajas de PIN.
2. **Pulsación reactiva de dígitos**: Al presionar `1`, el botón `1` en pantalla se hunde y cambia de sombra durante la pulsación, reflejando el número en la primera casilla de PIN.
3. **Pulsación reactiva de borrado**: Al presionar `Backspace`, se elimina el último dígito y el botón `⌫` en pantalla se hunde visualmente.
4. **Pulsación reactiva de envío**: Al presionar `Enter`, el botón `➔` se hunde y se dispara la comprobación criptográfica del PIN.
5. **No interferencia con creación de perfil**: Al abrir el modal de "Nuevo perfil", escribir texto en el campo "Nombre" no activa el teclado numérico de PIN.
6. **Tokens Antislop**: Los estilos CSS respetan rigurosamente las variables globales y no introducen sombras desalineadas con `0 Xpx Ypx`.
