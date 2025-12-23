@echo off
echo ===================================================
echo 🚀 STARTING POSTER MYSORE SERVERS 🚀
echo ===================================================

echo.
echo [1/2] Starting Backend Server...
start "Backend Server" cmd /k "cd backend && npm start"

echo.
echo [2/3] Starting Frontend Application (Port 4000)...
start "Frontend App" cmd /k "cd frontend && npm run dev"

echo.
echo [3/3] Starting Order Listener...
start "Order Listener" cmd /k "cd backend && node order_listener.js"

echo.
echo ===================================================
echo ✅ Servers Started! 
echo.
echo ℹ️  Your Cloudflare Tunnel is running in background.
echo ℹ️  Visit: https://postershop.store
echo ===================================================
pause
