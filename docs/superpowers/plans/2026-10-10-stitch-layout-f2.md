# Layout de Stitch (F2) + Dashboard lazy + hash del PIN — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sacar el Dashboard y sus gráficos de la carga inicial (Parte A), guardar el PIN con hash PBKDF2 en vez de texto plano (Parte B) y aplicar el layout de Stitch, con sidebar editorial, barra superior y riel en tablet (Parte C, fase F2 del roadmap).

**Architecture:** Tres partes independientes, cada una en su rama `feature/*` desde `develop` y con merge local `--no-ff` de vuelta a `develop`. A cambia solo el ruteo. B agrega `src/services/pinHash.ts` (Web Crypto) y lo usa en `ProfileGateView`. C reescribe `AppLayout` y su CSS sin cambiar su interfaz, y usa `isPinProtected` de B.

**Tech Stack:** React 19.2, TypeScript, Vite, CSS Modules + tokens de `src/index.css`, `lucide-react`, Web Crypto (`crypto.subtle`, PBKDF2-SHA-256), Vitest + Testing Library.

**Spec:** No hay spec propio. Las fuentes son:
- `docs/superpowers/plans/2026-10-10-stitch-redesign-roadmap.md` (fase F2 y decisión D2);
- los diseños de los arreglos A y B presentados en la sesión del 2026-10-10;
- la pantalla Stitch `projects/2198597521553671013` (barra superior y sidebar comunes a las 4 pantallas).

Decisiones del usuario: **D2 = Copernicus**, merge de cada parte a `develop` y nada a `main`.

## Decisiones de diseño tomadas en este plan

1. **Fuentes (D2 = Copernicus).**
   - El repo no carga ninguna fuente (`@font-face` no existe): Copernicus, Tiempos, StyreneB, Inter y JetBrains Mono son solo nombres en los tokens, y hoy el navegador cae a Times New Roman y a la sans y mono del sistema.
   - Copernicus es una fuente comercial, así que este plan **no** agrega sus archivos: lo hará un seguimiento cuando el usuario provea los `.woff2` con licencia.
   - Este plan mantiene `"Copernicus"` primero en `--font-primary` y agrega fallbacks editoriales: `Georgia` para la serif, `system-ui`/`Segoe UI` para la sans y `Cascadia Mono`/`Consolas` para la mono.
2. **Navegación sin duplicar.** Stitch repite la navegación en pestañas arriba y en el sidebar. Se mantiene un solo `<nav>` (el sidebar) para no exponer dos navegaciones idénticas a lectores de pantalla. Comportamiento según ancho:
   - desktop, 1024 px o más: sidebar completo;
   - tablet, 769–1023 px: riel de 72 px con las etiquetas ocultas visualmente pero accesibles;
   - móvil, 768 px o menos: barra inferior (como hoy).
3. **Barra superior.** Contiene el título de la vista (con mayúsculas correctas: hoy `text-transform: capitalize` muestra "Todo" en vez de "To-Do"), la fecha y un único botón de sesión:
   - "Bloquear perfil" si el perfil tiene PIN;
   - "Cambiar perfil" si no lo tiene.
   El botón duplicado `mobileProfileBtn` desaparece.
4. **Sin controles de features inexistentes** (roadmap F2): no hay buscador, "Nueva Nota", "Acción Rápida", "Ajustes & PIN", "Bóveda", "Notas Rápidas" ni "Carpetas". Tampoco textos de almacenamiento o cifrado ("IndexedDB activo", "Cifrado AES").
5. **PIN.**
   - Hash PBKDF2-SHA-256 con sal aleatoria de 16 bytes por perfil, 100 000 iteraciones y comparación en tiempo constante.
   - Los PIN en texto plano se migran al abrir la pantalla de perfiles.
   - El PIN de creación debe tener de 4 a 6 dígitos.
   - El hash **no cifra** los datos del perfil; eso es F7.

## Global Constraints

- Ramas: `feature/lazy-dashboard`, `feature/pin-hash` y `feature/stitch-layout`, cada una nacida de `develop` (actualizado tras el merge de la parte anterior) y mergeada con `git merge --no-ff` a `develop`, local y sin push (AGENTS.md §11.3 y decisión del usuario). Nada va a `main`.
- Sin dependencias nuevas. Web Crypto es nativo (`crypto.subtle` existe en Vitest/jsdom; verificado el 2026-10-10).
- Estilos solo con CSS Modules y tokens de `src/index.css`. Iconos solo de `lucide-react`.
- Prohibido renderizar controles de features que no existen y textos de seguridad no implementados ("cifrado", "IndexedDB", "AES").
- PIN: `PIN_PATTERN = /^\d{4,6}$/`, PBKDF2-SHA-256, `PBKDF2_ITERATIONS = 100000`, sal de 16 bytes, hash de 32 bytes, todo en hex. Prohibida la criptografía propia (§17.2 A.8.24).
- WCAG 2.2 AA: objetivos táctiles de 44 px o más, foco visible y nombre accesible en todo control, incluso con la etiqueta oculta visualmente.
- Tests solo en `src/tests/`, con la técnica declarada en un comentario (§7).
- Commits: `:emoji: tipo(alcance): sujeto`, en español y sin trailers de agente (§11). Alcances: `routes`, `perfiles`, `layout`.
- Comandos: test de un archivo con `pnpm exec vitest run <ruta>`; suite completa con `pnpm exec vitest run`; tipos con `pnpm exec tsc -b`; lint con `pnpm lint`; build con `pnpm build`.

## Review Focus

1. **Contexto no seguro sin Web Crypto** (por ejemplo, la app abierta por `http://192.168.x.x`): `crypto.subtle` no existe. Crear un perfil con PIN debe avisar con un error y no guardar nada a medias, y la migración debe dejar los PIN viejos intactos. Lo cubre el test "si Web Crypto falla al crear con PIN…" de la Task 3.
2. **Migración interrumpida** (se cierra la pestaña a mitad del hash): el perfil queda con su `pin` viejo y la próxima apertura lo migra. `migrateLegacyPins` es idempotente: lo cubre el test "no toca perfiles ya migrados ni sin PIN" de la Task 2.
3. **Nombre de perfil largo** en la tarjeta del sidebar y en la barra superior a 320 px: se corta con elipsis sin desbordar. Verificación manual en la Task 6.
4. **Riel de tablet solo con teclado:** cada botón del riel conserva su nombre accesible y su foco visible aunque la etiqueta esté oculta. Verificación manual en la Task 6. En jsdom, el test de landmarks de la Task 5 cubre los nombres.
5. **Transición login → Dashboard** con el Dashboard lazy: se ve el fallback "Cargando espacio..." un instante, sin pantalla en blanco. Lo cubre el test de ruta de la Task 1; el salto de layout se verifica a mano en la Task 6.

