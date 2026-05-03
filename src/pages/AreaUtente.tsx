import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { User } from '@supabase/supabase-js'
import type { CSSProperties, FormEvent, MouseEvent } from 'react'
import AdminInsegnanti from '../components/AdminInsegnanti'
import AdminTeoria from '../components/AdminTeoria'
import './AreaUtente.css'

const ADMIN_EMAIL = 'stefht85@hotmail.com'
const NEWS_BUCKET = 'news-images'
const NEWS_DOCUMENTS_BUCKET = 'news-documents'
const GALLERY_BUCKET = 'gallery'
const EVENT_IMAGES_BUCKET = 'event-images'
const EVENT_DOCUMENTS_BUCKET = 'event-documents'
const DOCUMENTS_BUCKET = 'documents'

type AdminTab = 'news' | 'galleria' | 'eventi' | 'documenti' | 'insegnanti' | 'teoria' | 'difesa'

type NewsDocument = {
  id: string
  news_id: string
  title: string
  file_url: string
  file_type: string | null
  created_at: string
}

type NewsItem = {
  id: string
  title: string
  content: string
  image_url: string | null
  published: boolean
  news_date: string | null
  created_at: string
  news_documents?: NewsDocument[]
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
  media_type: 'image' | 'video' | 'youtube' | 'file' | 'social'
  thumbnail_url: string | null
  video_url: string | null
}

type EventDocument = {
  id: string
  event_id: string
  title: string
  file_url: string
  file_type: string | null
  created_at: string
}

type DojoEvent = {
  id: string
  title: string
  description: string | null
  location: string | null
  event_date: string | null
  provisional_year: number | null
  provisional_month: number | null
  is_date_provisional: boolean
  image_url: string | null
  external_url: string | null
  external_url_label: string | null
  visible: boolean
  created_at: string
  event_documents?: EventDocument[]
}

