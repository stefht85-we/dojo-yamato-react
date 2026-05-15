import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { getSignedUrlFromPublicUrl } from '../lib/storageSignedUrl'

type DojoEvent = {
  id: string
  title: string
  description: string | null
  location: string | null
  event_date: string | null
  provisional_year: number | null
  provisional_month: number | null
  is_date_provisional: boolean
  image_url: string | null
  external_url: string | null
  external_url_label: string | null
  visible: boolean
  created_at: string
  signed_image_url?: string | null
}

function CalendarioEventi() {
  const [events, setEvents] = useState<DojoEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [pastOpen, setPastOpen] = useState(false)

  useEffect(() => {
    loadEvents()
  }, [])

  const { upcomingEvents, pastEvents } = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const upcoming: DojoEvent[] = []
    const past: DojoEvent[] = []

    events.forEach((event) => {
      const comparableDate = getComparableEventDate(event)

      if (!comparableDate || comparableDate >= today) {
        upcoming.push(event)
      } else {
        past.push(event)
      }
    })

    // Prossimi eventi: dal più vicino al più lontano.
    upcoming.sort((a, b) => {
      const dateA = getComparableEventDate(a)?.getTime() ?? Number.MAX_SAFE_INTEGER
      const dateB = getComparableEventDate(b)?.getTime() ?? Number.MAX_SAFE_INTEGER
      return dateA - dateB
    })

    // Eventi passati: ordine inverso rispetto alla logica precedente.
    // Dal più vecchio al più recente.
    past.sort((a, b) => {
      const dateA = getComparableEventDate(a)?.getTime() ?? 0
      const dateB = getComparableEventDate(b)?.getTime() ?? 0
      return dateA - dateB
    })

    return { upcomingEvents: upcoming, pastEvents: past }
  }, [events])

  async function loadEvents() {
    setLoading(true)
    setMessage('')

    const { data, error } = await supabase
      .from('events')
      .select(`
        id,
        title,
        description,
        location,
        event_date,
        provisional_year,
        provisional_month,
        is_date_provisional,
        image_url,
        external_url,
        external_url_label,
        visible,
        created_at
      `)
      .eq('visible', true)

    if (error) {
      console.error('Errore caricamento eventi:', error.message)
      setMessage(`Errore caricamento eventi: ${error.message}`)
      setEvents([])
      setLoading(false)
      return
    }

    const eventsWithSignedImages = await Promise.all(
      (data ?? []).map(async (event) => {
        const signedImageUrl = await getSignedUrlFromPublicUrl(event.image_url)

        return {
          ...event,
          signed_image_url: signedImageUrl || event.image_url,
        }
      })
    )

    setEvents(eventsWithSignedImages as DojoEvent[])
    setLoading(false)
  }

  function getComparableEventDate(event: DojoEvent) {
    if (event.event_date && !event.is_date_provisional) {
      const date = new Date(event.event_date)
      date.setHours(0, 0, 0, 0)
      return date
    }

    if (event.provisional_year && event.provisional_month) {
      const date = new Date(event.provisional_year, event.provisional_month - 1, 1)
      date.setHours(0, 0, 0, 0)
      return date
    }

    if (event.provisional_year) {
      const date = new Date(event.provisional_year, 0, 1)
      date.setHours(0, 0, 0, 0)
      return date
    }

    return null
  }

  function formatEventDate(event: DojoEvent) {
    if (event.event_date && !event.is_date_provisional) {
      return new Date(event.event_date).toLocaleDateString('it-IT', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    }

    if (event.provisional_year && event.provisional_month) {
      const date = new Date(event.provisional_year, event.provisional_month - 1, 1)

      return `${date.toLocaleDateString('it-IT', {
        month: 'long',
        year: 'numeric',
      })} · data provvisoria`
    }

    if (event.provisional_year) {
      return `${event.provisional_year} · data da definire`
    }

    return 'Data da definire'
  }

  function getShortDescription(description: string | null) {
    if (!description) return 'Clicca per visualizzare i dettagli dell’evento.'
    return description.length > 120 ? `${description.slice(0, 120)}...` : description
  }

  function renderEventRow(event: DojoEvent, compact = false) {
    return (
      <article key={event.id} style={compact ? pastEventRowStyle : eventRowStyle}>
        <Link to={`/eventi/${event.id}`} style={eventImageBoxStyle}>
          {event.signed_image_url ? (
            <img src={event.signed_image_url} alt={event.title} loading="lazy" style={eventImageStyle} />
          ) : (
            <div style={imagePlaceholderStyle}>📅</div>
          )}
        </Link>

        <div style={eventRowContentStyle}>
          <div style={eventRowTopStyle}>
            <div>
              <p style={dateBadgeStyle}>{formatEventDate(event)}</p>
              <h3 style={compact ? pastEventTitleStyle : eventTitleStyle}>{event.title}</h3>
            </div>

            <Link to={`/eventi/${event.id}`} style={openButtonStyle}>
              Apri evento
            </Link>
          </div>

          {!compact && (
            <>
              {event.location && <p style={eventMetaStyle}>📍 {event.location}</p>}
              <p style={eventDescriptionStyle}>{getShortDescription(event.description)}</p>
            </>
          )}
        </div>
      </article>
    )
  }

  return (
    <main style={pageStyle}>
      <section style={heroStyle}>
        <p style={pageBadgeStyle}>Eventi</p>
        <h1 style={titleStyle}>Calendario eventi</h1>
        <p style={introStyle}>
          Gare, esami, stage, appuntamenti e attività del Dojo Yamato.
        </p>
      </section>

      <section style={contentStyle}>
        {loading && <p style={mutedText}>Caricamento eventi...</p>}

        {!loading && message && <div style={messageBoxStyle}>{message}</div>}

        {!loading && !message && (
          <>
            <section style={pastSectionStyle}>
              <button
                type="button"
                onClick={() => setPastOpen((current) => !current)}
                style={pastHeaderStyle}
              >
                <div>
                  <p style={sectionBadgeStyle}>Archivio</p>
                  <h2 style={pastHeaderTitleStyle}>Eventi passati</h2>
                </div>

                <div style={pastHeaderRightStyle}>
                  <span style={counterPillStyle}>
                    {pastEvents.length} {pastEvents.length === 1 ? 'evento' : 'eventi'}
                  </span>
                  <span style={expandIconStyle}>{pastOpen ? '−' : '+'}</span>
                </div>
              </button>

              {pastOpen && (
                <div style={pastListStyle}>
                  {pastEvents.length === 0 ? (
                    <div style={emptyBoxStyle}>Non ci sono eventi passati.</div>
                  ) : (
                    pastEvents.map((event) => renderEventRow(event, true))
                  )}
                </div>
              )}
            </section>

            <section style={upcomingSectionStyle}>
              <div style={sectionHeaderStyle}>
                <div>
                  <p style={sectionBadgeStyle}>Prossimi appuntamenti</p>
                  <h2 style={sectionTitleStyle}>Eventi in programma</h2>
                </div>

                <span style={counterPillStyle}>
                  {upcomingEvents.length} {upcomingEvents.length === 1 ? 'evento' : 'eventi'}
                </span>
              </div>

              {upcomingEvents.length === 0 ? (
                <div style={emptyBoxStyle}>Non ci sono eventi futuri disponibili.</div>
              ) : (
                <div style={eventsListStyle}>
                  {upcomingEvents.map((event) => renderEventRow(event))}
                </div>
              )}
            </section>
          </>
        )}
      </section>
    </main>
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

const pageStyle: CSSProperties = {
  minHeight: '100vh',
  background: '#020817',
  color: 'white',
  padding: '58px 24px 90px',
}

const heroStyle: CSSProperties = {
  width: 'min(1180px, calc(100% - 8px))',
  margin: '0 auto 34px',
  display: 'grid',
  gap: '16px',
}

const pageBadgeStyle: CSSProperties = dojoBadgeStyle

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 'clamp(48px, 8vw, 82px)',
  lineHeight: 0.98,
  fontWeight: 950,
}

const introStyle: CSSProperties = {
  margin: 0,
  maxWidth: '850px',
  color: '#d8d8d8',
  fontSize: '18px',
  lineHeight: 1.7,
}

const contentStyle: CSSProperties = {
  width: 'min(1180px, calc(100% - 8px))',
  margin: '0 auto',
  display: 'grid',
  gap: '22px',
}

const pastSectionStyle: CSSProperties = {
  borderRadius: '22px',
  overflow: 'hidden',
  background: 'linear-gradient(180deg, rgba(255,255,255,0.075), rgba(255,255,255,0.04))',
  border: '1px solid rgba(255,255,255,0.10)',
}

const pastHeaderStyle: CSSProperties = {
  width: '100%',
  border: 'none',
  background: 'transparent',
  color: 'white',
  padding: '18px 20px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '18px',
  cursor: 'pointer',
  textAlign: 'left',
}

const pastHeaderTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: '24px',
  fontWeight: 950,
}

const pastHeaderRightStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
}

const expandIconStyle: CSSProperties = {
  width: '38px',
  height: '38px',
  borderRadius: '999px',
  background: 'linear-gradient(180deg, #b9444f 0%, #82232b 100%)',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '26px',
  fontWeight: 950,
  flexShrink: 0,
}

const pastListStyle: CSSProperties = {
  display: 'grid',
  gap: '10px',
  padding: '0 16px 16px',
}

const upcomingSectionStyle: CSSProperties = {
  display: 'grid',
  gap: '16px',
}

const sectionHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
  gap: '18px',
  flexWrap: 'wrap',
  padding: '20px',
  borderRadius: '22px',
  background: 'linear-gradient(180deg, rgba(255,255,255,0.075), rgba(255,255,255,0.04))',
  border: '1px solid rgba(255,255,255,0.10)',
}

const sectionBadgeStyle: CSSProperties = {
  ...dojoBadgeStyle,
  margin: '0 0 10px',
}

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: '30px',
  fontWeight: 950,
}

const counterPillStyle: CSSProperties = {
  padding: '8px 14px',
  borderRadius: '999px',
  background: 'rgba(255,255,255,0.10)',
  border: '1px solid rgba(255,255,255,0.12)',
  color: 'white',
  fontSize: '13px',
  fontWeight: 900,
  whiteSpace: 'nowrap',
}

