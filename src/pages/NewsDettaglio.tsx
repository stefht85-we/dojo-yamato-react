import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

type NewsDocument = {
  id: string
  news_id: number
  title: string
  file_url: string
  file_type: string | null
  created_at: string
}

type NewsItem = {
  id: number
  title: string
  content: string
  image_url: string | null
  published: boolean
  news_date: string | null
  created_at: string
  news_documents?: NewsDocument[]
}

function NewsDettaglio() {
  const { newsId } = useParams()
  const [news, setNews] = useState<NewsItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function loadNews() {
      setLoading(true)
      setMessage('')

      if (!newsId) {
        setMessage('News non valida.')
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('news')
        .select(`
          id,
          title,
          content,
          image_url,
          published,
          news_date,
          created_at,
          news_documents (
            id,
            news_id,
            title,
            file_url,
            file_type,
            created_at
          )
        `)
        .eq('id', newsId)
        .eq('published', true)
        .single()

      if (error) {
        console.error('Errore caricamento news:', error)
        setMessage('News non trovata o non disponibile.')
        setLoading(false)
        return
      }

      setNews(data as NewsItem)
      setLoading(false)
    }

    loadNews()
  }, [newsId])

  function formatNewsDate(item: NewsItem) {
    return new Date(item.news_date ?? item.created_at).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <Link to="/news" style={backLinkStyle}>
          ← Torna alle news
        </Link>

        {loading && <p style={textStyle}>Caricamento news...</p>}

        {!loading && message && (
          <div style={emptyBoxStyle}>
            <p style={{ margin: 0 }}>{message}</p>
          </div>
        )}

        {!loading && news && (
          <article style={detailCardStyle}>
            <div style={mainContentStyle}>
              <p style={labelStyle}>News</p>

              <h1 style={titleStyle}>{news.title}</h1>

              <span style={dateBadgeStyle}>{formatNewsDate(news)}</span>

              {news.image_url && (
                <img
                  src={news.image_url}
                  alt={news.title}
                  style={heroImageStyle}
                />
              )}

              <p style={contentStyle}>{news.content}</p>
            </div>

            <aside style={sideStyle}>
              <h2 style={sideTitleStyle}>Allegati</h2>

              {news.news_documents && news.news_documents.length > 0 ? (
                <div style={docsListStyle}>
                  {news.news_documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.file_url}
                      target="_blank"
                      rel="noreferrer"
                      style={docLinkStyle}
                    >
                      📄 {doc.title}
                    </a>
                  ))}
                </div>
              ) : (
                <p style={mutedTextStyle}>Nessun documento allegato.</p>
              )}
            </aside>
          </article>
        )}
      </div>
    </main>
  )
}

const pageStyle: React.CSSProperties = {
  minHeight: '90vh',
  background:
    'radial-gradient(circle at top, rgba(230,57,70,0.14), transparent 34%), #0b0f1a',
  color: 'white',
  padding: '80px 24px',
}

const containerStyle: React.CSSProperties = {
  maxWidth: '1100px',
  margin: '0 auto',
}

const backLinkStyle: React.CSSProperties = {
  display: 'inline-block',
  color: '#e63946',
  textDecoration: 'none',
  fontWeight: 800,
  marginBottom: '26px',
}

const detailCardStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 260px',
  gap: '28px',
  background: 'rgba(255,255,255,0.055)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: '22px',
  padding: '26px',
}

const mainContentStyle: React.CSSProperties = {
  minWidth: 0,
}

const labelStyle: React.CSSProperties = {
  color: '#e63946',
  fontWeight: 800,
  letterSpacing: '2px',
  textTransform: 'uppercase',
  marginBottom: '12px',
  fontSize: '13px',
}

const titleStyle: React.CSSProperties = {
  fontSize: 'clamp(2.2rem, 5vw, 3.8rem)',
  margin: 0,
  lineHeight: 1.05,
}

const dateBadgeStyle: React.CSSProperties = {
  display: 'inline-block',
  marginTop: '18px',
  background: 'rgba(255,255,255,0.10)',
  color: '#d8d8d8',
  padding: '7px 11px',
  borderRadius: '999px',
  fontSize: '13px',
  fontWeight: 800,
}

const heroImageStyle: React.CSSProperties = {
  width: '100%',
  maxHeight: '420px',
  objectFit: 'cover',
  borderRadius: '18px',
  marginTop: '24px',
}

const contentStyle: React.CSSProperties = {
  color: '#cfd3dc',
  lineHeight: 1.8,
  fontSize: '17px',
  whiteSpace: 'pre-line',
  marginTop: '24px',
}

const sideStyle: React.CSSProperties = {
  borderLeft: '1px solid rgba(255,255,255,0.10)',
  paddingLeft: '24px',
  alignSelf: 'start',
}

const sideTitleStyle: React.CSSProperties = {
  marginTop: 0,
  fontSize: '20px',
}

const docsListStyle: React.CSSProperties = {
  display: 'grid',
  gap: '10px',
}

const docLinkStyle: React.CSSProperties = {
  color: 'white',
  textDecoration: 'none',
  background: 'rgba(255,255,255,0.10)',
  padding: '10px 12px',
  borderRadius: '999px',
  fontSize: '13px',
  fontWeight: 800,
}

const mutedTextStyle: React.CSSProperties = {
  color: '#cfd3dc',
  lineHeight: 1.6,
}

const textStyle: React.CSSProperties = {
  color: '#cfd3dc',
  fontSize: '17px',
  lineHeight: 1.7,
}

const emptyBoxStyle: React.CSSProperties = {
  marginTop: '18px',
  background: 'rgba(255,255,255,0.055)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: '18px',
  padding: '22px',
  color: '#d8d8d8',
}

export default NewsDettaglio