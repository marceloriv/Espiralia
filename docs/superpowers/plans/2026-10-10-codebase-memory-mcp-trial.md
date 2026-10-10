# Prueba de codebase-memory-mcp en Espiralia — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Instalar `codebase-memory-mcp` v0.11.0 solo para Claude Code en este proyecto, indexar Espiralia y compararlo con codegraph sobre las mismas preguntas, sin tocar el código del repo ni la configuración global de agentes.

**Architecture:** Binario nativo descargado a mano desde el release de GitHub, verificado por SHA-256 y extraído fuera del repo (`%LOCALAPPDATA%\Programs\codebase-memory-mcp`). **No** se ejecuta `install.ps1` ni el subcomando `install`: los dos escriben configuración MCP, skills, hooks e instrucciones en todos los agentes detectados. El servidor se registra con `claude mcp add --scope local`, que guarda la entrada en `~/.claude.json` asociada solo a este directorio, sin archivo en el repo. El índice vive en `~/.cache/codebase-memory-mcp` (default `CBM_CACHE_DIR`).

**Tech Stack:** codebase-memory-mcp v0.11.0 (release 2026-09-15, MIT), Claude Code CLI, PowerShell 7, Windows 11 x64.

**Spec:** sin spec escrito: la decisión salió de la conversación de brainstorming del 2026-10-10 (comparación con codegraph y graphify). Requisitos tomados de esa conversación: (1) es una prueba, no una adopción; (2) aislada a este proyecto; (3) no modificar config global de agentes; (4) comparar contra codegraph en el mismo repo.

## Global Constraints

- Versión fija: `v0.11.0`. No usar `latest` en ninguna URL.
- Asset: `codebase-memory-mcp-windows-amd64.zip` (sin variante `-ui`).
- Prohibido ejecutar `install.ps1`, `scripts/setup.ps1` o `codebase-memory-mcp install`: configuran 45 superficies de cliente globales (AGENTS.md §12, "preguntar primero").
- Scope MCP: `local`. Nunca `user` ni `project`: `project` crearía `.mcp.json` en el repo con una ruta absoluta de esta máquina.
- `CBM_ALLOWED_ROOT=C:\Users\Marcelo-HP\Desktop\Espiralia`: confina `index_repository` a este repo.
- Nada de exclusiones de Microsoft Defender. Si Defender marca `Trojan:Script/Wacatac.B!ml`, parar y verificar el hash contra `checksums.txt`; el README lo documenta como falso positivo, pero la decisión de restaurar el archivo es del usuario.
- Cero cambios en `src/`, `package.json`, `pnpm-lock.yaml`, `.gitignore` y archivos de config del repo. El único archivo que se committea es este plan.
- Commits: Conventional Commits + Gitmoji, en español y sin trailers de agente (AGENTS.md §11).

## Review Focus

1. **El instalador o el binario escriben config global igual.** Lo esperable es que `codebase-memory-mcp.exe` en modo servidor no toque `~/.claude/settings.json`, `~/.claude/CLAUDE.md`, `~/.claude/skills/` ni hooks. Se verifica con un hash de esos archivos antes y después (Task 1, paso 1, y Task 3, paso 5).
2. **El índice incluye `node_modules/` o `dist/`.** Lo esperable son solo archivos de `src/` y raíz. Se verifica en Task 3, paso 3: el conteo de archivos indexados tiene que estar cerca de los 69 trackeados, no en miles.
3. **El auto-sync escribe dentro del repo.** Lo esperable es que `git status --porcelain` quede idéntico antes y después. Se verifica en Task 3, paso 5.
4. **Conflicto entre las tools de codegraph y las de cbm en la misma sesión.** Lo esperable es que `/mcp` liste los dos servidores conectados y que cada uno responda a su propio prefijo de tool. Se verifica en Task 2, paso 4.
5. **Respuesta incorrecta pero segura sobre callers.** Lo esperable es que `deleteProfile` muestre como único caller `src/tests/storage.test.ts` (verdad verificada con Grep el 2026-10-10). Se verifica en Task 4, pregunta Q2.