---

## File Structure

| Archivo | Parte | Acción | Responsabilidad |
|---|---|---|---|
| `src/routes/index.tsx` | A | Modificar | `DashboardView` con `lazy` + `Suspense` |
| `src/tests/routes.test.tsx` | A | Modificar | El Dashboard resuelve vía Suspense |
| `src/tests/App.test.tsx` | A | Modificar | Timeout del `findBy` del Dashboard lazy |
| `src/types/index.ts` | B | Modificar | `Profile.pinHash?`, `Profile.pinSalt?`; `pin?` queda como legado |
| `src/services/pinHash.ts` | B | Crear | `PIN_PATTERN`, `hashPin`, `verifyPin`, `isPinProtected`, `migrateLegacyPins` |
| `src/tests/pinHash.test.ts` | B | Crear | |
| `src/components/ProfileGateView.tsx` | B | Modificar | Migración al montar, creación con hash y verificación asíncrona |
| `src/tests/ProfileGateView.test.tsx` | B | Reescribir | |
| `src/index.css` | C | Modificar | Fallbacks de fuentes |
| `DESIGN.md` | C | Modificar | Documenta los fallbacks |
| `src/components/AppLayout.tsx` | C | Reescribir | Layout de Stitch |
| `src/components/AppLayout.module.css` | C | Reescribir | Estilos de sidebar, riel, barra superior y barra inferior |
| `src/tests/AppLayout.test.tsx` | C | Reescribir | |

---

## Parte A — Dashboard lazy (rama `feature/lazy-dashboard`)

### Task 1: Cargar el Dashboard de forma diferida

**Files:**
- Modify: `src/routes/index.tsx:5` (import) y `:49-59` (ruta `/dashboard`)
- Modify: `src/tests/routes.test.tsx` (test "permite acceder al dashboard si hay perfil autenticado")
- Modify: `src/tests/App.test.tsx:34`

**Interfaces:**
- Consumes: `RouteLoadingFallback` (ya existe: `role="status"`, texto "Cargando espacio...").
- Produces: nada nuevo; `AppRoutes` conserva su firma.

- [ ] **Step 1: Create the branch**

```bash
git checkout develop
git checkout -b feature/lazy-dashboard
```

- [ ] **Step 2: Write the failing test** — en `src/tests/routes.test.tsx` reemplazar el cuerpo del test `'permite acceder al dashboard si hay perfil autenticado'` por:

```tsx
  // Técnica: partición de equivalencia (vista diferida: fallback primero, contenido después).
  it('permite acceder al dashboard si hay perfil autenticado', async () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AppRoutes
          activeProfile={mockProfile}
          onSelectProfile={vi.fn()}
          onLockProfile={vi.fn()}
        />
      </MemoryRouter>
    );

    // El Dashboard es diferido: primero se ve el fallback de Suspense.
    expect(screen.getByRole('status')).toHaveTextContent(/cargando espacio/i);
    expect(await screen.findByText(/¡hola, carolina!/i, {}, { timeout: 10000 })).toBeInTheDocument();
  });
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm exec vitest run src/tests/routes.test.tsx`
Expected: FAIL en "permite acceder al dashboard si hay perfil autenticado" con `Unable to find an accessible element with the role "status"`, porque hoy el Dashboard se renderiza de forma síncrona.

- [ ] **Step 4: Write minimal implementation** — en `src/routes/index.tsx` reemplazar:

```tsx
import { DashboardView } from '../components/DashboardView';
```

por:

```tsx
const DashboardView = lazy(() => import('../components/DashboardView').then(m => ({ default: m.DashboardView })));
```

Moverla junto a las otras tres constantes `lazy`, debajo de los imports. Después reemplazar el `element` de la ruta `/dashboard`:

```tsx
          element={
            activeProfile ? (
              <DashboardView
                profile={activeProfile}
                onNavigate={view => navigate(`/${view}`)}
              />
            ) : null
          }
```

por:

```tsx
          element={
            activeProfile ? (
              <Suspense fallback={<RouteLoadingFallback />}>
                <DashboardView
                  profile={activeProfile}
                  onNavigate={view => navigate(`/${view}`)}
                />
              </Suspense>
            ) : null
          }
```

En `src/tests/App.test.tsx:34` reemplazar:

```tsx
    expect(await screen.findByRole('heading', { name: /¡hola, ignacio!/i })).toBeInTheDocument();
```

por:

```tsx
    // El Dashboard (con gráficos) es un chunk diferido: su import() en frío supera 1 s en jsdom.
    expect(await screen.findByRole('heading', { name: /¡hola, ignacio!/i }, { timeout: 10000 })).toBeInTheDocument();
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm exec vitest run src/tests/routes.test.tsx src/tests/App.test.tsx`
Expected: PASS (todos los casos de ambos archivos).

- [ ] **Step 6: Full gate and bundle check**

```bash
pnpm exec vitest run && pnpm exec tsc -b && pnpm lint && pnpm build
grep -c "vendor-charts" dist/index.html
T=0; for f in $(grep -oE '(src|href)="\./assets/[^"]+"' dist/index.html | sed 's/.*assets\///;s/"//'); do s=$(gzip -c dist/assets/$f | wc -c); T=$((T+s)); done; echo "initial gz: $T"
```

Expected:
- todo en verde;
- `grep -c` imprime `0` (los gráficos ya no se precargan);
- la carga inicial queda por debajo de ~150 KB gzip (antes: 190.2 KB). Registrar el número.

- [ ] **Step 7: Commit and merge to develop**

```bash
git add src/routes/index.tsx src/tests/routes.test.tsx src/tests/App.test.tsx
git commit -m ":zap: perf(routes): cargar el dashboard de forma diferida" -m "El import estatico arrastraba vendor-charts a la carga inicial aunque la primera pantalla es el login."
git checkout develop
git merge --no-ff feature/lazy-dashboard -m ":twisted_rightwards_arrows: chore(routes): fusionar dashboard diferido en develop"
pnpm exec vitest run
git branch -d feature/lazy-dashboard
```

Expected: el merge sin conflictos, la suite en verde en `develop` y la rama borrada.

---

## Parte B — Hash del PIN (rama `feature/pin-hash`)

### Task 2: Servicio de hash del PIN

**Files:**
- Modify: `src/types/index.ts:11-17` (`Profile`)
- Create: `src/services/pinHash.ts`
- Create: `src/tests/pinHash.test.ts`

