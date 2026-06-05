import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { isAdmin as checkIsAdmin } from '../lib/permissions'
import type { User } from '@supabase/supabase-js'

type AccessState = 'loading' | 'anonymous' | 'pending' | 'approved' | 'rejected'

type Props = {
  children: ReactNode
}

function ApprovedRoute({ children }: Props) {
  const [state, setState] = useState<AccessState>('loading')
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    let active = true

    async function checkAccess() {
      const { data } = await supabase.auth.getUser()
      const currentUser = data.user

      if (!active) return
      setUser(currentUser)

      if (!currentUser) {
        setState('anonymous')
        return
      }

      if (checkIsAdmin(currentUser)) {
        setState('approved')
        return
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('approved, approval_status')
        .eq('id', currentUser.id)
        .maybeSingle()

      if (error || !profile) {
        setState('pending')
        return
      }

      if (profile.approved === true && profile.approval_status === 'approved') {
        setState('approved')
      } else if (profile.approval_status === 'rejected') {
        setState('rejected')
      } else {
        setState('pending')
      }
    }

    checkAccess()

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      checkAccess()
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  if (state === 'loading') {
    return <AccessMessage title="Verifica accesso..." text="Stiamo controllando i permessi del tuo account." />
  }

  if (state === 'anonymous') {
    return (
      <AccessMessage
        title="Area riservata"
        text="Per leggere questi contenuti devi effettuare il login con un account approvato."
        action={<Link className="primary-auth-button" to="/area-utente">Vai al login</Link>}
      />
    )
  }

  if (state === 'pending') {
    return (
      <AccessMessage
        title="Accesso in attesa di approvazione"
        text={`Lâ€™account ${user?.email ?? ''} Ã¨ registrato, ma deve ancora essere approvato dalla segreteria.`}
        action={<Link className="secondary-auth-button" to="/area-utente">Vai allâ€™area utente</Link>}
      />
    )
  }

  if (state === 'rejected') {
    return (
      <AccessMessage
        title="Accesso non approvato"
        text="La richiesta di accesso non Ã¨ stata approvata. Per informazioni contatta la segreteria del Dojo Yamato."
        action={<Link className="secondary-auth-button" to="/contatti">Contatti</Link>}
      />
    )
  }

  return <>{children}</>
}

function AccessMessage({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <main style={{ minHeight: '70vh', display: 'grid', placeItems: 'center', padding: '40px 20px', background: '#101827', color: '#fff' }}>
      <section style={{ width: 'min(720px, 100%)', borderRadius: '24px', padding: '32px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', textAlign: 'center' }}>
        <p style={{ margin: '0 0 10px', color: '#f3dede', fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase' }}>A.S.D. Dojo Yamato</p>
        <h1 style={{ margin: '0 0 14px', fontSize: 'clamp(28px, 5vw, 46px)' }}>{title}</h1>
        <p style={{ margin: '0 auto 22px', color: '#d8d8d8', lineHeight: 1.7, maxWidth: '560px' }}>{text}</p>
        {action}
      </section>
    </main>
  )
}

export default ApprovedRoute
