import hero from '../assets/hero.jpg'
function Home() {
  return (
    <div
      style={{
        minHeight: '90vh',
        backgroundImage: `url(${hero})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: '80px',
      }}
    >
      <div
        style={{
          maxWidth: '520px',
          background: 'rgba(0,0,0,0.55)',
          padding: '40px',
          color: 'white',
        }}
      >
        <h1 style={{ fontSize: '56px', margin: 0 }}>
          Dojo Yamato
        </h1>

        <p style={{ fontSize: '22px', marginTop: '20px' }}>
          Disciplina, rispetto e crescita personale attraverso il Karate.
        </p>

        <button
          style={{
            marginTop: '30px',
            padding: '15px 30px',
            background: '#e63946',
            color: 'white',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
          }}
        >
          Prova gratuita
        </button>
      </div>
    </div>
  )
}

export default Home