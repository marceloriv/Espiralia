# Modal de Bóveda Offline con Efecto de Papel Rasgado Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar el modal de «Bóveda Offline» (`VaultModal`) en una hoja de papel rasgado artesanal auténtica (*Warm Editorial Papercraft*), con silueta rasgada superior e inferior (`clip-path`), sombra perimetral física (`drop-shadow`), cinta washi tape decorativa en la cabecera y textura de cuaderno editorial marfil.

**Architecture:** Modificar `VaultModal.module.css` para aplicar un polígono de rasgado asimétrico (`clip-path`) en `.modalBox` y un contenedor envolvente (`.modalWrap`) con `filter: drop-shadow` perimetral. Enriquecer `VaultModal.tsx` incorporando la cinta adhesiva (*washi tape*) magenta en la cabecera del pliego, manteniendo intactos los roles ARIA (`role="dialog"`, `aria-modal="true"`, `aria-labelledby="vault-modal-title"`), el rol `tablist` de pestañas, el cierre por backdrop y la compatibilidad con scroll interior.

**Tech Stack:** TypeScript 5.8, React 19.2, CSS Modules, Lucide React, Vitest 3.x, Testing Library React.

**Spec:** Requerimiento del usuario ("hacer lo mismo con el elemento de <div class=\"_modalBox_1axyr_25\" role=\"dialog\" ...>") y directrices de papelería física en `DESIGN.md` §1.1 y §5.C.

## Global Constraints

- Preservar al 100% la accesibilidad del diálogo: `role="dialog"`, `aria-modal="true"`, `aria-labelledby="vault-modal-title"`.
- Utilizar exclusivamente tokens oficiales de diseño de `src/index.css` (`--bg-card`, `--color-surface-card`, `--color-hairline`, `--color-washi-primary`, `--color-grid-bujo`, `--color-primary`, `--color-ink`).
- Mantener intactas las props de `VaultModalProps` (`isOpen`, `onClose`, `profile`).
- Elementos puramente decorativos (washi tape, textura) deben llevar `aria-hidden="true"` y `pointer-events: none`.
- Commits en formato Conventional Commits con Gitmoji en español (`:art: style(boveda): ...`, `:sparkles: feat(boveda): ...`, `:white_check_mark: test(boveda): ...`).

## Review Focus

1. **Fidelidad estética del rasgado:** El borde superior e inferior de `.modalBox` debe presentar dientes irregulares asimétricos simulando una hoja arrancada de un talonario o cuaderno de notas.
2. **Sombra perimetral (`drop-shadow` en `.modalWrap`):** Como `clip-path` recorta el `box-shadow` tradicional, la sombra se proyecta desde `.modalWrap` con `filter: drop-shadow(...)` calcando el contorno rasgado.
3. **Scrollbar y desbordamiento:** La silueta rasgada debe mantener los bordes laterales limpios para que el scroll vertical (`max-height: 90vh; overflow-y: auto;`) funcione con fluidez y sin recortar barras de desplazamiento.
4. **Interacción con pestañas e inputs:** Las pestañas «Exportar Respaldo» y «Restaurar / Importar», checkboxes, campos de contraseña y botones deben mantener sus tamaños táctiles de al menos 44px y estados `:focus-visible`.
5. **Cierre de modal y tests:** Clic en el overlay exterior debe cerrar el modal (`onClose`), mientras que clics dentro del pliego deben evitar propagarse (`stopPropagation`). La suite de tests y el build deben quedar en verde.

---

### Task 1: Diseñar los estilos de papel rasgado, sombra táctil y washi tape en `VaultModal.module.css`

**Files:**
- Modify: `src/components/vault/VaultModal.module.css:1-40`
- Test: `src/tests/ui-a11y-tokens.test.tsx`

**Interfaces:**
- Consumes: Tokens de `src/index.css` (`--bg-card`, `--color-surface`, `--color-hairline`, `--color-washi-primary`, `--color-grid-bujo`, `--color-ink`).
- Produces:
  - `.modalWrap`: Contenedor centrado con `filter: drop-shadow(...)` y animación de entrada orgánica.
  - `.washiTape`: Cinta adhesiva superior semitransparente magenta con extremos rasgados.
  - `.modalBox`: Pliego de papel rasgado con `clip-path: polygon(...)`, fondo marfil cálido `--bg-card` y textura de puntos bujo.

- [ ] **Step 1: Verificar el test de tokens en `ui-a11y-tokens.test.tsx`**

Asegurar que no existan variables huérfanas en los estilos de modales.

- [ ] **Step 2: Ejecutar los tests de tokens como línea base**

Run: `pnpm exec vitest run src/tests/ui-a11y-tokens.test.tsx`
Expected: PASS

- [ ] **Step 3: Implementar los estilos en `src/components/vault/VaultModal.module.css`**

Actualizar `.modalBox` y agregar `.modalWrap` y `.washiTape`:

