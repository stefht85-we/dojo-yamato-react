import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'

import { supabase } from './lib/supabaseClient'

import Home from './pages/Home'
import ChiSiamo from './pages/ChiSiamo'
import Insegnanti from './pages/Insegnanti'
import Corsi from './pages/Corsi'
import CalendarioEventi from './pages/CalendarioEventi'
import EventoDettaglio from './pages/EventoDettaglio'
import Galleria from './pages/Galleria'
import GalleriaAlbum from './pages/GalleriaAlbum'
import Teoria from './pages/Teoria'
import Documenti from './pages/Documenti'
import News from './pages/News'
import AreaUtente from './pages/AreaUtente'
import Contatti from './pages/Contatti'

function AppHeader() {
  const location = useLocation()
  const [hasRecentNews, setHasRecentNews] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    checkRecentNews()
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  async function checkRecentNews() {
    const today = new Date()
    const fiveDaysAgo = new Date(today)
    fiveDaysAgo.setDate(today.getDate() - 5)

    const fiveDaysAgoText = fiveDaysAgo.toISOString().slice(0, 10)

    const { data, error } = await supabase
      .from('news')
      .select('id, news_date, created_at')
      .eq('published', true)
      .or(`news_date.gte.${fiveDaysAgoText},created_at.gte.${fiveDaysAgo.toISOString()}`)
      .limit(1)

    if (error) {
      console.error('Errore controllo news recenti:', error)
      setHasRecentNews(false)
      return
    }

    setHasRecentNews((data ?? []).length > 0)
  }

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <>
      <style>{headerResponsiveCss}</style>

      <header className="site-header" style={headerStyle}>
        <Link to="/" style={logoStyle}>
          <img
            src="/images/logo-dojo-yamato.png"
            alt="Logo A.S.D. Dojo Yamato"
            style={logoImageStyle}
          />

          <span style={logoTextWrapperStyle}>
            <span style={logoTitleStyle}>A.S.D. DOJO YAMATO</span>
            <span style={logoSubtitleStyle}>ARTI MARZIALI</span>
          </span>
        </Link>

        <button
          type="button"
          className={`hamburger-button ${menuOpen ? 'is-open' : ''}`}
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Apri menu"
          aria-expanded={menuOpen}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`header-nav ${menuOpen ? 'is-open' : ''}`} style={navStyle}>
          <Link
            to="/news"
            style={{
              ...navLinkStyle,
              ...(hasRecentNews ? newsActiveStyle : {}),
              ...(isActive('/news') && !hasRecentNews ? currentPageStyle : {}),
            }}
          >
            News
          </Link>

          <Link
            to="/"
            style={{
              ...navLinkStyle,
              ...(isActive('/') ? currentPageStyle : {}),
            }}
          >
            Home
          </Link>

          <Link
            to="/chi-siamo"
            style={{
              ...navLinkStyle,
              ...(isActive('/chi-siamo') ? currentPageStyle : {}),
            }}
          >
            Chi siamo
          </Link>

          <Link
            to="/insegnanti"
            style={{
              ...navLinkStyle,
              ...(isActive('/insegnanti') ? currentPageStyle : {}),
            }}
          >
            Insegnanti
          </Link>

          <Link
            to="/corsi"
            style={{
              ...navLinkStyle,
              ...(isActive('/corsi') ? currentPageStyle : {}),
            }}
          >
            Corsi
          </Link>

          <Link
            to="/calendario-eventi"
            style={{
              ...navLinkStyle,
              ...(isActive('/calendario-eventi') ? currentPageStyle : {}),
            }}
          >
            Eventi
          </Link>

          <Link
            to="/galleria"
            style={{
              ...navLinkStyle,
              ...(isActive('/galleria') ? currentPageStyle : {}),
            }}
          >
            Galleria
          </Link>

          <Link
            to="/teoria"
            style={{
              ...navLinkStyle,
              ...(isActive('/teoria') ? currentPageStyle : {}),
            }}
          >
            Teoria
          </Link>

          <Link
            to="/documenti"
            style={{
              ...navLinkStyle,
              ...(isActive('/documenti') ? currentPageStyle : {}),
            }}
          >
            Documenti
          </Link>

          <Link
            to="/contatti"
            style={{
              ...navLinkStyle,
              ...(isActive('/contatti') ? currentPageStyle : {}),
            }}
          >
            Contatti
          </Link>

          <Link
            to="/area-utente"
            style={{
              ...areaUtenteStyle,
              ...(isActive('/area-utente') ? areaUtenteActiveStyle : {}),
            }}
          >
            Area Utente
          </Link>
        </nav>
      </header>
    </>
  )
}

