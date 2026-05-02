import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'

import { supabase } from './lib/supabaseClient'

import Home from './pages/Home'
import ChiSiamo from './pages/ChiSiamo'
import Corsi from './pages/Corsi'
import Galleria from './pages/Galleria'
import GalleriaAlbum from './pages/GalleriaAlbum'
import CalendarioEventi from './pages/CalendarioEventi'
import EventoDettaglio from './pages/EventoDettaglio'
import Documenti from './pages/Documenti'
import News from './pages/News'
import AreaUtente from './pages/AreaUtente'
import Contatti from './pages/Contatti'

function AppHeader() {
  const location = useLocation()
  const [hasRecentNews, setHasRecentNews] = useState(false)

  useEffect(() => {
    checkRecentNews()
  }, [])

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

  const isActive = (path: string) => location.pathname === path

  return (
    <header style={headerStyle}>
      <Link to="/" style={logoStyle}>
        <span style={logoTitleStyle}>DOJO YAMATO</span>
        <span style={logoSubtitleStyle}>ARTI MARZIALI</span>
      </Link>

      <nav style={navStyle}>
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

        <Link to="/area-utente" style={areaUtenteStyle}>
          Area Utente
        </Link>
      </nav>
    </header>
  )
}

function App() {
  return (
    <>
      <AppHeader />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chi-siamo" element={<ChiSiamo />} />
        <Route path="/corsi" element={<Corsi />} />

        <Route path="/galleria" element={<Galleria />} />
        <Route path="/galleria/:albumId" element={<GalleriaAlbum />} />

        <Route path="/calendario-eventi" element={<CalendarioEventi />} />
        <Route path="/calendario-eventi/:eventId" element={<EventoDettaglio />} />

        <Route path="/documenti" element={<Documenti />} />
        <Route path="/news" element={<News />} />
        <Route path="/area-utente" element={<AreaUtente />} />
        <Route path="/contatti" element={<Contatti />} />
      </Routes>
    </>
  )
}

const headerStyle: CSSProperties = {
  minHeight: '64px',
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
  display: 'grid',
  gap: '1px',
  color: 'white',
  textDecoration: 'none',
  flexShrink: 0,
}

const logoTitleStyle: CSSProperties = {
  fontSize: '20px',
  fontWeight: 950,
  letterSpacing: '1px',
  lineHeight: 1,
}

const logoSubtitleStyle: CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  letterSpacing: '2px',
  color: '#d7dbe3',
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

export default App