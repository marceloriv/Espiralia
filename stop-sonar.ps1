<#
.SYNOPSIS
    Detiene los servicios de SonarQube y conserva los volúmenes de datos.
#>
$ErrorActionPreference = "Stop"

Write-Host "==> Deteniendo servicios de SonarQube..." -ForegroundColor Yellow
docker compose --project-directory $PSScriptRoot --profile tools stop sonarqube sonarqube-db

if ($LASTEXITCODE -ne 0) {
    Write-Host "==> Falló la detención de SonarQube (código $LASTEXITCODE)." -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "==> SonarQube detenido. Datos conservados en los volúmenes Docker." -ForegroundColor Green
