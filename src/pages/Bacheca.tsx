import { Link } from 'react-router-dom'

function Bacheca() {
  return (
    <main
      style={{
        minHeight: '90vh',
        background:
          'radial-gradient(circle at top, rgba(230,57,70,0.18), transparent 34%), #0b0f1a',
        color: 'white',
        padding: '80px 24px',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <section style={{ marginBottom: '44px' }}>
          <p
            style={{
              color: '#e63946',
              fontWeight: 800,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              marginBottom: '12px',
            }}
          >
            Area informativa
          </p>

          <h1
            style={{
              fontSize: 'clamp(2.4rem, 6vw, 4.5rem)',
              margin: 0,
              lineHeight: 1.05,
            }}
          >
            Bacheca
          </h1>

          <p
            style={{
              maxWidth: '760px',
              marginTop: '20px',
              color: '#d8d8d8',
              fontSize: '18px',
              lineHeight: 1.7,
            }}
          >
            Consulta eventi, immagini, documenti e contenuti utili per gli atleti
            e le famiglie del Dojo Yamato.
          </p>
        </section>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '24px',
          }}
        >
          <Link to="/calendario-eventi" style={cardLinkStyle}>
            <div style={iconStyle}>📅</div>
            <h2 style={cardTitleStyle}>Calendario eventi</h2>
            <p style={cardTextStyle}>
              Appuntamenti, stage, gare, lezioni speciali e attività programmate.
            </p>
            <span style={cardCtaStyle}>Apri calendario →</span>
          </Link>

          <Link to="/galleria" style={cardLinkStyle}>
            <div style={iconStyle}>🥋</div>
            <h2 style={cardTitleStyle}>Galleria</h2>
            <p style={cardTextStyle}>
              Foto e momenti importanti del Dojo, degli allenamenti e degli eventi.
            </p>
            <span style={cardCtaStyle}>Apri galleria →</span>
          </Link>

          <Link to="/documenti" style={cardLinkStyle}>
            <div style={iconStyle}>📄</div>
            <h2 style={cardTitleStyle}>Documenti</h2>
            <p style={cardTextStyle}>
              Moduli, comunicazioni e materiali utili per iscritti e famiglie.
            </p>
            <span style={cardCtaStyle}>Apri documenti →</span>
          </Link>

          <Link to="/difesa-personale" style={cardLinkStyle}>
            <div style={iconStyle}>🛡️</div>
            <h2 style={cardTitleStyle}>Difesa personale</h2>
            <p style={cardTextStyle}>
              Informazioni e materiali dedicati ai percorsi di difesa personale.
            </p>
            <span style={cardCtaStyle}>Apri sezione →</span>
          </Link>
        </section>
      </div>
    </main>
  )
}

const cardLinkStyle: React.CSSProperties = {
  display: 'block',
  textDecoration: 'none',
  color: 'white',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: '22px',
  padding: '28px',
  minHeight: '260px',
  boxShadow: '0 18px 50px rgba(0,0,0,0.20)',
}

const iconStyle: React.CSSProperties = {
  width: '54px',
  height: '54px',
  borderRadius: '16px',
  background: 'rgba(230,57,70,0.18)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '28px',
  marginBottom: '22px',
}

const cardTitleStyle: React.CSSProperties = {
  fontSize: '24px',
  margin: '0 0 14px',
}

const cardTextStyle: React.CSSProperties = {
  color: '#d8d8d8',
  lineHeight: 1.65,
  marginBottom: '22px',
}

const cardCtaStyle: React.CSSProperties = {
  color: '#e63946',
  fontWeight: 800,
}

export default Bacheca