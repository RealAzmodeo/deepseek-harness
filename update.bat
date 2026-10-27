@echo off
setlocal enabledelayedexpansion
title DeepSeek Harness - Update

:: ===========================================================================
:: Update master to the latest upstream, then rebase your work branch on top.
::
:: master    : pristine upstream. Never commit here.
:: german    : your work. Always rebased on master, never merged, so a future
::             update only replays your own commits.
::
:: Usage: double-click, or run `update.bat` from a terminal.
::
:: master is moved with a fetch refspec and NEVER checked out. These scripts are
:: committed only on the work branch, so checking out master would delete this
:: running batch file from disk and cmd.exe would die mid-script.
:: ===========================================================================

set "WORK_BRANCH=german"

cd /d "%~dp0"

:: Resolve pnpm and make it visible to CHILD processes too: the repository build
:: shells out to bare `pnpm` internally (scripts/build.ts runs build:lib:host).
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

echo ===================================================
echo          DeepSeek Harness - Update
echo ===================================================
echo Work branch: %WORK_BRANCH%
echo.

:: Check for uncommitted work
git diff --quiet && git diff --cached --quiet
if %errorlevel% neq 0 (
    echo [AVISO] Tienes cambios personales pendientes sin guardar.
    echo Para que Git no los pierda al actualizar, deben guardarse en tu rama '%WORK_BRANCH%'.
    echo.
    set "AUTO_SAVE="
    set /p AUTO_SAVE="Deseas guardarlos automaticamente ahora mismo? [S/N] (por defecto: S): "
    if "!AUTO_SAVE!"=="" set "AUTO_SAVE=S"
    if /i "!AUTO_SAVE!"=="S" (
        echo Guardando tus cambios personales...
        git add -A
        git commit -m "chore(local): auto-guardado antes de actualizar"
        if errorlevel 1 (
            echo [ERROR] No se pudieron guardar los cambios.
            pause
            exit /b 1
        )
        echo Cambios guardados con exito.
        echo.
    ) else (
        echo.
        echo [ERROR] Actualizacion cancelada para no tocar tus archivos sin guardar.
        echo Puedes guardarlos usando 'guardar-mis-cambios.bat' o manualmente con:
        echo     git add -A
        echo     git commit -m "tus cambios..."
        echo.
        pause
        exit /b 1
    )
)

echo [1/6] Fetching upstream...
git fetch upstream --prune
if errorlevel 1 goto :fail

echo [2/6] Moving local master to upstream/master (no checkout)...
git fetch upstream master:master
if errorlevel 1 (
    echo [WARN] upstream/master is not a fast-forward of local master.
    echo [WARN] Forcing the local master ref to match upstream.
    git fetch upstream +master:master
    if errorlevel 1 goto :fail
)

echo [3/6] Rebasing %WORK_BRANCH% onto master...
git checkout %WORK_BRANCH%
if errorlevel 1 goto :fail
git rebase master
if errorlevel 1 goto :conflict

echo [4/6] Syncing dependencies...
call %PNPM_CMD% install
if errorlevel 1 goto :fail

echo [5/6] Rebuilding artifacts...
call %PNPM_CMD% run build
if errorlevel 1 goto :fail

echo [6/6] Typechecking...
call %PNPM_CMD% run typecheck
if errorlevel 1 goto :fail

echo.
echo ===================================================
echo  Update complete. %WORK_BRANCH% is rebased on master.
echo ===================================================
echo Push your work (rewrites the branch, so force-with-lease):
echo     git push --force-with-lease origin %WORK_BRANCH%
echo.
pause
exit /b 0

:conflict
echo.
echo ===================================================
echo  CONFLICT - the rebase stopped and needs your input.
echo ===================================================
echo.
echo The listed files are where upstream changed lines that your own
echo commit also touches. For the mascot branch the fix is always the same:
echo keep upstream's version and re-add the few mascot lines. See the
echo "Conflict cookbook" section of:
echo     D:\Proyectos\deepseek-harness-update-guide.md
echo.
echo Then finish the rebase:
echo     git add -A
echo     git rebase --continue
echo.
echo To undo the whole update and return to the previous state:
echo     git rebase --abort
echo.
pause
exit /b 1

:fail
echo.
echo ===================================================
echo  [ERROR] A step failed. Nothing was pushed.
echo ===================================================
echo If a rebase is still in progress, undo it with:  git rebase --abort
echo Your committed work is safe either way; inspect with `git status`.
echo.
pause
exit /b 1
