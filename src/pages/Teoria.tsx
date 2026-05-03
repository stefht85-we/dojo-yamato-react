import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

type TheoryResource = {
  id: string
  title: string
  description: string | null
  section: string
  category: string | null
  resource_type: string | null
  file_url: string | null
  external_url: string | null
  visible: boolean
  created_at: string
}

function Teoria() {
  const { section } = useParams()

  const [resources, setResources] = useState<TheoryResource[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadResources()
  }, [])

  async function loadResources() {
    setLoading(true)

    const { data, error } = await supabase
      .from('theory_resources')
      .select(
        'id, title, description, section, category, resource_type, file_url, external_url, visible, created_at'
      )
      .eq('visible', true)
      .order('category', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Errore caricamento risorse teoria:', error.message)
      setResources([])
      setLoading(false)
      return
    }

    setResources((data ?? []) as TheoryResource[])
    setLoading(false)
  }

  const fondamentiResources = useMemo(() => {
    return resources.filter((item) => item.section === 'fondamenti')
  }, [resources])

  const risorseDidattiche = useMemo(() => {
    return resources.filter((item) => item.section === 'risorse')
  }, [resources])

  const groupedResources = useMemo(() => {
    const orderedCategories = [
      'KATA',
      'KUMITE',
      'ESAMI',
      'ESERCIZI PREPARAZIONE ATLETICA',
      'ALTRO',
    ]

    return orderedCategories
      .map((category) => ({
        category,
        items: risorseDidattiche.filter(
          (item) => (item.category || 'ALTRO').toUpperCase() === category
        ),
      }))
      .filter((group) => group.items.length > 0)
  }, [risorseDidattiche])

  function getResourceUrl(item: TheoryResource) {
    return item.file_url || item.external_url || '#'
  }

  function getResourceLabel(item: TheoryResource) {
    if (item.resource_type === 'youtube') return 'YouTube'
    if (item.resource_type === 'social') return 'Social'
    if (item.resource_type === 'video') return 'Video'
    if (item.resource_type === 'link') return 'Link'
    return 'Documento'
  }

  function renderResource(item: TheoryResource) {
    return (
      <a
        key={item.id}
        href={getResourceUrl(item)}
        target="_blank"
        rel="noreferrer"
        style={resourceItemStyle}
      >
        <span style={resourceBadgeStyle}>{getResourceLabel(item)}</span>

        <span style={resourceTextWrapperStyle}>
          <strong style={resourceTitleStyle}>{item.title}</strong>

          {item.description && (
            <span style={resourceDescriptionStyle}>{item.description}</span>
          )}
        </span>
      </a>
    )
  }

  if (!section) {
    return (
      <main style={pageStyle}>
        <section style={heroStyle}>
          <p style={eyebrowStyle}>A.S.D. DOJO YAMATO</p>

          <h1 style={titleStyle}>Teoria</h1>

          <p style={introStyle}>
            Una sezione dedicata alla conoscenza del Karate e ai materiali utili per
            studiare, allenarsi e prepararsi con maggiore consapevolezza.
          </p>

          <div style={choiceButtonsStyle}>
            <Link to="/teoria/fondamenti" style={yamatoButtonStyle}>
              Fondamenti
            </Link>

            <Link to="/teoria/risorse-didattiche" style={yamatoButtonStyle}>
              Risorse Didattiche
            </Link>
          </div>
        </section>
      </main>
    )
  }

  if (section === 'fondamenti') {
    return (
      <main style={pageStyle}>
        <section style={heroStyle}>
          <Link to="/teoria" style={backLinkStyle}>
            ← Torna a Teoria
          </Link>

          <p style={eyebrowStyle}>TEORIA</p>

          <h1 style={sectionPageTitleStyle}>Fondamenti</h1>

          <p style={introStyle}>
            Una panoramica semplice per conoscere il Karate, le sue origini e i principi
            che guidano la pratica nel dojo.
          </p>
        </section>

        <section style={contentStyle}>
          <article style={textBlockStyle}>
            <h2 style={blockTitleStyle}>Cos’è il Karate</h2>
            <p style={paragraphStyle}>
              Il Karate è un’arte marziale di origine giapponese basata sul controllo
              del corpo, della mente e delle emozioni. Non è soltanto tecnica o
              combattimento, ma un percorso educativo che aiuta a crescere con
              disciplina, rispetto e consapevolezza.
            </p>
          </article>

          <article style={textBlockStyle}>
            <h2 style={blockTitleStyle}>Origini</h2>
            <p style={paragraphStyle}>
              Il Karate affonda le sue radici nell’isola di Okinawa, dove nel tempo si è
              sviluppato un sistema di difesa personale poi evoluto in disciplina
              marziale. Dalla tradizione di Okinawa il Karate si è diffuso in Giappone e
              nel resto del mondo.
            </p>
          </article>

          <article style={textBlockStyle}>
            <h2 style={blockTitleStyle}>Stile Shotokan</h2>
            <p style={paragraphStyle}>
              Lo stile Shotokan si caratterizza per tecniche precise, posizioni stabili,
              lavoro su kihon, kata e kumite e per una continua ricerca di controllo,
              efficacia e miglioramento personale.
            </p>
          </article>

          <article style={textBlockStyle}>
            <h2 style={blockTitleStyle}>Principi fondamentali</h2>
            <p style={paragraphStyle}>
              Il Karate insegna rispetto, autocontrollo, impegno, perseveranza e capacità
              di affrontare le difficoltà con equilibrio. Nel dojo si impara che la
              tecnica è importante, ma ancora più importante è la formazione del carattere.
            </p>
          </article>
        </section>

        <section style={materialsStyle}>
          <h2 style={materialsTitleStyle}>Approfondimenti</h2>

          {loading && <p style={mutedTextStyle}>Caricamento materiali...</p>}

          {!loading && fondamentiResources.length === 0 && (
            <div style={emptyBoxStyle}>
              Non sono ancora presenti materiali di approfondimento.
            </div>
          )}

          {!loading && fondamentiResources.length > 0 && (
            <div style={resourceListStyle}>
              {fondamentiResources.map(renderResource)}
            </div>
          )}
        </section>
      </main>
    )
  }

  if (section === 'risorse-didattiche') {
    return (
      <main style={pageStyle}>
        <section style={heroStyle}>
          <Link to="/teoria" style={backLinkStyle}>
            ← Torna a Teoria
          </Link>

          <p style={eyebrowStyle}>TEORIA</p>

          <h1 style={sectionPageTitleStyle}>Risorse Didattiche</h1>

          <p style={introStyle}>
            Documenti, video e collegamenti utili per studiare e allenarsi, organizzati
            per argomento.
          </p>
        </section>

        <section style={materialsStyle}>
          {loading && <p style={mutedTextStyle}>Caricamento materiali...</p>}

          {!loading && groupedResources.length === 0 && (
            <div style={emptyBoxStyle}>
              Non sono ancora presenti materiali didattici pubblicati.
            </div>
          )}

          {!loading && groupedResources.length > 0 && (
            <div style={accordionWrapperStyle}>
              {groupedResources.map((group) => (
                <details key={group.category} style={detailsStyle} open>
                  <summary style={summaryStyle}>
                    {group.category}
                    <span style={countBadgeStyle}>{group.items.length}</span>
                  </summary>

                  <div style={detailsContentStyle}>
                    {group.items.map(renderResource)}
                  </div>
                </details>
              ))}
            </div>
          )}
        </section>
      </main>
    )
  }

  return (
    <main style={pageStyle}>
      <section style={heroStyle}>
        <Link to="/teoria" style={backLinkStyle}>
          ← Torna a Teoria
        </Link>

        <p style={eyebrowStyle}>TEORIA</p>
        <h1 style={sectionPageTitleStyle}>Sezione non trovata</h1>
      </section>
    </main>
  )
}

