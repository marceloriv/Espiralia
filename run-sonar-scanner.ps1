<#
.SYNOPSIS
    Ejecuta el análisis de código con Sonar-Scanner CLI para Espiralia.
.DESCRIPTION
    Ejecuta el contenedor sonar-scanner del perfil `tools`, montando el código fuente
    y la configuración sonar-project.properties.
#>
$ErrorActionPreference = "Stop"

Write-Host "==> Ejecutando Sonar-Scanner CLI..." -ForegroundColor Cyan
docker compose --project-directory $PSScriptRoot --profile tools run --rm sonar-scanner

if ($LASTEXITCODE -ne 0) {
    Write-Host "==> Falló la ejecución del scanner (código $LASTEXITCODE)." -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "==> Análisis completado con éxito. Revisa los resultados en http://localhost:9000/dashboard?id=espiralia" -ForegroundColor Green
