# Especificación de Requisitos de Software (ERS) — Espiralia

## Control de Versiones

| Fecha | Revisión | Autor | Modificación |
| --- | --- | --- | --- |
| 2026-10-09 | 0.1 | Analista de Requisitos | Versión inicial de ERS basada en requerimiento funcional base |
| 2026-10-09 | 1.0 | Analista de Requisitos | Resolución de arquitectura: SPA pura, perfiles locales, Vitest + RTL, deploy GitHub Pages |

## 1. Introducción

### Propósito
Definir la Especificación de Requisitos de Software (ERS) para el sistema Espiralia, estableciendo los requerimientos funcionales, no funcionales y la arquitectura técnica de la plataforma web de organización personal centralizada.

### Ámbito
- **Hará:**
  - Proveer interfaz web para gestión de agenda (fechas y eventos).
  - Proveer funciones de planificación periódica (planner).
  - Gestionar listas y elementos de tareas pendientes (To-Do).
  - Centralizar la visualización y administración de estas herramientas en un dashboard unificado.
  - Administrar perfiles de usuario locales con PIN opcional para aislamiento de datos en el mismo navegador.
  - Almacenar toda la información de manera persistente en el cliente mediante IndexedDB / Web Storage.
- **No hará (en esta fase):**
  - Sincronización en la nube ni backend remoto multi-dispositivo.
  - Sincronización bidireccional con calendarios externos (Google Calendar, Outlook).
  - Funcionalidades colaborativas entre usuarios en red.
  - Aplicaciones móviles nativas (Android/iOS).
- **Beneficios:**
  - Máxima privacidad y velocidad: los datos no salen del dispositivo del usuario.
  - Disponibilidad offline inmediata como Progressive Web Application o SPA estática.
  - Cero costo operativo de servidores.

## 2. Descripción General

### Perspectiva del Producto
Espiralia es una aplicación web autónoma (SPA) basada en React y TypeScript montada sobre Vite, con almacenamiento 100% en el lado del cliente (IndexedDB / LocalStorage) y desplegada en infraestructura estática (GitHub Pages).

### Funciones del Producto
- **Gestión de Perfiles Locales:** Creación, cambio y bloqueo por PIN de perfiles de usuario locales.
- **Agenda:** Creación, edición, reprogramación y visualización de eventos por fecha y hora.
- **Planner:** Organización por bloques temporales (rutinas, metas semanales y mensuales) con priorización.
- **To-Do:** Registro, categorización por listas/etiquetas y seguimiento de estado de tareas pendientes.
- **Dashboard Centralizado:** Vista resumen que unifica eventos del día, plan activo y tareas críticas.

### Roles de Usuarios
- **Usuario de Perfil:** Persona que utiliza un perfil local específico para gestionar su agenda, planificación y tareas.
- **Invitado / Perfil Predeterminado:** Perfil inicial creado por defecto al ingresar por primera vez a la plataforma.

### Restricciones
- Plataforma basada exclusivamente en tecnologías web frontend cliente (React, TypeScript, Vite).
- Sin persistencia en la nube en esta fase; la pérdida del almacenamiento del navegador implica pérdida de datos si no se exporta.
- Compatibilidad mínima con navegadores modernos (Chrome 100+, Firefox 100+, Safari 15+, Edge 100+).

### Suposiciones y Dependencias
- El navegador del usuario cuenta con soporte y cuota disponible para IndexedDB y LocalStorage.
- Dependencia del servicio GitHub Pages y GitHub Actions para el flujo de build y distribución estática.

### Requisitos Futuros
- Mecanismo de exportación e importación de copias de seguridad (JSON / iCal).
- Opción de habilitar backend sincronizado o almacenamiento en nube opcional.
- Soporte para notificaciones locales del navegador.

## 3. Requisitos Específicos

### Interfaces
- **Interfaz de Usuario:** Interfaz gráfica web responsiva con navegación principal entre Dashboard, Agenda, Planner, To-Do y Selector de Perfiles.
- **Interfaz de Hardware:** Dispositivos móviles, tablets y de escritorio con navegador web estándar.
- **Interfaz de Software:** Navegador web moderno con API IndexedDB y Web Storage activadas.

### Requisitos Funcionales por Módulo

#### Módulo de Perfiles Locales (MS-Perfiles-Client)
- **RF-1 Creación y selección de perfiles:** El sistema debe permitir crear múltiples perfiles locales asignando un nombre y avatar representativo.
- **RF-2 Protección por PIN:** El sistema debe permitir configurar opcionalmente un PIN de 4 a 6 dígitos para acceder a un perfil específico.
- **RF-3 Aislamiento de datos:** El sistema debe particionar la persistencia en IndexedDB por identificador de perfil para evitar mezcla de información entre usuarios del mismo equipo.

