@echo off
setlocal enabledelayedexpansion
title DeepSeek Harness - Guardar Cambios Personales
cd /d "%~dp0"

echo ===================================================
echo   DeepSeek Harness - Guardar Cambios Personales
echo ===================================================
echo.

git status --short
echo.

git diff --quiet && git diff --cached --quiet
if %errorlevel% equ 0 (
    echo No hay cambios pendientes por guardar. Todo esta al dia.
    echo.
    pause
    exit /b 0
)

set "MSG="
set /p MSG="Describe brevemente lo que cambiaste (o presiona ENTER para nombre automatico): "
if "!MSG!"=="" set "MSG=mis cambios personales"

git add -A
git commit -m "chore(local): !MSG!"
if errorlevel 1 (
    echo.
    echo [ERROR] No se pudieron guardar los cambios.
) else (
    echo.
    echo ===================================================
    echo  Tus cambios se guardaron con exito en tu rama.
    echo ===================================================
)
echo.
pause
