import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAccessStatus } from '../lib/useAccessStatus'

type Props = {
  children: ReactNode
  allowPendingPreview?: boolean
  allowPublicPreview?: boolean
}

function ApprovedRoute({ children, allowPendingPreview = false, allowPublicPreview = false }: Props) {
  const { status, user } = useAccessStatus()

  if (status === 'loading') {
    return <AccessMessage title="Verifica accesso..." text="Stiamo controllando i permessi del tuo account." />
  }

  if (status === 'anonymous' && !allowPublicPreview) {
    return (
      <AccessMessage
        title="Area riservata"
        text="Per visualizzare questi contenuti devi effettuare il login o registrarti."
        action={<Link className="primary-auth-button" to="/area-utente">Vai al login</Link>}
      />
    )
  }

  if (status === 'rejected') {
    return (
      <AccessMessage
        title="Accesso non approvato"
        text="La richiesta di accesso non è stata approvata. Per informazioni contatta la segreteria del Dojo Yamato."
        action={<Link className="secondary-auth-button" to="/contatti">Contatti</Link>}
      />
    )
  }

  if (status === 'pending' && !allowPendingPreview) {
    return (
      <AccessMessage
        title="Accesso in attesa di approvazione"
        text={`L'account ${user?.email ?? ''} è registrato, ma deve ancora essere approvato dalla segreteria.`}
        action={<Link className="secondary-auth-button" to="/area-utente">Vai all'area utente</Link>}
      />
    )
  }

  return (
    <>
      {status === 'anonymous' && allowPublicPreview && <PublicPreviewBanner />}
      {status === 'pending' && allowPendingPreview && <PendingPreviewBanner />}
      {children}
    </>
  )
}

function PublicPreviewBanner() {
  return (
    <div style={publicBannerStyle}>
      <strong>Contenuti in anteprima.</strong>
      Puoi vedere le pagine e le anteprime, ma per aprire immagini, video o scaricare documenti devi registrarti ed essere approvato.
      <Link to="/area-utente" style={pendingBannerLinkStyle}>Accedi / Registrati</Link>
    </div>
  )
}

function PendingPreviewBanner() {
  return (
    <div style={pendingBannerStyle}>
      <strong>Account in attesa di approvazione.</strong>
      Puoi vedere titoli e anteprime, ma non puoi aprire, ingrandire o scaricare i contenuti finché l'accesso non viene approvato.
      <Link to="/area-utente" style={pendingBannerLinkStyle}>Stato richiesta</Link>
    </div>
  )
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

const publicBannerStyle = {
  position: 'sticky' as const,
  top: 88,
  zIndex: 900,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '10px',
  flexWrap: 'wrap' as const,
  padding: '12px 18px',
  background: 'rgba(32,54,91,0.96)',
  color: '#fff',
  fontWeight: 800,
  textAlign: 'center' as const,
  boxShadow: '0 12px 28px rgba(0,0,0,0.28)',
}

const pendingBannerStyle = {
  position: 'sticky' as const,
  top: 88,
  zIndex: 900,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '10px',
  flexWrap: 'wrap' as const,
  padding: '12px 18px',
  background: 'rgba(185,68,79,0.95)',
  color: '#fff',
  fontWeight: 800,
  textAlign: 'center' as const,
  boxShadow: '0 12px 28px rgba(0,0,0,0.28)',
}

const pendingBannerLinkStyle = {
  color: '#fff',
  textDecoration: 'underline',
  fontWeight: 950,
}

export default ApprovedRoute