**Interfaces:**
- Consumes: Web Crypto (`crypto.subtle.importKey`, `crypto.subtle.deriveBits`, `crypto.getRandomValues`).
- Produces:
  - `PIN_PATTERN: RegExp` (`/^\d{4,6}$/`)
  - `PBKDF2_ITERATIONS = 100000`
  - `hashPin(pin: string, saltHex?: string): Promise<{ pinHash: string; pinSalt: string }>`
  - `verifyPin(profile: Profile, pin: string): Promise<boolean>`
  - `isPinProtected(profile: Profile): boolean`
  - `migrateLegacyPins(profiles: Profile[]): Promise<Profile[]>`

- [ ] **Step 1: Create the branch**

```bash
git checkout develop
git checkout -b feature/pin-hash
```

- [ ] **Step 2: Extend the model** — en `src/types/index.ts` reemplazar:

```ts
export interface Profile {
  id: string;
  name: string;
  avatar: string;
  pin?: string;
  createdAt: string;
}
```

por:

```ts
export interface Profile {
  id: string;
  name: string;
  avatar: string;
  /** Legado: PIN en texto plano. Se migra a pinHash/pinSalt al abrir la pantalla de perfiles. */
  pin?: string;
  pinHash?: string; // PBKDF2-SHA-256, hex de 32 bytes
  pinSalt?: string; // hex de 16 bytes
  createdAt: string;
}
```

- [ ] **Step 3: Write the failing test** — crear `src/tests/pinHash.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { PIN_PATTERN, hashPin, isPinProtected, migrateLegacyPins, verifyPin } from '../services/pinHash';
import type { Profile } from '../types';

const base: Profile = { id: 'p-1', name: 'Ana', avatar: 'A', createdAt: '2026-10-10' };

describe('PIN_PATTERN', () => {
  // Técnica: valores límite sobre longitud (3, 4, 6, 7) y partición sobre caracteres.
  it.each([
    ['123', false],
    ['1234', true],
    ['123456', true],
    ['1234567', false],
    ['12a4', false],
    ['', false],
  ])('%s → %s', (pin, ok) => {
    expect(PIN_PATTERN.test(pin)).toBe(ok);
  });
});

describe('hashPin', () => {
  it('devuelve hash y sal en hex sin contener el PIN', async () => {
    const { pinHash, pinSalt } = await hashPin('2468');
    expect(pinHash).toMatch(/^[0-9a-f]{64}$/);
    expect(pinSalt).toMatch(/^[0-9a-f]{32}$/);
    expect(pinHash).not.toContain('2468');
  });

  it('es determinista con la misma sal', async () => {
    const first = await hashPin('2468');
    const second = await hashPin('2468', first.pinSalt);
    expect(second).toEqual(first);
  });

  it('genera sales distintas en cada llamada sin sal', async () => {
    const a = await hashPin('2468');
    const b = await hashPin('2468');
    expect(a.pinSalt).not.toBe(b.pinSalt);
    expect(a.pinHash).not.toBe(b.pinHash);
  });
});

describe('verifyPin', () => {
  // Técnica: tabla de decisión (hash/legado/sin PIN × correcto/incorrecto).
  it('acepta el PIN correcto y rechaza el incorrecto con hash', async () => {
    const profile: Profile = { ...base, ...(await hashPin('2468')) };
    expect(await verifyPin(profile, '2468')).toBe(true);
    expect(await verifyPin(profile, '2469')).toBe(false);
  });

  it('acepta el PIN correcto y rechaza el incorrecto en perfiles legados', async () => {
    const profile: Profile = { ...base, pin: '4321' };
    expect(await verifyPin(profile, '4321')).toBe(true);
    expect(await verifyPin(profile, '0000')).toBe(false);
  });

  it('acepta cualquier entrada en un perfil sin PIN', async () => {
    expect(await verifyPin(base, '')).toBe(true);
  });
});

describe('isPinProtected', () => {
  it('detecta PIN con hash, legado o ausencia', async () => {
    expect(isPinProtected({ ...base, ...(await hashPin('2468')) })).toBe(true);
    expect(isPinProtected({ ...base, pin: '4321' })).toBe(true);
    expect(isPinProtected(base)).toBe(false);
  });
});

describe('migrateLegacyPins', () => {
  it('reemplaza el PIN en texto plano por hash y conserva el resto', async () => {
    const [migrated] = await migrateLegacyPins([{ ...base, pin: '4321' }]);
    expect(migrated).not.toHaveProperty('pin');
    expect(migrated).toMatchObject({ id: 'p-1', name: 'Ana', avatar: 'A', createdAt: '2026-10-10' });
    expect(await verifyPin(migrated, '4321')).toBe(true);
  });

  // Review Focus 2: idempotencia ante una migración interrumpida y reejecutada.
  it('no toca perfiles ya migrados ni sin PIN', async () => {
    const hashed: Profile = { ...base, id: 'p-2', ...(await hashPin('2468')) };
    const free: Profile = { ...base, id: 'p-3' };
    expect(await migrateLegacyPins([hashed, free])).toEqual([hashed, free]);
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `pnpm exec vitest run src/tests/pinHash.test.ts`
Expected: FAIL con `Failed to resolve import "../services/pinHash"`.

- [ ] **Step 5: Write minimal implementation** — crear `src/services/pinHash.ts`:

```ts
import type { Profile } from '../types';

export const PIN_PATTERN = /^\d{4,6}$/;
export const PBKDF2_ITERATIONS = 100000;

const toHex = (bytes: ArrayBuffer | Uint8Array): string =>
  Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');

const fromHex = (hex: string): Uint8Array<ArrayBuffer> =>
  new Uint8Array((hex.match(/.{2}/g) ?? []).map(h => parseInt(h, 16)));

/** PBKDF2-SHA-256 con Web Crypto. Sin saltHex genera una sal aleatoria de 16 bytes. */
export const hashPin = async (pin: string, saltHex?: string): Promise<{ pinHash: string; pinSalt: string }> => {
  const salt = saltHex ? fromHex(saltHex) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    key,
    256,
  );
  return { pinHash: toHex(bits), pinSalt: toHex(salt) };
};

const constantTimeEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};

export const isPinProtected = (profile: Profile): boolean => Boolean(profile.pinHash || profile.pin);

export const verifyPin = async (profile: Profile, pin: string): Promise<boolean> => {
  if (profile.pinHash && profile.pinSalt) {
    const { pinHash } = await hashPin(pin, profile.pinSalt);
    return constantTimeEqual(pinHash, profile.pinHash);
  }
  if (profile.pin !== undefined) return constantTimeEqual(pin, profile.pin);
  return true;
};

