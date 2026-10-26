# Espiralia

Espiralia es un cuaderno de productividad personal que vive en el navegador: agenda de eventos, planner semanal por franjas, lista de tareas y un dashboard que resume el día. Funciona sin cuenta y sin servidor.

## Privacidad

- Todo se guarda en el `localStorage` de este navegador, separado por perfil. No hay backend, ni telemetría, ni peticiones a dominios externos (las fuentes se sirven desde el propio sitio).
- Cada perfil puede protegerse con un PIN numérico opcional. El PIN se guarda con hash y sal, nunca en texto plano.
- **No existe recuperación de PIN.** Si se olvida, los datos de ese perfil no se pueden abrir sin borrarlo. Se recomienda hacer un respaldo desde la Bóveda Offline, con cifrado opcional (AES-GCM, clave derivada con PBKDF2).
- Borrar un perfil desde Ajustes elimina también sus eventos, bloques, tareas, notas, carpetas, enlaces y hábitos.

## Requisitos

- Node 24
- pnpm 10

## Comandos

```bash
# instalar dependencias
pnpm install
# levantar el entorno local de desarrollo
pnpm dev
# test completo
pnpm exec vitest run
# test acotado a un archivo
pnpm exec vitest run src/tests/<archivo>.test.tsx
# cobertura (umbral de 80% en líneas y ramas)
pnpm test:coverage
# linter
pnpm exec eslint .
# compilar el bundle de producción (valida tipos y build)
pnpm build
```

## Estructura

```text
src/
├── components/   # Vistas (Dashboard, Agenda, Planner, To-Do, Notas, Carpetas, Integraciones, Acceso, Landing) y AppLayout
├── routes/       # Rutas públicas y protegidas con react-router-dom (HashRouter)
├── services/     # StorageService con aislamiento por perfil, PIN con hash, respaldo cifrado
├── types/        # Modelos de datos
├── tests/        # Todas las pruebas (Vitest + Testing Library)
└── index.css     # Tokens de diseño
```

La dirección visual (papeles por módulo, tipografía, degradados por tinte) está en `DESIGN.md`. Las reglas del repositorio, de commits y de ramas están en `AGENTS.md`.

## Despliegue

El sitio es estático y se publica en GitHub Pages con `.github/workflows/deploy.yml` en cada push a `main`: instala con `pnpm install --frozen-lockfile`, corre eslint y las pruebas, compila con `base: './'` y publica. El enrutamiento usa `HashRouter`, por lo que no necesita reescritura de rutas en el servidor.

## Licencia

[MIT](LICENSE)
