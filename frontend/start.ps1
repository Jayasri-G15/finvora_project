# start.ps1 — Start Finvora AI frontend dev server
# Run from inside the frontend/ folder, or double-click start.bat

$ErrorActionPreference = "Stop"
Write-Host "=== Starting Finvora AI Frontend ===" -ForegroundColor Green
Write-Host "Dev server: http://localhost:3000"
Write-Host ""
Set-Location $PSScriptRoot
npm run dev