const eventsListStyle: CSSProperties = {
  display: 'grid',
  gap: '14px',
}

const eventRowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '170px 1fr',
  gap: '16px',
  overflow: 'hidden',
  borderRadius: '22px',
  background: 'linear-gradient(180deg, rgba(255,255,255,0.085), rgba(255,255,255,0.045))',
  border: '1px solid rgba(255,255,255,0.12)',
  boxShadow: '0 16px 36px rgba(0,0,0,0.26)',
}

const pastEventRowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '110px 1fr',
  gap: '12px',
  overflow: 'hidden',
  borderRadius: '16px',
  background: 'rgba(255,255,255,0.045)',
  border: '1px solid rgba(255,255,255,0.08)',
}

const eventImageBoxStyle: CSSProperties = {
  display: 'block',
  width: '100%',
  minHeight: '110px',
  overflow: 'hidden',
  background: '#101827',
  textDecoration: 'none',
}

const eventImageStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  minHeight: '110px',
  objectFit: 'cover',
  display: 'block',
}

const imagePlaceholderStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  minHeight: '110px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '34px',
  background: 'linear-gradient(135deg, rgba(185,68,79,0.22), rgba(255,255,255,0.08))',
}

const eventRowContentStyle: CSSProperties = {
  padding: '14px 16px',
  display: 'grid',
  gap: '9px',
  alignContent: 'center',
}

const eventRowTopStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '12px',
}

const dateBadgeStyle: CSSProperties = {
  ...dojoBadgeStyle,
  margin: '0 0 7px',
  padding: '5px 10px',
  fontSize: '11px',
}

const eventTitleStyle: CSSProperties = {
  margin: 0,
  color: 'white',
  fontSize: '23px',
  fontWeight: 950,
  lineHeight: 1.18,
}

const pastEventTitleStyle: CSSProperties = {
  margin: 0,
  color: 'white',
  fontSize: '17px',
  fontWeight: 950,
  lineHeight: 1.18,
}

const eventMetaStyle: CSSProperties = {
  margin: 0,
  color: '#f3dede',
  fontSize: '14px',
  lineHeight: 1.45,
}

const eventDescriptionStyle: CSSProperties = {
  margin: 0,
  color: '#d8d8d8',
  fontSize: '14px',
  lineHeight: 1.6,
}

const openButtonStyle: CSSProperties = {
  ...dojoBadgeStyle,
  textDecoration: 'none',
  justifySelf: 'start',
  border: 'none',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}

const mutedText: CSSProperties = {
  color: '#d8d8d8',
  lineHeight: 1.6,
}

const emptyBoxStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.045)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '18px',
  padding: '22px',
  color: '#d8d8d8',
}

const messageBoxStyle: CSSProperties = {
  background: 'rgba(185,68,79,0.18)',
  border: '1px solid rgba(185,68,79,0.28)',
  padding: '14px 16px',
  borderRadius: '14px',
  color: '#f3dede',
}

export default CalendarioEventi
