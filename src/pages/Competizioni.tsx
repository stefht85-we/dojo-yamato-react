import { Link } from 'react-router-dom'
import { useState } from 'react'
import type { CSSProperties } from 'react'

type ImageSlotData = {
  src: string
  title: string
  text: string
}

const imageSlots: ImageSlotData[] = [
  {
    src: '/images/competizioni/competizioni-1.jpg',
    title: 'Gare nazionali',
    text: 'Foto consigliata: gruppo atleti, premiazioni o tatami gara.',
  },
  {
    src: '/images/competizioni/competizioni-2.jpg',
    title: 'Esperienze internazionali',
    text: 'Foto consigliata: competizioni, trasferte o momenti di squadra.',
  },
  {
    src: '/images/competizioni/competizioni-3.jpg',
    title: 'Preparazione agonistica',
    text: 'Foto consigliata: allenamento kumite, kata o lavoro tecnico.',
  },
]

function Competizioni() {
  return (
    <>
      <style>{responsiveCss}</style>

      <main style={styles.page}>
        <section style={styles.hero}>
          <div style={styles.overlay} />
          <div style={styles.heroInner}>
            <p style={styles.kicker}>Competizioni</p>
            <h1 style={styles.heroTitle}>Crescere attraverso il confronto</h1>
            <p style={styles.heroText}>
              Il Dojo Yamato accompagna gli atleti in un percorso sportivo serio, progressivo e
              rispettoso, partecipando a competizioni nazionali e internazionali come occasione di
              crescita tecnica, caratteriale e personale.
            </p>
            <div style={styles.heroActions}>
              <Link to="/contatti" style={styles.primaryButton}>Richiedi informazioni</Link>
              <Link to="/corsi" style={styles.secondaryButton}>Scopri i corsi</Link>
            </div>
          </div>
        </section>

        <section style={styles.sectionCompact}>
          <div style={styles.container}>
            <div className="competizioni-intro-card" style={styles.introCard}>
              <div>
                <p style={styles.kicker}>Metodo Dojo Yamato</p>
                <h2 style={styles.sectionTitle}>Preparazione mirata, risultati costruiti nel tempo</h2>
              </div>
              <p style={styles.largeText}>
                La partecipazione alle gare non è mai improvvisata: gli atleti vengono preparati con
                un metodo graduale che unisce tecnica, condizione fisica, disciplina mentale e capacità
                di gestire l’emozione del confronto. Ogni competizione diventa un momento per misurarsi,
                imparare e migliorare.
              </p>
            </div>
          </div>
        </section>

        <section style={styles.sectionCompactAlt}>
          <div style={styles.container}>
            <div className="competizioni-grid" style={styles.grid3}>
              <InfoCard
                title="Percorso agonistico"
                text="Gli atleti interessati alle competizioni vengono seguiti con attenzione, rispettando età, livello tecnico e obiettivi personali. Il percorso è costruito passo dopo passo, senza forzature."
              />
              <InfoCard
                title="Kata e kumite"
                text="La preparazione comprende lavoro tecnico sui fondamentali, esercizi specifici per kata e kumite, cura della postura, ritmo, precisione, distanza e controllo."
              />
              <InfoCard
                title="Mentalità e rispetto"
                text="La gara è vissuta come confronto educativo: rispetto dell’avversario, gestione della pressione, autocontrollo e spirito di squadra sono parte centrale dell’esperienza."
              />
            </div>
          </div>
        </section>

        <section style={styles.sectionCompact}>
          <div style={styles.container}>
            <div className="competizioni-split" style={styles.splitCard}>
              <div>
                <p style={styles.kicker}>Obiettivo</p>
                <h2 style={styles.sectionTitle}>Portare ogni atleta al proprio miglior livello</h2>
                <p style={styles.text}>
                  Il Dojo Yamato partecipa a numerose competizioni provinciali, regionali, nazionali e,
                  quando il percorso lo permette, anche internazionali. L’obiettivo non è soltanto il
                  risultato sportivo, ma la costruzione di atleti consapevoli, determinati e capaci di
                  affrontare il tatami con sicurezza.
                </p>
                <p style={styles.text}>
                  La preparazione viene adattata in base all’età e al livello: dai bambini che vivono le
                  prime esperienze di gara fino agli atleti più esperti che cercano una crescita tecnica
                  più avanzata.
                </p>
              </div>

              <div style={styles.highlightBox}>
                <h3 style={styles.highlightTitle}>Cosa alleniamo</h3>
                <ul style={styles.list}>
                  <li>Tecnica, precisione e controllo</li>
                  <li>Preparazione fisica specifica</li>
                  <li>Strategia di gara e gestione del ritmo</li>
                  <li>Concentrazione e gestione dell’emozione</li>
                  <li>Rispetto, disciplina e spirito di squadra</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section style={styles.sectionCompactAlt}>
          <div style={styles.container}>
            <div style={styles.sectionHeader}>
              <p style={styles.kicker}>Immagini competizioni</p>
              <h2 style={styles.sectionTitle}>Spazio immagini per il sito</h2>
              <p style={styles.textCenter}>
                Inserisci le immagini in <strong>public/images/competizioni</strong> con i nomi indicati
                sotto. Il sito le caricherà automaticamente.
              </p>
            </div>

            <div className="competizioni-images" style={styles.imageGrid}>
              {imageSlots.map((image) => (
                <ImageSlot key={image.src} image={image} />
              ))}
            </div>
          </div>
        </section>

        <section style={styles.ctaSection}>
          <div style={styles.container}>
            <div style={styles.ctaCard}>
              <h2 style={styles.ctaTitle}>Vuoi conoscere il percorso agonistico?</h2>
              <p style={styles.ctaText}>
                Contattaci per capire qual è il corso più adatto e come iniziare un percorso di
                preparazione alle competizioni in modo serio, graduale e sicuro.
              </p>
              <Link to="/contatti" style={styles.primaryButton}>Contattaci</Link>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <article style={styles.infoCard}>
      <h3 style={styles.cardTitle}>{title}</h3>
      <p style={styles.cardText}>{text}</p>
    </article>
  )
}

