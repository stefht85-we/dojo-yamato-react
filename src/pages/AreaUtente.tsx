import { useEffect, useMemo, useState } from 'react'
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

type GalleryAlbum = {
  id: string
  title: string
  description: string | null
  category: string | null
  event_date: string | null
  event_year: number
  cover_image_url: string | null
  visible: boolean
  created_at: string
}

type GalleryMedia = {
  id: string
  album_id: string
  image_url: string
  caption: string | null
  sort_order: number
  created_at: string
  media_type: 'image' | 'video' | 'youtube'
  thumbnail_url: string | null
  video_url: string | null
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

  const [albums, setAlbums] = useState<GalleryAlbum[]>([])
  const [media, setMedia] = useState<GalleryMedia[]>([])

  const [albumTitle, setAlbumTitle] = useState('')
  const [albumDescription, setAlbumDescription] = useState('')
  const [albumCategory, setAlbumCategory] = useState('')
  const [albumYear, setAlbumYear] = useState(new Date().getFullYear().toString())
  const [albumDate, setAlbumDate] = useState('')
  const [albumVisible, setAlbumVisible] = useState(true)
  const [editingAlbumId, setEditingAlbumId] = useState<string | null>(null)

  const [selectedAlbumId, setSelectedAlbumId] = useState('')
  const [galleryFiles, setGalleryFiles] = useState<FileList | null>(null)
  const [galleryInputKey, setGalleryInputKey] = useState(0)

  const [albumYearFilter, setAlbumYearFilter] = useState('all')
  const [youtubeUrl, setYoutubeUrl] = useState('')

  const isAdmin = user?.email === ADMIN_EMAIL

  const selectedAlbum = albums.find((album) => album.id === selectedAlbumId) ?? null

  const selectedAlbumMedia = selectedAlbumId
    ? media.filter((item) => item.album_id === selectedAlbumId)
    : []

  const availableYears = useMemo(() => {
    return Array.from(new Set(albums.map((album) => album.event_year))).sort((a, b) => b - a)
  }, [albums])

  const filteredAlbums = useMemo(() => {
    if (albumYearFilter === 'all') return albums
    return albums.filter((album) => String(album.event_year) === albumYearFilter)
  }, [albums, albumYearFilter])

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

  async function loadAlbums() {
    const { data, error } = await supabase
      .from('gallery_albums')
      .select(
        'id, title, description, category, event_date, event_year, cover_image_url, visible, created_at'
      )
      .order('event_year', { ascending: false })
      .order('event_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (error) {
      setMessage(`Errore caricamento album: ${error.message}`)
      return
    }

    setAlbums(data ?? [])
  }

  async function loadMedia() {
    const { data, error } = await supabase
      .from('gallery_photos')
      .select(
        'id, album_id, image_url, caption, sort_order, created_at, media_type, thumbnail_url, video_url'
      )
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      setMessage(`Errore caricamento media: ${error.message}`)
      return
    }

    setMedia((data ?? []) as GalleryMedia[])
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
      loadAlbums()
      loadMedia()
    }
  }, [isAdmin])

  async function handleSignup(e: FormEvent) {
    e.preventDefault()
    setMessage('Registrazione...')

    const { error } = await supabase.auth.signUp({ email, password })

    if (error) setMessage(error.message)
    else setMessage('Registrazione completata')
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault()
    setMessage('Login...')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) setMessage(error.message)
    else setMessage('Login effettuato')
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

    if (error) setMessage(error.message)
    else setMessage('Profilo salvato')
  }

  async function uploadFileToBucket(file: File, bucket: string, folder: string) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
    const filePath = `${folder}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file)

    if (uploadError) throw uploadError

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

  function resetAlbumForm() {
    setEditingAlbumId(null)
    setAlbumTitle('')
    setAlbumDescription('')
    setAlbumCategory('')
    setAlbumYear(new Date().getFullYear().toString())
    setAlbumDate('')
    setAlbumVisible(true)
  }

  async function handleSaveAlbum(e: FormEvent) {
    e.preventDefault()

    if (!isAdmin) {
      setMessage('Non hai i permessi per gestire la galleria')
      return
    }

    const numericYear = Number(albumYear)

    if (!albumTitle.trim()) {
      setMessage('Inserisci il titolo dell’album')
      return
    }

    if (!numericYear || numericYear < 1900 || numericYear > 2100) {
      setMessage('Inserisci un anno valido')
      return
    }

    setMessage(editingAlbumId ? 'Aggiornamento album...' : 'Creazione album...')

    const payload = {
      title: albumTitle.trim(),
      description: albumDescription.trim() || null,
      category: albumCategory.trim() || null,
      event_year: numericYear,
      event_date: albumDate || null,
      visible: albumVisible,
    }

    if (editingAlbumId) {
      const { error } = await supabase
        .from('gallery_albums')
        .update(payload)
        .eq('id', editingAlbumId)

      if (error) {
        setMessage(`Errore aggiornamento album: ${error.message}`)
        return
      }

      setMessage('Album aggiornato correttamente')
    } else {
      const { data, error } = await supabase
        .from('gallery_albums')
        .insert(payload)
        .select('id')
        .single()

      if (error) {
        setMessage(`Errore creazione album: ${error.message}`)
        return
      }

      if (data?.id) {
        setSelectedAlbumId(data.id)
      }

      setMessage('Album creato correttamente')
    }

    resetAlbumForm()
    loadAlbums()
  }

  function handleEditAlbum(album: GalleryAlbum) {
    setEditingAlbumId(album.id)
    setAlbumTitle(album.title)
    setAlbumDescription(album.description ?? '')
    setAlbumCategory(album.category ?? '')
    setAlbumYear(String(album.event_year))
    setAlbumDate(album.event_date ?? '')
    setAlbumVisible(album.visible)
    setAdminTab('galleria')
    setMessage('Modifica album in corso')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleManageAlbumMedia(album: GalleryAlbum) {
    setSelectedAlbumId(album.id)
    setAdminTab('galleria')
    setGalleryFiles(null)
    setGalleryInputKey((prev) => prev + 1)
    setMessage(`Gestione media album: ${album.title}`)
  }

  async function handleToggleAlbumVisible(album: GalleryAlbum) {
    const { error } = await supabase
      .from('gallery_albums')
      .update({ visible: !album.visible })
      .eq('id', album.id)

    if (error) {
      setMessage(`Errore aggiornamento visibilità album: ${error.message}`)
      return
    }

    setMessage('Visibilità album aggiornata')
    loadAlbums()
  }

  async function handleDeleteAlbum(albumId: string) {
    const confirmDelete = window.confirm(
      'Vuoi davvero eliminare questo album? Verranno eliminati anche tutti i media collegati.'
    )

    if (!confirmDelete) return

    const { error } = await supabase.from('gallery_albums').delete().eq('id', albumId)

    if (error) {
      setMessage(`Errore eliminazione album: ${error.message}`)
      return
    }

    if (selectedAlbumId === albumId) {
      setSelectedAlbumId('')
    }

    setMessage('Album eliminato')
    loadAlbums()
    loadMedia()
  }

  async function handleUploadAlbumMedia(e: FormEvent) {
    e.preventDefault()

    if (!isAdmin) {
      setMessage('Non hai i permessi per gestire la galleria')
      return
    }

    if (!selectedAlbumId) {
      setMessage('Seleziona un album')
      return
    }

    if (!galleryFiles || galleryFiles.length === 0) {
      setMessage('Seleziona una o più immagini/video')
      return
    }

    const album = albums.find((item) => item.id === selectedAlbumId)

    if (!album) {
      setMessage('Album non trovato')
      return
    }

    setMessage(`Caricamento di ${galleryFiles.length} file...`)

    try {
      const filesArray = Array.from(galleryFiles)
      const uploadedMedia: {
        album_id: string
        image_url: string
        video_url: string | null
        thumbnail_url: string | null
        media_type: 'image' | 'video'
        sort_order: number
      }[] = []

      const currentAlbumMedia = media.filter((item) => item.album_id === selectedAlbumId)
      const startOrder = currentAlbumMedia.length

      for (let index = 0; index < filesArray.length; index++) {
        const file = filesArray[index]
        const isVideo = file.type.startsWith('video/')
        const fileUrl = await uploadFileToBucket(file, GALLERY_BUCKET, `albums/${selectedAlbumId}`)

        uploadedMedia.push({
          album_id: selectedAlbumId,
          image_url: fileUrl,
          video_url: isVideo ? fileUrl : null,
          thumbnail_url: null,
          media_type: isVideo ? 'video' : 'image',
          sort_order: startOrder + index,
        })
      }

      const { error: insertError } = await supabase
        .from('gallery_photos')
        .insert(uploadedMedia)

      if (insertError) {
        setMessage(`Errore salvataggio media: ${insertError.message}`)
        return
      }

      const firstImage = uploadedMedia.find((item) => item.media_type === 'image')

      if (!album.cover_image_url && firstImage) {
        const { error: coverError } = await supabase
          .from('gallery_albums')
          .update({ cover_image_url: firstImage.image_url })
          .eq('id', selectedAlbumId)

        if (coverError) {
          setMessage(`Media caricati, ma errore copertina: ${coverError.message}`)
          loadAlbums()
          loadMedia()
          return
        }
      }

      setGalleryFiles(null)
      setGalleryInputKey((prev) => prev + 1)
      setMessage('Media caricati correttamente')
      loadAlbums()
      loadMedia()
    } catch (error) {
      console.error(error)
      setMessage('Errore durante upload media album')
    }
  }

  function getYoutubeId(url: string) {
    const patterns = [
      /youtube\.com\/watch\?v=([^&]+)/,
      /youtu\.be\/([^?&]+)/,
      /youtube\.com\/shorts\/([^?&]+)/,
      /youtube\.com\/embed\/([^?&]+)/,
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match?.[1]) return match[1]
    }

    return null
  }

  async function handleAddYoutubeVideo(e: FormEvent) {
    e.preventDefault()

    if (!isAdmin) {
      setMessage('Non hai i permessi per gestire la galleria')
      return
    }

    if (!selectedAlbumId) {
      setMessage('Seleziona un album')
      return
    }

    const videoId = getYoutubeId(youtubeUrl.trim())

    if (!videoId) {
      setMessage('Inserisci un link YouTube valido')
      return
    }

    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    const currentAlbumMedia = media.filter((item) => item.album_id === selectedAlbumId)

    const { error } = await supabase.from('gallery_photos').insert({
      album_id: selectedAlbumId,
      image_url: youtubeUrl.trim(),
      video_url: youtubeUrl.trim(),
      thumbnail_url: thumbnailUrl,
      media_type: 'youtube',
      sort_order: currentAlbumMedia.length,
    })

    if (error) {
      setMessage(`Errore salvataggio video YouTube: ${error.message}`)
      return
    }

    const album = albums.find((item) => item.id === selectedAlbumId)

    if (album && !album.cover_image_url) {
      await supabase
        .from('gallery_albums')
        .update({ cover_image_url: thumbnailUrl })
        .eq('id', selectedAlbumId)
    }

    setYoutubeUrl('')
    setMessage('Video YouTube aggiunto correttamente')
    loadAlbums()
    loadMedia()
  }

  async function handleDeleteMedia(item: GalleryMedia) {
    const confirmDelete = window.confirm('Vuoi eliminare questo elemento?')
    if (!confirmDelete) return

    const { error } = await supabase.from('gallery_photos').delete().eq('id', item.id)

    if (error) {
      setMessage(`Errore eliminazione media: ${error.message}`)
      return
    }

    const album = albums.find((albumItem) => albumItem.id === item.album_id)
    const itemPreviewUrl = item.thumbnail_url || item.image_url

    if (album?.cover_image_url === itemPreviewUrl || album?.cover_image_url === item.image_url) {
      const remainingMedia = media.filter(
        (mediaItem) => mediaItem.album_id === item.album_id && mediaItem.id !== item.id
      )

      const newCover =
        remainingMedia.find((mediaItem) => mediaItem.media_type === 'image')?.image_url ??
        remainingMedia.find((mediaItem) => mediaItem.thumbnail_url)?.thumbnail_url ??
        null

      await supabase
        .from('gallery_albums')
        .update({ cover_image_url: newCover })
        .eq('id', item.album_id)
    }

    setMessage('Media eliminato')
    loadAlbums()
    loadMedia()
  }

  async function handleSetCover(item: GalleryMedia) {
    const coverUrl = item.media_type === 'youtube'
      ? item.thumbnail_url
      : item.media_type === 'image'
        ? item.image_url
        : null

    if (!coverUrl) {
      setMessage('Per i video caricati non è disponibile una copertina automatica')
      return
    }

    const { error } = await supabase
      .from('gallery_albums')
      .update({ cover_image_url: coverUrl })
      .eq('id', item.album_id)

    if (error) {
      setMessage(`Errore aggiornamento copertina: ${error.message}`)
      return
    }

    setMessage('Copertina album aggiornata')
    loadAlbums()
  }

  function renderTinyMediaPreview(item: GalleryMedia) {
    if (item.media_type === 'youtube') {
      return (
        <div style={tinyMediaPreviewWrapper}>
          <img
            src={item.thumbnail_url ?? ''}
            alt="Anteprima YouTube"
            style={tinyPhotoImage}
          />
          <span style={videoBadge}>YT</span>
        </div>
      )
    }

    if (item.media_type === 'video') {
      return (
        <div style={tinyMediaPreviewWrapper}>
          <video src={item.video_url ?? item.image_url} style={tinyPhotoImage} muted />
          <span style={videoBadge}>▶</span>
        </div>
      )
    }

    return (
      <img
        src={item.image_url}
        alt={item.caption || selectedAlbum?.title || 'Media galleria'}
        style={tinyPhotoImage}
      />
    )
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
              <button type="button" style={tabButton(adminTab === 'news')} onClick={() => setAdminTab('news')}>
                News
              </button>

              <button type="button" style={tabButton(adminTab === 'galleria')} onClick={() => setAdminTab('galleria')}>
                Galleria
              </button>

              <button type="button" style={tabButton(adminTab === 'eventi')} onClick={() => setAdminTab('eventi')}>
                Eventi
              </button>

              <button type="button" style={tabButton(adminTab === 'documenti')} onClick={() => setAdminTab('documenti')}>
                Documenti
              </button>

              <button type="button" style={tabButton(adminTab === 'difesa')} onClick={() => setAdminTab('difesa')}>
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
                        <img src={existingNewsImageUrl} alt="Immagine news attuale" style={previewImageStyle} />
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
                        <button className="secondary-auth-button" type="button" onClick={resetNewsForm}>
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
                          <img src={item.image_url} alt={item.title} style={previewImageStyle} />
                        )}

                        <h4 style={{ marginBottom: '8px' }}>{item.title}</h4>

                        <small style={mutedText}>
                          {item.created_at ? new Date(item.created_at).toLocaleDateString('it-IT') : ''}
                          {' '}—{' '}
                          {item.published ? 'Pubblicata' : 'Bozza'}
                        </small>

                        <p style={mutedText}>
                          {item.content.length > 180
                            ? item.content.substring(0, 180) + '...'
                            : item.content}
                        </p>

                        <div style={actionsRow}>
                          <button type="button" className="secondary-auth-button" onClick={() => handleEditNews(item)}>
                            Modifica
                          </button>

                          <button type="button" className="secondary-auth-button" onClick={() => handleToggleNewsPublished(item)}>
                            {item.published ? 'Metti in bozza' : 'Pubblica'}
                          </button>

                          <button type="button" className="primary-auth-button" onClick={() => handleDeleteNews(item.id)}>
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
                <div style={galleryAdminLayout}>
                  <div style={adminCardStyle}>
                    <h3>{editingAlbumId ? 'Modifica album' : 'Crea nuovo album'}</h3>

                    <form onSubmit={handleSaveAlbum} style={formStyle}>
                      <input
                        type="text"
                        placeholder="Titolo album"
                        value={albumTitle}
                        onChange={(e) => setAlbumTitle(e.target.value)}
                      />

                      <textarea
                        placeholder="Descrizione album"
                        value={albumDescription}
                        onChange={(e) => setAlbumDescription(e.target.value)}
                        rows={4}
                        style={textareaStyle}
                      />

                      <input
                        type="text"
                        placeholder="Categoria, es. Competizioni, Esami, Eventi"
                        value={albumCategory}
                        onChange={(e) => setAlbumCategory(e.target.value)}
                      />

                      <input
                        type="number"
                        placeholder="Anno evento, es. 2026"
                        value={albumYear}
                        onChange={(e) => setAlbumYear(e.target.value)}
                      />

                      <div style={{ display: 'grid', gap: '8px' }}>
                        <label style={mutedText}>Data evento opzionale</label>
                        <input
                          type="date"
                          value={albumDate}
                          onChange={(e) => setAlbumDate(e.target.value)}
                        />
                      </div>

                      <label style={checkboxLabelStyle}>
                        <input
                          type="checkbox"
                          checked={albumVisible}
                          onChange={(e) => setAlbumVisible(e.target.checked)}
                        />
                        Album visibile nella galleria pubblica
                      </label>

                      <div style={actionsRow}>
                        <button className="primary-auth-button" type="submit">
                          {editingAlbumId ? 'Aggiorna album' : 'Crea album'}
                        </button>

                        {editingAlbumId && (
                          <button className="secondary-auth-button" type="button" onClick={resetAlbumForm}>
                            Annulla modifica
                          </button>
                        )}
                      </div>
                    </form>
                  </div>

                  <div style={adminCardStyle}>
                    <h3>Carica immagini o piccoli video</h3>

                    <form onSubmit={handleUploadAlbumMedia} style={formStyle}>
                      <select
                        value={selectedAlbumId}
                        onChange={(e) => setSelectedAlbumId(e.target.value)}
                      >
                        <option value="">Seleziona album</option>
                        {albums.map((album) => (
                          <option key={album.id} value={album.id}>
                            {album.event_year} - {album.title}
                          </option>
                        ))}
                      </select>

                      <input
                        key={galleryInputKey}
                        type="file"
                        accept="image/*,video/mp4,video/webm,video/quicktime"
                        multiple
                        onChange={(e) => setGalleryFiles(e.target.files)}
                      />

                      {galleryFiles && galleryFiles.length > 0 && (
                        <small style={mutedText}>
                          File selezionati: {galleryFiles.length}
                        </small>
                      )}

                      <button className="primary-auth-button" type="submit">
                        Carica file selezionati
                      </button>
                    </form>

                    {selectedAlbum && (
                      <div style={selectedAlbumBox}>
                        <strong>Album selezionato:</strong>
                        <br />
                        {selectedAlbum.title} · {selectedAlbum.event_year}
                        <br />
                        <span style={mutedText}>
                          Media presenti: {selectedAlbumMedia.length}
                        </span>
                      </div>
                    )}

                    <hr style={dividerStyle} />

                    <h4>Aggiungi link YouTube</h4>

                    <form onSubmit={handleAddYoutubeVideo} style={formStyle}>
                      <input
                        type="url"
                        placeholder="Incolla link YouTube"
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                      />

                      <button className="secondary-auth-button" type="submit">
                        Aggiungi YouTube
                      </button>
                    </form>
                  </div>
                </div>

                <div style={{ marginTop: '30px' }}>
                  <div style={albumHeaderRow}>
                    <h3 style={{ margin: 0 }}>Album inseriti</h3>

                    <select
                      value={albumYearFilter}
                      onChange={(e) => setAlbumYearFilter(e.target.value)}
                      style={compactSelectStyle}
                    >
                      <option value="all">Tutti gli anni</option>
                      {availableYears.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>

                  {filteredAlbums.length === 0 && (
                    <p style={mutedText}>Non ci sono album per questo filtro.</p>
                  )}

                  <div style={compactAlbumList}>
                    {filteredAlbums.map((album) => {
                      const albumMedia = media.filter((item) => item.album_id === album.id)

                      return (
                        <article
                          key={album.id}
                          style={{
                            ...compactAlbumCard,
                            border:
                              selectedAlbumId === album.id
                                ? '1px solid rgba(230,57,70,0.85)'
                                : '1px solid rgba(255,255,255,0.10)',
                          }}
                        >
                          <div style={compactAlbumMain}>
                            {album.cover_image_url ? (
                              <img
                                src={album.cover_image_url}
                                alt={album.title}
                                style={compactCoverStyle}
                              />
                            ) : (
                              <div style={compactCoverPlaceholder}>📁</div>
                            )}

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <h4 style={compactAlbumTitle}>{album.title}</h4>

                              <p style={compactAlbumMeta}>
                                {album.event_year}
                                {album.event_date
                                  ? ` · ${new Date(album.event_date).toLocaleDateString('it-IT')}`
                                  : ''}
                                {album.category ? ` · ${album.category}` : ''}
                                {' · '}
                                {album.visible ? 'Visibile' : 'Nascosto'}
                                {' · '}
                                {albumMedia.length} media
                              </p>
                            </div>
                          </div>

                          <div style={compactActionsRow}>
                            <button
                              type="button"
                              className="secondary-auth-button"
                              onClick={() => handleManageAlbumMedia(album)}
                              style={smallAdminButton}
                            >
                              Media
                            </button>

                            <button
                              type="button"
                              className="secondary-auth-button"
                              onClick={() => handleEditAlbum(album)}
                              style={smallAdminButton}
                            >
                              Modifica
                            </button>

                            <button
                              type="button"
                              className="secondary-auth-button"
                              onClick={() => handleToggleAlbumVisible(album)}
                              style={smallAdminButton}
                            >
                              {album.visible ? 'Nascondi' : 'Pubblica'}
                            </button>

                            <button
                              type="button"
                              className="primary-auth-button"
                              onClick={() => handleDeleteAlbum(album.id)}
                              style={smallDangerButton}
                            >
                              Elimina
                            </button>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                </div>

                {selectedAlbum && (
                  <div style={{ ...adminCardStyle, marginTop: '30px' }}>
                    <div style={photoManagerHeader}>
                      <div>
                        <h3 style={{ marginBottom: '6px' }}>
                          Media album: {selectedAlbum.title}
                        </h3>

                        <p style={{ ...mutedText, margin: 0 }}>
                          {selectedAlbum.event_year} · {selectedAlbumMedia.length} elementi
                        </p>
                      </div>

                      <button
                        type="button"
                        className="secondary-auth-button"
                        onClick={() => {
                          setSelectedAlbumId('')
                          setGalleryFiles(null)
                          setYoutubeUrl('')
                          setGalleryInputKey((prev) => prev + 1)
                        }}
                        style={smallAdminButton}
                      >
                        Chiudi
                      </button>
                    </div>

                    {selectedAlbumMedia.length === 0 && (
                      <p style={mutedText}>
                        Questo album non contiene ancora media. Usa il box “Carica immagini o piccoli video”.
                      </p>
                    )}

                    {selectedAlbumMedia.length > 0 && (
                      <div style={tinyPhotoGrid}>
                        {selectedAlbumMedia.map((item) => {
                          const coverUrl =
                            item.media_type === 'youtube'
                              ? item.thumbnail_url
                              : item.media_type === 'image'
                                ? item.image_url
                                : null

                          const isCover = coverUrl && selectedAlbum.cover_image_url === coverUrl

                          return (
                            <div key={item.id} style={tinyPhotoCard}>
                              {renderTinyMediaPreview(item)}

                              {isCover && <span style={coverBadge}>Cover</span>}

                              <div style={tinyPhotoActions}>
                                <button
                                  type="button"
                                  onClick={() => handleSetCover(item)}
                                  style={tinyButton}
                                >
                                  Cover
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteMedia(item)}
                                  style={tinyDeleteButton}
                                >
                                  X
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
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

const galleryAdminLayout: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '20px',
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

const previewImageStyle: CSSProperties = {
  width: '100%',
  maxHeight: '240px',
  objectFit: 'cover',
  borderRadius: '14px',
  marginBottom: '12px',
}

const selectedAlbumBox: CSSProperties = {
  marginTop: '18px',
  padding: '14px',
  borderRadius: '14px',
  background: 'rgba(0,0,0,0.18)',
  color: 'white',
}

const dividerStyle: CSSProperties = {
  border: 'none',
  borderTop: '1px solid rgba(255,255,255,0.12)',
  margin: '22px 0',
}

const albumHeaderRow: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '16px',
  alignItems: 'center',
  flexWrap: 'wrap',
}

const compactSelectStyle: CSSProperties = {
  padding: '10px 14px',
  borderRadius: '999px',
  border: 'none',
  fontWeight: 700,
}

const compactAlbumList: CSSProperties = {
  display: 'grid',
  gap: '8px',
  marginTop: '16px',
}

const compactAlbumCard: CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  borderRadius: '14px',
  padding: '10px',
}

const compactAlbumMain: CSSProperties = {
  display: 'flex',
  gap: '10px',
  alignItems: 'center',
}

const compactCoverStyle: CSSProperties = {
  width: '56px',
  height: '56px',
  objectFit: 'cover',
  borderRadius: '10px',
  flexShrink: 0,
}

const compactCoverPlaceholder: CSSProperties = {
  width: '56px',
  height: '56px',
  borderRadius: '10px',
  flexShrink: 0,
  background: 'rgba(230,57,70,0.18)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '22px',
}

const compactAlbumTitle: CSSProperties = {
  margin: '0 0 3px',
  fontSize: '15px',
  lineHeight: 1.2,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const compactAlbumMeta: CSSProperties = {
  margin: 0,
  color: '#d8d8d8',
  fontSize: '12px',
  lineHeight: 1.35,
}

const compactActionsRow: CSSProperties = {
  display: 'flex',
  gap: '6px',
  flexWrap: 'wrap',
  marginTop: '8px',
}

const smallAdminButton: CSSProperties = {
  padding: '6px 10px',
  fontSize: '12px',
  borderRadius: '999px',
}

const smallDangerButton: CSSProperties = {
  padding: '6px 10px',
  fontSize: '12px',
  borderRadius: '999px',
}

const photoManagerHeader: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '16px',
  alignItems: 'center',
  flexWrap: 'wrap',
  marginBottom: '18px',
}

const tinyPhotoGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(78px, 1fr))',
  gap: '8px',
  marginTop: '16px',
}

const tinyPhotoCard: CSSProperties = {
  position: 'relative',
  background: 'rgba(0,0,0,0.18)',
  borderRadius: '10px',
  padding: '5px',
  border: '1px solid rgba(255,255,255,0.08)',
}

const tinyMediaPreviewWrapper: CSSProperties = {
  position: 'relative',
}

const tinyPhotoImage: CSSProperties = {
  width: '100%',
  height: '56px',
  objectFit: 'cover',
  borderRadius: '7px',
  display: 'block',
  background: '#111',
}

const videoBadge: CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  fontSize: '16px',
  fontWeight: 900,
  textShadow: '0 2px 8px rgba(0,0,0,0.9)',
}

const coverBadge: CSSProperties = {
  position: 'absolute',
  top: '7px',
  left: '7px',
  background: '#e63946',
  color: 'white',
  fontSize: '9px',
  fontWeight: 800,
  borderRadius: '999px',
  padding: '2px 5px',
}

const tinyPhotoActions: CSSProperties = {
  display: 'flex',
  gap: '4px',
  marginTop: '5px',
}

const tinyButton: CSSProperties = {
  flex: 1,
  border: 'none',
  borderRadius: '7px',
  padding: '4px 3px',
  fontSize: '10px',
  fontWeight: 700,
  cursor: 'pointer',
  background: 'white',
  color: '#111',
}

const tinyDeleteButton: CSSProperties = {
  border: 'none',
  borderRadius: '7px',
  padding: '4px 6px',
  fontSize: '10px',
  fontWeight: 800,
  cursor: 'pointer',
  background: '#e63946',
  color: 'white',
}

const userInfoBox: CSSProperties = {
  marginTop: '32px',
  padding: '20px',
  borderRadius: '14px',
  background: 'rgba(255,255,255,0.06)',
  color: '#d8d8d8',
}

export default AreaUtente