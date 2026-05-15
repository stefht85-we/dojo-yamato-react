import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div>
          <strong>A.S.D. Dojo Yamato Arti Marziali</strong>
          <p>Karate Shotokan per bambini, ragazzi e adulti.</p>
        </div>

        <div className="site-footer__links">
          <Link to="/contatti">Contatti</Link>
          <Link to="/area-utente">Area Utente</Link>
          <Link to="/area-utente" className="site-footer__admin">Admin</Link>
        </div>
      </div>
    </footer>
  )
}

export default Footer
