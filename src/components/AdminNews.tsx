import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'

const ADMIN_EMAIL = 'stefht85@hotmail.com'
const NEWS_MEDIA_BUCKET = 'news-media'

type MediaType = 'image' | 'video' | 'pdf' | 'youtube' | 'social'

type NewsItem = {
  id: string
  title: string
  content: string
  image_url: string | null
  published: boolean
  news_date: string | null
  created_at: string
}

type NewsMedia = {
  id: string
  news_id: string
  media_type: MediaType
  title: string | null
  url: string
  thumbnail_url: string | null
  sort_order: number | null
  created_at: string
}

function AdminNews() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [message, setMessage] = useState('')

  const [newsList, setNewsList] = useState<NewsItem[]>([])
  const [newsMedia, setNewsMedia] = useState<NewsMedia[]>([])

  const [selectedNewsId, setSelectedNewsId] = useState('')
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null)

  const [newsTitle, setNewsTitle] = useState('')
  const [newsContent, setNewsContent] = useState('')
  const [newsDate, setNewsDate] = useState(new Date().toISOString().slice(0, 10))
  const [newsPublished, setNewsPublished] = useState(true)

  const [newsMediaFiles, setNewsMediaFiles] = useState<FileList | null>(null)
  const [newsMediaInputKey, setNewsMediaInputKey] = useState(0)

  const [newsYoutubeUrl, setNewsYoutubeUrl] = useState('')
  const [newsSocialUrl, setNewsSocialUrl] = useState('')
  const [newsSocialPreviewFile, setNewsSocialPreviewFile] = useState<File | null>(null)
  const [newsSocialPreviewInputKey, setNewsSocialPreviewInputKey] = useState(0)

  const selectedNews = useMemo(() => {
    return newsList.find((item) => item.id === selectedNewsId) ?? null
  }, [newsList, selectedNewsId])

  const selectedNewsMedia = useMemo(() => {
    if (!selectedNewsId) return []
    return newsMedia.filter((item) => item.news_id === selectedNewsId)
  }, [newsMedia, selectedNewsId])

  useEffect(() => {
    async function checkUser() {
      const { data } = await supabase.auth.getUser()
      const currentUser = data.user
      const admin = currentUser?.email === ADMIN_EMAIL
      setIsAdmin(admin)

      if (admin) {
        loadNews()
        loadNewsMedia()
      }
    }

    checkUser()
  }, [])

  async function loadNews() {
    const { data, error } = await supabase
      .from('news')
      .select('id, title, content, image_url, published, news_date, created_at')
      .order('news_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (error) {
      setMessage(`Errore caricamento news: ${error.message}`)
      return
    }

    setNewsList((data ?? []) as NewsItem[])
  }

  async function loadNewsMedia() {
    const { data, error } = await supabase
      .from('news_media')
      .select('id, news_id, media_type, title, url, thumbnail_url, sort_order, created_at')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      setMessage(`Errore caricamento media news: ${error.message}`)
      return
    }

    setNewsMedia((data ?? []) as NewsMedia[])
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

  function resetNewsForm() {
    setEditingNewsId(null)
    setNewsTitle('')
    setNewsContent('')
    setNewsDate(new Date().toISOString().slice(0, 10))
    setNewsPublished(true)
  }

  async function handleSaveNews(e: FormEvent) {
    e.preventDefault()

    if (!isAdmin) {
      setMessage('Non hai i permessi per gestire le news')
      return
    }

    if (!newsTitle.trim()) {
      setMessage('Inserisci il titolo della news')
      return
    }

    if (!newsContent.trim()) {
      setMessage('Inserisci il testo della news')
      return
    }

    if (!newsDate) {
      setMessage('Inserisci la data della news')
      return
    }

    setMessage(editingNewsId ? 'Aggiornamento news...' : 'Creazione news...')

    const payload = {
      title: newsTitle.trim(),
      content: newsContent.trim(),
      news_date: newsDate,
      published: newsPublished,
    }

    if (editingNewsId) {
      const { error } = await supabase.from('news').update(payload).eq('id', editingNewsId)

      if (error) {
        setMessage(`Errore aggiornamento news: ${error.message}`)
        return
      }

      setMessage('News aggiornata correttamente')
    } else {
      const { data, error } = await supabase
        .from('news')
        .insert(payload)
        .select('id')
        .single()

      if (error) {
        setMessage(`Errore creazione news: ${error.message}`)
        return
      }

      if (data?.id) setSelectedNewsId(data.id)
      setMessage('News creata correttamente. Ora puoi aggiungere foto, video, PDF o link.')
    }

    resetNewsForm()
    loadNews()
  }

  function handleEditNews(item: NewsItem) {
    setEditingNewsId(item.id)
    setNewsTitle(item.title)
    setNewsContent(item.content)
    setNewsDate(item.news_date ?? item.created_at.slice(0, 10))
    setNewsPublished(item.published)
    setSelectedNewsId(item.id)
    setMessage('Modifica news in corso')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleDeleteNews(id: string) {
    const confirmDelete = window.confirm('Vuoi eliminare questa news? Verranno eliminati anche i media collegati.')
    if (!confirmDelete) return

    const { error } = await supabase.from('news').delete().eq('id', id)

    if (error) {
      setMessage(`Errore eliminazione news: ${error.message}`)
      return
    }

    if (selectedNewsId === id) setSelectedNewsId('')

    setMessage('News eliminata')
    loadNews()
    loadNewsMedia()
  }

  async function handleToggleNewsPublished(item: NewsItem) {
    const { error } = await supabase
      .from('news')
      .update({ published: !item.published })
      .eq('id', item.id)

    if (error) {
      setMessage(`Errore aggiornamento visibilità news: ${error.message}`)
      return
    }

    setMessage('Visibilità news aggiornata')
    loadNews()
  }

  async function handleUploadNewsMedia(e: FormEvent) {
    e.preventDefault()

    if (!isAdmin) {
      setMessage('Non hai i permessi per gestire le news')
      return
    }

    if (!selectedNewsId) {
      setMessage('Seleziona una news')
      return
    }

    if (!newsMediaFiles || newsMediaFiles.length === 0) {
      setMessage('Seleziona uno o più file')
      return
    }

    setMessage(`Caricamento di ${newsMediaFiles.length} file...`)

    try {
      const filesArray = Array.from(newsMediaFiles)
      const currentNewsMedia = newsMedia.filter((item) => item.news_id === selectedNewsId)
      const startOrder = currentNewsMedia.length

      const uploadedMedia: {
        news_id: string
        media_type: MediaType
        title: string | null
        url: string
        thumbnail_url: string | null
        sort_order: number
      }[] = []

      for (let index = 0; index < filesArray.length; index++) {
        const file = filesArray[index]
        const fileName = file.name.toLowerCase()
        const isImage = file.type.startsWith('image/')
        const isVideo = file.type.startsWith('video/')
        const isPdf = file.type === 'application/pdf' || fileName.endsWith('.pdf')

        if (!isImage && !isVideo && !isPdf) {
          setMessage(`File non consentito: ${file.name}. Puoi caricare solo immagini, video o PDF.`)
          return
        }

        const mediaType: MediaType = isImage ? 'image' : isVideo ? 'video' : 'pdf'
        const fileUrl = await uploadFileToBucket(file, NEWS_MEDIA_BUCKET, `news/${selectedNewsId}`)

        uploadedMedia.push({
          news_id: selectedNewsId,
          media_type: mediaType,
          title: file.name,
          url: fileUrl,
          thumbnail_url: null,
          sort_order: startOrder + index,
        })
      }

      const { error } = await supabase.from('news_media').insert(uploadedMedia)

      if (error) {
        setMessage(`Errore salvataggio media news: ${error.message}`)
        return
      }

      const selectedItem = newsList.find((item) => item.id === selectedNewsId)
      const firstImage = uploadedMedia.find((item) => item.media_type === 'image')

      if (selectedItem && !selectedItem.image_url && firstImage) {
        await supabase
          .from('news')
          .update({ image_url: firstImage.url })
          .eq('id', selectedNewsId)
      }

      setNewsMediaFiles(null)
      setNewsMediaInputKey((prev) => prev + 1)
      setMessage('File caricati correttamente')
      loadNews()
      loadNewsMedia()
    } catch (error) {
      console.error(error)

      if (error instanceof Error) {
        setMessage(`Errore durante upload file news: ${error.message}`)
      } else {
        setMessage('Errore durante upload file news')
      }
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

    if (!selectedNewsId) {
      setMessage('Seleziona una news')
      return
    }

    const videoId = getYoutubeId(newsYoutubeUrl.trim())

    if (!videoId) {
      setMessage('Inserisci un link YouTube valido')
      return
    }

    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    const currentNewsMedia = newsMedia.filter((item) => item.news_id === selectedNewsId)

    const { error } = await supabase.from('news_media').insert({
      news_id: selectedNewsId,
      media_type: 'youtube',
      title: 'YouTube',
      url: newsYoutubeUrl.trim(),
      thumbnail_url: thumbnailUrl,
      sort_order: currentNewsMedia.length,
    })

    if (error) {
      setMessage(`Errore salvataggio video YouTube: ${error.message}`)
      return
    }

    const selectedItem = newsList.find((item) => item.id === selectedNewsId)

    if (selectedItem && !selectedItem.image_url) {
      await supabase.from('news').update({ image_url: thumbnailUrl }).eq('id', selectedNewsId)
    }

    setNewsYoutubeUrl('')
    setMessage('Video YouTube aggiunto correttamente')
    loadNews()
    loadNewsMedia()
  }

  function getSocialName(url: string) {
    const lowerUrl = url.toLowerCase()

    if (lowerUrl.includes('facebook.com') || lowerUrl.includes('fb.com')) return 'Facebook'
    if (lowerUrl.includes('instagram.com')) return 'Instagram'
    if (lowerUrl.includes('tiktok.com')) return 'TikTok'

    return null
  }

  async function handleAddSocialLink(e: FormEvent) {
    e.preventDefault()

    if (!selectedNewsId) {
      setMessage('Seleziona una news')
      return
    }

    const cleanUrl = newsSocialUrl.trim()
    const socialName = getSocialName(cleanUrl)

    if (!cleanUrl || !socialName) {
      setMessage('Inserisci un link valido Facebook, Instagram o TikTok')
      return
    }

    try {
      let previewUrl: string | null = null

      if (newsSocialPreviewFile) {
        if (!newsSocialPreviewFile.type.startsWith('image/')) {
          setMessage('L’anteprima social deve essere un’immagine')
          return
        }

        previewUrl = await uploadFileToBucket(
          newsSocialPreviewFile,
          NEWS_MEDIA_BUCKET,
          `news/${selectedNewsId}/social-previews`
        )
      }

      const currentNewsMedia = newsMedia.filter((item) => item.news_id === selectedNewsId)

      const { error } = await supabase.from('news_media').insert({
        news_id: selectedNewsId,
        media_type: 'social',
        title: socialName,
        url: cleanUrl,
        thumbnail_url: previewUrl,
        sort_order: currentNewsMedia.length,
      })

      if (error) {
        setMessage(`Errore salvataggio link social: ${error.message}`)
        return
      }

      const selectedItem = newsList.find((item) => item.id === selectedNewsId)

      if (selectedItem && !selectedItem.image_url && previewUrl) {
        await supabase.from('news').update({ image_url: previewUrl }).eq('id', selectedNewsId)
      }

      setNewsSocialUrl('')
      setNewsSocialPreviewFile(null)
      setNewsSocialPreviewInputKey((prev) => prev + 1)
      setMessage(`Link ${socialName} aggiunto correttamente`)
      loadNews()
      loadNewsMedia()
    } catch (error) {
      console.error(error)

      if (error instanceof Error) {
        setMessage(`Errore durante salvataggio link social: ${error.message}`)
      } else {
        setMessage('Errore durante salvataggio link social')
      }
    }
  }

  async function handleDeleteMedia(item: NewsMedia) {
    const confirmDelete = window.confirm('Vuoi eliminare questo elemento?')
    if (!confirmDelete) return

    const { error } = await supabase.from('news_media').delete().eq('id', item.id)

    if (error) {
      setMessage(`Errore eliminazione media news: ${error.message}`)
      return
    }

    setMessage('Media eliminato')
    loadNewsMedia()
  }

  async function handleSetCover(item: NewsMedia) {
    const coverUrl =
      item.media_type === 'youtube'
        ? item.thumbnail_url
        : item.media_type === 'image'
          ? item.url
          : item.media_type === 'social'
            ? item.thumbnail_url
            : null

    if (!coverUrl) {
      setMessage('Puoi usare come copertina solo immagini, anteprime YouTube o anteprime social')
      return
    }

    const { error } = await supabase
      .from('news')
      .update({ image_url: coverUrl })
      .eq('id', item.news_id)

    if (error) {
      setMessage(`Errore aggiornamento copertina news: ${error.message}`)
      return
    }

    setMessage('Copertina news aggiornata')
    loadNews()
  }

  function renderTinyMediaPreview(item: NewsMedia) {
    if (item.media_type === 'youtube') {
      return (
        <div style={tinyMediaPreviewWrapper}>
          <img src={item.thumbnail_url ?? ''} alt="Anteprima YouTube" style={tinyPhotoImage} />
          <span style={videoBadge}>YT</span>
        </div>
      )
    }

    if (item.media_type === 'video') {
      return (
        <div style={tinyMediaPreviewWrapper}>
          <video src={item.url} style={tinyPhotoImage} muted />
          <span style={videoBadge}>▶</span>
        </div>
      )
    }

    if (item.media_type === 'pdf') {
      return (
        <div style={filePreviewStyle}>
          <span style={{ fontSize: '18px', fontWeight: 900 }}>PDF</span>
          <span style={{ fontSize: '8px', fontWeight: 800 }}>DOC</span>
        </div>
      )
    }

    if (item.media_type === 'social') {
      if (item.thumbnail_url) {
        return (
          <div style={tinyMediaPreviewWrapper}>
            <img src={item.thumbnail_url} alt={item.title || 'Anteprima social'} style={tinyPhotoImage} />
            <span style={socialPreviewBadgeStyle}>{item.title || 'Social'}</span>
          </div>
        )
      }

      return (
        <div style={socialPreviewFallbackStyle}>
          <span style={{ fontSize: '20px' }}>🔗</span>
          <span style={{ fontSize: '9px', fontWeight: 800 }}>{item.title || 'SOCIAL'}</span>
        </div>
      )
    }

    return <img src={item.url} alt={item.title || selectedNews?.title || 'Media news'} style={tinyPhotoImage} />
  }

  if (!isAdmin) {
    return (
      <div style={adminCardStyle}>
        <h3>Gestione News</h3>
        <p style={mutedText}>Contenuto disponibile solo per l’amministratore.</p>
      </div>
    )
  }

  return (
    <div>
      {message && <div style={messageBox}>{message}</div>}

      <div style={galleryAdminLayout}>
        <div style={adminCardStyle}>
          <h3>{editingNewsId ? 'Modifica news' : 'Crea nuova news'}</h3>

          <form onSubmit={handleSaveNews} style={formStyle}>
            <input
              type="text"
              placeholder="Titolo news"
              value={newsTitle}
              onChange={(e) => setNewsTitle(e.target.value)}
            />

            <textarea
              placeholder="Testo news"
              value={newsContent}
              onChange={(e) => setNewsContent(e.target.value)}
              rows={5}
              style={textareaStyle}
            />

            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={mutedText}>Data inserimento news</label>
              <input type="date" value={newsDate} onChange={(e) => setNewsDate(e.target.value)} />
            </div>

            <label style={checkboxLabelStyle}>
              <input
                type="checkbox"
                checked={newsPublished}
                onChange={(e) => setNewsPublished(e.target.checked)}
              />
              News visibile nella pagina pubblica
            </label>

            <div style={actionsRow}>
              <button className="primary-auth-button" type="submit">
                {editingNewsId ? 'Aggiorna news' : 'Crea news'}
              </button>

              {editingNewsId && (
                <button className="secondary-auth-button" type="button" onClick={resetNewsForm}>
                  Annulla modifica
                </button>
              )}
            </div>
          </form>
        </div>

        <div style={adminCardStyle}>
          <h3>Carica foto, video o PDF</h3>

          <form onSubmit={handleUploadNewsMedia} style={formStyle}>
            <select value={selectedNewsId} onChange={(e) => setSelectedNewsId(e.target.value)}>
              <option value="">Seleziona news</option>
              {newsList.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.news_date ? new Date(item.news_date).toLocaleDateString('it-IT') : ''} - {item.title}
                </option>
              ))}
            </select>

            <input
              key={newsMediaInputKey}
              type="file"
              accept="image/*,video/mp4,video/webm,video/quicktime,.pdf"
              multiple
              onChange={(e) => setNewsMediaFiles(e.target.files)}
            />

            {newsMediaFiles && newsMediaFiles.length > 0 && (
              <small style={mutedText}>File selezionati: {newsMediaFiles.length}</small>
            )}

            <button className="primary-auth-button" type="submit">
              Carica file selezionati
            </button>
          </form>

          {selectedNews && (
            <div style={selectedAlbumBox}>
              <strong>News selezionata:</strong>
              <br />
              {selectedNews.title}
              <br />
              <span style={mutedText}>Contenuti presenti: {selectedNewsMedia.length}</span>
            </div>
          )}

          <hr style={dividerStyle} />

          <h4>Aggiungi link YouTube</h4>

          <form onSubmit={handleAddYoutubeVideo} style={formStyle}>
            <input
              type="url"
              placeholder="Incolla link YouTube"
              value={newsYoutubeUrl}
              onChange={(e) => setNewsYoutubeUrl(e.target.value)}
            />
            <button className="primary-auth-button" type="submit">Aggiungi YouTube</button>
          </form>

          <hr style={dividerStyle} />

          <h4>Aggiungi link social</h4>

          <form onSubmit={handleAddSocialLink} style={formStyle}>
            <input
              type="url"
              placeholder="Incolla link Facebook, Instagram o TikTok"
              value={newsSocialUrl}
              onChange={(e) => setNewsSocialUrl(e.target.value)}
            />

            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={mutedText}>Immagine anteprima opzionale</label>
              <input
                key={newsSocialPreviewInputKey}
                type="file"
                accept="image/*"
                onChange={(e) => setNewsSocialPreviewFile(e.target.files?.[0] ?? null)}
              />

              {newsSocialPreviewFile && (
                <small style={mutedText}>Anteprima selezionata: {newsSocialPreviewFile.name}</small>
              )}
            </div>

            <button className="primary-auth-button" type="submit">Aggiungi Social</button>
          </form>
        </div>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h3>News inserite</h3>

        {newsList.length === 0 && <p style={mutedText}>Non ci sono ancora news inserite.</p>}

        <div style={compactAlbumList}>
          {newsList.map((item) => {
            const itemMedia = newsMedia.filter((mediaItem) => mediaItem.news_id === item.id)

            return (
              <div key={item.id} style={{ display: 'grid', gap: '8px' }}>
                <article
                  style={{
                    ...compactAlbumCard,
                    border:
                      selectedNewsId === item.id
                        ? '1px solid rgba(185,68,79,0.80)'
                        : '1px solid rgba(255,255,255,0.10)',
                  }}
                >
                  <div style={compactAlbumMain}>
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.title} style={compactCoverStyle} />
                    ) : (
                      <div style={compactCoverPlaceholder}>📰</div>
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={compactAlbumTitle}>{item.title}</h4>

                      <p style={compactAlbumMeta}>
                        {item.news_date
                          ? new Date(item.news_date).toLocaleDateString('it-IT')
                          : new Date(item.created_at).toLocaleDateString('it-IT')}
                        {' · '}
                        {item.published ? 'Visibile' : 'Bozza'}
                        {' · '}
                        {itemMedia.length} contenuti
                      </p>
                    </div>
                  </div>

                  <p style={mutedText}>
                    {item.content.length > 160 ? item.content.substring(0, 160) + '...' : item.content}
                  </p>

                  <div style={compactActionsRow}>
                    <button
                      type="button"
                      className="secondary-auth-button"
                      onClick={() => {
                        setSelectedNewsId(item.id)
                        setMessage(`Gestione contenuti news: ${item.title}`)
                      }}
                      style={smallAdminButton}
                    >
                      Media
                    </button>

                    <button
                      type="button"
                      className="secondary-auth-button"
                      onClick={() => handleEditNews(item)}
                      style={smallAdminButton}
                    >
                      Modifica
                    </button>

                    <button
                      type="button"
                      className="secondary-auth-button"
                      onClick={() => handleToggleNewsPublished(item)}
                      style={smallAdminButton}
                    >
                      {item.published ? 'Nascondi' : 'Pubblica'}
                    </button>

                    <button
                      type="button"
                      className="primary-auth-button"
                      onClick={() => handleDeleteNews(item.id)}
                      style={smallDangerButton}
                    >
                      Elimina
                    </button>
                  </div>
                </article>

                {selectedNewsId === item.id && (
                  <div style={inlineMediaPanelStyle}>
                    <div style={photoManagerHeader}>
                      <div>
                        <h3 style={{ marginBottom: '6px' }}>Contenuti news: {item.title}</h3>
                        <p style={{ ...mutedText, margin: 0 }}>{itemMedia.length} elementi</p>
                      </div>

                      <button
                        type="button"
                        className="secondary-auth-button"
                        onClick={() => {
                          setSelectedNewsId('')
                          setNewsMediaFiles(null)
                          setNewsYoutubeUrl('')
                          setNewsSocialUrl('')
                          setNewsSocialPreviewFile(null)
                          setNewsMediaInputKey((prev) => prev + 1)
                          setNewsSocialPreviewInputKey((prev) => prev + 1)
                        }}
                        style={smallAdminButton}
                      >
                        Chiudi
                      </button>
                    </div>

                    {itemMedia.length === 0 && <p style={mutedText}>Questa news non contiene ancora media.</p>}

                    {itemMedia.length > 0 && (
                      <div style={tinyPhotoGrid}>
                        {itemMedia.map((mediaItem) => {
                          const coverUrl =
                            mediaItem.media_type === 'youtube'
                              ? mediaItem.thumbnail_url
                              : mediaItem.media_type === 'image'
                                ? mediaItem.url
                                : mediaItem.media_type === 'social'
                                  ? mediaItem.thumbnail_url
                                  : null

                          const isCover = coverUrl && item.image_url === coverUrl

                          return (
                            <div key={mediaItem.id} style={tinyPhotoCard}>
                              {renderTinyMediaPreview(mediaItem)}
                              {isCover && <span style={coverBadge}>Cover</span>}

                              <div style={tinyPhotoActions}>
                                <button type="button" onClick={() => handleSetCover(mediaItem)} style={tinyButton}>
                                  Cover
                                </button>
                                <button type="button" onClick={() => handleDeleteMedia(mediaItem)} style={tinyDeleteButton}>
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
            )
          })}
        </div>
      </div>
    </div>
  )
}

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
  background: 'rgba(185,68,79,0.18)',
  border: '1px solid rgba(185,68,79,0.28)',
  padding: '14px 16px',
  borderRadius: '14px',
  color: '#f3dede',
  marginBottom: '20px',
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

const compactAlbumList: CSSProperties = {
  display: 'grid',
  gap: '8px',
  marginTop: '16px',
}

const compactAlbumCard: CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  borderRadius: '14px',
  padding: '10px',
  border: '1px solid rgba(255,255,255,0.10)',
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
  background: 'rgba(185,68,79,0.18)',
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

const inlineMediaPanelStyle: CSSProperties = {
  background: 'rgba(0,0,0,0.16)',
  border: '1px solid rgba(185,68,79,0.26)',
  borderRadius: '14px',
  padding: '14px',
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

const filePreviewStyle: CSSProperties = {
  width: '100%',
  height: '56px',
  borderRadius: '7px',
  background: 'linear-gradient(135deg, rgba(185,68,79,0.26), rgba(255,255,255,0.10))',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '2px',
  color: 'white',
}

const socialPreviewBadgeStyle: CSSProperties = {
  position: 'absolute',
  left: '5px',
  bottom: '5px',
  background: 'linear-gradient(180deg, #b9444f 0%, #82232b 100%)',
  color: 'white',
  borderRadius: '999px',
  padding: '3px 6px',
  fontSize: '9px',
  fontWeight: 900,
  maxWidth: 'calc(100% - 10px)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const socialPreviewFallbackStyle: CSSProperties = {
  width: '100%',
  height: '56px',
  borderRadius: '7px',
  background: 'linear-gradient(135deg, rgba(185,68,79,0.26), rgba(255,255,255,0.10))',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '2px',
  color: 'white',
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
  background: 'linear-gradient(180deg, #b9444f 0%, #82232b 100%)',
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
  background: 'linear-gradient(180deg, #b9444f 0%, #82232b 100%)',
  color: 'white',
}

export default AdminNews