/** Reemplaza PIN en texto plano por hash. Idempotente: perfiles migrados o sin PIN se devuelven tal cual. */
export const migrateLegacyPins = (profiles: Profile[]): Promise<Profile[]> =>
  Promise.all(
    profiles.map(async profile => {
      if (profile.pin === undefined || profile.pinHash) return profile;
      const migrated: Profile = { ...profile, ...(await hashPin(profile.pin)) };
      delete migrated.pin;
      return migrated;
    }),
  );
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm exec vitest run src/tests/pinHash.test.ts src/tests/types.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/types/index.ts src/services/pinHash.ts src/tests/pinHash.test.ts
git commit -m ":lock: feat(perfiles): agregar hash pbkdf2 para el pin de perfil" -m "Web Crypto con sal aleatoria por perfil y comparacion en tiempo constante; migracion idempotente desde el pin en texto plano."
```

### Task 3: Usar el hash en la pantalla de perfiles

**Files:**
- Modify: `src/components/ProfileGateView.tsx`
- Rewrite: `src/tests/ProfileGateView.test.tsx`

**Interfaces:**
- Consumes: `PIN_PATTERN`, `hashPin`, `verifyPin`, `isPinProtected`, `migrateLegacyPins` (Task 2).
- Produces: nada nuevo; `ProfileGateView` conserva su firma `{ onSelectProfile }`.

- [ ] **Step 1: Write the failing test** — reemplazar todo `src/tests/ProfileGateView.test.tsx` por:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { sileo } from 'sileo';
import { ProfileGateView } from '../components/ProfileGateView';
import { StorageService } from '../services/storage';

describe('ProfileGateView', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('permite crear un nuevo perfil sin PIN y seleccionarlo', async () => {
    const successSpy = vi.spyOn(sileo, 'success');
    const user = userEvent.setup();
    const onSelectProfile = vi.fn();

    render(<ProfileGateView onSelectProfile={onSelectProfile} />);

    expect(screen.getByText(/selecciona tu perfil/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /nuevo perfil/i }));
    expect(screen.getByRole('dialog', { name: /crear perfil/i })).toBeInTheDocument();

    await user.type(screen.getByLabelText(/nombre/i), 'Valentina');
    await user.click(screen.getByRole('button', { name: /crear perfil/i }));

    await waitFor(() => expect(onSelectProfile).toHaveBeenCalledTimes(1));
    expect(onSelectProfile.mock.calls[0][0].name).toBe('Valentina');
    expect(successSpy).toHaveBeenCalledWith({ title: 'Perfil "Valentina" creado' });
  });

  it('crea un perfil con PIN guardando solo hash y sal', async () => {
    const user = userEvent.setup();
    const onSelectProfile = vi.fn();
    render(<ProfileGateView onSelectProfile={onSelectProfile} />);

    await user.click(screen.getByRole('button', { name: /nuevo perfil/i }));
    await user.type(screen.getByLabelText(/nombre/i), 'Ana');
    await user.type(screen.getByLabelText(/pin opcional/i), '2468');
    await user.click(screen.getByRole('button', { name: /crear perfil/i }));

    await waitFor(() => expect(onSelectProfile).toHaveBeenCalledTimes(1));
    expect(localStorage.getItem('espiralia_profiles')).not.toContain('2468');
    const [stored] = StorageService.getProfiles();
    expect(stored.pin).toBeUndefined();
    expect(stored.pinHash).toMatch(/^[0-9a-f]{64}$/);
    expect(stored.pinSalt).toMatch(/^[0-9a-f]{32}$/);
  });

  // Técnica: partición de equivalencia sobre el PIN de creación (corto, con letras, sin dígitos).
  it.each(['123', '12a4', 'abcd'])('rechaza el PIN inválido "%s" al crear', async invalid => {
    const errorSpy = vi.spyOn(sileo, 'error');
    const user = userEvent.setup();
    const onSelectProfile = vi.fn();
    render(<ProfileGateView onSelectProfile={onSelectProfile} />);

    await user.click(screen.getByRole('button', { name: /nuevo perfil/i }));
    await user.type(screen.getByLabelText(/nombre/i), 'Ana');
    await user.type(screen.getByLabelText(/pin opcional/i), invalid);
    await user.click(screen.getByRole('button', { name: /crear perfil/i }));

    expect(errorSpy).toHaveBeenCalledWith({ title: 'El PIN debe tener entre 4 y 6 dígitos' });
    expect(screen.getByLabelText(/pin opcional/i)).toHaveAttribute('aria-invalid', 'true');
    expect(StorageService.getProfiles()).toEqual([]);
    expect(onSelectProfile).not.toHaveBeenCalled();
  });

  // Review Focus 1: contexto sin Web Crypto.
  it('si Web Crypto falla al crear con PIN avisa y no guarda nada', async () => {
    vi.spyOn(crypto.subtle, 'importKey').mockRejectedValue(new Error('no disponible'));
    const errorSpy = vi.spyOn(sileo, 'error');
    const user = userEvent.setup();
    const onSelectProfile = vi.fn();
    render(<ProfileGateView onSelectProfile={onSelectProfile} />);

    await user.click(screen.getByRole('button', { name: /nuevo perfil/i }));
    await user.type(screen.getByLabelText(/nombre/i), 'Ana');
    await user.type(screen.getByLabelText(/pin opcional/i), '2468');
    await user.click(screen.getByRole('button', { name: /crear perfil/i }));

    await waitFor(() => expect(errorSpy).toHaveBeenCalledWith({ title: 'No se pudo crear el perfil' }));
    expect(StorageService.getProfiles()).toEqual([]);
    expect(onSelectProfile).not.toHaveBeenCalled();
  });

  it('migra un PIN en texto plano a hash al abrir la pantalla', async () => {
    StorageService.saveProfile({ id: 'p-legacy', name: 'Carlos', avatar: 'C', pin: '4321', createdAt: '2026-10-09' });
    render(<ProfileGateView onSelectProfile={vi.fn()} />);

    await waitFor(() => expect(StorageService.getProfiles()[0].pinHash).toBeDefined());
    expect(StorageService.getProfiles()[0].pin).toBeUndefined();
    expect(localStorage.getItem('espiralia_profiles')).not.toContain('4321');
    expect(screen.getByText('Protegido por PIN')).toBeInTheDocument();
  });

  it('solicita PIN si el perfil tiene PIN y rechaza PIN incorrecto', async () => {
    const errorSpy = vi.spyOn(sileo, 'error');
    const user = userEvent.setup();
    const onSelectProfile = vi.fn();

    StorageService.saveProfile({ id: 'p-pin', name: 'Carlos', avatar: 'C', pin: '4321', createdAt: '2026-10-09' });
    render(<ProfileGateView onSelectProfile={onSelectProfile} />);

    await user.click(screen.getByText('Carlos'));
    expect(screen.getByRole('dialog', { name: /ingresa tu pin/i })).toBeInTheDocument();

    const pinInput = screen.getByLabelText(/pin de acceso/i);
    await user.type(pinInput, '0000');
    await user.click(screen.getByRole('button', { name: /desbloquear/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/pin incorrecto/i);
    expect(pinInput).toHaveAttribute('aria-invalid', 'true');
    expect(errorSpy).toHaveBeenCalledWith({ title: 'PIN incorrecto' });
    expect(onSelectProfile).not.toHaveBeenCalled();

    await user.clear(pinInput);
    await user.type(pinInput, '4321');
    await user.click(screen.getByRole('button', { name: /desbloquear/i }));

    await waitFor(() => expect(onSelectProfile).toHaveBeenCalledTimes(1));
    expect(onSelectProfile.mock.calls[0][0].id).toBe('p-pin');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/tests/ProfileGateView.test.tsx`
