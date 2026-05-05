import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'

const DOCUMENTS_BUCKET = 'documents'

type DojoDocument = {
  id: string
  title: string
  category: string | null
  file_url: string
  file_type: string | null
  visible: boolean
  created_at: string
}

function AdminDocumenti() {
  const [documents, setDocuments] = useState<DojoDocument[]>([])
  const [message, setMessage] = useState('')

  const [documentTitle, setDocumentTitle] = useState('')
  const [documentCategory, setDocumentCategory] = useState('Moduli')
  const [documentVisible, setDocumentVisible] = useState(true)
  const [documentFile, setDocumentFile] = useState<File | null>(null)

  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null)
  const [existingDocumentFileUrl, setExistingDocumentFileUrl] = useState<string | null>(null)
  const [existingDocumentFileType, setExistingDocumentFileType] = useState<string | null>(null)
  const [documentInputKey, setDocumentInputKey] = useState(0)

  const [categoryFilter, setCategoryFilter] = useState('all')

  useEffect(() => {
    loadDocuments()
  }, [])

  const categories = useMemo(() => {
    return Array.from(new Set(documents.map((item) => item.category || 'Altro'))).sort()
  }, [documents])

  const filteredDocuments = useMemo(() => {
    if (categoryFilter === 'all') return documents
    return documents.filter((item) => (item.category || 'Altro') === categoryFilter)
  }, [documents, categoryFilter])

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

  async function uploadFileToBucket(file: File) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
    const filePath = `documents/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data } = supabase.storage.from(DOCUMENTS_BUCKET).getPublicUrl(filePath)

    return data.publicUrl
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
        finalFileUrl = await uploadFileToBucket(documentFile)
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

  function getDocumentIcon(document: DojoDocument) {
    const fileType = document.file_type?.toLowerCase() || ''
    const title = document.title.toLowerCase()

    if (fileType.includes('pdf') || title.endsWith('.pdf')) return 'PDF'
    if (fileType.includes('word') || title.endsWith('.doc') || title.endsWith('.docx')) return 'DOC'
    if (fileType.includes('powerpoint') || title.endsWith('.ppt') || title.endsWith('.pptx')) return 'PPT'
    if (fileType.includes('excel') || title.endsWith('.xls') || title.endsWith('.xlsx')) return 'XLS'
    if (fileType.includes('image')) return 'IMG'

    return 'FILE'
  }

  function formatDate(value: string) {
    return new Date(value).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  return (
    <div style={wrapperStyle}>
      <div style={topHeaderStyle}>
        <div>
          <p style={adminLabelStyle}>Archivio</p>
          <h3 style={pageTitleStyle}>Gestione Documenti</h3>
          <p style={introStyle}>
            Carica moduli, regolamenti, documenti ufficiali, immagini o file da rendere
            disponibili nella pagina pubblica Documenti.
          </p>
        </div>
      </div>

      {message && <div style={messageBox}>{message}</div>}

      <div style={adminLayoutStyle}>
        <div style={adminCardStyle}>
          <h3 style={cardTitleStyle}>{editingDocumentId ? 'Modifica documento' : 'Carica nuovo documento'}</h3>

          <form onSubmit={handleSaveDocument} style={formStyle}>
            <input
              type="text"
              placeholder="Titolo documento"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
            />

            <div style={twoColumnsStyle}>
              <div style={fieldGroupStyle}>
                <label style={fieldLabelStyle}>Categoria</label>
                <select value={documentCategory} onChange={(e) => setDocumentCategory(e.target.value)}>
                  <option value="Moduli">Moduli</option>
                  <option value="Regolamenti">Regolamenti</option>
                  <option value="Documenti ufficiali">Documenti ufficiali</option>
                  <option value="Comunicazioni">Comunicazioni</option>
                  <option value="Foto e immagini">Foto e immagini</option>
                  <option value="Altro">Altro</option>
                </select>
              </div>

              <div style={fieldGroupStyle}>
                <label style={fieldLabelStyle}>Stato</label>
                <label style={checkboxBoxStyle}>
                  <input
                    type="checkbox"
                    checked={documentVisible}
                    onChange={(e) => setDocumentVisible(e.target.checked)}
                  />
                  Visibile nella pagina pubblica
                </label>
              </div>
            </div>

            <div style={uploadBoxStyle}>
              <label style={fieldLabelStyle}>
                {editingDocumentId ? 'Sostituisci file opzionale' : 'File documento'}
              </label>

              {existingDocumentFileUrl && (
                <a href={existingDocumentFileUrl} target="_blank" rel="noreferrer" style={currentFileLinkStyle}>
                  Apri documento attuale
                </a>
              )}

              <input
                key={documentInputKey}
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,image/*"
                onChange={(e) => setDocumentFile(e.target.files?.[0] ?? null)}
              />

              {documentFile && <small style={mutedText}>File selezionato: {documentFile.name}</small>}
            </div>

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

        <div style={adminCardStyle}>
          <h3 style={cardTitleStyle}>Filtra documenti</h3>

          <div style={formStyle}>
            <div style={fieldGroupStyle}>
              <label style={fieldLabelStyle}>Categoria elenco</label>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value="all">Tutte le categorie</option>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div style={summaryBoxStyle}>
              <strong>{filteredDocuments.length}</strong>
              <span>documenti visualizzati</span>
            </div>
          </div>
        </div>
      </div>

      <div style={listSectionStyle}>
        <h3 style={{ margin: 0 }}>Documenti caricati</h3>

        {filteredDocuments.length === 0 && (
          <p style={mutedText}>Non ci sono documenti per questo filtro.</p>
        )}

        <div style={documentsListStyle}>
          {filteredDocuments.map((document) => (
            <article key={document.id} style={documentRowStyle}>
              <div style={documentIconStyle}>{getDocumentIcon(document)}</div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={rowTitleStyle}>{document.title}</h4>

                <p style={rowMetaStyle}>
                  {document.category || 'Altro'}
                  {' · '}
                  {document.visible ? 'Visibile' : 'Nascosto'}
                  {' · '}
                  {document.created_at ? formatDate(document.created_at) : ''}
                </p>
              </div>

              <div style={rowActionsStyle}>
                <a href={document.file_url} target="_blank" rel="noreferrer" style={smallLinkButton}>
                  Apri
                </a>

                <button
                  type="button"
                  className="secondary-auth-button"
                  onClick={() => handleEditDocument(document)}
                  style={smallAdminButton}
                >
                  Modifica
                </button>

                <button
                  type="button"
                  className="secondary-auth-button"
                  onClick={() => handleToggleDocumentVisible(document)}
                  style={smallAdminButton}
                >
                  {document.visible ? 'Nascondi' : 'Pubblica'}
                </button>

                <button
                  type="button"
                  className="primary-auth-button"
                  onClick={() => handleDeleteDocument(document.id)}
                  style={smallDangerButton}
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
  gridTemplateColumns: 'minmax(300px, 1.35fr) minmax(260px, 0.65fr)',
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

const checkboxBoxStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  minHeight: '42px',
  color: '#d8d8d8',
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

const documentsListStyle: CSSProperties = {
  display: 'grid',
  gap: '10px',
}

const documentRowStyle: CSSProperties = {
  display: 'flex',
  gap: '12px',
  alignItems: 'center',
  background: 'rgba(255,255,255,0.06)',
  borderRadius: '14px',
  padding: '12px',
  border: '1px solid rgba(255,255,255,0.10)',
  flexWrap: 'wrap',
}

const documentIconStyle: CSSProperties = {
  width: '50px',
  height: '50px',
  borderRadius: '12px',
  background: 'rgba(185,68,79,0.18)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '13px',
  fontWeight: 900,
  color: 'white',
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

export default AdminDocumenti
