import { json, requireAdmin, supabaseAdmin, ADMIN_EMAIL } from './admin-helpers'

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' })

  try {
    await requireAdmin(event)
    if (!supabaseAdmin) return json(500, { error: 'Supabase admin non configurato' })

    const body = JSON.parse(event.body || '{}')
    const userIds = Array.isArray(body.userIds) ? body.userIds.map(String).filter(Boolean) : []
    if (userIds.length === 0) return json(400, { error: 'Nessun utente selezionato' })

    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .in('id', userIds)

    if (profilesError) return json(500, { error: profilesError.message })

    const blockedAdmin = (profiles ?? []).find((profile: any) => String(profile.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase())
    if (blockedAdmin) return json(400, { error: 'Non puoi eliminare l’account admin principale.' })

    for (const userId of userIds) {
      await supabaseAdmin.from('newsletter_subscribers').delete().eq('user_id', userId)
      const profile = (profiles ?? []).find((item: any) => item.id === userId)
      if (profile?.email) await supabaseAdmin.from('newsletter_subscribers').delete().eq('email', String(profile.email).toLowerCase())
      await supabaseAdmin.from('profiles').delete().eq('id', userId)
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
      if (deleteError) return json(500, { error: deleteError.message })
    }

    return json(200, { success: true, count: userIds.length })
  } catch (error) {
    return json(401, { error: error instanceof Error ? error.message : 'Errore eliminazione definitiva utenti' })
  }
}
