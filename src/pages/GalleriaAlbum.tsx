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

type GalleryPhoto = {
  id: string
  album_id: string
  image_url: string
  caption: string | null
  sort_order: number
  created_at: string
}

function GalleriaAlbum() {
  const { albumId } = useParams()
  const [album, setAlbum] = useState<GalleryAlbum | null>(null)
  const [photos, setPhotos] = useState<GalleryPhoto[]>([])
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

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

      const { data: photosData, error: photosError } = await supabase
        .from('gallery_photos')
        .select('id, album_id, image_url, caption, sort_order, created_at')
        .eq('album_id', albumId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })

      if (photosError) {
        console.error('Errore caricamento foto:', photosError)
        setMessage('Non è stato possibile caricare le foto dell’album.')
        setLoading(false)
        return
      }

      setAlbum(albumData)
      setPhotos(photosData ?? [])
      setLoading(false)
    }

    loadAlbum()
  }, [albumId])

  function closeLightbox() {
    setSelectedPhoto(null)
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

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '20px' }}>
                {album.category && <span style={tagStyle}>{album.category}</span>}

                <span style={tagStyle}>
                  {album.event_date
                    ? new Date(album.event_date).toLocaleDateString('it-IT')
                    : album.event_year}
                </span>
              </div>

              {album.description && (
                <p style={textStyle}>{album.description}</p>
              )}
            </section>

            {photos.length === 0 && (
              <div style={emptyBoxStyle}>
                <h2 style={{ marginTop: 0, color: 'white' }}>
                  Nessuna foto disponibile
                </h2>
                <p style={{ marginBottom: 0 }}>
                  Le foto di questo album saranno caricate prossimamente.
                </p>
              </div>
            )}

            {photos.length > 0 && (
              <section style={photoGridStyle}>
                {photos.map((photo) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => setSelectedPhoto(photo)}
                    style={photoButtonStyle}
                  >
                    <img
                      src={photo.image_url}
                      alt={photo.caption || album.title}
                      style={photoStyle}
                    />

                    {photo.caption && (
                      <span style={captionStyle}>{photo.caption}</span>
                    )}
                  </button>
                ))}
              </section>
            )}
          </>
        )}
      </div>

      {selectedPhoto && (
        <div style={lightboxOverlayStyle} onClick={closeLightbox}>
          <button type="button" onClick={closeLightbox} style={closeButtonStyle}>
            ×
          </button>

          <div style={lightboxContentStyle} onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedPhoto.image_url}
              alt={selectedPhoto.caption || album?.title || 'Foto galleria'}
              style={lightboxImageStyle}
            />

            {selectedPhoto.caption && (
              <p style={lightboxCaptionStyle}>{selectedPhoto.caption}</p>
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

const photoGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '18px',
}

const photoButtonStyle: React.CSSProperties = {
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  background: 'rgba(255,255,255,0.06)',
  borderRadius: '18px',
  overflow: 'hidden',
  textAlign: 'left',
  color: 'white',
}

const photoStyle: React.CSSProperties = {
  width: '100%',
  height: '240px',
  objectFit: 'cover',
  display: 'block',
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
  background: 'rgba(0,0,0,0.88)',
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

export default GalleriaAlbum