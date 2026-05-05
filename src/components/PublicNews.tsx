import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

type MediaType = 'image' | 'video' | 'pdf' | 'youtube' | 'social'

type NewsItem = {
  id: string
  title: string
  content: string
  image_url: string | null
  published: boolean
  news_date: string | null
  created_at: string
}

type NewsMedia = {
  id: string
  news_id: string
  media_type: MediaType
  title: string | null
  url: string
  thumbnail_url: string | null
  sort_order: number | null
  created_at: string
}

type PublicNewsProps = {
  limit?: number
  showTitle?: boolean
  compact?: boolean
}

function PublicNews({ limit, showTitle = true, compact = false }: PublicNewsProps) {
  const [news, setNews] = useState<NewsItem[]>([])
  const [media, setMedia] = useState<NewsMedia[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [openNewsId, setOpenNewsId] = useState<string | null>(null)

  const visibleNews = useMemo(() => {
    const list = news.filter((item) => item.published)
    return typeof limit === 'number' ? list.slice(0, limit) : list
  }, [news, limit])

  useEffect(() => {
    loadPublicNews()
  }, [])

  async function loadPublicNews() {
    setLoading(true)
    setMessage('')

    const { data: newsData, error: newsError } = await supabase
      .from('news')
      .select('id, title, content, image_url, published, news_date, created_at')
      .eq('published', true)
      .order('news_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (newsError) {
      setMessage(`Errore caricamento news: ${newsError.message}`)
      setLoading(false)
      return
    }

    const newsItems = (newsData ?? []) as NewsItem[]
    setNews(newsItems)

    const ids = newsItems.map((item) => item.id)

    if (ids.length === 0) {
      setMedia([])
      setLoading(false)
      return
    }

    const { data: mediaData, error: mediaError } = await supabase
      .from('news_media')
      .select('id, news_id, media_type, title, url, thumbnail_url, sort_order, created_at')
      .in('news_id', ids)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (mediaError) {
      setMessage(`Errore caricamento media news: ${mediaError.message}`)
      setLoading(false)
      return
    }

    setMedia((mediaData ?? []) as NewsMedia[])
    setLoading(false)
  }

  function getNewsDate(item: NewsItem) {
    const date = item.news_date || item.created_at

    return new Date(date).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  function getYoutubeId(url: string) {
    const patterns = [
      /youtube\.com\/watch\?v=([^&]+)/,
      /youtu\.be\/([^?&]+)/,
      /youtube\.com\/shorts\/([^?&]+)/,
      /youtube\.com\/embed\/([^?&]+)/,
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match?.[1]) return match[1]
    }

    return null
  }

  function getMediaForNews(newsId: string) {
    return media.filter((item) => item.news_id === newsId)
  }

  function getCoverForNews(item: NewsItem) {
    if (item.image_url?.trim()) return item.image_url.trim()

    const firstMedia = getMediaForNews(item.id).find((mediaItem) => {
      return mediaItem.media_type === 'image' || mediaItem.thumbnail_url
    })

    if (!firstMedia) return ''

    if (firstMedia.media_type === 'image') return firstMedia.url
    return firstMedia.thumbnail_url || ''
  }

  function renderMediaItem(item: NewsMedia) {
    if (item.media_type === 'image') {
      return (
        <a key={item.id} href={item.url} target="_blank" rel="noreferrer" style={mediaCardStyle}>
          <img src={item.url} alt={item.title || 'Immagine news'} style={mediaImageStyle} />
        </a>
      )
    }

    if (item.media_type === 'video') {
      return (
        <div key={item.id} style={mediaCardStyle}>
          <video src={item.url} controls style={mediaImageStyle} />
        </div>
      )
    }

    if (item.media_type === 'youtube') {
      const videoId = getYoutubeId(item.url)

      if (!videoId) {
        return (
          <a key={item.id} href={item.url} target="_blank" rel="noreferrer" style={linkCardStyle}>
            ▶ Apri video YouTube
          </a>
        )
      }

      return (
        <div key={item.id} style={youtubeWrapperStyle}>
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            title={item.title || 'Video YouTube'}
            style={youtubeIframeStyle}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )
    }

    if (item.media_type === 'pdf') {
      return (
        <a key={item.id} href={item.url} target="_blank" rel="noreferrer" style={linkCardStyle}>
          📄 Apri PDF
        </a>
      )
    }

    if (item.media_type === 'social') {
      return (
        <a key={item.id} href={item.url} target="_blank" rel="noreferrer" style={socialCardStyle}>
          {item.thumbnail_url ? (
            <img src={item.thumbnail_url} alt="Contenuto social" style={socialPreviewStyle} />
          ) : (
            <div style={socialFallbackStyle}>🔗</div>
          )}
        </a>
      )
    }

    return null
  }

  if (loading) return <p style={mutedText}>Caricamento news...</p>
  if (message) return <div style={messageStyle}>{message}</div>
  if (visibleNews.length === 0) return <p style={mutedText}>Non ci sono ancora news pubblicate.</p>

  return (
    <section style={sectionStyle}>
      {showTitle && (
        <div style={headerStyle}>
          <p style={eyebrowStyle}>Bacheca</p>
          <h2 style={titleStyle}>News dal Dojo</h2>
          <p style={introStyle}>Comunicazioni, eventi, attività e aggiornamenti dell’ASD Dojo Yamato.</p>
        </div>
      )}

      <div style={compact ? compactGridStyle : gridStyle}>
        {visibleNews.map((item) => {
          const itemMedia = getMediaForNews(item.id)
          const isOpen = openNewsId === item.id
          const previewMedia = itemMedia.slice(0, 4)
          const coverUrl = getCoverForNews(item)

          if (compact) {
            return (
              <article key={item.id} style={compactCardStyle}>
                <p style={compactDateStyle}>{getNewsDate(item)}</p>

                <Link to={`/news/${item.id}`} style={compactCoverLinkStyle}>
                  <div style={compactCoverShellStyle}>
                    {coverUrl ? (
                      <img src={coverUrl} alt={item.title} style={compactCoverStyle} />
                    ) : (
                      <div style={compactEmptyCoverStyle}>NEWS</div>
                    )}
                  </div>
                </Link>

                <h3 style={compactTitleStyle}>{item.title}</h3>
              </article>
            )
          }

          return (
            <article key={item.id} style={cardStyle}>
              {coverUrl && <img src={coverUrl} alt={item.title} style={coverStyle} />}

              <div style={cardBodyStyle}>
                <p style={dateStyle}>{getNewsDate(item)}</p>
                <h3 style={cardTitleStyle}>{item.title}</h3>
                <p style={contentStyle}>{item.content}</p>

                {previewMedia.length > 0 && <div style={mediaGridStyle}>{previewMedia.map(renderMediaItem)}</div>}

                {isOpen && itemMedia.length > 4 && (
                  <div style={mediaGridStyle}>{itemMedia.slice(4).map(renderMediaItem)}</div>
                )}

                {itemMedia.length > 4 && (
                  <button type="button" style={secondaryButtonStyle} onClick={() => setOpenNewsId(isOpen ? null : item.id)}>
                    {isOpen ? 'Mostra meno' : `Mostra tutti i contenuti (${itemMedia.length})`}
                  </button>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

const sectionStyle: CSSProperties = {
  display: 'grid',
  gap: '24px',
}

const headerStyle: CSSProperties = {
  textAlign: 'center',
  maxWidth: '760px',
  margin: '0 auto',
}

const eyebrowStyle: CSSProperties = {
  margin: '0 0 8px',
  color: '#b9444f',
  fontWeight: 900,
  letterSpacing: '2px',
  textTransform: 'uppercase',
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 'clamp(30px, 5vw, 48px)',
  fontWeight: 950,
  color: 'white',
}

const introStyle: CSSProperties = {
  color: '#d8d8d8',
  lineHeight: 1.7,
}

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '22px',
}

const compactGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: '34px',
}

const compactCardStyle: CSSProperties = {
  display: 'grid',
  gap: '12px',
  minWidth: 0,
  padding: '14px',
  borderRadius: '22px',
  background: 'linear-gradient(180deg, rgba(255,255,255,0.085), rgba(255,255,255,0.045))',
  border: '1px solid rgba(255,255,255,0.12)',
  boxShadow: '0 16px 36px rgba(0,0,0,0.32)',
}

const compactDateStyle: CSSProperties = {
  margin: 0,
  color: 'white',
  fontSize: '14px',
  fontWeight: 850,
  lineHeight: 1.3,
  textAlign: 'center',
}

const compactCoverLinkStyle: CSSProperties = {
  display: 'block',
  textDecoration: 'none',
  color: 'inherit',
}

const compactCoverShellStyle: CSSProperties = {
  width: '100%',
  height: '190px',
  overflow: 'hidden',
  borderRadius: '17px',
  background: '#176a82',
  border: '1px solid rgba(255,255,255,0.14)',
  boxShadow: '0 12px 30px rgba(0,0,0,0.34)',
}

const compactCoverStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
}

const compactEmptyCoverStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  background: 'linear-gradient(135deg, #176a82 0%, #0f4658 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  fontWeight: 900,
  letterSpacing: '1px',
}

const compactTitleStyle: CSSProperties = {
  margin: 0,
  color: 'white',
  fontSize: '18px',
  lineHeight: 1.25,
  fontWeight: 900,
  textAlign: 'center',
}

const cardStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.065)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: '22px',
  overflow: 'hidden',
  color: 'white',
  boxShadow: '0 18px 50px rgba(0,0,0,0.25)',
}

const coverStyle: CSSProperties = {
  width: '100%',
  height: '230px',
  objectFit: 'cover',
  display: 'block',
}

const cardBodyStyle: CSSProperties = {
  padding: '20px',
  display: 'grid',
  gap: '12px',
}

const dateStyle: CSSProperties = {
  margin: 0,
  color: '#f0a3aa',
  fontSize: '13px',
  fontWeight: 900,
}

const cardTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: '22px',
  lineHeight: 1.2,
}

const contentStyle: CSSProperties = {
  margin: 0,
  color: '#d8d8d8',
  lineHeight: 1.65,
  whiteSpace: 'pre-line',
}

const mediaGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
  gap: '10px',
  marginTop: '6px',
}

const mediaCardStyle: CSSProperties = {
  display: 'block',
  height: '120px',
  borderRadius: '14px',
  overflow: 'hidden',
  background: 'rgba(0,0,0,0.25)',
  border: '1px solid rgba(255,255,255,0.08)',
}

const mediaImageStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
}

