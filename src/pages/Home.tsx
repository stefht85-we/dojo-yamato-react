import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { getSignedUrlFromPublicUrl } from '../lib/storageSignedUrl'
import PublicNews from '../components/PublicNews'

type GalleryAlbum = {
  id: string
  title: string
  description: string | null
  event_date: string | null
  event_year: number | null
  cover_image_url: string | null
  signed_cover_url?: string | null
}

export default function Home() {
  const [albums, setAlbums] = useState<GalleryAlbum[]>([])
  const [loadingAlbums, setLoadingAlbums] = useState(true)

  useEffect(() => {
    loadGalleryPreview()
  }, [])

  async function loadGalleryPreview() {
    setLoadingAlbums(true)

    const { data, error } = await supabase
      .from('gallery_albums')
      .select('id, title, description, event_date, event_year, cover_image_url')
      .eq('visible', true)
      .order('event_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(3)

    if (error) {
      console.error('Errore caricamento anteprima galleria:', error)
      setAlbums([])
      setLoadingAlbums(false)
      return
    }

    const albumsWithSignedCover = await Promise.all(
      (data || []).map(async (album) => ({
        ...album,
        signed_cover_url: await getSignedUrlFromPublicUrl(album.cover_image_url),
      }))
    )

    setAlbums(albumsWithSignedCover)
    setLoadingAlbums(false)
  }

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <div style={styles.heroOverlay} />

        <div style={styles.heroContent}>
          <p style={styles.kicker}>A.S.D. Dojo Yamato Arti Marziali</p>

          <h1 style={styles.heroTitle}>
            Karate tradizionale per bambini, ragazzi e adulti
          </h1>

          <p style={styles.heroSubtitle}>
            Disciplina, rispetto e crescita attraverso il Karate Shotokan.
            Non solo sport. Un percorso di vita.
          </p>

          <div style={styles.heroActions}>
            <Link to="/contatti" style={styles.primaryButton}>
              Vieni a provare una lezione gratuita
            </Link>

            <Link to="/corsi" style={styles.secondaryButton}>
              Scopri corsi e orari
            </Link>
          </div>
        </div>
      </section>

      <section style={styles.section}>
        <PublicNews limit={3} compact />
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <p style={styles.kicker}>Galleria</p>
          <h2 style={styles.sectionTitle}>Momenti dal dojo</h2>
          <p style={styles.sectionSubtitle}>
            Alcuni momenti di allenamento, eventi, esami e attività del nostro dojo.
          </p>
        </div>

        {loadingAlbums ? (
          <p style={styles.loading}>Caricamento galleria...</p>
        ) : albums.length === 0 ? (
          <p style={styles.loading}>Nessun album disponibile al momento.</p>
        ) : (
          <div style={styles.galleryGrid}>
            {albums.map((album) => (
              <Link
                key={album.id}
                to={`/galleria/${album.id}`}
                style={styles.galleryCard}
              >
                {album.signed_cover_url && (
                  <div style={styles.galleryImageWrap}>
                    <img
                      src={album.signed_cover_url}
                      alt={album.title}
                      loading="lazy"
                      style={styles.galleryImage}
                    />
                  </div>
                )}

                <div style={styles.galleryBody}>
                  <p style={styles.galleryDate}>
                    {formatAlbumDate(album.event_date, album.event_year)}
                  </p>

                  <h3 style={styles.galleryTitle}>{album.title}</h3>

                  {album.description && (
                    <p style={styles.galleryDescription}>
                      {album.description.length > 100
                        ? `${album.description.slice(0, 100)}...`
                        : album.description}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        <div style={styles.centerButtonWrap}>
          <Link to="/galleria" style={styles.secondaryButton}>
            Vai alla galleria
          </Link>
        </div>
      </section>

      <section style={styles.aboutSection}>
        <div style={styles.aboutCard}>
          <p style={styles.kicker}>Chi siamo</p>

          <h2 style={styles.sectionTitle}>Una scuola di Karate, prima di tutto educativa</h2>

          <p style={styles.text}>
            Il Dojo Yamato nasce con l’obiettivo di trasmettere il Karate Shotokan
            come disciplina marziale, sportiva ed educativa. Ogni allenamento è un
            percorso fatto di rispetto, impegno, autocontrollo e crescita personale.
          </p>

          <Link to="/chi-siamo" style={styles.primaryButton}>
            Scopri il dojo
          </Link>
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <p style={styles.kicker}>Corsi</p>
          <h2 style={styles.sectionTitle}>Karate per ogni età</h2>
          <p style={styles.sectionSubtitle}>
            Corsi dedicati a bambini, ragazzi e adulti, con percorsi adatti al livello
            e all’età degli allievi.
          </p>
        </div>

        <div style={styles.courseGrid}>
          <div style={styles.infoCard}>
            <h3 style={styles.infoTitle}>Bambini e ragazzi</h3>
            <p style={styles.text}>
              Un percorso educativo per migliorare coordinazione, concentrazione,
              rispetto delle regole e fiducia in sé stessi.
            </p>
          </div>

          <div style={styles.infoCard}>
            <h3 style={styles.infoTitle}>Adulti</h3>
            <p style={styles.text}>
              Allenamenti tecnici e fisici per sviluppare controllo, postura,
              resistenza e consapevolezza del corpo.
            </p>
          </div>

          <div style={styles.infoCard}>
            <h3 style={styles.infoTitle}>Competizioni</h3>
            <p style={styles.text}>
              La competizione è proposta come strumento educativo, mai come obbligo,
              per imparare a gestire emozioni, confronto e rispetto.
            </p>
          </div>
        </div>

        <div style={styles.centerButtonWrap}>
          <Link to="/corsi" style={styles.primaryButton}>
            Scopri tutti i corsi
          </Link>
        </div>
      </section>

      <section style={styles.cta}>
        <h2 style={styles.ctaTitle}>Vuoi provare una lezione?</h2>
        <p style={styles.ctaText}>
          Contattaci per informazioni sui corsi, gli orari e le sedi del Dojo Yamato.
        </p>

        <Link to="/contatti" style={styles.primaryButton}>
          Contattaci
        </Link>
      </section>
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

const styles: Record<string, React.CSSProperties> = {
  page: {
    background: '#020817',
    minHeight: '100vh',
    color: '#ffffff',
  },
  hero: {
    position: 'relative',
    minHeight: '82vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '120px 24px 80px',
    backgroundImage: 'url("/images/hero-dojo.jpg")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    overflow: 'hidden',
  },
  heroOverlay: {
    position: 'absolute',
    inset: 0,
    background:
      'linear-gradient(90deg, rgba(2,8,23,0.96), rgba(2,8,23,0.72), rgba(2,8,23,0.36))',
  },
  heroContent: {
    position: 'relative',
    zIndex: 2,
    width: '100%',
    maxWidth: 1180,
  },
  kicker: {
    color: '#b9444f',
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontSize: 13,
    fontWeight: 800,
    margin: '0 0 12px',
  },
  heroTitle: {
    maxWidth: 820,
    fontSize: 'clamp(2.6rem, 6vw, 5.8rem)',
    lineHeight: 1,
    margin: '0 0 24px',
    letterSpacing: '-0.05em',
  },
  heroSubtitle: {
    maxWidth: 660,
    color: '#dbe4ef',
    fontSize: 'clamp(1.05rem, 2vw, 1.35rem)',
    lineHeight: 1.7,
    margin: '0 0 34px',
  },
  heroActions: {
    display: 'flex',
    gap: 14,
    flexWrap: 'wrap',
  },
  primaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    padding: '0 22px',
    borderRadius: 999,
    background: 'linear-gradient(135deg, #b9444f, #82232b)',
    color: '#ffffff',
    textDecoration: 'none',
    fontWeight: 800,
    boxShadow: '0 14px 30px rgba(185,68,79,0.32)',
  },
  secondaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    padding: '0 22px',
    borderRadius: 999,
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.16)',
    color: '#ffffff',
    textDecoration: 'none',
    fontWeight: 800,
  },
  section: {
    width: '100%',
    maxWidth: 1180,
    margin: '0 auto',
    padding: '82px 24px',
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
  galleryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: 22,
  },
  galleryCard: {
    background: 'rgba(15, 23, 42, 0.88)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 22,
    overflow: 'hidden',
    textDecoration: 'none',
    color: 'inherit',
    boxShadow: '0 18px 45px rgba(0,0,0,0.28)',
  },
  galleryImageWrap: {
    width: '100%',
    aspectRatio: '16 / 10',
    overflow: 'hidden',
    background: '#101827',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  galleryBody: {
    padding: 20,
  },
  galleryDate: {
    color: '#b9444f',
    fontSize: 13,
    fontWeight: 800,
    margin: '0 0 8px',
  },
  galleryTitle: {
    color: '#ffffff',
    fontSize: 21,
    margin: '0 0 10px',
  },
  galleryDescription: {
    color: '#cbd5e1',
    lineHeight: 1.6,
    margin: 0,
  },
  centerButtonWrap: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: 34,
  },
  aboutSection: {
    padding: '82px 24px',
    background:
      'radial-gradient(circle at top left, rgba(185,68,79,0.22), transparent 34%), #050b1a',
  },
  aboutCard: {
    maxWidth: 980,
    margin: '0 auto',
    padding: '42px',
    borderRadius: 28,
    background: 'rgba(15,23,42,0.88)',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 18px 45px rgba(0,0,0,0.28)',
  },
  text: {
    color: '#cbd5e1',
    lineHeight: 1.75,
    fontSize: 16,
    margin: '0 0 24px',
  },
  courseGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 22,
  },
  infoCard: {
    background: 'rgba(15, 23, 42, 0.88)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 22,
    padding: 24,
    boxShadow: '0 18px 45px rgba(0,0,0,0.28)',
  },
  infoTitle: {
    color: '#ffffff',
    fontSize: 22,
    margin: '0 0 12px',
  },
  cta: {
    textAlign: 'center',
    padding: '90px 24px',
    background: 'linear-gradient(135deg, #82232b, #b9444f)',
  },
  ctaTitle: {
    fontSize: 'clamp(2rem, 4vw, 3.3rem)',
    margin: '0 0 14px',
  },
  ctaText: {
    maxWidth: 640,
    margin: '0 auto 28px',
    color: '#f8fafc',
    lineHeight: 1.7,
  },
  loading: {
    color: '#cbd5e1',
    textAlign: 'center',
  },
}