import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

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
  const [documents, setDocuments] = useState<DojoDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function loadDocuments() {
      setLoading(true)
      setMessage('')

      const { data, error } = await supabase
        .from('documents')
        .select('id, title, category, file_url, file_type, visible, created_at')
        .eq('visible', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Errore caricamento documenti:', error)
        setMessage('Non è stato possibile caricare i documenti.')
        setLoading(false)
        return
      }

      setDocuments(data ?? [])
      setLoading(false)
    }

    loadDocuments()
  }, [])

  const groupedDocuments = useMemo(() => {
    const groups: Record<string, DojoDocument[]> = {}

    documents.forEach((doc) => {
      const category = doc.category?.trim() || 'Altro'

      if (!groups[category]) {
        groups[category] = []
      }

      groups[category].push(doc)
    })

    return groups
  }, [documents])

  const categoryOrder = ['Moduli', 'Regolamenti', 'Documenti ufficiali', 'Altro']

  const sortedCategories = Object.keys(groupedDocuments).sort((a, b) => {
    const indexA = categoryOrder.indexOf(a)
    const indexB = categoryOrder.indexOf(b)

    if (indexA === -1 && indexB === -1) return a.localeCompare(b)
    if (indexA === -1) return 1
    if (indexB === -1) return -1

    return indexA - indexB
  })

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <section style={introStyle}>
          <p style={labelStyle}>Bacheca</p>

          <h1 style={titleStyle}>Documenti</h1>

          <p style={textStyle}>
            Moduli, regolamenti e documenti ufficiali del Dojo Yamato disponibili
            per la consultazione e il download.
          </p>
        </section>

        {loading && <p style={textStyle}>Caricamento documenti...</p>}

        {!loading && message && (
          <div style={emptyBoxStyle}>
            <p style={{ margin: 0 }}>{message}</p>
          </div>
        )}

        {!loading && !message && documents.length === 0 && (
          <div style={emptyBoxStyle}>
            <h2 style={{ marginTop: 0, color: 'white' }}>
              Nessun documento disponibile
            </h2>

            <p style={{ marginBottom: 0 }}>
              I documenti saranno pubblicati prossimamente.
            </p>
          </div>
        )}

        {!loading && !message && documents.length > 0 && (
          <div style={categoriesWrapperStyle}>
            {sortedCategories.map((category) => (
              <section key={category}>
                <div style={sectionHeaderStyle}>
                  <h2 style={sectionTitleStyle}>{category}</h2>

                  <span style={countBadgeStyle}>
                    {groupedDocuments[category].length}
                  </span>
                </div>

                <div style={documentListStyle}>
                  {groupedDocuments[category].map((doc) => (
                    <article key={doc.id} style={documentCardStyle}>
                      <div style={documentIconStyle}>📄</div>

                      <div style={documentContentStyle}>
                        <h3 style={documentTitleStyle}>{doc.title}</h3>

                        <p style={documentMetaStyle}>
                          Caricato il{' '}
                          {new Date(doc.created_at).toLocaleDateString('it-IT')}
                        </p>
                      </div>

                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noreferrer"
                        style={downloadButtonStyle}
                      >
                        Scarica / apri
                      </a>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

const pageStyle: React.CSSProperties = {
  minHeight: '90vh',
  background:
    'radial-gradient(circle at top, rgba(230,57,70,0.14), transparent 34%), #0b0f1a',
  color: 'white',
  padding: '80px 24px',
}

const containerStyle: React.CSSProperties = {
  maxWidth: '1050px',
  margin: '0 auto',
}

const introStyle: React.CSSProperties = {
  marginBottom: '42px',
}

const labelStyle: React.CSSProperties = {
  color: '#e63946',
  fontWeight: 800,
  letterSpacing: '2px',
  textTransform: 'uppercase',
  marginBottom: '12px',
  fontSize: '13px',
}

const titleStyle: React.CSSProperties = {
  fontSize: 'clamp(2.3rem, 6vw, 4rem)',
  margin: 0,
  lineHeight: 1.05,
}

const textStyle: React.CSSProperties = {
  maxWidth: '760px',
  marginTop: '18px',
  color: '#cfd3dc',
  fontSize: '17px',
  lineHeight: 1.7,
}

const emptyBoxStyle: React.CSSProperties = {
  marginTop: '30px',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: '18px',
  padding: '26px',
  color: '#d8d8d8',
}

const categoriesWrapperStyle: React.CSSProperties = {
  display: 'grid',
  gap: '34px',
}

const sectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '14px',
  marginBottom: '14px',
}

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '26px',
}

const countBadgeStyle: React.CSSProperties = {
  background: 'rgba(230,57,70,0.18)',
  color: '#ffd7d7',
  padding: '7px 11px',
  borderRadius: '999px',
  fontWeight: 800,
  fontSize: '13px',
}

const documentListStyle: React.CSSProperties = {
  display: 'grid',
  gap: '12px',
}

const documentCardStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: '18px',
  padding: '16px',
}

const documentIconStyle: React.CSSProperties = {
  width: '48px',
  height: '48px',
  borderRadius: '14px',
  background: 'rgba(230,57,70,0.18)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '24px',
  flexShrink: 0,
}

const documentContentStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
}

const documentTitleStyle: React.CSSProperties = {
  margin: '0 0 5px',
  fontSize: '18px',
  lineHeight: 1.25,
}

const documentMetaStyle: React.CSSProperties = {
  margin: 0,
  color: '#cfd3dc',
  fontSize: '13px',
}

const downloadButtonStyle: React.CSSProperties = {
  background: '#e63946',
  color: 'white',
  textDecoration: 'none',
  padding: '10px 15px',
  borderRadius: '999px',
  fontWeight: 800,
  fontSize: '13px',
  whiteSpace: 'nowrap',
}

export default Documenti