import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
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

function Galleria() {
  const [albums, setAlbums] = useState<GalleryAlbum[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [selectedYear, setSelectedYear] = useState<number | null>(null)

  useEffect(() => {
    loadAlbums()
  }, [])

  async function loadAlbums() {
    setLoading(true)
    setMessage('')

    const { data, error } = await supabase
      .from('gallery_albums')
      .select(
        'id, title, description, category, event_date, event_year, cover_image_url, visible, created_at'
      )
      .eq('visible', true)
      .order('event_year', { ascending: false })
      .order('event_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Errore caricamento galleria:', error)
      setMessage('Errore durante il caricamento della galleria.')
      setLoading(false)
      return
    }

    setAlbums(data ?? [])
    setLoading(false)
  }

  const years = useMemo(() => {
    return Array.from(new Set(albums.map((album) => album.event_year))).sort(
      (a, b) => b - a
    )
  }, [albums])

  const albumsByYear = useMemo(() => {
    return years.reduce<Record<number, GalleryAlbum[]>>((acc, year) => {
      acc[year] = albums
        .filter((album) => album.event_year === year)
        .sort((a, b) => {
          const dateA = a.event_date
            ? new Date(a.event_date).getTime()
            : new Date(a.created_at).getTime()

          const dateB = b.event_date
            ? new Date(b.event_date).getTime()
            : new Date(b.created_at).getTime()

          return dateB - dateA
        })

      return acc
    }, {})
  }, [albums, years])

  function formatAlbumDate(album: GalleryAlbum) {
    if (album.event_date) {
      return new Date(album.event_date).toLocaleDateString('it-IT', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    }

    return String(album.event_year)
  }

  return (
    <main style={pageStyle}>
      <section style={heroStyle}>
        <div style={containerStyle}>
          <p style={labelStyle}>Galleria</p>

          <h1 style={titleStyle}>Album fotografici</h1>

          <p style={introTextStyle}>
            Le immagini e i ricordi del Dojo Yamato raccolti per anno: eventi,
            allenamenti, gare, esami e momenti importanti della nostra
            associazione.
          </p>
        </div>
      </section>

      <section style={contentStyle}>
        <div style={containerStyle}>
          {loading && <p style={mutedTextStyle}>Caricamento galleria...</p>}

          {!loading && message && <div style={messageBoxStyle}>{message}</div>}

          {!loading && !message && albums.length === 0 && (
            <div style={emptyBoxStyle}>
              Non ci sono ancora album pubblicati in galleria.
            </div>
          )}

          {!loading && !message && albums.length > 0 && (
            <>
              <div style={yearsGridStyle}>
                {years.map((year) => {
                  const isActive = selectedYear === year

                  return (
                    <button
                      key={year}
                      type="button"
                      style={{
                        ...yearButtonStyle,
                        background: isActive
                          ? 'rgba(185,68,79,0.14)'
                          : 'rgba(255,255,255,0.035)',
                        border: isActive
                          ? '1px solid rgba(185,68,79,0.42)'
                          : '1px solid rgba(255,255,255,0.08)',
                      }}
                      onClick={() =>
                        setSelectedYear(selectedYear === year ? null : year)
                      }
                    >
                      <span style={yearBadgeStyle}>{year}</span>

                      <span style={yearMetaStyle}>
                        {albumsByYear[year]?.length ?? 0} album
                      </span>
                    </button>
                  )
                })}
              </div>

              {selectedYear && (
                <section style={selectedYearSectionStyle}>
                  <div style={selectedYearHeaderStyle}>
                    <h2 style={sectionTitleStyle}>Album {selectedYear}</h2>

                    <span style={sectionCountStyle}>
                      {albumsByYear[selectedYear]?.length ?? 0} album
                    </span>
                  </div>

                  <div style={albumListStyle}>
                    {albumsByYear[selectedYear]?.map((album) => (
                      <Link
                        key={album.id}
                        to={`/galleria/${album.id}`}
                        style={albumRowStyle}
                      >
                        <div style={{ minWidth: 0 }}>
                          <h3 style={albumTitleBadgeStyle}>{album.title}</h3>

                          <p style={albumMetaStyle}>
                            {formatAlbumDate(album)}
                            {album.category ? ` · ${album.category}` : ''}
                          </p>
                        </div>

                        <span style={openAlbumStyle}>Apri</span>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </section>
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

const labelStyle: CSSProperties = {
  color: '#d95b64',
  fontWeight: 900,
  letterSpacing: '2px',
  textTransform: 'uppercase',
  fontSize: '12px',
  marginBottom: '8px',
}

const titleStyle: CSSProperties = {
  fontSize: 'clamp(2.2rem, 6vw, 4.4rem)',
  lineHeight: 1.02,
  margin: 0,
  letterSpacing: '-0.7px',
}

const introTextStyle: CSSProperties = {
  maxWidth: '860px',
  color: '#d7dbe3',
  fontSize: '16px',
  lineHeight: 1.7,
  marginTop: '16px',
}

const contentStyle: CSSProperties = {
  padding: '18px 0 72px',
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

const yearsGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
  gap: '12px',
  marginBottom: '24px',
}

const yearButtonStyle: CSSProperties = {
  cursor: 'pointer',
  borderRadius: '18px',
  padding: '15px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: '8px',
  textAlign: 'left',
}

const yearBadgeStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  width: 'fit-content',
  padding: '8px 17px',
  borderRadius: '999px',
  background: 'linear-gradient(180deg, #b9444f 0%, #82232b 100%)',
  color: 'white',
  fontSize: 'clamp(19px, 3vw, 26px)',
  lineHeight: 1.12,
  fontWeight: 850,
  boxShadow: '0 8px 18px rgba(80,10,18,0.24)',
}

const yearMetaStyle: CSSProperties = {
  color: '#d7dbe3',
  fontSize: '13px',
  fontWeight: 800,
}

const selectedYearSectionStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.035)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '20px',
  padding: '18px',
}

const selectedYearHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '14px',
  flexWrap: 'wrap',
  marginBottom: '14px',
}

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 'clamp(1.4rem, 3vw, 2rem)',
  lineHeight: 1.15,
}

const sectionCountStyle: CSSProperties = {
  color: '#d7dbe3',
  fontSize: '13px',
  fontWeight: 800,
}

const albumListStyle: CSSProperties = {
  display: 'grid',
  gap: '10px',
}

const albumRowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '14px',
  textDecoration: 'none',
  color: 'white',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
  padding: '12px',
}

const albumTitleBadgeStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  width: 'fit-content',
  maxWidth: '100%',
  margin: '0 0 7px',
  padding: '7px 14px',
  borderRadius: '999px',
  background: 'linear-gradient(180deg, #b9444f 0%, #82232b 100%)',
  color: 'white',
  fontSize: 'clamp(13px, 1.7vw, 16px)',
  lineHeight: 1.18,
  fontWeight: 800,
  boxShadow: '0 8px 18px rgba(80,10,18,0.20)',
}

const albumMetaStyle: CSSProperties = {
  margin: 0,
  color: '#d7dbe3',
  fontSize: '13px',
  fontWeight: 700,
  lineHeight: 1.4,
}

const openAlbumStyle: CSSProperties = {
  flexShrink: 0,
  background: 'rgba(255,255,255,0.90)',
  color: '#111',
  borderRadius: '999px',
  padding: '8px 12px',
  fontSize: '12px',
  fontWeight: 900,
}

export default Galleria