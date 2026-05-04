import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

type NewsItem = {
  id: number
  title: string
  content: string
  image_url: string | null
  cover_image_url: string | null
  published: boolean
  news_date: string | null
  created_at: string
}

function News() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNews()
  }, [])

  async function loadNews() {
    setLoading(true)

    const { data, error } = await supabase
      .from('news')
      .select('id, title, content, image_url, cover_image_url, published, news_date, created_at')
      .eq('published', true)
      .order('news_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Errore caricamento news:', error.message)
      setNews([])
      setLoading(false)
      return
    }

    setNews((data ?? []) as NewsItem[])
    setLoading(false)
  }

  function getDate(item: NewsItem) {
    const dateValue = item.news_date || item.created_at

    if (!dateValue) return ''

    return new Date(dateValue).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  function getPreviewText(text: string) {
    if (!text) return ''
    if (text.length <= 150) return text
    return `${text.substring(0, 150)}...`
  }

  function getCover(item: NewsItem) {
    return item.cover_image_url || item.image_url || ''
  }

  return (
    <main style={pageStyle}>
      <section style={heroStyle}>
        <p style={labelStyle}>A.S.D. DOJO YAMATO</p>
        <h1 style={titleStyle}>News</h1>
        <p style={introStyle}>
          Tutte le novità, gli eventi e gli aggiornamenti dal Dojo.
        </p>
      </section>

      <section style={contentStyle}>
        {loading && <p style={mutedStyle}>Caricamento news...</p>}

        {!loading && news.length === 0 && (
          <div style={emptyBoxStyle}>Non sono ancora presenti news pubblicate.</div>
        )}

        {!loading && news.length > 0 && (
          <div style={gridStyle}>
            {news.map((item) => {
              const cover = getCover(item)

              return (
                <article key={item.id} style={cardStyle}>
                  <Link to={`/news/${item.id}`} style={coverLinkStyle}>
                    <div style={coverBoxStyle}>
                      {cover ? (
                        <img src={cover} alt={item.title} style={coverImageStyle} />
                      ) : (
                        <div style={coverPlaceholderStyle}>NEWS</div>
                      )}
                    </div>
                  </Link>

                  <div style={cardBodyStyle}>
                    <p style={dateStyle}>Pubblicata il {getDate(item)}</p>

                    <h2 style={cardTitleStyle}>
                      <Link to={`/news/${item.id}`} style={titleLinkStyle}>
                        {item.title}
                      </Link>
                    </h2>

                    <p style={cardTextStyle}>{getPreviewText(item.content)}</p>

                    <Link to={`/news/${item.id}`} style={buttonStyle}>
                      Leggi tutto
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
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

const labelStyle: CSSProperties = {
  margin: 0,
  color: '#e63946',
  fontWeight: 900,
  letterSpacing: '2px',
  textTransform: 'uppercase',
  fontSize: '13px',
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 'clamp(48px, 7vw, 78px)',
  lineHeight: 1,
  fontWeight: 950,
}

const introStyle: CSSProperties = {
  margin: 0,
  maxWidth: '820px',
  color: '#d8d8d8',
  fontSize: '18px',
  lineHeight: 1.7,
}

const contentStyle: CSSProperties = {
  width: 'min(1180px, calc(100% - 8px))',
  margin: '0 auto',
}

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '22px',
}

const cardStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.055)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: '20px',
  overflow: 'hidden',
  boxShadow: '0 18px 42px rgba(0,0,0,0.18)',
}

const coverLinkStyle: CSSProperties = {
  display: 'block',
  textDecoration: 'none',
}

const coverBoxStyle: CSSProperties = {
  height: '210px',
  background: '#176a82',
  overflow: 'hidden',
}

const coverImageStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
}

const coverPlaceholderStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  background: 'linear-gradient(135deg, #176a82 0%, #0f4658 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  fontWeight: 950,
  letterSpacing: '1px',
}

const cardBodyStyle: CSSProperties = {
  padding: '20px',
  display: 'grid',
  gap: '10px',
}

const dateStyle: CSSProperties = {
  margin: 0,
  color: '#e63946',
  fontSize: '13px',
  fontWeight: 900,
}

const cardTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: '25px',
  lineHeight: 1.15,
}

const titleLinkStyle: CSSProperties = {
  color: 'white',
  textDecoration: 'none',
}

const cardTextStyle: CSSProperties = {
  margin: 0,
  color: '#d8d8d8',
  lineHeight: 1.6,
}

const buttonStyle: CSSProperties = {
  width: 'fit-content',
  marginTop: '8px',
  padding: '11px 18px',
  borderRadius: '999px',
  background: '#e63946',
  color: 'white',
  textDecoration: 'none',
  fontWeight: 900,
}

const mutedStyle: CSSProperties = {
  color: '#d8d8d8',
}

const emptyBoxStyle: CSSProperties = {
  padding: '20px',
  borderRadius: '16px',
  background: 'rgba(255,255,255,0.055)',
  border: '1px solid rgba(255,255,255,0.09)',
  color: '#d8d8d8',
}

export default News