Expected: FAIL. Se espera que "crea un perfil con PIN guardando solo hash y sal" falle con `expected '…2468…' not to contain '2468'`; que los 3 casos de PIN inválido fallen porque hoy no hay validación; que falle "si Web Crypto falla…"; y que "migra un PIN…" falle en `pinHash` por `undefined`.

- [ ] **Step 3: Implement** — en `src/components/ProfileGateView.tsx`:

Reemplazar las líneas 1–5:

```tsx
import React, { useState } from 'react';
import { Lock, Plus, ArrowRight } from 'lucide-react';
import { sileo } from 'sileo';
import type { Profile } from '../types';
import { StorageService } from '../services/storage';
```

por:

```tsx
import React, { useEffect, useState } from 'react';
import { Lock, Plus, ArrowRight } from 'lucide-react';
import { sileo } from 'sileo';
import type { Profile } from '../types';
import { StorageService } from '../services/storage';
import { PIN_PATTERN, hashPin, isPinProtected, migrateLegacyPins, verifyPin } from '../services/pinHash';
```

Reemplazar el bloque desde `const [pinError, setPinError] = useState(false);` hasta el final de `handleCreateProfile` (líneas 21–65) por:

```tsx
  const [pinError, setPinError] = useState(false);
  const [createPinError, setCreatePinError] = useState(false);
  const [busy, setBusy] = useState(false);

  // Migra PIN en texto plano a hash apenas se abre la pantalla (§10 A04).
  useEffect(() => {
    let cancelled = false;
    const stored = StorageService.getProfiles();
    if (!stored.some(p => p.pin !== undefined && !p.pinHash)) return;
    migrateLegacyPins(stored)
      .then(migrated => {
        migrated.forEach(p => StorageService.saveProfile(p));
        if (!cancelled) setProfiles(StorageService.getProfiles());
      })
      .catch(() => {
        // ponytail: sin Web Crypto (contexto no seguro) el PIN legado queda intacto y se reintenta en la próxima carga.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleProfileClick = (profile: Profile) => {
    if (isPinProtected(profile)) {
      setSelectedProfileForPin(profile);
      setPinInput('');
      setPinError(false);
    } else {
      StorageService.setActiveProfileId(profile.id);
      onSelectProfile(profile);
    }
  };

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfileForPin || busy) return;
    setBusy(true);
    const ok = await verifyPin(selectedProfileForPin, pinInput).catch(() => false);
    setBusy(false);

    if (ok) {
      StorageService.setActiveProfileId(selectedProfileForPin.id);
      onSelectProfile(selectedProfileForPin);
    } else {
      setPinError(true);
      sileo.error({ title: 'PIN incorrecto' });
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedPin = pin.trim();
    if (!trimmedName || busy) return;
    if (trimmedPin && !PIN_PATTERN.test(trimmedPin)) {
      setCreatePinError(true);
      sileo.error({ title: 'El PIN debe tener entre 4 y 6 dígitos' });
      return;
    }

    setBusy(true);
    try {
      const newProfile: Profile = {
        id: `p-${Date.now()}`,
        name: trimmedName,
        avatar: trimmedName.charAt(0).toUpperCase(),
        createdAt: new Date().toISOString(),
        ...(trimmedPin ? await hashPin(trimmedPin) : {}),
      };

      StorageService.saveProfile(newProfile);
      StorageService.setActiveProfileId(newProfile.id);
      setProfiles(StorageService.getProfiles());
      setIsCreating(false);
      sileo.success({ title: `Perfil "${newProfile.name}" creado` });
      onSelectProfile(newProfile);
    } catch {
      sileo.error({ title: 'No se pudo crear el perfil' });
    } finally {
      setBusy(false);
    }
  };
```

En la lista de perfiles reemplazar las dos condiciones `profile.pin ?` por `isPinProtected(profile) ?`:

```tsx
                <div className={styles.profileMeta}>
                  {isPinProtected(profile) ? 'Protegido por PIN' : 'Acceso libre'}
                </div>
              </div>
              {isPinProtected(profile) ? (
```

En el botón "Nuevo perfil" reiniciar también el error, reemplazando:

```tsx
            setName('');
            setPin('');
```

por:

```tsx
            setName('');
            setPin('');
            setCreatePinError(false);
```

Reemplazar el bloque del campo PIN de creación:

```tsx
                <label htmlFor="create-profile-pin" className={styles.formLabel}>
                  PIN opcional (4 dígitos)
                </label>
                <input
                  id="create-profile-pin"
                  type="password"
                  maxLength={6}
                  className={styles.formInput}
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  placeholder="Dejar vacío si no requieres PIN"
                />
```

por:

```tsx
                <label htmlFor="create-profile-pin" className={styles.formLabel}>
                  PIN opcional (4 a 6 dígitos)
                </label>
                <input
                  id="create-profile-pin"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  className={styles.formInput}
                  value={pin}
                  onChange={e => {
                    setPin(e.target.value);
                    setCreatePinError(false);
                  }}
                  aria-invalid={createPinError ? 'true' : 'false'}
                  aria-describedby={createPinError ? 'create-pin-error' : undefined}
                  placeholder="Dejar vacío si no requieres PIN"
                />
                {createPinError && (
                  <p id="create-pin-error" className={styles.errorMessage} role="alert">
                    El PIN debe tener entre 4 y 6 dígitos.
                  </p>
                )}
```

En los dos botones de submit (`Crear perfil` y `Desbloquear`) agregar `disabled={busy}`:

```tsx
                <button type="submit" className={styles.btnPrimary} style={{ flex: 1 }} disabled={busy}>
```

