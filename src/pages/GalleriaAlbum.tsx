import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
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
  media_type: 'image' | 'video' | 'youtube' | 'file' | 'social'
  thumbnail_url: string | null
  video_url: string | null
}

function GalleriaAlbum() {
  const { albumId } = useParams()

  const [album, setAlbum] = useState<GalleryAlbum | null>(null)
  const [media, setMedia] = useState<GalleryMedia[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<GalleryMedia | null>(null)

  useEffect(() => {
    loadAlbum()
  }, [albumId])

  async function loadAlbum() {
    if (!albumId) {
      setMessage('Album non trovato.')
      setLoading(false)
      return
    }

    setLoading(true)
    setMessage('')

    const { data: albumData, error: albumError } = await supabase
      .from('gallery_albums')
      .select(
        'id, title, description, category, event_date, event_year, cover_image_url, visible, created_at'
      )
      .eq('id', albumId)
      .single()

    if (albumError) {
      console.error('Errore caricamento album:', albumError)
      setMessage('Errore durante il caricamento dell’album.')
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
      setMessage('Errore durante il caricamento dei contenuti.')
      setLoading(false)
      return
    }

    setAlbum(albumData as GalleryAlbum)
    setMedia((mediaData ?? []) as GalleryMedia[])
    setLoading(false)
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

    return null
  }

  function renderMediaPreview(item: GalleryMedia) {
    if (item.media_type === 'image') {
      return (
        <button
          type="button"
          style={mediaButtonStyle}
          onClick={() => setSelectedImage(item.image_url)}
          aria-label="Apri immagine"
        >
          <img
            src={item.image_url}
            alt={item.caption || album?.title || 'Immagine galleria'}
            style={mediaImageStyle}
          />
        </button>
      )
    }

    if (item.media_type === 'video') {
      return (
        <button
          type="button"
          style={mediaButtonStyle}
          onClick={() => setSelectedVideo(item)}
          aria-label="Apri video"
        >
          <div style={videoPreviewWrapperStyle}>
            <video
              src={item.video_url ?? item.image_url}
              style={mediaImageStyle}
              muted
              preload="metadata"
              playsInline
              controls={false}
              onContextMenu={(e) => e.preventDefault()}
            />

            <div style={playOverlayStyle}>
              <span style={playCircleStyle}>▶</span>
            </div>

            <span style={mediaBadgeStyle}>Video</span>
          </div>
        </button>
      )
    }

    if (item.media_type === 'youtube') {
      return (
        <button
          type="button"
          style={mediaButtonStyle}
          onClick={() => setSelectedVideo(item)}
          aria-label="Apri video YouTube"
        >
          <div style={videoPreviewWrapperStyle}>
            <img
              src={item.thumbnail_url ?? ''}
              alt="Anteprima YouTube"
              style={mediaImageStyle}
            />

            <div style={playOverlayStyle}>
              <span style={playCircleStyle}>▶</span>
            </div>

            <span style={mediaBadgeStyle}>YouTube</span>
          </div>
        </button>
      )
    }

    if (item.media_type === 'social') {
      const hasPreview = Boolean(item.thumbnail_url)

      return (
        <a
          href={item.video_url ?? item.image_url}
          target="_blank"
          rel="noreferrer"
          style={mediaButtonStyle}
        >
          <div style={videoPreviewWrapperStyle}>
            {hasPreview ? (
              <img
                src={item.thumbnail_url ?? ''}
                alt={item.caption || 'Link social'}
                style={mediaImageStyle}
              />
            ) : (
              <div style={placeholderStyle}>Social</div>
            )}

            <span style={mediaBadgeStyle}>{item.caption || 'Social'}</span>
          </div>
        </a>
      )
    }

    return (
      <a
        href={item.image_url}
        target="_blank"
        rel="noreferrer"
        style={mediaButtonStyle}
      >
        <div style={filePreviewStyle}>
          <span style={fileIconStyle}>PDF</span>
          <span style={fileTextStyle}>Apri documento</span>
        </div>
      </a>
    )
  }

  function renderVideoModal() {
    if (!selectedVideo) return null

    const videoUrl = selectedVideo.video_url ?? selectedVideo.image_url

    if (selectedVideo.media_type === 'youtube') {
      const embedUrl = getYoutubeEmbedUrl(videoUrl)

      return (
        <div style={modalOverlayStyle} onClick={() => setSelectedVideo(null)}>
          <div style={videoModalStyle} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              style={closeButtonStyle}
              onClick={() => setSelectedVideo(null)}
              aria-label="Chiudi video"
            >
              ×
            </button>

            {embedUrl ? (
              <iframe
                src={embedUrl}
                title="Video YouTube"
                style={youtubeFrameStyle}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <p style={modalTextStyle}>Video YouTube non disponibile.</p>
            )}
          </div>
        </div>
      )
    }

    return (
      <div style={modalOverlayStyle} onClick={() => setSelectedVideo(null)}>
        <div style={videoModalStyle} onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            style={closeButtonStyle}
            onClick={() => setSelectedVideo(null)}
            aria-label="Chiudi video"
          >
            ×
          </button>

          <video
            src={videoUrl}
            style={modalVideoStyle}
            controls
            autoPlay
            playsInline
            controlsList="nodownload noplaybackrate"
            disablePictureInPicture
            onContextMenu={(e) => e.preventDefault()}
          />

          <p style={videoNoticeStyle}>
            Video visualizzabile direttamente nella pagina.
          </p>
        </div>
      </div>
    )
  }

  function renderImageModal() {
    if (!selectedImage) return null

    return (
      <div style={modalOverlayStyle} onClick={() => setSelectedImage(null)}>
        <div style={imageModalStyle} onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            style={closeButtonStyle}
            onClick={() => setSelectedImage(null)}
            aria-label="Chiudi immagine"
          >
            ×
          </button>

          <img src={selectedImage} alt="Immagine ingrandita" style={modalImageStyle} />
        </div>
      </div>
    )
  }

  return (
    <main style={pageStyle}>
      <section style={heroStyle}>
        <Link to="/galleria" style={backLinkStyle}>
          ← Torna alla galleria
        </Link>

        {loading && <p style={messageStyle}>Caricamento album...</p>}

        {!loading && message && <p style={messageStyle}>{message}</p>}

        {!loading && album && (
          <>
            <p style={labelStyle}>Galleria {album.event_year}</p>

            <h1 style={titleStyle}>{album.title}</h1>

            {album.description && <p style={introStyle}>{album.description}</p>}
          </>
        )}
      </section>

      {!loading && !message && (
        <section style={gallerySectionStyle}>
          {media.length === 0 ? (
            <div style={emptyBoxStyle}>Questo album non contiene ancora materiali.</div>
          ) : (
            <div style={mediaGridStyle}>
              {media.map((item) => (
                <article key={item.id} style={mediaCardStyle}>
                  {renderMediaPreview(item)}
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {renderVideoModal()}
      {renderImageModal()}
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

const backLinkStyle: CSSProperties = {
  width: 'fit-content',
  color: '#d95b64',
  textDecoration: 'none',
  fontWeight: 900,
}

const labelStyle: CSSProperties = {
  margin: 0,
  color: '#d95b64',
  fontWeight: 900,
  letterSpacing: '2px',
  textTransform: 'uppercase',
  fontSize: '13px',
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 'clamp(42px, 7vw, 76px)',
  lineHeight: 1,
  fontWeight: 950,
}

const introStyle: CSSProperties = {
  margin: 0,
  maxWidth: '820px',
  color: '#d8d8d8',
  fontSize: '17px',
  lineHeight: 1.7,
}

const messageStyle: CSSProperties = {
  color: '#d8d8d8',
  fontSize: '17px',
}

const gallerySectionStyle: CSSProperties = {
  width: 'min(1180px, calc(100% - 8px))',
  margin: '0 auto',
}

const mediaGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
  gap: '14px',
}

const mediaCardStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.045)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
  overflow: 'hidden',
}

const mediaButtonStyle: CSSProperties = {
  display: 'block',
  width: '100%',
  height: '150px',
  padding: 0,
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  textDecoration: 'none',
  color: 'white',
}

const mediaImageStyle: CSSProperties = {
  width: '100%',
  height: '150px',
  objectFit: 'cover',
  display: 'block',
  background: '#111827',
}

const videoPreviewWrapperStyle: CSSProperties = {
  position: 'relative',
  width: '100%',
  height: '150px',
  overflow: 'hidden',
}

const playOverlayStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(0,0,0,0.18)',
}

const playCircleStyle: CSSProperties = {
  width: '44px',
  height: '44px',
  borderRadius: '999px',
  background: 'linear-gradient(180deg, #b9444f 0%, #82232b 100%)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 8px 18px rgba(80,10,18,0.28)',
  fontSize: '18px',
  paddingLeft: '3px',
}

const mediaBadgeStyle: CSSProperties = {
  position: 'absolute',
  left: '8px',
  bottom: '8px',
  padding: '5px 9px',
  borderRadius: '999px',
  background: 'rgba(0,0,0,0.68)',
  color: 'white',
  fontSize: '11px',
  fontWeight: 900,
  maxWidth: 'calc(100% - 16px)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const placeholderStyle: CSSProperties = {
  width: '100%',
  height: '150px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(255,255,255,0.06)',
  color: '#d8d8d8',
  fontWeight: 900,
}

const filePreviewStyle: CSSProperties = {
  width: '100%',
  height: '150px',
  display: 'grid',
  placeItems: 'center',
  alignContent: 'center',
  gap: '8px',
  background: 'rgba(255,255,255,0.06)',
}

const fileIconStyle: CSSProperties = {
  width: '58px',
  height: '58px',
  borderRadius: '16px',
  background: 'linear-gradient(180deg, #b9444f 0%, #82232b 100%)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 950,
}

const fileTextStyle: CSSProperties = {
  color: '#d8d8d8',
  fontSize: '13px',
  fontWeight: 800,
}

const emptyBoxStyle: CSSProperties = {
  padding: '20px',
  borderRadius: '16px',
  background: 'rgba(255,255,255,0.045)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#d8d8d8',
}

const modalOverlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 1000,
  background: 'rgba(0,0,0,0.76)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px',
}

const videoModalStyle: CSSProperties = {
  position: 'relative',
  width: 'min(760px, 96vw)',
  background: '#020817',
  borderRadius: '20px',
  border: '1px solid rgba(255,255,255,0.12)',
  padding: '16px',
  boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
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
  lineHeight: 1,
  zIndex: 2,
}

const modalVideoStyle: CSSProperties = {
  width: '100%',
  maxHeight: '70vh',
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

const modalTextStyle: CSSProperties = {
  color: '#d8d8d8',
  margin: 0,
}

const videoNoticeStyle: CSSProperties = {
  margin: '10px 2px 0',
  color: '#aeb6c4',
  fontSize: '12px',
}

export default GalleriaAlbum