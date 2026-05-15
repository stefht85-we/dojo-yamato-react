import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

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
  media_type: 'image' | 'video' | 'youtube' | 'file' | 'social' | string
  thumbnail_url: string | null
  video_url: string | null
}

function GalleriaAlbum() {
  const { albumId } = useParams()

  const [album, setAlbum] = useState<GalleryAlbum | null>(null)
  const [media, setMedia] = useState<GalleryMedia[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  useEffect(() => {
    loadAlbum()
  }, [albumId])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (activeIndex === null) return

      if (event.key === 'Escape') {
        setActiveIndex(null)
      }

      if (event.key === 'ArrowRight') {
        setActiveIndex((current) => {
          if (current === null || viewableMedia.length === 0) return current
          return current === viewableMedia.length - 1 ? 0 : current + 1
        })
      }

      if (event.key === 'ArrowLeft') {
        setActiveIndex((current) => {
          if (current === null || viewableMedia.length === 0) return current
          return current === 0 ? viewableMedia.length - 1 : current - 1
        })
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeIndex, media])

  async function loadAlbum() {
    setLoading(true)
    setError('')

    if (!albumId) {
      setError('Album non valido.')
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

    if (albumError || !albumData) {
      console.error('Errore caricamento album:', albumError)
      setError('Album non trovato o non disponibile.')
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
      console.error('Errore caricamento contenuti album:', mediaError)
      setError(`Errore caricamento contenuti album: ${mediaError.message}`)
      setLoading(false)
      return
    }

    setAlbum(albumData as GalleryAlbum)
    setMedia((mediaData ?? []) as GalleryMedia[])
    setLoading(false)
  }

  const sortedMedia = useMemo(() => {
    return [...media].sort((a, b) => {
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    })
  }, [media])

  const viewableMedia = useMemo(() => {
    return sortedMedia.filter(
      (item) => item.media_type === 'image' || item.media_type === 'video'
    )
  }, [sortedMedia])

  const activeMedia =
    activeIndex !== null && activeIndex >= 0 ? viewableMedia[activeIndex] : null

  function getMediaUrl(item: GalleryMedia) {
    return item.video_url || item.image_url || ''
  }

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

  function isPdf(item: GalleryMedia) {
    const url = getMediaUrl(item).toLowerCase()
    const caption = (item.caption || '').toLowerCase()

    return item.media_type === 'file' && (url.includes('.pdf') || caption.includes('.pdf'))
  }

  function isSocial(item: GalleryMedia) {
    const url = getMediaUrl(item).toLowerCase()

    return (
      item.media_type === 'social' ||
      url.includes('instagram.com') ||
      url.includes('facebook.com') ||
      url.includes('fb.com') ||
      url.includes('tiktok.com')
    )
  }

  function getSocialPlatform(item: GalleryMedia) {
    const url = getMediaUrl(item).toLowerCase()
    const caption = (item.caption || '').toLowerCase()

    if (url.includes('instagram.com') || caption.includes('instagram')) {
      return {
        label: 'Instagram',
        icon: '◎',
        gradient: 'linear-gradient(135deg, #833ab4 0%, #fd1d1d 52%, #fcb045 100%)',
      }
    }

    if (url.includes('facebook.com') || url.includes('fb.com') || caption.includes('facebook')) {
      return {
        label: 'Facebook',
        icon: 'f',
        gradient: 'linear-gradient(135deg, #1877f2 0%, #0d47a1 100%)',
      }
    }

    if (url.includes('tiktok.com') || caption.includes('tiktok')) {
      return {
        label: 'TikTok',
        icon: '♪',
        gradient: 'linear-gradient(135deg, #111111 0%, #25f4ee 48%, #fe2c55 100%)',
      }
    }

    return {
      label: 'Social',
      icon: '↗',
      gradient: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)',
    }
  }

  function getCardType(item: GalleryMedia) {
    if (item.media_type === 'youtube') return 'YOUTUBE'
    if (isSocial(item)) return 'SOCIAL'
    if (item.media_type === 'video') return 'VIDEO'
    if (item.media_type === 'file' || isPdf(item)) return 'DOCUMENTO'
    return 'IMMAGINE'
  }

  function handleCardClick(item: GalleryMedia) {
    if (item.media_type === 'image' || item.media_type === 'video') {
      const index = viewableMedia.findIndex((mediaItem) => mediaItem.id === item.id)
      if (index >= 0) setActiveIndex(index)
      return
    }

    window.open(getMediaUrl(item), '_blank', 'noopener,noreferrer')
  }

  function goPrev() {
    if (viewableMedia.length === 0) return

    setActiveIndex((current) => {
      if (current === null) return 0
      return current === 0 ? viewableMedia.length - 1 : current - 1
    })
  }

  function goNext() {
    if (viewableMedia.length === 0) return

    setActiveIndex((current) => {
      if (current === null) return 0
      return current === viewableMedia.length - 1 ? 0 : current + 1
    })
  }

  function renderPreview(item: GalleryMedia) {
    const mediaUrl = getMediaUrl(item)

    if (item.media_type === 'youtube') {
      return (
        <div style={previewWrapperStyle}>
          <img
            src={item.thumbnail_url || ''}
            alt="YouTube"
            style={previewImageStyle}
          />

          <div style={playOverlayStyle}>▶</div>
        </div>
      )
    }

    if (isSocial(item)) {
      const platform = getSocialPlatform(item)

      if (item.thumbnail_url) {
        return (
          <div style={previewWrapperStyle}>
            <img
              src={item.thumbnail_url}
              alt={platform.label}
              style={previewImageStyle}
            />

            <div style={socialMiniBadgeStyle}>{platform.label}</div>
          </div>
        )
      }

      return (
        <div style={previewWrapperStyle}>
          <div
            style={{
              ...socialPreviewStyle,
              background: platform.gradient,
            }}
          >
            <div style={socialIconStyle}>{platform.icon}</div>
            <div style={socialTitleStyle}>{platform.label}</div>
          </div>
        </div>
      )
    }

    if (item.media_type === 'video') {
      return (
        <div style={previewWrapperStyle}>
          <video
            src={mediaUrl}
            style={previewImageStyle}
            muted
            playsInline
            preload="metadata"
          />

          <div style={playOverlayStyle}>▶</div>
        </div>
      )
    }

    if (item.media_type === 'file') {
      return (
        <div style={previewWrapperStyle}>
          <div style={documentPreviewStyle}>
            <div style={documentIconStyle}>PDF</div>
          </div>
        </div>
      )
    }

    return (
      <div style={previewWrapperStyle}>
        <img
          src={item.image_url}
          alt="Immagine galleria"
          style={previewImageStyle}
        />
      </div>
    )
  }

  function renderLightboxContent(item: GalleryMedia) {
    if (item.media_type === 'video') {
      return (
        <video
          src={item.video_url || item.image_url}
          controls
          autoPlay
          style={lightboxMediaStyle}
        />
      )
    }

    return (
      <img
        src={item.image_url}
        alt={album?.title || 'Immagine galleria'}
        style={lightboxMediaStyle}
      />
    )
  }

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={containerStyle}>
          <p style={smallLabelStyle}>GALLERIA</p>
          <h1 style={titleStyle}>Caricamento album...</h1>
        </div>
      </main>
    )
  }

  if (error || !album) {
    return (
      <main style={pageStyle}>
        <div style={containerStyle}>
          <Link to="/galleria" style={backLinkStyle}>
            ← Torna agli anni
          </Link>

          <p style={smallLabelStyle}>GALLERIA</p>
          <h1 style={titleStyle}>Album non disponibile</h1>

          <div style={emptyBoxStyle}>{error || 'Album non trovato.'}</div>
        </div>
      </main>
    )
  }

  return (
    <>
      <main style={pageStyle}>
        <div style={containerStyle}>
          <Link to="/galleria" style={backLinkStyle}>
            ← Torna agli anni
          </Link>

          <p style={smallLabelStyle}>GALLERIA</p>

          <h1 style={titleStyle}>{album.title}</h1>

          <div style={metaRowStyle}>
            <span>{formatAlbumDate(album)}</span>
            {album.category && <span>• {album.category}</span>}
            <span>• {sortedMedia.length} contenuti</span>
          </div>

          {album.description && <p style={descriptionStyle}>{album.description}</p>}

          {sortedMedia.length === 0 ? (
            <div style={emptyBoxStyle}>Questo album non contiene ancora materiali.</div>
          ) : (
            <div style={gridStyle}>
              {sortedMedia.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleCardClick(item)}
                  style={cardStyle}
                >
                  {renderPreview(item)}

                  <div style={cardBodyStyle}>
                    <div style={mediaLabelStyle}>{getCardType(item)}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      {activeMedia && (
        <div style={lightboxOverlayStyle} onClick={() => setActiveIndex(null)}>
          <button
            type="button"
            onClick={() => setActiveIndex(null)}
            style={closeButtonStyle}
          >
            ×
          </button>

          {viewableMedia.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  goPrev()
                }}
                style={navButtonLeftStyle}
              >
                ‹
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  goNext()
                }}
                style={navButtonRightStyle}
              >
                ›
              </button>
            </>
          )}

          <div
            style={lightboxContentStyle}
            onClick={(e) => e.stopPropagation()}
          >
            {renderLightboxContent(activeMedia)}
          </div>
        </div>
      )}
    </>
  )
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background:
    'radial-gradient(circle at top, rgba(120,20,40,0.18), transparent 35%), #020817',
  color: 'white',
  padding: '54px 24px 80px',
}

