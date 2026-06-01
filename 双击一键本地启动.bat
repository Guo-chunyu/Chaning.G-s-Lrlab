@echo off
setlocal
title VOGUE-GENAI-V4 Local Launcher
chcp 65001 >nul

cd /d "%~dp0"

echo ==========================================================
echo        VOGUE-GENAI-V4 AI Lightroom Grading Workspace
echo ==========================================================
echo.
echo Project directory:
echo %CD%
echo.

echo [1/4] Checking Node.js...
where node >nul 2>nul
if errorlevel 1 goto :no_node
node -v
echo.

echo [2/4] Checking npm...
where npm >nul 2>nul
if errorlevel 1 goto :no_npm
call npm -v
echo.

echo [3/4] Installing dependencies if needed...
if not exist "node_modules" (
  echo node_modules not found. Running npm install...
  call npm install
  if errorlevel 1 goto :npm_install_failed
) else (
  echo node_modules already exists. Skipping npm install.
)
echo.

echo [4/4] Starting local server...
ping -n 1 127.0.0.1 >nul
powershell -NoProfile -ExecutionPolicy Bypass -Command "$c = New-Object Net.Sockets.TcpClient; try { $c.Connect('127.0.0.1', 3000); $c.Close(); exit 0 } catch { exit 1 }" >nul 2>nul
if not errorlevel 1 goto :server_already_running

echo ==========================================================
echo Open this URL in your browser:
echo http://localhost:3000
echo.
echo This window is the backend server. Keep it open while using the app.
echo Press Ctrl+C to stop the server.
echo ==========================================================
echo.

start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000"
call npm run dev

echo.
echo The server stopped.
pause
exit /b 0

:server_already_running
echo ==========================================================
echo Port 3000 is already running.
echo Opening the existing local app:
echo http://localhost:3000
echo.
echo If this is not your app, close the process using port 3000
echo and run this launcher again.
echo ==========================================================
start "" http://localhost:3000
pause
exit /b 0

:no_node
echo.
echo ERROR: Node.js was not found.
echo Please install Node.js, then reopen this launcher.
echo Download: https://nodejs.org/
pause
exit /b 1

:no_npm
echo.
echo ERROR: npm was not found.
echo Please reinstall Node.js and make sure npm is included.
pause
exit /b 1

:npm_install_failed
echo.
echo ERROR: npm install failed.
echo Check the error message above. Common causes:
echo - Network or registry connection issue
echo - No permission to write node_modules
echo - package-lock.json conflict
pause
exit /b 1