#### Módulo Agenda (MS-Agenda-Client)
- **RF-4 Gestión de eventos de agenda:** El sistema debe permitir crear, editar, listar y eliminar eventos asociados a una fecha y hora.
- **RF-5 Visualización de agenda:** El sistema debe permitir visualizar eventos en modalidades mensual, semanal y diaria.

#### Módulo Planner (MS-Planner-Client)
- **RF-6 Planificación periódica:** El sistema debe permitir estructurar bloques de tiempo y metas periódicas (semanal/mensual).
- **RF-7 Asignación de prioridades:** El sistema debe permitir categorizar y ordenar los bloques de planificación por nivel de prioridad.

#### Módulo To-Do (MS-Todo-Client)
- **RF-8 Gestión de tareas pendientes:** El sistema debe permitir registrar, editar y eliminar tareas individuales.
- **RF-9 Estado de tareas:** El sistema debe permitir cambiar el estado de las tareas entre pendiente, en progreso y completada.
- **RF-10 Categorización y etiquetas:** El sistema debe permitir agrupar tareas en listas y asignarles etiquetas.

#### Módulo Transversal / Dashboard (MS-Core-Client)
- **RF-Transversal-1 Centralización de información:** El sistema debe consolidar en un dashboard inicial los eventos del día en curso, el plan activo y las tareas prioritarias.
- **RF-Transversal-2 Persistencia reactiva:** Toda modificación de estado en cualquier módulo debe persistirse automáticamente en IndexedDB sin requerir guardado manual.

### Requisitos No Funcionales

| Id | Nombre Corto | Descripción | Atributo de Calidad |
| --- | --- | --- | --- |
| RNF-1 | Tiempo de Carga Inicial | El bundle inicial de la SPA debe cargar y renderizar en menos de 1.5 segundos sobre conexiones 4G estándar. | Rendimiento |
| RNF-2 | Transición entre Vistas | El cambio de ruta interna entre módulos debe completarse en menos de 100 ms sin peticiones de red. | Rendimiento |
| RNF-3 | Tipado Estricto | El 100% de la base de código debe compilar con `strict: true` en TypeScript sin advertencias (`noImplicitAny`, etc.). | Mantenibilidad |
| RNF-4 | Cobertura de Pruebas | Los stores de lógica de negocio y utilidades críticas deben mantener una cobertura mínima del 80% con Vitest. | Calidad |
| RNF-5 | Privacidad de Datos | Ningún dato personal, evento o tarea debe transmitirse fuera del navegador del usuario. | Seguridad / Privacidad |
| RNF-6 | Usabilidad y Responsividad | La interfaz debe adaptarse a anchos de pantalla desde 360px hasta 4K con controles táctiles accesibles (mínimo 44x44px). | Usabilidad |
| RNF-7 | Integridad de Persistencia | Las operaciones sobre IndexedDB deben utilizar transacciones atómicas para prevenir estados corruptos. | Confiabilidad |

### Otros Requisitos
- **Privacidad Local:** Cumple por diseño con principios de minimización de datos (RGPD / Ley 21.719 Chile), al no existir recolección ni tratamiento en servidores remotos.

### Patrones de Diseño
- **Repository / Data Access Layer:** Abstracción sobre IndexedDB para aislar los componentes de UI del motor de persistencia subyacente.
- **State Store Pattern (Zustand / Redux Toolkit o Context + Reducer):** Gestión de estado reactivo y predecible por cada dominio funcional.
- **Compound Components:** Componentes de interfaz desacoplados y componibles para calendarios y listas.

### Estrategia de Branching
- Modelo Git Flow simplificado:
  - Rama `main`: código productivo listo para despliegue automático en GitHub Pages.
  - Rama `develop`: integración continua de funcionalidades completadas.
  - Ramas `feature/<nombre>`: desarrollo aislado de cada historia o módulo.

## 4. Arquitectura de Software

### Frontend
- **Framework & Runtime:** React 18+ con TypeScript ejecutado en cliente.
- **Build Tool:** Vite para compilación ultrarrápida y optimización de assets estáticos.
- **Routing:** React Router DOM para navegación cliente (`/`, `/agenda`, `/planner`, `/todo`, `/profiles`).
- **Persistencia:** Capa de almacenamiento local montada sobre IndexedDB (usando librería ligera tipo `idb` o `Dexie.js`) y LocalStorage para preferencias globales.

### BFF (Backend for Frontend)
*(No aplica: arquitectura 100% client-side sin capa intermedia)*

### Backend / Microservicios con Endpoints
*(No aplica: la arquitectura opera sin backend distribuido en esta versión; los dominios funcionales operan como módulos aislados en el cliente)*

