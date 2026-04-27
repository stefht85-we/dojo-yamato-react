import { useState } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import ChiSiamo from './pages/ChiSiamo'
import Corsi from './pages/Corsi'
import Contatti from './pages/Contatti'
import AreaUtente from './pages/AreaUtente'
import './App.css'

function App() {
  const [menuOpen, setMenuOpen] = useState(false)

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <div>
      <header className="site-header">
        <nav className="site-nav">
          <Link to="/" className="site-logo" onClick={closeMenu}>
            DOJO YAMATO
            <span>ARTI MARZIALI</span>
          </Link>

          <button
            type="button"
            className="hamburger"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Apri menu"
          >
            ☰
          </button>

          <div className={menuOpen ? 'nav-links open' : 'nav-links'}>
            <Link to="/" onClick={closeMenu}>Home</Link>
            <Link to="/chi-siamo" onClick={closeMenu}>Chi siamo</Link>
            <Link to="/corsi" onClick={closeMenu}>Corsi</Link>
            <Link to="/contatti" onClick={closeMenu}>Contatti</Link>

            <Link
              to="/area-utente"
              className="area-button"
              onClick={closeMenu}
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

export default App