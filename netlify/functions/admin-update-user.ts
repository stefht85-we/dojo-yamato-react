import { json, requireAdmin, supabaseAdmin } from './admin-helpers'

type ApprovalStatus = 'pending' | 'approved' | 'rejected'
type Role = 'reader' | 'admin'

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' })

  try {
    await requireAdmin(event)
    if (!supabaseAdmin) return json(500, { error: 'Supabase admin non configurato' })

    const body = JSON.parse(event.body || '{}')
    const userId = String(body.userId || '')
    const role = body.role as Role | undefined
    const status = body.approval_status as ApprovalStatus | undefined

    if (!userId) return json(400, { error: 'userId mancante' })
    if (role && !['reader', 'admin'].includes(role)) return json(400, { error: 'Ruolo non valido' })
    if (status && !['pending', 'approved', 'rejected'].includes(status)) return json(400, { error: 'Stato non valido' })

    const payload: Record<string, unknown> = {}

    if (role) payload.role = role

    if (status) {
      payload.approval_status = status
      payload.approved = status === 'approved'
      payload.approved_at = status === 'approved' ? new Date().toISOString() : null
      payload.rejected_at = status === 'rejected' ? new Date().toISOString() : null
      if (status !== 'pending') payload.approval_token = null
    }

    if (role === 'admin') {
      payload.approved = true
      payload.approval_status = 'approved'
      payload.approved_at = new Date().toISOString()
      payload.rejected_at = null
      payload.approval_token = null
    }

    const { error } = await supabaseAdmin.from('profiles').update(payload).eq('id', userId)
    if (error) return json(500, { error: error.message })

    return json(200, { success: true })
  } catch (error) {
    return json(401, { error: error instanceof Error ? error.message : 'Errore autorizzazione' })
  }
}
