import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
  : null

export async function handler(event: any) {
  try {
    if (!supabase) return html(500, 'Configurazione server mancante')

    const token = event.queryStringParameters?.token
    if (!token) return html(400, 'Token mancante')

    const { data: profile, error: findError } = await supabase
      .from('profiles')
      .select('id, email, nome, cognome')
      .eq('approval_token', token)
      .maybeSingle()

    if (findError) return html(500, `Errore ricerca token: ${findError.message}`)
    if (!profile) return html(404, 'Token non valido o già usato')

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        approved: true,
        approval_status: 'approved',
        role: 'reader',
        approved_at: new Date().toISOString(),
        rejected_at: null,
        approval_token: null,
      })
      .eq('id', profile.id)

    if (updateError) return html(500, `Errore approvazione: ${updateError.message}`)

    return html(200, `Accesso approvato per ${profile.email}. L’utente può ora accedere ai contenuti riservati.`)
  } catch (error) {
    return html(500, error instanceof Error ? error.message : 'Errore approvazione')
  }
}

function html(statusCode: number, message: string) {
  return {
    statusCode,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
    body: `<!doctype html><html lang="it"><head><meta charset="utf-8"><title>Dojo Yamato</title></head><body style="font-family:Arial,sans-serif;padding:32px;"><h1>Dojo Yamato</h1><p>${message}</p><p><a href="/">Torna al sito</a></p></body></html>`,
  }
}