const youtubeWrapperStyle: CSSProperties = {
  gridColumn: '1 / -1',
  position: 'relative',
  paddingTop: '56.25%',
  borderRadius: '14px',
  overflow: 'hidden',
  background: '#111',
}

const youtubeIframeStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  border: 'none',
}

const linkCardStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '70px',
  padding: '12px',
  borderRadius: '14px',
  background: 'rgba(185,68,79,0.18)',
  border: '1px solid rgba(185,68,79,0.25)',
  color: 'white',
  textDecoration: 'none',
  fontWeight: 900,
  textAlign: 'center',
}

const socialCardStyle: CSSProperties = {
  display: 'block',
  height: '120px',
  borderRadius: '14px',
  overflow: 'hidden',
  background: 'rgba(0,0,0,0.22)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: 'white',
  textDecoration: 'none',
}

const socialPreviewStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
}

const socialFallbackStyle: CSSProperties = {
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(185,68,79,0.18)',
  fontSize: '28px',
}

const secondaryButtonStyle: CSSProperties = {
  width: 'fit-content',
  border: 'none',
  borderRadius: '999px',
  padding: '10px 16px',
  background: 'rgba(255,255,255,0.92)',
  color: '#111',
  fontWeight: 900,
  cursor: 'pointer',
}

const mutedText: CSSProperties = {
  color: '#d8d8d8',
  lineHeight: 1.6,
}

const messageStyle: CSSProperties = {
  background: 'rgba(185,68,79,0.18)',
  border: '1px solid rgba(185,68,79,0.28)',
  padding: '14px 16px',
  borderRadius: '14px',
  color: '#f3dede',
}

export default PublicNews
