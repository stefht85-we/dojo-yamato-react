import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const ADMIN_EMAIL = 'stefht85@hotmail.com'

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const resendApiKey = process.env.RESEND_API_KEY

const siteUrl =
  process.env.URL ||
  process.env.DEPLOY_PRIME_URL ||
  process.env.DEPLOY_URL ||
  'http://localhost:8888'

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Metodo non consentito' }),
    }
  }

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Variabili Supabase server mancanti: SUPABASE_URL/VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY' }),
    }
  }

  if (!resendApiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Variabile RESEND_API_KEY mancante' }),
    }
  }

  try {
    const body = JSON.parse(event.body || '{}')

    const userId = String(body.userId || '').trim()
    const email = String(body.email || '').trim().toLowerCase()
    const nome = String(body.nome || '').trim()
    const cognome = String(body.cognome || '').trim()
    const phone = String(body.phone || '').trim()
    const birthDate = String(body.birthDate || '').trim()
    const address = String(body.address || '').trim()
    const city = String(body.city || '').trim()
    const newsletterOptIn = Boolean(body.newsletterOptIn)
    const privacyAccepted = Boolean(body.privacyAccepted)

    if (!userId || !email || !nome || !cognome) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Dati registrazione incompleti' }),
      }
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const approvalToken =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`

    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    const isAdminRequest = email === ADMIN_EMAIL.toLowerCase()

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: userId,
          email,
          nome,
          cognome,
          phone: phone || null,
          birth_date: birthDate || null,
          address: address || null,
          city: city || null,
          role: isAdminRequest ? 'admin' : 'reader',
          approved: isAdminRequest,
          approval_status: isAdminRequest ? 'approved' : 'pending',
          approval_token: isAdminRequest ? null : approvalToken,
          approval_token_expires_at: isAdminRequest ? null : expiresAt,
          newsletter_opt_in: newsletterOptIn,
          privacy_accepted: privacyAccepted,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )

    if (profileError) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: `Errore salvataggio profilo: ${profileError.message}` }),
      }
    }

    if (isAdminRequest) {
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, autoApproved: true }),
      }
    }

    const approveUrl = `${siteUrl}/.netlify/functions/approve-user?token=${encodeURIComponent(approvalToken)}`
    const rejectUrl = `${siteUrl}/.netlify/functions/reject-user?token=${encodeURIComponent(approvalToken)}`

    const resend = new Resend(resendApiKey)

    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
        <h2>Nuova richiesta accesso Area Riservata Dojo Yamato</h2>
        <p>Un nuovo utente ha richiesto l'accesso in sola lettura all'area riservata.</p>

        <table cellpadding="6" cellspacing="0" style="border-collapse:collapse">
          <tr><td><strong>Nome</strong></td><td>${escapeHtml(nome)}</td></tr>
          <tr><td><strong>Cognome</strong></td><td>${escapeHtml(cognome)}</td></tr>
          <tr><td><strong>Email</strong></td><td>${escapeHtml(email)}</td></tr>
          <tr><td><strong>Telefono</strong></td><td>${escapeHtml(phone)}</td></tr>
          <tr><td><strong>Data di nascita</strong></td><td>${escapeHtml(birthDate)}</td></tr>
          <tr><td><strong>Indirizzo</strong></td><td>${escapeHtml(address)}</td></tr>
          <tr><td><strong>Città</strong></td><td>${escapeHtml(city)}</td></tr>
          <tr><td><strong>Newsletter</strong></td><td>${newsletterOptIn ? 'Sì' : 'No'}</td></tr>
        </table>

        <p style="margin-top:24px">
          <a href="${approveUrl}" style="display:inline-block;padding:12px 18px;background:#15803d;color:white;text-decoration:none;border-radius:8px;font-weight:bold">
            APPROVA ACCESSO
          </a>
          &nbsp;
          <a href="${rejectUrl}" style="display:inline-block;padding:12px 18px;background:#b91c1c;color:white;text-decoration:none;border-radius:8px;font-weight:bold">
            NON APPROVARE
          </a>
        </p>

        <p style="color:#666;font-size:13px;margin-top:24px">
          Il link di approvazione scade il ${new Date(expiresAt).toLocaleDateString('it-IT')}.
        </p>
      </div>
    `

    const { error: emailError } = await resend.emails.send({
      from: 'Dojo Yamato <info@asddojoyamato.it>',
      to: [ADMIN_EMAIL],
      subject: `Nuova richiesta accesso area riservata - ${nome} ${cognome}`,
      reply_to: email,
      html,
    })

    if (emailError) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: `Profilo creato, ma invio email fallito: ${emailError.message}` }),
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    }
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error?.message || 'Errore richiesta approvazione' }),
    }
  }
}
