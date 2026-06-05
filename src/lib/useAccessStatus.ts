import { useCallback, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'
import { isAdmin as checkIsAdmin } from './permissions'

export type AccessStatus = 'loading' | 'anonymous' | 'pending' | 'approved' | 'rejected'

export type AccessInfo = {
  status: AccessStatus
  user: User | null
  isLoading: boolean
  isAnonymous: boolean
  isPending: boolean
  isApproved: boolean
  isRejected: boolean
  isAdmin: boolean
  canPreviewRestrictedContent: boolean
  canOpenRestrictedContent: boolean
  refreshAccessStatus: () => Promise<void>
}

export function useAccessStatus(): AccessInfo {
  const [status, setStatus] = useState<AccessStatus>('loading')
  const [user, setUser] = useState<User | null>(null)
  const [isAdminUser, setIsAdminUser] = useState(false)

  const refreshAccessStatus = useCallback(async () => {
    setStatus((current) => (current === 'loading' ? current : 'loading'))

    const { data } = await supabase.auth.getUser()
    const currentUser = data.user
    setUser(currentUser)

    if (!currentUser) {
      setIsAdminUser(false)
      setStatus('anonymous')
      return
    }

    if (checkIsAdmin(currentUser)) {
      setIsAdminUser(true)
      setStatus('approved')
      return
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('approved, approval_status, role')
      .eq('id', currentUser.id)
      .maybeSingle()

    if (error || !profile) {
      setIsAdminUser(false)
      setStatus('pending')
      return
    }

    if (profile.role === 'admin') {
      setIsAdminUser(true)
      setStatus('approved')
      return
    }

    setIsAdminUser(false)

    if (profile.approved === true && profile.approval_status === 'approved') {
      setStatus('approved')
      return
    }

    if (profile.approval_status === 'rejected') {
      setStatus('rejected')
      return
    }

    setStatus('pending')
  }, [])

  useEffect(() => {
    let active = true

    async function run() {
      if (!active) return
      await refreshAccessStatus()
    }

    run()

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      if (!active) return
      refreshAccessStatus()
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [refreshAccessStatus])

  const isLoading = status === 'loading'
  const isAnonymous = status === 'anonymous'
  const isPending = status === 'pending'
  const isApproved = status === 'approved'
  const isRejected = status === 'rejected'

  return {
    status,
    user,
    isLoading,
    isAnonymous,
    isPending,
    isApproved,
    isRejected,
    isAdmin: isAdminUser,
    canPreviewRestrictedContent: !isRejected,
    canOpenRestrictedContent: isApproved,
    refreshAccessStatus,
  }
}
