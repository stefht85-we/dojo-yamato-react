import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

type NewsDocument = {
  id: string
  news_id: string
  title: string
  file_url: string
  file_type: string | null
  created_at: string
}

type NewsItem = {
  id: string
  title: string
  content: string
  image_url: string | null
  published: boolean
  news_date: string | null
  created_at: string
  news_documents?: NewsDocument[]
}

function News() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [showPastNews, setShowPastNews] = useState(false)

  useEffect(() => {
    async function loadNews() {
      setLoading(true)
      setMessage('')

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
        .eq('published', true)
        .order('news_date', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Errore caricamento news:', error)
        setMessage('Non è stato possibile caricare le news.')
        setLoading(false)
        return
      }

      setNews((data ?? []) as NewsItem[])
      setLoading(false)
    }

    loadNews()
  }, [])

  const fiveDaysAgo = useMemo(() => {
    const date = new Date()
    date.setDate(date.getDate() - 5)
    date.setHours(0, 0, 0, 0)
    return date
  }, [])

  function getNewsDate(item: NewsItem) {
    return new Date(item.news_date ?? item.created_at)
  }

  function formatNewsDate(item: NewsItem) {
    return getNewsDate(item).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  const currentNews = news.filter((item) => {
    return getNewsDate(item).getTime() >= fiveDaysAgo.getTime()
  })

  const pastNews = news.filter((item) => {
    return getNewsDate(item).getTime() < fiveDaysAgo.getTime()
  })

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <section style={introStyle}>
          <p style={labelStyle}>News</p>

          <h1 style={titleStyle}>Novità dal Dojo</h1>

          <p style={textStyle}>
            Comunicazioni, aggiornamenti e avvisi ufficiali del Dojo Yamato.
          </p>
        </section>

        {loading && <p style={textStyle}>Caricamento news...</p>}

        {!loading && message && (
          <div style={emptyBoxStyle}>
            <p style={{ margin: 0 }}>{message}</p>
          </div>
        )}

        {!loading && !message && news.length === 0 && (
          <div style={emptyBoxStyle}>
            <h2 style={{ marginTop: 0, color: 'white' }}>
              Nessuna news disponibile
            </h2>

            <p style={{ marginBottom: 0 }}>
              Le comunicazioni saranno pubblicate prossimamente.
            </p>
          </div>
        )}

        {!loading && !message && news.length > 0 && (
          <>
            <section style={pastSectionStyle}>
              <button
                type="button"
                onClick={() => setShowPastNews(!showPastNews)}
                style={accordionButtonStyle}
              >
                <span>News passate</span>
                <span>
                  {pastNews.length} {showPastNews ? '−' : '+'}
                </span>
              </button>

              {showPastNews && (
                <div style={accordionContentStyle}>
                  {pastNews.length === 0 && (
                    <div style={emptyBoxStyle}>
                      <p style={{ margin: 0 }}>
                        Non ci sono ancora news passate archiviate.
                      </p>
                    </div>
                  )}

                  {pastNews.length > 0 && (
                    <div style={newsListStyle}>
                      {pastNews.map((item) => (
                        <NewsCard
                          key={item.id}
                          item={item}
                          dateLabel={formatNewsDate(item)}
                          past
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>

            <section style={mainSectionStyle}>
              <div style={sectionHeaderStyle}>
                <div>
                  <p style={smallLabelStyle}>Ultimi aggiornamenti</p>
                  <h2 style={sectionTitleStyle}>News attuali</h2>
                </div>

                <span style={countBadgeStyle}>{currentNews.length}</span>
              </div>

              {currentNews.length === 0 && (
                <div style={emptyBoxStyle}>
                  <p style={{ margin: 0 }}>
                    Non ci sono news pubblicate negli ultimi 5 giorni.
                  </p>
                </div>
              )}

              {currentNews.length > 0 && (
                <div style={newsListStyle}>
                  {currentNews.map((item) => (
                    <NewsCard
                      key={item.id}
                      item={item}
                      dateLabel={formatNewsDate(item)}
                      current
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  )
}

type NewsCardProps = {
  item: NewsItem
  dateLabel: string
  current?: boolean
  past?: boolean
}

function NewsCard({ item, dateLabel, current, past }: NewsCardProps) {
  const navigate = useNavigate()

  function openNews() {
    navigate(`/news/${item.id}`)
  }

  return (
    <article
      onClick={openNews}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') openNews()
      }}
      style={{
        ...newsCardStyle,
        cursor: 'pointer',
        opacity: past ? 0.78 : 1,
        border: current
          ? '1px solid rgba(230,57,70,0.45)'
          : '1px solid rgba(255,255,255,0.10)',
      }}
      title="Apri dettaglio news"
    >
      <div style={newsInfoStyle}>
        <span style={dateBadgeStyle}>{dateLabel}</span>

        {current && <span style={newBadgeStyle}>Nuova</span>}

        {past && <span style={pastBadgeStyle}>Archivio</span>}

        <h3 style={newsTitleStyle}>{item.title}</h3>

        <p style={newsTextStyle}>
          {item.content.length > 220
            ? item.content.substring(0, 220) + '...'
            : item.content}
        </p>

        {item.news_documents && item.news_documents.length > 0 && (
          <p style={docsCountStyle}>
            📎 {item.news_documents.length} allegato/i
          </p>
        )}
      </div>

      {item.image_url && (
        <div style={newsImageWrapperStyle}>
          <img src={item.image_url} alt={item.title} style={newsImageStyle} />
        </div>
      )}
    </article>
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
  maxWidth: '1050px',
  margin: '0 auto',
}

const introStyle: React.CSSProperties = {
  marginBottom: '30px',
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
  fontSize: 'clamp(2.3rem, 6vw, 4rem)',
  margin: 0,
  lineHeight: 1.05,
}

const textStyle: React.CSSProperties = {
  maxWidth: '760px',
  marginTop: '18px',
  color: '#cfd3dc',
  fontSize: '17px',
  lineHeight: 1.7,
}

const pastSectionStyle: React.CSSProperties = {
  marginBottom: '34px',
  opacity: 0.86,
}

const mainSectionStyle: React.CSSProperties = {
  marginTop: '34px',
}

const sectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '16px',
  alignItems: 'center',
  flexWrap: 'wrap',
  marginBottom: '16px',
}

const smallLabelStyle: React.CSSProperties = {
  color: '#e63946',
  fontWeight: 800,
  letterSpacing: '1.5px',
  textTransform: 'uppercase',
  margin: 0,
  fontSize: '12px',
}

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '28px',
  margin: '6px 0 0',
}

const countBadgeStyle: React.CSSProperties = {
  background: 'rgba(230,57,70,0.18)',
  color: '#ffd7d7',
  padding: '7px 11px',
  borderRadius: '999px',
  fontWeight: 800,
  fontSize: '13px',
}

const newsListStyle: React.CSSProperties = {
  display: 'grid',
  gap: '14px',
}

const newsCardStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 170px',
  gap: '18px',
  alignItems: 'center',
  background: 'rgba(255,255,255,0.06)',
  borderRadius: '18px',
  padding: '18px',
  boxShadow: '0 14px 34px rgba(0,0,0,0.14)',
}

const newsInfoStyle: React.CSSProperties = {
  minWidth: 0,
}

const dateBadgeStyle: React.CSSProperties = {
  display: 'inline-block',
  background: 'rgba(255,255,255,0.10)',
  color: '#d8d8d8',
  padding: '5px 9px',
  borderRadius: '999px',
  fontSize: '12px',
  fontWeight: 800,
  marginRight: '8px',
}

const newBadgeStyle: React.CSSProperties = {
  display: 'inline-block',
  background: 'rgba(230,57,70,0.22)',
  color: '#ffd7d7',
  padding: '5px 9px',
  borderRadius: '999px',
  fontSize: '12px',
  fontWeight: 900,
}

const pastBadgeStyle: React.CSSProperties = {
  display: 'inline-block',
  background: 'rgba(255,255,255,0.08)',
  color: '#bfc5d0',
  padding: '5px 9px',
  borderRadius: '999px',
  fontSize: '12px',
  fontWeight: 800,
}

const newsTitleStyle: React.CSSProperties = {
  fontSize: '22px',
  margin: '12px 0 8px',
  lineHeight: 1.25,
}

const newsTextStyle: React.CSSProperties = {
  color: '#cfd3dc',
  lineHeight: 1.6,
  margin: 0,
  whiteSpace: 'pre-line',
}

const docsCountStyle: React.CSSProperties = {
  color: '#ffd7d7',
  fontSize: '13px',
  fontWeight: 800,
  margin: '10px 0 0',
}

const newsImageWrapperStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
}

const newsImageStyle: React.CSSProperties = {
  width: '170px',
  height: '115px',
  objectFit: 'cover',
  borderRadius: '14px',
}

const accordionButtonStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid rgba(255,255,255,0.10)',
  background: 'rgba(255,255,255,0.045)',
  color: 'rgba(255,255,255,0.78)',
  borderRadius: '18px',
  padding: '15px 18px',
  cursor: 'pointer',
  fontWeight: 800,
  fontSize: '15px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}

const accordionContentStyle: React.CSSProperties = {
  marginTop: '14px',
}

const emptyBoxStyle: React.CSSProperties = {
  marginTop: '18px',
  background: 'rgba(255,255,255,0.055)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: '18px',
  padding: '22px',
  color: '#d8d8d8',
}

export default News