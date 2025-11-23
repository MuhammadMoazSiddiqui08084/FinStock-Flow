# Start Python Prophet service (PowerShell)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location "$ScriptDir\py_forecast"

# Check if Python is available
$PythonCmd = $null
if (Get-Command python3 -ErrorAction SilentlyContinue) {
    $PythonCmd = "python3"
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
    $PythonCmd = "python"
} else {
    Write-Host "❌ Python not found. Please install Python 3.9+" -ForegroundColor Red
    exit 1
}

# Check if dependencies are installed
try {
    & $PythonCmd -c "import fastapi" 2>$null
} catch {
    Write-Host "📦 Installing Python dependencies..." -ForegroundColor Yellow
    pip install -r ..\requirements.txt
    if ($LASTEXITCODE -ne 0) {
        pip3 install -r ..\requirements.txt
    }
}

# Start the service
Write-Host "🚀 Starting Prophet service..." -ForegroundColor Green
& $PythonCmd server.py

