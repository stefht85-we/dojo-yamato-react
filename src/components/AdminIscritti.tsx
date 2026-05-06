import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'

type UserProfile = {
  id: string
  email: string | null
  nome: string | null
  cognome: string | null
  phone: string | null
  birth_date: string | null
  role: string | null
  newsletter_opt_in: boolean | null
  privacy_accepted: boolean | null
  created_at: string | null
}

type NewsletterSubscriber = {
  id: string
  user_id: string | null
  email: string
  nome: string | null
  cognome: string | null
  active: boolean | null
  consent_newsletter: boolean | null
  consent_privacy: boolean | null
  created_at: string | null
}

function AdminIscritti() {
  const [profiles, setProfiles] = useState<UserProfile[]>([])
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([])
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')

  const [newsletterSubject, setNewsletterSubject] = useState('')
  const [newsletterBody, setNewsletterBody] = useState('')

  useEffect(() => {
    loadProfiles()
    loadSubscribers()
  }, [])

  const filteredProfiles = useMemo(() => {
    const cleanSearch = search.trim().toLowerCase()

    if (!cleanSearch) return profiles

    return profiles.filter((profile) => {
      const values = [profile.nome, profile.cognome, profile.email, profile.phone, profile.role]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return values.includes(cleanSearch)
    })
  }, [profiles, search])

  const newsletterCount = useMemo(() => {
    return profiles.filter((profile) => profile.newsletter_opt_in).length
  }, [profiles])

  async function loadProfiles() {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, nome, cognome, phone, birth_date, role, newsletter_opt_in, privacy_accepted, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      setMessage(`Errore caricamento iscritti: ${error.message}`)
      return
    }

    setProfiles((data ?? []) as UserProfile[])
  }

  async function loadSubscribers() {
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .select('id, user_id, email, nome, cognome, active, consent_newsletter, consent_privacy, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      setMessage(`Errore caricamento newsletter: ${error.message}`)
      return
    }

    setSubscribers((data ?? []) as NewsletterSubscriber[])
  }

  function getCreatedDate(value: string | null) {
    if (!value) return '—'

    return new Date(value).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  async function handleDeleteProfile(profile: UserProfile) {
    if (!profile.email) {
      setMessage('Utente senza email: impossibile eliminare in modo sicuro.')
      return
    }

    const confirmDelete = window.confirm(
      `Vuoi eliminare ${profile.email} da elenco iscritti e newsletter?\n\nNota: l’account Auth Supabase non viene eliminato da qui.`
    )

    if (!confirmDelete) return

    const cleanEmail = profile.email.toLowerCase()

    const { error: subscriberError } = await supabase
      .from('newsletter_subscribers')
      .delete()
      .eq('email', cleanEmail)

    if (subscriberError) {
      setMessage(`Errore eliminazione newsletter: ${subscriberError.message}`)
      return
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', profile.id)

    if (profileError) {
      setMessage(`Errore eliminazione profilo: ${profileError.message}`)
      return
    }

    setMessage('Iscritto eliminato da profiles e newsletter_subscribers.')
    loadProfiles()
    loadSubscribers()
  }

  function handlePrepareNewsletter(e: FormEvent) {
    e.preventDefault()

    if (!newsletterSubject.trim()) {
      setMessage('Inserisci oggetto newsletter.')
      return
    }

    if (!newsletterBody.trim()) {
      setMessage('Inserisci testo newsletter.')
      return
    }

    setMessage(
      `Newsletter preparata per ${newsletterCount} iscritti. Invio reale non ancora collegato a Resend/Netlify.`
    )
  }

  return (
    <div style={wrapperStyle}>
      {message && <div style={messageBox}>{message}</div>}

      <div style={headerStyle}>
        <div>
          <p style={dojoBadgeStyle}>Utenti</p>
          <h3 style={titleStyle}>Iscritti e newsletter</h3>
          <p style={introStyle}>
            Elenco minimale degli utenti registrati, stato newsletter e preparazione comunicazioni.
          </p>
        </div>
      </div>

      <div style={summaryGridStyle}>
        <div style={summaryBoxStyle}>
          <strong>{profiles.length}</strong>
          <span>utenti registrati</span>
        </div>

        <div style={summaryBoxStyle}>
          <strong>{newsletterCount}</strong>
          <span>newsletter sì</span>
        </div>

        <div style={summaryBoxStyle}>
          <strong>{subscribers.filter((item) => item.active).length}</strong>
          <span>iscritti attivi</span>
        </div>
      </div>

      <div style={adminCardStyle}>
        <h3 style={cardTitleStyle}>Prepara newsletter</h3>
        <p style={introStyle}>
          Per ora prepariamo oggetto e testo. L’invio reale lo collegheremo più avanti a Resend/Netlify.
        </p>

        <form onSubmit={handlePrepareNewsletter} style={formStyle}>
          <input
            type="text"
            placeholder="Oggetto newsletter"
            value={newsletterSubject}
            onChange={(event) => setNewsletterSubject(event.target.value)}
          />

          <textarea
            placeholder="Testo newsletter"
            value={newsletterBody}
            onChange={(event) => setNewsletterBody(event.target.value)}
            rows={5}
            style={textareaStyle}
          />

          <button type="submit" className="primary-auth-button" style={buttonFitStyle}>
            Prepara newsletter
          </button>
        </form>
      </div>

      <div style={adminCardStyle}>
        <div style={listHeaderStyle}>
          <div style={{ minWidth: 0 }}>
            <h3 style={cardTitleStyle}>Elenco iscritti</h3>
            <p style={introStyle}>Nome, email, telefono, ruolo, newsletter e cancellazione.</p>
          </div>

          <input
            type="search"
            placeholder="Cerca iscritto"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={searchInputStyle}
          />
        </div>

        {filteredProfiles.length === 0 && <p style={mutedText}>Nessun iscritto trovato.</p>}

        {filteredProfiles.length > 0 && (
          <div style={usersListStyle}>
            {filteredProfiles.map((profile) => (
              <article key={profile.id} style={userRowStyle}>
                <div style={userMainStyle}>
                  <div style={avatarStyle}>
                    {(profile.nome?.[0] || profile.email?.[0] || '?').toUpperCase()}
                  </div>

                  <div style={userTextStyle}>
                    <h4 style={userNameStyle}>
                      {profile.nome || 'Nome'} {profile.cognome || ''}
                    </h4>
                    <p style={userEmailStyle}>{profile.email || 'Email non disponibile'}</p>
                  </div>
                </div>

                <div style={userInfoGridStyle}>
                  <div style={infoItemStyle}>
                    <span style={infoLabelStyle}>Telefono</span>
                    <strong style={infoValueStyle}>{profile.phone || '—'}</strong>
                  </div>

                  <div style={infoItemStyle}>
                    <span style={infoLabelStyle}>Ruolo</span>
                    <span style={smallBadgeStyle}>{profile.role || 'user'}</span>
                  </div>

                  <div style={infoItemStyle}>
                    <span style={infoLabelStyle}>Newsletter</span>
                    <span style={profile.newsletter_opt_in ? smallBadgeStyle : inactiveBadgeStyle}>
                      {profile.newsletter_opt_in ? 'Sì' : 'No'}
                    </span>
                  </div>

                  <div style={infoItemStyle}>
                    <span style={infoLabelStyle}>Privacy</span>
                    <span style={profile.privacy_accepted ? smallBadgeStyle : inactiveBadgeStyle}>
                      {profile.privacy_accepted ? 'Ok' : 'No'}
                    </span>
                  </div>

                  <div style={infoItemStyle}>
                    <span style={infoLabelStyle}>Data</span>
                    <strong style={infoValueStyle}>{getCreatedDate(profile.created_at)}</strong>
                  </div>
                </div>

                <div style={actionsStyle}>
                  <button
                    type="button"
                    className="primary-auth-button"
                    style={deleteButtonStyle}
                    onClick={() => handleDeleteProfile(profile)}
                  >
                    Elimina
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const dojoBadgeStyle: CSSProperties = {
  width: 'fit-content',
  padding: '6px 12px',
  borderRadius: '999px',
  background: 'linear-gradient(180deg, #b9444f 0%, #82232b 100%)',
  color: 'white',
  fontSize: '12px',
  fontWeight: 900,
  letterSpacing: '0.8px',
  textTransform: 'uppercase',
  boxShadow: '0 8px 18px rgba(80,10,18,0.24)',
}

const wrapperStyle: CSSProperties = {
  display: 'grid',
  gap: '20px',
  width: '100%',
  maxWidth: '100%',
  overflow: 'hidden',
}

const headerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '16px',
  alignItems: 'flex-start',
  flexWrap: 'wrap',
  minWidth: 0,
}

const titleStyle: CSSProperties = {
  margin: '8px 0',
  color: 'white',
  fontSize: '26px',
}

const introStyle: CSSProperties = {
  margin: 0,
  color: '#d8d8d8',
  lineHeight: 1.6,
}

const messageBox: CSSProperties = {
  background: 'rgba(185,68,79,0.18)',
  border: '1px solid rgba(185,68,79,0.28)',
  padding: '14px 16px',
  borderRadius: '14px',
  color: '#f3dede',
}

const summaryGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
  gap: '12px',
  minWidth: 0,
}

const summaryBoxStyle: CSSProperties = {
  display: 'grid',
  gap: '4px',
  padding: '16px',
  borderRadius: '16px',
  background: 'rgba(185,68,79,0.18)',
  border: '1px solid rgba(185,68,79,0.24)',
  color: 'white',
  minWidth: 0,
}

const adminCardStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: '18px',
  padding: '18px',
  width: '100%',
  maxWidth: '100%',
  boxSizing: 'border-box',
  overflow: 'hidden',
}

const cardTitleStyle: CSSProperties = {
  margin: '0 0 8px',
  color: 'white',
  fontSize: '20px',
}

const formStyle: CSSProperties = {
  display: 'grid',
  gap: '14px',
  marginTop: '18px',
  minWidth: 0,
}

const textareaStyle: CSSProperties = {
  borderRadius: '12px',
  padding: '14px',
  border: '1px solid rgba(255,255,255,0.16)',
  resize: 'vertical',
  fontFamily: 'inherit',
  width: '100%',
  boxSizing: 'border-box',
}

const buttonFitStyle: CSSProperties = {
  width: 'fit-content',
}

const listHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '16px',
  flexWrap: 'wrap',
  marginBottom: '16px',
  minWidth: 0,
}

const searchInputStyle: CSSProperties = {
  width: 'min(260px, 100%)',
  boxSizing: 'border-box',
}

const mutedText: CSSProperties = {
  color: '#d8d8d8',
  lineHeight: 1.6,
}

const usersListStyle: CSSProperties = {
  display: 'grid',
  gap: '10px',
  width: '100%',
  minWidth: 0,
}

const userRowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(180px, 1.2fr) minmax(240px, 1.6fr) auto',
  gap: '12px',
  alignItems: 'center',
  padding: '12px',
  borderRadius: '14px',
  background: 'rgba(0,0,0,0.16)',
  border: '1px solid rgba(255,255,255,0.08)',
  minWidth: 0,
}

const userMainStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  minWidth: 0,
}

const avatarStyle: CSSProperties = {
  width: '38px',
  height: '38px',
  borderRadius: '999px',
  background: 'linear-gradient(180deg, #b9444f 0%, #82232b 100%)',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 900,
  flexShrink: 0,
}

const userTextStyle: CSSProperties = {
  minWidth: 0,
}

const userNameStyle: CSSProperties = {
  margin: '0 0 3px',
  color: 'white',
  fontSize: '14px',
  lineHeight: 1.2,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const userEmailStyle: CSSProperties = {
  margin: 0,
  color: '#d8d8d8',
  fontSize: '12px',
  lineHeight: 1.3,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const userInfoGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(82px, 1fr))',
  gap: '8px',
  minWidth: 0,
}

const infoItemStyle: CSSProperties = {
  display: 'grid',
  gap: '4px',
  minWidth: 0,
}

const infoLabelStyle: CSSProperties = {
  color: '#aeb6c4',
  fontSize: '10px',
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: '0.6px',
}

const infoValueStyle: CSSProperties = {
  color: 'white',
  fontSize: '12px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const actionsStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
}

const smallBadgeStyle: CSSProperties = {
  ...dojoBadgeStyle,
  padding: '5px 9px',
  fontSize: '10px',
}

const inactiveBadgeStyle: CSSProperties = {
  padding: '5px 9px',
  borderRadius: '999px',
  background: 'rgba(255,255,255,0.10)',
  color: '#d8d8d8',
  fontSize: '10px',
  fontWeight: 900,
  width: 'fit-content',
}

const deleteButtonStyle: CSSProperties = {
  padding: '7px 12px',
  fontSize: '12px',
  borderRadius: '999px',
  border: 'none',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}

export default AdminIscritti
