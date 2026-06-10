# Media ASD Dojo Yamato - v10

## Novità principali

### Crop Studio Batch
- Import immagini da file singoli/multipli
- Import immagini da cartella
- Lista verticale immagini importate
- Selezione immagine dalla lista
- Editor centrale con riquadro spostabile e ridimensionabile
- Assegnazione di uno o più preset a ogni immagine
- Pulsante "Applica preset selezionati a tutte"
- Coda export
- Esportazione batch con "ESPORTA TUTTO"
- Output diviso automaticamente in cartelle per preset

## Avvio

```bash
python media_asd_dojo_yamato.py
```

## Installazione librerie

```bash
python -m pip install -r requirements.txt
```

## Nota

Per i video serve FFmpeg portable in:

```text
ffmpeg/bin/ffmpeg.exe
```

oppure FFmpeg installato nel PATH.


## Fix v10.1

- Corretto log FFmpeg: ora vengono mostrati solo veri errori.
- Migliorata conversione MOV/iPhone con mappe video/audio più robuste.
- Ignorati metadata, subtitle e data stream non necessari.
- Controllo file output vuoto/non creato.