const pageStyle: CSSProperties = {
  minHeight: '100vh',
  background: '#020817',
  color: 'white',
  padding: '58px 24px 90px',
}

const heroStyle: CSSProperties = {
  width: 'min(1180px, calc(100% - 8px))',
  margin: '0 auto',
  display: 'grid',
  gap: '18px',
}

const eyebrowStyle: CSSProperties = {
  margin: 0,
  color: '#d95b64',
  fontWeight: 900,
  letterSpacing: '2px',
  textTransform: 'uppercase',
  fontSize: '13px',
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 'clamp(52px, 8vw, 86px)',
  lineHeight: 0.96,
  fontWeight: 950,
}

const sectionPageTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 'clamp(42px, 7vw, 72px)',
  lineHeight: 1,
  fontWeight: 950,
}

const introStyle: CSSProperties = {
  margin: 0,
  maxWidth: '860px',
  color: '#d8d8d8',
  fontSize: '18px',
  lineHeight: 1.7,
}

const choiceButtonsStyle: CSSProperties = {
  display: 'flex',
  gap: '14px',
  flexWrap: 'wrap',
  marginTop: '18px',
}

const yamatoButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '13px 22px',
  borderRadius: '999px',
  background: 'linear-gradient(180deg, #b9444f 0%, #82232b 100%)',
  color: 'white',
  textDecoration: 'none',
  fontWeight: 900,
  boxShadow: '0 8px 18px rgba(80,10,18,0.24)',
}

