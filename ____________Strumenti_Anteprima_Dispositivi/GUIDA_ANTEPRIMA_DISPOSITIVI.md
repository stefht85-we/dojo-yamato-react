# GUIDA - Anteprima dispositivi reali Dojo Yamato

Questa cartella raccoglie tutti i file dello strumento di anteprima responsive, così non restano sparsi nella root del progetto `dojo-yamato-react`.

## Cartella consigliata

Copia tutta la cartella:

```text
Strumenti_Anteprima_Dispositivi
```

nella root del progetto, cioè nella stessa posizione dove si trova `package.json`.

Esempio:

```text
dojo-yamato-react/
  package.json
  src/
  public/
  Strumenti_Anteprima_Dispositivi/
    01_AVVIA_MENU_ANTEPRIMA.bat
    02_lancia_menu_anteprima.ps1
    anteprima_dispositivi_reali.py
    GUIDA_ANTEPRIMA_DISPOSITIVI.md
```

## Come si usa

1. Apri Visual Studio Code nella cartella del progetto `dojo-yamato-react`.
2. Apri un terminale e avvia il sito:

```powershell
npm run dev
```

3. Lascia aperto quel terminale.
4. Vai nella cartella `Strumenti_Anteprima_Dispositivi`.
5. Fai doppio click su:

```text
01_AVVIA_MENU_ANTEPRIMA.bat
```

Si aprirà il menu grafico Python.

## Cosa puoi scegliere dal menu

Puoi impostare:

- URL base del sito locale, per esempio `http://localhost:5173`
- pagina da testare, per esempio `/`, `/corsi`, `/galleria`, `/contatti`
- modalità: essenziale, mobile, tablet, completo o personalizzata
- dispositivi da visualizzare
- scala visiva della dashboard

## Cosa mostra per ogni dispositivo

Per ogni dispositivo viene indicato:

- viewport CSS usata dal sito
- risoluzione fisica indicativa
- diagonale schermo in pollici
- dimensione fisica approssimata in millimetri
- DPR, cioè device pixel ratio
- proporzione dello schermo

Esempio:

```text
iPhone 8
Viewport CSS: 375 x 667 px
Risoluzione fisica: 750 x 1334 px
Schermo: 4.7"
```

## Nota importante

Il PC non può riprodurre perfettamente la dimensione reale in centimetri di un iPhone o di un tablet, perché dipende dal monitor, dal DPI e dallo zoom di Windows.

Lo strumento però mantiene la proporzione corretta e usa la viewport CSS corretta: questo è ciò che serve per controllare se il sito è responsive e se gli elementi si sovrappongono.

## Se Vite usa una porta diversa

Se `npm run dev` parte su una porta diversa, per esempio:

```text
http://localhost:5174
```

nel menu cambia il campo URL base da:

```text
http://localhost:5173
```

a:

```text
http://localhost:5174
```

## File contenuti

- `01_AVVIA_MENU_ANTEPRIMA.bat`  
  File da cliccare con doppio click.

- `02_lancia_menu_anteprima.ps1`  
  Script PowerShell richiamato dal BAT.

- `anteprima_dispositivi_reali.py`  
  Programma Python con menu grafico e dashboard dispositivi.

- `GUIDA_ANTEPRIMA_DISPOSITIVI.md`  
  Questa guida.

## Push su GitHub

Dopo aver copiato la cartella nel progetto, puoi versionarla con:

```powershell
git add Strumenti_Anteprima_Dispositivi
git commit -m "Aggiunge strumenti anteprima dispositivi responsive"
git push
```

Se preferisci non pubblicare questi strumenti nel sito/repository, non fare il git add della cartella.
