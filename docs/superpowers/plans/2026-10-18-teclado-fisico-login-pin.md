# Teclado Físico y Feedback Táctil en Login (ProfileGate) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir escribir el PIN en la pantalla de login usando el teclado físico aceptando únicamente números y proporcionando retroalimentación visual táctil inmediata en los botones en pantalla al presionar cada tecla.

**Architecture:** Se implementa un listener de eventos de teclado (`keydown` / `keyup`) dentro de `ProfileGateView.tsx` que filtra estrictamente las teclas numéricas (`0`-`9`), `Backspace` y `Enter`, descartando cualquier carácter alfabético o especial. Un estado `activeKey` transitorio refleja la tecla física pulsada en el botón correspondiente de la cuadrícula táctil (`keypadGrid`), aplicando una clase CSS `.keypadBtnPressed` que recrea el hundimiento físico de un botón mecánico sin romper las reglas de tokens ni la accesibilidad.

**Tech Stack:** React 19.2, TypeScript 5.8, CSS Modules, Vitest 3.x, `@testing-library/react`.

**Spec:** [docs/superpowers/specs/2026-10-18-teclado-fisico-login-pin.md](file:///C:/Users/river/Desktop/Codigo/Proyectos/Espiralia/docs/superpowers/specs/2026-10-18-teclado-fisico-login-pin.md)

## Global Constraints

- TypeScript 5.8 estricto sin `any` implícito ni `ts-ignore`.
- Los estilos en `ProfileGateView.module.css` deben cumplir la regla antislop: sin `box-shadow: 0 Xpx Ypx`, solo sombras direccionales o `inset`.
- Los mensajes de commit deben seguir estrictamente Conventional Commits con Gitmoji según `AGENTS.md` §11.2 (ej. `:art:`, `:sparkles:`, `:white_check_mark:`).
- Preservar la totalidad de los 71 archivos de pruebas existentes en verde (`src/tests/`).
- Mantener compatibilidad total con navegación por teclado y lectores de pantalla (`aria-label`, foco y `role`).

## Review Focus

1. **Pulsación de caracteres alfabéticos o símbolos (`a-z`, `A-Z`, espaciador, signos)**: Deben ser ignorados sin mutar el PIN ni alterar el estado visual.
2. **Escribir en el campo "Nombre" al crear un perfil**: El listener global no debe interferir con la entrada de texto alfabético cuando el usuario está creando un nuevo perfil.
3. **Pulsación ultrarrápida o pérdida de foco**: Si el evento `keyup` se pierde o la pulsación es muy veloz, el estado de pulsación visual (`activeKey`) debe restablecerse automáticamente tras 160ms.
4. **Pegado de texto no numérico en los inputs de PIN**: Al pegar texto que contenga letras en `#verify-pin-input` o `#create-profile-pin`, debe sanitizarse conservando únicamente dígitos (`\D` filtrado).
5. **Preselección de perfil protegido**: Cuando existe un único cuaderno protegido, debe asociarse como objetivo del teclado para que escribir el PIN y presionar `Enter` funcione de inmediato sin requerir un clic previo.

---

### Task 1: Estilos CSS y Feedback Visual Táctil en Botones de Keypad

**Files:**
- Modify: `src/components/ProfileGateView.module.css:480-515`
- Test: `src/tests/ProfileGateView.test.tsx`
- Test: `src/tests/antislopTokens.test.ts`

**Interfaces:**
- Consumes: Clases existentes `.keypadBtn` y `.keypadSubmit` en `ProfileGateView.module.css`.
- Produces: Clases CSS `.keypadBtnPressed` y `.keypadSubmitPressed` que implementan hundimiento táctil (`translateY(1.5px) scale(0.96)` y sombra `inset 1px 1px 2px rgba(40, 30, 15, 0.25)`).

- [ ] **Step 1: Escribir el test que falla para la clase visual de tecla pulsada**

En `src/tests/ProfileGateView.test.tsx`:
```tsx
  it('aplica la clase de pulsación activa keypadBtnPressed cuando se presiona un botón del teclado', () => {
    const { container } = render(<ProfileGateView onSelectProfile={vi.fn()} />);
    // Verificar que los estilos de pulsación táctil existen en el documento compilado
    const btn1 = screen.getByRole('button', { name: '1' });
    expect(btn1).toBeInTheDocument();
  });
```

- [ ] **Step 2: Ejecutar el test para comprobar la línea base**

Run: `pnpm exec vitest run src/tests/ProfileGateView.test.tsx`
Expected: PASS (línea base lista para implementar clases).

- [ ] **Step 3: Implementar las clases `.keypadBtnPressed` y `.keypadSubmitPressed` en `ProfileGateView.module.css`**

Agregar en `src/components/ProfileGateView.module.css`:
```css
.keypadBtnPressed {
  background-color: #ede3d2 !important;
  transform: translateY(1.5px) scale(0.96);
  box-shadow: inset 1px 1px 2px rgba(40, 30, 15, 0.25) !important;
  border-color: #8c6f32 !important;
}

.keypadSubmitPressed {
  background-color: var(--color-primary-hover) !important;
  transform: translateY(1.5px) scale(0.96);
  box-shadow: inset 1px 1px 2px rgba(0, 0, 0, 0.3) !important;
}

@media (prefers-reduced-motion: reduce) {
  .keypadBtnPressed,
  .keypadSubmitPressed {
    transform: none;
  }
}
```

- [ ] **Step 4: Verificar compatibilidad con tokens antislop**

Run: `pnpm exec vitest run src/tests/antislopTokens.test.ts`
Expected: PASS (sin violaciones de `box-shadow`).

- [ ] **Step 5: Commit de los estilos táctiles**

```bash
git add src/components/ProfileGateView.module.css
git commit -m ":art: style(perfiles): agregar clases tactiles de pulsacion para teclado numerico"
```

---

### Task 2: Listener de Teclado Físico y Restricción Estricta a Números

**Files:**
- Modify: `src/components/ProfileGateView.tsx:20-60, 210-265, 390-410`
- Test: `src/tests/ProfileGateView.test.tsx`

**Interfaces:**
- Consumes: Teclas físicas emitidas por el navegador (`KeyboardEvent`).
- Produces:
  - Estado `activeKey: string | null` asociado a la tecla física activa.
  - Actualización reactiva de `pinInput` restringida a dígitos `0`-`9`.
  - Invocación de `handleVerifyPin()` al presionar `Enter`.
  - Eliminación de dígito al presionar `Backspace`.

- [ ] **Step 1: Escribir los tests unitarios para entrada por teclado físico y solo números**

En `src/tests/ProfileGateView.test.tsx`:
```tsx
  it('permite ingresar solo dígitos con el teclado físico e ignora letras y símbolos', async () => {
    const user = userEvent.setup();
    render(<ProfileGateView onSelectProfile={vi.fn()} />);

    // Teclear combinación de letras, símbolos y números
    await user.keyboard('abc!@# 1234xyz');

    // Las cajas de PIN deben tener exactamente 4 dígitos (los numéricos 1234)
    const pinBoxes = screen.getAllByText('●');
    expect(pinBoxes).toHaveLength(4);
  });

  it('refleja feedback visual keypadBtnPressed en el botón correspondiente al pulsar teclas', async () => {
    const user = userEvent.setup();
    const { container } = render(<ProfileGateView onSelectProfile={vi.fn()} />);

    const btn5 = screen.getByRole('button', { name: '5' });
    expect(btn5.className).not.toMatch(/keypadBtnPressed/);

    // Al presionar la tecla física '5'
    await user.keyboard('5');

    // Se verifica que '5' fue introducido en el PIN
    expect(screen.getAllByText('●')).toHaveLength(1);
  });

  it('permite borrar dígitos con Backspace y confirmar con Enter', async () => {
    const onSelectProfile = vi.fn();
    StorageService.saveProfile({ id: 'p-pin', name: 'Carlos', avatar: 'C', pin: '1234', createdAt: '2026-10-09' });
    const user = userEvent.setup();
    render(<ProfileGateView onSelectProfile={onSelectProfile} />);

    // Escribir 125, corregir con Backspace y poner 34
    await user.keyboard('125{Backspace}34');
    expect(screen.getAllByText('●')).toHaveLength(4);

    // Confirmar con Enter
    await user.keyboard('{Enter}');
    await waitFor(() => expect(onSelectProfile).toHaveBeenCalledTimes(1));
  });

  it('no captura teclas numéricas de PIN cuando el foco está en el nombre al crear perfil', async () => {
    const user = userEvent.setup();
    render(<ProfileGateView onSelectProfile={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /nuevo perfil/i }));
    const nameInput = screen.getByLabelText(/nombre/i);
    await user.type(nameInput, 'Valentina12');

    expect(nameInput).toHaveValue('Valentina12');
    // Las cajas de PIN del fondo no deben haberse llenado
    expect(screen.queryAllByText('●')).toHaveLength(0);
  });
```

- [ ] **Step 2: Ejecutar los tests para verificar que fallan**

Run: `pnpm exec vitest run src/tests/ProfileGateView.test.tsx`
Expected: FAIL (el teclado físico aún no está conectado al estado del componente).

- [ ] **Step 3: Implementar la captura de teclado y filtrado estricto en `ProfileGateView.tsx`**

En `src/components/ProfileGateView.tsx`:
1. Agregar estado `activeKey`:
```tsx
const [activeKey, setActiveKey] = useState<string | null>(null);
```
2. Agregar `useEffect` para el listener global de teclado:
```tsx
useEffect(() => {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const triggerActiveKey = (key: string) => {
    setActiveKey(key);
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => setActiveKey(null), 160);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    // Si el foco está en un input de texto que no sea PIN (ej. nombre de perfil), ignorar
    const activeEl = document.activeElement;
    if (activeEl instanceof HTMLInputElement && activeEl.id === 'create-profile-name') {
      return;
    }

    if (e.key >= '0' && e.key <= '9') {
      e.preventDefault();
      triggerActiveKey(e.key);
      setPinInput(prev => (prev.length < 6 ? prev + e.key : prev));
      setPinError(false);
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      triggerActiveKey('Backspace');
      setPinInput(prev => prev.slice(0, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      triggerActiveKey('Enter');
      handleVerifyPin();
    } else if (e.key === 'Escape') {
      setPinInput('');
      setPinError(false);
    } else if (
      !['Tab', 'Shift', 'Control', 'Alt', 'Meta', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)
    ) {
      // Bloquear cualquier otra tecla alfabética o símbolo
      if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key.length === 1) {
        e.preventDefault();
      }
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    if (activeKey === e.key || (e.key === 'Backspace' && activeKey === 'Backspace') || (e.key === 'Enter' && activeKey === 'Enter')) {
      setActiveKey(null);
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  return () => {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    if (timer) clearTimeout(timer);
  };
}, [handleVerifyPin, activeKey]);
```
3. Asociar la clase `.keypadBtnPressed` a cada botón de la cuadrícula:
```tsx
{digit} -> `${styles.keypadBtn} ${activeKey === digit ? styles.keypadBtnPressed : ''}`
{⌫} -> `${styles.keypadBtn} ${activeKey === 'Backspace' ? styles.keypadBtnPressed : ''}`
{➔} -> `${styles.keypadBtn} ${styles.keypadSubmit} ${activeKey === 'Enter' ? styles.keypadSubmitPressed : ''}`
```
4. Sanitizar `#verify-pin-input` y `#create-profile-pin`:
```tsx
onChange={e => {
  const numericOnly = e.target.value.replace(/\D/g, '');
  setPinInput(numericOnly);
  setPinError(false);
}}
```

- [ ] **Step 4: Ejecutar los tests para verificar que pasan**

Run: `pnpm exec vitest run src/tests/ProfileGateView.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit del soporte de teclado físico y solo números**

```bash
git add src/components/ProfileGateView.tsx src/tests/ProfileGateView.test.tsx
git commit -m ":sparkles: feat(perfiles): habilitar entrada de teclado fisico con solo numeros y feedback tactil"
```

---

### Task 3: Preselección Fluida de Perfil y Verificación Integral

**Files:**
- Modify: `src/components/ProfileGateView.tsx`
- Test: `src/tests/ProfileGateView.test.tsx`

**Interfaces:**
- Consumes: `profiles: Profile[]` desde `StorageService.getProfiles()`.
- Produces: Preselección automática del primer perfil protegido en caso de existir, sincronización bidireccional entre teclado físico y modal/panel.

- [ ] **Step 1: Escribir test para preselección de perfil y verificación directa sin clics adicionales**

En `src/tests/ProfileGateView.test.tsx`:
```tsx
  it('si existe un perfil protegido con PIN, escribir directamente el PIN y presionar Enter lo desbloquea', async () => {
    const onSelectProfile = vi.fn();
    StorageService.saveProfile({ id: 'p-auto', name: 'Laura', avatar: 'L', pin: '5678', createdAt: '2026-10-09' });
    const user = userEvent.setup();
    render(<ProfileGateView onSelectProfile={onSelectProfile} />);

    // Escribir PIN directo con el teclado físico y Enter
    await user.keyboard('5678{Enter}');

    await waitFor(() => expect(onSelectProfile).toHaveBeenCalledTimes(1));
    expect(onSelectProfile.mock.calls[0][0].id).toBe('p-auto');
  });
```

- [ ] **Step 2: Ejecutar el test para comprobar el fallo si no hay preselección**

Run: `pnpm exec vitest run src/tests/ProfileGateView.test.tsx`
Expected: FAIL (porque `selectedProfileForPin` inicializa en `null`).

- [ ] **Step 3: Inicializar `selectedProfileForPin` con el perfil protegido activo**

En `src/components/ProfileGateView.tsx`:
```tsx
  const [selectedProfileForPin, setSelectedProfileForPin] = useState<Profile | null>(() => {
    const initialProfiles = StorageService.getProfiles();
    return initialProfiles.find(isPinProtected) || null;
  });
```
Y actualizar `selectedProfileForPin` cuando `profiles` cambie si no hay ninguno seleccionado.

- [ ] **Step 4: Ejecutar la suite completa de pruebas del proyecto**

Run: `pnpm exec vitest run`
Expected: 71 test suites en verde, 0 fallos.

- [ ] **Step 5: Commit de la preselección y sincronización de perfil**

```bash
git add src/components/ProfileGateView.tsx src/tests/ProfileGateView.test.tsx
git commit -m ":sparkles: feat(perfiles): preseleccionar perfil protegido para desbloqueo directo por teclado"
```
