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
      .select('id, email')
      .eq('approval_token', token)
      .maybeSingle()

    if (findError) return html(500, `Errore ricerca token: ${findError.message}`)
    if (!profile) return html(404, 'Token non valido o già usato')

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        approved: false,
        approval_status: 'rejected',
        rejected_at: new Date().toISOString(),
        approval_token: null,
      })
      .eq('id', profile.id)

    if (updateError) return html(500, `Errore rifiuto: ${updateError.message}`)

    return html(200, `Accesso non approvato per ${profile.email}.`)
  } catch (error) {
    return html(500, error instanceof Error ? error.message : 'Errore rifiuto')
  }
}

function html(statusCode: number, message: string) {
  return {
    statusCode,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
    body: `<!doctype html><html lang="it"><head><meta charset="utf-8"><title>Dojo Yamato</title></head><body style="font-family:Arial,sans-serif;padding:32px;"><h1>Dojo Yamato</h1><p>${message}</p><p><a href="/">Torna al sito</a></p></body></html>`,
  }
}
