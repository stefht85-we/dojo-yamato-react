import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import hero from '../assets/hero.jpg'
import PublicNews from '../components/PublicNews'
import { supabase } from '../lib/supabaseClient'
import './Home.css'

type GalleryPhoto = {
  id: string
  album_id: string
  image_url: string | null
  media_type: string | null
  sort_order: number | null
  created_at: string
}

type GalleryAlbum = {
  id: string
  title: string
  description: string | null
  category: string | null
  event_date: string | null
  event_year: number | null
  cover_image_url: string | null
  visible: boolean
  created_at: string
  gallery_photos?: GalleryPhoto[]
}

function Home() {
  const [albums, setAlbums] = useState<GalleryAlbum[]>([])

  useEffect(() => {
    async function loadHomeData() {
      const { data: albumsData, error: albumsError } = await supabase
        .from('gallery_albums')
        .select(`
          id,
          title,
          description,
          category,
          event_date,
          event_year,
          cover_image_url,
          visible,
          created_at,
          gallery_photos (
            id,
            album_id,
            image_url,
            media_type,
            sort_order,
            created_at
          )
        `)
        .eq('visible', true)

      if (albumsError) {
        console.error('Errore caricamento album Home:', albumsError.message)
      }

      setAlbums(getDailyAlbumSelection((albumsData ?? []) as GalleryAlbum[]))
    }

    loadHomeData()

    const elements = document.querySelectorAll('.reveal')

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active')
          }
        })
      },
      { threshold: 0.1 }
    )

    elements.forEach((el) => observer.observe(el))

    return () => {
      elements.forEach((el) => observer.unobserve(el))
    }
  }, [])

  function getAlbumTimestamp(album: GalleryAlbum) {
    if (album.event_date) return new Date(album.event_date).getTime()
    if (album.event_year) return new Date(album.event_year, 0, 1).getTime()
    if (album.created_at) return new Date(album.created_at).getTime()
    return 0
  }

  function getAlbumDisplayDate(album: GalleryAlbum) {
    if (album.event_date) {
      return new Date(album.event_date).toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    }

    if (album.event_year) return String(album.event_year)

    if (album.created_at) {
      return new Date(album.created_at).toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    }

    return ''
  }

  function getAlbumPreviewImage(album: GalleryAlbum) {
    const coverUrl = album.cover_image_url?.trim()
    if (coverUrl) return coverUrl

    const firstImage = album.gallery_photos
      ?.filter((photo) => {
        const imageUrl = photo.image_url?.trim()
        const mediaType = photo.media_type?.toLowerCase() || ''
        return Boolean(imageUrl) && (mediaType === 'image' || mediaType === '' || mediaType === 'photo')
      })
      .sort((a, b) => {
        const orderA = a.sort_order ?? 9999
        const orderB = b.sort_order ?? 9999

        if (orderA !== orderB) return orderA - orderB

        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      })[0]

    return firstImage?.image_url?.trim() || ''
  }

  function getShortTitle(title: string, max = 44) {
    if (title.length <= max) return title
    return `${title.substring(0, max)}...`
  }

  function hashString(value: string) {
    let hash = 0

    for (let i = 0; i < value.length; i++) {
      hash = (hash << 5) - hash + value.charCodeAt(i)
      hash |= 0
    }

    return Math.abs(hash)
  }

  function seededShuffle<T>(array: T[], seedString: string) {
    const result = [...array]
    let seed = hashString(seedString) || 1

    for (let i = result.length - 1; i > 0; i--) {
      seed = (seed * 9301 + 49297) % 233280
      const randomIndex = Math.floor((seed / 233280) * (i + 1))
      ;[result[i], result[randomIndex]] = [result[randomIndex], result[i]]
    }

    return result
  }

  function getDailyAlbumSelection(allAlbums: GalleryAlbum[]) {
    if (!allAlbums.length) return []

    const todayKey = new Date().toISOString().slice(0, 10)
    const shuffled = seededShuffle(allAlbums, todayKey)
    const selected = shuffled.slice(0, 3)

    return selected.sort((a, b) => getAlbumTimestamp(b) - getAlbumTimestamp(a))
  }

  return (
    <main>
      <section
        style={{
          minHeight: '90vh',
          backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.78), rgba(0,0,0,0.25)), url(${hero})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div style={heroInnerStyle}>
          <div className="hero-content" style={{ maxWidth: '540px' }}>
            <h1 className="hero-title" style={heroTitleStyle}>
              Karate per bambini, ragazzi e adulti
            </h1>

            <div style={heroDividerStyle} />

            <p className="hero-text" style={heroTextStyle}>
              Disciplina, rispetto e crescita personale attraverso il Karate Shotokan.
            </p>

            <div className="hero-buttons" style={heroButtonsStyle}>
              <Link className="home-button" to="/contatti" style={{ ...primaryButton, textDecoration: 'none', display: 'inline-block' }}>
                Prova gratuita
              </Link>

              <Link className="home-button" to="/corsi" style={{ ...secondaryButton, textDecoration: 'none', display: 'inline-block' }}>
                Scopri i corsi
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section style={sectionStyle}>
        <div style={containerStyle}>
          <PublicNews limit={3} compact />

          <Link to="/news" className="home-button" style={{ ...primaryButton, display: 'inline-block', textDecoration: 'none', marginTop: '32px' }}>
            Vai a tutte le news
          </Link>
        </div>
      </section>

      <section style={{ ...sectionStyle, background: '#101827' }}>
        <div style={containerStyle}>
          <p style={labelStyle}>Galleria</p>
          <h2 style={titleStyle}>Momenti dal Dojo</h2>

          {albums.length === 0 && (
            <div className="reveal" style={emptyBoxStyle}>
              <p style={{ margin: 0 }}>Al momento non ci sono album disponibili in galleria.</p>
            </div>
          )}

          {albums.length > 0 && (
            <div className="home-card-grid" style={galleryPreviewGrid}>
              {albums.map((album) => {
                const previewImage = getAlbumPreviewImage(album)

                return (
                  <article key={album.id} style={galleryPreviewCard}>
                    <p style={galleryDateStyle}>Album del {getAlbumDisplayDate(album)}</p>

                    <Link to={`/galleria/${album.id}`} style={galleryPreviewLink}>
                      <div style={galleryPreviewBox}>
                        {previewImage ? (
                          <img src={previewImage} alt={album.title} style={galleryPreviewImage} />
                        ) : (
                          <div style={galleryEmptyPreview}>
                            <span style={galleryEmptyText}>ALBUM</span>
                          </div>
                        )}
                      </div>
                    </Link>

                    <h3 style={galleryTitlePreview}>{getShortTitle(album.title, 40)}</h3>
                  </article>
                )
              })}
            </div>
          )}

          <Link to="/galleria" className="home-button" style={{ ...primaryButton, display: 'inline-block', textDecoration: 'none', marginTop: '32px' }}>
            Vai alla galleria
          </Link>
        </div>
      </section>

      <section style={sectionStyle}>
        <div style={containerStyle}>
          <p style={labelStyle}>Chi siamo</p>
          <h2 style={titleStyle}>Non solo sport. Un percorso di vita.</h2>

          <p style={textStyle}>
            Il Dojo Yamato promuove il Karate come disciplina educativa, aiutando bambini,
            ragazzi e adulti a crescere con rispetto, concentrazione e fiducia in sé stessi.
          </p>

          <Link to="/chi-siamo" className="home-button" style={{ ...primaryButton, display: 'inline-block', textDecoration: 'none', marginTop: '28px' }}>
            Scopri chi siamo
          </Link>
        </div>
      </section>

      <section style={{ ...sectionStyle, background: '#101827' }}>
        <div style={containerStyle}>
          <p style={labelStyle}>I nostri corsi</p>
          <h2 style={titleStyle}>Allenamenti per ogni età e livello</h2>

          <div className="home-card-grid" style={cardGrid}>
            <div className="course-card reveal" style={cardStyle}>
              <h3>Bambini</h3>
              <p>Attività educativa, gioco, disciplina e coordinazione.</p>
            </div>

            <div className="course-card reveal" style={cardStyle}>
              <h3>Ragazzi</h3>
              <p>Tecnica, crescita personale, rispetto e preparazione atletica.</p>
            </div>

            <div className="course-card reveal" style={cardStyle}>
              <h3>Adulti</h3>
              <p>Karate tradizionale, benessere, difesa personale e concentrazione.</p>
            </div>
          </div>

          <Link to="/corsi" className="home-button" style={{ ...primaryButton, display: 'inline-block', textDecoration: 'none', marginTop: '32px' }}>
            Vedi corsi e orari
          </Link>
        </div>
      </section>

      <section style={ctaStyle}>
        <h2 style={{ fontSize: '36px', margin: 0 }}>Vieni a provare una lezione gratuita</h2>
        <p style={{ fontSize: '18px', marginTop: '16px' }}>Scopri il Karate con noi. Nessuna esperienza richiesta.</p>
        <Link to="/contatti" className="home-button" style={{ ...secondaryButton, marginTop: '24px', display: 'inline-block', textDecoration: 'none' }}>
          Contattaci
        </Link>
      </section>
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

const heroInnerStyle: CSSProperties = {
  maxWidth: '1200px',
  width: '100%',
  margin: '0 auto',
  padding: '0 32px',
  color: 'white',
}

const heroTitleStyle: CSSProperties = {
  fontSize: '58px',
  lineHeight: 1.05,
  margin: 0,
}

const heroDividerStyle: CSSProperties = {
  width: '70px',
  height: '4px',
  background: '#e63946',
  marginTop: '24px',
  marginBottom: '24px',
}

const heroTextStyle: CSSProperties = {
  fontSize: '21px',
  lineHeight: 1.6,
  color: '#f0f0f0',
  margin: 0,
}

const heroButtonsStyle: CSSProperties = {
  display: 'flex',
  gap: '16px',
  marginTop: '34px',
  flexWrap: 'wrap',
}

const sectionStyle: CSSProperties = {
  padding: '90px 32px',
  background: '#0b0f1a',
  color: 'white',
}

const containerStyle: CSSProperties = {
  maxWidth: '1200px',
  margin: '0 auto',
}

const labelStyle: CSSProperties = dojoBadgeStyle

const titleStyle: CSSProperties = {
  fontSize: '42px',
  margin: '18px 0 20px',
}

const textStyle: CSSProperties = {
  fontSize: '20px',
  lineHeight: 1.7,
  maxWidth: '850px',
  color: '#d8d8d8',
}

const emptyBoxStyle: CSSProperties = {
  marginTop: '32px',
  background: 'rgba(255,255,255,0.06)',
  padding: '28px',
  borderRadius: '16px',
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#d8d8d8',
}

const cardGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '24px',
  marginTop: '36px',
}

const cardStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  padding: '28px',
  borderRadius: '16px',
  border: '1px solid rgba(255,255,255,0.08)',
  color: 'white',
}

const galleryPreviewGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: '34px',
  marginTop: '36px',
  maxWidth: '1120px',
}

const galleryPreviewCard: CSSProperties = {
  display: 'grid',
  gap: '12px',
  minWidth: 0,
  padding: '14px',
  borderRadius: '22px',
  background: 'linear-gradient(180deg, rgba(255,255,255,0.085), rgba(255,255,255,0.045))',
  border: '1px solid rgba(255,255,255,0.12)',
  boxShadow: '0 16px 36px rgba(0,0,0,0.32)',
}

const galleryDateStyle: CSSProperties = {
  margin: 0,
  color: 'white',
  fontSize: '14px',
  fontWeight: 850,
  lineHeight: 1.3,
  textAlign: 'center',
}

const galleryPreviewLink: CSSProperties = {
  display: 'block',
  textDecoration: 'none',
  color: 'inherit',
}

const galleryPreviewBox: CSSProperties = {
  width: '100%',
  height: '190px',
  overflow: 'hidden',
  background: '#176a82',
  borderRadius: '17px',
  border: '1px solid rgba(255,255,255,0.14)',
  boxShadow: '0 12px 30px rgba(0,0,0,0.34)',
}

const galleryPreviewImage: CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
  backgroundColor: '#176a82',
}

const galleryEmptyPreview: CSSProperties = {
  width: '100%',
  height: '100%',
  background: 'linear-gradient(135deg, #176a82 0%, #0f4658 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const galleryEmptyText: CSSProperties = {
  color: 'white',
  fontWeight: 900,
  letterSpacing: '1px',
}

const galleryTitlePreview: CSSProperties = {
  margin: 0,
  color: 'white',
  fontSize: '18px',
  lineHeight: 1.25,
  fontWeight: 900,
  textAlign: 'center',
}

const ctaStyle: CSSProperties = {
  padding: '80px 32px',
  background: '#e63946',
  textAlign: 'center',
  color: 'white',
}

const primaryButton: CSSProperties = {
  padding: '15px 28px',
  background: '#e63946',
  color: 'white',
  border: 'none',
  borderRadius: '999px',
  fontSize: '16px',
  fontWeight: 700,
  cursor: 'pointer',
}

const secondaryButton: CSSProperties = {
  padding: '15px 28px',
  background: 'white',
  color: '#111',
  border: 'none',
  borderRadius: '999px',
  fontSize: '16px',
  fontWeight: 700,
  cursor: 'pointer',
}

export default Home
