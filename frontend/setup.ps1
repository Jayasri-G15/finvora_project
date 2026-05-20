# setup.ps1 — Install Finvora AI frontend dependencies
# Run once from inside the frontend/ folder, or double-click setup.bat

$ErrorActionPreference = "Stop"
Write-Host "=== Finvora AI Frontend Setup ===" -ForegroundColor Cyan
Set-Location $PSScriptRoot

if (-not (Test-Path ".env.local")) {
    if (Test-Path ".env.local.example") {
        Copy-Item ".env.local.example" ".env.local"
        Write-Host "Created .env.local from example. Fill in your Supabase credentials." -ForegroundColor Yellow
    }
}

npm install

Write-Host ""
Write-Host "Done! Next steps:" -ForegroundColor Green
Write-Host "  1. Edit frontend/.env.local with your Supabase URL and anon key"
Write-Host "  2. Double-click start.bat to launch the dev server at http://localhost:3000"
