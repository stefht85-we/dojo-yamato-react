import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import { getSignedUrlFromPublicUrl } from '../lib/storageSignedUrl'

type DojoDocument = {
  id: string
  title: string
  category: string | null
  file_url: string
  file_type: string | null
  visible: boolean
  created_at: string
}

function Documenti() {
  const [user, setUser] = useState<User | null>(null)
  const [documents, setDocuments] = useState<DojoDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [accessMessage, setAccessMessage] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const canAccessMedia = Boolean(user)

  useEffect(() => {
    loadUser()
    loadDocuments()
  }, [])

  const categories = useMemo(() => {
    return Array.from(new Set(documents.map((item) => item.category || 'Altro'))).sort()
  }, [documents])

  const filteredDocuments = useMemo(() => {
    if (categoryFilter === 'all') return documents
    return documents.filter((item) => (item.category || 'Altro') === categoryFilter)
  }, [documents, categoryFilter])

  async function loadUser() {
    const { data } = await supabase.auth.getUser()
    setUser(data.user)
  }

  async function loadDocuments() {
    setLoading(true)
    setMessage('')

    const { data, error } = await supabase
      .from('documents')
      .select('id, title, category, file_url, file_type, visible, created_at')
      .eq('visible', true)
      .order('category', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Errore caricamento documenti:', error.message)
      setMessage(`Errore caricamento documenti: ${error.message}`)
      setDocuments([])
      setLoading(false)
      return
    }

    const documentsWithSignedUrls = await Promise.all(
      (data ?? []).map(async (document) => {
        const signedUrl = await getSignedUrlFromPublicUrl(document.file_url)

        return {
          ...document,
          file_url: signedUrl || '',
        }
      })
    )

    setDocuments(documentsWithSignedUrls)
    setLoading(false)
  }

  function showAccessDenied() {
    setAccessMessage('Accedi o registrati all’Area Utente per aprire e scaricare i documenti.')

    window.setTimeout(() => {
      setAccessMessage('')
    }, 5000)
  }

  function getDocumentIcon(document: DojoDocument) {
    const fileType = document.file_type?.toLowerCase() || ''
    const title = document.title.toLowerCase()
    const url = document.file_url.toLowerCase()

    if (fileType.includes('pdf') || title.endsWith('.pdf') || url.endsWith('.pdf')) return 'PDF'
    if (fileType.includes('word') || title.endsWith('.doc') || title.endsWith('.docx')) return 'DOC'
    if (fileType.includes('powerpoint') || title.endsWith('.ppt') || title.endsWith('.pptx')) return 'PPT'
    if (fileType.includes('excel') || title.endsWith('.xls') || title.endsWith('.xlsx')) return 'XLS'
    if (fileType.includes('image') || url.match(/\.(jpg|jpeg|png|webp|gif)$/)) return 'IMG'

    return 'FILE'
  }

  function formatDate(value: string) {
    return new Date(value).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  function getDownloadName(document: DojoDocument) {
    const cleanTitle =
      document.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') ||
      'dojo-yamato-documento'

    return `${cleanTitle}`
  }

  function renderDocumentAction(document: DojoDocument) {
    if (!canAccessMedia) {
      return (
        <button type="button" style={openButtonStyle} onClick={showAccessDenied}>
          Accesso utenti
        </button>
      )
    }

    if (!document.file_url) {
      return <p style={lockedTextStyle}>Documento non disponibile.</p>
    }

    return (
      <div style={actionsRowStyle}>
        <a href={document.file_url} target="_blank" rel="noreferrer" style={openButtonStyle}>
          Apri documento
        </a>

        <a
          href={document.file_url}
          download={getDownloadName(document)}
          target="_blank"
          rel="noreferrer"
          style={secondaryButtonStyle}
        >
          Download
        </a>
      </div>
    )
  }

  return (
    <main style={pageStyle}>
      <section style={heroStyle}>
        <p style={pageBadgeStyle}>Documenti</p>
        <h1 style={titleStyle}>Area Documenti</h1>
        <p style={introStyle}>
          Moduli, regolamenti, comunicazioni e materiali utili pubblicati dall’ASD Dojo Yamato.
        </p>

        {!canAccessMedia && (
          <div style={loginNoticeStyle}>
            <strong>Documenti riservati agli utenti registrati.</strong>
            Puoi vedere l’elenco, ma per aprire e scaricare i file devi accedere.
            <Link to="/area-utente" style={loginButtonStyle}>
              Accedi / Registrati
            </Link>
          </div>
        )}
      </section>

      {accessMessage && <div style={floatingMessageStyle}>{accessMessage}</div>}

      <section style={contentStyle}>
        <div style={toolbarStyle}>
          <div>
            <p style={sectionBadgeStyle}>Archivio</p>
            <h2 style={sectionTitleStyle}>Documenti disponibili</h2>
          </div>

          <div style={filterBoxStyle}>
            <label style={filterLabelStyle}>Categoria</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={selectStyle}
            >
              <option value="all">Tutte le categorie</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading && <p style={mutedText}>Caricamento documenti...</p>}

        {!loading && message && <div style={messageBoxStyle}>{message}</div>}

        {!loading && !message && filteredDocuments.length === 0 && (
          <div style={emptyBoxStyle}>Non ci sono documenti disponibili per questo filtro.</div>
        )}

        {!loading && !message && filteredDocuments.length > 0 && (
          <div style={documentsGridStyle}>
            {filteredDocuments.map((document) => (
              <article key={document.id} style={documentCardStyle}>
                <div style={cardTopStyle}>
                  <div style={documentIconStyle}>{getDocumentIcon(document)}</div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={categoryBadgeStyle}>{document.category || 'Altro'}</p>
                    <h3 style={documentTitleStyle}>{document.title}</h3>
                  </div>
                </div>

                <p style={documentMetaStyle}>
                  Pubblicato il {document.created_at ? formatDate(document.created_at) : '—'}
                </p>

                {!canAccessMedia && (
                  <p style={lockedTextStyle}>
                    Accesso richiesto per aprire o scaricare questo documento.
                  </p>
                )}

                {renderDocumentAction(document)}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

const dojoBadgeStyle: CSSProperties = {
  width: 'fit-content',
  padding: '6px 12px',
  borderRadius: '999px',
  background: 'linear-gradient(180deg, #b9444f 0%, #82232b 100%)',
  color: 'white',
  fontSize: '12px',
  fontWeight: 900,
  letterSpacing: '0.8px',
  textTransform: 'uppercase',
  boxShadow: '0 8px 18px rgba(80,10,18,0.24)',
}

const pageStyle: CSSProperties = {
  minHeight: '100vh',
  background: '#020817',
  color: 'white',
  padding: '58px 24px 90px',
}

const heroStyle: CSSProperties = {
  width: 'min(1180px, calc(100% - 8px))',
  margin: '0 auto 34px',
  display: 'grid',
  gap: '16px',
}

const pageBadgeStyle: CSSProperties = dojoBadgeStyle

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 'clamp(48px, 8vw, 82px)',
  lineHeight: 0.98,
  fontWeight: 950,
}

const introStyle: CSSProperties = {
  margin: 0,
  maxWidth: '850px',
  color: '#d8d8d8',
  fontSize: '18px',
  lineHeight: 1.7,
}

const loginNoticeStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '14px',
  flexWrap: 'wrap',
  width: 'fit-content',
  maxWidth: '100%',
  padding: '14px 16px',
  borderRadius: '16px',
  background: 'rgba(185,68,79,0.18)',
  border: '1px solid rgba(185,68,79,0.28)',
  color: '#f3dede',
}

const loginButtonStyle: CSSProperties = {
  padding: '8px 13px',
  borderRadius: '999px',
  background: 'linear-gradient(180deg, #b9444f 0%, #82232b 100%)',
  color: 'white',
  textDecoration: 'none',
  fontWeight: 900,
}

const floatingMessageStyle: CSSProperties = {
  position: 'fixed',
  left: '50%',
  bottom: '24px',
  transform: 'translateX(-50%)',
  zIndex: 1001,
  width: 'min(560px, calc(100% - 32px))',
  padding: '14px 16px',
  borderRadius: '16px',
  background: 'rgba(185,68,79,0.95)',
  color: 'white',
  fontWeight: 800,
  boxShadow: '0 18px 40px rgba(0,0,0,0.36)',
}

const contentStyle: CSSProperties = {
  width: 'min(1180px, calc(100% - 8px))',
  margin: '0 auto',
  display: 'grid',
  gap: '22px',
}

const toolbarStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
  gap: '18px',
  flexWrap: 'wrap',
  padding: '20px',
  borderRadius: '22px',
  background: 'linear-gradient(180deg, rgba(255,255,255,0.075), rgba(255,255,255,0.04))',
  border: '1px solid rgba(255,255,255,0.10)',
}

const sectionBadgeStyle: CSSProperties = {
  ...dojoBadgeStyle,
  margin: '0 0 10px',
}

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: '30px',
  fontWeight: 950,
}

const filterBoxStyle: CSSProperties = {
  display: 'grid',
  gap: '8px',
  minWidth: '240px',
}

const filterLabelStyle: CSSProperties = {
  color: '#d8d8d8',
  fontSize: '13px',
  fontWeight: 800,
}

const selectStyle: CSSProperties = {
  border: '1px solid rgba(255,255,255,0.14)',
  background: 'rgba(255,255,255,0.08)',
  color: 'white',
  borderRadius: '999px',
  padding: '11px 14px',
  fontWeight: 800,
  outline: 'none',
}

const documentsGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: '18px',
}

const documentCardStyle: CSSProperties = {
  display: 'grid',
  gap: '16px',
  padding: '18px',
  borderRadius: '22px',
  background: 'linear-gradient(180deg, rgba(255,255,255,0.085), rgba(255,255,255,0.045))',
  border: '1px solid rgba(255,255,255,0.12)',
  boxShadow: '0 16px 36px rgba(0,0,0,0.32)',
}

const cardTopStyle: CSSProperties = {
  display: 'flex',
  gap: '14px',
  alignItems: 'center',
}

const documentIconStyle: CSSProperties = {
  ...dojoBadgeStyle,
  width: '58px',
  height: '58px',
  padding: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '16px',
  flexShrink: 0,
}

const categoryBadgeStyle: CSSProperties = {
  ...dojoBadgeStyle,
  margin: '0 0 8px',
  padding: '5px 10px',
  fontSize: '11px',
}

const documentTitleStyle: CSSProperties = {
  margin: 0,
  color: 'white',
  fontSize: '19px',
  fontWeight: 950,
  lineHeight: 1.25,
}

const documentMetaStyle: CSSProperties = {
  margin: 0,
  color: '#d8d8d8',
  fontSize: '13px',
  lineHeight: 1.5,
}

const lockedTextStyle: CSSProperties = {
  margin: 0,
  color: '#f3dede',
  fontSize: '13px',
  lineHeight: 1.45,
}

const actionsRowStyle: CSSProperties = {
  display: 'flex',
  gap: '10px',
  flexWrap: 'wrap',
}

const openButtonStyle: CSSProperties = {
  ...dojoBadgeStyle,
  textDecoration: 'none',
  justifySelf: 'start',
  border: 'none',
  cursor: 'pointer',
}

const secondaryButtonStyle: CSSProperties = {
  padding: '6px 12px',
  borderRadius: '999px',
  background: 'rgba(255,255,255,0.12)',
  color: 'white',
  textDecoration: 'none',
  fontSize: '12px',
  fontWeight: 900,
  border: '1px solid rgba(255,255,255,0.12)',
}

const mutedText: CSSProperties = {
  color: '#d8d8d8',
  lineHeight: 1.6,
}

const emptyBoxStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.045)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '18px',
  padding: '22px',
  color: '#d8d8d8',
}

const messageBoxStyle: CSSProperties = {
  background: 'rgba(185,68,79,0.18)',
  border: '1px solid rgba(185,68,79,0.28)',
  padding: '14px 16px',
  borderRadius: '14px',
  color: '#f3dede',
}

export default Documenti