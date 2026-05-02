import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import type { CSSProperties } from 'react'

type EventDocument = {
  id: string
  event_id: string
  title: string
  file_url: string
  file_type: string | null
  created_at: string
}

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
  event_documents?: EventDocument[]
}

function CalendarioEventi() {
  const [events, setEvents] = useState<DojoEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    loadEvents()
  }, [])

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
        created_at,
        event_documents (
          id,
          event_id,
          title,
          file_url,
          file_type,
          created_at
        )
      `)
      .eq('visible', true)
      .order('event_date', { ascending: true, nullsFirst: false })
      .order('provisional_year', { ascending: true, nullsFirst: false })
      .order('provisional_month', { ascending: true, nullsFirst: false })

    if (error) {
      console.error('Errore caricamento eventi:', error)
      setMessage('Errore durante il caricamento degli eventi.')
      setLoading(false)
      return
    }

    setEvents((data ?? []) as DojoEvent[])
    setLoading(false)
  }

  function normalizeDate(date: Date) {
    const normalized = new Date(date)
    normalized.setHours(0, 0, 0, 0)
    return normalized
  }

  function addMonths(date: Date, months: number) {
    const result = new Date(date)
    result.setMonth(result.getMonth() + months)
    return result
  }

  function getEventComparableDate(event: DojoEvent) {
    if (event.event_date && !event.is_date_provisional) {
      return normalizeDate(new Date(event.event_date))
    }

    if (event.provisional_year && event.provisional_month) {
      return normalizeDate(
        new Date(event.provisional_year, event.provisional_month - 1, 1)
      )
    }

    return normalizeDate(new Date(event.created_at))
  }

  function formatEventDate(event: DojoEvent) {
    if (event.event_date && !event.is_date_provisional) {
      return new Date(event.event_date).toLocaleDateString('it-IT', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    }

    if (event.provisional_year && event.provisional_month) {
      const provisionalDate = new Date(
        event.provisional_year,
        event.provisional_month - 1,
        1
      )

      return `${provisionalDate.toLocaleDateString('it-IT', {
        month: 'long',
        year: 'numeric',
      })} · data provvisoria`
    }

    return 'Data da definire'
  }

  function shortDescription(text: string | null) {
    if (!text) return ''

    if (text.length <= 150) return text

    return `${text.substring(0, 150)}...`
  }

  const today = useMemo(() => normalizeDate(new Date()), [])
  const threeMonthsLimit = useMemo(() => normalizeDate(addMonths(today, 3)), [today])

  const groupedEvents = useMemo(() => {
    const sorted = [...events].sort(
      (a, b) =>
        getEventComparableDate(a).getTime() - getEventComparableDate(b).getTime()
    )

    const past = sorted
      .filter((event) => getEventComparableDate(event) < today)
      .sort(
        (a, b) =>
          getEventComparableDate(a).getTime() -
          getEventComparableDate(b).getTime()
      )

    const nextThreeMonths = sorted.filter((event) => {
      const eventDate = getEventComparableDate(event)
      return eventDate >= today && eventDate <= threeMonthsLimit
    })

    const later = sorted.filter((event) => {
      const eventDate = getEventComparableDate(event)
      return eventDate > threeMonthsLimit
    })

    return {
      past,
      nextThreeMonths,
      later,
    }
  }, [events, today, threeMonthsLimit])

  function openEvent(eventId: string) {
    navigate(`/calendario-eventi/${eventId}`)
  }

  function renderEventCard(event: DojoEvent, compact = false) {
    return (
      <article
        key={event.id}
        style={compact ? compactEventCardStyle : eventCardStyle}
        onClick={() => openEvent(event.id)}
      >
        <div style={eventLeftStyle}>
          <h3 style={eventTitleBadgeStyle}>{event.title}</h3>

          <p style={eventDateStyle}>{formatEventDate(event)}</p>

          {event.location && <p style={eventLocationStyle}>📍 {event.location}</p>}

          {event.description && (
            <p style={eventDescriptionStyle}>
              {compact ? shortDescription(event.description) : event.description}
            </p>
          )}
        </div>

        <div style={eventImageAreaStyle}>
          {event.image_url ? (
            <img src={event.image_url} alt={event.title} style={eventImageStyle} />
          ) : (
            <div style={eventImagePlaceholderStyle}>Evento</div>
          )}
        </div>

        <div style={eventRightStyle}>
          {event.external_url && (
            <a
              href={event.external_url}
              target="_blank"
              rel="noreferrer"
              style={eventExternalLinkStyle}
              onClick={(e) => e.stopPropagation()}
            >
              {event.external_url_label || 'Link evento'}
            </a>
          )}

          {event.event_documents && event.event_documents.length > 0 && (
            <div style={documentsBoxStyle}>
              <p style={documentsTitleStyle}>Allegati</p>

              {event.event_documents.map((doc) => (
                <a
                  key={doc.id}
                  href={doc.file_url}
                  target="_blank"
                  rel="noreferrer"
                  style={documentLinkStyle}
                  onClick={(e) => e.stopPropagation()}
                >
                  📄 {doc.title}
                </a>
              ))}
            </div>
          )}

          {!event.external_url &&
            (!event.event_documents || event.event_documents.length === 0) && (
              <p style={noDocsStyle}>Clicca per aprire il dettaglio</p>
            )}
        </div>
      </article>
    )
  }

  return (
    <main style={pageStyle}>
      <section style={heroStyle}>
        <div style={containerStyle}>
          <p style={labelStyle}>Calendario eventi</p>

          <h1 style={titleStyle}>Eventi e appuntamenti</h1>

          <p style={introTextStyle}>
            In questa pagina trovi gli eventi del Dojo Yamato: gare, incontri,
            appuntamenti e attività programmate. Gli eventi passati restano
            archiviati e consultabili.
          </p>
        </div>
      </section>

      <section style={contentStyle}>
        <div style={containerStyle}>
          {loading && <p style={mutedTextStyle}>Caricamento eventi...</p>}

          {!loading && message && <div style={messageBoxStyle}>{message}</div>}

          {!loading && !message && events.length === 0 && (
            <div style={emptyBoxStyle}>
              Non ci sono ancora eventi pubblicati.
            </div>
          )}

          {!loading && !message && events.length > 0 && (
            <>
              <details style={pastDetailsStyle}>
                <summary style={pastSummaryStyle}>
                  <span>Eventi passati</span>
                  <strong>{groupedEvents.past.length}</strong>
                </summary>

                <div style={compactListStyle}>
                  {groupedEvents.past.length === 0 && (
                    <p style={mutedTextStyle}>Non ci sono eventi passati.</p>
                  )}

                  {groupedEvents.past.map((event) => renderEventCard(event, true))}
                </div>
              </details>

              <section style={mainEventsSectionStyle}>
                <div style={sectionHeaderStyle}>
                  <div>
                    <p style={labelStyle}>Prossimi 3 mesi</p>
                    <h2 style={sectionTitleStyle}>Prossimi eventi</h2>
                  </div>

                  <span style={countBadgeStyle}>
                    {groupedEvents.nextThreeMonths.length}
                  </span>
                </div>

                {groupedEvents.nextThreeMonths.length === 0 && (
                  <div style={emptyBoxStyle}>
                    Non ci sono eventi in programma nei prossimi 3 mesi.
                  </div>
                )}

                <div style={eventsListStyle}>
                  {groupedEvents.nextThreeMonths.map((event) =>
                    renderEventCard(event)
                  )}
                </div>
              </section>

              <details style={futureDetailsStyle}>
                <summary style={futureSummaryStyle}>
                  <span>Eventi futuri da 4 mesi in poi</span>
                  <strong>{groupedEvents.later.length}</strong>
                </summary>

                <div style={compactListStyle}>
                  {groupedEvents.later.length === 0 && (
                    <p style={mutedTextStyle}>
                      Non ci sono eventi futuri oltre i prossimi 3 mesi.
                    </p>
                  )}

                  {groupedEvents.later.map((event) => renderEventCard(event, true))}
                </div>
              </details>
            </>
          )}
        </div>
      </section>
    </main>
  )
}

const pageStyle: CSSProperties = {
  minHeight: '90vh',
  background:
    'radial-gradient(circle at top, rgba(130,35,43,0.12), transparent 32%), #0b0f1a',
  color: 'white',
}

const containerStyle: CSSProperties = {
  width: 'min(1120px, calc(100% - 32px))',
  margin: '0 auto',
}

const heroStyle: CSSProperties = {
  padding: '54px 0 24px',
}

const labelStyle: CSSProperties = {
  color: '#d95b64',
  fontWeight: 900,
  letterSpacing: '2px',
  textTransform: 'uppercase',
  fontSize: '12px',
  marginBottom: '8px',
}

const titleStyle: CSSProperties = {
  fontSize: 'clamp(2.2rem, 6vw, 4.4rem)',
  lineHeight: 1.02,
  margin: 0,
  letterSpacing: '-0.7px',
}

const introTextStyle: CSSProperties = {
  maxWidth: '860px',
  color: '#d7dbe3',
  fontSize: '16px',
  lineHeight: 1.7,
  marginTop: '16px',
}

const contentStyle: CSSProperties = {
  padding: '18px 0 72px',
}

const mutedTextStyle: CSSProperties = {
  color: '#d7dbe3',
  lineHeight: 1.6,
}

const messageBoxStyle: CSSProperties = {
  background: 'rgba(185,68,79,0.18)',
  border: '1px solid rgba(185,68,79,0.28)',
  color: '#f3dede',
  borderRadius: '18px',
  padding: '18px',
}

const emptyBoxStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.045)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: '18px',
  padding: '20px',
  color: '#d7dbe3',
}

const pastDetailsStyle: CSSProperties = {
  marginBottom: '22px',
  background: 'rgba(255,255,255,0.035)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '18px',
  overflow: 'hidden',
}

const pastSummaryStyle: CSSProperties = {
  cursor: 'pointer',
  listStyle: 'none',
  padding: '16px 18px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  color: '#b9bec9',
  fontWeight: 800,
  fontSize: '15px',
}

const mainEventsSectionStyle: CSSProperties = {
  marginBottom: '22px',
}

const sectionHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '16px',
  marginBottom: '16px',
}

const sectionTitleStyle: CSSProperties = {
  fontSize: 'clamp(2rem, 4.5vw, 3.3rem)',
  lineHeight: 1.05,
  margin: 0,
}

const countBadgeStyle: CSSProperties = {
  minWidth: '34px',
  height: '34px',
  borderRadius: '999px',
  background: 'rgba(185,68,79,0.20)',
  color: '#f3dede',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 900,
}

const eventsListStyle: CSSProperties = {
  display: 'grid',
  gap: '16px',
}

const compactListStyle: CSSProperties = {
  display: 'grid',
  gap: '12px',
  padding: '0 14px 14px',
}

const eventCardStyle: CSSProperties = {
  cursor: 'pointer',
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(180px, 260px) minmax(190px, 260px)',
  gap: '18px',
  alignItems: 'center',
  background: 'rgba(255,255,255,0.045)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: '20px',
  padding: '18px',
  transition: 'transform 0.2s ease, border-color 0.2s ease',
}

const compactEventCardStyle: CSSProperties = {
  ...eventCardStyle,
  gridTemplateColumns: 'minmax(0, 1fr) minmax(150px, 220px) minmax(170px, 230px)',
  padding: '14px',
  borderRadius: '16px',
  background: 'rgba(255,255,255,0.035)',
}

const eventLeftStyle: CSSProperties = {
  minWidth: 0,
}

const eventTitleBadgeStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  width: 'fit-content',
  maxWidth: '100%',
  margin: '0 0 9px',
  padding: '7px 14px',
  borderRadius: '999px',
  background: 'linear-gradient(180deg, #b9444f 0%, #82232b 100%)',
  color: 'white',
  fontSize: 'clamp(14px, 1.7vw, 17px)',
  lineHeight: 1.18,
  fontWeight: 800,
  letterSpacing: '-0.15px',
  boxShadow: '0 8px 18px rgba(80,10,18,0.24)',
}

const eventDateStyle: CSSProperties = {
  margin: '0 0 7px',
  color: '#f2f2f2',
  fontSize: '14px',
  fontWeight: 800,
  lineHeight: 1.4,
}

const eventLocationStyle: CSSProperties = {
  margin: '0 0 9px',
  color: '#d7dbe3',
  fontSize: '14px',
  lineHeight: 1.45,
}

const eventDescriptionStyle: CSSProperties = {
  margin: 0,
  color: '#cfd3dc',
  fontSize: '14px',
  lineHeight: 1.6,
  whiteSpace: 'pre-line',
}

const eventImageAreaStyle: CSSProperties = {
  width: '100%',
}

const eventImageStyle: CSSProperties = {
  width: '100%',
  height: '135px',
  objectFit: 'cover',
  borderRadius: '14px',
  border: '1px solid rgba(255,255,255,0.10)',
  display: 'block',
}

const eventImagePlaceholderStyle: CSSProperties = {
  width: '100%',
  height: '135px',
  borderRadius: '14px',
  background:
    'linear-gradient(135deg, rgba(185,68,79,0.22), rgba(255,255,255,0.05))',
  border: '1px solid rgba(255,255,255,0.10)',
  color: '#f3dede',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: '1px',
  fontSize: '12px',
}

const eventRightStyle: CSSProperties = {
  display: 'grid',
  gap: '10px',
  alignContent: 'center',
}

const eventExternalLinkStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 'fit-content',
  maxWidth: '100%',
  background: 'rgba(255,255,255,0.92)',
  color: '#111',
  textDecoration: 'none',
  borderRadius: '999px',
  padding: '9px 13px',
  fontSize: '13px',
  fontWeight: 900,
}

const documentsBoxStyle: CSSProperties = {
  display: 'grid',
  gap: '7px',
}

const documentsTitleStyle: CSSProperties = {
  margin: 0,
  color: '#d95b64',
  fontSize: '12px',
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: '1px',
}

const documentLinkStyle: CSSProperties = {
  color: '#f2f2f2',
  textDecoration: 'none',
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
  padding: '8px 10px',
  fontSize: '12px',
  fontWeight: 800,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const noDocsStyle: CSSProperties = {
  margin: 0,
  color: '#b9bec9',
  fontSize: '13px',
  lineHeight: 1.5,
}

const futureDetailsStyle: CSSProperties = {
  marginTop: '22px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.085)',
  borderRadius: '18px',
  overflow: 'hidden',
}

const futureSummaryStyle: CSSProperties = {
  cursor: 'pointer',
  listStyle: 'none',
  padding: '16px 18px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  color: '#f2f2f2',
  fontWeight: 850,
  fontSize: '15px',
}

export default CalendarioEventi