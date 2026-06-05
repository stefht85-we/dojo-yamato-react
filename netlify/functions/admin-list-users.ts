import { json, requireAdmin, supabaseAdmin } from './admin-helpers'

export async function handler(event: any) {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method not allowed' })

  try {
    await requireAdmin(event)
    if (!supabaseAdmin) return json(500, { error: 'Supabase admin non configurato' })

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    if (authError) return json(500, { error: authError.message })

    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, nome, cognome, phone, role, approved, approval_status, approval_requested_at, approved_at, rejected_at')

    if (profilesError) return json(500, { error: profilesError.message })

    const profileMap = new Map((profiles ?? []).map((profile: any) => [profile.id, profile]))

    const users = (authData.users ?? []).map((authUser: any) => {
      const profile: any = profileMap.get(authUser.id) || {}
      return {
        id: authUser.id,
        email: profile.email || authUser.email || '',
        created_at: authUser.created_at || null,
        last_sign_in_at: authUser.last_sign_in_at || null,
        nome: profile.nome || authUser.user_metadata?.nome || null,
        cognome: profile.cognome || authUser.user_metadata?.cognome || null,
        phone: profile.phone || authUser.user_metadata?.phone || null,
        role: profile.role || 'reader',
        approved: profile.approved === true,
        approval_status: profile.approval_status || 'pending',
        approval_requested_at: profile.approval_requested_at || null,
        approved_at: profile.approved_at || null,
        rejected_at: profile.rejected_at || null,
      }
    })

    users.sort((a: any, b: any) => {
      const statusOrder: Record<string, number> = { pending: 0, approved: 1, rejected: 2 }
      return (statusOrder[a.approval_status] ?? 9) - (statusOrder[b.approval_status] ?? 9)
        || String(a.email).localeCompare(String(b.email))
    })

    return json(200, { users })
  } catch (error) {
    return json(401, { error: error instanceof Error ? error.message : 'Errore autorizzazione' })
  }
}
