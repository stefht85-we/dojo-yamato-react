import { useState } from 'react'
import type { CSSProperties } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'

import Home from './pages/Home'
import ChiSiamo from './pages/ChiSiamo'
import Insegnanti from './pages/Insegnanti'
import Corsi from './pages/Corsi'
import Galleria from './pages/Galleria'
import GalleriaAlbum from './pages/GalleriaAlbum'
import Teoria from './pages/Teoria'
import News from './pages/News'
import NewsDetail from './pages/NewsDetail'
import Contatti from './pages/Contatti'
import AreaUtente from './pages/AreaUtente'
import Bacheca from './pages/Bacheca'
import CalendarioEventi from './pages/CalendarioEventi'
import EventoDettaglio from './pages/EventoDettaglio'
import Documenti from './pages/Documenti'
import DifesaPersonale from './pages/DifesaPersonale'

function App() {
  const [menuOpen, setMenuOpen] = useState(false)

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <>
      <style>{responsiveCss}</style>

      <header style={headerStyle}>
        <div style={headerInnerStyle}>
          <NavLink to="/" onClick={closeMenu} style={brandStyle}>
            <div style={logoBoxStyle}>
              <img
                src="/images/logo-dojo-yamato.png"
                alt="Logo A.S.D. Dojo Yamato"
                style={logoImageStyle}
              />
            </div>

            <div style={brandTextStyle}>
              <div style={brandTitleStyle}>A.S.D. DOJO YAMATO</div>
              <div style={brandSubtitleStyle}>ARTI MARZIALI</div>
            </div>
          </NavLink>

          <button
            type="button"
            className="mobile-menu-button"
            style={mobileMenuButtonStyle}
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Apri menu"
          >
            ☰
          </button>

          <nav className={`site-nav ${menuOpen ? 'site-nav-open' : ''}`} style={navStyle}>
            <HeaderLink to="/" label="Home" onClick={closeMenu} end />
            <HeaderLink to="/news" label="News" onClick={closeMenu} />
            <HeaderLink to="/chi-siamo" label="Chi siamo" onClick={closeMenu} />
            <HeaderLink to="/insegnanti" label="Insegnanti" onClick={closeMenu} />
            <HeaderLink to="/corsi" label="Corsi" onClick={closeMenu} />
            <HeaderLink to="/calendario-eventi" label="Eventi" onClick={closeMenu} />
            <HeaderLink to="/galleria" label="Galleria" onClick={closeMenu} />
            <HeaderLink to="/teoria" label="Teoria" onClick={closeMenu} />
            <HeaderLink to="/documenti" label="Documenti" onClick={closeMenu} />
            <HeaderLink to="/contatti" label="Contatti" onClick={closeMenu} />
            <HeaderLink to="/area-utente" label="Area Utente" onClick={closeMenu} />
          </nav>
        </div>
      </header>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chi-siamo" element={<ChiSiamo />} />
        <Route path="/insegnanti" element={<Insegnanti />} />
        <Route path="/corsi" element={<Corsi />} />
        <Route path="/galleria" element={<Galleria />} />
        <Route path="/galleria/:albumId" element={<GalleriaAlbum />} />
        <Route path="/teoria" element={<Teoria />} />
        <Route path="/teoria/:section" element={<Teoria />} />
        <Route path="/news" element={<News />} />
        <Route path="/news/:newsId" element={<NewsDetail />} />
        <Route path="/contatti" element={<Contatti />} />
        <Route path="/area-utente" element={<AreaUtente />} />
        <Route path="/bacheca" element={<Bacheca />} />
        <Route path="/calendario-eventi" element={<CalendarioEventi />} />
        <Route path="/eventi/:eventoId" element={<EventoDettaglio />} />
        <Route path="/documenti" element={<Documenti />} />
        <Route path="/difesa-personale" element={<DifesaPersonale />} />
      </Routes>
    </>
  )
}

type HeaderLinkProps = {
  to: string
  label: string
  onClick: () => void
  end?: boolean
}

function HeaderLink({ to, label, onClick, end = false }: HeaderLinkProps) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      style={({ isActive }) => ({
        ...navLinkStyle,
        ...(isActive ? activeNavLinkStyle : {}),
      })}
    >
      {label}
    </NavLink>
  )
}

const responsiveCss = `
.mobile-menu-button {
  display: none !important;
}

.site-nav {
  display: flex !important;
}

@media (max-width: 1180px) {
  .mobile-menu-button {
    display: inline-flex !important;
  }

  .site-nav {
    position: absolute !important;
    top: 88px !important;
    left: 16px !important;
    right: 16px !important;
    display: none !important;
    flex-direction: column !important;
    align-items: stretch !important;
    gap: 8px !important;
    padding: 14px !important;
    border-radius: 18px !important;
    background: rgba(11, 15, 26, 0.98) !important;
    border: 1px solid rgba(255,255,255,0.10) !important;
    box-shadow: 0 18px 36px rgba(0,0,0,0.35) !important;
  }

  .site-nav-open {
    display: flex !important;
  }
}

@media (max-width: 700px) {
  .brand-title-responsive {
    font-size: 15px !important;
  }
}
`

const headerStyle: CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 1000,
  background: 'rgba(11, 15, 26, 0.97)',
  borderBottom: '1px solid rgba(255,255,255,0.08)',
  backdropFilter: 'blur(14px)',
}

const headerInnerStyle: CSSProperties = {
  width: 'min(1380px, calc(100% - 28px))',
  minHeight: '88px',
  margin: '0 auto',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '20px',
  position: 'relative',
}

const brandStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '14px',
  textDecoration: 'none',
  color: 'white',
  flexShrink: 0,
}

const logoBoxStyle: CSSProperties = {
  width: '78px',
  height: '78px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  flexShrink: 0,
  background: 'transparent',
}

const logoImageStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  transform: 'scale(1.18)',
  display: 'block',
  background: 'transparent',
}

const brandTextStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  lineHeight: 1.05,
  textAlign: 'center',
}

const brandTitleStyle: CSSProperties = {
  fontSize: '19px',
  fontWeight: 900,
  letterSpacing: '2.2px',
  color: '#ffffff',
}

const brandSubtitleStyle: CSSProperties = {
  fontSize: '11px',
  fontWeight: 800,
  letterSpacing: '2.4px',
  color: '#e5e7eb',
  marginTop: '2px',
}

const navStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: '8px',
  flexWrap: 'wrap',
}

const navLinkStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '40px',
  padding: '0 14px',
  borderRadius: '999px',
  color: 'white',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: 800,
  transition: 'all 0.2s ease',
}

const activeNavLinkStyle: CSSProperties = {
  background: 'linear-gradient(180deg, #d94a57 0%, #8f2430 100%)',
  boxShadow: '0 8px 20px rgba(143, 36, 48, 0.35)',
}

const mobileMenuButtonStyle: CSSProperties = {
  width: '46px',
  height: '46px',
  borderRadius: '12px',
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(255,255,255,0.08)',
  color: 'white',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '24px',
  cursor: 'pointer',
  flexShrink: 0,
}

export default App
