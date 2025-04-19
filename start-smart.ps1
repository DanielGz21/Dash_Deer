# === start-smart.ps1 ===
Write-Host "`n🚀 Iniciando Dashboard Profesional de Vuelos..."

# 1. Detectar si el puerto 3000 está libre
$puerto = 3000
$ocupado = netstat -ano | Select-String ":$puerto"

if ($ocupado) {
    $puerto = 3005
    Write-Host "⚠️  Puerto 3000 en uso. Usando puerto $puerto..."
} else {
    Write-Host "✅ Puerto $puerto libre."
}

# 2. Modificar el .env
$envPath = Join-Path $PSScriptRoot ".env"
if (Test-Path $envPath) {
    (Get-Content $envPath) -replace 'PORT=\\d+', "PORT=$puerto" | Set-Content $envPath
    Write-Host "🔧 .env actualizado a PORT=$puerto"
} else {
    "PORT=$puerto`nDB_HOST=localhost`nDB_USER=postgres`nDB_PASSWORD=tu_clave_aqui`nDB_NAME=dashboard_vuelos`nDB_PORT=5432`nJWT_SECRET=claveultrasecreta123" | Out-File $envPath -Encoding UTF8
    Write-Host "📝 .env creado"
}

# 3. Iniciar backend desde carpeta correcta
$backendPath = Join-Path $PSScriptRoot "backend"
Write-Host "▶️ Iniciando backend desde: $backendPath"
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "cd `"$backendPath`"; npm install; node server.js" -WindowStyle Normal

# 4. Abrir el frontend (login.html)
$frontendPath = Join-Path $PSScriptRoot "frontend\\login.html"
Start-Process $frontendPath
Write-Host "🌐 Abriendo Login en el navegador..."

Write-Host "`n✅ Todo listo. Dashboard ejecutándose en http://localhost:$puerto`n"
