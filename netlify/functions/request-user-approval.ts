import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import crypto from 'node:crypto'

const ADMIN_EMAIL = 'stefht85@hotmail.com'

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const resendApiKey = process.env.RESEND_API_KEY
const fromEmail = process.env.RESEND_FROM_EMAIL || 'Dojo Yamato <onboarding@resend.dev>'

const supabase = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
  : null

const resend = resendApiKey ? new Resend(resendApiKey) : null

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  try {
    if (!supabase || !resend) {
      return json(500, { error: 'Variabili server mancanti: controlla SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e RESEND_API_KEY.' })
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

    const { error: emailError } = await resend.emails.send({
      from: fromEmail,
      to: [ADMIN_EMAIL],
      subject: 'Nuova richiesta accesso Area Riservata Dojo Yamato',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <h2>Nuova richiesta accesso Area Riservata</h2>
          <p><strong>Nome:</strong> ${escapeHtml(nome || '')}</p>
          <p><strong>Cognome:</strong> ${escapeHtml(cognome || '')}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Telefono:</strong> ${escapeHtml(phone || '')}</p>
          <p><strong>Data nascita:</strong> ${escapeHtml(birthDate || '')}</p>
          <p><strong>Indirizzo:</strong> ${escapeHtml(address || '')}</p>
          <p><strong>Città:</strong> ${escapeHtml(city || '')}</p>
          <p><strong>Newsletter:</strong> ${newsletterOptIn ? 'Sì' : 'No'}</p>
          <p style="margin-top: 24px;">
            <a href="${approveUrl}" style="display:inline-block;padding:12px 18px;background:#15803d;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">APPROVA ACCESSO</a>
          </p>
          <p>
            <a href="${rejectUrl}" style="display:inline-block;padding:12px 18px;background:#991b1b;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">NON APPROVARE</a>
          </p>
        </div>
      `,
    })

    if (emailError) {
      return json(500, { error: `Profilo creato, ma email non inviata: ${emailError.message}` })
    }

    return json(200, { success: true })
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

function escapeHtml(value: string) {
  return String(value).replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  }[char] || char))
}
