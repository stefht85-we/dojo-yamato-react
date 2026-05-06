import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import {
  canDownloadMedia,
  canOpenMedia,
  getAccessDeniedMessage,
} from '../lib/permissions'
import { getSignedUrlFromPublicUrl } from '../lib/storageSignedUrl'

type MediaType =
  | 'image'
  | 'video'
  | 'youtube'
  | 'instagram'
  | 'facebook'
  | 'tiktok'
  | 'link'
  | 'pdf'
  | 'social'

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

type NewsMedia = {
  id: number
  news_id: number
  media_type: MediaType
  title: string | null
  url: string
  thumbnail_url: string | null
  sort_order: number | null
  created_at: string
}

function NewsDetail() {
  const { newsId } = useParams()

  const [user, setUser] = useState<User | null>(null)
  const [news, setNews] = useState<NewsItem | null>(null)
  const [media, setMedia] = useState<NewsMedia[]>([])
  const [loading, setLoading] = useState(true)
  const [accessMessage, setAccessMessage] = useState('')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<NewsMedia | null>(null)

  const userCanOpenMedia = canOpenMedia(user)
  const userCanDownloadMedia = canDownloadMedia(user)

  useEffect(() => {
    loadUser()
    loadNews()
  }, [newsId])

  async function loadUser() {
    const { data } = await supabase.auth.getUser()
    setUser(data.user)
  }

  async function loadNews() {
    if (!newsId) {
      setLoading(false)
      return
    }

    const numericNewsId = Number(newsId)

    if (Number.isNaN(numericNewsId)) {
      setLoading(false)
      return
    }

    setLoading(true)

    const { data: newsData, error: newsError } = await supabase
      .from('news')
      .select('id, title, content, image_url, cover_image_url, published, news_date, created_at')
      .eq('id', numericNewsId)
      .eq('published', true)
      .single()

    if (newsError) {
      console.error('Errore caricamento dettaglio news:', newsError.message)
      setNews(null)
      setMedia([])
      setLoading(false)
      return
    }

    const { data: mediaData, error: mediaError } = await supabase
      .from('news_media')
      .select('id, news_id, media_type, title, url, thumbnail_url, sort_order, created_at')
      .eq('news_id', numericNewsId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (mediaError) {
      console.error('Errore caricamento media dettaglio news:', mediaError.message)
    }

    const signedImageUrl = newsData.image_url
      ? await getSignedUrlFromPublicUrl(newsData.image_url)
      : null

    const signedCoverUrl = newsData.cover_image_url
      ? await getSignedUrlFromPublicUrl(newsData.cover_image_url)
      : null

    const signedMedia = await Promise.all(
      ((mediaData ?? []) as NewsMedia[]).map(async (item) => {
        const signedUrl = item.url ? await getSignedUrlFromPublicUrl(item.url) : ''
        const signedThumbnailUrl = item.thumbnail_url
          ? await getSignedUrlFromPublicUrl(item.thumbnail_url)
          : null

        return {
          ...item,
          url: signedUrl || item.url,
          thumbnail_url: signedThumbnailUrl || item.thumbnail_url,
        }
      })
    )

    setNews({
      ...(newsData as NewsItem),
      image_url: signedImageUrl || newsData.image_url,
      cover_image_url: signedCoverUrl || newsData.cover_image_url,
    })

    setMedia(signedMedia)
    setLoading(false)
  }

  function showAccessDenied() {
    setAccessMessage(getAccessDeniedMessage('i contenuti collegati alla news'))

    window.setTimeout(() => {
      setAccessMessage('')
    }, 5000)
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

  function getCover(item: NewsItem) {
    return item.cover_image_url || item.image_url || ''
  }

  function getYoutubeEmbedUrl(url: string) {
    const patterns = [
      /youtube\.com\/watch\?v=([^&]+)/,
      /youtu\.be\/([^?&]+)/,
      /youtube\.com\/shorts\/([^?&]+)/,
      /youtube\.com\/embed\/([^?&]+)/,
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match?.[1]) return `https://www.youtube.com/embed/${match[1]}`
    }

    return ''
  }

  function getSocialGradient(type: MediaType) {
    if (type === 'instagram') return 'linear-gradient(135deg, #d62976 0%, #fa7e1e 100%)'
    if (type === 'facebook') return 'linear-gradient(135deg, #1877f2 0%, #0b3d91 100%)'
    if (type === 'tiktok') return 'linear-gradient(135deg, #111827 0%, #ff0050 100%)'
    if (type === 'youtube') return 'linear-gradient(135deg, #ff0000 0%, #7f1d1d 100%)'
    return 'linear-gradient(135deg, #176a82 0%, #0f4658 100%)'
  }

  function getDownloadName(item: NewsMedia) {
    const extension = item.media_type === 'pdf' ? 'pdf' : item.media_type === 'video' ? 'mp4' : 'jpg'
    const cleanTitle =
      news?.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') ||
      'dojo-yamato-news'

    return `${cleanTitle}-${item.id}.${extension}`
  }

  function handleImageClick(item: NewsMedia) {
    if (!userCanOpenMedia) {
      showAccessDenied()
      return
    }

    setSelectedImage(item.url)
  }

  function handleVideoClick(item: NewsMedia) {
    if (!userCanOpenMedia) {
      showAccessDenied()
      return
    }

    setSelectedVideo(item)
  }

  function renderLockedOverlay() {
    if (userCanOpenMedia) return null

    return (
      <div style={lockedOverlayStyle}>
        <span style={lockedBadgeStyle}>Accesso utenti</span>
      </div>
    )
  }

  function renderDownloadButton(item: NewsMedia) {
    if (!userCanDownloadMedia) return null

    if (
      item.media_type === 'youtube' ||
      item.media_type === 'instagram' ||
      item.media_type === 'facebook' ||
      item.media_type === 'tiktok' ||
      item.media_type === 'link' ||
      item.media_type === 'social'
    ) {
      return (
        <a href={item.url} target="_blank" rel="noreferrer" style={downloadButtonStyle}>
          Apri
        </a>
      )
    }

    return (
      <a
        href={item.url}
        download={getDownloadName(item)}
        target="_blank"
        rel="noreferrer"
        style={downloadButtonStyle}
      >
        Download
      </a>
    )
  }

  function renderMediaCard(item: NewsMedia) {
    if (item.media_type === 'image') {
      return (
        <>
          <button type="button" style={mediaButtonStyle} onClick={() => handleImageClick(item)}>
            <div style={mediaPreviewBoxStyle}>
              <img src={item.url} alt="Immagine news" style={mediaImageStyle} />
              {renderLockedOverlay()}
            </div>
          </button>
          {renderDownloadButton(item)}
        </>
      )
    }

    if (item.media_type === 'video') {
      return (
        <>
          <button type="button" style={mediaButtonStyle} onClick={() => handleVideoClick(item)}>
            <div style={mediaPreviewBoxStyle}>
              {item.thumbnail_url ? (
                <img src={item.thumbnail_url} alt="Video news" style={mediaImageStyle} />
              ) : (
                <video src={item.url} muted preload="metadata" style={mediaImageStyle} />
              )}
              <span style={playButtonStyle}>▶</span>
              {renderLockedOverlay()}
            </div>
          </button>
          {renderDownloadButton(item)}
        </>
      )
    }

    if (item.media_type === 'youtube') {
      const embedUrl = getYoutubeEmbedUrl(item.url)

      return (
        <>
          <button type="button" style={mediaButtonStyle} onClick={() => handleVideoClick(item)}>
            <div style={mediaPreviewBoxStyle}>
              {item.thumbnail_url ? (
                <img src={item.thumbnail_url} alt="YouTube" style={mediaImageStyle} />
              ) : embedUrl ? (
                <div style={{ ...socialPreviewStyle, background: getSocialGradient('youtube') }}>
                  <span style={socialIconStyle}>▶</span>
                </div>
              ) : (
                <div style={{ ...socialPreviewStyle, background: getSocialGradient('youtube') }} />
              )}
              <span style={playButtonStyle}>▶</span>
              {renderLockedOverlay()}
            </div>
          </button>
          {renderDownloadButton(item)}
        </>
      )
    }

    if (item.media_type === 'pdf') {
      return (
        <>
          {userCanOpenMedia ? (
            <a href={item.url} target="_blank" rel="noreferrer" style={mediaButtonStyle}>
              <div style={pdfPreviewStyle}>
                <span style={pdfIconStyle}>PDF</span>
              </div>
            </a>
          ) : (
            <button type="button" style={mediaButtonStyle} onClick={showAccessDenied}>
              <div style={pdfPreviewStyle}>
                <span style={pdfIconStyle}>PDF</span>
                {renderLockedOverlay()}
              </div>
            </button>
          )}
          {renderDownloadButton(item)}
        </>
      )
    }

    return (
      <>
        {userCanOpenMedia ? (
          <a href={item.url} target="_blank" rel="noreferrer" style={mediaButtonStyle}>
            <div style={{ ...socialPreviewStyle, background: getSocialGradient(item.media_type) }}>
              {item.thumbnail_url ? (
                <img src={item.thumbnail_url} alt="Contenuto social" style={mediaImageStyle} />
              ) : (
                <span style={socialIconStyle}>🔗</span>
              )}
            </div>
          </a>
        ) : (
          <button type="button" style={mediaButtonStyle} onClick={showAccessDenied}>
            <div style={{ ...socialPreviewStyle, background: getSocialGradient(item.media_type) }}>
              {item.thumbnail_url ? (
                <img src={item.thumbnail_url} alt="Contenuto social" style={mediaImageStyle} />
              ) : (
                <span style={socialIconStyle}>🔗</span>
              )}
              {renderLockedOverlay()}
            </div>
          </button>
        )}
        {renderDownloadButton(item)}
      </>
    )
  }

  function renderVideoModal() {
    if (!selectedVideo) return null

    if (selectedVideo.media_type === 'youtube') {
      const embedUrl = getYoutubeEmbedUrl(selectedVideo.url)

      return (
        <div style={modalOverlayStyle} onClick={() => setSelectedVideo(null)}>
          <div style={videoModalStyle} onClick={(event) => event.stopPropagation()}>
            <button type="button" style={closeButtonStyle} onClick={() => setSelectedVideo(null)}>×</button>

            {embedUrl ? (
              <iframe
                src={embedUrl}
                title="YouTube"
                style={youtubeFrameStyle}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <p style={mutedStyle}>Video YouTube non disponibile.</p>
            )}
          </div>
        </div>
      )
    }

    return (
      <div style={modalOverlayStyle} onClick={() => setSelectedVideo(null)}>
        <div style={videoModalStyle} onClick={(event) => event.stopPropagation()}>
          <button type="button" style={closeButtonStyle} onClick={() => setSelectedVideo(null)}>×</button>

          <video
            src={selectedVideo.url}
            style={modalVideoStyle}
            controls
            autoPlay
            playsInline
            controlsList="nodownload noplaybackrate"
            disablePictureInPicture
            onContextMenu={(event) => event.preventDefault()}
          />
        </div>
      </div>
    )
  }

  function renderImageModal() {
    if (!selectedImage) return null

    return (
      <div style={modalOverlayStyle} onClick={() => setSelectedImage(null)}>
        <div style={imageModalStyle} onClick={(event) => event.stopPropagation()}>
          <button type="button" style={closeButtonStyle} onClick={() => setSelectedImage(null)}>×</button>
          <img src={selectedImage} alt="Immagine news" style={modalImageStyle} />
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <main style={pageStyle}>
        <p style={mutedStyle}>Caricamento news...</p>
      </main>
    )
  }

  if (!news) {
    return (
      <main style={pageStyle}>
        <Link to="/news" style={backLinkStyle}>← Torna alle news</Link>
        <h1 style={titleStyle}>News non trovata</h1>
      </main>
    )
  }

  const cover = getCover(news)

  return (
    <main style={pageStyle}>
      <section style={heroStyle}>
        <Link to="/news" style={backLinkStyle}>← Torna alle news</Link>

        <p style={labelStyle}>Pubblicata il {getDate(news)}</p>
        <h1 style={titleStyle}>{news.title}</h1>

        {!userCanOpenMedia && media.length > 0 && (
          <div style={loginNoticeStyle}>
            <strong>Area media riservata.</strong> Accedi o registrati per aprire, ingrandire e scaricare i contenuti collegati.
            <Link to="/area-utente" style={loginButtonStyle}>Accedi / Registrati</Link>
          </div>
        )}
      </section>

      {cover && (
        <section style={coverSectionStyle}>
          <img src={cover} alt={news.title} style={coverImageStyle} />
        </section>
      )}

      <section style={contentStyle}>
        <p style={contentTextStyle}>{news.content}</p>
      </section>

      {accessMessage && <div style={floatingMessageStyle}>{accessMessage}</div>}

      {media.length > 0 && (
        <section style={mediaSectionStyle}>
          <h2 style={mediaTitleStyle}>Galleria</h2>

          <div style={mediaGridStyle}>
            {media.map((item) => (
              <article key={item.id} style={mediaCardStyle}>{renderMediaCard(item)}</article>
            ))}
          </div>
        </section>
      )}

      {renderVideoModal()}
      {renderImageModal()}
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

const pageStyle: CSSProperties = {
  minHeight: '100vh',
  background: '#020817',
  color: 'white',
  padding: '58px 24px 90px',
}

const heroStyle: CSSProperties = {
  width: 'min(1000px, calc(100% - 8px))',
  margin: '0 auto 26px',
  display: 'grid',
  gap: '14px',
}

const backLinkStyle: CSSProperties = {
  width: 'fit-content',
  color: '#e63946',
  textDecoration: 'none',
  fontWeight: 900,
}

const labelStyle: CSSProperties = dojoBadgeStyle

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 'clamp(42px, 7vw, 76px)',
  lineHeight: 1,
  fontWeight: 950,
}

const loginNoticeStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '14px',
  flexWrap: 'wrap',
  width: 'fit-content',
  maxWidth: '100%',
  padding: '14px 16px',
  borderRadius: '16px',
  background: 'rgba(185,68,79,0.18)',
  border: '1px solid rgba(185,68,79,0.28)',
  color: '#f3dede',
}

const loginButtonStyle: CSSProperties = {
  padding: '8px 13px',
  borderRadius: '999px',
  background: 'linear-gradient(180deg, #b9444f 0%, #82232b 100%)',
  color: 'white',
  textDecoration: 'none',
  fontWeight: 900,
}

const floatingMessageStyle: CSSProperties = {
  position: 'fixed',
  left: '50%',
  bottom: '24px',
  transform: 'translateX(-50%)',
  zIndex: 1001,
  width: 'min(560px, calc(100% - 32px))',
  padding: '14px 16px',
  borderRadius: '16px',
  background: 'rgba(185,68,79,0.95)',
  color: 'white',
  fontWeight: 800,
  boxShadow: '0 18px 40px rgba(0,0,0,0.36)',
}

const coverSectionStyle: CSSProperties = {
  width: 'min(1000px, calc(100% - 8px))',
  height: 'min(480px, 56vw)',
  minHeight: '260px',
  margin: '0 auto 28px',
  borderRadius: '22px',
  overflow: 'hidden',
  border: '1px solid rgba(255,255,255,0.09)',
}

const coverImageStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
}