y en el campo "PIN de acceso" agregar `inputMode="numeric"` después de `type="password"`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/tests/ProfileGateView.test.tsx src/tests/pinHash.test.ts`
Expected: PASS.

- [ ] **Step 5: Full gate**

Run: `pnpm exec vitest run && pnpm exec tsc -b && pnpm lint && pnpm build`
Expected: todo en verde. `App.test.tsx` crea perfiles sin PIN, así que su flujo sigue siendo síncrono.

- [ ] **Step 6: Commit and merge to develop**

```bash
git add src/components/ProfileGateView.tsx src/tests/ProfileGateView.test.tsx
git commit -m ":lock: fix(perfiles): guardar y verificar el pin con hash en vez de texto plano" -m "Migra al abrir la pantalla los pin existentes, valida 4 a 6 digitos al crear y reporta error si Web Crypto no esta disponible. Cumple AGENTS.md seccion 10 A04."
git checkout develop
git merge --no-ff feature/pin-hash -m ":twisted_rightwards_arrows: chore(perfiles): fusionar hash del pin en develop"
pnpm exec vitest run
git branch -d feature/pin-hash
```

Expected: merge sin conflictos, suite en verde y rama borrada.

---

## Parte C — Layout de Stitch, F2 (rama `feature/stitch-layout`)

### Task 4: Fallbacks de fuentes (D2 = Copernicus)

**Files:**
- Modify: `src/index.css:46-48`
- Modify: `DESIGN.md:40`, `:49`, `:58`

**Interfaces:**
- Consumes: nada.
- Produces: los tokens `--font-primary`, `--font-family-2` y `--font-family-3` con fallbacks; sus nombres no cambian.

- [ ] **Step 1: Create the branch**

```bash
git checkout develop
git checkout -b feature/stitch-layout
```

- [ ] **Step 2: Update tokens** — en `src/index.css` reemplazar:

```css
  --font-primary: "Copernicus", "Tiempos Headline", serif;
  --font-family-2: "StyreneB", Inter, sans-serif;
  --font-family-3: "JetBrains Mono", ui-monospace, monospace;
```

por:

```css
  /* Copernicus/StyreneB son comerciales y no se cargan aún (sin @font-face): los fallbacks definen lo que se ve hoy. */
  --font-primary: "Copernicus", "Tiempos Headline", Georgia, "Times New Roman", serif;
  --font-family-2: "StyreneB", Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-family-3: "JetBrains Mono", ui-monospace, "Cascadia Mono", Consolas, monospace;
```

En `DESIGN.md` reemplazar las tres cabeceras:

- `### Copernicus, Tiempos Headline, serif · \`--font-primary\`` por `### Copernicus, Tiempos Headline, Georgia, serif · \`--font-primary\``
- `### StyreneB, Inter, sans-serif · \`--font-family-2\`` por `### StyreneB, Inter, system-ui, sans-serif · \`--font-family-2\``
- `### JetBrains Mono, ui-monospace, monospace · \`--font-family-3\`` por `### JetBrains Mono, ui-monospace, Consolas, monospace · \`--font-family-3\``

- [ ] **Step 3: Verify**

Run: `pnpm build`
Expected: el build termina sin errores. Los tokens no tienen test unitario: es configuración visual, y se verifica en la Task 6.

- [ ] **Step 4: Commit**

```bash
git add src/index.css DESIGN.md
git commit -m ":art: style(layout): agregar fallbacks editoriales a las fuentes de marca" -m "D2: se mantiene Copernicus como fuente principal. Sin archivos con licencia el navegador caia a Times New Roman; ahora cae a Georgia."
```

### Task 5: AppLayout con el layout de Stitch

**Files:**
- Rewrite: `src/tests/AppLayout.test.tsx`
- Rewrite: `src/components/AppLayout.tsx`
- Rewrite: `src/components/AppLayout.module.css`

**Interfaces:**
- Consumes: `isPinProtected(profile: Profile): boolean` (Task 2).
- Produces: `AppLayout` con la misma firma (`profile`, `currentView`, `onViewChange`, `onLockProfile`, `children`), así que `ProtectedRoute` no cambia.

- [ ] **Step 1: Write the failing test** — reemplazar todo `src/tests/AppLayout.test.tsx` por:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { sileo } from 'sileo';
import { AppLayout } from '../components/AppLayout';
import type { Profile, ViewType } from '../types';

const freeProfile: Profile = { id: 'p-1', name: 'Francisca', avatar: 'F', createdAt: '2026-10-09' };
const protectedProfile: Profile = { ...freeProfile, pinHash: 'a'.repeat(64), pinSalt: 'b'.repeat(32) };

const renderLayout = (profile: Profile = freeProfile, currentView: ViewType = 'dashboard') => {
  const onViewChange = vi.fn();
  const onLockProfile = vi.fn();
  render(
    <AppLayout profile={profile} currentView={currentView} onViewChange={onViewChange} onLockProfile={onLockProfile}>
      <div>Contenido Principal</div>
    </AppLayout>,
  );
  return { onViewChange, onLockProfile };
};

