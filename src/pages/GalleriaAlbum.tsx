import { useEffect, useState } from 'react'
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
  media_type: 'image' | 'video' | 'youtube'
  thumbnail_url: string | null
  video_url: string | null
}

function GalleriaAlbum() {
  const { albumId } = useParams()

  const [album, setAlbum] = useState<GalleryAlbum | null>(null)
  const [media, setMedia] = useState<GalleryMedia[]>([])
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const selectedMedia =
    selectedIndex !== null && media[selectedIndex] ? media[selectedIndex] : null

  useEffect(() => {
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
        console.error('Errore caricamento media:', mediaError)
        setMessage('Non è stato possibile caricare i contenuti dell’album.')
        setLoading(false)
        return
      }

      setAlbum(albumData)
      setMedia((mediaData ?? []) as GalleryMedia[])
      setLoading(false)
    }

    loadAlbum()
  }, [albumId])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (selectedIndex === null) return

      if (event.key === 'Escape') {
        closeLightbox()
      }

      if (event.key === 'ArrowRight') {
        showNextMedia()
      }

      if (event.key === 'ArrowLeft') {
        showPreviousMedia()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedIndex, media.length])

  function openLightbox(index: number) {
    setSelectedIndex(index)
  }

  function closeLightbox() {
    setSelectedIndex(null)
  }

  function showNextMedia() {
    setSelectedIndex((currentIndex) => {
      if (currentIndex === null || media.length === 0) return currentIndex
      return currentIndex === media.length - 1 ? 0 : currentIndex + 1
    })
  }

  function showPreviousMedia() {
    setSelectedIndex((currentIndex) => {
      if (currentIndex === null || media.length === 0) return currentIndex
      return currentIndex === 0 ? media.length - 1 : currentIndex - 1
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

  function getYoutubeEmbedUrl(url: string) {
    const videoId = getYoutubeId(url)
    return videoId ? `https://www.youtube.com/embed/${videoId}` : ''
  }

  function renderMediaCard(item: GalleryMedia, index: number) {
    if (item.media_type === 'youtube') {
      return (
        <button
          key={item.id}
          type="button"
          onClick={() => openLightbox(index)}
          style={mediaButtonStyle}
        >
          <div style={mediaPreviewWrapperStyle}>
            <img
              src={item.thumbnail_url ?? ''}
              alt={item.caption || album?.title || 'Video YouTube'}
              style={mediaImageStyle}
            />
            <span style={playBadgeStyle}>▶</span>
            <span style={typeBadgeStyle}>YouTube</span>
          </div>

          {item.caption && <span style={captionStyle}>{item.caption}</span>}
        </button>
      )
    }

    if (item.media_type === 'video') {
      return (
        <button
          key={item.id}
          type="button"
          onClick={() => openLightbox(index)}
          style={mediaButtonStyle}
        >
          <div style={mediaPreviewWrapperStyle}>
            <video
              src={item.video_url ?? item.image_url}
              style={mediaImageStyle}
              muted
              preload="metadata"
            />
            <span style={playBadgeStyle}>▶</span>
            <span style={typeBadgeStyle}>Video</span>
          </div>

          {item.caption && <span style={captionStyle}>{item.caption}</span>}
        </button>
      )
    }

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => openLightbox(index)}
        style={mediaButtonStyle}
      >
        <img
          src={item.image_url}
          alt={item.caption || album?.title || 'Foto galleria'}
          style={mediaImageStyle}
        />

        {item.caption && <span style={captionStyle}>{item.caption}</span>}
      </button>
    )
  }

  function renderLightboxContent() {
    if (!selectedMedia) return null

    if (selectedMedia.media_type === 'youtube') {
      const embedUrl = getYoutubeEmbedUrl(
        selectedMedia.video_url || selectedMedia.image_url
      )

      return (
        <div style={lightboxVideoWrapperStyle}>
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={selectedMedia.caption || album?.title || 'Video YouTube'}
              style={youtubeFrameStyle}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <p style={{ color: 'white' }}>Video YouTube non disponibile.</p>
          )}

          {selectedMedia.caption && (
            <p style={lightboxCaptionStyle}>{selectedMedia.caption}</p>
          )}
        </div>
      )
    }

    if (selectedMedia.media_type === 'video') {
      return (
        <div style={lightboxVideoWrapperStyle}>
          <video
            key={selectedMedia.id}
            src={selectedMedia.video_url ?? selectedMedia.image_url}
            style={lightboxVideoStyle}
            controls
            autoPlay
          />

          {selectedMedia.caption && (
            <p style={lightboxCaptionStyle}>{selectedMedia.caption}</p>
          )}
        </div>
      )
    }

    return (
      <div style={lightboxContentStyle}>
        <img
          src={selectedMedia.image_url}
          alt={selectedMedia.caption || album?.title || 'Foto galleria'}
          style={lightboxImageStyle}
        />

        {selectedMedia.caption && (
          <p style={lightboxCaptionStyle}>{selectedMedia.caption}</p>
        )}
      </div>
    )
  }

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <Link
          to={album ? `/galleria/${album.event_year}` : '/galleria'}
          style={backLinkStyle}
        >
          ← Torna agli album
        </Link>

        {loading && <p style={textStyle}>Caricamento album...</p>}

        {!loading && message && (
          <div style={emptyBoxStyle}>
            <p style={{ margin: 0 }}>{message}</p>
          </div>
        )}

        {!loading && !message && album && (
          <>
            <section style={{ marginTop: '28px', marginBottom: '44px' }}>
              <p style={labelStyle}>Galleria</p>

              <h1 style={titleStyle}>{album.title}</h1>

              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  flexWrap: 'wrap',
                  marginTop: '20px',
                }}
              >
                {album.category && <span style={tagStyle}>{album.category}</span>}

                <span style={tagStyle}>
                  {album.event_date
                    ? new Date(album.event_date).toLocaleDateString('it-IT')
                    : album.event_year}
                </span>

                <span style={tagStyle}>
                  {media.length} {media.length === 1 ? 'contenuto' : 'contenuti'}
                </span>
              </div>

              {album.description && <p style={textStyle}>{album.description}</p>}
            </section>

            {media.length === 0 && (
              <div style={emptyBoxStyle}>
                <h2 style={{ marginTop: 0, color: 'white' }}>
                  Nessun contenuto disponibile
                </h2>

                <p style={{ marginBottom: 0 }}>
                  Foto e video di questo album saranno caricati prossimamente.
                </p>
              </div>
            )}

            {media.length > 0 && (
              <section style={mediaGridStyle}>
                {media.map((item, index) => renderMediaCard(item, index))}
              </section>
            )}
          </>
        )}
      </div>

      {selectedMedia && selectedIndex !== null && (
        <div style={lightboxOverlayStyle} onClick={closeLightbox}>
          <button type="button" onClick={closeLightbox} style={closeButtonStyle}>
            ×
          </button>

          {media.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  showPreviousMedia()
                }}
                style={previousButtonStyle}
                aria-label="Precedente"
              >
                ‹
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  showNextMedia()
                }}
                style={nextButtonStyle}
                aria-label="Successiva"
              >
                ›
              </button>
            </>
          )}

          <div onClick={(e) => e.stopPropagation()}>
            {renderLightboxContent()}

            {media.length > 1 && (
              <p style={counterStyle}>
                {selectedIndex + 1} / {media.length}
              </p>
            )}
          </div>
        </div>
      )}
    </main>
  )
}

