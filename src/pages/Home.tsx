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
          if (entry.isIntersecting) entry.target.classList.add('active')
        })
      },
      { threshold: 0.1 }
    )

    elements.forEach((el) => observer.observe(el))
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
        <div style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '0 32px', color: 'white' }}>
          <div className="hero-content" style={{ maxWidth: '540px' }}>
            <h1 className="hero-title" style={{ fontSize: '58px', lineHeight: 1.05, margin: 0 }}>
              Karate per bambini, ragazzi e adulti
            </h1>

            <div style={{ width: '70px', height: '4px', background: '#e63946', marginTop: '24px', marginBottom: '24px' }} />

            <p className="hero-text" style={{ fontSize: '21px', lineHeight: 1.6, color: '#f0f0f0', margin: 0 }}>
              Disciplina, rispetto e crescita personale attraverso il Karate Shotokan.
            </p>

            <div className="hero-buttons" style={{ display: 'flex', gap: '16px', marginTop: '34px' }}>
              <button className="home-button" style={primaryButton}>Prova gratuita</button>
              <button className="home-button" style={secondaryButton}>Scopri i corsi</button>
            </div>
          </div>
        </div>
      </section>

      <section style={sectionStyle}>
        <div style={containerStyle}>
          <p style={labelStyle}>ULTIME NEWS</p>
          <h2 style={titleStyle}>Novità dal Dojo</h2>

          <div className="home-card-grid" style={cardGrid}>
            {news.map((item) => (
              <div key={item.id} className="course-card reveal" style={cardStyle}>
                <h3>{item.title}</h3>
                <p>{item.content}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ ...sectionStyle, background: '#101827' }}>
        <div style={containerStyle}>
          <p style={labelStyle}>GALLERIA</p>
          <h2 style={titleStyle}>Momenti dal Dojo</h2>

          <div className="home-card-grid" style={cardGrid}>
            {gallery.map((item) => (
              <div key={item.id} className="course-card reveal" style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
                <img src={item.image_url} alt={item.title} style={{ width: '100%', height: '220px', objectFit: 'cover' }} />
                <div style={{ padding: '20px' }}>
                  <h3>{item.title}</h3>
                </div>
              </div>
            ))}
          </div>

          <Link to="/galleria" style={{ ...primaryButton, display: 'inline-block', textDecoration: 'none', marginTop: '32px' }}>
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
        </div>
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