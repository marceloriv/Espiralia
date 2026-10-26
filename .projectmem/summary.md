# projectmem - Espiralia

_Last updated: 2026-10-23_

## Project purpose
This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Recent issues
- [DONE] #0001 Verificado: el boton "Exportar Boveda Local (.json)" del login usa StorageService.exportVault (formato version "1.0", perfiles + data) y ninguna parte de la app lo importa; VaultModal solo importa ProfileBackup version 1. Ademas el toast "Para restablecer tu PIN, exporta y restaura tu boveda local" es falso: restoreProfile conserva pinHash/pinSalt y VaultModal solo se alcanza con el perfil ya desbloqueado, asi que no existe recuperacion de PIN. [src/components/ProfileGateView.tsx:213] -> Export del acceso ahora usa VaultService.exportProfile (un archivo por perfil, mismo formato que VaultModal) y el aviso de PIN olvidado dice que no existe recuperacion. Tests: ProfileGateView (ida y vuelta de restauracion, sin perfiles, aviso) y VaultModal en verde, tsc limpio. (fixed)

## Decisions
- Tap target mínimo 44x44px en controles interactivos (antislop R-03); sube el botón de 40px y el icono de 36px de DESIGN.md §5.A. Decide el dueño 2026-10-22. [DESIGN.md]
- D1 auditoria antislop: las funciones anunciadas que no existen (simulador CONASET, exportar .md, A4/A5, plantillas PDF) se quitaron de la UI en vez de construirse. [src/components/landing]
- D2 auditoria antislop: el contenido personal de ejemplo salio de las vistas; un perfil nuevo ve estados vacios. seedInitialProfileData no se llama desde la app y no se toco. [src/components]
- D3 y D5 auditoria antislop: sin numeros de version en la UI; logo unico monograma "Es" (landing, barra lateral, acceso). [DESIGN.md]
- D4 auditoria antislop: idioma unico espanol en la UI, salvo los aforismos de DESIGN.md. Guardian src/tests/antislopCopy.test.ts. [src/tests/antislopCopy.test.ts]
- D6 auditoria antislop: barra inferior movil con 4 destinos y boton "Mas" (Notas, Carpetas, Integraciones); useEscapeKey cierra el menu. [src/components/AppLayout.tsx]
- D7 auditoria antislop: dials de DESIGN.md ENERGY 2 / RHYTHM 2 / MOTION 1. [DESIGN.md]
- D8 auditoria antislop: tokens de texto AA (--color-muted #64625C, --color-text-success/teal/amber/primary-active/error) y --text-micro 11px; los tokens decorativos no se usan como color de texto. Guardian textTokensContrast. [src/index.css]
- Plan visual v2 (DESIGN.md §0): tres materiales (Pliego max 1 por vista, Papel rasgado max 4 por pantalla, Cartulina lisa), el color del tinte codifica el modulo, borde rasgado con clip-path CSS reutilizando bentoCardTorn (sin JS), paso 0 autoalojar fuentes porque index.html las carga de Google Fonts. Doble tinta solo en el numeral de la fecha. [DESIGN.md]
- Presupuesto de Papel por vista: 4 tarjetas y 3 piezas (papelBudget.test.ts). HabitModal y la tira de la landing conservan su recorte propio (no se unifican con Papel). Dashboard: Metricas, Horario, Recordatorios y Planner son Papel; Compromisos queda cartulina; el criterio de 600px en movil no se cumple (pliego a 2436px) y queda pendiente de decision. [DESIGN.md]
- Tintes de Papel: valores hex directos nivel "Fuerte" elegido por el dueño (saturación ≥30 %, luminosidad 85-91 %); salvia a verde amarillento #d0e6cc para no confundirse con turquesa. Dentro del Papel el texto secundario usa --papel-texto-* (6-7 % más oscuro) para mantener 4.5:1. Reemplaza el color-mix sobre acentos tenues. [src/index.css:181]

## Notes
- :sparkles: feat(landing): recalcular serenidad y modulos completados en tiempo real con aria-live
- :art: style(landing): implementar despliegue tactil de capas en abanico para bodegon de hero
- :art: style(landing): elevar diseno editorial de pilares, boletos de cadencia y certificado de soberania
- :art: style(dashboard): elevar diseno editorial con trazo caligrafico de tinta y solapas en acciones rapidas
- gotcha: hay personas usando la app (restriccion del dueño 2026-10-22): ningun cambio puede renombrar claves de localStorage ni cambiar formas o valores guardados (emoji de daily_energy, color de areas, folderId de tomos, tags). src/tests/legacyDataCompat.test.tsx fija este contrato. [src/services/storage.ts]
- gotcha: el hook GateGuard exige exponer hechos en la primera edicion de cada archivo (la primera llamada se rechaza, la segunda pasa); los hex decorativos de papeleria (~230) siguen fuera de tokens por decision; Chrome headless por CDP (puerto 9333, sin dependencias) sirve para verificar desborde y foco cuando MCP de navegador no responde. [anti-slop/audit-001-2026-10-22.md]
- Pendiente de rediseño: tras unificar el PIN en un diálogo (0dc8f1a), el panel derecho del login (ProfileGateView rightCol) queda casi vacío (solo post-it y sello LOCAL). Mock propone papeles rasgados con datos reales (navegador, PIN hash, respaldo bóveda). Mocks en scratchpad: mock-dashboard.html y mock-login.html con mock-papel.css/js. [src/components/ProfileGateView.tsx]
- gotcha: Newsreader solo estaba como respaldo dentro de var(--font-headline, ...) y esa variable siempre esta definida, asi que nunca se uso; los titulos se ven con Georgia porque Copernicus no se carga. Fuentes autoalojadas en src/assets/fonts (Caveat, Inter, JetBrains Mono, latin, 151 KB); src/tests/noExternalRequests.test.ts impide volver a enlazar dominios externos. [src/fonts.css]
- gotcha: en Windows el python lanzado desde Bash no ve /tmp (ruta de msys); para scripts auxiliares usar $(cygpath -m /tmp)/script.py. Los pendientes del paso 4 del plan visual están en .projectmem/plan.md. [.projectmem/plan.md]
- gotcha: tgrep (Microsoft, grep con índice de trigramas) está instalado en la máquina del usuario desde 2026-10-23 (winget install --id Microsoft.tgrep --exact, v1.2.3). Uso sin índice: tgrep --no-index -- "patrón" ruta. Con índice crea .tgrep/ (añadir al .gitignore). Útil en repos grandes; no está conectado a Claude Code como herramienta. [tgrep]

## Key files
- `src/components/AgendaView.tsx`
- `src/components/DashboardView.tsx`
- `src/components/IntegrationsView.tsx`
- `src/components/NotesView.tsx`
- `src/components/PlannerView.tsx`
- `src/components/TodoView.tsx`
- `src/components/landing/LandingFolderCards.tsx`
- `src/components/landing/LandingHeroCard.tsx`
- `src/components/landing/LandingIntentionWidget.tsx`
- `src/components/landing/LandingManifestoSection.tsx`
- `src/tests/DashboardView.test.tsx`
- `src/tests/LandingFolderCards.test.tsx`
- `src/tests/LandingHeroCard.test.tsx`
- `src/tests/LandingIntentionWidget.test.tsx`
- `src/tests/LandingManifestoSection.test.tsx`
- `src/tests/NotesView.test.tsx`
- `src/tests/PlannerView.test.tsx`
- `src/components/NotesView.module.css`
- `src/components/notes/BujoCard.module.css`
- `src/components/notes/BujoCard.tsx`

## Open questions
- None logged yet.