const pageStyle: React.CSSProperties = {
  minHeight: '90vh',
  background:
    'radial-gradient(circle at top, rgba(230,57,70,0.18), transparent 34%), #0b0f1a',
  color: 'white',
  padding: '80px 24px',
}

const containerStyle: React.CSSProperties = {
  maxWidth: '1200px',
  margin: '0 auto',
}

const backLinkStyle: React.CSSProperties = {
  display: 'inline-block',
  color: '#e63946',
  textDecoration: 'none',
  fontWeight: 800,
}

const labelStyle: React.CSSProperties = {
  color: '#e63946',
  fontWeight: 800,
  letterSpacing: '2px',
  textTransform: 'uppercase',
  marginBottom: '12px',
}

const titleStyle: React.CSSProperties = {
  fontSize: 'clamp(2.2rem, 6vw, 4.2rem)',
  margin: 0,
  lineHeight: 1.05,
}

const textStyle: React.CSSProperties = {
  maxWidth: '760px',
  marginTop: '20px',
  color: '#d8d8d8',
  fontSize: '18px',
  lineHeight: 1.7,
}

const tagStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '6px 10px',
  borderRadius: '999px',
  background: 'rgba(230,57,70,0.18)',
  color: '#ffd7d7',
  fontSize: '13px',
  fontWeight: 700,
}

