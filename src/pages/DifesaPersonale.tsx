import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { getSignedUrlFromPublicUrl } from '../lib/storageSignedUrl'

type DefenseMedia = {
  id: string
  title: string | null
  description: string | null
  media_url: string
  media_type: 'image' | 'video'
  thumbnail_url: string | null
  visible: boolean
  sort_order: number
  created_at: string
  signed_url?: string | null
}

export default function DifesaPersonale() {
  const [media, setMedia] = useState<DefenseMedia[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMedia()
  }, [])

  async function loadMedia() {
    setLoading(true)

    const { data, error } = await supabase
      .from('self_defense_media')
      .select('*')
      .eq('visible', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Errore caricamento difesa personale:', error)
      setMedia([])
      setLoading(false)
      return
    }

    const mediaWithUrls = await Promise.all(
      (data || []).map(async (item) => {
        const signedUrl = await getSignedUrlFromPublicUrl(item.media_url)

        return {
          ...item,
          signed_url: signedUrl || item.media_url,
        }
      })
    )

    setMedia(mediaWithUrls as DefenseMedia[])
    setLoading(false)
  }

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <div style={styles.heroText}>
          <p style={styles.kicker}>Difesa personale</p>

          <h1 style={styles.title}>
            Sentirsi più sicuri, con consapevolezza
          </h1>

          <p style={styles.subtitle}>
            A.S.D. Dojo Yamato organizza corsi di difesa personale dedicati a
            ragazze, donne e a chiunque senta il bisogno di acquisire maggiore
            sicurezza, attenzione e fiducia in sé.
          </p>

          <p style={styles.quote}>
            “La difesa personale non è forza. È presenza, lucidità e capacità di
            scegliere.”
          </p>
        </div>

        <div style={styles.imageBox}>
          <img
            src="/images/difesa-personale.jpg"
            alt="Corso di difesa personale Dojo Yamato"
            style={styles.heroImage}
          />
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <p style={styles.kicker}>Mini gallery</p>
          <h2 style={styles.sectionTitle}>Attività e momenti dei corsi</h2>
          <p style={styles.sectionSubtitle}>
            Foto e video delle attività dedicate alla difesa personale.
          </p>
        </div>

        {loading ? (
          <p style={styles.empty}>Caricamento media...</p>
        ) : media.length === 0 ? (
          <p style={styles.empty}>Nessun media disponibile al momento.</p>
        ) : (
          <div style={styles.grid}>
            {media.map((item) => {
              const sourceUrl = item.signed_url || item.media_url

              return (
                <article key={item.id} style={styles.card}>
                  {item.media_type === 'video' ? (
                    <video
                      src={sourceUrl}
                      controls
                      preload="metadata"
                      style={styles.media}
                    />
                  ) : (
                    <img
                      src={sourceUrl}
                      alt={item.title || 'Difesa personale'}
                      loading="lazy"
                      style={styles.media}
                      onError={(event) => {
                        const target = event.currentTarget

                        if (target.src !== item.media_url) {
                          target.src = item.media_url
                        }
                      }}
                    />
                  )}

                  {(item.title || item.description) && (
                    <div style={styles.cardBody}>
                      {item.title && <h3 style={styles.cardTitle}>{item.title}</h3>}

                      {item.description && (
                        <p style={styles.cardText}>{item.description}</p>
                      )}
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background:
      'radial-gradient(circle at top left, rgba(185,68,79,0.18), transparent 32%), #020817',
    color: '#ffffff',
  },
  hero: {
    maxWidth: 1180,
    margin: '0 auto',
    padding: '140px 24px 80px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 36,
    alignItems: 'center',
  },
  heroText: {
    maxWidth: 650,
  },
  kicker: {
    color: '#b9444f',
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontSize: 13,
    fontWeight: 800,
    margin: '0 0 12px',
  },
  title: {
    fontSize: 'clamp(2.5rem, 5vw, 4.8rem)',
    lineHeight: 1,
    margin: '0 0 22px',
    letterSpacing: '-0.05em',
  },
  subtitle: {
    color: '#cbd5e1',
    fontSize: 'clamp(1rem, 2vw, 1.2rem)',
    lineHeight: 1.75,
    margin: '0 0 22px',
  },
  quote: {
    color: '#ffffff',
    fontWeight: 800,
    lineHeight: 1.6,
    borderLeft: '4px solid #b9444f',
    paddingLeft: 18,
    margin: 0,
  },
  imageBox: {
    borderRadius: 28,
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 24px 70px rgba(0,0,0,0.35)',
    background: '#101827',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    minHeight: 360,
    objectFit: 'cover',
    display: 'block',
  },
  section: {
    maxWidth: 1180,
    margin: '0 auto',
    padding: '40px 24px 100px',
  },
  sectionHeader: {
    textAlign: 'center',
    marginBottom: 34,
  },
  sectionTitle: {
    fontSize: 'clamp(2rem, 4vw, 3rem)',
    margin: '0 0 14px',
  },
  sectionSubtitle: {
    color: '#cbd5e1',
    margin: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 22,
  },
  card: {
    background: 'rgba(15,23,42,0.88)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 22,
    overflow: 'hidden',
    boxShadow: '0 18px 45px rgba(0,0,0,0.28)',
  },
  media: {
    width: '100%',
    aspectRatio: '16 / 10',
    objectFit: 'cover',
    display: 'block',
    background: '#020817',
  },
  cardBody: {
    padding: 18,
  },
  cardTitle: {
    margin: '0 0 8px',
    fontSize: 20,
  },
  cardText: {
    margin: 0,
    color: '#cbd5e1',
    lineHeight: 1.6,
  },
  empty: {
    textAlign: 'center',
    color: '#cbd5e1',
  },
}
