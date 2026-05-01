import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import hero from '../assets/hero.jpg'
import { supabase } from '../lib/supabaseClient'
import './Home.css'

type NewsItem = {
  id: string
  title: string
  content: string
  created_at: string
}

type GalleryItem = {
  id: string
  title: string
  image_url: string
}

function Home() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [gallery, setGallery] = useState<GalleryItem[]>([])

  useEffect(() => {
    async function loadHomeData() {
      const { data: newsData } = await supabase
        .from('news')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3)

      const { data: galleryData } = await supabase
        .from('gallery')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3)

      setNews(newsData ?? [])
      setGallery(galleryData ?? [])
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
        <div
          style={{
            maxWidth: '1200px',
            width: '100%',
            margin: '0 auto',
            padding: '0 32px',
            color: 'white',
          }}
        >
          <div className="hero-content" style={{ maxWidth: '540px' }}>
            <h1
              className="hero-title"
              style={{
                fontSize: '58px',
                lineHeight: 1.05,
                margin: 0,
              }}
            >
              Karate per bambini, ragazzi e adulti
            </h1>

            <div
              style={{
                width: '70px',
                height: '4px',
                background: '#e63946',
                marginTop: '24px',
                marginBottom: '24px',
              }}
            />

            <p
              className="hero-text"
              style={{
                fontSize: '21px',
                lineHeight: 1.6,
                color: '#f0f0f0',
                margin: 0,
              }}
            >
              Disciplina, rispetto e crescita personale attraverso il Karate Shotokan.
            </p>

            <div
              className="hero-buttons"
              style={{
                display: 'flex',
                gap: '16px',
                marginTop: '34px',
                flexWrap: 'wrap',
              }}
            >
              <Link
                className="home-button"
                to="/contatti"
                style={{
                  ...primaryButton,
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                Prova gratuita
              </Link>

              <Link
                className="home-button"
                to="/corsi"
                style={{
                  ...secondaryButton,
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                Scopri i corsi
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section style={sectionStyle}>
        <div style={containerStyle}>
          <p style={labelStyle}>ULTIME NEWS</p>
          <h2 style={titleStyle}>Novità dal Dojo</h2>

          {news.length === 0 && (
            <div
              className="reveal"
              style={{
                marginTop: '32px',
                background: 'rgba(255,255,255,0.06)',
                padding: '28px',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#d8d8d8',
              }}
            >
              <p style={{ margin: 0 }}>
                Al momento non ci sono news pubblicate. Torna presto per scoprire le novità dal Dojo.
              </p>
            </div>
          )}

          {news.length > 0 && (
            <div className="home-card-grid" style={cardGrid}>
              {news.map((item) => (
                <div key={item.id} className="course-card reveal" style={cardStyle}>
                  <h3 style={{ marginBottom: '10px' }}>{item.title}</h3>

                  <small style={{ opacity: 0.6 }}>
                    {item.created_at
                      ? new Date(item.created_at).toLocaleDateString('it-IT')
                      : ''}
                  </small>

                  <p style={{ marginTop: '10px' }}>
                    {item.content.length > 120
                      ? item.content.substring(0, 120) + '...'
                      : item.content}
                  </p>

                  <Link
                    to="/news"
                    className="home-button"
                    style={{
                      marginTop: '16px',
                      padding: '10px 18px',
                      borderRadius: '999px',
                      background: '#e63946',
                      color: 'white',
                      cursor: 'pointer',
                      fontWeight: 700,
                      display: 'inline-block',
                      textDecoration: 'none',
                    }}
                  >
                    Leggi tutto
                  </Link>
                </div>
              ))}
            </div>
          )}

          <Link
            to="/news"
            className="home-button"
            style={{
              ...primaryButton,
              display: 'inline-block',
              textDecoration: 'none',
              marginTop: '32px',
            }}
          >
            Vai a tutte le news
          </Link>
        </div>
      </section>

      <section style={{ ...sectionStyle, background: '#101827' }}>
        <div style={containerStyle}>
          <p style={labelStyle}>GALLERIA</p>
          <h2 style={titleStyle}>Momenti dal Dojo</h2>

          {gallery.length === 0 && (
            <div
              className="reveal"
              style={{
                marginTop: '32px',
                background: 'rgba(255,255,255,0.06)',
                padding: '28px',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#d8d8d8',
              }}
            >
              <p style={{ margin: 0 }}>
                Al momento non ci sono immagini disponibili in galleria.
              </p>
            </div>
          )}

          {gallery.length > 0 && (
            <div className="home-card-grid" style={cardGrid}>
              {gallery.map((item) => (
                <div
                  key={item.id}
                  className="course-card reveal"
                  style={{
                    ...cardStyle,
                    padding: 0,
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={item.image_url}
                    alt={item.title}
                    style={{
                      width: '100%',
                      height: '220px',
                      objectFit: 'cover',
                    }}
                  />

                  <div style={{ padding: '20px' }}>
                    <h3>{item.title}</h3>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Link
            to="/galleria"
            className="home-button"
            style={{
              ...primaryButton,
              display: 'inline-block',
              textDecoration: 'none',
              marginTop: '32px',
            }}
          >
            Vai alla galleria
          </Link>
        </div>
      </section>

      <section style={sectionStyle}>
        <div style={containerStyle}>
          <p style={labelStyle}>CHI SIAMO</p>
          <h2 style={titleStyle}>Non solo sport. Un percorso di vita.</h2>

          <p style={textStyle}>
            Il Dojo Yamato promuove il Karate come disciplina educativa, aiutando bambini,
            ragazzi e adulti a crescere con rispetto, concentrazione e fiducia in sé stessi.
          </p>

          <Link
            to="/chi-siamo"
            className="home-button"
            style={{
              ...primaryButton,
              display: 'inline-block',
              textDecoration: 'none',
              marginTop: '28px',
            }}
          >
            Scopri chi siamo
          </Link>
        </div>
      </section>

      <section style={{ ...sectionStyle, background: '#101827' }}>
        <div style={containerStyle}>
          <p style={labelStyle}>I NOSTRI CORSI</p>
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

          <Link
            to="/corsi"
            className="home-button"
            style={{
              ...primaryButton,
              display: 'inline-block',
              textDecoration: 'none',
              marginTop: '32px',
            }}
          >
            Vedi corsi e orari
          </Link>
        </div>
      </section>

      <section
        style={{
          padding: '80px 32px',
          background: '#e63946',
          textAlign: 'center',
          color: 'white',
        }}
      >
        <h2 style={{ fontSize: '36px', margin: 0 }}>
          Vieni a provare una lezione gratuita
        </h2>

        <p style={{ fontSize: '18px', marginTop: '16px' }}>
          Scopri il Karate con noi. Nessuna esperienza richiesta.
        </p>

        <Link
          to="/contatti"
          className="home-button"
          style={{
            ...secondaryButton,
            marginTop: '24px',
            display: 'inline-block',
            textDecoration: 'none',
          }}
        >
          Contattaci
        </Link>
      </section>
    </main>
  )
}

const sectionStyle = {
  padding: '90px 32px',
  background: '#0b0f1a',
  color: 'white',
}

const containerStyle = {
  maxWidth: '1200px',
  margin: '0 auto',
}

const labelStyle = {
  color: '#e63946',
  fontWeight: 700,
  letterSpacing: '2px',
}

const titleStyle = {
  fontSize: '42px',
  margin: '12px 0 20px',
}

const textStyle = {
  fontSize: '20px',
  lineHeight: 1.7,
  maxWidth: '850px',
  color: '#d8d8d8',
}

const cardGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '24px',
  marginTop: '36px',
} as React.CSSProperties

const cardStyle = {
  background: 'rgba(255,255,255,0.06)',
  padding: '28px',
  borderRadius: '16px',
  border: '1px solid rgba(255,255,255,0.08)',
  color: 'white',
} as React.CSSProperties

const primaryButton = {
  padding: '15px 28px',
  background: '#e63946',
  color: 'white',
  border: 'none',
  borderRadius: '999px',
  fontSize: '16px',
  fontWeight: 700,
  cursor: 'pointer',
} as React.CSSProperties

const secondaryButton = {
  padding: '15px 28px',
  background: 'white',
  color: '#111',
  border: 'none',
  borderRadius: '999px',
  fontSize: '16px',
  fontWeight: 700,
  cursor: 'pointer',
} as React.CSSProperties

export default Home