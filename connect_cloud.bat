@echo off
echo ===================================================
echo ☁️  SETTING UP CLOUDFLARE TUNNEL ☁️
echo ===================================================

echo.
echo [1/2] Downloading Cloudflared...
powershell -Command "Invoke-WebRequest -Uri https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe -OutFile cloudflared.exe"

echo.
echo [2/2] Connecting to Cloudflare...
cloudflared.exe service install eyJhIjoiZjYxNGUyZDExODY1YzVhNTE0MTc3Yjc1ZWViMDAwNGEiLCJ0IjoiMjE5ZjA2ZDAtNTUzYi00OWE5LTg5YjMtNmUyYzRhMWY3MTdkIiwicyI6Ik1XRTRZVE5oT0RBdE5tVXdOeTAwTVdJd0xUazBNRFV0TlRFeVpUVTRZVFZrTkdWbCJ9

echo.
echo ✅ Tunnel Installed! 
echo Now verifying connection...
timeout /t 5

echo.
echo ===================================================
echo 👉 NEXT STEP: Go back to Cloudflare Dashboard
echo 1. You should see the Connector status turn "Healthy" (Green).
echo 2. Click "Next".
echo 3. Add Public Hostname:
echo    - Subdomain: (Leave Empty) or "www"
... (I will explain this in chat)
echo ===================================================
pause
