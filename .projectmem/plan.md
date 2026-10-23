# Espiralia — plan

> Editable **intent** file: ideas + plans — what we *mean to do*.
> This is NOT the event log. `events.jsonl` -> `summary.md` records what
> *happened*; this file records what we *intend*. The AI reads it at
> session start and edits it directly (like `PROJECT_MAP.md`): add ideas
> and plans, check items off, move done work down to Shipped. Plans are
> never logged as events.

## Ideas
_Loose thoughts, not yet committed to._

## Active plans
_What we're working toward now. Use `- [ ]` / `- [x]` checklists._

### Plan visual, paso 4 (DESIGN.md §0.8): resto de vistas, una por commit
- [x] Agenda (`0a78dc5`)
- [x] Planner (`29641b0`)
- [x] To-Do (`2c43629`)
- [x] Notas (`ef826c8`)
- [x] Carpetas (`4010fd1`): Papel rosa en la carpeta abierta, la captura y los enlaces. Además se corrigió un desborde horizontal previo a 1440px (la rejilla `8fr 4fr` pasó a `minmax(0, ...)`).
- [x] Integraciones (`455ace8`): Papel turquesa en las tres tarjetas. Se quitó el índice lateral, el selector de rango sin efecto y los datos de ejemplo.
- [x] Cerrar el paso 4 en `DESIGN.md` (`1805dde`): actualizar la fila 4 de la tabla §0.8 con los seis commits y la fecha, y registrar los puntos de revisión con la persona dueña.

### Correcciones posteriores al paso 4 (hechas el 2026-10-23)
- [x] Planner en móvil: columnas de 190px en rejilla; Pliego abarca la semana en escritorio (`7ae97a8`).
- [x] Encabezado de `AppLayout` sin desborde entre 769px y 1280px (`0d86036`); botón de nueva nota como ícono en móvil, solapas de área de To-Do, días de repetición de Agenda a 44px y estilos del estado vacío de To-Do (`19ca737`).
- [x] Planner: hábitos y energía reales, mismos datos que Dashboard y To-Do (`a48476c`).
- [x] Notas: energía guardada, archivador sin ornamentos, solapas completas bajo el título y clip del post-it sin tapar el rótulo (`0cbbb60`, `76dd77a`).
- [x] Dashboard: bloques del domingo en "Planner de la semana" (`7dec07c`) y domingo visible en "Hábitos semanales" (`c913766`).
- [x] Integraciones: copia completa restaurable con `VaultService`, sin texto de ejemplo en el correo ni en Google Calendar, título sin chocar con el post-it (`94ff770`).
- [x] Carpetas: estado vacío en vez de carpetas curadas, solapas visibles (`4df7a04`); tabla con scroll y métricas del Dashboard sin cortarse (`db898a7`).
- [x] Barrido de CSS huérfano en las seis vistas (`c028a86`).
- [x] Medido a 375px exactos (emulación), 900px y 1440px en las siete vistas: sin desborde horizontal; a 375px sin controles menores de 44px.
- [x] Decidido: el post-it de Notas conserva su frase ("Claridad hoy, sosiego mañana") porque es el lema propio de esa vista; los aforismos de DESIGN.md §0.9 son los de Dashboard, Planner, To-Do y Acceso.

### Sigue pendiente
- [ ] Puntos de revisión con la persona dueña de los pasos 2 (Dashboard), 3 (Acceso) y 4 (resto de vistas).
- [ ] projectmem avisa "HIGH CHURN" en Dashboard (34 cambios en 30 días), Notas, To-Do, Agenda, Planner y Carpetas: revisar si es solo el plan visual o hay un problema de arquitectura en estas vistas.
- [ ] Skill `design-taste-frontend` instalado por copia en `~/.claude/skills/` (no se actualiza con `git pull`); revisar si choca con `antislop` y `DESIGN.md` antes de usarlo en el proyecto.
- [ ] Revisar con ojos humanos las capturas a 375px de Agenda y Dashboard: la medición automática no ve problemas, pero no sustituye mirar la pantalla.

## Next
_Queued, but not started._
- [ ] Paso 5 (tipografía nueva, §0.6) y paso 6 (pasar la página, §0.7) de `DESIGN.md` §0.8.

## Someday / maybe

## Shipped
_Move completed plans here so the top stays about the future._
