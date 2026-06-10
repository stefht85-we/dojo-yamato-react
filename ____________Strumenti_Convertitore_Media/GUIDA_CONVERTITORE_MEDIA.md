# Strumenti Convertitore Media - Dojo Yamato

Questa cartella contiene il programmino Python per preparare immagini e video da usare nel sito React del Dojo Yamato.

## File principali

- `01_AVVIA_CONVERTITORE_MEDIA.bat`  
  Avvia il programma con doppio click. Controlla anche le librerie Python e, se mancano, prova a installarle.

- `00_INSTALLA_REQUIREMENTS.bat`  
  Installa manualmente le librerie richieste.

- `convertitore_media_dojo_yamato.py`  
  Programma Python con interfaccia grafica colorata.

- `requirements.txt`  
  Librerie richieste: Pillow e pillow-heif.

- `bundle_convertitore_media_dojo_yamato.zip`  
  Copia compressa dei file del convertitore.

## Dove mettere la cartella

Consigliato:

```text
dojo-yamato-react/
  src/
  public/
  React/
    Strumenti_Convertitore_Media/
```

Questa cartella non modifica il sito e non entra nella build React. Serve solo come strumento locale.

## Avvio rapido

1. Apri il progetto in VS Code.
2. Vai nella cartella:

```text
React/Strumenti_Convertitore_Media/
```

3. Fai doppio click su:

```text
01_AVVIA_CONVERTITORE_MEDIA.bat
```

## Funzioni principali

### Convertitore media

- Conversione immagini HEIC / JPG / PNG / WEBP.
- Output consigliato WEBP per il sito.
- Ridimensionamento con lato lungo massimo.
- Limite massimo KB.
- Rinomina automatica.
- Conversione video in MP4 se FFmpeg è disponibile.
- Report dettagliato della conversione.

### Crop Studio

- Import immagini singole o cartella.
- Ritaglio per formati sito:
  - Hero Home
  - Cover news / album
  - Card news
  - Galleria 4:3
  - Profilo insegnante
  - Social quadrato
  - Story / Reel
  - Banner largo
- Export batch in cartelle separate.

## Nota video / FFmpeg

Per convertire video serve FFmpeg.

Puoi:
- installarlo nel PATH di Windows
- oppure inserire `ffmpeg.exe` in:

```text
React/Strumenti_Convertitore_Media/ffmpeg/bin/ffmpeg.exe
```

Se FFmpeg non è presente, il programma funziona comunque per immagini e ritagli.

## Push su Git

Dalla root del progetto:

```powershell
git status
git add React/Strumenti_Convertitore_Media
git commit -m "Aggiunge convertitore media locale"
git push
```

Non usare `git add .` se nello status vedi file temporanei o cartelle di output pesanti.
