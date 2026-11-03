@echo off
setlocal enabledelayedexpansion
title DeepSeek Harness

:: Navigate to script directory
cd /d "%~dp0"

echo ===================================================
echo                 DeepSeek Harness Launcher
echo ===================================================
echo.

:: 1. Check if Node.js is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js was not found on your computer.
    echo Please download and install Node.js [v22 or higher] from:
    echo https://nodejs.org
    echo.
    pause
    exit /b 1
)

:: 2. Resolve the pnpm runner. The npm global bin directory is not always on
::    PATH, so fall back to its absolute shim before reaching for npx. The PATH
::    prepend matters for CHILD processes too: the repository build shells out
::    to bare `pnpm` internally (scripts/build.ts runs build:lib:host).
if exist "%APPDATA%\npm\pnpm.cmd" set "PATH=%APPDATA%\npm;%PATH%"
set "PNPM_CMD=pnpm"
where pnpm >nul 2>&1
if %errorlevel% neq 0 (
    if exist "%APPDATA%\npm\pnpm.cmd" (
        set "PNPM_CMD=%APPDATA%\npm\pnpm.cmd"
    ) else (
        set "PNPM_CMD=npx pnpm"
    )
)

:: 3. Keep dependencies in sync with the lockfile. This is idempotent and fast
::    when the tree is already current, and it repairs a node_modules left in a
::    stale state by an interrupted install.
echo [INFO] Syncing dependencies...
call %PNPM_CMD% install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies.
    echo.
    pause
    exit /b 1
)

:: 4. Build the artifacts the Web UI serves: the CLI, the client plugin bundles,
::    and the frontend dist. A missing dist or record means a stale or never-built tree.
set "DO_BUILD=0"
if "%~1"=="--build" (
    set "DO_BUILD=1"
    shift
)
if "%~1"=="-b" (
    set "DO_BUILD=1"
    shift
)
if not exist "apps\web\dist\index.html" set "DO_BUILD=1"
if not exist ".dsh-build\client-build-environment.json" set "DO_BUILD=1"

if "!DO_BUILD!"=="1" (
    echo [INFO] Building project artifacts...
    call %PNPM_CMD% run build:artifacts
    if %errorlevel% neq 0 (
        echo [ERROR] Build step failed.
        echo.
        pause
        exit /b 1
    )
)

:: 5. Start DeepSeek Harness Web UI
echo [INFO] Launching DeepSeek Harness Web Interface...
echo Default URL: http://127.0.0.1:3080
echo.

call %PNPM_CMD% dsh web %*

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] DeepSeek Harness stopped with error code %errorlevel%.
    pause
)
