import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
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
  signed_cover_url?: string | null
}

export default function Galleria() {
  const [albums, setAlbums] = useState<GalleryAlbum[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState<string | null>(null)
  const [accessMessage, setAccessMessage] = useState('')
  const { canOpenRestrictedContent, isPending } = useAccessStatus()

  useEffect(() => {
    loadAlbums()
  }, [])

  async function loadAlbums() {
    setLoading(true)

    const { data, error } = await supabase
      .from('gallery_albums')
      .select('id, title, description, category, event_date, event_year, cover_image_url, visible, created_at')
      .eq('visible', true)
      .order('event_year', { ascending: false })
      .order('event_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Errore caricamento galleria:', error)
      setAlbums([])
      setLoading(false)
      return
    }

    const albumsWithSignedCovers = await Promise.all(
      (data || []).map(async (album) => ({
        ...album,
        signed_cover_url: await getSignedUrlFromPublicUrl(album.cover_image_url),
      }))
    )

    setAlbums(albumsWithSignedCovers)

    const firstYear = albumsWithSignedCovers[0]?.event_year
    if (firstYear) setSelectedYear(String(firstYear))

    setLoading(false)
  }

  const albumsByYear = useMemo(() => {
    const grouped: Record<string, GalleryAlbum[]> = {}

    albums.forEach((album) => {
      const year = String(album.event_year || 'Senza anno')
      if (!grouped[year]) grouped[year] = []
      grouped[year].push(album)
    })

    return grouped
  }, [albums])

  const years = useMemo(() => {
    return Object.keys(albumsByYear).sort((a, b) => Number(b) - Number(a))
  }, [albumsByYear])

  const selectedAlbums = selectedYear ? albumsByYear[selectedYear] || [] : []

  function showAccessDenied() {
    setAccessMessage(isPending ? 'La tua registrazione è in attesa di approvazione: puoi vedere gli album, ma non puoi aprirli finché l’accesso non viene approvato.' : 'Puoi vedere gli album disponibili, ma per aprirli devi registrarti ed essere approvato.')

    window.setTimeout(() => {
      setAccessMessage('')
    }, 5000)
  }

  function renderAlbumCard(album: GalleryAlbum) {
    const cardContent = (
      <>
        <div style={styles.albumCoverWrap}>
          {album.signed_cover_url ? (
            <img
              src={album.signed_cover_url}
              alt={album.title}
              loading="lazy"
              style={styles.albumCover}
            />
          ) : (
            <div style={styles.albumCoverFallback}>📷</div>
          )}
        </div>

        <div style={styles.albumBody}>
          <p style={styles.albumDate}>
            {formatAlbumDate(album.event_date, album.event_year)}
          </p>

          <h3 style={styles.albumTitle}>{album.title}</h3>

          {album.description && (
            <p style={styles.albumDescription}>
              {album.description.length > 110
                ? `${album.description.slice(0, 110)}...`
                : album.description}
            </p>
          )}

          {album.category && (
            <span style={styles.categoryBadge}>{album.category}</span>
          )}

          {!canOpenRestrictedContent && (
            <p style={styles.lockedHint}>{isPending ? 'In attesa di approvazione: anteprime visibili, apertura contenuti bloccata.' : 'Anteprime visibili: accedi e attendi approvazione per aprire o scaricare.'}</p>
          )}
        </div>
      </>
    )

    return (
      <Link
        key={album.id}
        to={`/galleria/${album.id}`}
        style={canOpenRestrictedContent ? styles.albumCard : { ...styles.albumCard, ...styles.previewAlbumCard }}
      >
        {cardContent}
      </Link>
    )
  }

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <div style={styles.heroInner}>
          <p style={styles.kicker}>Galleria</p>
          <h1 style={styles.title}>Momenti dal Dojo</h1>
          <p style={styles.subtitle}>
            Foto, video ed eventi del Dojo Yamato raccolti per anno.
          </p>
        </div>
      </section>

      <section style={styles.content}>
        {loading ? (
          <p style={styles.empty}>Caricamento galleria...</p>
        ) : albums.length === 0 ? (
          <p style={styles.empty}>Nessun album disponibile al momento.</p>
        ) : (
          <>
            <div style={styles.yearMenuCard}>
              <div style={styles.yearMenuHeader}>
                <div>
                  <p style={styles.kickerSmall}>Archivio fotografico</p>
                  <h2 style={styles.yearMenuTitle}>Scegli un anno</h2>
                </div>

                {selectedYear && (
                  <span style={styles.selectedYearPill}>
                    {selectedYear} · {selectedAlbums.length}{' '}
                    {selectedAlbums.length === 1 ? 'album' : 'album'}
                  </span>
                )}
              </div>

              <div style={styles.yearMenu}>
                {years.map((year) => {
                  const isActive = selectedYear === year
                  const count = albumsByYear[year]?.length || 0
                  const cover = albumsByYear[year]?.find((album) => album.signed_cover_url)?.signed_cover_url

                  return (
                    <button
                      key={year}
                      type="button"
                      onClick={() => setSelectedYear(year)}
                      style={{
                        ...styles.yearButton,
                        ...(isActive ? styles.yearButtonActive : {}),
                      }}
                    >
                      <span style={styles.yearButtonPreview}>
                        {cover ? (
                          <img
                            src={cover}
                            alt={`Anteprima ${year}`}
                            loading="lazy"
                            style={styles.yearButtonImage}
                          />
                        ) : (
                          <span style={styles.yearButtonPlaceholder}>📷</span>
                        )}
                      </span>

                      <span style={styles.yearButtonText}>
                        <strong
                          style={{
                            ...styles.yearNumber,
                            ...(isActive ? styles.yearNumberActive : {}),
                          }}
                        >
                          {year}
                        </strong>

                        <small style={styles.yearAlbumCount}>
                          {count} {count === 1 ? 'album' : 'album'}
                        </small>
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {selectedYear && (
              <div style={styles.selectedYearSection}>
                <div style={styles.sectionHeader}>
                  <p style={styles.kicker}>Anno {selectedYear}</p>
                  <h2 style={styles.sectionTitle}>Album disponibili</h2>
                  <p style={styles.sectionSubtitle}>
                    {canOpenRestrictedContent ? 'Clicca su un album per visualizzare tutte le foto e i contenuti.' : isPending ? 'Puoi entrare negli album e vedere le anteprime; apertura, ingrandimento e download restano bloccati fino all’approvazione.' : 'Puoi entrare negli album e vedere le anteprime; per aprire, ingrandire o scaricare devi registrarti ed essere approvato.'}
                  </p>
                </div>

                {selectedAlbums.length === 0 ? (
                  <p style={styles.empty}>Nessun album disponibile per questo anno.</p>
                ) : (
                  <div style={styles.albumGrid}>
                    {selectedAlbums.map((album) => renderAlbumCard(album))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </section>

      {accessMessage && <div style={styles.floatingMessage}>{accessMessage}</div>}
    </main>
  )
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

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: '100vh',
    background:
      'radial-gradient(circle at top left, rgba(185,68,79,0.18), transparent 32%), #020817',
    color: '#ffffff',
  },
  hero: {
    padding: '130px 24px 70px',
    background:
      'linear-gradient(135deg, rgba(2,8,23,0.98), rgba(16,24,39,0.96))',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  heroInner: {
    width: '100%',
    maxWidth: 1180,
    margin: '0 auto',
    textAlign: 'center',
  },
  kicker: {
    color: '#b9444f',
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontSize: 13,
    fontWeight: 800,
    margin: '0 0 12px',
  },
  kickerSmall: {
    color: '#b9444f',
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontSize: 12,
    fontWeight: 800,
    margin: '0 0 7px',
  },
  title: {
    fontSize: 'clamp(2.5rem, 5vw, 4.8rem)',
    lineHeight: 1,
    margin: '0 0 20px',
    letterSpacing: '-0.05em',
  },
  subtitle: {
    maxWidth: 720,
    margin: '0 auto',
    color: '#cbd5e1',
    fontSize: 'clamp(1rem, 2vw, 1.2rem)',
    lineHeight: 1.7,
  },
  content: {
    width: '100%',
    maxWidth: 1180,
    margin: '0 auto',
    padding: '70px 24px 100px',
  },
  yearMenuCard: {
    padding: 22,
    borderRadius: 26,
    background: 'rgba(15,23,42,0.86)',
    border: '1px solid rgba(255,255,255,0.09)',
    boxShadow: '0 18px 45px rgba(0,0,0,0.28)',
    marginBottom: 46,
  },
  yearMenuHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 18,
    flexWrap: 'wrap',
    marginBottom: 18,
  },
  yearMenuTitle: {
    margin: 0,
    fontSize: 'clamp(1.6rem, 3vw, 2.4rem)',
    letterSpacing: '-0.03em',
  },
  selectedYearPill: {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: 36,
    padding: '0 14px',
    borderRadius: 999,
    background: 'linear-gradient(135deg, #b9444f, #82232b)',
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 900,
    boxShadow: '0 10px 24px rgba(185,68,79,0.28)',
  },
  yearMenu: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(132px, 1fr))',
    gap: 10,
  },
  yearButton: {
    minHeight: 66,
    padding: 8,
    borderRadius: 18,
    border: '1px solid rgba(255,255,255,0.10)',
    background: 'rgba(2,8,23,0.62)',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s ease',
  },
  yearButtonActive: {
    border: '1px solid rgba(185,68,79,0.82)',
    background: 'rgba(185,68,79,0.20)',
    boxShadow: '0 12px 26px rgba(0,0,0,0.24)',
  },
  yearButtonPreview: {
    width: 42,
    height: 38,
    borderRadius: 11,
    overflow: 'hidden',
    background: 'rgba(185,68,79,0.16)',
    border: '1px solid rgba(255,255,255,0.10)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  yearButtonImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  yearButtonPlaceholder: {
    fontSize: 17,
  },
  yearButtonText: {
    display: 'grid',
    gap: 1,
  },
  yearNumber: {
    color: '#d94a57',
    fontSize: 26,
    lineHeight: 1,
    letterSpacing: '-0.04em',
    fontWeight: 950,
  },
  yearNumberActive: {
    color: '#ff6b78',
    textShadow: '0 0 18px rgba(217,74,87,0.28)',
  },
  yearAlbumCount: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: 800,
  },
  selectedYearSection: {
    marginTop: 8,
  },
  sectionHeader: {
    textAlign: 'center',
    marginBottom: 34,
  },
  sectionTitle: {
    fontSize: 'clamp(2rem, 4vw, 3rem)',
    margin: '0 0 14px',
    color: '#ffffff',
    letterSpacing: '-0.03em',
  },
  sectionSubtitle: {
    maxWidth: 680,
    margin: '0 auto',
    color: '#cbd5e1',
    lineHeight: 1.7,
  },
  albumGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: 18,
  },
  albumCard: {
    background: 'rgba(15,23,42,0.86)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 20,
    overflow: 'hidden',
    textDecoration: 'none',
    color: 'inherit',
    transition: 'transform 0.2s ease, border-color 0.2s ease',
    boxShadow: '0 16px 35px rgba(0,0,0,0.22)',
  },
  albumCoverWrap: {
    width: '100%',
    aspectRatio: '16 / 10',
    background: '#101827',
    overflow: 'hidden',
  },
  albumCover: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  albumCoverFallback: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 34,
    background: 'rgba(185,68,79,0.12)',
  },
  albumBody: {
    padding: 18,
  },
  albumDate: {
    color: '#b9444f',
    fontSize: 13,
    fontWeight: 800,
    margin: '0 0 8px',
  },
  albumTitle: {
    margin: '0 0 10px',
    fontSize: 20,
    color: '#ffffff',
    lineHeight: 1.25,
  },
  albumDescription: {
    color: '#cbd5e1',
    lineHeight: 1.6,
    fontSize: 14,
    margin: '0 0 12px',
  },
  categoryBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: 28,
    padding: '0 10px',
    borderRadius: 999,
    color: '#ffffff',
    background: 'rgba(185,68,79,0.22)',
    border: '1px solid rgba(185,68,79,0.35)',
    fontSize: 12,
    fontWeight: 800,
  },
  previewAlbumCard: {
    opacity: 0.95,
    cursor: 'pointer',
  },
  lockedHint: {
    margin: '12px 0 0',
    color: '#f3dede',
    fontSize: 13,
    fontWeight: 800,
  },
  floatingMessage: {
    position: 'fixed',
    left: '50%',
    bottom: 24,
    transform: 'translateX(-50%)',
    zIndex: 1001,
    width: 'min(560px, calc(100% - 32px))',
    padding: '14px 16px',
    borderRadius: 16,
    background: 'rgba(185,68,79,0.95)',
    color: 'white',
    fontWeight: 800,
    boxShadow: '0 18px 40px rgba(0,0,0,0.36)',
  },
  empty: {
    color: '#cbd5e1',
    textAlign: 'center',
  },
}
