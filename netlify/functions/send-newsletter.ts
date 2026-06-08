import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const resendApiKey = process.env.RESEND_API_KEY
const fromEmail = process.env.RESEND_FROM_EMAIL || 'Dojo Yamato <noreply@asddojoyamato.it>'
const ADMIN_EMAIL = 'stefht85@hotmail.com'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(statusCode: number, body: Record<string, unknown>) {
  return {
    statusCode,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function textToHtml(value: string) {
  return escapeHtml(value).replace(/\n/g, '<br />')
}

export async function handler(event: any) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: '',
    }
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Metodo non consentito' })
  }

  if (!supabaseUrl || !serviceRoleKey) {
    return json(500, { error: 'Variabili Supabase mancanti' })
  }

  if (!resendApiKey) {
    return json(500, { error: 'RESEND_API_KEY mancante' })
  }

  const authorization = event.headers.authorization || event.headers.Authorization || ''
  const accessToken = authorization.replace('Bearer ', '').trim()

  if (!accessToken) {
    return json(401, { error: 'Sessione admin mancante' })
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
  const resend = new Resend(resendApiKey)

  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(accessToken)

  if (authError || !authData.user) {
    return json(401, { error: 'Sessione admin non valida' })
  }

  const adminEmail = String(authData.user.email || '').toLowerCase()

  const { data: adminProfile, error: adminProfileError } = await supabaseAdmin
    .from('profiles')
    .select('role, approved, approval_status, email')
    .eq('id', authData.user.id)
    .maybeSingle()

  if (adminProfileError) {
    return json(500, { error: `Errore verifica admin: ${adminProfileError.message}` })
  }

  const isMainAdmin = adminEmail === ADMIN_EMAIL.toLowerCase()
  const isAdmin = isMainAdmin || (adminProfile?.role === 'admin' && adminProfile?.approved === true)

  if (!isAdmin) {
    return json(403, { error: 'Solo un amministratore può inviare newsletter' })
  }

  let payload: { title?: string; message?: string } = {}

  try {
    payload = JSON.parse(event.body || '{}')
  } catch {
    return json(400, { error: 'Payload non valido' })
  }

  const title = String(payload.title || '').trim()
  const message = String(payload.message || '').trim()

  if (!title) {
    return json(400, { error: 'Titolo newsletter mancante' })
  }

  if (!message) {
    return json(400, { error: 'Messaggio newsletter mancante' })
  }

  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from('profiles')
    .select('email, nome, cognome, newsletter_opt_in')
    .eq('newsletter_opt_in', true)
    .not('email', 'is', null)

  if (profilesError) {
    return json(500, { error: `Errore caricamento destinatari: ${profilesError.message}` })
  }

  const recipients = Array.from(
    new Set(
      (profiles || [])
        .map((profile: any) => String(profile.email || '').trim().toLowerCase())
        .filter((email: string) => email.includes('@'))
    )
  )

  if (recipients.length === 0) {
    return json(400, { error: 'Nessun destinatario con Newsletter sì' })
  }

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.55;color:#111827;">
      <div style="max-width:640px;margin:0 auto;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
        <div style="background:#111827;color:#ffffff;padding:22px 26px;">
          <p style="margin:0;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#fca5a5;">A.S.D. Dojo Yamato</p>
          <h1 style="margin:8px 0 0;font-size:24px;">${escapeHtml(title)}</h1>
        </div>
        <div style="padding:26px;background:#ffffff;">
          <div style="font-size:16px;">${textToHtml(message)}</div>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:26px 0;" />
          <p style="font-size:12px;color:#6b7280;margin:0;">
            Ricevi questa email perché sei iscritto alla newsletter di A.S.D. Dojo Yamato Arti Marziali.
          </p>
        </div>
      </div>
    </div>
  `

  const text = `${title}\n\n${message}\n\nRicevi questa email perché sei iscritto alla newsletter di A.S.D. Dojo Yamato Arti Marziali.`

  const sent: string[] = []
  const failed: Array<{ email: string; error: string }> = []

  for (const email of recipients) {
    const { error: sendError } = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: title,
      html,
      text,
    })

    if (sendError) {
      failed.push({ email, error: sendError.message || 'Errore invio' })
    } else {
      sent.push(email)
    }
  }

  const { error: insertError } = await supabaseAdmin.from('newsletter_messages').insert({
    title,
    message,
    recipients_count: sent.length,
  })

  if (insertError) {
    return json(500, {
      error: `Newsletter inviata a ${sent.length} destinatari, ma non salvata in archivio: ${insertError.message}`,
      sentCount: sent.length,
      failedCount: failed.length,
      failed,
    })
  }

  return json(200, {
    ok: true,
    sentCount: sent.length,
    failedCount: failed.length,
    failed,
  })
}
