import { createClient } from '@supabase/supabase-js'

export const ADMIN_EMAIL = 'stefht85@hotmail.com'

export const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
export const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabaseAdmin = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
  : null

export function json(statusCode: number, body: unknown) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
}

export async function requireAdmin(event: any) {
  if (!supabaseAdmin) throw new Error('Configurazione server mancante: SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')

  const authHeader = event.headers?.authorization || event.headers?.Authorization || ''
  const token = String(authHeader).replace(/^Bearer\s+/i, '').trim()

  if (!token) throw new Error('Token sessione mancante')

  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !data.user) throw new Error('Sessione non valida')

  const email = data.user.email?.toLowerCase() || ''
  if (email === ADMIN_EMAIL.toLowerCase()) return data.user

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('role, approved, approval_status')
    .eq('id', data.user.id)
    .maybeSingle()

  if (profileError) throw new Error(`Errore controllo profilo admin: ${profileError.message}`)
  if (profile?.role === 'admin' && profile.approved === true && profile.approval_status === 'approved') return data.user

  throw new Error('Permesso negato: solo admin')
}

export function getSiteUrl(event: any) {
  const envUrl = process.env.URL || process.env.DEPLOY_PRIME_URL
  if (envUrl) return envUrl.replace(/\/$/, '')
  const host = event.headers?.host || event.headers?.Host
  return `https://${host}`
}
