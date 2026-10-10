# Changelog

Todas las modificaciones notables de este proyecto se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [0.1.1] - 2026-10-09

### Fixed

- Actualización de versión de Node.js a 22 (LTS) en workflow de GitHub Actions para compatibilidad de WebIDL (`markAsUncloneable`) en runtime de jsdom y undici.

## [0.1.0] - 2026-10-09

### Added

- Arquitectura Single Page Application cliente con React 19, TypeScript y Vite.
- Sistema de perfiles locales independientes con aislamiento en localStorage.
- Protección opcional de perfil mediante PIN numérico con teclado integrado.
- Vista de Agenda con vista de calendario mensual y agenda diaria de eventos.
- Vista de Planner con división por franjas horarias y gestión de bloques de enfoque.
- Vista de Tareas (To-Do) con filtros por estado, selector de prioridades y mensajes explicativos contextuales para listas vacías.
- Dashboard centralizado con métricas de productividad y accesos directos.
- Sistema de navegación responsiva con sidebar de escritorio y barra inferior para dispositivos móviles.
- Enrutamiento modular con HashRouter (`react-router-dom`) para compatibilidad completa con despliegues estáticos.
- Tokens de diseño globales con paleta cálida y soporte de alto contraste accesible (WCAG AA).

### Changed

- Optimización táctil con áreas de interacción de 44px mínimo en botones de acción y controles móviles.
- Reflow adaptativo y apilamiento vertical en vistas de Agenda y Planner para pantallas estrechas.
- Sincronización y persistencia de estado reactivo mediante StorageService aislado por identificador de perfil.

### Fixed

- Eliminación de dependencias y referencias de importación no utilizadas para compilación estricta de TypeScript.
- Manejo seguro de cuota y serialización JSON ante excepciones de almacenamiento local.

### Operations

- Pipeline de CI/CD automatizado en GitHub Actions (`.github/workflows/deploy.yml`) para despliegue continuo en GitHub Pages.
- Suite de pruebas automatizadas con Vitest y Testing Library React con cobertura integral en `src/tests/`.
- Configuración de resolución de rutas relativas en Vite para entornos con subruta.
