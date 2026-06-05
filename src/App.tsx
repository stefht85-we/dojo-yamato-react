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
import ApprovedRoute from './components/ApprovedRoute'

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
          <Route path="/galleria" element={<ApprovedRoute><Galleria /></ApprovedRoute>} />
          <Route path="/galleria/:albumId" element={<ApprovedRoute><GalleriaAlbum /></ApprovedRoute>} />
          <Route path="/teoria" element={<ApprovedRoute><Teoria /></ApprovedRoute>} />
          <Route path="/teoria/:section" element={<ApprovedRoute><Teoria /></ApprovedRoute>} />
          <Route path="/news" element={<News />} />
          <Route path="/news/:newsId" element={<NewsDetail />} />
          <Route path="/contatti" element={<Contatti />} />
          <Route path="/area-utente" element={<AreaUtente />} />
          <Route path="/bacheca" element={<ApprovedRoute><Bacheca /></ApprovedRoute>} />
          <Route path="/calendario-eventi" element={<ApprovedRoute><CalendarioEventi /></ApprovedRoute>} />
          <Route path="/eventi/:eventoId" element={<ApprovedRoute><EventoDettaglio /></ApprovedRoute>} />
          <Route path="/documenti" element={<ApprovedRoute><Documenti /></ApprovedRoute>} />
          <Route path="/difesa-personale" element={<DifesaPersonale />} />
        </Routes>
      </main>
      <Footer />
    </>
  )
}

export default App
