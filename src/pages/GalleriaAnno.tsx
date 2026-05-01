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

function GalleriaAnno() {
  const { year } = useParams()
  const [albums, setAlbums] = useState<GalleryAlbum[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function loadAlbums() {
      setLoading(true)
      setMessage('')

      const numericYear = Number(year)

      if (!numericYear) {
        setMessage('Anno non valido.')
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('gallery_albums')
        .select(
          'id, title, description, category, event_date, event_year, cover_image_url, visible, created_at'
        )
        .eq('visible', true)
        .eq('event_year', numericYear)
        .order('event_date', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Errore caricamento album:', error)
        setMessage('Non è stato possibile caricare gli album.')
        setLoading(false)
        return
      }

      setAlbums(data ?? [])
      setLoading(false)
    }

    loadAlbums()
  }, [year])

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <Link to="/galleria" style={backLinkStyle}>
          ← Torna agli anni
        </Link>

        <section style={{ marginTop: '28px', marginBottom: '36px' }}>
          <p style={labelStyle}>Galleria</p>

          <h1 style={titleStyle}>Album {year}</h1>

          <p style={textStyle}>
            Album fotografici e video ordinati dal più recente al più vecchio.
          </p>
        </section>

        {loading && <p style={textStyle}>Caricamento album...</p>}

        {!loading && message && (
          <div style={emptyBoxStyle}>
            <p style={{ margin: 0 }}>{message}</p>
          </div>
        )}

        {!loading && !message && albums.length === 0 && (
          <div style={emptyBoxStyle}>
            <h2 style={{ marginTop: 0, color: 'white' }}>
              Nessun album disponibile
            </h2>
            <p style={{ marginBottom: 0 }}>
              Non ci sono ancora album pubblicati per questo anno.
            </p>
          </div>
        )}

        {!loading && !message && albums.length > 0 && (
          <section style={albumListStyle}>
            {albums.map((album) => (
              <Link
                key={album.id}
                to={`/galleria/album/${album.id}`}
                style={albumRowStyle}
              >
                {album.cover_image_url ? (
                  <img
                    src={album.cover_image_url}
                    alt={album.title}
                    style={coverStyle}
                  />
                ) : (
                  <div style={coverPlaceholderStyle}>🥋</div>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={albumTitleStyle}>{album.title}</h2>

                  <div style={metaRowStyle}>
                    {album.event_date && (
                      <span>
                        {new Date(album.event_date).toLocaleDateString('it-IT')}
                      </span>
                    )}

                    {!album.event_date && <span>{album.event_year}</span>}

                    {album.category && <span>{album.category}</span>}
                  </div>

                  {album.description && (
                    <p style={descriptionStyle}>
                      {album.description.length > 130
                        ? album.description.substring(0, 130) + '...'
                        : album.description}
                    </p>
                  )}
                </div>

                <span style={ctaStyle}>Apri →</span>
              </Link>
            ))}
          </section>
        )}
      </div>
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
  maxWidth: '1000px',
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
  fontSize: 'clamp(2.4rem, 6vw, 4.2rem)',
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

const emptyBoxStyle: React.CSSProperties = {
  marginTop: '36px',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: '18px',
  padding: '28px',
  color: '#d8d8d8',
}

const albumListStyle: React.CSSProperties = {
  display: 'grid',
  gap: '14px',
}

const albumRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  textDecoration: 'none',
  color: 'white',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: '18px',
  padding: '14px',
  boxShadow: '0 14px 35px rgba(0,0,0,0.16)',
}

const coverStyle: React.CSSProperties = {
  width: '92px',
  height: '72px',
  objectFit: 'cover',
  borderRadius: '12px',
  flexShrink: 0,
}

const coverPlaceholderStyle: React.CSSProperties = {
  width: '92px',
  height: '72px',
  borderRadius: '12px',
  background: 'rgba(230,57,70,0.16)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '28px',
  flexShrink: 0,
}

const albumTitleStyle: React.CSSProperties = {
  margin: '0 0 6px',
  fontSize: '20px',
  lineHeight: 1.25,
}

const metaRowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
  color: '#ffd7d7',
  fontSize: '13px',
  fontWeight: 700,
}

const descriptionStyle: React.CSSProperties = {
  margin: '8px 0 0',
  color: '#d8d8d8',
  lineHeight: 1.5,
  fontSize: '14px',
}

const ctaStyle: React.CSSProperties = {
  color: '#e63946',
  fontWeight: 900,
  whiteSpace: 'nowrap',
}

export default GalleriaAnno