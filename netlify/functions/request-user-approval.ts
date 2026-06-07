import { createClient } from '@supabase/supabase-js'
import crypto from 'node:crypto'

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
  : null

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  try {
    if (!supabase) {
      return json(500, { error: 'Variabili server mancanti: controlla SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.' })
    }

    const body = JSON.parse(event.body || '{}')
    const { userId, email, nome, cognome, phone, birthDate, address, city, newsletterOptIn, privacyAccepted } = body

    if (!userId || !email) {
      return json(400, { error: 'userId ed email sono obbligatori.' })
    }

    const token = crypto.randomBytes(32).toString('hex')
    const siteUrl = getSiteUrl(event)

    const profilePayload = {
      id: userId,
      email: String(email).toLowerCase(),
      nome: nome || null,
      cognome: cognome || null,
      phone: phone || null,
      birth_date: birthDate || null,
      address: address || null,
      city: city || null,
      role: 'reader',
      approved: false,
      approval_status: 'pending',
      approval_token: token,
      approval_requested_at: new Date().toISOString(),
      newsletter_opt_in: Boolean(newsletterOptIn),
      privacy_accepted: Boolean(privacyAccepted),
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(profilePayload, { onConflict: 'id' })

    if (profileError) {
      return json(500, { error: `Errore salvataggio profilo: ${profileError.message}` })
    }

    const approveUrl = `${siteUrl}/.netlify/functions/approve-user?token=${token}`
    const rejectUrl = `${siteUrl}/.netlify/functions/reject-user?token=${token}`

    return json(200, {
      success: true,
      approveUrl,
      rejectUrl,
    })
  } catch (error) {
    return json(500, { error: error instanceof Error ? error.message : 'Errore richiesta approvazione.' })
  }
}

function getSiteUrl(event: any) {
  const envUrl = process.env.URL || process.env.DEPLOY_PRIME_URL
  if (envUrl) return envUrl.replace(/\/$/, '')
  const host = event.headers?.host || event.headers?.Host
  return `https://${host}`
}

function json(statusCode: number, body: unknown) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
}
