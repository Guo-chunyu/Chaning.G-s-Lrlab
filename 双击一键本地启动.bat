@echo off
title Lightroom AI Grading Workspace Launcher

rem =====================================================================
rem 1. SAFE ADMINISTRATOR ELEVATION (Bypasses VBS and paren-bashing syntax errors)
rem =====================================================================
net session >nul 2>&1
if %errorlevel% equ 0 goto :gotAdmin

echo ==========================================================
echo  Requesting Administrator Privileges to avoid EPERM...
echo  (Please click "Yes" in the Windows system popup window)
echo ==========================================================
powershell -Command "Start-Process '%~f0' -Verb RunAs"
exit /b

:gotAdmin
cd /d "%~dp0"

rem =====================================================================
rem 2. ENVIRONMENT INITIALIZATION
rem =====================================================================
chcp 65001 >nul
set "PATH=%PATH%;C:\Program Files\nodejs;%APPDATA%\npm;C:\Program Files (x86)\nodejs"

echo ==========================================================
echo        Lightroom Neural Grading Workspace Launcher
echo ==========================================================
echo.

echo [1/3] Checking Node.js environment...
node -v >nul 2>&1
if %errorlevel% neq 0 goto :noNode

echo Success: Node.js is ready!
node -v
echo.

echo [2/3] Syncing and installing dependencies (npm install)...
echo (Using high-speed registry mirror...)
echo.

call npm config set registry https://registry.npmmirror.com
call npm install

if %errorlevel% neq 0 (
    echo Note: Some standard dependency warnings occurred, continuing to boot...
) else (
    echo Success: Dependencies successfully updated!
)
echo.

echo [3/3] Starting Local Server...
echo ==========================================================
echo  SERVER STANDBY AT: http://localhost:3000
echo  (Opening defaults web browser automatically in 3 seconds)
echo  CLOSING THIS WINDOW WILL SHUT DOWN THE BACKEND ENDPOINT
echo ==========================================================
echo.

rem Delayed non-blocking browser opener
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000"

rem Launch backend & Vite development lifecycle
call npm run dev

pause
exit /b

:noNode
echo.
echo ********************************************************
echo ERROR: Node.js was not detected in your system PATH!
echo ********************************************************
echo.
echo Since you've already installed Node.js, Windows simply needs to
echo refresh its environment variables.
echo.
echo HOW TO FIX:
echo 1. Close this window and RESTART your computer.
echo 2. Try launching this .bat file again.
echo.
pause
exit /b