const contentStyle: CSSProperties = {
  width: 'min(1000px, calc(100% - 8px))',
  margin: '0 auto',
  background: 'rgba(255,255,255,0.045)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '18px',
  padding: '24px',
}

const contentTextStyle: CSSProperties = {
  margin: 0,
  color: '#e5e7eb',
  fontSize: '18px',
  lineHeight: 1.8,
  whiteSpace: 'pre-line',
}

const mediaSectionStyle: CSSProperties = {
  width: 'min(1000px, calc(100% - 8px))',
  margin: '34px auto 0',
}

const mediaTitleStyle: CSSProperties = {
  margin: '0 0 16px',
  fontSize: '32px',
  fontWeight: 950,
}

const mediaGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '16px',
}

const mediaCardStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.055)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: '16px',
  overflow: 'hidden',
}

const mediaButtonStyle: CSSProperties = {
  width: '100%',
  height: '170px',
  border: 'none',
  padding: 0,
  display: 'block',
  background: '#111827',
  color: 'white',
  cursor: 'pointer',
  textDecoration: 'none',
}

const mediaPreviewBoxStyle: CSSProperties = {
  position: 'relative',
  width: '100%',
  height: '100%',
}

const mediaImageStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
}

const playButtonStyle: CSSProperties = {
  position: 'absolute',
  left: '50%',
  top: '50%',
  transform: 'translate(-50%, -50%)',
  width: '48px',
  height: '48px',
  borderRadius: '999px',
  background: 'linear-gradient(180deg, #b9444f 0%, #82232b 100%)',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 950,
  boxShadow: '0 8px 18px rgba(0,0,0,0.28)',
}

const lockedOverlayStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'flex-end',
  padding: '8px',
  background: 'linear-gradient(180deg, rgba(0,0,0,0.08), rgba(0,0,0,0.16))',
  pointerEvents: 'none',
}

const lockedBadgeStyle: CSSProperties = {
  padding: '5px 9px',
  borderRadius: '999px',
  background: 'rgba(0,0,0,0.72)',
  color: 'white',
  fontSize: '10px',
  fontWeight: 900,
}

const downloadButtonStyle: CSSProperties = {
  display: 'block',
  width: 'fit-content',
  margin: '10px',
  padding: '7px 12px',
  borderRadius: '999px',
  background: 'linear-gradient(180deg, #b9444f 0%, #82232b 100%)',
  color: 'white',
  textDecoration: 'none',
  fontSize: '12px',
  fontWeight: 900,
}

const pdfPreviewStyle: CSSProperties = {
  position: 'relative',
  width: '100%',
  height: '100%',
  display: 'grid',
  placeItems: 'center',
  alignContent: 'center',
  background: 'linear-gradient(135deg, #176a82 0%, #0f4658 100%)',
}

const pdfIconStyle: CSSProperties = {
  ...dojoBadgeStyle,
  width: '64px',
  height: '64px',
  padding: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '16px',
}