function ImageSlot({ image }: { image: ImageSlotData }) {
  const [missing, setMissing] = useState(false)

  return (
    <article style={styles.imageCard}>
      {!missing ? (
        <img
          src={image.src}
          alt={image.title}
          style={styles.image}
          onError={() => setMissing(true)}
        />
      ) : (
        <div style={styles.imagePlaceholder}>
          <span style={styles.placeholderLabel}>Inserisci immagine</span>
          <strong style={styles.placeholderFile}>{image.src.replace('/images/competizioni/', '')}</strong>
        </div>
      )}
      <div style={styles.imageCaption}>
        <h3 style={styles.imageTitle}>{image.title}</h3>
        <p style={styles.cardText}>{image.text}</p>
      </div>
    </article>
  )
}

export default Competizioni

const responsiveCss = `
  @media (max-width: 980px) {
    .competizioni-intro-card,
    .competizioni-split {
      grid-template-columns: 1fr !important;
    }

    .competizioni-grid,
    .competizioni-images {
      grid-template-columns: 1fr !important;
    }
  }

  @media (max-width: 680px) {
    .competizioni-hero-title {
      font-size: clamp(2.3rem, 13vw, 3.5rem) !important;
    }
  }
`

const styles: Record<string, CSSProperties> = {
  page: {
    background: '#070b15',
    color: '#fff',
    minHeight: '100vh',
  },
  hero: {
    position: 'relative',
    minHeight: '54vh',
    display: 'flex',
    alignItems: 'center',
    overflow: 'hidden',
    background:
      'radial-gradient(circle at 18% 22%, rgba(230,57,70,0.26), transparent 34%), linear-gradient(135deg, #070b15 0%, #101827 52%, #220b10 100%)',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    background:
      'linear-gradient(90deg, rgba(7,11,21,0.96), rgba(7,11,21,0.72), rgba(7,11,21,0.96))',
  },
  heroInner: {
    position: 'relative',
    width: 'min(1160px, calc(100% - 32px))',
    margin: '0 auto',
    padding: '72px 0',
    maxWidth: 900,
  },
  kicker: {
    margin: '0 0 10px',
    color: '#ff4d5a',
    textTransform: 'uppercase',
    letterSpacing: '0.18em',
    fontSize: 12,
    fontWeight: 900,
  },
  heroTitle: {
    margin: 0,
    fontFamily: 'Georgia, serif',
    fontSize: 'clamp(3rem, 7vw, 5.8rem)',
    lineHeight: 0.95,
    letterSpacing: '-0.05em',
  },
  heroText: {
    margin: '24px 0 0',
    maxWidth: 780,
    color: '#d8deea',
    fontSize: 'clamp(1.05rem, 2vw, 1.28rem)',
    lineHeight: 1.75,
  },
  heroActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 30,
  },
  primaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
    padding: '0 22px',
    borderRadius: 999,
    background: 'linear-gradient(180deg, #ef5a64, #9d2230)',
    color: '#fff',
    textDecoration: 'none',
    fontWeight: 900,
    boxShadow: '0 14px 30px rgba(157,34,48,0.35)',
  },
  secondaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
    padding: '0 22px',
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.18)',
    background: 'rgba(255,255,255,0.06)',
    color: '#fff',
    textDecoration: 'none',
    fontWeight: 900,
  },
  container: {
    width: 'min(1160px, calc(100% - 32px))',
    margin: '0 auto',
  },
  sectionCompact: {
    padding: '44px 0',
  },
  sectionCompactAlt: {
    padding: '44px 0',
    background: 'rgba(255,255,255,0.025)',
  },
  introCard: {
    display: 'grid',
    gridTemplateColumns: '0.8fr 1.2fr',
    gap: 32,
    alignItems: 'start',
    padding: 34,
    borderRadius: 28,
    border: '1px solid rgba(255,255,255,0.10)',
    background: 'linear-gradient(135deg, rgba(255,255,255,0.075), rgba(255,255,255,0.035))',
  },
  sectionTitle: {
    margin: 0,
    fontFamily: 'Georgia, serif',
    fontSize: 'clamp(2rem, 4vw, 3.2rem)',
    lineHeight: 1.05,
  },
  largeText: {
    margin: 0,
    color: '#d7deeb',
    fontSize: '1.12rem',
    lineHeight: 1.75,
  },
  grid3: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 18,
  },
  infoCard: {
    padding: 26,
    borderRadius: 24,
    border: '1px solid rgba(255,255,255,0.10)',
    background: 'rgba(255,255,255,0.055)',
  },
  cardTitle: {
    margin: '0 0 10px',
    fontSize: '1.25rem',
  },
  cardText: {
    margin: 0,
    color: '#b9c3d3',
    lineHeight: 1.65,
  },
  splitCard: {
    display: 'grid',
    gridTemplateColumns: '1.15fr 0.85fr',
    gap: 28,
    alignItems: 'stretch',
  },
  text: {
    color: '#d7deeb',
    lineHeight: 1.75,
    fontSize: '1.03rem',
  },
  highlightBox: {
    padding: 28,
    borderRadius: 26,
    background: 'linear-gradient(180deg, rgba(230,57,70,0.18), rgba(255,255,255,0.055))',
    border: '1px solid rgba(230,57,70,0.25)',
  },
  highlightTitle: {
    margin: '0 0 16px',
    fontSize: '1.35rem',
  },
  list: {
    margin: 0,
    paddingLeft: 20,
    color: '#d7deeb',
    lineHeight: 1.9,
  },
  sectionHeader: {
    textAlign: 'center',
    maxWidth: 760,
    margin: '0 auto 26px',
  },
  textCenter: {
    color: '#d7deeb',
    lineHeight: 1.7,
  },
  imageGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 18,
  },
  imageCard: {
    overflow: 'hidden',
    borderRadius: 24,
    border: '1px solid rgba(255,255,255,0.10)',
    background: 'rgba(255,255,255,0.055)',
  },
  image: {
    display: 'block',
    width: '100%',
    aspectRatio: '4 / 3',
    objectFit: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    aspectRatio: '4 / 3',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 18,
    textAlign: 'center',
    background: 'linear-gradient(135deg, rgba(255,255,255,0.07), rgba(230,57,70,0.12))',
  },
  placeholderLabel: {
    color: '#aeb8c8',
    fontSize: 13,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  placeholderFile: {
    color: '#fff',
    fontSize: 15,
  },
  imageCaption: {
    padding: 20,
  },
  imageTitle: {
    margin: '0 0 8px',
    fontSize: '1.1rem',
  },
  ctaSection: {
    padding: '44px 0 60px',
  },
  ctaCard: {
    textAlign: 'center',
    padding: 34,
    borderRadius: 30,
    background: 'linear-gradient(135deg, rgba(230,57,70,0.20), rgba(255,255,255,0.06))',
    border: '1px solid rgba(255,255,255,0.10)',
  },
  ctaTitle: {
    margin: 0,
    fontFamily: 'Georgia, serif',
    fontSize: 'clamp(2rem, 4vw, 3.1rem)',
  },
  ctaText: {
    maxWidth: 760,
    margin: '16px auto 24px',
    color: '#d7deeb',
    lineHeight: 1.7,
  },
}
