import { useEffect, useState } from 'react'
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
import EventoDettaglio from './pages/EventoDettaglio'
import Documenti from './pages/Documenti'
import { supabase } from './lib/supabaseClient'
import './App.css'
import NewsDettaglio from './pages/NewsDettaglio'

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [hasRecentNews, setHasRecentNews] = useState(false)

  function closeMenu() {
    setMenuOpen(false)
  }

  useEffect(() => {
    async function checkRecentNews() {
      const fiveDaysAgo = new Date()
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5)

      const fiveDaysAgoString = fiveDaysAgo.toISOString().slice(0, 10)

      const { data, error } = await supabase
        .from('news')
        .select('id')
        .eq('published', true)
        .gte('news_date', fiveDaysAgoString)
        .limit(1)

      if (error) {
        console.error('Errore controllo news recenti:', error)
        setHasRecentNews(false)
        return
      }

      setHasRecentNews((data ?? []).length > 0)
    }

    checkRecentNews()
  }, [])

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
            <Link
              to="/news"
              onClick={closeMenu}
              className={hasRecentNews ? 'news-menu-link news-menu-link-active' : 'news-menu-link'}
            >
              News
            </Link>

            <Link to="/" onClick={closeMenu}>Home</Link>
            <Link to="/chi-siamo" onClick={closeMenu}>Chi siamo</Link>
            <Link to="/corsi" onClick={closeMenu}>Corsi</Link>
            <Link to="/calendario-eventi" onClick={closeMenu}>Eventi</Link>
            <Link to="/galleria" onClick={closeMenu}>Galleria</Link>
            <Link to="/documenti" onClick={closeMenu}>Documenti</Link>
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
        <Route path="/bacheca" element={<Bacheca />} />
        <Route path="/area-utente" element={<AreaUtente />} />

        <Route path="/news" element={<News />} />
        <Route path="/news/:newsId" element={<NewsDettaglio />} />

        <Route path="/galleria" element={<Galleria />} />
        <Route path="/galleria/:year" element={<GalleriaAnno />} />
        <Route path="/galleria/album/:albumId" element={<GalleriaAlbum />} />

        <Route path="/calendario-eventi" element={<CalendarioEventi />} />
        <Route path="/calendario-eventi/:eventId" element={<EventoDettaglio />} />

        <Route path="/documenti" element={<Documenti />} />
      </Routes>
    </div>
  )
}

export default App