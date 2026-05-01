import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import './CalendarioEventi.css'

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
  const [showPastEvents, setShowPastEvents] = useState(false)
  const [showLaterEvents, setShowLaterEvents] = useState(false)

  useEffect(() => {
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

      if (error) {
        console.error('Errore caricamento eventi:', error)
        setMessage('Non è stato possibile caricare il calendario eventi.')
        setLoading(false)
        return
      }

      setEvents((data ?? []) as DojoEvent[])
      setLoading(false)
    }

    loadEvents()
  }, [])

  function getEventDateValue(event: DojoEvent) {
    if (event.event_date) return new Date(event.event_date)

    if (event.provisional_year && event.provisional_month) {
      return new Date(event.provisional_year, event.provisional_month - 1, 1)
    }

    return new Date(event.created_at)
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
      const date = new Date(event.provisional_year, event.provisional_month - 1, 1)

      return `${date.toLocaleDateString('it-IT', {
        month: 'long',
        year: 'numeric',
      })} · data provvisoria`
    }

    if (event.event_date && event.is_date_provisional) {
      return `${new Date(event.event_date).toLocaleDateString('it-IT', {
        month: 'long',
        year: 'numeric',
      })} · data provvisoria`
    }

    return 'Data da definire'
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const threeMonthsLimit = new Date(today)
  threeMonthsLimit.setMonth(threeMonthsLimit.getMonth() + 3)
  threeMonthsLimit.setHours(23, 59, 59, 999)

  const sortedEvents = useMemo(() => {
    return [...events].sort(
      (a, b) => getEventDateValue(a).getTime() - getEventDateValue(b).getTime()
    )
  }, [events])

  const upcomingEvents = sortedEvents.filter((event) => {
    return getEventDateValue(event).getTime() >= today.getTime()
  })

  const nextThreeMonthsEvents = upcomingEvents.filter((event) => {
    return getEventDateValue(event).getTime() <= threeMonthsLimit.getTime()
  })

  const laterEvents = upcomingEvents.filter((event) => {
    return getEventDateValue(event).getTime() > threeMonthsLimit.getTime()
  })

  const pastEvents = sortedEvents.filter((event) => {
    return getEventDateValue(event).getTime() < today.getTime()
  })

  return (
    <main className="calendar-page">
      <div className="calendar-container">
        <section className="calendar-intro">
          <p className="calendar-label">Bacheca</p>

          <h1>Calendario eventi</h1>

          <p>Eventi, gare, stage e appuntamenti del Dojo Yamato.</p>
        </section>

        {loading && <p className="calendar-text">Caricamento eventi...</p>}

        {!loading && message && (
          <div className="calendar-empty-box">
            <p>{message}</p>
          </div>
        )}

        {!loading && !message && events.length === 0 && (
          <div className="calendar-empty-box">
            <h2>Nessun evento disponibile</h2>
            <p>Il calendario sarà aggiornato appena saranno disponibili nuovi eventi.</p>
          </div>
        )}

        {!loading && !message && events.length > 0 && (
          <>
            <section className="calendar-accordion-section calendar-past-section">
              <button
                type="button"
                onClick={() => setShowPastEvents(!showPastEvents)}
                className="calendar-accordion-button calendar-accordion-button-muted"
              >
                <span>Eventi passati</span>
                <span>{pastEvents.length} {showPastEvents ? '−' : '+'}</span>
              </button>

              {showPastEvents && (
                <div className="calendar-accordion-content">
                  {pastEvents.length === 0 && (
                    <div className="calendar-empty-box">
                      <p>Non ci sono ancora eventi passati archiviati.</p>
                    </div>
                  )}

                  {pastEvents.length > 0 && (
                    <div className="calendar-event-list">
                      {pastEvents.map((event) => (
                        <EventRow
                          key={event.id}
                          event={event}
                          formatEventDate={formatEventDate}
                          past
                          compact
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>

            <section className="calendar-main-section" style={{ marginTop: '34px' }}>
              <div className="calendar-section-header">
                <div>
                  <p className="calendar-small-label">Calendario</p>
                  <h2>Prossimi eventi</h2>
                </div>

                <span className="calendar-count-badge">
                  {nextThreeMonthsEvents.length}
                </span>
              </div>

              {nextThreeMonthsEvents.length === 0 && (
                <div className="calendar-empty-box">
                  <p>Al momento non ci sono eventi programmati nei prossimi 3 mesi.</p>
                </div>
              )}

              {nextThreeMonthsEvents.length > 0 && (
                <div className="calendar-event-list">
                  {nextThreeMonthsEvents.map((event) => (
                    <EventRow
                      key={event.id}
                      event={event}
                      formatEventDate={formatEventDate}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="calendar-accordion-section">
              <button
                type="button"
                onClick={() => setShowLaterEvents(!showLaterEvents)}
                className="calendar-accordion-button"
              >
                <span>Eventi futuri da 4 mesi in poi</span>
                <span>{laterEvents.length} {showLaterEvents ? '−' : '+'}</span>
              </button>

              {showLaterEvents && (
                <div className="calendar-accordion-content">
                  {laterEvents.length === 0 && (
                    <div className="calendar-empty-box">
                      <p>Non ci sono eventi programmati oltre i prossimi 3 mesi.</p>
                    </div>
                  )}

                  {laterEvents.length > 0 && (
                    <div className="calendar-event-list">
                      {laterEvents.map((event) => (
                        <EventRow
                          key={event.id}
                          event={event}
                          formatEventDate={formatEventDate}
                          compact
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  )
}

type EventRowProps = {
  event: DojoEvent
  formatEventDate: (event: DojoEvent) => string
  past?: boolean
  compact?: boolean
}

function EventRow({ event, formatEventDate, past, compact }: EventRowProps) {
  const navigate = useNavigate()

  function openEvent() {
    navigate(`/calendario-eventi/${event.id}`)
  }

  return (
    <article
      className={past ? 'calendar-event-row calendar-event-row-past' : 'calendar-event-row'}
      onClick={openEvent}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') openEvent()
      }}
      title="Apri dettaglio evento"
    >
      <div className="calendar-event-info">
        <span className="calendar-date-badge">{formatEventDate(event)}</span>

        <h3>{event.title}</h3>

        {event.location && (
          <p className="calendar-location">📍 {event.location}</p>
        )}

        {event.description && (
          <p className="calendar-description">
            {compact && event.description.length > 110
              ? event.description.substring(0, 110) + '...'
              : event.description}
          </p>
        )}

        {past && <span className="calendar-past-badge">Archiviato</span>}
      </div>

      <div className="calendar-event-image-column">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt={event.title}
            className="calendar-event-image"
          />
        ) : (
          <div className="calendar-event-placeholder">🥋</div>
        )}
      </div>

      <div className="calendar-event-actions">
        <button
          type="button"
          className="calendar-open-event-button"
          onClick={(e) => {
            e.stopPropagation()
            openEvent()
          }}
        >
          Apri evento
        </button>

        {event.external_url && (
          <a
            href={event.external_url}
            target="_blank"
            rel="noreferrer"
            className="calendar-primary-action"
            onClick={(e) => e.stopPropagation()}
          >
            {event.external_url_label || 'Link evento'}
          </a>
        )}

        {event.event_documents && event.event_documents.length > 0 && (
          <div className="calendar-documents-box">
            <p>Documenti</p>

            {event.event_documents.map((doc) => (
              <a
                key={doc.id}
                href={doc.file_url}
                target="_blank"
                rel="noreferrer"
                className="calendar-document-link"
                onClick={(e) => e.stopPropagation()}
              >
                📄 {doc.title}
              </a>
            ))}
          </div>
        )}

        {!event.external_url &&
          (!event.event_documents || event.event_documents.length === 0) && (
            <span className="calendar-no-info">Nessun allegato</span>
          )}
      </div>
    </article>
  )
}

export default CalendarioEventi