const socialPreviewStyle: CSSProperties = {
  position: 'relative',
  width: '100%',
  height: '100%',
  display: 'grid',
  placeItems: 'center',
  alignContent: 'center',
  color: 'white',
  padding: '16px',
  boxSizing: 'border-box',
  textAlign: 'center',
}

const socialIconStyle: CSSProperties = {
  fontSize: '34px',
  fontWeight: 950,
}

const modalOverlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 1000,
  background: 'rgba(0,0,0,0.78)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px',
}

const videoModalStyle: CSSProperties = {
  position: 'relative',
  width: 'min(800px, 96vw)',
  background: '#020817',
  borderRadius: '20px',
  border: '1px solid rgba(255,255,255,0.12)',
  padding: '16px',
}

const imageModalStyle: CSSProperties = {
  position: 'relative',
  width: 'min(900px, 96vw)',
  background: '#020817',
  borderRadius: '20px',
  border: '1px solid rgba(255,255,255,0.12)',
  padding: '16px',
}

const closeButtonStyle: CSSProperties = {
  position: 'absolute',
  top: '-14px',
  right: '-14px',
  width: '36px',
  height: '36px',
  borderRadius: '999px',
  border: 'none',
  background: 'linear-gradient(180deg, #b9444f 0%, #82232b 100%)',
  color: 'white',
  fontSize: '24px',
  fontWeight: 900,
  cursor: 'pointer',
  zIndex: 2,
}

const modalVideoStyle: CSSProperties = {
  width: '100%',
  maxHeight: '72vh',
  borderRadius: '14px',
  background: '#111827',
  display: 'block',
}

const youtubeFrameStyle: CSSProperties = {
  width: '100%',
  aspectRatio: '16 / 9',
  border: 0,
  borderRadius: '14px',
  display: 'block',
}

const modalImageStyle: CSSProperties = {
  width: '100%',
  maxHeight: '80vh',
  objectFit: 'contain',
  borderRadius: '14px',
  display: 'block',
}

const mutedStyle: CSSProperties = {
  color: '#d8d8d8',
}

export default NewsDetail