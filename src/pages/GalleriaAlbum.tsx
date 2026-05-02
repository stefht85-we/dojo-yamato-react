import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import type { CSSProperties } from 'react'

type GalleryAlbum = {
  id: string
  title: string
  description: string | null
  category: string | null
  event_date: string | null
  event_year: number
  cover_image_url: string | null
  visible: boolean
  created_at: string
}

type GalleryMedia = {
  id: string
  album_id: string
  image_url: string
  caption: string | null
  sort_order: number
  created_at: string
  media_type: 'image' | 'video' | 'youtube'
  thumbnail_url: string | null
  video_url: string | null
}

function GalleriaAlbum() {
  const { albumId } = useParams()

  const [album, setAlbum] = useState<GalleryAlbum | null>(null)
  const [media, setMedia] = useState<GalleryMedia[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  useEffect(() => {
    loadAlbum()
  }, [albumId])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (activeIndex === null) return

      if (event.key === 'Escape') setActiveIndex(null)

      if (event.key === 'ArrowRight') {
        setActiveIndex((current) => {
          if (current === null || media.length === 0) return current
          return current === media.length - 1 ? 0 : current + 1
        })
      }

      if (event.key === 'ArrowLeft') {
        setActiveIndex((current) => {
          if (current === null || media.length === 0) return current
          return current === 0 ? media.length - 1 : current - 1
        })
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeIndex, media.length])

  async function loadAlbum() {
    setLoading(true)
    setMessage('')

    if (!albumId) {
      setMessage('Album non valido.')
      setLoading(false)
      return
    }

    const { data: albumData, error: albumError } = await supabase
      .from('gallery_albums')
      .select(
        'id, title, description, category, event_date, event_year, cover_image_url, visible, created_at'
      )
      .eq('id', albumId)
      .eq('visible', true)
      .single()

    if (albumError) {
      console.error('Errore caricamento album:', albumError)
      setMessage('Album non trovato o non disponibile.')
      setLoading(false)
      return
    }

    const { data: mediaData, error: mediaError } = await supabase
      .from('gallery_photos')
      .select(
        'id, album_id, image_url, caption, sort_order, created_at, media_type, thumbnail_url, video_url'
      )
      .eq('album_id', albumId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (mediaError) {
      console.error('Errore caricamento media album:', mediaError)
      setMessage('Errore durante il caricamento dei contenuti dell’album.')
      setLoading(false)
      return
    }

    setAlbum(albumData as GalleryAlbum)
    setMedia((mediaData ?? []) as GalleryMedia[])
    setLoading(false)
  }

  const activeMedia = useMemo(() => {
    if (activeIndex === null) return null
    return media[activeIndex] ?? null
  }, [activeIndex, media])

  function formatAlbumDate(item: GalleryAlbum) {
    if (item.event_date) {
      return new Date(item.event_date).toLocaleDateString('it-IT', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    }

    return String(item.event_year)
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

    return url
  }

  function renderMediaThumb(item: GalleryMedia) {
    if (item.media_type === 'youtube') {
      return (
        <div style={thumbWrapperStyle}>
          <img
            src={item.thumbnail_url ?? ''}
            alt={item.caption || 'Video YouTube'}
            style={thumbImageStyle}
          />
          <span style={videoBadgeStyle}>YT</span>
        </div>
      )
    }

    if (item.media_type === 'video') {
      return (
        <div style={thumbWrapperStyle}>
          <video
            src={item.video_url ?? item.image_url}
            style={thumbImageStyle}
            muted
          />
          <span style={videoBadgeStyle}>▶</span>
        </div>
      )
    }

    return (
      <img
        src={item.image_url}
        alt={item.caption || album?.title || 'Foto galleria'}
        style={thumbImageStyle}
      />
    )
  }

  function renderLightboxMedia(item: GalleryMedia) {
    if (item.media_type === 'youtube') {
      return (
        <iframe
          title={item.caption || 'Video YouTube'}
          src={getYoutubeEmbedUrl(item.video_url ?? item.image_url)}
          style={lightboxIframeStyle}
          allowFullScreen
        />
      )
    }

    if (item.media_type === 'video') {
      return (
        <video
          src={item.video_url ?? item.image_url}
          style={lightboxVideoStyle}
          controls
          autoPlay
        />
      )
    }

    return (
      <img
        src={item.image_url}
        alt={item.caption || album?.title || 'Foto galleria'}
        style={lightboxImageStyle}
      />
    )
  }

  function goPrev() {
    if (media.length === 0) return

    setActiveIndex((current) => {
      if (current === null) return 0
      return current === 0 ? media.length - 1 : current - 1
    })
  }

  function goNext() {
    if (media.length === 0) return

    setActiveIndex((current) => {
      if (current === null) return 0
      return current === media.length - 1 ? 0 : current + 1
    })
  }

  return (
    <main style={pageStyle}>
      <section style={heroStyle}>
        <div style={containerStyle}>
          <Link to="/galleria" style={backLinkStyle}>
            ← Torna alla galleria
          </Link>

          {loading && <p style={mutedTextStyle}>Caricamento album...</p>}

          {!loading && message && <div style={messageBoxStyle}>{message}</div>}

          {!loading && !message && album && (
            <>
              <p style={labelStyle}>Album</p>

              <h1 style={albumPageTitleBadgeStyle}>{album.title}</h1>

              <p style={albumMetaStyle}>
                {formatAlbumDate(album)}
                {album.category ? ` · ${album.category}` : ''}
                {' · '}
                {media.length} contenuti
              </p>

              {album.description && (
                <p style={introTextStyle}>{album.description}</p>
              )}
            </>
          )}
        </div>
      </section>

      {!loading && !message && album && (
        <section style={contentStyle}>
          <div style={containerStyle}>
            {media.length === 0 && (
              <div style={emptyBoxStyle}>
                Questo album non contiene ancora foto o video.
              </div>
            )}

            {media.length > 0 && (
              <div style={mediaGridStyle}>
                {media.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    style={mediaCardStyle}
                    onClick={() => setActiveIndex(index)}
                  >
                    {renderMediaThumb(item)}

                    {item.caption && (
                      <span style={captionStyle}>{item.caption}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {activeMedia && activeIndex !== null && (
        <div style={lightboxOverlayStyle} onClick={() => setActiveIndex(null)}>
          <button
            type="button"
            style={closeButtonStyle}
            onClick={() => setActiveIndex(null)}
          >
            ×
          </button>

          <button
            type="button"
            style={prevButtonStyle}
            onClick={(e) => {
              e.stopPropagation()
              goPrev()
            }}
          >
            ‹
          </button>

          <div
            style={lightboxContentStyle}
            onClick={(e) => e.stopPropagation()}
          >
            {renderLightboxMedia(activeMedia)}

            {activeMedia.caption && (
              <p style={lightboxCaptionStyle}>{activeMedia.caption}</p>
            )}

            <p style={lightboxCounterStyle}>
              {activeIndex + 1} / {media.length}
            </p>
          </div>

          <button
            type="button"
            style={nextButtonStyle}
            onClick={(e) => {
              e.stopPropagation()
              goNext()
            }}
          >
            ›
          </button>
        </div>
      )}
    </main>
  )
}

const pageStyle: CSSProperties = {
  minHeight: '90vh',
  background:
    'radial-gradient(circle at top, rgba(130,35,43,0.12), transparent 32%), #0b0f1a',
  color: 'white',
}

const containerStyle: CSSProperties = {
  width: 'min(1120px, calc(100% - 32px))',
  margin: '0 auto',
}

const heroStyle: CSSProperties = {
  padding: '54px 0 24px',
}

const backLinkStyle: CSSProperties = {
  display: 'inline-block',
  color: '#d95b64',
  textDecoration: 'none',
  fontWeight: 900,
  marginBottom: '20px',
}

const labelStyle: CSSProperties = {
  color: '#d95b64',
  fontWeight: 900,
  letterSpacing: '2px',
  textTransform: 'uppercase',
  fontSize: '12px',
  marginBottom: '10px',
}

const albumPageTitleBadgeStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  width: 'fit-content',
  maxWidth: '100%',
  margin: '0 0 12px',
  padding: '8px 17px',
  borderRadius: '999px',
  background: 'linear-gradient(180deg, #b9444f 0%, #82232b 100%)',
  color: 'white',
  fontSize: 'clamp(18px, 4vw, 28px)',
  lineHeight: 1.12,
  fontWeight: 850,
  boxShadow: '0 8px 18px rgba(80,10,18,0.24)',
}

const albumMetaStyle: CSSProperties = {
  margin: '0 0 10px',
  color: '#f2f2f2',
  fontSize: '14px',
  fontWeight: 800,
  lineHeight: 1.45,
}

const introTextStyle: CSSProperties = {
  maxWidth: '860px',
  color: '#d7dbe3',
  fontSize: '15px',
  lineHeight: 1.7,
  marginTop: '10px',
}

const contentStyle: CSSProperties = {
  padding: '0 0 72px',
}

const mutedTextStyle: CSSProperties = {
  color: '#d7dbe3',
  lineHeight: 1.6,
}

const messageBoxStyle: CSSProperties = {
  background: 'rgba(185,68,79,0.18)',
  border: '1px solid rgba(185,68,79,0.28)',
  color: '#f3dede',
  borderRadius: '18px',
  padding: '18px',
}

const emptyBoxStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.045)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: '18px',
  padding: '20px',
  color: '#d7dbe3',
}

const mediaGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
  gap: '8px',
}

const mediaCardStyle: CSSProperties = {
  cursor: 'pointer',
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.04)',
  borderRadius: '12px',
  padding: '5px',
  color: 'white',
  textAlign: 'left',
}

const thumbWrapperStyle: CSSProperties = {
  position: 'relative',
}

const thumbImageStyle: CSSProperties = {
  width: '100%',
  height: '78px',
  objectFit: 'cover',
  borderRadius: '8px',
  display: 'block',
  background: '#111',
}

const videoBadgeStyle: CSSProperties = {
  position: 'absolute',
  left: '5px',
  bottom: '5px',
  background: 'linear-gradient(180deg, #b9444f 0%, #82232b 100%)',
  color: 'white',
  borderRadius: '999px',
  padding: '3px 6px',
  fontSize: '9px',
  fontWeight: 900,
}

const captionStyle: CSSProperties = {
  display: 'block',
  color: '#d7dbe3',
  fontSize: '10px',
  lineHeight: 1.25,
  marginTop: '5px',
}

const lightboxOverlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.88)',
  zIndex: 9999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
}

const lightboxContentStyle: CSSProperties = {
  maxWidth: 'min(1000px, 90vw)',
  maxHeight: '86vh',
  textAlign: 'center',
}

const lightboxImageStyle: CSSProperties = {
  maxWidth: '100%',
  maxHeight: '76vh',
  objectFit: 'contain',
  borderRadius: '16px',
}

const lightboxVideoStyle: CSSProperties = {
  maxWidth: '100%',
  maxHeight: '76vh',
  borderRadius: '16px',
}

const lightboxIframeStyle: CSSProperties = {
  width: 'min(900px, 86vw)',
  height: 'min(520px, 60vw)',
  border: 'none',
  borderRadius: '16px',
  background: '#111',
}

const closeButtonStyle: CSSProperties = {
  position: 'fixed',
  top: '18px',
  right: '22px',
  width: '42px',
  height: '42px',
  borderRadius: '999px',
  border: 'none',
  cursor: 'pointer',
  background: 'linear-gradient(180deg, #b9444f 0%, #82232b 100%)',
  color: 'white',
  fontSize: '30px',
  lineHeight: 1,
  fontWeight: 800,
}

const prevButtonStyle: CSSProperties = {
  position: 'fixed',
  left: '22px',
  top: '50%',
  transform: 'translateY(-50%)',
  width: '44px',
  height: '44px',
  borderRadius: '999px',
  border: 'none',
  cursor: 'pointer',
  background: 'rgba(255,255,255,0.12)',
  color: 'white',
  fontSize: '34px',
  lineHeight: 1,
}

const nextButtonStyle: CSSProperties = {
  position: 'fixed',
  right: '22px',
  top: '50%',
  transform: 'translateY(-50%)',
  width: '44px',
  height: '44px',
  borderRadius: '999px',
  border: 'none',
  cursor: 'pointer',
  background: 'rgba(255,255,255,0.12)',
  color: 'white',
  fontSize: '34px',
  lineHeight: 1,
}

const lightboxCaptionStyle: CSSProperties = {
  color: '#f2f2f2',
  fontSize: '14px',
  lineHeight: 1.5,
  marginTop: '12px',
}

const lightboxCounterStyle: CSSProperties = {
  color: '#b9bec9',
  fontSize: '13px',
  marginTop: '8px',
}

export default GalleriaAlbum