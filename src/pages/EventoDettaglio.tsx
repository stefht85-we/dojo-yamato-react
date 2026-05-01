import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
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

function EventoDettaglio() {
  const { eventId } = useParams()
  const [event, setEvent] = useState<DojoEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function loadEvent() {
      setLoading(true)
      setMessage('')

      if (!eventId) {
        setMessage('Evento non valido.')
        setLoading(false)
        return
      }

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
        .eq('id', eventId)
        .eq('visible', true)
        .single()

      if (error) {
        console.error('Errore caricamento evento:', error)
        setMessage('Evento non trovato o non disponibile.')
        setLoading(false)
        return
      }

      setEvent(data as DojoEvent)
      setLoading(false)
    }

    loadEvent()
  }, [eventId])

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

    return 'Data da definire'
  }

  return (
    <main className="calendar-page">
      <div className="calendar-container">
        <Link to="/calendario-eventi" className="event-detail-back">
          ← Torna al calendario eventi
        </Link>

        {loading && <p className="calendar-text">Caricamento evento...</p>}

        {!loading && message && (
          <div className="calendar-empty-box">
            <p>{message}</p>
          </div>
        )}

        {!loading && event && (
          <article className="event-detail-card">
            <div className="event-detail-main">
              <div>
                <p className="calendar-label">Evento</p>

                <h1>{event.title}</h1>

                <div className="event-detail-badges">
                  <span className="calendar-date-badge">{formatEventDate(event)}</span>

                  {event.location && (
                    <span className="event-detail-location">📍 {event.location}</span>
                  )}
                </div>

                {event.description && (
                  <p className="event-detail-description">{event.description}</p>
                )}
              </div>

              {event.image_url && (
                <img
                  src={event.image_url}
                  alt={event.title}
                  className="event-detail-image"
                />
              )}
            </div>

            <div className="event-detail-side">
              {event.external_url && (
                <a
                  href={event.external_url}
                  target="_blank"
                  rel="noreferrer"
                  className="calendar-primary-action"
                >
                  {event.external_url_label || 'Apri link evento'}
                </a>
              )}

              {event.event_documents && event.event_documents.length > 0 && (
                <div className="event-detail-documents">
                  <h2>Documenti allegati</h2>

                  {event.event_documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="calendar-document-link"
                    >
                      📄 {doc.title}
                    </a>
                  ))}
                </div>
              )}

              {!event.external_url &&
                (!event.event_documents || event.event_documents.length === 0) && (
                  <p className="calendar-no-info">Nessun allegato disponibile.</p>
                )}
            </div>
          </article>
        )}
      </div>
    </main>
  )
}

export default EventoDettaglio