type DojoDocument = {
  id: string
  title: string
  category: string | null
  file_url: string
  file_type: string | null
  visible: boolean
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
  const [newsDate, setNewsDate] = useState(new Date().toISOString().slice(0, 10))
  const [newsImageFile, setNewsImageFile] = useState<File | null>(null)
  const [newsDocumentFiles, setNewsDocumentFiles] = useState<FileList | null>(null)
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null)
  const [existingNewsImageUrl, setExistingNewsImageUrl] = useState<string | null>(null)
  const [newsInputKey, setNewsInputKey] = useState(0)
  const [newsDocsInputKey, setNewsDocsInputKey] = useState(0)

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
  const [socialUrl, setSocialUrl] = useState('')
  const [socialPreviewFile, setSocialPreviewFile] = useState<File | null>(null)
  const [socialPreviewInputKey, setSocialPreviewInputKey] = useState(0)

  const [events, setEvents] = useState<DojoEvent[]>([])
  const [eventTitle, setEventTitle] = useState('')
  const [eventDescription, setEventDescription] = useState('')
  const [eventLocation, setEventLocation] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventIsProvisional, setEventIsProvisional] = useState(false)
  const [eventProvisionalYear, setEventProvisionalYear] = useState(
    new Date().getFullYear().toString()
  )
  const [eventProvisionalMonth, setEventProvisionalMonth] = useState('')
  const [eventVisible, setEventVisible] = useState(true)
  const [eventExternalUrl, setEventExternalUrl] = useState('')
  const [eventExternalUrlLabel, setEventExternalUrlLabel] = useState('')
  const [eventImageFile, setEventImageFile] = useState<File | null>(null)
  const [eventDocumentFiles, setEventDocumentFiles] = useState<FileList | null>(null)
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [existingEventImageUrl, setExistingEventImageUrl] = useState<string | null>(null)
  const [eventImageInputKey, setEventImageInputKey] = useState(0)
  const [eventDocsInputKey, setEventDocsInputKey] = useState(0)

  const [documents, setDocuments] = useState<DojoDocument[]>([])
  const [documentTitle, setDocumentTitle] = useState('')
  const [documentCategory, setDocumentCategory] = useState('Moduli')
  const [documentVisible, setDocumentVisible] = useState(true)
  const [documentFile, setDocumentFile] = useState<File | null>(null)
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null)
  const [existingDocumentFileUrl, setExistingDocumentFileUrl] = useState<string | null>(null)
  const [existingDocumentFileType, setExistingDocumentFileType] = useState<string | null>(null)
  const [documentInputKey, setDocumentInputKey] = useState(0)

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
      .select(`
        id,
        title,
        content,
        image_url,
        published,
        news_date,
        created_at,
        news_documents (
          id,
          news_id,
          title,
          file_url,
          file_type,
          created_at
        )
      `)
      .order('news_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (error) {
      setMessage(`Errore caricamento news: ${error.message}`)
      return
    }

    setNewsList((data ?? []) as NewsItem[])
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

  async function loadEvents() {
    const { data, error } = await supabase
      .from('events')
      .select(`
        id,
        title,
        description,
        location,
        event_date,
        provisional_year,
        provisional_month,
        is_date_provisional,
        image_url,
        external_url,
        external_url_label,
        visible,
        created_at,
        event_documents (
          id,
          event_id,
          title,
          file_url,
          file_type,
          created_at
        )
      `)
      .order('event_date', { ascending: true, nullsFirst: false })
      .order('provisional_year', { ascending: true, nullsFirst: false })
      .order('provisional_month', { ascending: true, nullsFirst: false })

    if (error) {
      setMessage(`Errore caricamento eventi: ${error.message}`)
      return
    }

    setEvents((data ?? []) as DojoEvent[])
  }

  async function loadDocuments() {
    const { data, error } = await supabase
      .from('documents')
      .select('id, title, category, file_url, file_type, visible, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      setMessage(`Errore caricamento documenti: ${error.message}`)
      return
    }

    setDocuments(data ?? [])
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
      loadEvents()
      loadDocuments()
    }
  }, [isAdmin])

  async function handleSignup(e: FormEvent | MouseEvent<HTMLButtonElement>) {
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

    if (!newsDate) {
      setMessage('Inserisci la data della news')
      return
    }

    setMessage(editingNewsId ? 'Aggiornamento news...' : 'Salvataggio news...')

    try {
      let finalImageUrl = existingNewsImageUrl

      if (newsImageFile) {
        finalImageUrl = await uploadFileToBucket(newsImageFile, NEWS_BUCKET, 'news')
      }

      let newsIdToUse = editingNewsId

      if (editingNewsId) {
        const { error } = await supabase
          .from('news')
          .update({
            title: newsTitle.trim(),
            content: newsContent.trim(),
            image_url: finalImageUrl,
            published: newsPublished,
            news_date: newsDate,
          })
          .eq('id', editingNewsId)

        if (error) {
          setMessage(`Errore modifica news: ${error.message}`)
          return
        }

        setMessage('News aggiornata correttamente')
      } else {
        const { data, error } = await supabase
          .from('news')
          .insert({
            title: newsTitle.trim(),
            content: newsContent.trim(),
            image_url: finalImageUrl,
            published: newsPublished,
            news_date: newsDate,
          })
          .select('id')
          .single()

        if (error) {
          setMessage(`Errore salvataggio news: ${error.message}`)
          return
        }

        newsIdToUse = data.id
        setMessage('News salvata correttamente')
      }

      if (newsIdToUse && newsDocumentFiles && newsDocumentFiles.length > 0) {
        const filesArray = Array.from(newsDocumentFiles)
        const docsToInsert = []

        for (const file of filesArray) {
          const fileUrl = await uploadFileToBucket(
            file,
            NEWS_DOCUMENTS_BUCKET,
            `news/${newsIdToUse}`
          )

          docsToInsert.push({
            news_id: newsIdToUse,
            title: file.name,
            file_url: fileUrl,
            file_type: file.type || null,
          })
        }

        const { error: docsError } = await supabase
          .from('news_documents')
          .insert(docsToInsert)

        if (docsError) {
          setMessage(`News salvata, ma errore documenti: ${docsError.message}`)
          loadNews()
          return
        }
      }

      resetNewsForm()
      loadNews()
    } catch (error) {
      console.error(error)

      if (error instanceof Error) {
        setMessage(`Errore durante upload immagine/documenti o salvataggio news: ${error.message}`)
      } else {
        setMessage('Errore durante upload immagine/documenti o salvataggio news')
      }
    }
  }

  function handleEditNews(item: NewsItem) {
    setEditingNewsId(item.id)
    setNewsTitle(item.title)
    setNewsContent(item.content)
    setNewsPublished(item.published)
    setNewsDate(item.news_date ?? item.created_at.slice(0, 10))
    setExistingNewsImageUrl(item.image_url)
    setNewsImageFile(null)
    setNewsDocumentFiles(null)
    setNewsInputKey((prev) => prev + 1)
    setNewsDocsInputKey((prev) => prev + 1)
    setAdminTab('news')
    setMessage('Modifica news in corso')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function resetNewsForm() {
    setEditingNewsId(null)
    setNewsTitle('')
    setNewsContent('')
    setNewsPublished(true)
    setNewsDate(new Date().toISOString().slice(0, 10))
    setNewsImageFile(null)
    setNewsDocumentFiles(null)
    setExistingNewsImageUrl(null)
    setNewsInputKey((prev) => prev + 1)
    setNewsDocsInputKey((prev) => prev + 1)
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

  async function handleDeleteNewsDocument(id: string) {
    const confirmDelete = window.confirm('Vuoi eliminare questo documento della news?')
    if (!confirmDelete) return

    const { error } = await supabase.from('news_documents').delete().eq('id', id)

    if (error) {
      setMessage(`Errore eliminazione documento news: ${error.message}`)
      return
    }

    setMessage('Documento news eliminato')
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

      if (data?.id) setSelectedAlbumId(data.id)
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
    setMessage(`Gestione contenuti album: ${album.title}`)
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
      'Vuoi davvero eliminare questo album? Verranno eliminati anche tutti i contenuti collegati.'
    )

    if (!confirmDelete) return

    const { error } = await supabase.from('gallery_albums').delete().eq('id', albumId)

    if (error) {
      setMessage(`Errore eliminazione album: ${error.message}`)
      return
    }

    if (selectedAlbumId === albumId) setSelectedAlbumId('')

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
      setMessage('Seleziona uno o più file')
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
        caption: string | null
        video_url: string | null
        thumbnail_url: string | null
        media_type: 'image' | 'video' | 'file'
        sort_order: number
      }[] = []

      const currentAlbumMedia = media.filter((item) => item.album_id === selectedAlbumId)
      const startOrder = currentAlbumMedia.length

      for (let index = 0; index < filesArray.length; index++) {
        const file = filesArray[index]
        const fileName = file.name.toLowerCase()
        const isImage = file.type.startsWith('image/')
        const isVideo = file.type.startsWith('video/')
        const isPdf = file.type === 'application/pdf' || fileName.endsWith('.pdf')

        if (!isImage && !isVideo && !isPdf) {
          setMessage(
            `File non consentito: ${file.name}. Puoi caricare solo immagini, video o PDF.`
          )
          return
        }

        const mediaType: 'image' | 'video' | 'file' = isImage
          ? 'image'
          : isVideo
            ? 'video'
            : 'file'

        const fileUrl = await uploadFileToBucket(
          file,
          GALLERY_BUCKET,
          `albums/${selectedAlbumId}`
        )

        uploadedMedia.push({
          album_id: selectedAlbumId,
          image_url: fileUrl,
          caption: mediaType === 'file' ? file.name : null,
          video_url: isVideo ? fileUrl : null,
          thumbnail_url: null,
          media_type: mediaType,
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
        await supabase
          .from('gallery_albums')
          .update({ cover_image_url: firstImage.image_url })
          .eq('id', selectedAlbumId)
      }

      setGalleryFiles(null)
      setGalleryInputKey((prev) => prev + 1)
      setMessage('File caricati correttamente')
      loadAlbums()
      loadMedia()
    } catch (error) {
      console.error(error)

      if (error instanceof Error) {
        setMessage(`Errore durante upload file album: ${error.message}`)
      } else {
        setMessage('Errore durante upload file album')
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
      caption: 'YouTube',
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

  function getSocialName(url: string) {
    const lowerUrl = url.toLowerCase()

    if (lowerUrl.includes('facebook.com') || lowerUrl.includes('fb.com')) {
      return 'Facebook'
    }

    if (lowerUrl.includes('instagram.com')) {
      return 'Instagram'
    }

    if (lowerUrl.includes('tiktok.com')) {
      return 'TikTok'
    }

    return null
  }

  async function handleAddSocialLink(e: FormEvent) {
    e.preventDefault()

    if (!isAdmin) {
      setMessage('Non hai i permessi per gestire la galleria')
      return
    }

    if (!selectedAlbumId) {
      setMessage('Seleziona un album')
      return
    }

    const cleanUrl = socialUrl.trim()
    const socialName = getSocialName(cleanUrl)

    if (!cleanUrl || !socialName) {
      setMessage('Inserisci un link valido Facebook, Instagram o TikTok')
      return
    }

    try {
      let previewUrl: string | null = null

      if (socialPreviewFile) {
        if (!socialPreviewFile.type.startsWith('image/')) {
          setMessage('L’anteprima social deve essere un’immagine')
          return
        }

        previewUrl = await uploadFileToBucket(
          socialPreviewFile,
          GALLERY_BUCKET,
          `albums/${selectedAlbumId}/social-previews`
        )
      }

      const currentAlbumMedia = media.filter(
        (item) => item.album_id === selectedAlbumId
      )

      const { error } = await supabase.from('gallery_photos').insert({
        album_id: selectedAlbumId,
        image_url: cleanUrl,
        video_url: cleanUrl,
        thumbnail_url: previewUrl,
        caption: socialName,
        media_type: 'social',
        sort_order: currentAlbumMedia.length,
      })

      if (error) {
        setMessage(`Errore salvataggio link social: ${error.message}`)
        return
      }

      setSocialUrl('')
      setSocialPreviewFile(null)
      setSocialPreviewInputKey((prev) => prev + 1)
      setMessage(`Link ${socialName} aggiunto correttamente`)
      loadMedia()
    } catch (error) {
      console.error(error)

      if (error instanceof Error) {
        setMessage(`Errore durante salvataggio link social: ${error.message}`)
      } else {
        setMessage('Errore durante salvataggio link social')
      }
    }
  }

  async function handleDeleteMedia(item: GalleryMedia) {
    const confirmDelete = window.confirm('Vuoi eliminare questo elemento?')
    if (!confirmDelete) return

    const { error } = await supabase.from('gallery_photos').delete().eq('id', item.id)

    if (error) {
      setMessage(`Errore eliminazione media: ${error.message}`)
      return
    }

    setMessage('Media eliminato')
    loadAlbums()
    loadMedia()
  }

  async function handleSetCover(item: GalleryMedia) {
    const coverUrl =
      item.media_type === 'youtube'
        ? item.thumbnail_url
        : item.media_type === 'image'
          ? item.image_url
          : item.media_type === 'social'
            ? item.thumbnail_url
            : null

    if (!coverUrl) {
      setMessage('Puoi usare come copertina solo immagini, anteprime YouTube o anteprime social')
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

  function resetEventForm() {
    setEditingEventId(null)
    setEventTitle('')
    setEventDescription('')
    setEventLocation('')
    setEventDate('')
    setEventIsProvisional(false)
    setEventProvisionalYear(new Date().getFullYear().toString())
    setEventProvisionalMonth('')
    setEventVisible(true)
    setEventExternalUrl('')
    setEventExternalUrlLabel('')
    setEventImageFile(null)
    setEventDocumentFiles(null)
    setExistingEventImageUrl(null)
    setEventImageInputKey((prev) => prev + 1)
    setEventDocsInputKey((prev) => prev + 1)
  }

  async function handleSaveEvent(e: FormEvent) {
    e.preventDefault()

    if (!isAdmin) {
      setMessage('Non hai i permessi per gestire gli eventi')
      return
    }

    if (!eventTitle.trim()) {
      setMessage('Inserisci il titolo evento')
      return
    }

    const provisionalYearNumber = Number(eventProvisionalYear)
    const provisionalMonthNumber = Number(eventProvisionalMonth)

    if (eventIsProvisional) {
      if (!provisionalYearNumber || !provisionalMonthNumber) {
        setMessage('Per una data provvisoria inserisci almeno mese e anno')
        return
      }
    }

    if (!eventDate && !eventIsProvisional) {
      setMessage('Inserisci una data precisa oppure usa data provvisoria')
      return
    }

    setMessage(editingEventId ? 'Aggiornamento evento...' : 'Creazione evento...')

    try {
      let finalImageUrl = existingEventImageUrl

      if (eventImageFile) {
        finalImageUrl = await uploadFileToBucket(
          eventImageFile,
          EVENT_IMAGES_BUCKET,
          'events'
        )
      }

      const payload = {
        title: eventTitle.trim(),
        description: eventDescription.trim() || null,
        location: eventLocation.trim() || null,
        event_date: eventIsProvisional ? null : eventDate || null,
        provisional_year: eventIsProvisional ? provisionalYearNumber : null,
        provisional_month: eventIsProvisional ? provisionalMonthNumber : null,
        is_date_provisional: eventIsProvisional,
        image_url: finalImageUrl,
        external_url: eventExternalUrl.trim() || null,
        external_url_label: eventExternalUrlLabel.trim() || null,
        visible: eventVisible,
      }

      let eventIdToUse = editingEventId

      if (editingEventId) {
        const { error } = await supabase
          .from('events')
          .update(payload)
          .eq('id', editingEventId)

        if (error) {
          setMessage(`Errore aggiornamento evento: ${error.message}`)
          return
        }
      } else {
        const { data, error } = await supabase
          .from('events')
          .insert(payload)
          .select('id')
          .single()

        if (error) {
          setMessage(`Errore creazione evento: ${error.message}`)
          return
        }

        eventIdToUse = data.id
      }

      if (eventIdToUse && eventDocumentFiles && eventDocumentFiles.length > 0) {
        const filesArray = Array.from(eventDocumentFiles)
        const docsToInsert = []

        for (const file of filesArray) {
          const fileUrl = await uploadFileToBucket(
            file,
            EVENT_DOCUMENTS_BUCKET,
            `events/${eventIdToUse}`
          )

          docsToInsert.push({
            event_id: eventIdToUse,
            title: file.name,
            file_url: fileUrl,
            file_type: file.type || null,
          })
        }

        const { error: docsError } = await supabase
          .from('event_documents')
          .insert(docsToInsert)

        if (docsError) {
          setMessage(`Evento salvato, ma errore documenti: ${docsError.message}`)
          loadEvents()
          return
        }
      }

      setMessage(editingEventId ? 'Evento aggiornato correttamente' : 'Evento creato correttamente')
      resetEventForm()
      loadEvents()
    } catch (error) {
      console.error(error)
      setMessage('Errore durante salvataggio evento')
    }
  }

  function handleEditEvent(event: DojoEvent) {
    setEditingEventId(event.id)
    setEventTitle(event.title)
    setEventDescription(event.description ?? '')
    setEventLocation(event.location ?? '')
    setEventDate(event.event_date ?? '')
    setEventIsProvisional(event.is_date_provisional)
    setEventProvisionalYear(String(event.provisional_year ?? new Date().getFullYear()))
    setEventProvisionalMonth(String(event.provisional_month ?? ''))
    setEventVisible(event.visible)
    setEventExternalUrl(event.external_url ?? '')
    setEventExternalUrlLabel(event.external_url_label ?? '')
    setExistingEventImageUrl(event.image_url)
    setEventImageFile(null)
    setEventDocumentFiles(null)
    setEventImageInputKey((prev) => prev + 1)
    setEventDocsInputKey((prev) => prev + 1)
    setAdminTab('eventi')
    setMessage('Modifica evento in corso')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleToggleEventVisible(event: DojoEvent) {
    const { error } = await supabase
      .from('events')
      .update({ visible: !event.visible })
      .eq('id', event.id)

    if (error) {
      setMessage(`Errore aggiornamento visibilità evento: ${error.message}`)
      return
    }

    setMessage('Visibilità evento aggiornata')
    loadEvents()
  }

  async function handleDeleteEvent(id: string) {
    const confirmDelete = window.confirm(
      'Vuoi eliminare questo evento? Verranno eliminati anche i documenti collegati.'
    )

    if (!confirmDelete) return

    const { error } = await supabase.from('events').delete().eq('id', id)

    if (error) {
      setMessage(`Errore eliminazione evento: ${error.message}`)
      return
    }

    setMessage('Evento eliminato')
    loadEvents()
  }

  async function handleDeleteEventDocument(id: string) {
    const confirmDelete = window.confirm('Vuoi eliminare questo documento?')
    if (!confirmDelete) return

    const { error } = await supabase.from('event_documents').delete().eq('id', id)

    if (error) {
      setMessage(`Errore eliminazione documento: ${error.message}`)
      return
    }

    setMessage('Documento eliminato')
    loadEvents()
  }

  function formatEventDate(event: DojoEvent) {
    if (event.event_date && !event.is_date_provisional) {
      return new Date(event.event_date).toLocaleDateString('it-IT')
    }

    if (event.provisional_year && event.provisional_month) {
      const date = new Date(event.provisional_year, event.provisional_month - 1, 1)
      return `${date.toLocaleDateString('it-IT', {
        month: 'long',
        year: 'numeric',
      })} provvisoria`
    }

    return 'Data da definire'
  }

  function resetDocumentForm() {
    setEditingDocumentId(null)
    setDocumentTitle('')
    setDocumentCategory('Moduli')
    setDocumentVisible(true)
    setDocumentFile(null)
    setExistingDocumentFileUrl(null)
    setExistingDocumentFileType(null)
    setDocumentInputKey((prev) => prev + 1)
  }

  async function handleSaveDocument(e: FormEvent) {
    e.preventDefault()

    if (!isAdmin) {
      setMessage('Non hai i permessi per gestire i documenti')
      return
    }

    if (!documentTitle.trim()) {
      setMessage('Inserisci il titolo del documento')
      return
    }

    if (!editingDocumentId && !documentFile) {
      setMessage('Seleziona un file da caricare')
      return
    }

    setMessage(editingDocumentId ? 'Aggiornamento documento...' : 'Caricamento documento...')

    try {
      let finalFileUrl = existingDocumentFileUrl
      let finalFileType = existingDocumentFileType

      if (documentFile) {
        finalFileUrl = await uploadFileToBucket(
          documentFile,
          DOCUMENTS_BUCKET,
          'documents'
        )

        finalFileType = documentFile.type || null
      }

      if (!finalFileUrl) {
        setMessage('File documento non valido')
        return
      }

      const payload = {
        title: documentTitle.trim(),
        category: documentCategory.trim() || 'Altro',
        file_url: finalFileUrl,
        file_type: finalFileType,
        visible: documentVisible,
      }

      if (editingDocumentId) {
        const { error } = await supabase
          .from('documents')
          .update(payload)
          .eq('id', editingDocumentId)

        if (error) {
          setMessage(`Errore aggiornamento documento: ${error.message}`)
          return
        }

        setMessage('Documento aggiornato correttamente')
      } else {
        const { error } = await supabase.from('documents').insert(payload)

        if (error) {
          setMessage(`Errore caricamento documento: ${error.message}`)
          return
        }

        setMessage('Documento caricato correttamente')
      }

      resetDocumentForm()
      loadDocuments()
    } catch (error) {
      console.error('Errore salvataggio documento:', error)

      if (error instanceof Error) {
        setMessage(`Errore durante salvataggio documento: ${error.message}`)
      } else {
        setMessage('Errore durante salvataggio documento')
      }
    }
  }

  function handleEditDocument(document: DojoDocument) {
    setEditingDocumentId(document.id)
    setDocumentTitle(document.title)
    setDocumentCategory(document.category ?? 'Altro')
    setDocumentVisible(document.visible)
    setExistingDocumentFileUrl(document.file_url)
    setExistingDocumentFileType(document.file_type)
    setDocumentFile(null)
    setDocumentInputKey((prev) => prev + 1)
    setAdminTab('documenti')
    setMessage('Modifica documento in corso')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleToggleDocumentVisible(document: DojoDocument) {
    const { error } = await supabase
      .from('documents')
      .update({ visible: !document.visible })
      .eq('id', document.id)

    if (error) {
      setMessage(`Errore aggiornamento visibilità documento: ${error.message}`)
      return
    }

    setMessage('Visibilità documento aggiornata')
    loadDocuments()
  }

  async function handleDeleteDocument(id: string) {
    const confirmDelete = window.confirm('Vuoi eliminare questo documento?')
    if (!confirmDelete) return

    const { error } = await supabase.from('documents').delete().eq('id', id)

    if (error) {
      setMessage(`Errore eliminazione documento: ${error.message}`)
      return
    }

    setMessage('Documento eliminato')
    loadDocuments()
  }

  function renderTinyMediaPreview(item: GalleryMedia) {
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
          <video src={item.video_url ?? item.image_url} style={tinyPhotoImage} muted />
          <span style={videoBadge}>▶</span>
        </div>
      )
    }

    if (item.media_type === 'file') {
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
            <img
              src={item.thumbnail_url}
              alt={item.caption || 'Anteprima social'}
              style={tinyPhotoImage}
            />

            <span style={socialPreviewBadgeStyle}>
              {item.caption || 'Social'}
            </span>
          </div>
        )
      }

      return (
        <div style={socialPreviewFallbackStyle}>
          <span style={{ fontSize: '20px' }}>🔗</span>
          <span style={{ fontSize: '9px', fontWeight: 800 }}>
            {item.caption || 'SOCIAL'}
          </span>
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
      <>
        <style>{areaUtenteInlineStyles}</style>

        <div className="auth-page">
          <div className="auth-card">
            <h1>Accesso Dojo Yamato</h1>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />

              <button className="primary-auth-button" type="submit">Login</button>

              <button className="secondary-auth-button" type="button" onClick={handleSignup}>
                Registrati
              </button>
            </form>

            {message && <p style={{ marginTop: '16px' }}>{message}</p>}
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <style>{areaUtenteInlineStyles}</style>

      <div className="profile-layout">
        <div className="profile-card">
          <h1>Area Utente</h1>

          <p>
            Loggato come: <strong>{user.email}</strong>
          </p>

          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '20px' }}>
            <input type="text" placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} />
            <input type="text" placeholder="Cognome" value={cognome} onChange={(e) => setCognome(e.target.value)} />

            <button className="primary-auth-button" type="submit">
              Salva profilo
            </button>
          </form>

          {isAdmin && (
            <section style={adminSectionStyle}>
              <p style={adminLabelStyle}>Pannello amministratore</p>
              <h2 style={{ marginTop: 0 }}>Gestione contenuti sito</h2>

              <div style={tabsWrapper}>
                <button type="button" style={tabButton(adminTab === 'news')} onClick={() => setAdminTab('news')}>News</button>
                <button type="button" style={tabButton(adminTab === 'galleria')} onClick={() => setAdminTab('galleria')}>Galleria</button>
                <button type="button" style={tabButton(adminTab === 'eventi')} onClick={() => setAdminTab('eventi')}>Eventi</button>
                <button type="button" style={tabButton(adminTab === 'documenti')} onClick={() => setAdminTab('documenti')}>Documenti</button>
                <button type="button" style={tabButton(adminTab === 'insegnanti')} onClick={() => setAdminTab('insegnanti')}>Insegnanti</button>
                <button type="button" style={tabButton(adminTab === 'teoria')} onClick={() => setAdminTab('teoria')}>Teoria</button>
                <button type="button" style={tabButton(adminTab === 'difesa')} onClick={() => setAdminTab('difesa')}>Difesa personale</button>
              </div>

              {message && adminTab !== 'insegnanti' && adminTab !== 'teoria' && (
                <div style={messageBox}>{message}</div>
              )}

              {adminTab === 'news' && (
                <div>
                  <div style={adminCardStyle}>
                    <h3>{editingNewsId ? 'Modifica News' : 'Crea nuova News'}</h3>

                    <form onSubmit={handleSaveNews} style={formStyle}>
                      <input type="text" placeholder="Titolo news" value={newsTitle} onChange={(e) => setNewsTitle(e.target.value)} />

                      <div style={{ display: 'grid', gap: '8px' }}>
                        <label style={mutedText}>Data news</label>
                        <input type="date" value={newsDate} onChange={(e) => setNewsDate(e.target.value)} />
                      </div>

                      <textarea placeholder="Contenuto news" value={newsContent} onChange={(e) => setNewsContent(e.target.value)} rows={6} style={textareaStyle} />

                      {existingNewsImageUrl && (
                        <div>
                          <p style={mutedText}>Immagine attuale:</p>
                          <img src={existingNewsImageUrl} alt="Immagine news attuale" style={previewImageStyle} />
                        </div>
                      )}

                      <div style={{ display: 'grid', gap: '8px' }}>
                        <label style={mutedText}>Immagine news opzionale</label>
                        <input key={newsInputKey} type="file" accept="image/*" onChange={(e) => setNewsImageFile(e.target.files?.[0] ?? null)} />
                        {newsImageFile && <small style={mutedText}>File selezionato: {newsImageFile.name}</small>}
                      </div>

                      <div style={{ display: 'grid', gap: '8px' }}>
                        <label style={mutedText}>Documenti news opzionali</label>
                        <input
                          key={newsDocsInputKey}
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,image/*"
                          onChange={(e) => setNewsDocumentFiles(e.target.files)}
                        />
                        {newsDocumentFiles && newsDocumentFiles.length > 0 && (
                          <small style={mutedText}>Documenti selezionati: {newsDocumentFiles.length}</small>
                        )}
                      </div>

                      <label style={checkboxLabelStyle}>
                        <input type="checkbox" checked={newsPublished} onChange={(e) => setNewsPublished(e.target.checked)} />
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

                    {newsList.length === 0 && <p style={mutedText}>Non ci sono ancora news inserite.</p>}

                    <div style={listGrid}>
                      {newsList.map((item) => (
                        <article key={item.id} style={adminCardStyle}>
                          {item.image_url && <img src={item.image_url} alt={item.title} style={previewImageStyle} />}

                          <h4 style={{ marginBottom: '8px' }}>{item.title}</h4>

                          <small style={mutedText}>
                            {item.news_date
                              ? new Date(item.news_date).toLocaleDateString('it-IT')
                              : new Date(item.created_at).toLocaleDateString('it-IT')}
                            {' '}
                            — {item.published ? 'Pubblicata' : 'Bozza'}
                            {' '}
                            — {item.news_documents?.length ?? 0} allegati
                          </small>

                          <p style={mutedText}>
                            {item.content.length > 180 ? item.content.substring(0, 180) + '...' : item.content}
                          </p>

                          {item.news_documents && item.news_documents.length > 0 && (
                            <div style={eventDocsList}>
                              {item.news_documents.map((doc) => (
                                <div key={doc.id} style={eventDocRow}>
                                  <a href={doc.file_url} target="_blank" rel="noreferrer" style={eventDocLink}>
                                    📄 {doc.title}
                                  </a>

                                  <button type="button" onClick={() => handleDeleteNewsDocument(doc.id)} style={tinyDeleteButton}>
                                    X
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          <div style={actionsRow}>
                            <button type="button" className="secondary-auth-button" onClick={() => handleEditNews(item)}>Modifica</button>
                            <button type="button" className="secondary-auth-button" onClick={() => handleToggleNewsPublished(item)}>
                              {item.published ? 'Metti in bozza' : 'Pubblica'}
                            </button>
                            <button type="button" className="primary-auth-button" onClick={() => handleDeleteNews(item.id)}>Elimina</button>
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
                        <input type="text" placeholder="Titolo album" value={albumTitle} onChange={(e) => setAlbumTitle(e.target.value)} />
                        <textarea placeholder="Descrizione album" value={albumDescription} onChange={(e) => setAlbumDescription(e.target.value)} rows={4} style={textareaStyle} />
                        <input type="text" placeholder="Categoria, es. Competizioni, Esami, Eventi" value={albumCategory} onChange={(e) => setAlbumCategory(e.target.value)} />
                        <input type="number" placeholder="Anno evento, es. 2026" value={albumYear} onChange={(e) => setAlbumYear(e.target.value)} />

                        <div style={{ display: 'grid', gap: '8px' }}>
                          <label style={mutedText}>Data evento opzionale</label>
                          <input type="date" value={albumDate} onChange={(e) => setAlbumDate(e.target.value)} />
                        </div>

                        <label style={checkboxLabelStyle}>
                          <input type="checkbox" checked={albumVisible} onChange={(e) => setAlbumVisible(e.target.checked)} />
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
                      <h3>Carica foto, video o PDF</h3>

                      <form onSubmit={handleUploadAlbumMedia} style={formStyle}>
                        <select value={selectedAlbumId} onChange={(e) => setSelectedAlbumId(e.target.value)}>
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
                          accept="image/*,video/mp4,video/webm,video/quicktime,.pdf"
                          multiple
                          onChange={(e) => setGalleryFiles(e.target.files)}
                        />

                        {galleryFiles && galleryFiles.length > 0 && <small style={mutedText}>File selezionati: {galleryFiles.length}</small>}

                        <button className="primary-auth-button" type="submit">Carica file selezionati</button>
                      </form>

                      {selectedAlbum && (
                        <div style={selectedAlbumBox}>
                          <strong>Album selezionato:</strong>
                          <br />
                          {selectedAlbum.title} · {selectedAlbum.event_year}
                          <br />
                          <span style={mutedText}>Contenuti presenti: {selectedAlbumMedia.length}</span>
                        </div>
                      )}

                      <hr style={dividerStyle} />

                      <h4>Aggiungi link YouTube</h4>

                      <form onSubmit={handleAddYoutubeVideo} style={formStyle}>
                        <input type="url" placeholder="Incolla link YouTube" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} />
                        <button className="primary-auth-button" type="submit">Aggiungi YouTube</button>
                      </form>

                      <hr style={dividerStyle} />

                      <h4>Aggiungi link social</h4>

                      <form onSubmit={handleAddSocialLink} style={formStyle}>
                        <input
                          type="url"
                          placeholder="Incolla link Facebook, Instagram o TikTok"
                          value={socialUrl}
                          onChange={(e) => setSocialUrl(e.target.value)}
                        />

                        <div style={{ display: 'grid', gap: '8px' }}>
                          <label style={mutedText}>Immagine anteprima opzionale</label>

                          <input
                            key={socialPreviewInputKey}
                            type="file"
                            accept="image/*"
                            onChange={(e) => setSocialPreviewFile(e.target.files?.[0] ?? null)}
                          />

                          {socialPreviewFile && (
                            <small style={mutedText}>
                              Anteprima selezionata: {socialPreviewFile.name}
                            </small>
                          )}
                        </div>

                        <button className="primary-auth-button" type="submit">
                          Aggiungi Social
                        </button>
                      </form>
                    </div>
                  </div>

                  <div style={{ marginTop: '30px' }}>
                    <div style={albumHeaderRow}>
                      <h3 style={{ margin: 0 }}>Album inseriti</h3>

                      <select value={albumYearFilter} onChange={(e) => setAlbumYearFilter(e.target.value)} style={compactSelectStyle}>
                        <option value="all">Tutti gli anni</option>
                        {availableYears.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>

                    {filteredAlbums.length === 0 && <p style={mutedText}>Non ci sono album per questo filtro.</p>}

                    <div style={compactAlbumList}>
                      {filteredAlbums.map((album) => {
                        const albumMedia = media.filter((item) => item.album_id === album.id)

                        return (
                          <div key={album.id} style={{ display: 'grid', gap: '8px' }}>
                            <article
                              style={{
                                ...compactAlbumCard,
                                border:
                                  selectedAlbumId === album.id
                                    ? '1px solid rgba(185,68,79,0.80)'
                                    : '1px solid rgba(255,255,255,0.10)',
                              }}
                            >
                              <div style={compactAlbumMain}>
                                {album.cover_image_url ? (
                                  <img src={album.cover_image_url} alt={album.title} style={compactCoverStyle} />
                                ) : (
                                  <div style={compactCoverPlaceholder}>📁</div>
                                )}

                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <h4 style={compactAlbumTitle}>{album.title}</h4>

                                  <p style={compactAlbumMeta}>
                                    {album.event_year}
                                    {album.event_date ? ` · ${new Date(album.event_date).toLocaleDateString('it-IT')}` : ''}
                                    {album.category ? ` · ${album.category}` : ''}
                                    {' · '}
                                    {album.visible ? 'Visibile' : 'Nascosto'}
                                    {' · '}
                                    {albumMedia.length} contenuti
                                  </p>
                                </div>
                              </div>

                              <div style={compactActionsRow}>
                                <button type="button" className="secondary-auth-button" onClick={() => handleManageAlbumMedia(album)} style={smallAdminButton}>Media</button>
                                <button type="button" className="secondary-auth-button" onClick={() => handleEditAlbum(album)} style={smallAdminButton}>Modifica</button>
                                <button type="button" className="secondary-auth-button" onClick={() => handleToggleAlbumVisible(album)} style={smallAdminButton}>
                                  {album.visible ? 'Nascondi' : 'Pubblica'}
                                </button>
                                <button type="button" className="primary-auth-button" onClick={() => handleDeleteAlbum(album.id)} style={smallDangerButton}>Elimina</button>
                              </div>
                            </article>

                            {selectedAlbumId === album.id && (
                              <div style={inlineMediaPanelStyle}>
                                <div style={photoManagerHeader}>
                                  <div>
                                    <h3 style={{ marginBottom: '6px' }}>Contenuti album: {album.title}</h3>
                                    <p style={{ ...mutedText, margin: 0 }}>
                                      {album.event_year} · {albumMedia.length} elementi
                                    </p>
                                  </div>

                                  <button
                                    type="button"
                                    className="secondary-auth-button"
                                    onClick={() => {
                                      setSelectedAlbumId('')
                                      setGalleryFiles(null)
                                      setYoutubeUrl('')
                                      setSocialUrl('')
                                      setSocialPreviewFile(null)
                                      setGalleryInputKey((prev) => prev + 1)
                                      setSocialPreviewInputKey((prev) => prev + 1)
                                    }}
                                    style={smallAdminButton}
                                  >
                                    Chiudi
                                  </button>
                                </div>

                                {albumMedia.length === 0 && (
                                  <p style={mutedText}>Questo album non contiene ancora media.</p>
                                )}

                                {albumMedia.length > 0 && (
                                  <div style={tinyPhotoGrid}>
                                    {albumMedia.map((item) => {
                                      const coverUrl =
                                        item.media_type === 'youtube'
                                          ? item.thumbnail_url
                                          : item.media_type === 'image'
                                            ? item.image_url
                                            : item.media_type === 'social'
                                              ? item.thumbnail_url
                                              : null

                                      const isCover = coverUrl && album.cover_image_url === coverUrl

                                      return (
                                        <div key={item.id} style={tinyPhotoCard}>
                                          {renderTinyMediaPreview(item)}

                                          {isCover && <span style={coverBadge}>Cover</span>}

                                          <div style={tinyPhotoActions}>
                                            <button type="button" onClick={() => handleSetCover(item)} style={tinyButton}>
                                              Cover
                                            </button>

                                            <button type="button" onClick={() => handleDeleteMedia(item)} style={tinyDeleteButton}>
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
              )}

              {adminTab === 'eventi' && (
                <div>
                  <div style={adminCardStyle}>
                    <h3>{editingEventId ? 'Modifica evento' : 'Crea nuovo evento'}</h3>

                    <form onSubmit={handleSaveEvent} style={formStyle}>
                      <input type="text" placeholder="Titolo evento" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} />
                      <textarea placeholder="Descrizione evento" value={eventDescription} onChange={(e) => setEventDescription(e.target.value)} rows={5} style={textareaStyle} />
                      <input type="text" placeholder="Luogo evento" value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} />

                      <label style={checkboxLabelStyle}>
                        <input type="checkbox" checked={eventIsProvisional} onChange={(e) => setEventIsProvisional(e.target.checked)} />
                        Data provvisoria
                      </label>

                      {!eventIsProvisional && (
                        <div style={{ display: 'grid', gap: '8px' }}>
                          <label style={mutedText}>Data precisa evento</label>
                          <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
                        </div>
                      )}

                      {eventIsProvisional && (
                        <div style={eventDateGrid}>
                          <div style={{ display: 'grid', gap: '8px' }}>
                            <label style={mutedText}>Mese provvisorio</label>
                            <select value={eventProvisionalMonth} onChange={(e) => setEventProvisionalMonth(e.target.value)}>
                              <option value="">Seleziona mese</option>
                              <option value="1">Gennaio</option>
                              <option value="2">Febbraio</option>
                              <option value="3">Marzo</option>
                              <option value="4">Aprile</option>
                              <option value="5">Maggio</option>
                              <option value="6">Giugno</option>
                              <option value="7">Luglio</option>
                              <option value="8">Agosto</option>
                              <option value="9">Settembre</option>
                              <option value="10">Ottobre</option>
                              <option value="11">Novembre</option>
                              <option value="12">Dicembre</option>
                            </select>
                          </div>

                          <div style={{ display: 'grid', gap: '8px' }}>
                            <label style={mutedText}>Anno provvisorio</label>
                            <input type="number" value={eventProvisionalYear} onChange={(e) => setEventProvisionalYear(e.target.value)} />
                          </div>
                        </div>
                      )}

                      <input type="url" placeholder="Link esterno opzionale" value={eventExternalUrl} onChange={(e) => setEventExternalUrl(e.target.value)} />
                      <input type="text" placeholder="Testo pulsante link, es. Iscriviti all’evento" value={eventExternalUrlLabel} onChange={(e) => setEventExternalUrlLabel(e.target.value)} />

                      {existingEventImageUrl && (
                        <div>
                          <p style={mutedText}>Immagine attuale:</p>
                          <img src={existingEventImageUrl} alt="Immagine evento attuale" style={previewImageStyle} />
                        </div>
                      )}

                      <div style={{ display: 'grid', gap: '8px' }}>
                        <label style={mutedText}>Immagine evento opzionale</label>
                        <input key={eventImageInputKey} type="file" accept="image/*" onChange={(e) => setEventImageFile(e.target.files?.[0] ?? null)} />
                        {eventImageFile && <small style={mutedText}>File selezionato: {eventImageFile.name}</small>}
                      </div>

                      <div style={{ display: 'grid', gap: '8px' }}>
                        <label style={mutedText}>Documenti evento opzionali</label>
                        <input key={eventDocsInputKey} type="file" multiple accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,image/*" onChange={(e) => setEventDocumentFiles(e.target.files)} />
                        {eventDocumentFiles && eventDocumentFiles.length > 0 && (
                          <small style={mutedText}>Documenti selezionati: {eventDocumentFiles.length}</small>
                        )}
                      </div>

                      <label style={checkboxLabelStyle}>
                        <input type="checkbox" checked={eventVisible} onChange={(e) => setEventVisible(e.target.checked)} />
                        Evento visibile nel calendario pubblico
                      </label>

                      <div style={actionsRow}>
                        <button className="primary-auth-button" type="submit">
                          {editingEventId ? 'Aggiorna evento' : 'Crea evento'}
                        </button>

                        {editingEventId && (
                          <button className="secondary-auth-button" type="button" onClick={resetEventForm}>
                            Annulla modifica
                          </button>
                        )}
                      </div>
                    </form>
                  </div>

                  <div style={{ marginTop: '30px' }}>
                    <h3>Eventi inseriti</h3>

                    {events.length === 0 && <p style={mutedText}>Non ci sono ancora eventi inseriti.</p>}

                    <div style={compactAlbumList}>
                      {events.map((event) => (
                        <article key={event.id} style={compactAlbumCard}>
                          <div style={compactAlbumMain}>
                            {event.image_url ? (
                              <img src={event.image_url} alt={event.title} style={compactCoverStyle} />
                            ) : (
                              <div style={compactCoverPlaceholder}>📅</div>
                            )}

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <h4 style={compactAlbumTitle}>{event.title}</h4>

                              <p style={compactAlbumMeta}>
                                {formatEventDate(event)}
                                {event.location ? ` · ${event.location}` : ''}
                                {' · '}
                                {event.visible ? 'Visibile' : 'Nascosto'}
                                {' · '}
                                {event.event_documents?.length ?? 0} documenti
                              </p>
                            </div>
                          </div>

                          {event.event_documents && event.event_documents.length > 0 && (
                            <div style={eventDocsList}>
                              {event.event_documents.map((doc) => (
                                <div key={doc.id} style={eventDocRow}>
                                  <a href={doc.file_url} target="_blank" rel="noreferrer" style={eventDocLink}>
                                    📄 {doc.title}
                                  </a>

                                  <button type="button" onClick={() => handleDeleteEventDocument(doc.id)} style={tinyDeleteButton}>
                                    X
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          <div style={compactActionsRow}>
                            <button type="button" className="secondary-auth-button" onClick={() => handleEditEvent(event)} style={smallAdminButton}>Modifica</button>
                            <button type="button" className="secondary-auth-button" onClick={() => handleToggleEventVisible(event)} style={smallAdminButton}>
                              {event.visible ? 'Nascondi' : 'Pubblica'}
                            </button>
                            <button type="button" className="primary-auth-button" onClick={() => handleDeleteEvent(event.id)} style={smallDangerButton}>Elimina</button>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {adminTab === 'documenti' && (
                <div>
                  <div style={adminCardStyle}>
                    <h3>{editingDocumentId ? 'Modifica documento' : 'Carica nuovo documento'}</h3>

                    <form onSubmit={handleSaveDocument} style={formStyle}>
                      <input
                        type="text"
                        placeholder="Titolo documento"
                        value={documentTitle}
                        onChange={(e) => setDocumentTitle(e.target.value)}
                      />

                      <select value={documentCategory} onChange={(e) => setDocumentCategory(e.target.value)}>
                        <option value="Moduli">Moduli</option>
                        <option value="Regolamenti">Regolamenti</option>
                        <option value="Documenti ufficiali">Documenti ufficiali</option>
                        <option value="Altro">Altro</option>
                      </select>

                      {existingDocumentFileUrl && (
                        <div style={documentCurrentFileBox}>
                          <p style={mutedText}>File attuale:</p>

                          <a href={existingDocumentFileUrl} target="_blank" rel="noreferrer" style={documentFileLink}>
                            Apri documento attuale
                          </a>
                        </div>
                      )}

                      <div style={{ display: 'grid', gap: '8px' }}>
                        <label style={mutedText}>
                          {editingDocumentId
                            ? 'Sostituisci file documento opzionale'
                            : 'File documento'}
                        </label>

                        <input
                          key={documentInputKey}
                          type="file"
                          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,image/*"
                          onChange={(e) => setDocumentFile(e.target.files?.[0] ?? null)}
                        />

                        {documentFile && <small style={mutedText}>File selezionato: {documentFile.name}</small>}
                      </div>

                      <label style={checkboxLabelStyle}>
                        <input type="checkbox" checked={documentVisible} onChange={(e) => setDocumentVisible(e.target.checked)} />
                        Documento visibile nella pagina pubblica
                      </label>

                      <div style={actionsRow}>
                        <button className="primary-auth-button" type="submit">
                          {editingDocumentId ? 'Aggiorna documento' : 'Carica documento'}
                        </button>

                        {editingDocumentId && (
                          <button className="secondary-auth-button" type="button" onClick={resetDocumentForm}>
                            Annulla modifica
                          </button>
                        )}
                      </div>
                    </form>
                  </div>

                  <div style={{ marginTop: '30px' }}>
                    <h3>Documenti caricati</h3>

                    {documents.length === 0 && <p style={mutedText}>Non ci sono ancora documenti caricati.</p>}

                    <div style={compactAlbumList}>
                      {documents.map((document) => (
                        <article key={document.id} style={compactAlbumCard}>
                          <div style={compactAlbumMain}>
                            <div style={compactCoverPlaceholder}>📄</div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <h4 style={compactAlbumTitle}>{document.title}</h4>

                              <p style={compactAlbumMeta}>
                                {document.category || 'Altro'}
                                {' · '}
                                {document.visible ? 'Visibile' : 'Nascosto'}
                                {' · '}
                                {document.created_at
                                  ? new Date(document.created_at).toLocaleDateString('it-IT')
                                  : ''}
                              </p>
                            </div>
                          </div>

                          <div style={compactActionsRow}>
                            <a href={document.file_url} target="_blank" rel="noreferrer" style={smallLinkButton}>
                              Apri
                            </a>

                            <button type="button" className="secondary-auth-button" onClick={() => handleEditDocument(document)} style={smallAdminButton}>
                              Modifica
                            </button>

                            <button type="button" className="secondary-auth-button" onClick={() => handleToggleDocumentVisible(document)} style={smallAdminButton}>
                              {document.visible ? 'Nascondi' : 'Pubblica'}
                            </button>

                            <button type="button" className="primary-auth-button" onClick={() => handleDeleteDocument(document.id)} style={smallDangerButton}>
                              Elimina
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {adminTab === 'insegnanti' && <AdminInsegnanti />}

              {adminTab === 'teoria' && <AdminTeoria />}

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
              Area personale utente. I contenuti amministrativi sono visibili solo all’admin.
            </div>
          )}

          <button style={{ marginTop: '30px' }} className="secondary-auth-button" onClick={handleLogout}>
            Logout
          </button>

          {!isAdmin && message && <p style={{ marginTop: '16px' }}>{message}</p>}
        </div>
      </div>
    </>
  )
}

const areaUtenteInlineStyles = `
.primary-auth-button,
.secondary-auth-button {
  border-radius: 999px !important;
  font-weight: 900 !important;
  border: none !important;
}

.primary-auth-button {
  background: linear-gradient(180deg, #b9444f 0%, #82232b 100%) !important;
  color: white !important;
  box-shadow: 0 8px 18px rgba(80, 10, 18, 0.24) !important;
}

.secondary-auth-button {
  background: rgba(255, 255, 255, 0.92) !important;
  color: #111 !important;
}

.primary-auth-button:hover,
.secondary-auth-button:hover {
  opacity: 0.9;
}
`

const adminSectionStyle: CSSProperties = {
  marginTop: '42px',
  paddingTop: '32px',
  borderTop: '1px solid rgba(255,255,255,0.12)',
}

const adminLabelStyle: CSSProperties = {
  color: '#d95b64',
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
  fontWeight: 800,
  background: active
    ? 'linear-gradient(180deg, #b9444f 0%, #82232b 100%)'
    : 'rgba(255,255,255,0.10)',
  color: active ? 'white' : '#d8d8d8',
  boxShadow: active ? '0 8px 18px rgba(80,10,18,0.24)' : 'none',
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
  background: 'rgba(185,68,79,0.18)',
  border: '1px solid rgba(185,68,79,0.28)',
  padding: '14px 16px',
  borderRadius: '14px',
  color: '#f3dede',
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
  background:
    'linear-gradient(135deg, rgba(185,68,79,0.26), rgba(255,255,255,0.10))',
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
  background:
    'linear-gradient(135deg, rgba(185,68,79,0.26), rgba(255,255,255,0.10))',
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

const eventDateGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: '12px',
}

const eventDocsList: CSSProperties = {
  display: 'grid',
  gap: '6px',
  marginTop: '10px',
}

const eventDocRow: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '8px',
  background: 'rgba(0,0,0,0.16)',
  padding: '6px 8px',
  borderRadius: '10px',
}

const eventDocLink: CSSProperties = {
  color: 'white',
  textDecoration: 'none',
  fontSize: '12px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const documentCurrentFileBox: CSSProperties = {
  display: 'grid',
  gap: '8px',
  padding: '12px',
  borderRadius: '12px',
  background: 'rgba(0,0,0,0.16)',
}

const documentFileLink: CSSProperties = {
  color: 'white',
  textDecoration: 'none',
  background: 'rgba(255,255,255,0.10)',
  padding: '8px 12px',
  borderRadius: '999px',
  fontWeight: 700,
  fontSize: '13px',
  width: 'fit-content',
}

const smallLinkButton: CSSProperties = {
  display: 'inline-block',
  padding: '6px 10px',
  fontSize: '12px',
  borderRadius: '999px',
  background: 'white',
  color: '#111',
  textDecoration: 'none',
  fontWeight: 800,
}

const userInfoBox: CSSProperties = {
  marginTop: '32px',
  padding: '20px',
  borderRadius: '14px',
  background: 'rgba(255,255,255,0.06)',
  color: '#d8d8d8',
}

export default AreaUtente