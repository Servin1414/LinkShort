
@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"
title LinkShort - Setup

echo.
echo ========================================
echo          LinkShort Setup
echo ========================================
echo.

echo Checking required software...

where node >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed.
    echo Install Node.js LTS and try again.
    pause
    exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm was not found.
    pause
    exit /b 1
)

where docker >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not installed.
    echo Install Docker Desktop and try again.
    pause
    exit /b 1
)

echo.
echo [1/5] Checking Docker Desktop...
docker info >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker Desktop is not running.
    echo Open Docker Desktop and wait until it is ready.
    pause
    exit /b 1
)

echo.
echo [2/5] Installing project dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: npm install failed.
    pause
    exit /b 1
)

echo.
echo [3/5] Preparing backend environment...

if not exist "backend\.env" (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "$bytes = New-Object byte[] 48; $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create(); $rng.GetBytes($bytes); $rng.Dispose(); $secret = -join ($bytes | ForEach-Object { $_.ToString('x2') }); $lines = @('PORT=3000', 'DB_PASSWORD=linkshort_local_dev', 'DATABASE_URL=postgresql://linkshort:linkshort_local_dev@127.0.0.1:5432/linkshort?schema=public', ('JWT_SECRET=' + $secret)); Set-Content -Path 'backend\.env' -Value $lines -Encoding ASCII"
    if errorlevel 1 (
        echo ERROR: Could not create backend\.env.
        pause
        exit /b 1
    )
)

if not exist "backend\.env" (
    echo ERROR: backend\.env was not created.
    pause
    exit /b 1
)

echo.
echo [4/5] Starting PostgreSQL...
docker compose --env-file backend/.env up -d
if errorlevel 1 (
    echo ERROR: Could not start PostgreSQL.
    pause
    exit /b 1
)

echo.
echo Waiting for PostgreSQL to become healthy...

set "DB_READY="
for /L %%i in (1,1,30) do (
    set "DB_READY="
    for /f "delims=" %%s in ('docker inspect --format="{{.State.Health.Status}}" linkshort-postgres 2^>nul') do (
        set "DB_READY=%%s"
    )

    if "!DB_READY!"=="healthy" goto database_ready

    timeout /t 2 /nobreak >nul
)

echo ERROR: PostgreSQL did not become healthy in time.
echo.
echo Check the database logs with:
echo docker compose logs postgres
pause
exit /b 1

:database_ready
echo PostgreSQL is ready.

echo.
echo [5/5] Generating Prisma client...
call npm run db:generate
if errorlevel 1 (
    echo ERROR: Prisma generation failed.
    pause
    exit /b 1
)

echo.
echo Preparing database tables...
call npm run db:push
if errorlevel 1 (
    echo ERROR: Database preparation failed.
    pause
    exit /b 1
)

echo.
echo ========================================
echo       Setup completed successfully!
echo ========================================
echo.
echo Next step: Run START.bat
echo.
pause
exit /b 0