describe('AppLayout', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renderiza enlaces de navegacion y dispara cambio de vista', async () => {
    const user = userEvent.setup();
    const { onViewChange } = renderLayout();

    expect(screen.getByRole('heading', { name: 'Espiralia', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('Francisca')).toBeInTheDocument();
    expect(screen.getByText('Contenido Principal')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /agenda/i }));
    expect(onViewChange).toHaveBeenCalledWith('agenda');
  });

  // Técnica: tabla de decisión (perfil con PIN / sin PIN → etiqueta e icono de sesión).
  it('ofrece "Cambiar perfil" en un perfil sin PIN y cierra sesión', async () => {
    const infoSpy = vi.spyOn(sileo, 'info');
    const user = userEvent.setup();
    const { onLockProfile } = renderLayout(freeProfile);

    const lockButtons = screen.getAllByRole('button', { name: /cambiar perfil/i });
    expect(lockButtons).toHaveLength(1);
    expect(screen.getByText('Acceso libre')).toBeInTheDocument();

    await user.click(lockButtons[0]);
    expect(infoSpy).toHaveBeenCalledWith({ title: 'Sesión cerrada' });
    expect(onLockProfile).toHaveBeenCalledTimes(1);
  });

  it('ofrece "Bloquear perfil" en un perfil protegido por PIN', () => {
    renderLayout(protectedProfile);

    expect(screen.getByRole('button', { name: /bloquear perfil/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /cambiar perfil/i })).not.toBeInTheDocument();
    expect(screen.getByText('Protegido por PIN')).toBeInTheDocument();
  });

  // Técnica: partición de equivalencia sobre las cuatro vistas (título con mayúsculas correctas).
  it.each([
    ['dashboard', 'Dashboard'],
    ['agenda', 'Agenda'],
    ['planner', 'Planner'],
    ['todo', 'To-Do'],
  ] as const)('la barra superior titula la vista %s como "%s"', (view, title) => {
    renderLayout(freeProfile, view);
    expect(within(screen.getByRole('banner')).getByText(title)).toBeInTheDocument();
  });

  it('no muestra controles de features que todavía no existen', () => {
    renderLayout();
    for (const label of [/buscar/i, /nueva nota/i, /acción rápida/i, /bóveda/i, /ajustes/i, /indexeddb/i, /cifrad/i]) {
      expect(screen.queryByText(label)).not.toBeInTheDocument();
    }
  });

  it('proporciona enlace de salto de navegación (skip link) y landmarks accesibles', () => {
    renderLayout();

    const skipLink = screen.getByRole('link', { name: /saltar al contenido principal/i });
    expect(skipLink).toHaveAttribute('href', '#main-content');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');

    const nav = screen.getByRole('navigation', { name: /navegación principal/i });
    for (const name of [/dashboard/i, /agenda/i, /planner/i, /to-do/i]) {
      expect(within(nav).getByRole('button', { name })).toBeInTheDocument();
    }
    expect(within(nav).getByRole('button', { name: /dashboard/i })).toHaveAttribute('aria-current', 'page');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/tests/AppLayout.test.tsx`
Expected: FAIL. Fallan:
- "ofrece 'Cambiar perfil'…", porque hoy hay 2 botones y no existe "Acceso libre";
- "ofrece 'Bloquear perfil'…";
- los 4 casos de "la barra superior titula…", porque hoy el título es el valor crudo en minúsculas (`dashboard`, `agenda`, `planner`, `todo`).

Los 3 restantes pasan desde ya (navegación, controles inexistentes y landmarks).

- [ ] **Step 3: Rewrite the component** — reemplazar todo `src/components/AppLayout.tsx` por:

```tsx
import React, { useState } from 'react';
import { LayoutDashboard, Calendar, Compass, CheckSquare, Lock, LogOut } from 'lucide-react';
import { sileo } from 'sileo';
import type { Profile, ViewType } from '../types';
import { isPinProtected } from '../services/pinHash';
import styles from './AppLayout.module.css';

interface AppLayoutProps {
  profile: Profile;
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onLockProfile: () => void;
  children: React.ReactNode;
}

const layoutDateFormatter = new Intl.DateTimeFormat('es-CL', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const VIEW_TITLES: Record<ViewType, string> = {
  dashboard: 'Dashboard',
  agenda: 'Agenda',
  planner: 'Planner',
  todo: 'To-Do',
};

const NAV_ITEMS: { view: ViewType; label: string; icon: React.ReactNode }[] = [
  { view: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} aria-hidden="true" /> },
  { view: 'agenda', label: 'Agenda', icon: <Calendar size={20} aria-hidden="true" /> },
  { view: 'planner', label: 'Planner', icon: <Compass size={20} aria-hidden="true" /> },
  { view: 'todo', label: 'To-Do', icon: <CheckSquare size={20} aria-hidden="true" /> },
];

export const AppLayout: React.FC<AppLayoutProps> = ({
  profile,
  currentView,
  onViewChange,
  onLockProfile,
  children,
}) => {
  const [currentDate] = useState(() => layoutDateFormatter.format(new Date()));
  const isProtected = isPinProtected(profile);

  const handleLock = () => {
    sileo.info({ title: 'Sesión cerrada' });
    onLockProfile();
  };

  return (
    <div className={styles.appContainer}>
      {/* Enlace para saltar navegación (WCAG 2.4.1) */}
      <a href="#main-content" className={styles.skipLink}>
        Saltar al contenido principal
      </a>

      <aside className={styles.sidebar} aria-label="Barra lateral">
        <div className={styles.brand}>
          <h1 className={styles.brandLogo}>Espiralia</h1>
          <p className={styles.brandCaption}>Cuaderno personal</p>
        </div>

        <nav className={styles.navMenu} aria-label="Navegación principal">
          {NAV_ITEMS.map(item => {
            const isActive = currentView === item.view;
            return (
              <button
                type="button"
                key={item.view}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                onClick={() => onViewChange(item.view)}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.icon}
                <span className={styles.navLabel}>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userCard}>
            <div className={styles.userAvatar} aria-hidden="true">
              {profile.avatar}
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{profile.name}</span>
              <span className={styles.userMeta}>{isProtected ? 'Protegido por PIN' : 'Acceso libre'}</span>
            </div>
          </div>
        </div>
      </aside>

      <div className={styles.mainWrapper}>
        <header className={styles.topHeader}>
          <span className={styles.headerTitle}>{VIEW_TITLES[currentView]}</span>
          <div className={styles.headerRight}>
            <span className={styles.headerDate}>{currentDate}</span>
            <button type="button" className={styles.lockButton} onClick={handleLock}>
              {isProtected ? <Lock size={16} aria-hidden="true" /> : <LogOut size={16} aria-hidden="true" />}
              <span>{isProtected ? 'Bloquear perfil' : 'Cambiar perfil'}</span>
            </button>
          </div>
        </header>

        <main id="main-content" className={styles.contentArea} tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
};
```

- [ ] **Step 4: Rewrite the styles** — reemplazar todo `src/components/AppLayout.module.css` por:

```css
.appContainer {
  display: flex;
  min-height: 100vh;
  background-color: var(--color-canvas);
}

.skipLink {
  position: absolute;
  top: -9999px;
  left: 16px;
  z-index: 1000;
  padding: 10px 18px;
  border-radius: var(--radius-md);
  background-color: var(--color-primary);
  color: var(--color-on-primary);
  font-size: var(--text-button);
  font-weight: 600;
  text-decoration: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: top 0.15s ease;
}

.skipLink:focus-visible {
  top: 16px;
  outline: 2px solid var(--color-canvas);
  outline-offset: 2px;
}

/* ---------- Sidebar (desktop >= 1024 px) ---------- */

.sidebar {
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  width: 260px;
  height: 100vh;
  padding: 24px 16px;
  background-color: var(--color-surface-soft);
  border-right: 1px solid var(--color-hairline);
}

.brand {
  margin-bottom: 28px;
  padding: 0 12px;
}

.brandLogo {
  margin: 0;
  font-family: var(--font-primary);
  font-size: 28px;
  font-weight: 600;
  line-height: 1.15;
  color: var(--color-primary);
}

.brandCaption {
  margin: 4px 0 0;
  font-family: var(--font-family-3);
  font-size: var(--text-caption);
  color: var(--color-muted);
}

.navMenu {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
}

.navItem {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 44px;
  padding: 10px 14px;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-body);
  font-size: 15px;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.navItem:hover {
  background-color: var(--color-surface-card);
  color: var(--color-primary);
}

.navItemActive {
  background-color: var(--color-surface-card);
  color: var(--color-primary);
  font-weight: 600;
  box-shadow: inset 3px 0 0 var(--color-primary);
}

.sidebarFooter {
  padding-top: 16px;
  border-top: 1px solid var(--color-hairline);
}

.userCard {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  min-width: 0;
}

.userAvatar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-pill);
  background-color: var(--color-primary);
  color: var(--color-on-primary);
  font-size: 15px;
  font-weight: 600;
}

.userInfo {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.userName {
  overflow: hidden;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-ink);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.userMeta {
  font-family: var(--font-family-3);
  font-size: var(--text-caption);
  color: var(--color-muted);
}

/* ---------- Barra superior ---------- */

.mainWrapper {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.topHeader {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  height: 64px;
  padding: 0 32px;
  background-color: var(--color-canvas);
  border-bottom: 1px solid var(--color-hairline);
}

.headerTitle {
  overflow: hidden;
  font-family: var(--font-primary);
  font-size: 20px;
  font-weight: 600;
  color: var(--color-ink);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.headerRight {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 16px;
}

.headerDate {
  font-family: var(--font-family-3);
  font-size: var(--text-caption);
  color: var(--color-muted);
}

.lockButton {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 14px;
  border: 1px solid var(--color-hairline);
  border-radius: var(--radius-md);
  background-color: var(--color-canvas);
  color: var(--color-body);
  font-size: var(--text-body-sm);
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease;
}

.lockButton:hover {
  border-color: var(--color-primary-soft);
  color: var(--color-primary);
}

.navItem:focus-visible,
.lockButton:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.contentArea {
  flex: 1;
  padding: 32px;
  overflow-y: auto;
}

/* ---------- Tablet (769–1023 px): riel de íconos ---------- */

@media (min-width: 769px) and (max-width: 1023px) {
  .sidebar {
    width: 72px;
    padding: 24px 8px;
  }

  .brand {
    margin-bottom: 20px;
    padding: 0;
    text-align: center;
  }

  /* Ocultos visualmente, presentes para lectores de pantalla. */
  .brandLogo,
  .brandCaption,
  .navLabel,
  .userInfo {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
    border: 0;
  }

  .navItem {
    justify-content: center;
    padding: 10px 0;
  }

  .userCard {
    justify-content: center;
    padding: 8px 0;
  }

  .topHeader {
    padding: 0 24px;
  }

  .contentArea {
    padding: 24px;
  }
}

/* ---------- Móvil (<= 768 px): barra de navegación inferior ---------- */

@media (max-width: 768px) {
  .appContainer {
    flex-direction: column;
  }

  .sidebar {
    position: fixed;
    top: auto;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 40;
    flex-direction: row;
    align-items: center;
    width: 100%;
    height: 64px;
    padding: 0 8px;
    border-top: 1px solid var(--color-hairline);
    border-right: none;
  }

  .brand,
  .sidebarFooter {
    display: none;
  }

  .navMenu {
    flex-direction: row;
    justify-content: space-around;
    gap: 4px;
    width: 100%;
  }

  .navItem {
    flex-direction: column;
    justify-content: center;
    gap: 2px;
    min-height: 48px;
    padding: 6px 4px;
    font-size: 11px;
    text-align: center;
  }

  .navItemActive {
    box-shadow: inset 0 3px 0 var(--color-primary);
  }

  .topHeader {
    height: 56px;
    padding: 0 16px;
  }

  .headerDate {
    display: none;
  }

  .contentArea {
    padding: 16px;
    padding-bottom: 84px;
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm exec vitest run src/tests/AppLayout.test.tsx`
Expected: PASS (9 tests).

- [ ] **Step 6: Full gate**

Run: `pnpm exec vitest run && pnpm exec tsc -b && pnpm lint && pnpm build`
Expected: todo en verde. `App.test.tsx` busca `/cambiar perfil/i` con un perfil sin PIN, que sigue existiendo.

- [ ] **Step 7: Commit**

```bash
git add src/components/AppLayout.tsx src/components/AppLayout.module.css src/tests/AppLayout.test.tsx
git commit -m ":art: style(layout): aplicar layout de stitch con sidebar editorial y barra superior" -m "Sidebar con marca y tarjeta de perfil, riel de iconos en tablet, barra inferior en movil y boton de sesion unico que dice Bloquear perfil cuando hay PIN. Corrige el titulo To-Do. Sin controles de features inexistentes."
```

### Task 6: Verificación visual y merge

**Files:** ninguno, salvo que la verificación encuentre defectos. Cada fix es un ciclo TDD con su commit `:bug: fix(layout): …`.

**Interfaces:**
- Consumes: la rama completa.
- Produces: el checklist para la descripción del merge.

- [ ] **Step 1: Manual verification** — correr `pnpm dev`, crear o seleccionar un perfil de prueba sin PIN y otro con PIN `2468`, y revisar:
  1. **Desktop, 1440 px:** sidebar con "Espiralia" en serif y "Cuaderno personal"; ítem activo con barra izquierda magenta; barra superior con título, fecha y "Cambiar perfil" o "Bloquear perfil" según el perfil.
  2. **Tablet, 900 px** (iframe de 900 px del mismo origen si la ventana no se deja redimensionar): riel de 72 px solo con íconos; Tab recorre el riel con foco visible; un lector de pantalla o el árbol de accesibilidad conserva los nombres "Dashboard", "Agenda", "Planner" y "To-Do" (Review Focus 4).
  3. **Móvil, 320 px:** barra inferior; barra superior con título y botón de sesión sin desbordar (`scrollWidth` igual a `clientWidth`); un nombre de perfil de 40 caracteres se corta con elipsis (Review Focus 3).
  4. **Login → Dashboard:** se ve "Cargando espacio..." un instante, sin pantalla en blanco ni salto brusco (Review Focus 5).
  5. **"Bloquear perfil" con el perfil protegido:** vuelve al selector y pide PIN; `2468` desbloquea y `0000` muestra "PIN incorrecto".
  6. **Fuente:** en DevTools, Computed → `font-family` del logo resuelve a Georgia (no a Times New Roman).

- [ ] **Step 2: Final gate**

Run: `pnpm exec vitest run && pnpm exec tsc -b && pnpm lint && pnpm build`
Expected: todo en verde.

- [ ] **Step 3: Merge to develop**

```bash
git checkout develop
git merge --no-ff feature/stitch-layout -m ":twisted_rightwards_arrows: chore(layout): fusionar layout de stitch en develop"
pnpm exec vitest run
git branch -d feature/stitch-layout
```

Expected: merge sin conflictos, suite en verde y rama borrada. No se hace push sin aprobación (§12).
