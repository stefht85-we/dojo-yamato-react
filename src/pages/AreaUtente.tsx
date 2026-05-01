import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { User } from '@supabase/supabase-js'
import type { CSSProperties, FormEvent } from 'react'
import './AreaUtente.css'

const ADMIN_EMAIL = 'stefht85@hotmail.com'
const NEWS_BUCKET = 'news-images'
const GALLERY_BUCKET = 'gallery'

type AdminTab = 'news' | 'galleria' | 'eventi' | 'documenti' | 'difesa'

type NewsItem = {
  id: string
  title: string
  content: string
  image_url: string | null
  published: boolean
  created_at: string
}

type GalleryItem = {
  id: string
  title: string
  image_url: string
  created_at: string
}

function AreaUtente() {
  const [user, setUser] = useState<User | null>(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nome, setNome] = useState('')
  const [cognome, setCognome] = useState('')
  const [message, setMessage] = useState('')

  const [adminTab, setAdminTab] = useState<AdminTab>('news')

  const [newsList, setNewsList] = useState<NewsItem[]>([])
  const [newsTitle, setNewsTitle] = useState('')
  const [newsContent, setNewsContent] = useState('')
  const [newsPublished, setNewsPublished] = useState(true)
  const [newsImageFile, setNewsImageFile] = useState<File | null>(null)
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null)
  const [existingNewsImageUrl, setExistingNewsImageUrl] = useState<string | null>(null)
  const [newsInputKey, setNewsInputKey] = useState(0)

  const [galleryList, setGalleryList] = useState<GalleryItem[]>([])
  const [galleryTitle, setGalleryTitle] = useState('')
  const [galleryFile, setGalleryFile] = useState<File | null>(null)
  const [galleryInputKey, setGalleryInputKey] = useState(0)

  const isAdmin = user?.email === ADMIN_EMAIL

  async function loadProfile(currentUser: User) {
    await supabase.from('profiles').upsert({
      id: currentUser.id,
      email: currentUser.email,
    })

    const { data } = await supabase
      .from('profiles')
      .select('nome, cognome')
      .eq('id', currentUser.id)
      .single()

    if (data) {
      setNome(data.nome ?? '')
      setCognome(data.cognome ?? '')
    }
  }

  async function loadNews() {
    const { data, error } = await supabase
      .from('news')
      .select('id, title, content, image_url, published, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      setMessage(`Errore caricamento news: ${error.message}`)
      return
    }

    setNewsList(data ?? [])
  }

  async function loadGallery() {
    const { data, error } = await supabase
      .from('gallery')
      .select('id, title, image_url, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      setMessage(`Errore caricamento galleria: ${error.message}`)
      return
    }

    setGalleryList(data ?? [])
  }

  useEffect(() => {
    async function getUser() {
      const { data } = await supabase.auth.getUser()
      const currentUser = data.user

      setUser(currentUser)

      if (currentUser) {
        loadProfile(currentUser)
      }
    }

    getUser()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (currentUser) {
        loadProfile(currentUser)
      }
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (isAdmin) {
      loadNews()
      loadGallery()
    }
  }, [isAdmin])

  async function handleSignup(e: FormEvent) {
    e.preventDefault()
    setMessage('Registrazione...')

    const { error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Registrazione completata')
    }
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault()
    setMessage('Login...')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Login effettuato')
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
    setMessage('')
  }

  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault()

    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .update({ nome, cognome })
      .eq('id', user.id)

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Profilo salvato')
    }
  }

  async function uploadFileToBucket(file: File, bucket: string, folder: string) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
    const filePath = `${folder}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file)

    if (uploadError) {
      throw uploadError
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)

    return data.publicUrl
  }

  async function handleSaveNews(e: FormEvent) {
    e.preventDefault()

    if (!isAdmin) {
      setMessage('Non hai i permessi per gestire le news')
      return
    }

    if (!newsTitle.trim() || !newsContent.trim()) {
      setMessage('Inserisci titolo e contenuto della news')
      return
    }

    setMessage(editingNewsId ? 'Aggiornamento news...' : 'Salvataggio news...')

    try {
      let finalImageUrl = existingNewsImageUrl

      if (newsImageFile) {
        finalImageUrl = await uploadFileToBucket(newsImageFile, NEWS_BUCKET, 'news')
      }

      if (editingNewsId) {
        const { error } = await supabase
          .from('news')
          .update({
            title: newsTitle.trim(),
            content: newsContent.trim(),
            image_url: finalImageUrl,
            published: newsPublished,
          })
          .eq('id', editingNewsId)

        if (error) {
          setMessage(`Errore modifica news: ${error.message}`)
          return
        }

        setMessage('News aggiornata correttamente')
      } else {
        const { error } = await supabase.from('news').insert({
          title: newsTitle.trim(),
          content: newsContent.trim(),
          image_url: finalImageUrl,
          published: newsPublished,
        })

        if (error) {
          setMessage(`Errore salvataggio news: ${error.message}`)
          return
        }

        setMessage('News salvata correttamente')
      }

      resetNewsForm()
      loadNews()
    } catch (error) {
      console.error(error)
      setMessage('Errore durante upload immagine o salvataggio news')
    }
  }

  function handleEditNews(item: NewsItem) {
    setEditingNewsId(item.id)
    setNewsTitle(item.title)
    setNewsContent(item.content)
    setNewsPublished(item.published)
    setExistingNewsImageUrl(item.image_url)
    setNewsImageFile(null)
    setNewsInputKey((prev) => prev + 1)
    setAdminTab('news')
    setMessage('Modifica news in corso')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function resetNewsForm() {
    setEditingNewsId(null)
    setNewsTitle('')
    setNewsContent('')
    setNewsPublished(true)
    setNewsImageFile(null)
    setExistingNewsImageUrl(null)
    setNewsInputKey((prev) => prev + 1)
  }

  async function handleDeleteNews(id: string) {
    const confirmDelete = window.confirm('Vuoi eliminare questa news?')
    if (!confirmDelete) return

    const { error } = await supabase.from('news').delete().eq('id', id)

    if (error) {
      setMessage(`Errore eliminazione news: ${error.message}`)
      return
    }

    setMessage('News eliminata')
    loadNews()
  }

  async function handleToggleNewsPublished(item: NewsItem) {
    const { error } = await supabase
      .from('news')
      .update({ published: !item.published })
      .eq('id', item.id)

    if (error) {
      setMessage(`Errore aggiornamento pubblicazione: ${error.message}`)
      return
    }

    setMessage('Stato pubblicazione aggiornato')
    loadNews()
  }

  async function handleUploadGallery(e: FormEvent) {
    e.preventDefault()

    if (!isAdmin) {
      setMessage('Non hai i permessi per gestire la galleria')
      return
    }

    if (!galleryTitle.trim()) {
      setMessage('Inserisci il titolo immagine')
      return
    }

    if (!galleryFile) {
      setMessage('Seleziona prima un’immagine')
      return
    }

    setMessage('Caricamento immagine...')

    try {
      const imageUrl = await uploadFileToBucket(galleryFile, GALLERY_BUCKET, 'gallery')

      const { error } = await supabase.from('gallery').insert({
        title: galleryTitle.trim(),
        image_url: imageUrl,
      })

      if (error) {
        setMessage(`Errore salvataggio immagine: ${error.message}`)
        return
      }

      setGalleryTitle('')
      setGalleryFile(null)
      setGalleryInputKey((prev) => prev + 1)
      setMessage('Immagine caricata correttamente')
      loadGallery()
    } catch (error) {
      console.error(error)
      setMessage('Errore durante upload immagine galleria')
    }
  }

  async function handleDeleteGallery(id: string) {
    const confirmDelete = window.confirm('Vuoi eliminare questa immagine dalla galleria?')
    if (!confirmDelete) return

    const { error } = await supabase.from('gallery').delete().eq('id', id)

    if (error) {
      setMessage(`Errore eliminazione immagine: ${error.message}`)
      return
    }

    setMessage('Immagine eliminata')
    loadGallery()
  }

  if (!user) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Accesso Dojo Yamato</h1>

          <form
            onSubmit={handleLogin}
            style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
          >
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button className="primary-auth-button" type="submit">
              Login
            </button>

            <button
              className="secondary-auth-button"
              type="button"
              onClick={handleSignup}
            >
              Registrati
            </button>
          </form>

          {message && <p style={{ marginTop: '16px' }}>{message}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="profile-layout">
      <div className="profile-card">
        <h1>Area Utente</h1>

        <p>
          Loggato come: <strong>{user.email}</strong>
        </p>

        <form
          onSubmit={handleSaveProfile}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            marginTop: '20px',
          }}
        >
          <input
            type="text"
            placeholder="Nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />

          <input
            type="text"
            placeholder="Cognome"
            value={cognome}
            onChange={(e) => setCognome(e.target.value)}
          />

          <button className="primary-auth-button" type="submit">
            Salva profilo
          </button>
        </form>

        {isAdmin && (
          <section style={adminSectionStyle}>
            <p style={adminLabelStyle}>Pannello amministratore</p>
            <h2 style={{ marginTop: 0 }}>Gestione contenuti sito</h2>

            <div style={tabsWrapper}>
              <button
                type="button"
                style={tabButton(adminTab === 'news')}
                onClick={() => setAdminTab('news')}
              >
                News
              </button>

              <button
                type="button"
                style={tabButton(adminTab === 'galleria')}
                onClick={() => setAdminTab('galleria')}
              >
                Galleria
              </button>

              <button
                type="button"
                style={tabButton(adminTab === 'eventi')}
                onClick={() => setAdminTab('eventi')}
              >
                Eventi
              </button>

              <button
                type="button"
                style={tabButton(adminTab === 'documenti')}
                onClick={() => setAdminTab('documenti')}
              >
                Documenti
              </button>

              <button
                type="button"
                style={tabButton(adminTab === 'difesa')}
                onClick={() => setAdminTab('difesa')}
              >
                Difesa personale
              </button>
            </div>

            {message && <div style={messageBox}>{message}</div>}

            {adminTab === 'news' && (
              <div>
                <div style={adminCardStyle}>
                  <h3>{editingNewsId ? 'Modifica News' : 'Crea nuova News'}</h3>

                  <form onSubmit={handleSaveNews} style={formStyle}>
                    <input
                      type="text"
                      placeholder="Titolo news"
                      value={newsTitle}
                      onChange={(e) => setNewsTitle(e.target.value)}
                    />

                    <textarea
                      placeholder="Contenuto news"
                      value={newsContent}
                      onChange={(e) => setNewsContent(e.target.value)}
                      rows={6}
                      style={textareaStyle}
                    />

                    {existingNewsImageUrl && (
                      <div>
                        <p style={mutedText}>Immagine attuale:</p>
                        <img
                          src={existingNewsImageUrl}
                          alt="Immagine news attuale"
                          style={previewImageStyle}
                        />
                      </div>
                    )}

                    <div style={{ display: 'grid', gap: '8px' }}>
                      <label style={mutedText}>Immagine news opzionale</label>
                      <input
                        key={newsInputKey}
                        type="file"
                        accept="image/*"
                        onChange={(e) => setNewsImageFile(e.target.files?.[0] ?? null)}
                      />

                      {newsImageFile && (
                        <small style={mutedText}>
                          File selezionato: {newsImageFile.name}
                        </small>
                      )}
                    </div>

                    <label style={checkboxLabelStyle}>
                      <input
                        type="checkbox"
                        checked={newsPublished}
                        onChange={(e) => setNewsPublished(e.target.checked)}
                      />
                      Pubblica subito la news
                    </label>

                    <div style={actionsRow}>
                      <button className="primary-auth-button" type="submit">
                        {editingNewsId ? 'Aggiorna news' : 'Salva news'}
                      </button>

                      {editingNewsId && (
                        <button
                          className="secondary-auth-button"
                          type="button"
                          onClick={resetNewsForm}
                        >
                          Annulla modifica
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                <div style={{ marginTop: '30px' }}>
                  <h3>News inserite</h3>

                  {newsList.length === 0 && (
                    <p style={mutedText}>Non ci sono ancora news inserite.</p>
                  )}

                  <div style={listGrid}>
                    {newsList.map((item) => (
                      <article key={item.id} style={adminCardStyle}>
                        {item.image_url && (
                          <img
                            src={item.image_url}
                            alt={item.title}
                            style={previewImageStyle}
                          />
                        )}

                        <h4 style={{ marginBottom: '8px' }}>{item.title}</h4>

                        <small style={mutedText}>
                          {item.created_at
                            ? new Date(item.created_at).toLocaleDateString('it-IT')
                            : ''}
                          {' '}—{' '}
                          {item.published ? 'Pubblicata' : 'Bozza'}
                        </small>

                        <p style={mutedText}>
                          {item.content.length > 180
                            ? item.content.substring(0, 180) + '...'
                            : item.content}
                        </p>

                        <div style={actionsRow}>
                          <button
                            type="button"
                            className="secondary-auth-button"
                            onClick={() => handleEditNews(item)}
                          >
                            Modifica
                          </button>

                          <button
                            type="button"
                            className="secondary-auth-button"
                            onClick={() => handleToggleNewsPublished(item)}
                          >
                            {item.published ? 'Metti in bozza' : 'Pubblica'}
                          </button>

                          <button
                            type="button"
                            className="primary-auth-button"
                            onClick={() => handleDeleteNews(item.id)}
                          >
                            Elimina
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {adminTab === 'galleria' && (
              <div>
                <div style={adminCardStyle}>
                  <h3>Carica immagine in Galleria</h3>

                  <form onSubmit={handleUploadGallery} style={formStyle}>
                    <input
                      type="text"
                      placeholder="Titolo immagine"
                      value={galleryTitle}
                      onChange={(e) => setGalleryTitle(e.target.value)}
                    />

                    <input
                      key={galleryInputKey}
                      type="file"
                      accept="image/*"
                      onChange={(e) => setGalleryFile(e.target.files?.[0] ?? null)}
                    />

                    {galleryFile && (
                      <small style={mutedText}>
                        File selezionato: {galleryFile.name}
                      </small>
                    )}

                    <button className="primary-auth-button" type="submit">
                      Carica immagine
                    </button>
                  </form>
                </div>

                <div style={{ marginTop: '30px' }}>
                  <h3>Immagini caricate</h3>

                  {galleryList.length === 0 && (
                    <p style={mutedText}>Non ci sono ancora immagini in galleria.</p>
                  )}

                  <div style={galleryGrid}>
                    {galleryList.map((item) => (
                      <article key={item.id} style={adminCardStyle}>
                        <img
                          src={item.image_url}
                          alt={item.title}
                          style={galleryImageStyle}
                        />

                        <h4>{item.title}</h4>

                        <small style={mutedText}>
                          {item.created_at
                            ? new Date(item.created_at).toLocaleDateString('it-IT')
                            : ''}
                        </small>

                        <div style={actionsRow}>
                          <button
                            type="button"
                            className="primary-auth-button"
                            onClick={() => handleDeleteGallery(item.id)}
                          >
                            Elimina
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {adminTab === 'eventi' && (
              <div style={adminCardStyle}>
                <h3>Gestione Eventi</h3>
                <p style={mutedText}>
                  Qui nel prossimo step aggiungeremo il caricamento degli eventi:
                  titolo, data, luogo, descrizione e pubblicazione nella pagina Calendario eventi.
                </p>
              </div>
            )}

            {adminTab === 'documenti' && (
              <div style={adminCardStyle}>
                <h3>Gestione Documenti</h3>
                <p style={mutedText}>
                  Qui nel prossimo step aggiungeremo upload PDF/documenti, categoria,
                  titolo e visualizzazione nella pagina Documenti.
                </p>
              </div>
            )}

            {adminTab === 'difesa' && (
              <div style={adminCardStyle}>
                <h3>Gestione Difesa personale</h3>
                <p style={mutedText}>
                  Qui potremo caricare contenuti dedicati alla difesa personale:
                  testi, immagini, PDF o comunicazioni specifiche.
                </p>
              </div>
            )}
          </section>
        )}

        {!isAdmin && (
          <div style={userInfoBox}>
            Area personale utente. I contenuti amministrativi sono visibili solo
            all’admin.
          </div>
        )}

        <button
          style={{ marginTop: '30px' }}
          className="secondary-auth-button"
          onClick={handleLogout}
        >
          Logout
        </button>

        {!isAdmin && message && <p style={{ marginTop: '16px' }}>{message}</p>}
      </div>
    </div>
  )
}

const adminSectionStyle: CSSProperties = {
  marginTop: '42px',
  paddingTop: '32px',
  borderTop: '1px solid rgba(255,255,255,0.12)',
}

const adminLabelStyle: CSSProperties = {
  color: '#e63946',
  fontWeight: 800,
  letterSpacing: '2px',
  textTransform: 'uppercase',
}

const tabsWrapper: CSSProperties = {
  display: 'flex',
  gap: '10px',
  flexWrap: 'wrap',
  margin: '22px 0',
}

const tabButton = (active: boolean): CSSProperties => ({
  padding: '10px 16px',
  borderRadius: '999px',
  border: 'none',
  cursor: 'pointer',
  fontWeight: 700,
  background: active ? '#e63946' : 'rgba(255,255,255,0.10)',
  color: active ? 'white' : '#d8d8d8',
})

const adminCardStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: '18px',
  padding: '22px',
}

const formStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
  marginTop: '18px',
}

const textareaStyle: CSSProperties = {
  borderRadius: '12px',
  padding: '14px',
  border: '1px solid rgba(255,255,255,0.16)',
  resize: 'vertical',
  fontFamily: 'inherit',
}

const mutedText: CSSProperties = {
  color: '#d8d8d8',
  lineHeight: 1.6,
}

const checkboxLabelStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  color: '#d8d8d8',
}

const actionsRow: CSSProperties = {
  display: 'flex',
  gap: '12px',
  flexWrap: 'wrap',
  marginTop: '14px',
}

const messageBox: CSSProperties = {
  background: 'rgba(230,57,70,0.14)',
  border: '1px solid rgba(230,57,70,0.35)',
  padding: '14px 16px',
  borderRadius: '14px',
  color: '#ffdede',
  marginBottom: '20px',
}

const listGrid: CSSProperties = {
  display: 'grid',
  gap: '16px',
  marginTop: '16px',
}

const galleryGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '18px',
  marginTop: '16px',
}

const previewImageStyle: CSSProperties = {
  width: '100%',
  maxHeight: '240px',
  objectFit: 'cover',
  borderRadius: '14px',
  marginBottom: '12px',
}

const galleryImageStyle: CSSProperties = {
  width: '100%',
  height: '200px',
  objectFit: 'cover',
  borderRadius: '14px',
  marginBottom: '12px',
}

const userInfoBox: CSSProperties = {
  marginTop: '32px',
  padding: '20px',
  borderRadius: '14px',
  background: 'rgba(255,255,255,0.06)',
  color: '#d8d8d8',
}

export default AreaUtente