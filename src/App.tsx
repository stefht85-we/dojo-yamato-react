import { Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import ChiSiamo from './pages/ChiSiamo'
import Corsi from './pages/Corsi'
import Contatti from './pages/Contatti'
import AreaUtente from './pages/AreaUtente'

function App() {
  return (
    <div>
      {/* MENU */}
      <nav style={{
        display: 'flex',
        gap: '20px',
        padding: '20px',
        background: '#111'
      }}>
        <Link to="/" style={{ color: 'white' }}>Home</Link>
        <Link to="/chi-siamo" style={{ color: 'white' }}>Chi siamo</Link>
        <Link to="/corsi" style={{ color: 'white' }}>Corsi</Link>
        <Link to="/contatti" style={{ color: 'white' }}>Contatti</Link>
        <Link to="/area-utente" style={{ color: 'white' }}>Area Utente</Link>
      </nav>

      {/* PAGINE */}
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