---

### Task 1: Descargar, verificar y extraer el binario

**Files:**
- Create (fuera del repo): `%LOCALAPPDATA%\Programs\codebase-memory-mcp\codebase-memory-mcp.exe`
- Create (temporal): `%TEMP%\cbm-v0.11.0\` (zip + checksums)

**Interfaces:**
- Consumes: nada.
- Produces: `$CBM = "$env:LOCALAPPDATA\Programs\codebase-memory-mcp\codebase-memory-mcp.exe"`, un ejecutable que responde a `--version`.

- [ ] **Step 1: Snapshot de config global (línea base para Review Focus 1)**

```powershell
$snap = "$env:TEMP\cbm-v0.11.0"
New-Item -ItemType Directory -Force $snap | Out-Null
$targets = @("$HOME\.claude\settings.json", "$HOME\.claude\CLAUDE.md") + (Get-ChildItem "$HOME\.claude\skills" -Recurse -File -ErrorAction SilentlyContinue).FullName
$targets | Where-Object { Test-Path $_ } | ForEach-Object { Get-FileHash $_ } | Select-Object Path, Hash | Export-Csv "$snap\before.csv" -NoTypeInformation
(Import-Csv "$snap\before.csv").Count
```

Expected: un número > 0 (archivos registrados).

- [ ] **Step 2: Descargar zip y checksums del tag fijo**

```powershell
$base = "https://github.com/DeusData/codebase-memory-mcp/releases/download/v0.11.0"
Invoke-WebRequest "$base/codebase-memory-mcp-windows-amd64.zip" -OutFile "$snap\cbm.zip"
Invoke-WebRequest "$base/checksums.txt" -OutFile "$snap\checksums.txt"
```

Expected: los dos archivos existen y `cbm.zip` pesa > 1 MB.

- [ ] **Step 3: Verificar SHA-256 (falla primero si no coincide)**

```powershell
$expected = (Select-String -Path "$snap\checksums.txt" -Pattern 'codebase-memory-mcp-windows-amd64\.zip$').Line.Split(' ')[0].ToLower()
$actual = (Get-FileHash "$snap\cbm.zip" -Algorithm SHA256).Hash.ToLower()
if ($expected -ne $actual) { throw "SHA-256 no coincide: esperado $expected, obtenido $actual" }
"OK $actual"
```

Expected: `OK <hash>`. Si lanza la excepción, PARAR: no extraer y avisar al usuario.

- [ ] **Step 4: Extraer fuera del repo e inspeccionar contenido**

```powershell
$dest = "$env:LOCALAPPDATA\Programs\codebase-memory-mcp"
Expand-Archive "$snap\cbm.zip" -DestinationPath $dest -Force
Get-ChildItem $dest -Recurse | Select-Object FullName, Length
```

Expected: aparece `codebase-memory-mcp.exe`. Si el exe queda en una subcarpeta, ajustar `$CBM` a esa ruta en todas las tasks siguientes. **No** ejecutar el `install.ps1` incluido.

- [ ] **Step 5: Desbloquear y comprobar que corre**

```powershell
$CBM = "$env:LOCALAPPDATA\Programs\codebase-memory-mcp\codebase-memory-mcp.exe"
Unblock-File $CBM
& $CBM --version
```

Expected: imprime `0.11.0` (o `v0.11.0`). Si SmartScreen o Defender lo bloquean, PARAR y reportarlo (ver Global Constraints).

- [ ] **Step 6: Sin commit**: esta task no toca el repo.

---

### Task 2: Registrar el servidor MCP solo para este proyecto

**Files:**
- Modify (fuera del repo): `~/.claude.json`, en la entrada `projects["C:/Users/Marcelo-HP/Desktop/Espiralia"].mcpServers`, escrita por la CLI y no a mano.

**Interfaces:**
- Consumes: `$CBM` de Task 1.
- Produces: servidor MCP llamado `codebase-memory-mcp`, visible solo al abrir Claude Code en este directorio.

- [ ] **Step 1: Confirmar que no existe registro previo**

```powershell
claude mcp get codebase-memory-mcp
```

Expected: error o "not found".

- [ ] **Step 2: Registrar con scope local y raíz confinada**

```powershell
Set-Location C:\Users\Marcelo-HP\Desktop\Espiralia
claude mcp add --scope local -e CBM_ALLOWED_ROOT=C:\Users\Marcelo-HP\Desktop\Espiralia codebase-memory-mcp -- "$env:LOCALAPPDATA\Programs\codebase-memory-mcp\codebase-memory-mcp.exe"
```

- [ ] **Step 3: Verificar registro y que no apareció `.mcp.json`**

```powershell
claude mcp get codebase-memory-mcp
Test-Path C:\Users\Marcelo-HP\Desktop\Espiralia\.mcp.json
```

Expected: muestra `Scope: Local`, el comando con la ruta del exe y la env `CBM_ALLOWED_ROOT`. `Test-Path` devuelve `False`.

- [ ] **Step 4: Reiniciar Claude Code en el repo y comprobar conexión (Review Focus 4)**

El usuario sale de la sesión y vuelve a abrir `claude` en `C:\Users\Marcelo-HP\Desktop\Espiralia`. Luego ejecuta `/mcp`.

Expected: `codebase-memory-mcp` aparece como connected con 17 tools, y codegraph sigue connected.

- [ ] **Step 5: Sin commit**: esta task no toca el repo.

---

### Task 3: Indexar Espiralia y verificar aislamiento

**Files:**
- Create (fuera del repo): `~/.cache/codebase-memory-mcp/` (índice SQLite y logs)

**Interfaces:**
- Consumes: `$CBM`. Si es una shell nueva, redefinirlo: `$CBM = "$env:LOCALAPPDATA\Programs\codebase-memory-mcp\codebase-memory-mcp.exe"`.
- Produces: `$PROJ`, el nombre de proyecto que asigna cbm y que se lee de `list_projects` (no se adivina).

- [ ] **Step 1: Línea base del working tree (Review Focus 3)**

```powershell
Set-Location C:\Users\Marcelo-HP\Desktop\Espiralia
git status --porcelain | Out-File "$env:TEMP\cbm-v0.11.0\git-before.txt"
```

- [ ] **Step 2: Indexar por CLI**

```powershell
$env:CBM_ALLOWED_ROOT = "C:\Users\Marcelo-HP\Desktop\Espiralia"
& $CBM cli --progress index_repository --repo-path C:\Users\Marcelo-HP\Desktop\Espiralia
```

Expected: termina sin error en segundos (el repo tiene 69 archivos).

- [ ] **Step 3: Obtener nombre de proyecto y tamaño del grafo (Review Focus 2)**

```powershell
& $CBM cli --quiet list_projects --format json
```

Expected: un proyecto que apunta a la ruta de Espiralia. Guardar su nombre en `$PROJ`. Después:

```powershell
& $CBM cli get_graph_schema --project $PROJ --format json
```

Expected: el conteo de nodos `File` está en el orden de decenas (unos 69 o menos). Si son cientos o miles, entraron `node_modules/` o `dist/`: PARAR y reportar.

- [ ] **Step 4: Smoke query**

```powershell
& $CBM cli search_graph --project $PROJ --label Function --format json
```

Expected: aparecen funciones reales de `src/`, por ejemplo componentes de `src/components/` y métodos de `StorageService`.

- [ ] **Step 5: Verificar aislamiento (Review Focus 1 y 3)**

```powershell
git status --porcelain | Out-File "$env:TEMP\cbm-v0.11.0\git-after.txt"
Compare-Object (Get-Content "$env:TEMP\cbm-v0.11.0\git-before.txt") (Get-Content "$env:TEMP\cbm-v0.11.0\git-after.txt")
$before = Import-Csv "$env:TEMP\cbm-v0.11.0\before.csv"
$targets = @("$HOME\.claude\settings.json", "$HOME\.claude\CLAUDE.md") + (Get-ChildItem "$HOME\.claude\skills" -Recurse -File -ErrorAction SilentlyContinue).FullName
$after = $targets | Where-Object { Test-Path $_ } | ForEach-Object { Get-FileHash $_ } | Select-Object Path, Hash
Compare-Object $before $after -Property Path, Hash
```

Expected: los dos `Compare-Object` sin salida. Cualquier diferencia: PARAR, reportar qué archivo cambió y pasar a "Rollback".

- [ ] **Step 6: Sin commit**: esta task no toca el repo.

---

### Task 4: Comparación con codegraph

**Files:** ninguno. El resultado se reporta en el chat.

**Interfaces:**
- Consumes: sesión de Claude Code reiniciada (Task 2, paso 4) con los dos servidores conectados.
- Produces: tabla de resultados para decidir entre adoptar o desinstalar.

Cada pregunta se hace dos veces en la misma sesión: una restringida a codegraph (`codegraph_explore`) y otra restringida a cbm (`search_graph`, `trace_path`, `get_architecture` y `query_graph`, según la pregunta). Por cada corrida se registran: ¿es correcta según la verdad de referencia?, número de tool calls, y tokens aproximados de la respuesta de la tool.

| # | Pregunta | Verdad de referencia |
|---|---|---|
| Q1 | ¿Cómo aísla `StorageService` los datos por `profileId`? | `src/services/storage.ts` (leer el archivo para confirmar las claves) |
| Q2 | ¿Quién llama a `StorageService.deleteProfile`? | Solo `src/tests/storage.test.ts:45` (Grep 2026-10-10) |
| Q3 | ¿Qué rutas define la app y qué vista renderiza cada una? | `src/routes/` (leer el archivo para confirmar) |
| Q4 | ¿Qué funciones exportadas no tienen callers fuera de tests? | Grep manual de cada candidata que reporte cbm |
| Q5 | ¿Qué símbolos afecta el último commit (`339589a`)? | `git show --stat 339589a` |

- [ ] **Step 1: Correr Q1–Q5 con codegraph y anotar resultados**
- [ ] **Step 2: Correr Q1–Q5 con cbm y anotar resultados**
- [ ] **Step 3: Contrastar cada respuesta con su verdad de referencia**
- [ ] **Step 4: Reportar la tabla final al usuario con la recomendación: adoptar (y desinstalar codegraph) o desinstalar cbm**

---

### Task 5: Committear este plan

**Files:**
- Create: `docs/superpowers/plans/2026-10-10-codebase-memory-mcp-trial.md`

- [ ] **Step 1: Commit**

```bash
git add docs/superpowers/plans/2026-10-10-codebase-memory-mcp-trial.md
git commit -m ":memo: docs(config): planificar prueba aislada de codebase-memory-mcp"
```

---

## Rollback (si la prueba se descarta o falla el aislamiento)

```powershell
claude mcp remove codebase-memory-mcp --scope local
Remove-Item -Recurse -Force "$env:LOCALAPPDATA\Programs\codebase-memory-mcp"
Remove-Item -Recurse -Force "$HOME\.cache\codebase-memory-mcp"
Remove-Item -Recurse -Force "$env:TEMP\cbm-v0.11.0"
```

No usar `codebase-memory-mcp uninstall`: está pensado para revertir el `install` global que este plan nunca ejecuta. Antes de cada `Remove-Item`, confirmar con `Get-ChildItem` que la ruta es la esperada.