const backLinkStyle: CSSProperties = {
  width: 'fit-content',
  color: '#d95b64',
  textDecoration: 'none',
  fontWeight: 900,
}

const contentStyle: CSSProperties = {
  width: 'min(1180px, calc(100% - 8px))',
  margin: '34px auto 0',
  display: 'grid',
  gap: '14px',
}

const textBlockStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.045)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '18px',
  padding: '22px',
}

const blockTitleStyle: CSSProperties = {
  margin: '0 0 10px',
  fontSize: '24px',
  fontWeight: 950,
}

const paragraphStyle: CSSProperties = {
  margin: 0,
  color: '#e5e7eb',
  fontSize: '16px',
  lineHeight: 1.75,
}

const materialsStyle: CSSProperties = {
  width: 'min(1180px, calc(100% - 8px))',
  margin: '36px auto 0',
  display: 'grid',
  gap: '14px',
}

const materialsTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: '30px',
  fontWeight: 950,
}

const resourceListStyle: CSSProperties = {
  display: 'grid',
  gap: '10px',
}

const resourceItemStyle: CSSProperties = {
  display: 'flex',
  gap: '12px',
  alignItems: 'center',
  textDecoration: 'none',
  color: 'white',
  background: 'rgba(255,255,255,0.045)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '14px',
  padding: '12px 14px',
}

const resourceBadgeStyle: CSSProperties = {
  flexShrink: 0,
  padding: '6px 10px',
  borderRadius: '999px',
  background: 'linear-gradient(180deg, #b9444f 0%, #82232b 100%)',
  color: 'white',
  fontSize: '11px',
  fontWeight: 900,
}

const resourceTextWrapperStyle: CSSProperties = {
  display: 'grid',
  gap: '3px',
  minWidth: 0,
}

const resourceTitleStyle: CSSProperties = {
  fontSize: '15px',
  lineHeight: 1.25,
}

const resourceDescriptionStyle: CSSProperties = {
  color: '#cbd5e1',
  fontSize: '13px',
  lineHeight: 1.4,
}

const accordionWrapperStyle: CSSProperties = {
  display: 'grid',
  gap: '12px',
}

const detailsStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.045)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
  padding: '8px',
}

const summaryStyle: CSSProperties = {
  cursor: 'pointer',
  listStyle: 'none',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '12px',
  padding: '12px 14px',
  fontWeight: 950,
  fontSize: '17px',
}

const countBadgeStyle: CSSProperties = {
  minWidth: '28px',
  height: '28px',
  borderRadius: '999px',
  background: 'linear-gradient(180deg, #b9444f 0%, #82232b 100%)',
  color: 'white',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '12px',
  fontWeight: 900,
}

const detailsContentStyle: CSSProperties = {
  display: 'grid',
  gap: '10px',
  padding: '0 8px 8px',
}

const emptyBoxStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.045)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
  padding: '18px',
  color: '#d8d8d8',
}

const mutedTextStyle: CSSProperties = {
  color: '#d8d8d8',
}

export default Teoria