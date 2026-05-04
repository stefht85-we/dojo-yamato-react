import { useEffect, useState } from 'react'
import type { CSSProperties, ChangeEvent, FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'

const NEWS_BUCKET = 'news-media'

type MediaType =
  | 'image'
  | 'video'
  | 'youtube'
  | 'instagram'
  | 'facebook'
  | 'tiktok'
  | 'link'
  | 'pdf'

type NewsItem = {
  id: number
  title: string
  content: string
  image_url: string | null
  cover_image_url: string | null
  published: boolean
  news_date: string | null
  created_at: string
}

type NewsMedia = {
  id: number
  news_id: number
  media_type: MediaType
  title: string | null
  url: string
  thumbnail_url: string | null
  sort_order: number | null
  created_at: string
}

const mediaOptions: { value: MediaType; label: string }[] = [
  { value: 'image', label: 'Immagine' },
  { value: 'video', label: 'Video caricato' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'link', label: 'Link internet' },
  { value: 'pdf', label: 'PDF' },
]

function AdminNews() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [selectedNewsId, setSelectedNewsId] = useState<number | null>(null)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [newsDate, setNewsDate] = useState('')
  const [published, setPublished] = useState(true)

  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState('')

  const [media, setMedia] = useState<NewsMedia[]>([])
  const [mediaType, setMediaType] = useState<MediaType>('image')
  const [mediaTitle, setMediaTitle] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaThumbnailFile, setMediaThumbnailFile] = useState<File | null>(null)

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const selectedNews = news.find((item) => item.id === selectedNewsId)

  useEffect(() => {
    loadNews()
  }, [])

  useEffect(() => {
    if (!selectedNewsId) {
      setMedia([])
      return
    }

    loadMedia(selectedNewsId)
  }, [selectedNewsId])

  async function loadNews() {
    const { data, error } = await supabase
      .from('news')
      .select('id, title, content, image_url, cover_image_url, published, news_date, created_at')
      .order('news_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Errore caricamento news:', error.message)
      setMessage('Errore caricamento news.')
      return
    }

    setNews((data ?? []) as NewsItem[])
  }

  async function loadMedia(newsId: number) {
    const { data, error } = await supabase
      .from('news_media')
      .select('id, news_id, media_type, title, url, thumbnail_url, sort_order, created_at')
      .eq('news_id', newsId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Errore caricamento media news:', error.message)
      setMessage('Errore caricamento media della news.')
      return
    }

    setMedia((data ?? []) as NewsMedia[])
  }

  function resetForm() {
    setSelectedNewsId(null)
    setTitle('')
    setContent('')
    setNewsDate('')
    setPublished(true)
    setCoverFile(null)
    setCoverPreview('')
    setMedia([])
    resetMediaForm()
  }

  function resetMediaForm() {
    setMediaType('image')
    setMediaTitle('')
    setMediaUrl('')
    setMediaFile(null)
    setMediaThumbnailFile(null)
  }

  function editNews(item: NewsItem) {
    setSelectedNewsId(item.id)
    setTitle(item.title ?? '')
    setContent(item.content ?? '')
    setNewsDate(item.news_date ?? '')
    setPublished(item.published)
    setCoverFile(null)
    setCoverPreview(item.cover_image_url || item.image_url || '')
  }

  function handleCoverChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) return

    if (!file.type.startsWith('image/')) {
      setMessage('La copertina deve essere una immagine.')
      return
    }

    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  function handleMediaFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) return

    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')
    const isPdf = file.type === 'application/pdf'

    if (mediaType === 'image' && !isImage) {
      setMessage('Per media immagine puoi caricare solo immagini.')
      return
    }

    if (mediaType === 'video' && !isVideo) {
      setMessage('Per media video puoi caricare solo video.')
      return
    }

    if (mediaType === 'pdf' && !isPdf) {
      setMessage('Per media PDF puoi caricare solo file PDF.')
      return
    }

    setMediaFile(file)
  }

  function handleThumbnailChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) return

    if (!file.type.startsWith('image/')) {
      setMessage('L’anteprima deve essere una immagine.')
      return
    }

    setMediaThumbnailFile(file)
  }

  async function uploadFile(file: File, folder: string) {
    const safeName = file.name
      .toLowerCase()
      .replaceAll(' ', '-')
      .replace(/[^a-z0-9.\-_]/g, '')

    const path = `${folder}/${Date.now()}-${safeName}`

    const { error } = await supabase.storage
      .from(NEWS_BUCKET)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      throw new Error(error.message)
    }

    const { data } = supabase.storage.from(NEWS_BUCKET).getPublicUrl(path)

    return data.publicUrl
  }

  async function saveNews(event: FormEvent) {
    event.preventDefault()

    if (!title.trim()) {
      setMessage('Inserisci il titolo della news.')
      return
    }

    if (!content.trim()) {
      setMessage('Inserisci la descrizione della news.')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      let coverUrl = selectedNews?.cover_image_url || selectedNews?.image_url || null

      if (coverFile) {
        coverUrl = await uploadFile(coverFile, 'covers')
      }

      const payload = {
        title: title.trim(),
        content: content.trim(),
        news_date: newsDate || null,
        published,
        image_url: coverUrl,
        cover_image_url: coverUrl,
      }

      if (selectedNewsId) {
        const { error } = await supabase
          .from('news')
          .update(payload)
          .eq('id', selectedNewsId)

        if (error) throw new Error(error.message)

        setMessage('News aggiornata correttamente.')
      } else {
        const { data, error } = await supabase
          .from('news')
          .insert(payload)
          .select('id')
          .single()

        if (error) throw new Error(error.message)

        setSelectedNewsId(data.id)
        setMessage('News creata correttamente. Ora puoi aggiungere media.')
      }

      await loadNews()
    } catch (error) {
      console.error(error)
      setMessage(`Errore salvataggio news: ${error instanceof Error ? error.message : 'errore sconosciuto'}`)
    } finally {
      setLoading(false)
    }
  }

  async function deleteNews(id: number) {
    const confirmDelete = window.confirm('Vuoi eliminare questa news e tutti i suoi media?')

    if (!confirmDelete) return

    setLoading(true)

    const { error } = await supabase.from('news').delete().eq('id', id)

    if (error) {
      console.error('Errore eliminazione news:', error.message)
      setMessage('Errore eliminazione news.')
      setLoading(false)
      return
    }

    if (selectedNewsId === id) {
      resetForm()
    }

    await loadNews()
    setMessage('News eliminata.')
    setLoading(false)
  }

  function isExternalMedia(type: MediaType) {
    return ['youtube', 'instagram', 'facebook', 'tiktok', 'link'].includes(type)
  }

  async function addMedia(event: FormEvent) {
    event.preventDefault()

    if (!selectedNewsId) {
      setMessage('Prima salva o seleziona una news.')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      let finalUrl = mediaUrl.trim()
      let thumbnailUrl = ''

      if (isExternalMedia(mediaType)) {
        if (!finalUrl) {
          setMessage('Inserisci il link del contenuto.')
          setLoading(false)
          return
        }
      } else {
        if (!mediaFile) {
          setMessage('Seleziona un file da caricare.')
          setLoading(false)
          return
        }

        finalUrl = await uploadFile(mediaFile, mediaType)
      }

      if (mediaThumbnailFile) {
        thumbnailUrl = await uploadFile(mediaThumbnailFile, 'thumbnails')
      }

      const { error } = await supabase.from('news_media').insert({
        news_id: selectedNewsId,
        media_type: mediaType,
        title: mediaTitle.trim() || null,
        url: finalUrl,
        thumbnail_url: thumbnailUrl || null,
        sort_order: media.length,
      })

      if (error) throw new Error(error.message)

      resetMediaForm()
      await loadMedia(selectedNewsId)
      setMessage('Media aggiunto correttamente.')
    } catch (error) {
      console.error(error)
      setMessage(`Errore inserimento media: ${error instanceof Error ? error.message : 'errore sconosciuto'}`)
    } finally {
      setLoading(false)
    }
  }

  async function setAsCover(mediaItem: NewsMedia) {
    if (!selectedNewsId) return

    const coverUrl = mediaItem.thumbnail_url || mediaItem.url

    if (!coverUrl) {
      setMessage('Questo media non ha una immagine utilizzabile come copertina.')
      return
    }

    const { error } = await supabase
      .from('news')
      .update({
        image_url: coverUrl,
        cover_image_url: coverUrl,
      })
      .eq('id', selectedNewsId)

    if (error) {
      console.error('Errore impostazione copertina:', error.message)
      setMessage('Errore impostazione copertina.')
      return
    }

    setCoverPreview(coverUrl)
    await loadNews()
    setMessage('Copertina aggiornata.')
  }

  async function deleteMedia(mediaId: number) {
    const confirmDelete = window.confirm('Vuoi eliminare questo media?')

    if (!confirmDelete) return

    const { error } = await supabase.from('news_media').delete().eq('id', mediaId)

    if (error) {
      console.error('Errore eliminazione media:', error.message)
      setMessage('Errore eliminazione media.')
      return
    }

    if (selectedNewsId) {
      await loadMedia(selectedNewsId)
    }

    setMessage('Media eliminato.')
  }

  function getMediaLabel(type: MediaType) {
    return mediaOptions.find((item) => item.value === type)?.label || type
  }

  function getMediaPreview(mediaItem: NewsMedia) {
    if (mediaItem.thumbnail_url) return mediaItem.thumbnail_url

    if (mediaItem.media_type === 'image') return mediaItem.url

    return ''
  }

  return (
    <section style={wrapperStyle}>
      <div style={headerStyle}>
        <p style={labelStyle}>Gestione contenuti sito</p>
        <h2 style={titleStyle}>News</h2>
        <p style={introStyle}>
          Crea news con copertina, immagini, video, PDF e link YouTube, Instagram,
          Facebook, TikTok o altri collegamenti esterni.
        </p>
      </div>

      {message && <div style={messageStyle}>{message}</div>}

      <div style={gridStyle}>
        <form onSubmit={saveNews} style={panelStyle}>
          <h3 style={panelTitleStyle}>
            {selectedNewsId ? 'Modifica news' : 'Nuova news'}
          </h3>

          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Titolo news"
            style={inputStyle}
          />

          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Descrizione / testo della news"
            rows={7}
            style={textareaStyle}
          />

          <label style={fieldLabelStyle}>Data pubblicazione</label>
          <input
            type="date"
            value={newsDate}
            onChange={(event) => setNewsDate(event.target.value)}
            style={inputStyle}
          />

          <label style={checkboxRowStyle}>
            <input
              type="checkbox"
              checked={published}
              onChange={(event) => setPublished(event.target.checked)}
            />
            News pubblicata
          </label>

          <label style={fieldLabelStyle}>Immagine copertina</label>
          <input type="file" accept="image/*" onChange={handleCoverChange} style={fileInputStyle} />

          {coverPreview && (
            <div style={coverPreviewBoxStyle}>
              <img src={coverPreview} alt="Copertina news" style={coverPreviewImageStyle} />
            </div>
          )}

          <div style={buttonRowStyle}>
            <button type="submit" disabled={loading} style={primaryButtonStyle}>
              {selectedNewsId ? 'Aggiorna news' : 'Crea news'}
            </button>

            <button type="button" onClick={resetForm} style={secondaryButtonStyle}>
              Nuova
            </button>
          </div>
        </form>

        <div style={panelStyle}>
          <h3 style={panelTitleStyle}>News inserite</h3>

          {news.length === 0 && <p style={mutedStyle}>Nessuna news inserita.</p>}

          <div style={listStyle}>
            {news.map((item) => (
              <div
                key={item.id}
                style={{
                  ...newsRowStyle,
                  borderColor: selectedNewsId === item.id ? '#e63946' : 'rgba(255,255,255,0.08)',
                }}
              >
                <div>
                  <strong>{item.title}</strong>
                  <p style={smallMutedStyle}>
                    {item.news_date || item.created_at?.slice(0, 10)}
                    {item.published ? ' · pubblicata' : ' · bozza'}
                  </p>
                </div>

                <div style={miniButtonRowStyle}>
                  <button type="button" onClick={() => editNews(item)} style={smallButtonStyle}>
                    Modifica
                  </button>

                  <button type="button" onClick={() => deleteNews(item.id)} style={dangerButtonStyle}>
                    Elimina
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedNewsId && (
        <div style={mediaSectionStyle}>
          <form onSubmit={addMedia} style={panelStyle}>
            <h3 style={panelTitleStyle}>Aggiungi media alla news</h3>

            <select
              value={mediaType}
              onChange={(event) => setMediaType(event.target.value as MediaType)}
              style={inputStyle}
            >
              {mediaOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <input
              value={mediaTitle}
              onChange={(event) => setMediaTitle(event.target.value)}
              placeholder="Titolo / didascalia media"
              style={inputStyle}
            />

            {isExternalMedia(mediaType) ? (
              <>
                <input
                  value={mediaUrl}
                  onChange={(event) => setMediaUrl(event.target.value)}
                  placeholder="Incolla link YouTube / Instagram / Facebook / TikTok / sito"
                  style={inputStyle}
                />

                <label style={fieldLabelStyle}>Anteprima opzionale</label>
                <input type="file" accept="image/*" onChange={handleThumbnailChange} style={fileInputStyle} />
              </>
            ) : (
              <>
                <label style={fieldLabelStyle}>File da caricare</label>
                <input
                  type="file"
                  accept={
                    mediaType === 'image'
                      ? 'image/*'
                      : mediaType === 'video'
                        ? 'video/*'
                        : 'application/pdf'
                  }
                  onChange={handleMediaFileChange}
                  style={fileInputStyle}
                />

                {mediaType === 'video' && (
                  <>
                    <label style={fieldLabelStyle}>Anteprima video opzionale</label>
                    <input type="file" accept="image/*" onChange={handleThumbnailChange} style={fileInputStyle} />
                  </>
                )}
              </>
            )}

            <button type="submit" disabled={loading} style={primaryButtonStyle}>
              Aggiungi media
            </button>
          </form>

          <div style={panelStyle}>
            <h3 style={panelTitleStyle}>Media caricati</h3>

            {media.length === 0 && <p style={mutedStyle}>Nessun media collegato a questa news.</p>}

            <div style={mediaGridStyle}>
              {media.map((item) => {
                const preview = getMediaPreview(item)

                return (
                  <div key={item.id} style={mediaCardStyle}>
                    <div style={mediaPreviewStyle}>
                      {preview ? (
                        <img src={preview} alt={item.title || item.media_type} style={mediaPreviewImageStyle} />
                      ) : (
                        <span style={mediaPlaceholderStyle}>{getMediaLabel(item.media_type)}</span>
                      )}
                    </div>

                    <strong style={mediaTitleStyle}>{item.title || getMediaLabel(item.media_type)}</strong>
                    <span style={smallMutedStyle}>{getMediaLabel(item.media_type)}</span>

                    <div style={miniButtonRowStyle}>
                      <a href={item.url} target="_blank" rel="noreferrer" style={smallLinkButtonStyle}>
                        Apri
                      </a>

                      {(item.media_type === 'image' || item.thumbnail_url) && (
                        <button type="button" onClick={() => setAsCover(item)} style={smallButtonStyle}>
                          Copertina
                        </button>
                      )}

                      <button type="button" onClick={() => deleteMedia(item.id)} style={dangerButtonStyle}>
                        Elimina
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

const wrapperStyle: CSSProperties = {
  display: 'grid',
  gap: '20px',
}

const headerStyle: CSSProperties = {
  display: 'grid',
  gap: '8px',
}

const labelStyle: CSSProperties = {
  margin: 0,
  color: '#e63946',
  fontWeight: 900,
  letterSpacing: '2px',
  textTransform: 'uppercase',
  fontSize: '13px',
}

const titleStyle: CSSProperties = {
  margin: 0,
  color: 'white',
  fontSize: '38px',
  fontWeight: 950,
}

const introStyle: CSSProperties = {
  margin: 0,
  color: '#d8d8d8',
  lineHeight: 1.6,
}

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(320px, 1fr) minmax(320px, 1fr)',
  gap: '18px',
}

const mediaSectionStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(320px, 0.85fr) minmax(320px, 1.15fr)',
  gap: '18px',
}

const panelStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.055)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: '20px',
  padding: '20px',
  display: 'grid',
  gap: '13px',
  color: 'white',
}

const panelTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: '22px',
}

const inputStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  border: '1px solid rgba(255,255,255,0.14)',
  background: 'rgba(255,255,255,0.08)',
  color: 'white',
  borderRadius: '12px',
  padding: '12px 13px',
  fontSize: '14px',
  outline: 'none',
}

const textareaStyle: CSSProperties = {
  ...inputStyle,
  resize: 'vertical',
  minHeight: '130px',
  fontFamily: 'inherit',
}

const fileInputStyle: CSSProperties = {
  color: '#d8d8d8',
}

const fieldLabelStyle: CSSProperties = {
  color: '#f3dede',
  fontSize: '13px',
  fontWeight: 900,
}

const checkboxRowStyle: CSSProperties = {
  display: 'flex',
  gap: '8px',
  alignItems: 'center',
  color: '#d8d8d8',
  fontSize: '14px',
}

const coverPreviewBoxStyle: CSSProperties = {
  height: '170px',
  borderRadius: '14px',
  overflow: 'hidden',
  background: '#111827',
  border: '1px solid rgba(255,255,255,0.08)',
}

const coverPreviewImageStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
}

const buttonRowStyle: CSSProperties = {
  display: 'flex',
  gap: '10px',
  flexWrap: 'wrap',
}

const primaryButtonStyle: CSSProperties = {
  width: 'fit-content',
  border: 'none',
  borderRadius: '999px',
  padding: '12px 18px',
  background: '#e63946',
  color: 'white',
  fontWeight: 900,
  cursor: 'pointer',
}

const secondaryButtonStyle: CSSProperties = {
  width: 'fit-content',
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: '999px',
  padding: '12px 18px',
  background: 'rgba(255,255,255,0.08)',
  color: 'white',
  fontWeight: 900,
  cursor: 'pointer',
}

const messageStyle: CSSProperties = {
  padding: '12px 14px',
  borderRadius: '14px',
  background: 'rgba(230,57,70,0.16)',
  border: '1px solid rgba(230,57,70,0.28)',
  color: '#f3dede',
}

const listStyle: CSSProperties = {
  display: 'grid',
  gap: '10px',
}

const newsRowStyle: CSSProperties = {
  display: 'grid',
  gap: '10px',
  padding: '12px',
  borderRadius: '14px',
  background: 'rgba(0,0,0,0.18)',
  border: '1px solid rgba(255,255,255,0.08)',
}

const miniButtonRowStyle: CSSProperties = {
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap',
}

const smallButtonStyle: CSSProperties = {
  border: 'none',
  borderRadius: '999px',
  padding: '8px 12px',
  background: 'rgba(255,255,255,0.12)',
  color: 'white',
  fontWeight: 800,
  cursor: 'pointer',
}

const smallLinkButtonStyle: CSSProperties = {
  borderRadius: '999px',
  padding: '8px 12px',
  background: 'rgba(255,255,255,0.12)',
  color: 'white',
  fontWeight: 800,
  textDecoration: 'none',
}

const dangerButtonStyle: CSSProperties = {
  border: 'none',
  borderRadius: '999px',
  padding: '8px 12px',
  background: 'rgba(230,57,70,0.22)',
  color: '#ffd5d8',
  fontWeight: 800,
  cursor: 'pointer',
}

const mutedStyle: CSSProperties = {
  color: '#d8d8d8',
  margin: 0,
}

const smallMutedStyle: CSSProperties = {
  color: '#aeb6c4',
  fontSize: '12px',
}

const mediaGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: '12px',
}

const mediaCardStyle: CSSProperties = {
  display: 'grid',
  gap: '8px',
  padding: '10px',
  borderRadius: '14px',
  background: 'rgba(0,0,0,0.18)',
  border: '1px solid rgba(255,255,255,0.08)',
}

const mediaPreviewStyle: CSSProperties = {
  height: '110px',
  borderRadius: '12px',
  overflow: 'hidden',
  background: '#111827',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const mediaPreviewImageStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
}

const mediaPlaceholderStyle: CSSProperties = {
  color: 'white',
  fontWeight: 900,
  textAlign: 'center',
  padding: '12px',
}

const mediaTitleStyle: CSSProperties = {
  color: 'white',
  fontSize: '14px',
  lineHeight: 1.3,
}

export default AdminNews