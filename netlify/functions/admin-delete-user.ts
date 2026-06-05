import { json, requireAdmin, supabaseAdmin, ADMIN_EMAIL } from './admin-helpers'

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' })

  try {
    await requireAdmin(event)
    if (!supabaseAdmin) return json(500, { error: 'Supabase admin non configurato' })

    const body = JSON.parse(event.body || '{}')
    const userId = String(body.userId || '')
    const email = String(body.email || '').toLowerCase()

    if (!userId) return json(400, { error: 'userId mancante' })
    if (email === ADMIN_EMAIL.toLowerCase()) return json(400, { error: 'Non puoi eliminare l’account admin principale.' })

    await supabaseAdmin.from('newsletter_subscribers').delete().eq('user_id', userId)
    if (email) await supabaseAdmin.from('newsletter_subscribers').delete().eq('email', email)
    await supabaseAdmin.from('profiles').delete().eq('id', userId)

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (deleteError) return json(500, { error: deleteError.message })

    return json(200, { success: true })
  } catch (error) {
    return json(401, { error: error instanceof Error ? error.message : 'Errore eliminazione utente' })
  }
}
