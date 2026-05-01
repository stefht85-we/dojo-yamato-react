import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

type AlbumYear = {
  event_year: number
}

function Galleria() {
  const [years, setYears] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function loadYears() {
      setLoading(true)
      setMessage('')

      const { data, error } = await supabase
        .from('gallery_albums')
        .select('event_year')
        .eq('visible', true)
        .order('event_year', { ascending: false })

      if (error) {
        console.error('Errore caricamento anni galleria:', error)
        setMessage('Non è stato possibile caricare la galleria.')
        setLoading(false)
        return
      }

      const uniqueYears = Array.from(
        new Set((data as AlbumYear[]).map((item) => item.event_year))
      ).sort((a, b) => b - a)

      setYears(uniqueYears)
      setLoading(false)
    }

    loadYears()
  }, [])

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <section style={{ marginBottom: '44px' }}>
          <p style={labelStyle}>Bacheca</p>

          <h1 style={titleStyle}>Galleria</h1>

          <p style={textStyle}>
            Sfoglia le foto e i video del Dojo Yamato organizzati per anno,
            evento e album.
          </p>
        </section>

        {loading && <p style={textStyle}>Caricamento galleria...</p>}

        {!loading && message && (
          <div style={emptyBoxStyle}>
            <p style={{ margin: 0 }}>{message}</p>
          </div>
        )}

        {!loading && !message && years.length === 0 && (
          <div style={emptyBoxStyle}>
            <h2 style={{ marginTop: 0, color: 'white' }}>
              Nessun album disponibile
            </h2>

            <p style={{ marginBottom: 0 }}>
              Gli album fotografici saranno pubblicati prossimamente.
            </p>
          </div>
        )}

        {!loading && !message && years.length > 0 && (
          <section style={yearGridStyle}>
            {years.map((year) => (
              <Link key={year} to={`/galleria/${year}`} style={yearCardStyle}>
                <div style={folderIconStyle}>📁</div>

                <div>
                  <h2 style={{ margin: '0 0 8px', fontSize: '32px' }}>
                    {year}
                  </h2>

                  <p style={{ margin: 0, color: '#d8d8d8' }}>
                    Apri gli album fotografici del {year}
                  </p>
                </div>

                <span style={ctaStyle}>Apri anno →</span>
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

const yearGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: '24px',
}

const yearCardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  textDecoration: 'none',
  color: 'white',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: '22px',
  padding: '28px',
  minHeight: '230px',
  boxShadow: '0 18px 50px rgba(0,0,0,0.20)',
}

const folderIconStyle: React.CSSProperties = {
  width: '58px',
  height: '58px',
  borderRadius: '18px',
  background: 'rgba(230,57,70,0.18)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '30px',
  marginBottom: '22px',
}

const ctaStyle: React.CSSProperties = {
  marginTop: '24px',
  color: '#e63946',
  fontWeight: 800,
}

export default Galleria