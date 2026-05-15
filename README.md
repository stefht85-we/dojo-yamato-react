# A.S.D. Dojo Yamato - sito React/Vite

Versione pulita per deploy finale.

## Avvio locale

```bash
npm install
npm run dev
```

## Build produzione

```bash
npm run build
npm run preview
```

## Variabili ambiente richieste

Copia `.env.example` in `.env` e inserisci:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Su Netlify inserisci le stesse variabili in:

Site settings → Environment variables.

## Deploy Netlify

Il file `netlify.toml` è già configurato:

- build command: `npm run build`
- publish directory: `dist`
- redirect SPA: tutte le rotte React tornano a `index.html`

## Pulizia effettuata

I file backup e duplicati sono stati spostati in `_removed-backups` e non sono più dentro `src`, quindi non entrano nel build.
