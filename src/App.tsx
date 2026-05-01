import { useState } from 'react'
import { Routes, Route, Link } from 'react-router-dom'

import Home from './pages/Home'
import ChiSiamo from './pages/ChiSiamo'
import Corsi from './pages/Corsi'
import Contatti from './pages/Contatti'
import AreaUtente from './pages/AreaUtente'
import Bacheca from './pages/Bacheca'
import Galleria from './pages/Galleria'
import GalleriaAnno from './pages/GalleriaAnno'
import GalleriaAlbum from './pages/GalleriaAlbum'
import News from './pages/News'
import CalendarioEventi from './pages/CalendarioEventi'
import Documenti from './pages/Documenti'
import DifesaPersonale from './pages/DifesaPersonale'
import EventoDettaglio from './pages/EventoDettaglio'

import './App.css'

function App() {
  const [menuOpen, setMenuOpen] = useState(false)

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <div className="app">
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
            aria-label={menuOpen ? 'Chiudi menu' : 'Apri menu'}
          >
            ☰
          </button>

          <div className={menuOpen ? 'nav-links open' : 'nav-links'}>
            <Link to="/" onClick={closeMenu}>
              Home
            </Link>

            <Link to="/chi-siamo" onClick={closeMenu}>
              Chi siamo
            </Link>

            <Link to="/corsi" onClick={closeMenu}>
              Corsi
            </Link>

            <Link to="/bacheca" onClick={closeMenu}>
              Bacheca
            </Link>

            <Link to="/news" onClick={closeMenu}>
              News
            </Link>

            <Link to="/contatti" onClick={closeMenu}>
              Contatti
            </Link>

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

        <Route path="/bacheca" element={<Bacheca />} />
        <Route path="/news" element={<News />} />
        <Route path="/area-utente" element={<AreaUtente />} />

        <Route path="/galleria" element={<Galleria />} />
        <Route path="/galleria/:year" element={<GalleriaAnno />} />
        <Route path="/galleria/album/:albumId" element={<GalleriaAlbum />} />

        <Route path="/calendario-eventi" element={<CalendarioEventi />} />
        <Route path="/documenti" element={<Documenti />} />
        <Route path="/difesa-personale" element={<DifesaPersonale />} />
        <Route path="/calendario-eventi/:eventId" element={<EventoDettaglio />} />
        <Route path="/calendario-eventi" element={<CalendarioEventi />} />
      </Routes>

      <footer className="site-footer">
        <div className="footer-inner">
          <div>
            <strong>DOJO YAMATO</strong>
            <span>ARTI MARZIALI</span>
          </div>

          <p>
            Karate Shotokan per bambini, ragazzi e adulti. Disciplina, rispetto
            e crescita personale.
          </p>

          <Link to="/area-utente" onClick={closeMenu}>
            Area riservata
          </Link>
        </div>
      </footer>
    </div>
  )
}

export default App