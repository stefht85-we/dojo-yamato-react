import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { getSignedUrlFromPublicUrl } from '../lib/storageSignedUrl'

type MediaType = 'image' | 'video' | 'pdf' | 'youtube' | 'social' | 'instagram' | 'facebook' | 'tiktok' | 'link'

type NewsItem = {
  id: string
  title: string
  content: string
  image_url: string | null
  cover_image_url: string | null
  published: boolean
  news_date: string | null
  created_at: string
}

type NewsMedia = {
  id: string
  news_id: string
  media_type: MediaType
  title: string | null
  url: string | null
  thumbnail_url: string | null
  sort_order: number | null
  created_at: string
}

type DisplayNewsItem = NewsItem & {
  display_cover_url: string | null
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
  const [news, setNews] = useState<DisplayNewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({})

  useEffect(() => {
    loadNews()
  }, [limit])

  async function resolveDisplayUrl(url: string | null | undefined) {
    if (!url) return null

    const signedUrl = await getSignedUrlFromPublicUrl(url)
    return signedUrl || url
  }

  function getBestMediaCover(mediaItems: NewsMedia[]) {
    const firstImage = mediaItems.find((item) => item.media_type === 'image' && item.url)
    if (firstImage?.url) return firstImage.url

    const firstThumbnail = mediaItems.find(
      (item) =>
        (item.media_type === 'youtube' || item.media_type === 'social') &&
        item.thumbnail_url
    )
    if (firstThumbnail?.thumbnail_url) return firstThumbnail.thumbnail_url

    return null
  }

  async function loadNews() {
    setLoading(true)
    setBrokenImages({})

    const { data, error } = await supabase
      .from('news')
      .select('id, title, content, image_url, cover_image_url, published, news_date, created_at')
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

    const items = (data || []) as NewsItem[]
    const ids = items.map((item) => item.id)

    let mediaByNewsId: Record<string, NewsMedia[]> = {}

    if (ids.length > 0) {
      const { data: mediaData, error: mediaError } = await supabase
        .from('news_media')
        .select('id, news_id, media_type, title, url, thumbnail_url, sort_order, created_at')
        .in('news_id', ids)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })

      if (mediaError) {
        console.error('Errore caricamento media news:', mediaError)
      }

      mediaByNewsId = ((mediaData || []) as NewsMedia[]).reduce<Record<string, NewsMedia[]>>(
        (acc, mediaItem) => {
          const key = String(mediaItem.news_id)
          if (!acc[key]) acc[key] = []
          acc[key].push(mediaItem)
          return acc
        },
        {}
      )
    }

    const newsWithCover = await Promise.all(
      items.map(async (item) => {
        const mediaCover = getBestMediaCover(mediaByNewsId[String(item.id)] || [])
        const rawCover = item.cover_image_url || item.image_url || mediaCover

        return {
          ...item,
          display_cover_url: await resolveDisplayUrl(rawCover),
        }
      })
    )

    setNews(newsWithCover)
    setLoading(false)
  }

  const gridTemplateColumns = useMemo(
    () => (compact ? 'repeat(auto-fit, minmax(240px, 1fr))' : 'repeat(auto-fit, minmax(280px, 1fr))'),
    [compact]
  )

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

      <div style={{ ...styles.grid, gridTemplateColumns }}>
        {news.map((item) => {
          const showImage = item.display_cover_url && !brokenImages[item.id]

          return (
            <Link key={item.id} to={`/news/${item.id}`} style={styles.card}>
              <div style={styles.imageWrap}>
                {showImage ? (
                  <img
                    src={item.display_cover_url || ''}
                    alt={item.title}
                    loading="lazy"
                    style={styles.image}
                    onError={() => setBrokenImages((prev) => ({ ...prev, [item.id]: true }))}
                  />
                ) : (
                  <div style={styles.imageFallback}>
                    <span style={styles.fallbackIcon}>🥋</span>
                    <span style={styles.fallbackText}>Dojo Yamato</span>
                  </div>
                )}
              </div>

              <div style={styles.cardBody}>
                <p style={styles.date}>{formatDate(item.news_date || item.created_at)}</p>
                <h3 style={styles.cardTitle}>{item.title}</h3>
                {!compact && <p style={styles.excerpt}>{createExcerpt(item.content)}</p>}
                <span style={styles.readMore}>Leggi la news →</span>
              </div>
            </Link>
          )
        })}
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
    minWidth: 0,
  },
  imageWrap: {
    width: '100%',
    aspectRatio: '40 / 21',
    overflow: 'hidden',
    background: '#020817',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'center',
    display: 'block',
  },
  imageFallback: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    background: 'radial-gradient(circle at 50% 30%, rgba(185,68,79,0.32), rgba(2,8,23,1) 65%)',
    color: '#ffffff',
  },
  fallbackIcon: {
    fontSize: 34,
  },
  fallbackText: {
    fontSize: 13,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    fontWeight: 800,
    color: '#e5e7eb',
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
