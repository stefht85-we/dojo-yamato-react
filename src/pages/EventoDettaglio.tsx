import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { getSignedUrlFromPublicUrl } from '../lib/storageSignedUrl'

type EventDocument = {
  id: string
  event_id: string
  title: string
  file_url: string
  file_type: string | null
  created_at: string
  signed_file_url?: string | null
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
  signed_image_url?: string | null
}

export default function EventoDettaglio() {
  const { eventoId } = useParams()
  const [event, setEvent] = useState<DojoEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadEvent()
  }, [eventoId])

  async function loadEvent() {
    if (!eventoId) {
      setMessage('Evento non valido.')
      setLoading(false)
      return
    }

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
      .eq('id', eventoId)
      .eq('visible', true)
      .single()

    if (error) {
      console.error('Errore caricamento evento:', error.message)
      setMessage('Evento non trovato o non disponibile.')
      setEvent(null)
      setLoading(false)
      return
    }

    const signedImageUrl = await getSignedUrlFromPublicUrl(data.image_url)

    const signedDocuments = await Promise.all(
      ((data.event_documents ?? []) as EventDocument[]).map(async (doc) => ({
        ...doc,
        signed_file_url: await getSignedUrlFromPublicUrl(doc.file_url),
      }))
    )

    setEvent({
      ...(data as DojoEvent),
      signed_image_url: signedImageUrl || data.image_url,
      event_documents: signedDocuments,
    })

    setLoading(false)
  }

  function formatEventDate(item: DojoEvent) {
    if (item.event_date && !item.is_date_provisional) {
      return new Date(item.event_date).toLocaleDateString('it-IT', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    }

    if (item.provisional_year && item.provisional_month) {
      const date = new Date(item.provisional_year, item.provisional_month - 1, 1)
      return `${date.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })} · data provvisoria`
    }

    return 'Data da definire'
  }

  function getDocumentBadge(doc: EventDocument) {
    const type = doc.file_type?.toLowerCase() || ''
    const title = doc.title.toLowerCase()
    const url = doc.file_url.toLowerCase()

    if (type.includes('pdf') || title.endsWith('.pdf') || url.endsWith('.pdf')) return 'PDF'
    if (type.includes('word') || title.endsWith('.doc') || title.endsWith('.docx')) return 'DOC'
    if (type.includes('powerpoint') || title.endsWith('.ppt') || title.endsWith('.pptx')) return 'PPT'
    if (type.includes('excel') || title.endsWith('.xls') || title.endsWith('.xlsx')) return 'XLS'
    if (type.includes('image') || url.match(/\.(jpg|jpeg|png|webp|gif)$/)) return 'IMG'

    return 'FILE'
  }

  if (loading) {
    return (
      <main style={pageStyle}>
        <section style={heroStyle}>
          <p style={mutedText}>Caricamento evento...</p>
        </section>
      </main>
    )
  }

  if (!event || message) {
    return (
      <main style={pageStyle}>
        <section style={heroStyle}>
          <p style={pageBadgeStyle}>Evento</p>
          <h1 style={titleStyle}>Evento non trovato</h1>
          <p style={introStyle}>{message || 'La pagina evento non è disponibile.'}</p>
          <Link to="/calendario-eventi" style={primaryButtonStyle}>Torna agli eventi</Link>
        </section>
      </main>
    )
  }

  return (
    <main style={pageStyle}>
      <section style={heroStyle}>
        <Link to="/calendario-eventi" style={backLinkStyle}>← Torna agli eventi</Link>
        <p style={pageBadgeStyle}>Evento Dojo Yamato</p>
        <h1 style={titleStyle}>{event.title}</h1>

        <div style={eventMetaGridStyle}>
          <div style={metaCardStyle}>
            <span style={metaLabelStyle}>Data</span>
            <strong style={metaValueStyle}>{formatEventDate(event)}</strong>
          </div>

          <div style={metaCardStyle}>
            <span style={metaLabelStyle}>Luogo</span>
            <strong style={metaValueStyle}>{event.location || 'Da definire'}</strong>
          </div>
        </div>
      </section>

      <section style={contentStyle}>
        {event.signed_image_url && (
          <div style={imageWrapStyle}>
            <img src={event.signed_image_url} alt={event.title} style={eventImageStyle} />
          </div>
        )}

        <div style={mainGridStyle}>
          <article style={contentCardStyle}>
            <p style={sectionBadgeStyle}>Dettagli</p>
            <h2 style={sectionTitleStyle}>Informazioni evento</h2>

            {event.description ? (
              <div style={descriptionStyle}>
                {event.description.split('\n').map((line, index) => (
                  <p key={`${line}-${index}`} style={paragraphStyle}>{line}</p>
                ))}
              </div>
            ) : (
              <p style={mutedText}>Descrizione non disponibile.</p>
            )}

            {event.external_url && (
              <a href={event.external_url} target="_blank" rel="noreferrer" style={primaryButtonStyle}>
                {event.external_url_label || 'Apri link evento'}
              </a>
            )}
          </article>

          <aside style={sideCardStyle}>
            <p style={sectionBadgeStyle}>Documenti</p>
            <h2 style={sideTitleStyle}>Allegati evento</h2>

            {!event.event_documents || event.event_documents.length === 0 ? (
              <p style={mutedText}>Nessun documento allegato.</p>
            ) : (
              <div style={documentsListStyle}>
                {event.event_documents.map((doc) => (
                  <a key={doc.id} href={doc.signed_file_url || doc.file_url} target="_blank" rel="noreferrer" style={documentRowStyle}>
                    <span style={documentBadgeStyle}>{getDocumentBadge(doc)}</span>
                    <span style={documentTitleStyle}>{doc.title}</span>
                  </a>
                ))}
              </div>
            )}
          </aside>
        </div>
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

const pageStyle: CSSProperties = { minHeight: '100vh', background: '#020817', color: 'white', padding: '58px 24px 90px' }
const heroStyle: CSSProperties = { width: 'min(1180px, calc(100% - 8px))', margin: '0 auto 34px', display: 'grid', gap: '16px' }
const backLinkStyle: CSSProperties = { color: '#d8d8d8', textDecoration: 'none', fontWeight: 900, width: 'fit-content' }
const pageBadgeStyle: CSSProperties = dojoBadgeStyle
const titleStyle: CSSProperties = { margin: 0, fontSize: 'clamp(46px, 8vw, 82px)', lineHeight: 0.98, fontWeight: 950 }
const introStyle: CSSProperties = { margin: 0, maxWidth: '850px', color: '#d8d8d8', fontSize: '18px', lineHeight: 1.7 }
const eventMetaGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginTop: '8px' }
const metaCardStyle: CSSProperties = { padding: '16px', borderRadius: '18px', background: 'linear-gradient(180deg, rgba(255,255,255,0.075), rgba(255,255,255,0.04))', border: '1px solid rgba(255,255,255,0.10)' }
const metaLabelStyle: CSSProperties = { display: 'block', color: '#d8d8d8', fontSize: '13px', fontWeight: 800, marginBottom: '6px' }
const metaValueStyle: CSSProperties = { color: 'white', fontSize: '17px', lineHeight: 1.4 }
const contentStyle: CSSProperties = { width: 'min(1180px, calc(100% - 8px))', margin: '0 auto', display: 'grid', gap: '22px' }
const imageWrapStyle: CSSProperties = { borderRadius: '24px', overflow: 'hidden', background: 'rgba(255,255,255,0.045)', border: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 16px 36px rgba(0,0,0,0.32)' }
const eventImageStyle: CSSProperties = { width: '100%', maxHeight: '520px', objectFit: 'cover', display: 'block' }
const mainGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(280px, 0.8fr)', gap: '22px' }
const contentCardStyle: CSSProperties = { display: 'grid', gap: '16px', padding: '22px', borderRadius: '22px', background: 'linear-gradient(180deg, rgba(255,255,255,0.075), rgba(255,255,255,0.04))', border: '1px solid rgba(255,255,255,0.10)' }
const sideCardStyle: CSSProperties = { alignSelf: 'start', display: 'grid', gap: '16px', padding: '22px', borderRadius: '22px', background: 'linear-gradient(180deg, rgba(255,255,255,0.075), rgba(255,255,255,0.04))', border: '1px solid rgba(255,255,255,0.10)' }
const sectionBadgeStyle: CSSProperties = { ...dojoBadgeStyle, margin: 0 }
const sectionTitleStyle: CSSProperties = { margin: 0, fontSize: '30px', fontWeight: 950 }
const sideTitleStyle: CSSProperties = { margin: 0, fontSize: '24px', fontWeight: 950 }
const descriptionStyle: CSSProperties = { display: 'grid', gap: '12px' }
const paragraphStyle: CSSProperties = { margin: 0, color: '#d8d8d8', lineHeight: 1.75, fontSize: '16px' }
const primaryButtonStyle: CSSProperties = { width: 'fit-content', padding: '9px 15px', borderRadius: '999px', background: 'linear-gradient(180deg, #b9444f 0%, #82232b 100%)', color: 'white', textDecoration: 'none', fontWeight: 900, border: 'none', cursor: 'pointer', boxShadow: '0 8px 18px rgba(80,10,18,0.24)' }
const documentsListStyle: CSSProperties = { display: 'grid', gap: '10px' }
const documentRowStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', textDecoration: 'none' }
const documentBadgeStyle: CSSProperties = { ...dojoBadgeStyle, minWidth: '48px', height: '38px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', flexShrink: 0 }
const documentTitleStyle: CSSProperties = { minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '14px', fontWeight: 800 }
const mutedText: CSSProperties = { color: '#d8d8d8', lineHeight: 1.6 }
