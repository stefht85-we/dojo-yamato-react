import type { User } from '@supabase/supabase-js'

export const ADMIN_EMAIL = 'stefht85@hotmail.com'

export type UserRole = 'guest' | 'user' | 'admin'

export function getUserRole(user: User | null): UserRole {
  if (!user) return 'guest'

  const email = user.email?.toLowerCase() ?? ''

  if (email === ADMIN_EMAIL.toLowerCase()) return 'admin'

  return 'user'
}

export function isLogged(user: User | null) {
  return Boolean(user)
}

export function isAdmin(user: User | null) {
  return getUserRole(user) === 'admin'
}

export function isUser(user: User | null) {
  return getUserRole(user) === 'user'
}

export function canOpenMedia(user: User | null) {
  return isLogged(user)
}

export function canDownloadMedia(user: User | null) {
  return isLogged(user)
}

export function canManageContent(user: User | null) {
  return isAdmin(user)
}

export function canManageUsers(user: User | null) {
  return isAdmin(user)
}

export function canSendNewsletter(user: User | null) {
  return isAdmin(user)
}

export function getAccessDeniedMessage(contentName = 'questo contenuto') {
  return `Accedi o registrati all’Area Utente per aprire e scaricare ${contentName}.`
}
