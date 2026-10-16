<#
.SYNOPSIS
    Levanta SonarQube y su base de datos PostgreSQL para el proyecto Espiralia.
.DESCRIPTION
    Utiliza el perfil `tools` de docker-compose.yml.
    Espera a que SonarQube complete su inicialización y healthcheck.
#>
$ErrorActionPreference = "Stop"

if (-not (Test-Path (Join-Path $PSScriptRoot ".env"))) {
    if (Test-Path (Join-Path $PSScriptRoot ".env.example")) {
        Write-Host "==> Creando .env desde .env.example..." -ForegroundColor Yellow
        Copy-Item (Join-Path $PSScriptRoot ".env.example") (Join-Path $PSScriptRoot ".env")
    } else {
        Write-Host "==> Falta .env en la raíz. Crearlo con: Copy-Item .env.example .env" -ForegroundColor Red
        exit 1
    }
}

Write-Host "==> Levantando SonarQube (perfil tools)..." -ForegroundColor Cyan
docker compose --project-directory $PSScriptRoot --profile tools up -d --wait sonarqube

if ($LASTEXITCODE -ne 0) {
    Write-Host "==> Falló el arranque de SonarQube. Revisar logs con: docker compose logs sonarqube" -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "==> SonarQube levantado y saludable en http://localhost:9000" -ForegroundColor Green
Write-Host "==> Para ejecutar el análisis estático, corre: .\run-sonar-scanner.ps1 o pnpm run sonar:scan" -ForegroundColor Yellow
