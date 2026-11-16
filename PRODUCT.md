# Espiralia

Espiralia es un cuaderno personal en el navegador para reunir compromisos, bloques de enfoque, tareas y notas. Cada persona puede organizar su semana por perfil, revisar cómo va el día y conservar una copia de sus datos.

Este documento orienta decisiones de producto y de lenguaje para colaboradores y agentes. Describe lo que existe hoy; no es una lista de funciones prometidas.

## Para quién

Para quien necesita distinguir lo que tiene fecha, lo que debe hacer y el tiempo que quiere dedicarle. El estudio, el trabajo y los proyectos personales son usos posibles. Los ejemplos universitarios de la [web de Espiralia](https://marceloriv.github.io/Espiralia/) no definen un público exclusivo.

Esta descripción del público es una hipótesis de diseño, no una conclusión de investigación con usuarios.

## Propósito

Una cita va a la Agenda; una tarea, a la lista de pendientes; un bloque del Planner reserva tiempo para hacerla. Las notas guardan el contexto que no cabe en el calendario. El Dashboard reúne estas piezas para decidir por dónde empezar sin recorrer varias aplicaciones.

Espiralia debe facilitar la organización de un día real, incluso cuando cambian los planes o quedan cosas pendientes. No busca convertir cada momento en una métrica.

## Un día en el cuaderno

No hay una secuencia obligatoria. Una persona puede abrir el Dashboard para ver el día, revisar la Agenda, escoger una tarea y reservarle una franja en el Planner. Más tarde puede guardar una nota, consultar un PDF o registrar cómo se siente. Al terminar, puede escribir una reflexión y exportar un respaldo cuando lo necesite.

La distinción entre espacios debe permanecer clara: **Agenda** para compromisos con fecha, **Tareas** para pendientes, **Planner** para tiempo de enfoque y **Notas** para contexto.

## Qué ofrece hoy

| Espacio | Para qué sirve |
| --- | --- |
| Dashboard | Consultar el día, el foco, hábitos, energía y reflexión. |
| Agenda | Registrar eventos y consultar el calendario. |
| Planner | Organizar bloques de enfoque por día y franja horaria. |
| Tareas | Crear y seguir pendientes por área y prioridad. |
| Notas y Carpetas | Escribir apuntes y ordenar enlaces y archivos PDF. |
| Perfiles | Separar cuadernos locales; proteger el acceso a cada uno con un PIN opcional. |
| Integraciones y Bóveda Offline | Importar o exportar eventos en `.ics`; exportar y restaurar respaldos por perfil. |

## Datos y confianza

La aplicación no exige cuenta ni tiene backend propio. Los datos de organización se guardan en `localStorage`, separados por perfil; los PDF, en IndexedDB del mismo navegador.

El PIN limita el acceso desde la interfaz, **no cifra los datos locales**. No existe recuperación de PIN. Los respaldos exportados desde la pantalla de acceso son archivos JSON sin cifrar; dentro del cuaderno, la Bóveda Offline permite elegir un respaldo cifrado. Los respaldos pueden incluir los PDF, pero si falla la lectura de IndexedDB se exportan sin ellos. Conviene revisar la descarga y conservarla fuera del navegador.

Borrar los datos del sitio o perder el dispositivo puede eliminar el único ejemplar local. Espiralia no sincroniza dispositivos automáticamente ni garantiza abrirse desde cero sin conexión. Al hablar de privacidad, respaldo y disponibilidad, explicar estos límites con la misma claridad que las ventajas.

## Carácter y lenguaje

La web presenta un cuaderno de papelería editorial: pliegos para el trabajo principal, papeles de distintos tintes para reconocer cada espacio y una mesa cálida que deja leer. La metáfora ayuda a orientarse; no debe tapar datos ni crear tareas decorativas. Las reglas visuales y los tokens están en [DESIGN.md](DESIGN.md).

La voz habla de «tú», usa verbos concretos y deja espacio para volver mañana. Preferir «Crear tarea», «No hay eventos para este día» y «Exportar respaldo» a promesas de productividad, reproches por pendientes o garantías que el producto no puede cumplir.

## Principios para evolucionar

- Mantener reconocible el trabajo de cada espacio antes de añadir otro lugar donde guardar lo mismo.
- Ayudar a elegir qué atender, no premiar una jornada llena ni castigar una incompleta.
- Mostrar qué se guarda, qué se borra y qué sale del navegador antes de pedir una decisión irreversible.
- Preservar lectura, uso con teclado y adaptación a pantallas pequeñas también en estados vacíos y de error.

## Límites actuales

No hay colaboración en tiempo real, cuentas remotas, sincronización automática ni conexión directa con calendarios externos. Los archivos `.ics` se intercambian manualmente. Los perfiles son espacios locales, no cuentas de equipo.

Antes de proponer una función, preguntar qué problema cotidiano resuelve, si encaja en un espacio existente y qué cambia para los datos de la persona. Marcar cualquier idea futura como propuesta hasta que esté implementada y verificada.

## Documentos y referencias

- [README.md](README.md) explica cómo ejecutar el proyecto; [AGENTS.md](AGENTS.md) fija las convenciones de desarrollo.
- [PRODUCT.md](https://product.md/) inspira el formato breve de propósito, público, voz y límites. No se incluyen precios ni condiciones comerciales inexistentes.
- [Atlassian, requisitos de producto](https://www.atlassian.com/agile/product-management/requirements) orienta la separación entre necesidad, alcance y exclusiones.
- [Sunsama, planificación diaria](https://www.sunsama.com/features/daily-planning-and-shutdown) sirve de referencia para pensar apertura y cierre del día, no para copiar sus integraciones o sus rituales.
- [Ink & Switch, *Local-first software*](https://www.inkandswitch.com/essay/local-first/) plantea control y preservación de datos; Espiralia no implementa todas las propiedades de ese enfoque.
