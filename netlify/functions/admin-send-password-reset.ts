import { Resend } from 'resend'
import { getSiteUrl, json, requireAdmin, supabaseAdmin } from './admin-helpers'

const resendApiKey = process.env.RESEND_API_KEY
const fromEmail = process.env.RESEND_FROM_EMAIL || 'Dojo Yamato <onboarding@resend.dev>'
const resend = resendApiKey ? new Resend(resendApiKey) : null

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' })

  try {
    await requireAdmin(event)
    if (!supabaseAdmin) return json(500, { error: 'Supabase admin non configurato' })
    if (!resend) return json(500, { error: 'RESEND_API_KEY mancante' })

    const body = JSON.parse(event.body || '{}')
    const email = String(body.email || '').toLowerCase()
    if (!email) return json(400, { error: 'Email mancante' })

    const redirectTo = `${getSiteUrl(event)}/area-utente`
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo },
    })

    if (error) return json(500, { error: error.message })

    const resetUrl = data.properties?.action_link
    if (!resetUrl) return json(500, { error: 'Link reset non generato' })

    const { error: emailError } = await resend.emails.send({
      from: fromEmail,
      to: [email],
      subject: 'Reset password Area Riservata Dojo Yamato',
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;">
          <h2>Reset password Area Riservata Dojo Yamato</h2>
          <p>È stata richiesta la modifica della password per il tuo account.</p>
          <p><a href="${resetUrl}" style="display:inline-block;padding:12px 18px;background:#8f2430;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">IMPOSTA NUOVA PASSWORD</a></p>
          <p>Se non hai richiesto questa operazione, puoi ignorare questa email.</p>
        </div>
      `,
    })

    if (emailError) return json(500, { error: emailError.message })
    return json(200, { success: true })
  } catch (error) {
    return json(401, { error: error instanceof Error ? error.message : 'Errore reset password' })
  }
}
