import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { getSignedUrlFromPublicUrl } from '../lib/storageSignedUrl'
import { useAccessStatus } from '../lib/useAccessStatus'

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
  signed_image_url?: string | null
  signed_video_url?: string | null
  signed_thumbnail_url?: string | null
}

function GalleriaAlbum() {
  const { albumId } = useParams()

  const [album, setAlbum] = useState<GalleryAlbum | null>(null)
  const [media, setMedia] = useState<GalleryMedia[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [accessMessage, setAccessMessage] = useState('')
  const [activeMedia, setActiveMedia] = useState<GalleryMedia | null>(null)

  const { canOpenRestrictedContent, isPending } = useAccessStatus()
  const canAccessMedia = canOpenRestrictedContent

  useEffect(() => {
    loadAlbum()
  }, [albumId])

  const mediaCountLabel = useMemo(() => {
    if (media.length === 1) return '1 contenuto'
    return `${media.length} contenuti`
  }, [media.length])

  async function loadAlbum() {
    if (!albumId) return

    setLoading(true)
    setMessage('')

    const { data: albumData, error: albumError } = await supabase
      .from('gallery_albums')
      .select('id, title, description, category, event_date, event_year, cover_image_url, visible, created_at')
      .eq('id', albumId)
      .eq('visible', true)
      .single()

    if (albumError) {
      console.error('Errore caricamento album:', albumError.message)
      setMessage(`Errore caricamento album: ${albumError.message}`)
      setAlbum(null)
      setMedia([])
      setLoading(false)
      return
    }

    const { data: mediaData, error: mediaError } = await supabase
      .from('gallery_photos')
      .select('id, album_id, image_url, caption, sort_order, created_at, media_type, thumbnail_url, video_url')
      .eq('album_id', albumId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (mediaError) {
      console.error('Errore caricamento media album:', mediaError.message)
      setMessage(`Errore caricamento media album: ${mediaError.message}`)
      setAlbum(albumData)
      setMedia([])
      setLoading(false)
      return
    }

    const signedMedia = await Promise.all(
      (mediaData ?? []).map(async (item) => ({
        ...item,
        signed_image_url: await getSignedUrlFromPublicUrl(item.image_url),
        signed_video_url: await getSignedUrlFromPublicUrl(item.video_url),
        signed_thumbnail_url: await getSignedUrlFromPublicUrl(item.thumbnail_url),
      }))
    )

    setAlbum(albumData)
    setMedia(signedMedia as GalleryMedia[])
    setLoading(false)
  }

  function showAccessDenied() {
    setAccessMessage(isPending ? 'La tua registrazione è in attesa di approvazione: puoi vedere le anteprime, ma non puoi aprire immagini, video o file.' : 'Puoi vedere le anteprime dell’album; accedi e attendi approvazione per ingrandire immagini/video o scaricare contenuti.')

    window.setTimeout(() => {
      setAccessMessage('')
    }, 5000)
  }

  function handleOpenMedia(item: GalleryMedia) {
    if (!canAccessMedia) {
      showAccessDenied()
      return
    }

    setActiveMedia(item)
  }

  function closeLightbox() {
    setActiveMedia(null)
  }

  function getPreviewUrl(item: GalleryMedia) {
    if (item.media_type === 'youtube') return item.thumbnail_url || item.image_url

    if (item.media_type === 'video') {
      return (
        item.signed_thumbnail_url ||
        item.thumbnail_url ||
        item.signed_video_url ||
        item.video_url ||
        item.signed_image_url ||
        item.image_url
      )
    }

    if (item.media_type === 'social') {
      return item.signed_thumbnail_url || item.thumbnail_url || item.image_url
    }

    return item.signed_image_url || item.image_url
  }

  function getFullMediaUrl(item: GalleryMedia) {
    if (item.media_type === 'video') {
      return item.signed_video_url || item.video_url || item.signed_image_url || item.image_url
    }

    return item.signed_image_url || item.image_url
  }

  function getYoutubeEmbedUrl(url: string) {
    const id = getYoutubeId(url)
    return id ? `https://www.youtube.com/embed/${id}` : null
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

  function formatAlbumDate(date: string | null, year: number | null) {
    if (date) {
      return new Date(date).toLocaleDateString('it-IT', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    }

    return year ? String(year) : ''
  }

  if (loading) {
    return (
      <main style={pageStyle}>
        <p style={mutedText}>Caricamento album...</p>
      </main>
    )
  }

  if (!album || message) {
    return (
      <main style={pageStyle}>
        <section style={heroStyle}>
          <p style={pageBadgeStyle}>Galleria</p>
          <h1 style={titleStyle}>Album non trovato</h1>
          {message && <div style={messageBoxStyle}>{message}</div>}
          <Link to="/galleria" style={loginButtonStyle}>
            Torna alla galleria
          </Link>
        </section>
      </main>
    )
  }

  return (
    <main style={pageStyle}>
      <section style={heroStyle}>
        <Link to="/galleria" style={backLinkStyle}>
          ← Torna alla galleria
        </Link>

        <p style={pageBadgeStyle}>{album.category || 'Galleria'}</p>

        <h1 style={titleStyle}>{album.title}</h1>

        <p style={introStyle}>
          {formatAlbumDate(album.event_date, album.event_year)} · {mediaCountLabel}
        </p>

        {album.description && <p style={descriptionStyle}>{album.description}</p>}

        {!canAccessMedia && (
          <div style={loginNoticeStyle}>
            <strong>{isPending ? 'Accesso in attesa di approvazione.' : 'Contenuti riservati agli utenti registrati.'}</strong>
            {isPending
              ? 'Puoi vedere le anteprime, ma non puoi aprire immagini, video e file finché l’accesso non viene approvato.'
              : 'Puoi vedere le anteprime, ma per aprire immagini, video e contenuti completi devi accedere.'}
            <Link to="/area-utente" style={loginButtonStyle}>
              {isPending ? 'Stato richiesta' : 'Accedi / Registrati'}
            </Link>
          </div>
        )}
      </section>

      {accessMessage && <div style={floatingMessageStyle}>{accessMessage}</div>}

      <section style={contentStyle}>
        <div style={toolbarStyle}>
          <div>
            <p style={sectionBadgeStyle}>Album</p>
            <h2 style={sectionTitleStyle}>Contenuti disponibili</h2>
          </div>

          <div style={filterBoxStyle}>
            <span style={filterLabelStyle}>Accesso</span>
            <span style={accessStatusStyle}>
              {canAccessMedia ? 'Utente autorizzato' : isPending ? 'In attesa di approvazione' : 'Anteprima pubblica'}
            </span>
          </div>
        </div>

        {media.length === 0 && (
          <div style={emptyBoxStyle}>Questo album non contiene ancora media.</div>
        )}

        {media.length > 0 && (
          <div style={mediaGridStyle}>
            {media.map((item) => (
              <article key={item.id} style={mediaCardStyle}>
                <button
                  type="button"
                  onClick={canAccessMedia ? () => handleOpenMedia(item) : undefined}
                  disabled={!canAccessMedia}
                  style={canAccessMedia ? previewButtonStyle : lockedPreviewButtonStyle}
                  aria-label={canAccessMedia ? (item.caption || 'Apri contenuto galleria') : 'Anteprima contenuto bloccata'}
                >
                  <div style={previewWrapStyle}>
                    {item.media_type === 'video' ? (
                      <>
                        <video
                          src={getPreviewUrl(item)}
                          muted
                          preload="metadata"
                          style={previewImageStyle}
                        />
                        <span style={playBadgeStyle} aria-hidden="true"><span style={playTriangleStyle} /></span>
                      </>
                    ) : item.media_type === 'youtube' ? (
                      <>
                        <img
                          src={getPreviewUrl(item)}
                          alt={item.caption || album.title}
                          loading="lazy"
                          style={previewImageStyle}
                        />
                        <span style={playBadgeStyle}>YT</span>
                      </>
                    ) : item.media_type === 'file' ? (
                      <div style={filePreviewStyle}>
                        <span style={{ fontSize: '24px', fontWeight: 950 }}>PDF</span>
                        {item.caption && (
                          <span style={{ fontSize: '12px', fontWeight: 800 }}>
                            {item.caption}
                          </span>
                        )}
                      </div>
                    ) : item.media_type === 'social' ? (
                      item.thumbnail_url || item.signed_thumbnail_url ? (
                        <img
                          src={getPreviewUrl(item)}
                          alt={item.caption || 'Social'}
                          loading="lazy"
                          style={previewImageStyle}
                        />
                      ) : (
                        <div style={filePreviewStyle}>
                          <span style={{ fontSize: '24px' }}>🔗</span>
                          {item.caption && (
                            <span style={{ fontSize: '12px', fontWeight: 800 }}>
                              {item.caption}
                            </span>
                          )}
                        </div>
                      )
                    ) : (
                      <img
                        src={getPreviewUrl(item)}
                        alt={item.caption || album.title}
                        loading="lazy"
                        style={previewImageStyle}
                      />
                    )}
                  </div>
                </button>
                {item.caption && (
                  <div style={mediaCardBodyStyle}>
                    <h3 style={mediaTitleStyle}>{item.caption}</h3>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {activeMedia && canAccessMedia && (
        <div style={lightboxStyle} onClick={closeLightbox}>
          <button type="button" style={closeButtonStyle} onClick={closeLightbox}>
            ×
          </button>

          <div style={lightboxInnerStyle} onClick={(event) => event.stopPropagation()}>
            {activeMedia.media_type === 'youtube' ? (
              (() => {
                const embedUrl = getYoutubeEmbedUrl(activeMedia.video_url || activeMedia.image_url)

                return embedUrl ? (
                  <iframe
                    src={embedUrl}
                    title={activeMedia.caption || 'Video YouTube'}
                    style={iframeStyle}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <a href={activeMedia.image_url} target="_blank" rel="noreferrer" style={loginButtonStyle}>
                    Apri contenuto
                  </a>
                )
              })()
            ) : activeMedia.media_type === 'video' ? (
              <video
                src={getFullMediaUrl(activeMedia)}
                style={lightboxMediaStyle}
                controls
                autoPlay
              />
            ) : activeMedia.media_type === 'file' || activeMedia.media_type === 'social' ? (
              <a href={activeMedia.image_url} target="_blank" rel="noreferrer" style={loginButtonStyle}>
                Apri contenuto
              </a>
            ) : (
              <img
                src={getFullMediaUrl(activeMedia)}
                alt={activeMedia.caption || album.title}
                style={lightboxMediaStyle}
              />
            )}

            {activeMedia.caption && (
              <p style={lightboxCaptionStyle}>{activeMedia.caption}</p>
            )}
          </div>
        </div>
      )}
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
  width: 'min(1180px, calc(100% - 8px))',
  margin: '0 auto 34px',
  display: 'grid',
  gap: '16px',
}

const backLinkStyle: CSSProperties = {
  color: '#d8d8d8',
  textDecoration: 'none',
  fontWeight: 900,
  width: 'fit-content',
}

const pageBadgeStyle: CSSProperties = dojoBadgeStyle

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 'clamp(48px, 8vw, 82px)',
  lineHeight: 0.98,
  fontWeight: 950,
}

const introStyle: CSSProperties = {
  margin: 0,
  maxWidth: '850px',
  color: '#d8d8d8',
  fontSize: '18px',
  lineHeight: 1.7,
}

const descriptionStyle: CSSProperties = {
  margin: 0,
  maxWidth: '850px',
  color: '#d8d8d8',
  fontSize: '16px',
  lineHeight: 1.7,
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
  border: 'none',
  cursor: 'pointer',
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

const contentStyle: CSSProperties = {
  width: 'min(1180px, calc(100% - 8px))',
  margin: '0 auto',
  display: 'grid',
  gap: '22px',
}

const toolbarStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
  gap: '18px',
  flexWrap: 'wrap',
  padding: '20px',
  borderRadius: '22px',
  background: 'linear-gradient(180deg, rgba(255,255,255,0.075), rgba(255,255,255,0.04))',
  border: '1px solid rgba(255,255,255,0.10)',
}

const sectionBadgeStyle: CSSProperties = {
  ...dojoBadgeStyle,
  margin: '0 0 10px',
}

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: '30px',
  fontWeight: 950,
}

const filterBoxStyle: CSSProperties = {
  display: 'grid',
  gap: '8px',
  minWidth: '200px',
}

const filterLabelStyle: CSSProperties = {
  color: '#d8d8d8',
  fontSize: '13px',
  fontWeight: 800,
}

const accessStatusStyle: CSSProperties = {
  padding: '10px 14px',
  borderRadius: '999px',
  background: 'rgba(255,255,255,0.08)',
  color: 'white',
  fontWeight: 900,
  border: '1px solid rgba(255,255,255,0.12)',
}

const mediaGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: '18px',
}

const mediaCardStyle: CSSProperties = {
  display: 'grid',
  overflow: 'hidden',
  borderRadius: '22px',
  background: 'linear-gradient(180deg, rgba(255,255,255,0.085), rgba(255,255,255,0.045))',
  border: '1px solid rgba(255,255,255,0.12)',
  boxShadow: '0 16px 36px rgba(0,0,0,0.32)',
}

const previewButtonStyle: CSSProperties = {
  border: 'none',
  padding: 0,
  background: 'transparent',
  cursor: 'pointer',
  textAlign: 'left',
}

const lockedPreviewButtonStyle: CSSProperties = {
  ...previewButtonStyle,
  cursor: 'default',
  opacity: 1,
}

const previewWrapStyle: CSSProperties = {
  position: 'relative',
  width: '100%',
  aspectRatio: '16 / 10',
  overflow: 'hidden',
  background: '#101827',
}

const previewImageStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
}

const playBadgeStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  margin: 'auto',
  width: '50px',
  height: '50px',
  borderRadius: '999px',
  background: 'rgba(2,8,23,0.74)',
  border: '1px solid rgba(255,255,255,0.22)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 16px 34px rgba(0,0,0,0.28)',
  pointerEvents: 'none',
}

const playTriangleStyle: CSSProperties = {
  width: 0,
  height: 0,
  marginLeft: '4px',
  borderTop: '11px solid transparent',
  borderBottom: '11px solid transparent',
  borderLeft: '17px solid #fff',
}

const filePreviewStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'grid',
  placeItems: 'center',
  gap: '8px',
  padding: '18px',
  textAlign: 'center',
  color: 'white',
  background: 'linear-gradient(135deg, rgba(185,68,79,0.26), rgba(255,255,255,0.10))',
}

const mediaCardBodyStyle: CSSProperties = {
  display: 'grid',
  gap: '14px',
  padding: '16px',
}

const mediaTitleStyle: CSSProperties = {
  margin: 0,
  color: 'white',
  fontSize: '18px',
  fontWeight: 950,
  lineHeight: 1.25,
}

const mutedText: CSSProperties = {
  color: '#d8d8d8',
  lineHeight: 1.6,
}

const emptyBoxStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.045)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '18px',
  padding: '22px',
  color: '#d8d8d8',
}

const messageBoxStyle: CSSProperties = {
  background: 'rgba(185,68,79,0.18)',
  border: '1px solid rgba(185,68,79,0.28)',
  padding: '14px 16px',
  borderRadius: '14px',
  color: '#f3dede',
}

const lightboxStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 9999,
  background: 'rgba(0,0,0,0.88)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
}

const closeButtonStyle: CSSProperties = {
  position: 'fixed',
  top: 20,
  right: 20,
  width: 46,
  height: 46,
  borderRadius: 999,
  border: '1px solid rgba(255,255,255,0.18)',
  background: 'rgba(15,23,42,0.9)',
  color: '#ffffff',
  fontSize: 30,
  cursor: 'pointer',
  zIndex: 10000,
}

const lightboxInnerStyle: CSSProperties = {
  maxWidth: 'min(1100px, 96vw)',
  maxHeight: '90vh',
  display: 'grid',
  gap: 14,
  justifyItems: 'center',
}

const lightboxMediaStyle: CSSProperties = {
  maxWidth: '100%',
  maxHeight: '82vh',
  objectFit: 'contain',
  borderRadius: 18,
  background: '#020817',
}

const iframeStyle: CSSProperties = {
  width: 'min(1000px, 92vw)',
  aspectRatio: '16 / 9',
  border: 'none',
  borderRadius: 18,
  background: '#020817',
}

const lightboxCaptionStyle: CSSProperties = {
  color: '#ffffff',
  margin: 0,
  textAlign: 'center',
  lineHeight: 1.6,
}

export default GalleriaAlbum
