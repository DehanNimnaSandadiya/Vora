# Vora Application Startup Script
Write-Host "🚀 Starting Vora Application..." -ForegroundColor Cyan
Write-Host ""

# Check if .env files exist
if (-not (Test-Path "server\.env")) {
    Write-Host "⚠️  WARNING: server/.env file not found!" -ForegroundColor Yellow
    Write-Host "   Please create server/.env with required environment variables" -ForegroundColor Gray
    Write-Host "   See QUICK_START.md for details" -ForegroundColor Gray
    Write-Host ""
}

if (-not (Test-Path "client\.env")) {
    Write-Host "ℹ️  INFO: client/.env not found (using defaults)" -ForegroundColor Blue
    Write-Host ""
}

# Start backend
Write-Host "🖥️  Starting Backend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\server'; node --watch server.js" -WindowStyle Normal

Start-Sleep -Seconds 3

# Start frontend
Write-Host "🖥️  Starting Frontend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\client'; pnpm dev" -WindowStyle Normal

Write-Host ""
Write-Host "⏳ Waiting for servers to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Check server status
Write-Host ""
Write-Host "📊 Checking Server Status..." -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

$backendReady = $false
$frontendReady = $false

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        $health = $response.Content | ConvertFrom-Json
        Write-Host "✅ Backend Server: RUNNING" -ForegroundColor Green
        Write-Host "   Health: $($health.status)" -ForegroundColor Gray
        Write-Host "   URL: http://localhost:5000" -ForegroundColor Gray
        $backendReady = $true
    }
} catch {
    Write-Host "⏳ Backend Server: Starting..." -ForegroundColor Yellow
    Write-Host "   (Check the backend window for MongoDB connection status)" -ForegroundColor Gray
}

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Frontend Server: RUNNING" -ForegroundColor Green
        Write-Host "   URL: http://localhost:5173" -ForegroundColor Gray
        $frontendReady = $true
    }
} catch {
    Write-Host "⏳ Frontend Server: Starting..." -ForegroundColor Yellow
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

if ($backendReady -and $frontendReady) {
    Write-Host "🎉 SUCCESS! Application is ready!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📱 Open your browser: http://localhost:5173" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "💡 Next Steps:" -ForegroundColor Yellow
    Write-Host "   1. Create an account or login" -ForegroundColor White
    Write-Host "   2. Create a study room" -ForegroundColor White
    Write-Host "   3. Test all features!" -ForegroundColor White
} else {
    Write-Host "⏳ Servers are starting in separate windows..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📱 Once ready, open: http://localhost:5173" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "💡 Make sure MongoDB is running:" -ForegroundColor Yellow
    Write-Host "   - Local: mongod" -ForegroundColor White
    Write-Host "   - Or update MONGO_URI in server/.env for MongoDB Atlas" -ForegroundColor White
}

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")