```css
.modalOverlay {
  position: fixed;
  inset: 0;
  background: rgba(20, 20, 19, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 50;
  backdrop-filter: blur(2px);
}

.modalWrap {
  position: relative;
  width: 100%;
  max-width: 540px;
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

.modalBox {
  background-color: var(--bg-card, #fcf9f6);
  background-image: radial-gradient(var(--color-grid-bujo, #dfd8cc) 0.65px, transparent 0.65px);
  background-size: 18px 18px;
  /* Polígono rasgado asimétrico: dientes irregulares arriba y abajo, laterales limpios */
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
  padding: 1.5rem 1.5rem 1.75rem;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  transform: rotate(-0.3deg);
  display: flex;
  flex-direction: column;
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

- [ ] **Step 4: Comprobar la validez del CSS**

Run: `pnpm exec vitest run src/tests/ui-a11y-tokens.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit de los estilos de bóveda**

```bash
git add src/components/vault/VaultModal.module.css
git commit -m ":art: style(boveda): agregar estilos de papel rasgado y washi tape a modal de boveda"
```

---

### Task 2: Integrar el contenedor envolvente y la cinta washi tape en `VaultModal.tsx`

**Files:**
- Modify: `src/components/vault/VaultModal.tsx:163-172, 400-403`
- Test: `src/tests/VaultModal.test.tsx`

**Interfaces:**
- Consumes: `styles.modalWrap`, `styles.washiTape`, `styles.modalBox`
- Produces: Estructura papercraft de bóveda:
  - `<div className={styles.modalWrap}>`: Contenedor padre con sombra
  - `<div className={styles.washiTape} aria-hidden="true" />`: Franja decorativa
  - `<div className={styles.modalBox} role="dialog" ...>`: Hoja de papel rasgado

- [ ] **Step 1: Escribir el test que verifica la envoltura de papel rasgado y washi tape en `VaultModal.test.tsx`**

Agregar caso en `src/tests/VaultModal.test.tsx`:
```tsx
it('renderiza el modal envuelto en contenedor de papel rasgado con washi tape decorativa', () => {
  render(<VaultModal isOpen={true} onClose={vi.fn()} profile={mockProfile} />);

  const dialog = screen.getByRole('dialog', { name: /bóveda offline/i });
  expect(dialog).toBeInTheDocument();

  const modalWrap = dialog.closest('div[class*="modalWrap"]');
  expect(modalWrap).toBeInTheDocument();

  const washiTape = modalWrap?.querySelector('div[class*="washiTape"]');
  expect(washiTape).toBeInTheDocument();
  expect(washiTape).toHaveAttribute('aria-hidden', 'true');
});
```

- [ ] **Step 2: Ejecutar el test para comprobar que falla**

Run: `pnpm exec vitest run src/tests/VaultModal.test.tsx`
Expected: FAIL indicando que `modalWrap` no se encuentra en el DOM.

- [ ] **Step 3: Implementar la integración en `src/components/vault/VaultModal.tsx`**

Envolver `.modalBox` dentro de `.modalWrap` con `.washiTape`:

```tsx
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalWrap} onClick={(e) => e.stopPropagation()}>
        <div className={styles.washiTape} aria-hidden="true" />
        <div
          className={styles.modalBox}
          role="dialog"
          aria-modal="true"
          aria-labelledby="vault-modal-title"
        >
          {/* Header, Tabs y Contenido intactos */}
        </div>
      </div>
    </div>
  );
```

- [ ] **Step 4: Ejecutar los tests de `VaultModal` para comprobar que pasan**

Run: `pnpm exec vitest run src/tests/VaultModal.test.tsx`
Expected: PASS (todos los tests en verde)

- [ ] **Step 5: Commit de la integración**

```bash
git add src/components/vault/VaultModal.tsx src/tests/VaultModal.test.tsx
git commit -m ":sparkles: feat(boveda): envolver modal de boveda en pliego de papel rasgado con washi tape"
```

---

### Task 3: Pruebas de interacción con backdrop, pestañas y build de producción

**Files:**
- Test: `src/tests/VaultModal.test.tsx`

**Interfaces:**
- Consumes: Módulo completo `VaultModal`
- Produces: Suite de pruebas en verde y build limpio

- [ ] **Step 1: Escribir test de cierre al hacer clic en el overlay exterior**

Agregar en `src/tests/VaultModal.test.tsx`:
```tsx
it('cierra el modal cuando el usuario hace clic fuera de la hoja de papel rasgado (overlay)', async () => {
  const onClose = vi.fn();
  const user = userEvent.setup();

  const { container } = render(
    <VaultModal isOpen={true} onClose={onClose} profile={mockProfile} />
  );

  const overlay = container.querySelector('div[class*="modalOverlay"]');
  expect(overlay).toBeInTheDocument();
  if (overlay) {
    await user.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  }
});
```

- [ ] **Step 2: Ejecutar los tests unitarios de `VaultModal`**

Run: `pnpm exec vitest run src/tests/VaultModal.test.tsx`
Expected: PASS (4/4 tests en verde)

- [ ] **Step 3: Ejecutar compilación de producción TypeScript + Vite**

Run: `pnpm build`
Expected: PASS (código de salida 0, sin errores)

- [ ] **Step 4: Commit final de verificación**

```bash
git add src/tests/VaultModal.test.tsx
git commit -m ":white_check_mark: test(boveda): validar cierre por overlay y elementos de papel rasgado"
```
