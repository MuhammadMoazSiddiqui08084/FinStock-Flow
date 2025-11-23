# PowerShell script to start development servers for FinStock Flow
# This script starts all services: Frontend (Vite), Backend (Node), Python (Prophet)

Write-Host "🚀 Starting FinStock Flow Development Environment..." -ForegroundColor Green

# Check if Node modules are installed
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
}

if (-not (Test-Path "backend/node_modules")) {
    Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
    Set-Location backend
    npm install
    Set-Location ..
}

# Check if Python dependencies are installed
try {
    python -c "import fastapi" 2>$null
} catch {
    Write-Host "🐍 Installing Python dependencies..." -ForegroundColor Yellow
    Set-Location backend/py_forecast
    pip install -r ../requirements.txt
    Set-Location ../..
}

# Create necessary directories
New-Item -ItemType Directory -Force -Path "data" | Out-Null
New-Item -ItemType Directory -Force -Path "tmp" | Out-Null

# Start all services using concurrently
Write-Host "🎯 Starting all services..." -ForegroundColor Green
npm run dev

