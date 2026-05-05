import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'

const THEORY_FILES_BUCKET = 'theory-files'

type TheorySection = 'fondamenti' | 'risorse'
type TheoryResourceType = 'file' | 'video' | 'youtube' | 'social' | 'link'

type TheoryResource = {
  id: string
  section: TheorySection
  category: string | null
  title: string
  description: string | null
  resource_type: TheoryResourceType
  file_url: string | null
  external_url: string | null
  file_type: string | null
  visible: boolean
  sort_order: number | null
  created_at: string
}

function AdminTeoria() {
  const [resources, setResources] = useState<TheoryResource[]>([])
  const [message, setMessage] = useState('')

  const [section, setSection] = useState<TheorySection>('fondamenti')
  const [category, setCategory] = useState('KATA')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [resourceType, setResourceType] = useState<TheoryResourceType>('file')
  const [externalUrl, setExternalUrl] = useState('')
  const [resourceFile, setResourceFile] = useState<File | null>(null)
  const [visible, setVisible] = useState(true)
  const [sortOrder, setSortOrder] = useState('0')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [existingFileUrl, setExistingFileUrl] = useState<string | null>(null)
  const [existingFileType, setExistingFileType] = useState<string | null>(null)
  const [fileInputKey, setFileInputKey] = useState(0)

  const [listSectionFilter, setListSectionFilter] = useState<TheorySection>('fondamenti')
  const [listCategoryFilter, setListCategoryFilter] = useState('all')

  useEffect(() => {
    loadResources()
  }, [])

  const availableCategories = useMemo(() => {
    return Array.from(
      new Set(
        resources
          .filter((item) => item.section === 'risorse' && item.category)
          .map((item) => item.category as string)
      )
    ).sort()
  }, [resources])

  const filteredResources = useMemo(() => {
    return resources.filter((item) => {
      if (item.section !== listSectionFilter) return false
      if (listSectionFilter === 'risorse' && listCategoryFilter !== 'all') {
        return item.category === listCategoryFilter
      }
      return true
    })
  }, [resources, listSectionFilter, listCategoryFilter])

  async function loadResources() {
    const { data, error } = await supabase
      .from('theory_resources')
      .select(
        'id, section, category, title, description, resource_type, file_url, external_url, file_type, visible, sort_order, created_at'
      )
      .order('section', { ascending: true })
      .order('category', { ascending: true, nullsFirst: false })
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      setMessage(`Errore caricamento contenuti teoria: ${error.message}`)
      return
    }

    setResources((data ?? []) as TheoryResource[])
  }

  async function uploadTheoryFile(file: File) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
    const filePath = `${section}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from(THEORY_FILES_BUCKET)
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data } = supabase.storage.from(THEORY_FILES_BUCKET).getPublicUrl(filePath)

    return data.publicUrl
  }

  function resetForm() {
    setSection('fondamenti')
    setCategory('KATA')
    setTitle('')
    setDescription('')
    setResourceType('file')
    setExternalUrl('')
    setResourceFile(null)
    setVisible(true)
    setSortOrder('0')
    setEditingId(null)
    setExistingFileUrl(null)
    setExistingFileType(null)
    setFileInputKey((prev) => prev + 1)
  }

  async function handleSaveResource(e: FormEvent) {
    e.preventDefault()

    if (!title.trim()) {
      setMessage('Inserisci il titolo del contenuto')
      return
    }

    if ((resourceType === 'file' || resourceType === 'video') && !resourceFile && !existingFileUrl) {
      setMessage('Seleziona un file da caricare')
      return
    }

    if ((resourceType === 'youtube' || resourceType === 'social' || resourceType === 'link') && !externalUrl.trim()) {
      setMessage('Inserisci un link valido')
      return
    }

    setMessage(editingId ? 'Aggiornamento contenuto...' : 'Salvataggio contenuto...')

    try {
      let finalFileUrl = existingFileUrl
      let finalFileType = existingFileType

      if ((resourceType === 'file' || resourceType === 'video') && resourceFile) {
        finalFileUrl = await uploadTheoryFile(resourceFile)
        finalFileType = resourceFile.type || null
      }

      const payload = {
        section,
        category: section === 'risorse' ? category : null,
        title: title.trim(),
        description: description.trim() || null,
        resource_type: resourceType,
        file_url: resourceType === 'file' || resourceType === 'video' ? finalFileUrl : null,
        external_url:
          resourceType === 'youtube' || resourceType === 'social' || resourceType === 'link'
            ? externalUrl.trim()
            : null,
        file_type: resourceType === 'file' || resourceType === 'video' ? finalFileType : null,
        visible,
        sort_order: Number(sortOrder) || 0,
      }

      if (editingId) {
        const { error } = await supabase
          .from('theory_resources')
          .update(payload)
          .eq('id', editingId)

        if (error) {
          setMessage(`Errore aggiornamento contenuto: ${error.message}`)
          return
        }

        setMessage('Contenuto aggiornato correttamente')
      } else {
        const { error } = await supabase.from('theory_resources').insert(payload)

        if (error) {
          setMessage(`Errore inserimento contenuto: ${error.message}`)
          return
        }

        setMessage('Contenuto inserito correttamente')
      }

      resetForm()
      loadResources()
    } catch (error) {
      console.error(error)

      if (error instanceof Error) {
        setMessage(`Errore salvataggio contenuto: ${error.message}`)
      } else {
        setMessage('Errore salvataggio contenuto')
      }
    }
  }

  function handleEditResource(item: TheoryResource) {
    setEditingId(item.id)
    setSection(item.section)
    setListSectionFilter(item.section)
    setCategory(item.category || 'KATA')
    setTitle(item.title)
    setDescription(item.description || '')
    setResourceType(item.resource_type)
    setExternalUrl(item.external_url || '')
    setExistingFileUrl(item.file_url)
    setExistingFileType(item.file_type)
    setResourceFile(null)
    setVisible(item.visible)
    setSortOrder(String(item.sort_order ?? 0))
    setFileInputKey((prev) => prev + 1)
    setMessage('Modifica contenuto in corso')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleToggleVisible(item: TheoryResource) {
    const { error } = await supabase
      .from('theory_resources')
      .update({ visible: !item.visible })
      .eq('id', item.id)

    if (error) {
      setMessage(`Errore aggiornamento visibilità: ${error.message}`)
      return
    }

    setMessage('Visibilità aggiornata')
    loadResources()
  }

  async function handleDeleteResource(id: string) {
    const confirmDelete = window.confirm('Vuoi eliminare questo contenuto?')
    if (!confirmDelete) return

    const { error } = await supabase.from('theory_resources').delete().eq('id', id)

    if (error) {
      setMessage(`Errore eliminazione contenuto: ${error.message}`)
      return
    }

    setMessage('Contenuto eliminato')
    loadResources()
  }

  function getResourceUrl(item: TheoryResource) {
    return item.file_url || item.external_url || '#'
  }

  function getResourceTypeLabel(type: TheoryResourceType) {
    if (type === 'file') return 'Documento'
    if (type === 'video') return 'Video caricato'
    if (type === 'youtube') return 'YouTube'
    if (type === 'social') return 'Social'
    return 'Link esterno'
  }

  function getResourceIcon(type: TheoryResourceType) {
    if (type === 'file') return '📄'
    if (type === 'video') return '🎥'
    if (type === 'youtube') return '▶️'
    if (type === 'social') return '🔗'
    return '🌐'
  }

  function getFileAccept() {
    if (resourceType === 'video') return 'video/mp4,video/webm,video/quicktime'
    return '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,image/*'
  }

  return (
    <div style={wrapperStyle}>
      <div style={topHeaderStyle}>
        <div>
          <p style={adminLabelStyle}>Area didattica</p>
          <h3 style={pageTitleStyle}>Gestione Teoria Karate</h3>
          <p style={introStyle}>
            Inserisci fondamenti, dispense, PDF, video, link YouTube e risorse didattiche
            visibili nella pagina pubblica della teoria.
          </p>
        </div>
      </div>

      {message && <div style={messageBox}>{message}</div>}

      <div style={adminLayoutStyle}>
        <div style={adminCardStyle}>
          <h3 style={cardTitleStyle}>{editingId ? 'Modifica contenuto' : 'Inserisci nuovo contenuto'}</h3>

          <form onSubmit={handleSaveResource} style={formStyle}>
            <div style={twoColumnsStyle}>
              <div style={fieldGroupStyle}>
                <label style={fieldLabelStyle}>Sezione</label>
                <select
                  value={section}
                  onChange={(e) => setSection(e.target.value as TheorySection)}
                >
                  <option value="fondamenti">Fondamenti</option>
                  <option value="risorse">Risorse didattiche</option>
                </select>
              </div>

              <div style={fieldGroupStyle}>
                <label style={fieldLabelStyle}>Categoria</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={section === 'fondamenti'}
                >
                  <option value="KATA">KATA</option>
                  <option value="KUMITE">KUMITE</option>
                  <option value="ESAMI">ESAMI</option>
                  <option value="KIHON">KIHON</option>
                  <option value="REGOLAMENTI">REGOLAMENTI</option>
                  <option value="ESERCIZI PREPARAZIONE ATLETICA">ESERCIZI PREPARAZIONE ATLETICA</option>
                  <option value="ALTRO">ALTRO</option>
                </select>
              </div>
            </div>

            <div style={twoColumnsStyle}>
              <div style={fieldGroupStyle}>
                <label style={fieldLabelStyle}>Tipo contenuto</label>
                <select
                  value={resourceType}
                  onChange={(e) => setResourceType(e.target.value as TheoryResourceType)}
                >
                  <option value="file">Documento / PDF / Immagine</option>
                  <option value="video">Video caricato</option>
                  <option value="youtube">Link YouTube</option>
                  <option value="social">Link Social</option>
                  <option value="link">Link esterno</option>
                </select>
              </div>

              <div style={fieldGroupStyle}>
                <label style={fieldLabelStyle}>Ordine visualizzazione</label>
                <input
                  type="number"
                  placeholder="0"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                />
              </div>
            </div>

            <input
              type="text"
              placeholder="Titolo contenuto"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <textarea
              placeholder="Descrizione breve opzionale"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              style={textareaStyle}
            />

            {(resourceType === 'file' || resourceType === 'video') && (
              <div style={uploadBoxStyle}>
                <label style={fieldLabelStyle}>
                  {editingId ? 'Sostituisci file opzionale' : 'Carica file'}
                </label>

                {existingFileUrl && (
                  <a href={existingFileUrl} target="_blank" rel="noreferrer" style={currentFileLinkStyle}>
                    Apri file attuale
                  </a>
                )}

                <input
                  key={fileInputKey}
                  type="file"
                  accept={getFileAccept()}
                  onChange={(e) => setResourceFile(e.target.files?.[0] ?? null)}
                />

                {resourceFile && <small style={mutedText}>File selezionato: {resourceFile.name}</small>}
              </div>
            )}

            {(resourceType === 'youtube' || resourceType === 'social' || resourceType === 'link') && (
              <input
                type="url"
                placeholder="Incolla link"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
              />
            )}

            <label style={checkboxLabelStyle}>
              <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} />
              Contenuto visibile nella pagina pubblica
            </label>

            <div style={actionsRow}>
              <button className="primary-auth-button" type="submit">
                {editingId ? 'Aggiorna contenuto' : 'Salva contenuto'}
              </button>

              {editingId && (
                <button className="secondary-auth-button" type="button" onClick={resetForm}>
                  Annulla modifica
                </button>
              )}
            </div>
          </form>
        </div>

        <div style={adminCardStyle}>
          <h3 style={cardTitleStyle}>Filtra contenuti</h3>

          <div style={formStyle}>
            <div style={fieldGroupStyle}>
              <label style={fieldLabelStyle}>Sezione elenco</label>
              <select
                value={listSectionFilter}
                onChange={(e) => {
                  setListSectionFilter(e.target.value as TheorySection)
                  setListCategoryFilter('all')
                }}
              >
                <option value="fondamenti">Fondamenti</option>
                <option value="risorse">Risorse didattiche</option>
              </select>
            </div>

            {listSectionFilter === 'risorse' && (
              <div style={fieldGroupStyle}>
                <label style={fieldLabelStyle}>Categoria</label>
                <select value={listCategoryFilter} onChange={(e) => setListCategoryFilter(e.target.value)}>
                  <option value="all">Tutte le categorie</option>
                  {availableCategories.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>
            )}

            <div style={summaryBoxStyle}>
              <strong>{filteredResources.length}</strong>
              <span>contenuti visualizzati</span>
            </div>
          </div>
        </div>
      </div>

      <div style={listSectionStyle}>
        <h3 style={{ margin: 0 }}>Contenuti inseriti</h3>

        {filteredResources.length === 0 && (
          <p style={mutedText}>Non ci sono ancora contenuti in questa sezione.</p>
        )}

        <div style={resourcesListStyle}>
          {filteredResources.map((item) => (
            <article key={item.id} style={resourceRowStyle}>
              <div style={resourceIconStyle}>{getResourceIcon(item.resource_type)}</div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={rowTitleStyle}>{item.title}</h4>

                <p style={rowMetaStyle}>
                  {item.section === 'fondamenti' ? 'Fondamenti' : item.category || 'Risorse'}
                  {' · '}
                  {getResourceTypeLabel(item.resource_type)}
                  {' · '}
                  {item.visible ? 'Visibile' : 'Nascosto'}
                  {' · Ordine '}
                  {item.sort_order ?? 0}
                </p>

                {item.description && (
                  <p style={rowDescriptionStyle}>
                    {item.description.length > 160
                      ? `${item.description.substring(0, 160)}...`
                      : item.description}
                  </p>
                )}
              </div>

              <div style={rowActionsStyle}>
                <a href={getResourceUrl(item)} target="_blank" rel="noreferrer" style={smallLinkButton}>
                  Apri
                </a>

                <button
                  type="button"
                  className="secondary-auth-button"
                  style={smallAdminButton}
                  onClick={() => handleEditResource(item)}
                >
                  Modifica
                </button>

                <button
                  type="button"
                  className="secondary-auth-button"
                  style={smallAdminButton}
                  onClick={() => handleToggleVisible(item)}
                >
                  {item.visible ? 'Nascondi' : 'Pubblica'}
                </button>

                <button
                  type="button"
                  className="primary-auth-button"
                  style={smallDangerButton}
                  onClick={() => handleDeleteResource(item.id)}
                >
                  Elimina
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}

const wrapperStyle: CSSProperties = {
  display: 'grid',
  gap: '20px',
}

const topHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '16px',
  alignItems: 'flex-start',
  flexWrap: 'wrap',
}

const adminLabelStyle: CSSProperties = {
  margin: 0,
  color: '#d95b64',
  fontWeight: 900,
  letterSpacing: '2px',
  textTransform: 'uppercase',
  fontSize: '13px',
}

const pageTitleStyle: CSSProperties = {
  margin: '6px 0 8px',
  fontSize: '28px',
  color: 'white',
}

const introStyle: CSSProperties = {
  margin: 0,
  color: '#d8d8d8',
  lineHeight: 1.6,
  maxWidth: '780px',
}

const adminLayoutStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(300px, 1.4fr) minmax(260px, 0.6fr)',
  gap: '20px',
}

const adminCardStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: '18px',
  padding: '22px',
}

const cardTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: '20px',
  color: 'white',
}

const formStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
  marginTop: '18px',
}

const twoColumnsStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '14px',
}

const fieldGroupStyle: CSSProperties = {
  display: 'grid',
  gap: '8px',
}

const fieldLabelStyle: CSSProperties = {
  color: '#d8d8d8',
  fontSize: '13px',
  fontWeight: 800,
}

const textareaStyle: CSSProperties = {
  borderRadius: '12px',
  padding: '14px',
  border: '1px solid rgba(255,255,255,0.16)',
  resize: 'vertical',
  fontFamily: 'inherit',
}

const uploadBoxStyle: CSSProperties = {
  display: 'grid',
  gap: '10px',
  padding: '14px',
  borderRadius: '14px',
  background: 'rgba(0,0,0,0.16)',
  border: '1px dashed rgba(255,255,255,0.18)',
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
}

const currentFileLinkStyle: CSSProperties = {
  color: 'white',
  textDecoration: 'none',
  background: 'rgba(255,255,255,0.10)',
  padding: '8px 12px',
  borderRadius: '999px',
  fontWeight: 800,
  width: 'fit-content',
  fontSize: '13px',
}

const summaryBoxStyle: CSSProperties = {
  display: 'grid',
  gap: '3px',
  padding: '16px',
  borderRadius: '14px',
  background: 'rgba(185,68,79,0.18)',
  color: 'white',
}

const listSectionStyle: CSSProperties = {
  display: 'grid',
  gap: '14px',
}

const resourcesListStyle: CSSProperties = {
  display: 'grid',
  gap: '10px',
}

const resourceRowStyle: CSSProperties = {
  display: 'flex',
  gap: '12px',
  alignItems: 'center',
  background: 'rgba(255,255,255,0.06)',
  borderRadius: '14px',
  padding: '12px',
  border: '1px solid rgba(255,255,255,0.10)',
  flexWrap: 'wrap',
}

const resourceIconStyle: CSSProperties = {
  width: '46px',
  height: '46px',
  borderRadius: '12px',
  background: 'rgba(185,68,79,0.18)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '22px',
  flexShrink: 0,
}

const rowTitleStyle: CSSProperties = {
  margin: '0 0 4px',
  fontSize: '15px',
  fontWeight: 900,
  color: 'white',
}

const rowMetaStyle: CSSProperties = {
  margin: 0,
  color: '#d8d8d8',
  fontSize: '12px',
  lineHeight: 1.35,
}

const rowDescriptionStyle: CSSProperties = {
  margin: '6px 0 0',
  color: '#cbd5e1',
  fontSize: '12px',
  lineHeight: 1.45,
}

const rowActionsStyle: CSSProperties = {
  display: 'flex',
  gap: '6px',
  flexWrap: 'wrap',
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

export default AdminTeoria
