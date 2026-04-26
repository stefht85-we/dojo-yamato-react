import { Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import ChiSiamo from './pages/ChiSiamo'
import Corsi from './pages/Corsi'
import Contatti from './pages/Contatti'
import AreaUtente from './pages/AreaUtente'

function App() {
  return (
    <div>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'rgba(11, 15, 26, 0.95)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <nav
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '16px 32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Link
            to="/"
            style={{
              color: 'white',
              textDecoration: 'none',
              fontWeight: 800,
              letterSpacing: '1px',
              fontSize: '20px',
            }}
          >
            DOJO YAMATO
            <span
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 400,
                color: '#c9c9c9',
                letterSpacing: '2px',
                marginTop: '2px',
              }}
            >
              ARTI MARZIALI
            </span>
          </Link>

          <div
            style={{
              display: 'flex',
              gap: '26px',
              alignItems: 'center',
              fontSize: '15px',
            }}
          >
            <Link to="/" style={linkStyle}>Home</Link>
            <Link to="/chi-siamo" style={linkStyle}>Chi siamo</Link>
            <Link to="/corsi" style={linkStyle}>Corsi</Link>
            <Link to="/contatti" style={linkStyle}>Contatti</Link>

            <Link
              to="/area-utente"
              style={{
                background: '#e63946',
                color: 'white',
                textDecoration: 'none',
                padding: '10px 18px',
                borderRadius: '999px',
                fontWeight: 700,
              }}
            >
              Area Utente
            </Link>
          </div>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chi-siamo" element={<ChiSiamo />} />
        <Route path="/corsi" element={<Corsi />} />
        <Route path="/contatti" element={<Contatti />} />
        <Route path="/area-utente" element={<AreaUtente />} />
      </Routes>
    </div>
  )
}

const linkStyle = {
  color: 'white',
  textDecoration: 'none',
  fontWeight: 500,
}

export default App