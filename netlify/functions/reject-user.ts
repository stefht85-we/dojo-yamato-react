import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function htmlPage(title: string, message: string) {
  return `<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${title}</title>
</head>
<body style="font-family:Arial,sans-serif;background:#0b0f1a;color:#fff;padding:40px">
  <div style="max-width:720px;margin:auto;background:#151b2a;border:1px solid rgba(255,255,255,.12);border-radius:18px;padding:28px">
    <h1>${title}</h1>
    <p style="font-size:18px;line-height:1.5">${message}</p>
  </div>
</body>
</html>`
}

export async function handler(event: any) {
  if (!supabaseUrl || !serviceRoleKey) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: htmlPage('Errore configurazione', 'Variabili Supabase server mancanti.'),
    }
  }

  const token = String(event.queryStringParameters?.token || '').trim()

  if (!token) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: htmlPage('Token mancante', 'Il link non contiene un token valido.'),
    }
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: profile, error: selectError } = await supabase
    .from('profiles')
    .select('id, email, nome, cognome, approval_token_expires_at')
    .eq('approval_token', token)
    .maybeSingle()

  if (selectError || !profile) {
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: htmlPage('Richiesta non trovata', 'Token non valido oppure richiesta già gestita.'),
    }
  }

  if (profile.approval_token_expires_at && new Date(profile.approval_token_expires_at).getTime() < Date.now()) {
    return {
      statusCode: 410,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: htmlPage('Link scaduto', 'Il link di rifiuto è scaduto.'),
    }
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      approved: false,
      approval_status: 'rejected',
      rejected_at: new Date().toISOString(),
      approval_token: null,
      approval_token_expires_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile.id)

  if (updateError) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: htmlPage('Errore rifiuto', updateError.message),
    }
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
    body: htmlPage(
      'Accesso non approvato',
      `Hai rifiutato l’accesso per ${profile.nome || ''} ${profile.cognome || ''} (${profile.email}).`
    ),
  }
}
