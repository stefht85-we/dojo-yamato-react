import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { getSignedUrlFromPublicUrl } from '../lib/storageSignedUrl'

type NewsItem = {
  id: string
  title: string
  content: string
  image_url: string | null
  cover_image_url: string | null
  published: boolean
  news_date: string | null
  created_at: string
  signed_cover_url?: string | null
}

type PublicNewsProps = {
  limit?: number
  compact?: boolean
  showTitle?: boolean
}

export default function PublicNews({
  limit = 6,
  compact = false,
  showTitle = true,
}: PublicNewsProps) {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNews()
  }, [limit])

  async function loadNews() {
    setLoading(true)

    const { data, error } = await supabase
      .from('news')
      .select(
        'id, title, content, image_url, cover_image_url, published, news_date, created_at'
      )
      .eq('published', true)
      .order('news_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Errore caricamento news:', error)
      setNews([])
      setLoading(false)
      return
    }

    const newsWithSignedCover = await Promise.all(
      (data || []).map(async (item) => {
        const coverToSign = item.cover_image_url || item.image_url

        return {
          ...item,
          signed_cover_url: await getSignedUrlFromPublicUrl(coverToSign),
        }
      })
    )

    setNews(newsWithSignedCover)
    setLoading(false)
  }

  if (loading) {
    return <p style={styles.loading}>Caricamento news...</p>
  }

  if (news.length === 0) {
    return <p style={styles.empty}>Nessuna news disponibile al momento.</p>
  }

  return (
    <section style={styles.section}>
      {showTitle && (
        <div style={styles.header}>
          <p style={styles.kicker}>News</p>
          <h2 style={styles.title}>News dal dojo</h2>
          <p style={styles.subtitle}>
            Aggiornamenti, eventi e comunicazioni ufficiali del Dojo Yamato.
          </p>
        </div>
      )}

      <div
        style={{
          ...styles.grid,
          gridTemplateColumns: compact
            ? 'repeat(auto-fit, minmax(240px, 1fr))'
            : 'repeat(auto-fit, minmax(280px, 1fr))',
        }}
      >
        {news.map((item) => (
          <Link key={item.id} to={`/news/${item.id}`} style={styles.card}>
            {item.signed_cover_url && (
              <div style={styles.imageWrap}>
                <img
                  src={item.signed_cover_url}
                  alt={item.title}
                  loading="lazy"
                  style={styles.image}
                />
              </div>
            )}

            <div style={styles.cardBody}>
              <p style={styles.date}>{formatDate(item.news_date || item.created_at)}</p>

              <h3 style={styles.cardTitle}>{item.title}</h3>

              {!compact && (
                <p style={styles.excerpt}>{createExcerpt(item.content)}</p>
              )}

              <span style={styles.readMore}>Leggi la news →</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

function formatDate(dateString: string | null) {
  if (!dateString) return ''

  return new Date(dateString).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function createExcerpt(text: string) {
  if (!text) return ''
  return text.length > 130 ? `${text.slice(0, 130)}...` : text
}

const styles: Record<string, React.CSSProperties> = {
  section: {
    width: '100%',
  },
  header: {
    textAlign: 'center',
    marginBottom: 34,
  },
  kicker: {
    color: '#b9444f',
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 8,
  },
  title: {
    color: '#ffffff',
    fontSize: 'clamp(2rem, 4vw, 3rem)',
    margin: 0,
  },
  subtitle: {
    color: '#cbd5e1',
    maxWidth: 620,
    margin: '12px auto 0',
    lineHeight: 1.7,
  },
  grid: {
    display: 'grid',
    gap: 22,
  },
  card: {
    background: 'rgba(15, 23, 42, 0.88)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 22,
    overflow: 'hidden',
    textDecoration: 'none',
    color: 'inherit',
    boxShadow: '0 18px 45px rgba(0,0,0,0.28)',
    transition: 'transform 0.2s ease, border-color 0.2s ease',
  },
  imageWrap: {
    width: '100%',
    aspectRatio: '16 / 10',
    overflow: 'hidden',
    background: '#020817',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  cardBody: {
    padding: 20,
  },
  date: {
    color: '#b9444f',
    fontSize: 13,
    fontWeight: 700,
    margin: '0 0 8px',
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 21,
    margin: '0 0 10px',
    lineHeight: 1.25,
  },
  excerpt: {
    color: '#cbd5e1',
    fontSize: 15,
    lineHeight: 1.6,
    margin: '0 0 18px',
  },
  readMore: {
    color: '#ffffff',
    fontWeight: 700,
    fontSize: 14,
  },
  loading: {
    color: '#cbd5e1',
    textAlign: 'center',
  },
  empty: {
    color: '#cbd5e1',
    textAlign: 'center',
  },
}