const containerStyle: React.CSSProperties = {
  maxWidth: '1180px',
  margin: '0 auto',
}

const backLinkStyle: React.CSSProperties = {
  display: 'inline-block',
  marginBottom: '28px',
  color: '#ff5c70',
  textDecoration: 'none',
  fontWeight: 800,
}

const smallLabelStyle: React.CSSProperties = {
  color: '#ff4d5f',
  fontWeight: 900,
  letterSpacing: '2px',
  fontSize: '14px',
  margin: '0 0 14px',
}

const titleStyle: React.CSSProperties = {
  fontSize: 'clamp(40px, 7vw, 72px)',
  lineHeight: 1.02,
  margin: '0 0 16px',
}

const metaRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
  flexWrap: 'wrap',
  color: '#cbd5e1',
  marginBottom: '14px',
  fontSize: '14px',
  fontWeight: 700,
}

const descriptionStyle: React.CSSProperties = {
  color: '#e5e7eb',
  fontSize: '18px',
  lineHeight: 1.6,
  maxWidth: '820px',
  marginBottom: '34px',
}

const emptyBoxStyle: React.CSSProperties = {
  padding: '22px',
  borderRadius: '20px',
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.05)',
  color: '#e5e7eb',
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
  gap: '16px',
  alignItems: 'start',
}

