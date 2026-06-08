import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Home', end: true },
  { to: '/news', label: 'News' },
  { to: '/chi-siamo', label: 'Chi siamo' },
  { to: '/insegnanti', label: 'Insegnanti' },
  { to: '/corsi', label: 'Corsi' },
  { to: '/calendario-eventi', label: 'Eventi' },
  { to: '/galleria', label: 'Galleria' },
  { to: '/teoria', label: 'Teoria' },
  { to: '/documenti', label: 'Documenti' },
  { to: '/difesa-personale', label: 'Difesa personale' },
  { to: '/contatti', label: 'Contatti' },
  { to: '/area-utente', label: 'Area Utente' },
]

function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

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
          className={`site-menu-button${menuOpen ? ' site-menu-button--open' : ''}`}
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label={menuOpen ? 'Chiudi menu' : 'Apri menu'}
          aria-expanded={menuOpen}
          aria-controls="site-mobile-nav"
        >
          <span className="site-menu-button__line" />
          <span className="site-menu-button__line" />
          <span className="site-menu-button__line" />
        </button>

        <nav
          id="site-mobile-nav"
          className={`site-nav${menuOpen ? ' site-nav--open' : ''}`}
          data-open={menuOpen ? 'true' : 'false'}
          aria-label="Menu principale"
        >
          {navItems.map((item) => (
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
