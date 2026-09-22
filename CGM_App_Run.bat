@echo off
title CGM Test Logger
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js is not installed. Install it from https://nodejs.org and run again.
    pause
    exit /b 1
)

if not exist "node_modules\" (
    echo [SETUP] Installing packages for the first run. This takes a few minutes...
    call npm install --no-audit --no-fund
    if errorlevel 1 (
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
)

set EXPO_NO_TELEMETRY=1
echo.
echo  Starting CGM Test Logger. The browser opens automatically.
echo  Keep this window open while testing. Close it to stop the app.
echo.
call npx expo start --web
pause
