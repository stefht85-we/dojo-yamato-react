import hero from '../assets/hero.jpg'
import './Home.css'
  import { useEffect } from 'react'
function Home() {
  useEffect(() => {
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
              style={{
                fontSize: '21px',
                lineHeight: 1.6,
                color: '#f0f0f0',
                margin: 0,
              }}
            >
              Disciplina, rispetto e crescita personale attraverso il Karate Shotokan.
            </p>

            <div style={{ display: 'flex', gap: '16px', marginTop: '34px' }}>
              <button className="home-button" style={primaryButton}>
                Prova gratuita
              </button>
              <button className="home-button" style={secondaryButton}>
                Scopri i corsi
              </button>
            </div>
          </div>
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

      <section style={{ ...sectionStyle, background: '#101827' }}>
        <div style={containerStyle}>
          <p style={labelStyle}>I NOSTRI CORSI</p>
          <h2 style={titleStyle}>Allenamenti per ogni età e livello</h2>

          <div style={cardGrid}>
            <div className="course-card" style={cardStyle}>
              <h3>Bambini</h3>
              <p>Attività educativa, gioco, disciplina e coordinazione.</p>
            </div>

            <div className="course-card" style={cardStyle}>
              <h3>Ragazzi</h3>
              <p>Tecnica, crescita personale, rispetto e preparazione atletica.</p>
            </div>

            <div className="course-card" style={cardStyle}>
              <h3>Adulti</h3>
              <p>Karate tradizionale, benessere, difesa personale e concentrazione.</p>
            </div>
          </div>
        </div>
      </section>

      <section style={sectionStyle}>
        <div style={containerStyle}>
          <p style={labelStyle}>VALORI</p>
          <h2 style={titleStyle}>Disciplina. Rispetto. Crescita.</h2>

          <div style={cardGrid}>
            <div className="course-card" style={cardStyle}>
              <h3>Disciplina</h3>
              <p>Imparare costanza, impegno e controllo.</p>
            </div>

            <div className="course-card" style={cardStyle}>
              <h3>Rispetto</h3>
              <p>Per sé stessi, per il maestro, per i compagni.</p>
            </div>

            <div className="course-card" style={cardStyle}>
              <h3>Crescita</h3>
              <p>Un percorso personale dentro e fuori dal dojo.</p>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '80px 32px', background: '#e63946', textAlign: 'center', color: 'white' }}>
        <h2 style={{ fontSize: '36px', margin: 0 }}>
          Vieni a provare una lezione gratuita
        </h2>
        <p style={{ fontSize: '18px', marginTop: '16px' }}>
          Scopri il Karate con noi. Nessuna esperienza richiesta.
        </p>
        <button className="home-button" style={{ ...secondaryButton, marginTop: '24px' }}>
          Contattaci
        </button>
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
}

const cardStyle = {
  background: 'rgba(255,255,255,0.06)',
  padding: '28px',
  borderRadius: '16px',
  border: '1px solid rgba(255,255,255,0.08)',
  color: 'white',
}

const primaryButton = {
  padding: '15px 28px',
  background: '#e63946',
  color: 'white',
  border: 'none',
  borderRadius: '999px',
  fontSize: '16px',
  fontWeight: 700,
  cursor: 'pointer',
}

const secondaryButton = {
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