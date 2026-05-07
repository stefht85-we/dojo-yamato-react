import PublicNews from '../components/PublicNews'

export default function News() {
  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <div style={styles.heroInner}>
          <p style={styles.kicker}>News</p>
          <h1 style={styles.title}>News dal Dojo</h1>
          <p style={styles.subtitle}>
            Comunicazioni ufficiali, eventi, aggiornamenti e momenti importanti
            della vita del Dojo Yamato.
          </p>
        </div>
      </section>

      <section style={styles.content}>
        <PublicNews limit={24} compact={false} showTitle={false} />
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
  title: {
    fontSize: 'clamp(2.5rem, 5vw, 4.8rem)',
    lineHeight: 1,
    margin: '0 0 20px',
    letterSpacing: '-0.05em',
    color: '#ffffff',
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
}