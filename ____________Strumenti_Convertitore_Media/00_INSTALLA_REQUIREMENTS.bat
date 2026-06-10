@echo off
setlocal
cd /d "%~dp0"

echo ==========================================
echo  INSTALLAZIONE LIBRERIE PYTHON
echo  Convertitore Media Dojo Yamato
echo ==========================================
echo.

python --version
if errorlevel 1 (
  echo ERRORE: Python non trovato. Installa Python e riprova.
  pause
  exit /b 1
)

echo.
echo Installo/aggiorno librerie necessarie...
python -m pip install --upgrade pip
python -m pip install -r "%~dp0requirements.txt"

echo.
echo Installazione completata.
pause
