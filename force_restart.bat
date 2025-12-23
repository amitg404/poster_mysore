@echo off
echo ===================================================
echo 💀 KILLING OLD SERVERS (Force Restart) 💀
echo ===================================================

taskkill /F /IM node.exe
taskkill /F /IM cloudflared.exe

echo.
echo ✅ All old processes killed.
echo.
echo ===================================================
echo 🚀 STARTING EVERYTHING FRESH 🚀
echo ===================================================

echo.
echo [1/3] Starting Backend Server...
start "Backend Server" cmd /k "cd backend && npm start"

echo.
echo [2/3] Starting Frontend Application (Port 4000)...
start "Frontend App" cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================
echo ✅ Servers Restarted! 
echo ℹ️  Your Cloudflare Tunnel should auto-reconnect.
echo ℹ️  If tunnel doesn't work, run connect_cloud.bat once more.
echo ===================================================
pause