### Estrategia de Actualización entre Bases de Datos
- Las transacciones se realizan directamente sobre las object stores de IndexedDB en el navegador del usuario, indexadas por `profileId`. No existe reconciliación multi-servidor al no haber red distribuida.

## 5. Matriz de Herramientas y Justificación Técnica

### Infraestructura y Orquestación
| Herramienta | Rol en la Solución | Justificación Técnica |
| --- | --- | --- |
| GitHub Pages | Alojamiento web estático | Servicio gratuito, confiable y con soporte nativo de HTTPS para servir los bundles estáticos generados por Vite. |
| GitHub Actions | CI/CD y despliegue continuo | Automatiza la ejecución de linters, tests con Vitest y el deploy a la rama `gh-pages` con cada push a `main`. |

### Desarrollo y Lenguajes
| Herramienta | Rol en la Solución | Justificación Técnica |
| --- | --- | --- |
| React | Biblioteca de UI | Permite construcción modular declarativa de componentes y manejo eficiente de re-renderizado mediante Virtual DOM. |
| TypeScript | Lenguaje tipado | Proporciona contratos estáticos estrictos para modelos de datos (Eventos, Tareas, Planes, Perfiles), reduciendo drásticamente errores en tiempo de ejecución. |
| Vite | Empaquetador y dev server | Provee Hot Module Replacement (HMR) casi instantáneo y optimización de chunks estáticos mediante Rollup para producción. |

### Comunicación y Persistencia
| Herramienta | Rol en la Solución | Justificación Técnica |
| --- | --- | --- |
| IndexedDB (`idb` o `Dexie.js`) | Motor de persistencia principal | Almacenamiento estructurado en cliente con soporte de transacciones, índices y alta capacidad de cuota, superando el límite de 5MB de LocalStorage. |
| Web Storage API (LocalStorage) | Almacenamiento de preferencias | Almacena configuraciones ligeras como el último `profileId` activo o preferencia de tema visual (claro/oscuro). |

### Calidad y Observabilidad
| Herramienta | Rol en la Solución | Justificación Técnica |
| --- | --- | --- |
| Vitest | Framework de pruebas unitarias | Integración nativa con Vite, arranque rápido y soporte directo de TypeScript sin necesidad de transformaciones pesadas. |
| React Testing Library | Pruebas de integración de UI | Valida el comportamiento de componentes simulando la interacción real del usuario según buenas prácticas de accesibilidad. |
| ESLint + Prettier | Linter y formateador | Garantiza consistencia estilística y previene antipatrones de código en todo el equipo de desarrollo. |

## 6. Pruebas y Cobertura de Calidad

- **Pirámide de Pruebas:**
  - **Pruebas Unitarias:** Cobertura de funciones puras, utilidades de fechas/calendarios y lógica de cálculo de prioridades en el planner.
  - **Pruebas de Integración:** Verificación de stores de estado combinados con la capa de persistencia simulada de IndexedDB (`fake-indexeddb`).
  - **Pruebas de Componentes:** Renderizado y flujos de usuario (creación de tarea, edición de evento, cambio de perfil) usando React Testing Library.
- **Meta de Cobertura:** Cobertura mínima del 80% en módulos de lógica de negocio y repositorios de datos locales.

## 7. Evaluación Ética y Técnica
- **Sostenibilidad:** Cero huella de carbono asociada a servidores backend o bases de datos dedicadas en constante ejecución; todo el cómputo es local en el dispositivo del usuario.
- **Privacidad Radical:** Privacidad por diseño (Privacy by Design); no existe riesgo de filtración de datos en tránsito o brechas de servidores centrales, ya que la información nunca sale del navegador.
- **Equidad y Accesibilidad:** Implementación con etiquetas semánticas y compatibilidad con lectores de pantalla (roles ARIA, contraste cromático WCAG 2.2 AA).

## 8. Deuda Técnica

| Id | Nombre Corto | Descripción |
| --- | --- | --- |
| TD-01 | Aislamiento por PIN no criptográfico | El PIN local protege el cambio visual de perfiles, pero los datos en IndexedDB no están cifrados en reposo dentro del equipo local. |
| TD-02 | Sin sincronización multi-dispositivo | Los datos creados en un dispositivo no se reflejan en otros dispositivos del usuario al no existir backend ni nube. |
| TD-03 | Riesgo de pérdida por limpieza de caché | Si el usuario limpia los datos de navegación del sitio sin exportar copia, se pierde el historial completo de agenda y tareas. |

## Supuestos
- **S-1:** El usuario opera principalmente en un dispositivo de confianza donde no requiere sincronización inmediata con otros equipos.
- **S-2:** El repositorio de código estará alojado en GitHub para aprovechar GitHub Actions y GitHub Pages.

## Dudas
*(Todas las dudas iniciales de arquitectura, autenticación, pruebas y despliegue han sido resueltas en la versión 1.0)*
