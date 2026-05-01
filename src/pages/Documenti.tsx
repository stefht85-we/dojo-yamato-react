function Documenti() {
  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <p style={labelStyle}>Bacheca</p>
        <h1 style={titleStyle}>Documenti</h1>

        <p style={textStyle}>
          In questa sezione saranno raccolti documenti, moduli, comunicazioni e
          materiali utili per gli iscritti e le famiglie.
        </p>

        <div style={emptyBoxStyle}>
          <h2 style={{ marginTop: 0 }}>Nessun documento disponibile</h2>
          <p style={{ marginBottom: 0 }}>
            I documenti saranno pubblicati prossimamente dall’amministratore del sito.
          </p>
        </div>
      </div>
    </main>
  )
}

const pageStyle: React.CSSProperties = {
  minHeight: '90vh',
  background: '#0b0f1a',
  color: 'white',
  padding: '80px 24px',
}

const containerStyle: React.CSSProperties = {
  maxWidth: '1000px',
  margin: '0 auto',
}

const labelStyle: React.CSSProperties = {
  color: '#e63946',
  fontWeight: 800,
  letterSpacing: '2px',
  textTransform: 'uppercase',
}

const titleStyle: React.CSSProperties = {
  fontSize: 'clamp(2.3rem, 6vw, 4rem)',
  margin: '12px 0 20px',
}

const textStyle: React.CSSProperties = {
  color: '#d8d8d8',
  fontSize: '18px',
  lineHeight: 1.7,
  maxWidth: '760px',
}

const emptyBoxStyle: React.CSSProperties = {
  marginTop: '36px',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: '18px',
  padding: '28px',
  color: '#d8d8d8',
}

export default Documenti