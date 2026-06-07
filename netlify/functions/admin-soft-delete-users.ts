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
    if (blockedAdmin) return json(400, { error: 'Non puoi disattivare l’account admin principale.' })

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        disabled: true,
        deleted_at: new Date().toISOString(),
        approved: false,
        approval_status: 'rejected',
        role: 'reader',
        rejected_at: new Date().toISOString(),
        approval_token: null,
      })
      .in('id', userIds)

    if (error) return json(500, { error: error.message })

    return json(200, { success: true, count: userIds.length })
  } catch (error) {
    return json(401, { error: error instanceof Error ? error.message : 'Errore disattivazione utenti' })
  }
}
