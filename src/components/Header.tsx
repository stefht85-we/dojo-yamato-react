import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

const mainNavItems = [
  { to: '/', label: 'HOME', end: true },
  { to: '/news', label: 'NEWS' },
  { to: '/calendario-eventi', label: 'EVENTI' },
]

const aboutNavItems = [
  { to: '/chi-siamo', label: 'CHI SIAMO' },
  { to: '/insegnanti', label: 'INSEGNANTI' },
  { to: '/corsi', label: 'CORSI' },
  { to: '/difesa-personale', label: 'DIFESA PERSONALE' },
  { to: '/competizioni', label: 'COMPETIZIONI' },
]

const mediaNavItems = [
  { to: '/galleria', label: 'GALLERIA' },
  { to: '/teoria', label: 'TEORIA' },
  { to: '/documenti', label: 'DOCUMENTI' },
]

const finalNavItems = [
  { to: '/contatti', label: 'CONTATTI' },
  { to: '/area-utente', label: 'AREA UTENTE' },
]

function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [mediaOpen, setMediaOpen] = useState(false)
  const location = useLocation()

  const closeMenu = () => {
    setMenuOpen(false)
    setAboutOpen(false)
    setMediaOpen(false)
  }

  const isAboutActive = aboutNavItems.some((item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`))
  const isMediaActive = mediaNavItems.some((item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`))

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <NavLink to="/" onClick={closeMenu} className="site-brand" aria-label="Torna alla Home">
          <span className="site-brand__logo">
            <img src="/images/logo-dojo-yamato.png" alt="Logo A.S.D. Dojo Yamato" />
          </span>
          <span className="site-brand__text">
            <strong>A.S.D. DOJO YAMATO</strong>
            <small>ARTI MARZIALI</small>
          </span>
        </NavLink>

        <button
          type="button"
          className="site-menu-button"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label={menuOpen ? 'Chiudi menu' : 'Apri menu'}
          aria-expanded={menuOpen}
        >
          ☰
        </button>

        <nav className={`site-nav ${menuOpen ? 'site-nav--open' : ''}`} aria-label="Menu principale">
          {mainNavItems.slice(0, 2).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={closeMenu}
              className={({ isActive }) => `site-nav__link${isActive ? ' site-nav__link--active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}

          <div
            className={`site-nav__dropdown ${aboutOpen ? 'site-nav__dropdown--open' : ''}`}
            onMouseEnter={() => setAboutOpen(true)}
            onMouseLeave={() => setAboutOpen(false)}
          >
            <button
              type="button"
              className={`site-nav__link site-nav__dropdown-button${isAboutActive || aboutOpen ? ' site-nav__link--active' : ''}`}
              onClick={() => setAboutOpen((prev) => !prev)}
              aria-expanded={aboutOpen}
              aria-haspopup="true"
            >
              CHI SIAMO <span className="site-nav__arrow" aria-hidden="true">▾</span>
            </button>

            <div className="site-nav__dropdown-menu site-nav__dropdown-menu--wide" role="menu">
              {aboutNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={closeMenu}
                  className={({ isActive }) => `site-nav__dropdown-link${isActive ? ' site-nav__dropdown-link--active' : ''}`}
                  role="menuitem"
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>

          <NavLink
            to="/calendario-eventi"
            onClick={closeMenu}
            className={({ isActive }) => `site-nav__link${isActive ? ' site-nav__link--active' : ''}`}
          >
            EVENTI
          </NavLink>

          <div
            className={`site-nav__dropdown ${mediaOpen ? 'site-nav__dropdown--open' : ''}`}
            onMouseEnter={() => setMediaOpen(true)}
            onMouseLeave={() => setMediaOpen(false)}
          >
            <button
              type="button"
              className={`site-nav__link site-nav__dropdown-button${isMediaActive || mediaOpen ? ' site-nav__link--active' : ''}`}
              onClick={() => setMediaOpen((prev) => !prev)}
              aria-expanded={mediaOpen}
              aria-haspopup="true"
            >
              MEDIA <span className="site-nav__arrow" aria-hidden="true">▾</span>
            </button>

            <div className="site-nav__dropdown-menu" role="menu">
              {mediaNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={closeMenu}
                  className={({ isActive }) => `site-nav__dropdown-link${isActive ? ' site-nav__dropdown-link--active' : ''}`}
                  role="menuitem"
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>

          {finalNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={closeMenu}
              className={({ isActive }) => `site-nav__link${isActive ? ' site-nav__link--active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}

          <div className="site-social" aria-label="Social Dojo Yamato">
            <a href="https://www.facebook.com/dojoyamatokarate/" target="_blank" rel="noreferrer" aria-label="Facebook Dojo Yamato">
              <img src="/images/facebook.png" alt="Facebook" />
            </a>
            <a href="https://www.instagram.com/dojoyamatokarate/" target="_blank" rel="noreferrer" aria-label="Instagram Dojo Yamato">
              <img src="/images/instagram.png" alt="Instagram" />
            </a>
          </div>
        </nav>
      </div>
    </header>
  )
}

export default Header
