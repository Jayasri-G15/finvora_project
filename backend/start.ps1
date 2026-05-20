# start.ps1 — Start FastAPI development server
# Run from inside the backend/ folder, or double-click start.bat

$ErrorActionPreference = "Stop"
$Dir = $PSScriptRoot
$uvicorn = Join-Path $Dir ".venv\Scripts\uvicorn.exe"

if (-not (Test-Path $uvicorn)) {
    Write-Error "Virtual environment not found. Run setup.bat first."
}

Write-Host "=== Starting Finvora AI Backend ===" -ForegroundColor Blue
Write-Host "API:  http://localhost:8000"
Write-Host "Docs: http://localhost:8000/docs"
Write-Host ""

Set-Location $Dir
& $uvicorn app.main:app --reload --port 8000