function App() {
  return (
    <>
      <AppHeader />

      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/chi-siamo" element={<ChiSiamo />} />
        <Route path="/insegnanti" element={<Insegnanti />} />
        <Route path="/corsi" element={<Corsi />} />

        <Route path="/calendario-eventi" element={<CalendarioEventi />} />
        <Route path="/calendario-eventi/:eventId" element={<EventoDettaglio />} />

        <Route path="/galleria" element={<Galleria />} />
        <Route path="/galleria/:albumId" element={<GalleriaAlbum />} />

        <Route path="/teoria" element={<Teoria />} />
        <Route path="/teoria/:section" element={<Teoria />} />

        <Route path="/documenti" element={<Documenti />} />
        <Route path="/news" element={<News />} />
        <Route path="/area-utente" element={<AreaUtente />} />
        <Route path="/contatti" element={<Contatti />} />
      </Routes>
    </>
  )
}

const headerResponsiveCss = `
.hamburger-button {
  display: none;
  width: 46px;
  height: 46px;
  border: none;
  border-radius: 999px;
  background: linear-gradient(180deg, #b9444f 0%, #82232b 100%);
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
  box-shadow: 0 8px 18px rgba(80,10,18,0.24);
}

.hamburger-button span {
  display: block;
  width: 22px;
  height: 2px;
  background: white;
  border-radius: 999px;
  margin: 5px auto;
  transition: transform 0.22s ease, opacity 0.22s ease;
}

.hamburger-button.is-open span:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}

.hamburger-button.is-open span:nth-child(2) {
  opacity: 0;
}

.hamburger-button.is-open span:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}

@media (max-width: 1320px) {
  .hamburger-button {
    display: block;
  }

  .header-nav {
    position: absolute;
    top: calc(100% + 1px);
    left: 0;
    right: 0;
    display: none !important;
    flex-direction: column !important;
    align-items: stretch !important;
    justify-content: flex-start !important;
    gap: 8px !important;
    padding: 16px 18px 20px !important;
    background: rgba(21, 25, 37, 0.98);
    border-bottom: 1px solid rgba(255,255,255,0.10);
    box-shadow: 0 18px 36px rgba(0,0,0,0.32);
  }

  .header-nav.is-open {
    display: flex !important;
  }

  .header-nav a {
    width: 100%;
    box-sizing: border-box;
    padding: 13px 16px !important;
    border-radius: 999px;
    background: rgba(255,255,255,0.06);
    text-align: center;
  }

  .header-nav a:last-child {
    margin-top: 6px;
  }
}

@media (max-width: 620px) {
  .site-header {
    padding: 8px 14px !important;
    min-height: 76px !important;
    gap: 10px !important;
  }

  .site-header img {
    width: 58px !important;
    height: 58px !important;
  }
}
`

const headerStyle: CSSProperties = {
  minHeight: '82px',
  background: '#151925',
  borderBottom: '1px solid rgba(255,255,255,0.08)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '24px',
  padding: '10px 22px',
  position: 'sticky',
  top: 0,
  zIndex: 100,
}

const logoStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '14px',
  color: 'white',
  textDecoration: 'none',
  flexShrink: 0,
  minWidth: 0,
}

const logoImageStyle: CSSProperties = {
  width: '68px',
  height: '68px',
  objectFit: 'contain',
  flexShrink: 0,
  transform: 'scale(1.2)',
  transformOrigin: 'center',
}

const logoTextWrapperStyle: CSSProperties = {
  display: 'grid',
  gap: '3px',
  minWidth: 0,
  justifyItems: 'center',
  textAlign: 'center',
}

const logoTitleStyle: CSSProperties = {
  fontSize: '18px',
  fontWeight: 950,
  letterSpacing: '0.8px',
  lineHeight: 1,
  whiteSpace: 'nowrap',
  display: 'block',
  textAlign: 'center',
}

const logoSubtitleStyle: CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  letterSpacing: '2px',
  color: '#d7dbe3',
  whiteSpace: 'nowrap',
  display: 'block',
  textAlign: 'center',
}

const navStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: '18px',
  flexWrap: 'wrap',
}

const navLinkStyle: CSSProperties = {
  color: 'white',
  textDecoration: 'none',
  fontWeight: 850,
  fontSize: '14px',
  lineHeight: 1,
  padding: '8px 0',
}

const currentPageStyle: CSSProperties = {
  color: '#f3dede',
}

const newsActiveStyle: CSSProperties = {
  background: 'linear-gradient(180deg, #b9444f 0%, #82232b 100%)',
  color: 'white',
  padding: '11px 18px',
  borderRadius: '999px',
  boxShadow: '0 8px 18px rgba(80,10,18,0.24)',
}

const areaUtenteStyle: CSSProperties = {
  background: 'linear-gradient(180deg, #b9444f 0%, #82232b 100%)',
  color: 'white',
  textDecoration: 'none',
  padding: '12px 18px',
  borderRadius: '999px',
  fontWeight: 900,
  fontSize: '14px',
  boxShadow: '0 8px 18px rgba(80,10,18,0.24)',
}

const areaUtenteActiveStyle: CSSProperties = {
  outline: '2px solid rgba(255,255,255,0.22)',
}

export default App