const cardStyle: React.CSSProperties = {
  textDecoration: 'none',
  color: 'white',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  minHeight: '174px',
  padding: 0,
  cursor: 'pointer',
  textAlign: 'left',
}

const previewWrapperStyle: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  height: '132px',
  background: '#111827',
  overflow: 'hidden',
}

const previewImageStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
}

const playOverlayStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '42px',
  color: 'white',
  textShadow: '0 4px 18px rgba(0,0,0,0.6)',
  background: 'linear-gradient(to top, rgba(0,0,0,0.22), rgba(0,0,0,0.12))',
}

const documentPreviewStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  background: 'linear-gradient(180deg, #1f2937 0%, #111827 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const documentIconStyle: React.CSSProperties = {
  width: '82px',
  height: '82px',
  borderRadius: '18px',
  background: 'rgba(255,255,255,0.10)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 900,
  fontSize: '20px',
  color: 'white',
  letterSpacing: '1px',
}

const socialPreviewStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  gap: '8px',
}

const socialIconStyle: React.CSSProperties = {
  fontSize: '34px',
  lineHeight: 1,
  fontWeight: 900,
}

const socialTitleStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 900,
}

const socialMiniBadgeStyle: React.CSSProperties = {
  position: 'absolute',
  left: '10px',
  bottom: '10px',
  background: 'rgba(0,0,0,0.62)',
  color: 'white',
  padding: '6px 10px',
  borderRadius: '999px',
  fontSize: '12px',
  fontWeight: 900,
}

const cardBodyStyle: React.CSSProperties = {
  padding: '9px 12px 10px',
  display: 'grid',
  gap: 0,
}

const mediaLabelStyle: React.CSSProperties = {
  color: '#ff4d5f',
  fontWeight: 900,
  letterSpacing: '1.3px',
  fontSize: '12px',
}

const lightboxOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.92)',
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '30px',
}

const lightboxContentStyle: React.CSSProperties = {
  maxWidth: '92vw',
  maxHeight: '88vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const lightboxMediaStyle: React.CSSProperties = {
  maxWidth: '92vw',
  maxHeight: '88vh',
  borderRadius: '16px',
  objectFit: 'contain',
}

const closeButtonStyle: React.CSSProperties = {
  position: 'fixed',
  top: '18px',
  right: '18px',
  width: '52px',
  height: '52px',
  borderRadius: '999px',
  border: 'none',
  background: 'white',
  color: '#111',
  fontSize: '34px',
  lineHeight: 1,
  cursor: 'pointer',
  zIndex: 1001,
}

const navButtonBase: React.CSSProperties = {
  position: 'fixed',
  top: '50%',
  transform: 'translateY(-50%)',
  width: '56px',
  height: '56px',
  borderRadius: '999px',
  border: 'none',
  background: 'rgba(255,255,255,0.14)',
  color: 'white',
  fontSize: '34px',
  cursor: 'pointer',
  zIndex: 1001,
}

const navButtonLeftStyle: React.CSSProperties = {
  ...navButtonBase,
  left: '18px',
}

const navButtonRightStyle: React.CSSProperties = {
  ...navButtonBase,
  right: '18px',
}

export default GalleriaAlbum