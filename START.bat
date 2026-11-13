
@echo off
setlocal
cd /d "%~dp0"
title LinkShort - Start

echo.
echo ========================================
echo          LinkShort Launcher
echo ========================================
echo.

where node >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed.
    pause
    exit /b 1
)

where docker >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not installed.
    pause
    exit /b 1
)

docker info >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker Desktop is not running.
    echo Open Docker Desktop and try again.
    pause
    exit /b 1
)

if not exist "backend\.env" (
    echo ERROR: Run SETUP.bat first.
    pause
    exit /b 1
)

echo Checking PostgreSQL...
docker compose --env-file backend/.env up -d
if errorlevel 1 (
    echo ERROR: Could not start PostgreSQL.
    pause
    exit /b 1
)

echo.
echo Starting LinkShort...
echo.
echo Frontend: http://127.0.0.1:5173
echo Backend:  http://127.0.0.1:3000/api/health
echo.
echo Keep this window open while using the application.
echo Press Ctrl+C to stop the application.
echo.

call npm run dev

echo.
echo LinkShort has stopped.
pause
