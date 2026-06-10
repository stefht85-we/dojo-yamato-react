# ============================================================
# Dojo Yamato - Avvio menu anteprima dispositivi reali
# ============================================================
# Uso:
# 1) Apri un terminale nella root del progetto e lancia: npm run dev
# 2) Fai doppio click sul file 01_AVVIA_MENU_ANTEPRIMA.bat
#
# Questo script parte dalla cartella in cui si trova, quindi puo'
# restare ordinato dentro Strumenti_Anteprima_Dispositivi.
# ============================================================

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Host "Avvio menu anteprima dispositivi reali..." -ForegroundColor Cyan
Write-Host "Cartella strumenti: $ScriptDir"
Write-Host ""

# Prova prima con py, poi con python.
try {
  py -3 .nteprima_dispositivi_reali.py
} catch {
  python .nteprima_dispositivi_reali.py
}
