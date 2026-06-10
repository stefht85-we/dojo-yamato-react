@echo off
setlocal
cd /d "%~dp0"

title Dojo Yamato - Convertitore Media

echo ==========================================
echo  DOJO YAMATO - CONVERTITORE MEDIA
echo ==========================================
echo.
echo Cartella programma:
echo %cd%
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Get-ChildItem -LiteralPath '%cd%' -Recurse -Include *.ps1,*.py,*.bat | Unblock-File -ErrorAction SilentlyContinue"

python --version >nul 2>&1
if errorlevel 1 (
  echo ERRORE: Python non trovato.
  echo Installa Python oppure abilita python nel PATH.
  echo.
  pause
  exit /b 1
)

echo Controllo librerie Python...
python -c "import PIL, pillow_heif" >nul 2>&1
if errorlevel 1 (
  echo Librerie mancanti. Avvio installazione automatica...
  python -m pip install -r "%~dp0requirements.txt"
  if errorlevel 1 (
    echo.
    echo ERRORE durante installazione librerie.
    echo Prova a lanciare 00_INSTALLA_REQUIREMENTS.bat
    pause
    exit /b 1
  )
)

echo.
echo Avvio interfaccia grafica...
python "%~dp0convertitore_media_dojo_yamato.py"

echo.
echo Programma chiuso.
pause
