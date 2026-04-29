import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

type Tab = 'news' | 'eventi' | 'galleria' | 'documenti'

type NewsItem = {
  id: string
  title: string
  content: string
  created_at: string
}

type GalleryItem = {
  id: string
  title: string
  image_url: string
  created_at: string
}

function Bacheca() {
  const [tab, setTab] = useState<Tab>('news')

  const [news, setNews] = useState<NewsItem[]>([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  const [gallery, setGallery] = useState<GalleryItem[]>([])
  const [imageTitle, setImageTitle] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)

  const [message, setMessage] = useState('')

  async function loadNews() {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setMessage(`Errore caricamento news: ${error.message}`)
      return
    }

    setNews(data ?? [])
  }

  async function loadGallery() {
    const { data, error } = await supabase
      .from('gallery')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setMessage(`Errore caricamento galleria: ${error.message}`)
      return
    }

    setGallery(data ?? [])
  }

  useEffect(() => {
    loadNews()
    loadGallery()
  }, [])

  async function handleAddNews(e: React.FormEvent) {
    e.preventDefault()
    setMessage('Salvataggio news...')

    const { error } = await supabase.from('news').insert({
      title,
      content,
    })

    if (error) {
      setMessage(`Errore salvataggio: ${error.message}`)
      return
    }

    setTitle('')
    setContent('')
    setMessage('News salvata correttamente')
    loadNews()
  }

  function handleEditNews(item: NewsItem) {
    setEditingId(item.id)
    setTitle(item.title)
    setContent(item.content)
    setMessage('Modifica news in corso')
  }

  async function handleUpdateNews(e: React.FormEvent) {
    e.preventDefault()

    if (!editingId) return

    const { error } = await supabase
      .from('news')
      .update({ title, content })
      .eq('id', editingId)

    if (error) {
      setMessage(`Errore modifica: ${error.message}`)
      return
    }

    setEditingId(null)
    setTitle('')
    setContent('')
    setMessage('News aggiornata')
    loadNews()
  }

  async function handleDeleteNews(id: string) {
    const confirmDelete = window.confirm('Vuoi eliminare questa news?')
    if (!confirmDelete) return

    const { error } = await supabase.from('news').delete().eq('id', id)

    if (error) {
      setMessage(`Errore eliminazione: ${error.message}`)
      return
    }

    setMessage('News eliminata')
    loadNews()
  }

  function handleCancelEdit() {
    setEditingId(null)
    setTitle('')
    setContent('')
    setMessage('')
  }

  async function handleUploadImage(e: React.FormEvent) {
    e.preventDefault()

    if (!imageFile) {
      setMessage('Seleziona prima un’immagine')
      return
    }

    setMessage('Caricamento immagine...')

    const fileExt = imageFile.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `gallery/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('gallery')
      .upload(filePath, imageFile)

    if (uploadError) {
      setMessage(`Errore upload: ${uploadError.message}`)
      return
    }

    const { data: publicUrlData } = supabase.storage
      .from('gallery')
      .getPublicUrl(filePath)

    const { error: insertError } = await supabase.from('gallery').insert({
      title: imageTitle,
      image_url: publicUrlData.publicUrl,
    })

    if (insertError) {
      setMessage(`Errore salvataggio immagine: ${insertError.message}`)
      return
    }

    setImageTitle('')
    setImageFile(null)
    setMessage('Immagine caricata correttamente')
    loadGallery()
  }

  return (
    <main style={{ minHeight: '90vh', background: '#0b0f1a', color: 'white', padding: '70px 32px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '30px' }}>Bacheca</h1>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '30px', flexWrap: 'wrap' }}>
          <button onClick={() => setTab('news')} style={tabButton(tab === 'news')}>News</button>
          <button onClick={() => setTab('eventi')} style={tabButton(tab === 'eventi')}>Eventi</button>
          <button onClick={() => setTab('galleria')} style={tabButton(tab === 'galleria')}>Galleria</button>
          <button onClick={() => setTab('documenti')} style={tabButton(tab === 'documenti')}>Documenti</button>
        </div>

        {tab === 'news' && (
          <section>
            <h2>{editingId ? 'Modifica News' : 'Gestione News'}</h2>

            <form
              onSubmit={editingId ? handleUpdateNews : handleAddNews}
              style={formStyle}
            >
              <input
                type="text"
                placeholder="Titolo news"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                style={inputStyle}
              />

              <textarea
                placeholder="Contenuto news"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={5}
                style={inputStyle}
              />

              <button type="submit" style={primaryButton}>
                {editingId ? 'Aggiorna news' : 'Salva news'}
              </button>

              {editingId && (
                <button type="button" onClick={handleCancelEdit} style={secondaryButton}>
                  Annulla modifica
                </button>
              )}
            </form>

            {message && <p style={{ marginTop: '16px' }}>{message}</p>}

            <div style={{ marginTop: '40px' }}>
              <h3>News pubblicate</h3>

              {news.length === 0 && <p>Nessuna news presente.</p>}

              <div style={{ display: 'grid', gap: '16px', marginTop: '20px' }}>
                {news.map((item) => (
                  <div key={item.id} style={cardStyle}>
                    <h3 style={{ marginBottom: '8px' }}>{item.title}</h3>
                    <p style={{ opacity: 0.8 }}>{item.content}</p>

                    <small style={{ opacity: 0.5 }}>
                      {item.created_at
                        ? new Date(item.created_at).toLocaleDateString('it-IT')
                        : ''}
                    </small>

                    <br />

                    <button onClick={() => handleEditNews(item)} style={smallWhiteButton}>
                      Modifica
                    </button>

                    <button onClick={() => handleDeleteNews(item.id)} style={smallRedButton}>
                      Elimina
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {tab === 'galleria' && (
          <section>
            <h2>Gestione Galleria</h2>

            <form onSubmit={handleUploadImage} style={formStyle}>
              <input
                type="text"
                placeholder="Titolo immagine"
                value={imageTitle}
                onChange={(e) => setImageTitle(e.target.value)}
                required
                style={inputStyle}
              />

              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                required
                style={inputStyle}
              />

              <button type="submit" style={primaryButton}>
                Carica immagine
              </button>
            </form>

            {message && <p style={{ marginTop: '16px' }}>{message}</p>}

            <div style={{ marginTop: '40px' }}>
              <h3>Immagini caricate</h3>

              {gallery.length === 0 && <p>Nessuna immagine presente.</p>}

              <div style={galleryGrid}>
                {gallery.map((item) => (
                  <div key={item.id} style={cardStyle}>
                    <img
                      src={item.image_url}
                      alt={item.title}
                      style={{
                        width: '100%',
                        height: '220px',
                        objectFit: 'cover',
                        borderRadius: '12px',
                        marginBottom: '14px',
                      }}
                    />

                    <h3>{item.title}</h3>

                    <small style={{ opacity: 0.5 }}>
                      {item.created_at
                        ? new Date(item.created_at).toLocaleDateString('it-IT')
                        : ''}
                    </small>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {tab === 'eventi' && <h2>Gestione Eventi</h2>}
        {tab === 'documenti' && <h2>Gestione Documenti</h2>}
      </div>
    </main>
  )
}

const tabButton = (active: boolean): React.CSSProperties => ({
  padding: '10px 18px',
  borderRadius: '999px',
  border: 'none',
  cursor: 'pointer',
  fontWeight: 600,
  background: active ? '#e63946' : 'rgba(255,255,255,0.1)',
  color: active ? 'white' : '#ccc',
})

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
  maxWidth: '650px',
  marginTop: '24px',
}

const inputStyle: React.CSSProperties = {
  padding: '14px',
  borderRadius: '10px',
  border: 'none',
  fontSize: '16px',
}

const primaryButton: React.CSSProperties = {
  padding: '14px',
  borderRadius: '999px',
  border: 'none',
  cursor: 'pointer',
  fontWeight: 700,
  background: '#e63946',
  color: 'white',
}

const secondaryButton: React.CSSProperties = {
  ...primaryButton,
  background: 'white',
  color: '#111',
}

const smallWhiteButton: React.CSSProperties = {
  marginTop: '16px',
  marginRight: '10px',
  padding: '10px 16px',
  borderRadius: '999px',
  border: 'none',
  background: 'white',
  color: '#111',
  cursor: 'pointer',
  fontWeight: 700,
}

const smallRedButton: React.CSSProperties = {
  marginTop: '16px',
  padding: '10px 16px',
  borderRadius: '999px',
  border: 'none',
  background: '#e63946',
  color: 'white',
  cursor: 'pointer',
  fontWeight: 700,
}

const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  padding: '22px',
  borderRadius: '16px',
  border: '1px solid rgba(255,255,255,0.08)',
}

const galleryGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: '20px',
  marginTop: '20px',
}

export default Bacheca