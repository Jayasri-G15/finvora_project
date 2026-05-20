# setup.ps1 — Run once to set up the backend Python environment
# Run from inside the backend/ folder, or double-click setup.bat

$ErrorActionPreference = "Stop"
$Dir = $PSScriptRoot

Write-Host "=== Finvora AI Backend Setup ===" -ForegroundColor Cyan

# Check Python
$py = python --version 2>&1
Write-Host "Using: $py"

# Create virtual environment
$venv = Join-Path $Dir ".venv"
if (-not (Test-Path $venv)) {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv $venv
    Write-Host "Created .venv" -ForegroundColor Green
} else {
    Write-Host "Virtual environment already exists." -ForegroundColor DarkGray
}

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
$pip = Join-Path $venv "Scripts\pip.exe"
& $pip install --upgrade pip --quiet
& $pip install -r (Join-Path $Dir "requirements.txt")

# Create uploads directory
$uploads = Join-Path $Dir "uploads"
if (-not (Test-Path $uploads)) {
    New-Item -ItemType Directory -Path $uploads | Out-Null
    Write-Host "Created uploads/" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Setup Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Copy .env.example -> .env and fill in your credentials"
Write-Host "  2. Run Alembic migration:"
Write-Host "     .\.venv\Scripts\python.exe -m alembic upgrade head"
Write-Host "  3. Double-click start.bat to launch the API"
