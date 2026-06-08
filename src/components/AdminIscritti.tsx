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

type NewsletterMessage = {
  id: string
  title: string
  message: string
  recipients_count: number | null
  created_at: string | null
}

const NEWSLETTER_FORM_NAME = 'newsletter-creata'

function encodeFormData(data: Record<string, string>) {
  return new URLSearchParams(data).toString()
}

function AdminIscritti() {
  const [profiles, setProfiles] = useState<UserProfile[]>([])
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([])
  const [newsletterMessages, setNewsletterMessages] = useState<NewsletterMessage[]>([])
  const [selectedNewsletter, setSelectedNewsletter] = useState<NewsletterMessage | null>(null)

  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const [newsletterTitle, setNewsletterTitle] = useState('')
  const [newsletterBody, setNewsletterBody] = useState('')

  useEffect(() => {
    loadAll()
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

  const newsletterProfiles = useMemo(() => {
    return profiles.filter((profile) => profile.newsletter_opt_in)
  }, [profiles])

  const newsletterEmails = useMemo(() => {
    return newsletterProfiles
      .map((profile) => profile.email?.trim().toLowerCase())
      .filter((email): email is string => Boolean(email))
  }, [newsletterProfiles])

  async function loadAll() {
    await Promise.all([loadProfiles(), loadSubscribers(), loadNewsletterMessages()])
  }

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
      setMessage(`Errore caricamento newsletter_subscribers: ${error.message}`)
      return
    }

    setSubscribers((data ?? []) as NewsletterSubscriber[])
  }

  async function loadNewsletterMessages() {
    const { data, error } = await supabase
      .from('newsletter_messages')
      .select('id, title, message, recipients_count, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      setMessage(`Errore caricamento archivio newsletter: ${error.message}`)
      return
    }

    setNewsletterMessages((data ?? []) as NewsletterMessage[])
  }

  function getCreatedDate(value: string | null) {
    if (!value) return '—'

    return new Date(value).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  function getCreatedDateTime(value: string | null) {
    if (!value) return '—'

    return new Date(value).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  async function updateNewsletterSubscriber(profile: UserProfile, nextValue: boolean) {
    const cleanEmail = profile.email?.trim().toLowerCase()

    if (!cleanEmail) return

    const { data: existingSubscriber, error: selectError } = await supabase
      .from('newsletter_subscribers')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle()

    if (selectError) {
      throw new Error(selectError.message)
    }

    if (existingSubscriber?.id) {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .update({
          user_id: profile.id,
          nome: profile.nome,
          cognome: profile.cognome,
          active: nextValue,
          consent_newsletter: nextValue,
          consent_privacy: profile.privacy_accepted ?? true,
        })
        .eq('id', existingSubscriber.id)

      if (error) throw new Error(error.message)
      return
    }

    if (nextValue) {
      const { error } = await supabase.from('newsletter_subscribers').insert({
        user_id: profile.id,
        email: cleanEmail,
        nome: profile.nome,
        cognome: profile.cognome,
        active: true,
        consent_newsletter: true,
        consent_privacy: profile.privacy_accepted ?? true,
      })

      if (error) throw new Error(error.message)
    }
  }

  async function handleNewsletterChange(profile: UserProfile, value: string) {
    const nextValue = value === 'yes'

    setMessage('')

    const { error } = await supabase
      .from('profiles')
      .update({ newsletter_opt_in: nextValue })
      .eq('id', profile.id)

    if (error) {
      setMessage(`Errore aggiornamento newsletter: ${error.message}`)
      return
    }

    try {
      await updateNewsletterSubscriber(profile, nextValue)
    } catch (error) {
      setMessage(error instanceof Error ? `Errore newsletter_subscribers: ${error.message}` : 'Errore newsletter_subscribers.')
      return
    }

    setMessage(`Preferenza newsletter aggiornata per ${profile.email || 'utente'}.`)
    loadProfiles()
    loadSubscribers()
  }

  async function handleRoleChange(profile: UserProfile, nextRole: string) {
    setMessage('')

    const { error } = await supabase
      .from('profiles')
      .update({ role: nextRole })
      .eq('id', profile.id)

    if (error) {
      setMessage(`Errore aggiornamento ruolo: ${error.message}`)
      return
    }

    setMessage(`Ruolo aggiornato per ${profile.email || 'utente'}.`)
    loadProfiles()
  }

  async function handleDeleteProfile(profile: UserProfile) {
    if (!profile.email) {
      setMessage('Utente senza email: impossibile eliminare in modo sicuro.')
      return
    }

    const confirmDelete = window.confirm(
      `Vuoi eliminare ${profile.email} daldalla Newsletter?\n\nNota: questa eliminazione rimuove il profilo e la riga newsletter, non l’utente Auth Supabase. Per Auth usa Accessi utenti.`
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

  async function notifyNetlifyNewsletterCreated(title: string, body: string, recipientsCount: number) {
    try {
      await fetch('/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: encodeFormData({
          'form-name': NEWSLETTER_FORM_NAME,
          titolo: title,
          messaggio: body,
          destinatari: String(recipientsCount),
          email_destinatari: newsletterEmails.join(', '),
          bot_field: '',
        }),
      })
    } catch {
      // La newsletter resta comunque salvata in Supabase.
    }
  }

  async function handleSaveNewsletter(e: FormEvent) {
    e.preventDefault()

    if (!newsletterTitle.trim()) {
      setMessage('Inserisci il titolo della newsletter.')
      return
    }

    if (!newsletterBody.trim()) {
      setMessage('Inserisci il messaggio della newsletter.')
      return
    }

    if (newsletterEmails.length === 0) {
      setMessage('Non ci sono iscritti con Newsletter sì. Attiva almeno un iscritto prima di inviare.')
      return
    }

    setIsSaving(true)
    setMessage('')

    const cleanTitle = newsletterTitle.trim()
    const cleanBody = newsletterBody.trim()

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token

      if (!token) {
        setMessage('Sessione admin non valida. Effettua di nuovo il login.')
        setIsSaving(false)
        return
      }

      const response = await fetch('/.netlify/functions/send-newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: cleanTitle,
          message: cleanBody,
        }),
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(result.error || 'Invio newsletter non riuscito.')
      }

      await notifyNetlifyNewsletterCreated(cleanTitle, cleanBody, result.sentCount ?? newsletterEmails.length)

      setNewsletterTitle('')
      setNewsletterBody('')
      setMessage(`Newsletter inviata correttamente a ${result.sentCount ?? newsletterEmails.length} iscritti e salvata in archivio.`)
      loadNewsletterMessages()
    } catch (error) {
      setMessage(error instanceof Error ? `Errore invio newsletter: ${error.message}` : 'Errore invio newsletter.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteNewsletter(item: NewsletterMessage) {
    const confirmDelete = window.confirm(`Vuoi eliminare la newsletter "${item.title}" dall’archivio?`)
    if (!confirmDelete) return

    const { error } = await supabase.from('newsletter_messages').delete().eq('id', item.id)

    if (error) {
      setMessage(`Errore eliminazione newsletter: ${error.message}`)
      return
    }

    setSelectedNewsletter(null)
    setMessage('Newsletter eliminata dall’archivio.')
    loadNewsletterMessages()
  }

  async function handleCopyNewsletterEmails() {
    if (newsletterEmails.length === 0) {
      setMessage('Nessun iscritto con Newsletter sì.')
      return
    }

    await navigator.clipboard.writeText(newsletterEmails.join('; '))
    setMessage('Lista email Newsletter sì copiata negli appunti.')
  }

  return (
    <>
      <style>{newsletterResponsiveCss}</style>
      <div className="newsletter-admin-panel" style={wrapperStyle}>
      {message && <div style={messageBox}>{message}</div>}

      <div style={headerStyle}>
        <div>
          <p style={dojoBadgeStyle}>Newsletter</p>
          <h3 style={titleStyle}>Iscritti Newsletter</h3>
          <p style={introStyle}>
            Gestisci gli iscritti, la preferenza newsletter e l’archivio delle comunicazioni.
          </p>
        </div>

        <button type="button" className="primary-auth-button" style={buttonFitStyle} onClick={loadAll}>
          Aggiorna
        </button>
      </div>

      <div style={summaryGridStyle}>
        <div style={summaryBoxStyle}>
          <strong>{profiles.length}</strong>
          <span>contatti totali</span>
        </div>

        <div style={summaryBoxStyle}>
          <strong>{newsletterProfiles.length}</strong>
          <span>newsletter sì</span>
        </div>

        <div style={summaryBoxStyle}>
          <strong>{subscribers.filter((item) => item.active).length}</strong>
          <span>newsletter no</span>
        </div>

        <div style={summaryBoxStyle}>
          <strong>{newsletterMessages.length}</strong>
          <span>newsletter archiviate</span>
        </div>
      </div>

      <div style={adminCardStyle}>
        <h3 style={cardTitleStyle}>Crea newsletter</h3>
        <p style={introStyle}>
          Scrivi titolo e messaggio: la newsletter verrà inviata agli iscritti con Newsletter sì tramite Resend e salvata in archivio.
        </p>

        <form onSubmit={handleSaveNewsletter} style={formStyle}>
          <input
            type="text"
            placeholder="Titolo newsletter"
            value={newsletterTitle}
            onChange={(event) => setNewsletterTitle(event.target.value)}
          />

          <textarea
            placeholder="Messaggio completo della newsletter"
            value={newsletterBody}
            onChange={(event) => setNewsletterBody(event.target.value)}
            rows={6}
            style={textareaStyle}
          />

          <div style={buttonRowStyle}>
            <button type="submit" className="primary-auth-button" style={buttonFitStyle} disabled={isSaving}>
              {isSaving ? 'Invio in corso...' : 'Invia newsletter'}
            </button>

            <button type="button" className="primary-auth-button" style={secondaryButtonStyle} onClick={handleCopyNewsletterEmails}>
              Copia email newsletter sì
            </button>
          </div>
        </form>
      </div>

      <div style={adminCardStyle}>
        <div style={listHeaderStyle}>
          <div style={{ minWidth: 0 }}>
            <h3 style={cardTitleStyle}>Iscritti Newsletter</h3>
            <p style={introStyle}>Per ogni utente puoi impostare Newsletter sì o Newsletter no.</p>
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
              <article key={profile.id} className="newsletter-user-row" style={userRowStyle}>
                <div style={userMainStyle}>
                  <div style={avatarStyle}>
                    {(profile.nome?.[0] || profile.email?.[0] || '?').toUpperCase()}
                  </div>

                  <div style={userTextStyle}>
                    <h4 style={userNameStyle}>
                      {profile.nome || 'Nome'} {profile.cognome || ''}
                    </h4>
                    <p style={userEmailStyle}>{profile.email || 'Email non disponibile'}</p>
                    <p style={userMetaStyle}>{profile.phone || 'Telefono non indicato'}</p>
                  </div>
                </div>

                <div style={userInfoGridStyle}>
                  <div style={infoItemStyle}>
                    <span style={infoLabelStyle}>Ruolo</span>
                    <select
                      value={profile.role || 'reader'}
                      onChange={(event) => handleRoleChange(profile, event.target.value)}
                      style={compactSelectStyle}
                    >
                      <option value="reader">Reader</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div style={infoItemStyle}>
                    <span style={infoLabelStyle}>Newsletter</span>
                    <select
                      value={profile.newsletter_opt_in ? 'yes' : 'no'}
                      onChange={(event) => handleNewsletterChange(profile, event.target.value)}
                      style={compactSelectStyle}
                    >
                      <option value="yes">Newsletter sì</option>
                      <option value="no">Newsletter no</option>
                    </select>
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

      <div style={adminCardStyle}>
        <h3 style={cardTitleStyle}>Archivio Newsletter</h3>
        <p style={introStyle}>
          Qui trovi le newsletter salvate con titolo, data, messaggio completo e possibilità di eliminazione.
        </p>

        {newsletterMessages.length === 0 && <p style={mutedText}>Nessuna newsletter archiviata.</p>}

        {newsletterMessages.length > 0 && (
          <div style={newsletterArchiveStyle}>
            {newsletterMessages.map((item) => (
              <article key={item.id} className="newsletter-archive-row" style={newsletterRowStyle}>
                <div style={{ minWidth: 0 }}>
                  <h4 style={newsletterTitleStyle}>{item.title}</h4>
                  <p style={userMetaStyle}>
                    {getCreatedDateTime(item.created_at)} · destinatari: {item.recipients_count ?? 0}
                  </p>
                </div>

                <div style={buttonRowStyle}>
                  <button type="button" className="primary-auth-button" style={secondaryButtonStyle} onClick={() => setSelectedNewsletter(item)}>
                    Vedi messaggio
                  </button>

                  <button type="button" className="primary-auth-button" style={deleteButtonStyle} onClick={() => handleDeleteNewsletter(item)}>
                    Elimina
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {selectedNewsletter && (
        <div style={modalBackdropStyle} onClick={() => setSelectedNewsletter(null)}>
          <div style={modalCardStyle} onClick={(event) => event.stopPropagation()}>
            <h3 style={cardTitleStyle}>{selectedNewsletter.title}</h3>
            <p style={userMetaStyle}>{getCreatedDateTime(selectedNewsletter.created_at)}</p>
            <div style={newsletterFullMessageStyle}>{selectedNewsletter.message}</div>
            <div style={buttonRowStyle}>
              <button type="button" className="primary-auth-button" style={secondaryButtonStyle} onClick={() => setSelectedNewsletter(null)}>
                Chiudi
              </button>
              <button type="button" className="primary-auth-button" style={deleteButtonStyle} onClick={() => handleDeleteNewsletter(selectedNewsletter)}>
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  )
}

const newsletterResponsiveCss = `
@media (max-width: 880px) {
  .newsletter-user-row {
    grid-template-columns: 1fr !important;
    align-items: stretch !important;
  }

  .newsletter-archive-row {
    grid-template-columns: 1fr !important;
  }
}

@media (max-width: 560px) {
  .newsletter-admin-panel button,
  .newsletter-admin-panel select,
  .newsletter-admin-panel input,
  .newsletter-admin-panel textarea {
    width: 100% !important;
  }

  .newsletter-admin-panel [class*=primary-auth-button],
  .newsletter-admin-panel [class*=secondary-auth-button] {
    width: 100% !important;
  }

  .newsletter-user-row {
    padding: 10px !important;
  }
}
`

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

const secondaryButtonStyle: CSSProperties = {
  width: 'fit-content',
  background: 'rgba(255,255,255,0.10)',
  border: '1px solid rgba(255,255,255,0.14)',
}

const buttonRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '10px',
  alignItems: 'center',
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
  gridTemplateColumns: 'minmax(220px, 1.1fr) minmax(300px, 1.6fr) auto',
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

const userMetaStyle: CSSProperties = {
  margin: '3px 0 0',
  color: '#aeb6c4',
  fontSize: '11px',
  lineHeight: 1.3,
}

const userInfoGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(105px, 1fr))',
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

const compactSelectStyle: CSSProperties = {
  width: '100%',
  minHeight: '34px',
  borderRadius: '12px',
  border: '1px solid rgba(255,255,255,0.14)',
  background: 'rgba(12,18,32,0.92)',
  color: 'white',
  padding: '0 8px',
  fontSize: '12px',
  fontWeight: 800,
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

const newsletterArchiveStyle: CSSProperties = {
  display: 'grid',
  gap: '10px',
  marginTop: '16px',
}

const newsletterRowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(180px, 1fr) auto',
  gap: '12px',
  alignItems: 'center',
  padding: '12px',
  borderRadius: '14px',
  background: 'rgba(0,0,0,0.16)',
  border: '1px solid rgba(255,255,255,0.08)',
  minWidth: 0,
}

const newsletterTitleStyle: CSSProperties = {
  margin: '0 0 4px',
  color: 'white',
  fontSize: '15px',
  lineHeight: 1.25,
}

const modalBackdropStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 4000,
  display: 'grid',
  placeItems: 'center',
  padding: '20px',
  background: 'rgba(0,0,0,0.70)',
}

const modalCardStyle: CSSProperties = {
  width: 'min(760px, 100%)',
  maxHeight: '82vh',
  overflowY: 'auto',
  borderRadius: '20px',
  padding: '22px',
  background: '#111827',
  border: '1px solid rgba(255,255,255,0.14)',
  boxShadow: '0 24px 70px rgba(0,0,0,0.45)',
}

const newsletterFullMessageStyle: CSSProperties = {
  margin: '18px 0',
  padding: '16px',
  borderRadius: '16px',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.10)',
  color: '#f3f4f6',
  whiteSpace: 'pre-wrap',
  lineHeight: 1.7,
}

export default AdminIscritti

