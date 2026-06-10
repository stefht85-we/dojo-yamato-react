@echo off
setlocal

REM Cartella strumenti = dove si trova questo BAT
set "TOOLS_DIR=%~dp0"

REM Root progetto = cartella sopra la cartella strumenti
for %%I in ("%TOOLS_DIR%..") do set "PROJECT_ROOT=%%~fI"

echo ==========================================
echo  DOJO YAMATO - DEV + ANTEPRIMA DISPOSITIVI
echo ==========================================
echo.
echo Root progetto:
echo %PROJECT_ROOT%
echo.
echo Cartella strumenti:
echo %TOOLS_DIR%
echo.

REM Sblocca eventuali file scaricati da internet
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Get-ChildItem -LiteralPath '%TOOLS_DIR%' -Recurse -Include *.ps1,*.py,*.bat | Unblock-File -ErrorAction SilentlyContinue"

echo Avvio npm run dev in una nuova finestra...
start "Dojo Yamato - npm run dev" cmd /k "cd /d "%PROJECT_ROOT%" && npm run dev"

echo.
echo Attendo 4 secondi per avvio Vite...
timeout /t 4 /nobreak >nul

echo Avvio menu Python anteprima dispositivi...
cd /d "%TOOLS_DIR%"
python "%TOOLS_DIR%anteprima_dispositivi_reali.py"

echo.
echo Fine.
pause
