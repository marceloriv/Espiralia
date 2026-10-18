# Modal de Ajustes de Perfil con Efecto de Papel Rasgado Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar el modal de «Ajustes de Perfil & PIN» (`ProfileSettingsModal`) en una hoja de papel rasgado artesanal auténtica (*Warm Editorial Papercraft*), con bordes rasgados irregulares (`clip-path`), sombra perimetral táctil (`drop-shadow`), cinta washi tape decorativa en la cabecera y textura de cuaderno editorial marfil.

**Architecture:** Modificar `ProfileSettingsModal.module.css` para aplicar un polígono de rasgado orgánico (`clip-path`) con micro-dientes de rotura irregular y un contenedor envolvente (`.modalWrap`) con `filter: drop-shadow` que calca la silueta rasgada. Enriquecer `ProfileSettingsModal.tsx` con la cinta adhesiva (*washi tape*) magenta y textura bujo sutil de fondo, manteniendo intactos todos los roles ARIA (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`), el foco de teclado accesible y el aislamiento de datos.

**Tech Stack:** TypeScript 5.8, React 19.2, CSS Modules, Lucide React, Vitest 3.x, Testing Library React.

**Spec:** Requerimiento del usuario ("hacer que este elemento parezca un papel rasgado <div class=\"_modal_o71zs_25\" role=\"dialog\" ...>") y directrices de papelería física en `DESIGN.md` §1.1 y §5.C.

## Global Constraints

- Preservar al 100% la semántica accesible del diálogo: `role="dialog"`, `aria-modal="true"`, `aria-labelledby="profile-settings-modal-title"`.
- Utilizar exclusivamente tokens oficiales de diseño de `src/index.css` (cero tokens huérfanos sin fallback, según exige `src/tests/ui-a11y-tokens.test.tsx`).
- No alterar la lógica de negocio ni la firma de props de `ProfileSettingsModalProps` (`isOpen`, `onClose`, `profile`, `onProfileUpdated`).
- Los elementos puramente decorativos (washi tape, textura, fibras de papel) deben llevar `aria-hidden="true"` y `pointer-events: none` para no estorbar a lectores de pantalla ni interferir con clics.
- Commits en formato Conventional Commits con Gitmoji en español (`:art: style(perfiles): ...`, `:white_check_mark: test(perfiles): ...`).

## Review Focus

1. **Fidelidad visual del rasgado:** El borde superior e inferior debe lucir como una hoja arrancada manualmente de un cuaderno (dientes asimétricos con variación de 2px a 12px), no como un zig-zag mecánico repetitivo.
2. **Sombra perimetral fiel (`drop-shadow` vs `box-shadow`):** Dado que `clip-path` corta el `box-shadow` estándar, la sombra debe aplicarse en el contenedor padre `.modalWrap` mediante `filter: drop-shadow(...)` para que proyecte sombra sobre la forma exacta del papel rasgado.
3. **Cierre al pulsar fuera (Backdrop UX):** Hacer clic en el área oscura fuera de la hoja de papel rasgado debe cerrar el modal de manera consistente sin bloquear la interacción.
4. **Accesibilidad y contraste WCAG 2.2:** Todos los inputs (`Nuevo PIN`, `Confirmar nuevo PIN`, `PIN actual`) y botones (`Fijar PIN`, `Cerrar`) deben mantener sus áreas interactivas de al menos 44px y estados de foco visibles (`:focus-visible`).
5. **Verificación de build y tests:** Los tests unitarios existentes en `src/tests/ProfileSettingsModal.test.tsx` y `src/tests/ui-a11y-tokens.test.tsx` deben pasar al 100%, junto con la compilación de TypeScript (`pnpm build`).

---

### Task 1: Diseñar los estilos de papel rasgado, sombra perimetral y washi tape en `ProfileSettingsModal.module.css`

**Files:**
- Modify: `src/components/profile/ProfileSettingsModal.module.css:13-35`
- Test: `src/tests/ui-a11y-tokens.test.tsx`

**Interfaces:**
- Consumes: Tokens de `src/index.css` (`--bg-card`, `--color-surface-card`, `--color-hairline`, `--color-washi-primary`, `--color-grid-bujo`, `--color-primary`, `--color-ink`).
- Produces:
  - `.modalWrap`: Contenedor padre centrado con `filter: drop-shadow(...)` y animación de entrada orgánica con micro-inclinación (`rotate(-0.5deg)`).
  - `.washiTape`: Franja adhesiva superior semitransparente con textura rayada en `--color-washi-primary`, extremos rasgados y sombra leve.
  - `.modal`: Hoja con `clip-path: polygon(...)` de borde rasgado irregular, fondo marfil cálido `--bg-card` y trama bujo ultra sutil.
  - `.tornFiber`: Micro-resalte superior e inferior simulando la pulpa blanca expuesta del papel roto.

- [ ] **Step 1: Escribir el test que valida que `.modalWrap` y `.washiTape` están disponibles y sin tokens huérfanos**

Verificar en `src/tests/ui-a11y-tokens.test.tsx` que `ProfileSettingsModal.module.css` no contiene variables huérfanas y valida la presencia de las clases requeridas.

- [ ] **Step 2: Ejecutar el test para comprobar la línea base**

Run: `pnpm exec vitest run src/tests/ui-a11y-tokens.test.tsx`
Expected: PASS

- [ ] **Step 3: Implementar los estilos en `src/components/profile/ProfileSettingsModal.module.css`**

Actualizar `.modal` y agregar `.modalWrap` y `.washiTape`:

```css
.modalWrap {
  position: relative;
  width: 100%;
  max-width: 480px;
  filter: drop-shadow(0 14px 28px rgba(26, 25, 23, 0.16))
          drop-shadow(0 3px 6px rgba(26, 25, 23, 0.10));
  animation: modalEnter 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.washiTape {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%) rotate(-1.5deg);
  width: 120px;
  height: 24px;
  background: repeating-linear-gradient(
    -45deg,
    var(--color-washi-primary, rgba(142, 30, 162, 0.18)),
    var(--color-washi-primary, rgba(142, 30, 162, 0.18)) 6px,
    rgba(237, 150, 215, 0.25) 6px,
    rgba(237, 150, 215, 0.25) 12px
  );
  border-left: 2px dashed rgba(142, 30, 162, 0.3);
  border-right: 2px dashed rgba(142, 30, 162, 0.3);
  border-radius: 2px;
  box-shadow: 0 1px 3px rgba(26, 25, 23, 0.12);
  pointer-events: none;
  z-index: 10;
}

.modal {
  width: 100%;
  background-color: var(--bg-card, #fcf9f6);
  background-image: radial-gradient(var(--color-grid-bujo, #dfd8cc) 0.65px, transparent 0.65px);
  background-size: 18px 18px;
  /* Polígono rasgado asimétrico: dientes irregulares arriba y abajo, borde suave con micro-mordidas en laterales */
  clip-path: polygon(
    0% 12px, 3% 6px, 6% 13px, 9% 7px, 13% 14px, 17% 8px, 21% 13px, 25% 6px,
    29% 14px, 34% 7px, 38% 12px, 42% 6px, 47% 13px, 51% 7px, 56% 14px, 60% 8px,
    65% 13px, 69% 6px, 74% 14px, 78% 7px, 83% 13px, 87% 6px, 91% 14px, 95% 8px,
    98% 12px, 100% 7px,
    100% calc(100% - 10px), 98% calc(100% - 4px), 95% calc(100% - 11px), 91% calc(100% - 5px),
    87% calc(100% - 12px), 82% calc(100% - 6px), 78% calc(100% - 13px), 73% calc(100% - 5px),
    69% calc(100% - 11px), 64% calc(100% - 4px), 59% calc(100% - 12px), 55% calc(100% - 6px),
    50% calc(100% - 13px), 46% calc(100% - 5px), 41% calc(100% - 12px), 36% calc(100% - 4px),
    31% calc(100% - 11px), 27% calc(100% - 5px), 22% calc(100% - 12px), 18% calc(100% - 6px),
    13% calc(100% - 13px), 9% calc(100% - 5px), 5% calc(100% - 11px), 2% calc(100% - 4px),
    0% calc(100% - 9px)
  );
  display: flex;
  flex-direction: column;
  padding-top: 8px;
  padding-bottom: 12px;
  transform: rotate(-0.4deg);
}

@keyframes modalEnter {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px) rotate(-1.5deg);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0) rotate(0deg);
  }
}
```

- [ ] **Step 4: Comprobar que los tokens del CSS sean válidos y los tests pasen**

Run: `pnpm exec vitest run src/tests/ui-a11y-tokens.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit de los estilos**

```bash
git add src/components/profile/ProfileSettingsModal.module.css
git commit -m ":art: style(perfiles): agregar estilos de papel rasgado y washi tape a modal de ajustes"
```

---

### Task 2: Integrar el contenedor envolvente y la cinta washi tape en `ProfileSettingsModal.tsx`

**Files:**
- Modify: `src/components/profile/ProfileSettingsModal.tsx:111-137`
- Test: `src/tests/ProfileSettingsModal.test.tsx`

**Interfaces:**
- Consumes: `styles.modalWrap`, `styles.washiTape`, `styles.modal`
- Produces: Elemento modal enriquecido con estructura papercraft:
  - `<div className={styles.modalWrap}>`: Recibe la sombra `drop-shadow` perimetral
  - `<div className={styles.washiTape} aria-hidden="true" />`: Franja decorativa
  - `<div className={styles.modal} role="dialog" ...>`: Hoja de papel rasgado con borde jagged

- [ ] **Step 1: Escribir el test que verifica la presencia del papel rasgado y washi tape**

Agregar caso en `src/tests/ProfileSettingsModal.test.tsx`:
```tsx
it('renderiza el modal envuelto en contenedor de papel rasgado con cinta washi tape decorativa', () => {
  render(
    <ProfileSettingsModal
      isOpen={true}
      onClose={vi.fn()}
      profile={baseProfile}
      onProfileUpdated={vi.fn()}
    />
  );

  const dialog = screen.getByRole('dialog');
  expect(dialog).toBeInTheDocument();

  // El elemento padre o contenedor contiene la cinta washi tape decorativa
  const modalWrap = dialog.closest('div[class*="modalWrap"]');
  expect(modalWrap).toBeInTheDocument();

  const washiTape = modalWrap?.querySelector('div[class*="washiTape"]');
  expect(washiTape).toBeInTheDocument();
  expect(washiTape).toHaveAttribute('aria-hidden', 'true');
});
```

- [ ] **Step 2: Ejecutar el test para verificar que falla**

Run: `pnpm exec vitest run src/tests/ProfileSettingsModal.test.tsx`
Expected: FAIL indicando que `modalWrap` o `washiTape` no están presentes aún.

- [ ] **Step 3: Actualizar el JSX en `src/components/profile/ProfileSettingsModal.tsx`**

Integrar `.modalWrap` y `.washiTape` manteniendo la captura de clics en backdrop:

```tsx
  return (
    <div
      className={styles.backdrop}
      role="presentation"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className={styles.modalWrap}
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        {/* Franja decorativa de washi tape magenta */}
        <div className={styles.washiTape} aria-hidden="true" />

        <div
          className={styles.modal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-settings-modal-title"
        >
          {/* Header, Title, CloseBtn, Body intactos */}
```

- [ ] **Step 4: Ejecutar los tests de `ProfileSettingsModal` para verificar que pasan**

Run: `pnpm exec vitest run src/tests/ProfileSettingsModal.test.tsx`
Expected: PASS (todos los 5 tests en verde)

- [ ] **Step 5: Commit de la integración en JSX**

```bash
git add src/components/profile/ProfileSettingsModal.tsx src/tests/ProfileSettingsModal.test.tsx
git commit -m ":sparkles: feat(perfiles): envolver modal en pliego de papel rasgado con washi tape"
```

---

### Task 3: Verificación visual, pruebas de interacción de borde y build de producción

**Files:**
- Test: `src/tests/ProfileSettingsModal.test.tsx`
- Test: `src/tests/ui-a11y-tokens.test.tsx`

**Interfaces:**
- Consumes: Todo el módulo `ProfileSettingsModal`
- Produces: Suite completa de pruebas en verde y build de producción limpio

- [ ] **Step 1: Escribir prueba de interacción de cierre al pulsar fuera de la hoja de papel**

Verificar en `src/tests/ProfileSettingsModal.test.tsx` que pulsar en el `backdrop` exterior cierra la ventana:
```tsx
it('cierra el modal cuando el usuario hace clic fuera de la hoja de papel rasgado (backdrop)', async () => {
  const onClose = vi.fn();
  const user = userEvent.setup();

  const { container } = render(
    <ProfileSettingsModal
      isOpen={true}
      onClose={onClose}
      profile={baseProfile}
      onProfileUpdated={vi.fn()}
    />
  );

  const backdrop = container.querySelector('div[class*="backdrop"]');
  expect(backdrop).toBeInTheDocument();
  if (backdrop) {
    await user.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  }
});
```

- [ ] **Step 2: Ejecutar los tests unitarios completos de `ProfileSettingsModal`**

Run: `pnpm exec vitest run src/tests/ProfileSettingsModal.test.tsx`
Expected: PASS (6/6 tests en verde)

- [ ] **Step 3: Ejecutar auditoría de tokens y accesibilidad**

Run: `pnpm exec vitest run src/tests/ui-a11y-tokens.test.tsx`
Expected: PASS (todos los tests en verde)

- [ ] **Step 4: Ejecutar validación de compilación de producción TypeScript + Vite**

Run: `pnpm build`
Expected: PASS (código de salida 0, sin errores de tipos ni warnings de bundle)

- [ ] **Step 5: Commit final de verificación**

```bash
git add src/tests/ProfileSettingsModal.test.tsx
git commit -m ":white_check_mark: test(perfiles): validar cierre por backdrop y elementos de papel rasgado"
```
