# F7 — Bóveda Offline: Exportar/Importar Perfil y Cifrado AES-GCM — Especificación de Diseño

**Fecha:** 2026-10-15  
**Estado:** Aprobado  
**Fase del Roadmap:** F7  
**Referencias:** `docs/superpowers/plans/2026-10-10-stitch-redesign-roadmap.md`, `AGENTS.md` (§10 Seguridad, §17.4 Cumplimiento Ley 21.719), `Feedback.txt`.

---

## 1. Contexto y Objetivos

Espiralia es una SPA 100% en cliente que almacena información sensible de productividad, estudio, notas terapéuticas y vínculos personales en el navegador del usuario. Para garantizar la soberanía de los datos, portabilidad y derechos ARCO (Acceso, Rectificación, Cancelación y Oposición según la Ley 21.719 de Protección de Datos Personales de Chile), la aplicación debe proveer una **Bóveda Offline**:

1. **Exportación completa de datos:** Generar un archivo JSON portátil con todos los registros del perfil activo (perfil, eventos, bloques de planner, metas, tareas, áreas, notas, carpetas y enlaces web).
2. **Cifrado de grado militar offline (opcional):** Permitir al usuario proteger su archivo de respaldo con una contraseña maestra utilizando criptografía nativa estándar de la plataforma (`window.crypto.subtle`), empleando PBKDF2 (100.000 iteraciones, HMAC-SHA-256) para derivar una clave simétrica AES-GCM de 256 bits y cifrar el contenido con etiqueta de autenticación (garantía de confidencialidad e integridad).
3. **Importación y restauración resiliente:** Cargar respaldos planos o cifrados, validar estrictamente la estructura (previniendo inyecciones o datos malformados) y permitir elegir entre **Sobrescribir el perfil actual** o **Importar como nuevo perfil**.
4. **Integración en UI:** Botón accesible "Bóveda Offline" en el pie de la barra lateral (`AppLayout`) que despliega `VaultModal`.

---

## 2. Requisitos Funcionales

### RF-01: Estructura del Respaldo (`ProfileBackup`)
El respaldo plano debe contener la versión del esquema, fecha de generación y todas las entidades asociadas al perfil:
```typescript
export interface ProfileBackup {
  version: 1;
  createdAt: string; // ISO 8601
  profile: Profile;
  events: AgendaEvent[];
  planner: PlannerBlock[];
  goals: Goal[];
  todos: TodoItem[];
  areas: Area[];
  notes: Note[];
  folders: Folder[];
  links: LinkItem[];
}
```

### RF-02: Cifrado con Web Crypto AES-GCM (`EncryptedVaultEnvelope`)
Cuando el usuario activa "Cifrar respaldo con contraseña", el payload de `ProfileBackup` se serializa y cifra:
- **Sal:** 16 bytes criptográficamente seguros (`crypto.getRandomValues(new Uint8Array(16))`).
- **Vector de Inicialización (IV):** 12 bytes criptográficamente seguros para AES-GCM.
- **KDF:** PBKDF2 con HMAC-SHA-256 y 100.000 iteraciones para derivar clave AES-GCM de 256 bits.
- **Envelope:**
```typescript
export interface EncryptedVaultEnvelope {
  version: 1;
  type: 'espiralia_vault';
  algorithm: 'AES-GCM';
  kdf: 'PBKDF2';
  hash: 'SHA-256';
  iterations: 100000;
  salt: string; // hex de 32 chars
  iv: string;   // hex de 24 chars
  ciphertext: string; // hex
}
```

### RF-03: Descarga Segura de Archivos
- Respaldo plano: `espiralia-<nombre-perfil>-<YYYY-MM-DD>.json` con tipo MIME `application/json`.
- Respaldo cifrado: `espiralia-<nombre-perfil>-<YYYY-MM-DD>.vault` con tipo MIME `application/octet-stream` o `application/json`.
- Se genera un Blob local y se dispara la descarga mediante un enlace `<a>` temporal sin enviar nada a redes externas.

