import { useEffect, useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'

const BUCKET = 'self-defense'

type DefenseMedia = {
  id: string
  title: string | null
  description: string | null
  media_url: string
  media_type: 'image' | 'video'
  thumbnail_url: string | null
  visible: boolean
  sort_order: number
  created_at: string
}

export default function AdminDifesaPersonale() {
  const [items, setItems] = useState<DefenseMedia[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [visible, setVisible] = useState(true)
  const [sortOrder, setSortOrder] = useState('0')
  const [file, setFile] = useState<File | null>(null)
  const [inputKey, setInputKey] = useState(0)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadItems()
  }, [])

  async function loadItems() {
    const { data, error } = await supabase
      .from('self_defense_media')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      setMessage(`Errore caricamento media: ${error.message}`)
      return
    }

    setItems((data ?? []) as DefenseMedia[])
  }

  async function uploadFile(selectedFile: File) {
    const fileExt = selectedFile.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
    const filePath = `media/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, selectedFile)

    if (uploadError) throw uploadError

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath)

    return data.publicUrl
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault()

    if (!file) {
      setMessage('Seleziona un file immagine o video')
      return
    }

    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')

    if (!isImage && !isVideo) {
      setMessage('Puoi caricare solo immagini o video')
      return
    }

    setMessage('Caricamento in corso...')

    try {
      const mediaUrl = await uploadFile(file)

      const { error } = await supabase.from('self_defense_media').insert({
        title: title.trim() || null,
        description: description.trim() || null,
        media_url: mediaUrl,
        media_type: isImage ? 'image' : 'video',
        thumbnail_url: null,
        visible,
        sort_order: Number(sortOrder) || 0,
      })

      if (error) {
        setMessage(`Errore salvataggio: ${error.message}`)
        return
      }

      setTitle('')
      setDescription('')
      setVisible(true)
      setSortOrder('0')
      setFile(null)
      setInputKey((prev) => prev + 1)
      setMessage('Media caricato correttamente')
      loadItems()
    } catch (error) {
      console.error(error)
      setMessage(error instanceof Error ? error.message : 'Errore durante il caricamento')
    }
  }

  async function handleToggleVisible(item: DefenseMedia) {
    const { error } = await supabase
      .from('self_defense_media')
      .update({ visible: !item.visible })
      .eq('id', item.id)

    if (error) {
      setMessage(`Errore visibilità: ${error.message}`)
      return
    }

    setMessage('Visibilità aggiornata')
    loadItems()
  }

  async function handleDelete(id: string) {
    const confirmDelete = window.confirm('Vuoi eliminare questo media?')
    if (!confirmDelete) return

    const { error } = await supabase
      .from('self_defense_media')
      .delete()
      .eq('id', id)

    if (error) {
      setMessage(`Errore eliminazione: ${error.message}`)
      return
    }

    setMessage('Media eliminato')
    loadItems()
  }

  async function handleUpdateSort(item: DefenseMedia, newSort: string) {
    const numericSort = Number(newSort)

    const { error } = await supabase
      .from('self_defense_media')
      .update({ sort_order: Number.isNaN(numericSort) ? 0 : numericSort })
      .eq('id', item.id)

    if (error) {
      setMessage(`Errore ordinamento: ${error.message}`)
      return
    }

    loadItems()
  }

  return (
    <div style={wrapperStyle}>
      <div style={cardStyle}>
        <h3 style={titleStyle}>Gestione Difesa personale</h3>

        <p style={mutedText}>
          Da qui puoi caricare immagini o video che appariranno nella mini galleria
          della pagina pubblica “Difesa personale”.
        </p>

        <form onSubmit={handleCreate} style={formStyle}>
          <input
            type="text"
            placeholder="Titolo opzionale"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            placeholder="Descrizione opzionale"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            style={textareaStyle}
          />

          <input
            key={inputKey}
            type="file"
            accept="image/*,video/mp4,video/webm,video/quicktime"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />

          {file && <small style={mutedText}>File selezionato: {file.name}</small>}

          <input
            type="number"
            placeholder="Ordine"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          />

          <label style={checkboxStyle}>
            <input
              type="checkbox"
              checked={visible}
              onChange={(e) => setVisible(e.target.checked)}
            />
            Visibile nella pagina pubblica
          </label>

          <button className="primary-auth-button" type="submit">
            Carica media
          </button>
        </form>

        {message && <div style={messageStyle}>{message}</div>}
      </div>

      <div style={cardStyle}>
        <h3 style={titleStyle}>Media caricati</h3>

        {items.length === 0 ? (
          <p style={mutedText}>Nessun media caricato.</p>
        ) : (
          <div style={gridStyle}>
            {items.map((item) => (
              <article key={item.id} style={mediaCardStyle}>
                {item.media_type === 'video' ? (
                  <video src={item.media_url} style={previewStyle} muted controls />
                ) : (
                  <img src={item.media_url} alt={item.title || 'Difesa personale'} style={previewStyle} />
                )}

                <div style={mediaBodyStyle}>
                  <strong>{item.title || 'Senza titolo'}</strong>

                  {item.description && (
                    <p style={smallTextStyle}>{item.description}</p>
                  )}

                  <p style={smallTextStyle}>
                    Stato: {item.visible ? 'Visibile' : 'Nascosto'}
                  </p>

                  <input
                    type="number"
                    defaultValue={item.sort_order}
                    onBlur={(e) => handleUpdateSort(item, e.target.value)}
                    style={sortInputStyle}
                  />

                  <div style={actionsStyle}>
                    <button
                      type="button"
                      className="secondary-auth-button"
                      onClick={() => handleToggleVisible(item)}
                      style={smallButtonStyle}
                    >
                      {item.visible ? 'Nascondi' : 'Pubblica'}
                    </button>

                    <button
                      type="button"
                      className="primary-auth-button"
                      onClick={() => handleDelete(item.id)}
                      style={smallButtonStyle}
                    >
                      Elimina
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const wrapperStyle: CSSProperties = {
  display: 'grid',
  gap: '22px',
}

const cardStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: '18px',
  padding: '22px',
}

const titleStyle: CSSProperties = {
  marginTop: 0,
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

const checkboxStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  color: '#d8d8d8',
}

const messageStyle: CSSProperties = {
  marginTop: '16px',
  padding: '12px 14px',
  borderRadius: '14px',
  background: 'rgba(185,68,79,0.18)',
  border: '1px solid rgba(185,68,79,0.28)',
  color: '#f3dede',
}

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '16px',
  marginTop: '18px',
}

const mediaCardStyle: CSSProperties = {
  background: 'rgba(0,0,0,0.18)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
  overflow: 'hidden',
}

const previewStyle: CSSProperties = {
  width: '100%',
  aspectRatio: '16 / 10',
  objectFit: 'cover',
  display: 'block',
  background: '#111',
}

const mediaBodyStyle: CSSProperties = {
  padding: '14px',
  display: 'grid',
  gap: '8px',
}

const smallTextStyle: CSSProperties = {
  color: '#d8d8d8',
  fontSize: '13px',
  lineHeight: 1.5,
  margin: 0,
}

const sortInputStyle: CSSProperties = {
  maxWidth: '90px',
}

const actionsStyle: CSSProperties = {
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap',
}

const smallButtonStyle: CSSProperties = {
  padding: '7px 12px',
  fontSize: '12px',
}