const emptyBoxStyle: React.CSSProperties = {
  marginTop: '36px',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: '18px',
  padding: '28px',
  color: '#d8d8d8',
}

const mediaGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '18px',
}

const mediaButtonStyle: React.CSSProperties = {
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  background: 'rgba(255,255,255,0.06)',
  borderRadius: '18px',
  overflow: 'hidden',
  textAlign: 'left',
  color: 'white',
}

const mediaPreviewWrapperStyle: React.CSSProperties = {
  position: 'relative',
}

const mediaImageStyle: React.CSSProperties = {
  width: '100%',
  height: '240px',
  objectFit: 'cover',
  display: 'block',
  background: '#111',
}

const playBadgeStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  fontSize: '46px',
  fontWeight: 900,
  textShadow: '0 4px 16px rgba(0,0,0,0.85)',
}

const typeBadgeStyle: React.CSSProperties = {
  position: 'absolute',
  left: '12px',
  top: '12px',
  padding: '5px 10px',
  borderRadius: '999px',
  background: 'rgba(0,0,0,0.70)',
  color: 'white',
  fontSize: '12px',
  fontWeight: 800,
}

const captionStyle: React.CSSProperties = {
  display: 'block',
  padding: '14px',
  color: '#d8d8d8',
  lineHeight: 1.5,
}

const lightboxOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.92)',
  zIndex: 9999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
}

const lightboxContentStyle: React.CSSProperties = {
  maxWidth: '1100px',
  width: '100%',
  textAlign: 'center',
}

const lightboxImageStyle: React.CSSProperties = {
  maxWidth: '100%',
  maxHeight: '82vh',
  objectFit: 'contain',
  borderRadius: '14px',
}

const lightboxVideoWrapperStyle: React.CSSProperties = {
  width: 'min(1100px, 92vw)',
  textAlign: 'center',
}

const lightboxVideoStyle: React.CSSProperties = {
  width: '100%',
  maxHeight: '82vh',
  borderRadius: '14px',
  background: '#000',
}

const youtubeFrameStyle: React.CSSProperties = {
  width: '100%',
  aspectRatio: '16 / 9',
  border: 'none',
  borderRadius: '14px',
  background: '#000',
}

const lightboxCaptionStyle: React.CSSProperties = {
  color: 'white',
  marginTop: '14px',
  fontSize: '16px',
}

const closeButtonStyle: React.CSSProperties = {
  position: 'fixed',
  top: '22px',
  right: '26px',
  width: '44px',
  height: '44px',
  borderRadius: '999px',
  border: 'none',
  background: 'white',
  color: '#111',
  fontSize: '32px',
  lineHeight: 1,
  cursor: 'pointer',
  zIndex: 10000,
}

const previousButtonStyle: React.CSSProperties = {
  position: 'fixed',
  left: '24px',
  top: '50%',
  transform: 'translateY(-50%)',
  width: '52px',
  height: '52px',
  borderRadius: '999px',
  border: 'none',
  background: 'white',
  color: '#111',
  fontSize: '42px',
  lineHeight: 1,
  cursor: 'pointer',
  zIndex: 10000,
}

const nextButtonStyle: React.CSSProperties = {
  ...previousButtonStyle,
  left: 'auto',
  right: '24px',
}

const counterStyle: React.CSSProperties = {
  color: 'rgba(255,255,255,0.78)',
  textAlign: 'center',
  marginTop: '12px',
  fontSize: '14px',
}

export default GalleriaAlbum