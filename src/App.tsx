import { Route, Routes } from 'react-router-dom'

import './App.css'
import Header from './components/Header'
import Footer from './components/Footer'
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
import Competizioni from './pages/Competizioni'

function App() {
  return (
    <>
      <Header />
      <main className="site-main">
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
          <Route path="/competizioni" element={<Competizioni />} />
        </Routes>
      </main>
      <Footer />
    </>
  )
}

export default App
