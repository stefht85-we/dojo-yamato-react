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

        <section style={{ marginTop: '28px', marginBottom: '44px' }}>
          <p style={labelStyle}>Galleria</p>

          <h1 style={titleStyle}>Album {year}</h1>

          <p style={textStyle}>
            Scegli un album per visualizzare le foto degli eventi del {year}.
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
          <section style={albumGridStyle}>
            {albums.map((album) => (
              <Link
                key={album.id}
                to={`/galleria/album/${album.id}`}
                style={albumCardStyle}
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

                <div style={{ padding: '22px' }}>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {album.category && (
                      <span style={tagStyle}>{album.category}</span>
                    )}

                    <span style={tagStyle}>
                      {album.event_date
                        ? new Date(album.event_date).toLocaleDateString('it-IT')
                        : album.event_year}
                    </span>
                  </div>

                  <h2 style={{ margin: '16px 0 10px', fontSize: '24px' }}>
                    {album.title}
                  </h2>

                  {album.description && (
                    <p style={{ color: '#d8d8d8', lineHeight: 1.6 }}>
                      {album.description.length > 120
                        ? album.description.substring(0, 120) + '...'
                        : album.description}
                    </p>
                  )}

                  <span style={ctaStyle}>Apri album →</span>
                </div>
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
  fontSize: 'clamp(2.4rem, 6vw, 4.5rem)',
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

const albumGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '24px',
}

const albumCardStyle: React.CSSProperties = {
  display: 'block',
  overflow: 'hidden',
  textDecoration: 'none',
  color: 'white',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: '22px',
  boxShadow: '0 18px 50px rgba(0,0,0,0.20)',
}

const coverStyle: React.CSSProperties = {
  width: '100%',
  height: '230px',
  objectFit: 'cover',
  display: 'block',
}

const coverPlaceholderStyle: React.CSSProperties = {
  width: '100%',
  height: '230px',
  background: 'rgba(230,57,70,0.12)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '48px',
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

const ctaStyle: React.CSSProperties = {
  display: 'inline-block',
  marginTop: '12px',
  color: '#e63946',
  fontWeight: 800,
}

export default GalleriaAnno