### RF-04: Validación Estricta de Esquema en Importación
- No se confía en ningún archivo externo cargado por el usuario (§10 A08).
- Detección automática: si contiene `type: 'espiralia_vault'`, se trata como archivo cifrado y se solicita la contraseña.
- Si es JSON plano, se valida que contenga `version: 1`, objeto `profile` válido y arrays en todos los dominios esperados. Si falla la validación, se rechaza la importación con mensaje amigable sin alterar el estado del sistema.

### RF-05: Descifrado y Manejo de Errores
- Al ingresar la contraseña, se intenta descifrar con `crypto.subtle.decrypt`.
- Si la contraseña es incorrecta o el archivo fue alterado, la verificación del tag de autenticación de AES-GCM falla automáticamente arrojando un error criptográfico. El sistema captura la excepción y notifica: "Contraseña incorrecta o archivo de respaldo dañado".

### RF-06: Estrategias de Restauración
1. **Sobrescribir perfil actual:**
   - Limpia los registros actuales de eventos, planner, goals, todos, areas, notes, folders y links del perfil activo y los reemplaza con los datos del respaldo.
   - Mantiene el `profileId` activo para no romper referencias de sesión.
2. **Importar como nuevo perfil:**
   - Genera un nuevo `profileId` único (ej. `p-${Date.now()}`).
   - Asigna este nuevo `profileId` al perfil y a todos los elementos importados, remapeando referencias internas si fuera necesario.
   - Crea el nuevo perfil en la lista de perfiles disponibles y notifica al usuario.

### RF-07: Interfaz de Usuario y Accesibilidad
- Botón "Bóveda Offline" en el pie de la barra lateral, debajo o junto a "Ajustes & PIN".
- Modal accesible `VaultModal`:
  - `role="dialog"`, `aria-modal="true"`, foco administrado, tecla Escape y cierre con backdrop.
  - Dos pestañas: **Exportar Respaldo** y **Restaurar / Importar**.
  - Touch targets ≥ 44 px en todos los botones y campos interactivos.
  - Alertas informativas sin pantalla en blanco.

---

## 3. Seguridad y Cumplimiento

1. **Cero criptografía casera:** Implementación exclusiva con la API estándar W3C Web Crypto (`window.crypto.subtle`).
2. **Aislamiento estricto:** Los datos exportados corresponden única y exclusivamente al perfil autenticado.
3. **Validación contra manipulación:** AES-GCM provee cifrado autenticado (AEAD), detectando cualquier byte manipulado en tránsito o en almacenamiento local.
4. **Protección de contraseñas:** La contraseña de cifrado nunca se guarda en `localStorage` ni en memoria persistente; solo se utiliza efímeramente para derivar la clave en el instante de la operación.

---

## 4. Plan de Pruebas

- Unitarias de Criptografía (`src/tests/vaultCrypto.test.ts`):
  - Cifrado y descifrado exitoso de payloads con AES-GCM y PBKDF2.
  - Rechazo de contraseñas incorrectas con fallo limpio.
  - Detección de ciphertext alterado o corrupto.
- Unitarias de Validación y Restauración (`src/tests/vaultService.test.ts`):
  - Exportación completa de todos los dominios del perfil activo.
  - Validación de esquema aceptando respaldos válidos y rechazando malformados.
  - Restauración por sobrescritura de perfil existente.
  - Restauración como nuevo perfil con remapeo de `profileId`.
- Integración en UI (`src/tests/VaultModal.test.tsx`):
  - Renderizado del modal y cambio entre pestañas "Exportar" y "Restaurar".
  - Flujo de exportación con descarga de blob simulada.
  - Flujo de importación con vista previa de datos y selección de estrategia de restauración.
- Navegación y Layout (`src/tests/AppLayout.test.tsx`):
  - Inclusión del botón "Bóveda Offline" en el pie de la barra lateral.
