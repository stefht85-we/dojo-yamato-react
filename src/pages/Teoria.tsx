import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import {
  canDownloadMedia,
  canOpenMedia,
  getAccessDeniedMessage,
} from '../lib/permissions'
import { getSignedUrlFromPublicUrl } from '../lib/storageSignedUrl'

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

  const [user, setUser] = useState<User | null>(null)
  const [resources, setResources] = useState<TheoryResource[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<TheoryResource | null>(null)
  const [accessMessage, setAccessMessage] = useState('')

  const userCanOpenMedia = canOpenMedia(user)
  const userCanDownloadMedia = canDownloadMedia(user)

  useEffect(() => {
    loadUser()
    loadResources()
  }, [])

  async function loadUser() {
    const { data } = await supabase.auth.getUser()
    setUser(data.user)
  }

  async function loadResources() {
    setLoading(true)

    const { data, error } = await supabase
      .from('theory_resources')
      .select('id, title, description, section, category, resource_type, file_url, external_url, visible, created_at')
      .eq('visible', true)
      .order('category', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Errore caricamento risorse teoria:', error.message)
      setResources([])
      setLoading(false)
      return
    }

    const resourcesWithSignedUrls = await Promise.all(
      ((data ?? []) as TheoryResource[]).map(async (item) => {
        const signedFileUrl = item.file_url
          ? await getSignedUrlFromPublicUrl(item.file_url)
          : null

        return {
          ...item,
          file_url: signedFileUrl || item.file_url,
        }
      })
    )

    setResources(resourcesWithSignedUrls)
    setLoading(false)
  }

  const fondamentiResources = useMemo(() => {
    return resources.filter((item) => item.section === 'fondamenti')
  }, [resources])

  const risorseDidattiche = useMemo(() => {
    return resources.filter((item) => item.section === 'risorse')
  }, [resources])

  const groupedResources = useMemo(() => {
    const orderedCategories = ['KATA', 'KUMITE', 'ESAMI', 'ESERCIZI PREPARAZIONE ATLETICA', 'ALTRO']

    return orderedCategories
      .map((category) => ({
        category,
        items: risorseDidattiche.filter((item) => (item.category || 'ALTRO').toUpperCase() === category),
      }))
      .filter((group) => group.items.length > 0)
  }, [risorseDidattiche])

  function showAccessDenied() {
    setAccessMessage(getAccessDeniedMessage('i materiali della sezione Teoria'))

    window.setTimeout(() => {
      setAccessMessage('')
    }, 5000)
  }

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

  function getYoutubeEmbedUrl(url: string) {
    const patterns = [
      /youtube\.com\/watch\?v=([^&]+)/,
      /youtu\.be\/([^?&]+)/,
      /youtube\.com\/shorts\/([^?&]+)/,
      /youtube\.com\/embed\/([^?&]+)/,
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match?.[1]) return `https://www.youtube.com/embed/${match[1]}`
    }

    return null
  }

  function getDownloadName(item: TheoryResource) {
    const extension = item.resource_type === 'video' ? 'mp4' : 'pdf'
    const cleanTitle =
      item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') ||
      'dojo-yamato-teoria'

    return `${cleanTitle}.${extension}`
  }

  function handleVideoOpen(item: TheoryResource) {
    if (!userCanOpenMedia) {
      showAccessDenied()
      return
    }

    setSelectedVideo(item)
  }

  function renderAccessNotice() {
    if (userCanOpenMedia) return null

    return (
      <div style={loginNoticeStyle}>
        <strong>Materiali riservati agli utenti registrati.</strong>
        Puoi vedere l’elenco dei contenuti, ma per aprire video, documenti e link devi accedere.
        <Link to="/area-utente" style={loginButtonStyle}>Accedi / Registrati</Link>
      </div>
    )
  }

  function renderLockedBadge() {
    if (userCanOpenMedia) return null

    return <span style={lockedBadgeStyle}>Accesso utenti</span>
  }

  function renderDownloadButton(item: TheoryResource) {
    if (!userCanDownloadMedia) return null

    const url = getResourceUrl(item)

    if (item.resource_type === 'youtube' || item.resource_type === 'social' || item.resource_type === 'link') {
      return (
        <a href={url} target="_blank" rel="noreferrer" style={openButtonStyle}>
          Apri
        </a>
      )
    }

    return (
      <a href={url} download={getDownloadName(item)} target="_blank" rel="noreferrer" style={openButtonStyle}>
        Download
      </a>
    )
  }

  function renderVideoPreview(item: TheoryResource) {
    const videoUrl = getResourceUrl(item)

    return (
      <article key={item.id} style={resourceCardStyle}>
        <button type="button" style={videoResourceItemStyle} onClick={() => handleVideoOpen(item)} aria-label={`Apri video ${item.title}`}>
          <div style={videoThumbStyle}>
            {item.resource_type === 'youtube' ? (
              <div style={youtubeThumbFallbackStyle}>YT</div>
            ) : (
              <video src={videoUrl} style={videoPreviewStyle} muted preload="metadata" playsInline controls={false} onContextMenu={(e) => e.preventDefault()} />
            )}

            <span style={playOverlayStyle}>▶</span>
          </div>

          <span style={resourceTextWrapperStyle}>
            <span style={resourceTopRowStyle}>
              <span style={resourceBadgeStyle}>{getResourceLabel(item)}</span>
              {renderLockedBadge()}
            </span>

            <strong style={resourceTitleStyle}>{item.title}</strong>

            {item.description && <span style={resourceDescriptionStyle}>{item.description}</span>}
          </span>
        </button>

        {renderDownloadButton(item)}
      </article>
    )
  }

  function renderResource(item: TheoryResource) {
    if (item.resource_type === 'video' || item.resource_type === 'youtube') {
      return renderVideoPreview(item)
    }

    const url = getResourceUrl(item)

    return (
      <article key={item.id} style={resourceCardStyle}>
        {userCanOpenMedia ? (
          <a href={url} target="_blank" rel="noreferrer" style={resourceItemStyle}>
            <span style={resourceBadgeStyle}>{getResourceLabel(item)}</span>

            <span style={resourceTextWrapperStyle}>
              <strong style={resourceTitleStyle}>{item.title}</strong>
              {item.description && <span style={resourceDescriptionStyle}>{item.description}</span>}
            </span>
          </a>
        ) : (
          <button type="button" style={lockedResourceItemStyle} onClick={showAccessDenied}>
            <span style={resourceBadgeStyle}>{getResourceLabel(item)}</span>

            <span style={resourceTextWrapperStyle}>
              <span style={resourceTopRowStyle}>
                <strong style={resourceTitleStyle}>{item.title}</strong>
                {renderLockedBadge()}
              </span>
              {item.description && <span style={resourceDescriptionStyle}>{item.description}</span>}
            </span>
          </button>
        )}

        {renderDownloadButton(item)}
      </article>
    )
  }

  function renderVideoModal() {
    if (!selectedVideo) return null

    const videoUrl = getResourceUrl(selectedVideo)

    if (selectedVideo.resource_type === 'youtube') {
      const embedUrl = getYoutubeEmbedUrl(videoUrl)

      return (
        <div style={modalOverlayStyle} onClick={() => setSelectedVideo(null)}>
          <div style={videoModalStyle} onClick={(e) => e.stopPropagation()}>
            <button type="button" style={closeButtonStyle} onClick={() => setSelectedVideo(null)} aria-label="Chiudi video">×</button>

            {embedUrl ? (
              <iframe src={embedUrl} title={selectedVideo.title} style={youtubeFrameStyle} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            ) : (
              <p style={modalTextStyle}>Video YouTube non disponibile.</p>
            )}
          </div>
        </div>
      )
    }

    return (
      <div style={modalOverlayStyle} onClick={() => setSelectedVideo(null)}>
        <div style={videoModalStyle} onClick={(e) => e.stopPropagation()}>
          <button type="button" style={closeButtonStyle} onClick={() => setSelectedVideo(null)} aria-label="Chiudi video">×</button>

          <video src={videoUrl} style={modalVideoStyle} controls autoPlay playsInline controlsList="nodownload noplaybackrate" disablePictureInPicture onContextMenu={(e) => e.preventDefault()} />

          <p style={videoNoticeStyle}>Video visualizzabile direttamente nella pagina.</p>
        </div>
      </div>
    )
  }

  if (!section) {
    return (
      <main style={pageStyle}>
        <section style={heroStyle}>
          <p style={eyebrowStyle}>A.S.D. DOJO YAMATO</p>
          <h1 style={titleStyle}>Teoria</h1>

          <p style={introStyle}>
            Una sezione dedicata alla conoscenza del Karate e ai materiali utili per studiare, allenarsi e prepararsi con maggiore consapevolezza.
          </p>

          <div style={choiceButtonsStyle}>
            <Link to="/teoria/fondamenti" style={yamatoButtonStyle}>Fondamenti</Link>
            <Link to="/teoria/risorse-didattiche" style={yamatoButtonStyle}>Risorse Didattiche</Link>
          </div>
        </section>
      </main>
    )
  }

  if (section === 'fondamenti') {
    return (
      <main style={pageStyle}>
        <section style={heroStyle}>
          <Link to="/teoria" style={backLinkStyle}>← Torna a Teoria</Link>
          <p style={eyebrowStyle}>TEORIA</p>
          <h1 style={sectionPageTitleStyle}>Fondamenti</h1>

          <p style={introStyle}>
            Una panoramica semplice per conoscere il Karate, le sue origini e i principi che guidano la pratica nel dojo.
          </p>
        </section>

        <section style={contentStyle}>
          <article style={textBlockStyle}>
            <h2 style={blockTitleStyle}>Cos’è il Karate</h2>
            <p style={paragraphStyle}>
              Il Karate è un’arte marziale di origine giapponese basata sul controllo del corpo, della mente e delle emozioni. Non è soltanto tecnica o combattimento, ma un percorso educativo che aiuta a crescere con disciplina, rispetto e consapevolezza.
            </p>
          </article>

          <article style={textBlockStyle}>
            <h2 style={blockTitleStyle}>Origini</h2>
            <p style={paragraphStyle}>
              Il Karate affonda le sue radici nell’isola di Okinawa, dove nel tempo si è sviluppato un sistema di difesa personale poi evoluto in disciplina marziale. Dalla tradizione di Okinawa il Karate si è diffuso in Giappone e nel resto del mondo.
            </p>
          </article>

          <article style={textBlockStyle}>
            <h2 style={blockTitleStyle}>Stile Shotokan</h2>
            <p style={paragraphStyle}>
              Lo stile Shotokan si caratterizza per tecniche precise, posizioni stabili, lavoro su kihon, kata e kumite e per una continua ricerca di controllo, efficacia e miglioramento personale.
            </p>
          </article>

          <article style={textBlockStyle}>
            <h2 style={blockTitleStyle}>Principi fondamentali</h2>
            <p style={paragraphStyle}>
              Il Karate insegna rispetto, autocontrollo, impegno, perseveranza e capacità di affrontare le difficoltà con equilibrio. Nel dojo si impara che la tecnica è importante, ma ancora più importante è la formazione del carattere.
            </p>
          </article>
        </section>

        <section style={materialsStyle}>
          <h2 style={materialsTitleStyle}>Approfondimenti</h2>
          {renderAccessNotice()}

          {loading && <p style={mutedTextStyle}>Caricamento materiali...</p>}

          {!loading && fondamentiResources.length === 0 && <div style={emptyBoxStyle}>Non sono ancora presenti materiali di approfondimento.</div>}

          {!loading && fondamentiResources.length > 0 && <div style={resourceListStyle}>{fondamentiResources.map(renderResource)}</div>}
        </section>

        {accessMessage && <div style={floatingMessageStyle}>{accessMessage}</div>}
        {renderVideoModal()}
      </main>
    )
  }

  if (section === 'risorse-didattiche') {
    return (
      <main style={pageStyle}>
        <section style={heroStyle}>
          <Link to="/teoria" style={backLinkStyle}>← Torna a Teoria</Link>
          <p style={eyebrowStyle}>TEORIA</p>
          <h1 style={sectionPageTitleStyle}>Risorse Didattiche</h1>

          <p style={introStyle}>Documenti, video e collegamenti utili per studiare e allenarsi, organizzati per argomento.</p>
        </section>

        <section style={materialsStyle}>
          {renderAccessNotice()}

          {loading && <p style={mutedTextStyle}>Caricamento materiali...</p>}

          {!loading && groupedResources.length === 0 && <div style={emptyBoxStyle}>Non sono ancora presenti materiali didattici pubblicati.</div>}

          {!loading && groupedResources.length > 0 && (
            <div style={accordionWrapperStyle}>
              {groupedResources.map((group) => (
                <details key={group.category} style={detailsStyle} open>
                  <summary style={summaryStyle}>
                    {group.category}
                    <span style={countBadgeStyle}>{group.items.length}</span>
                  </summary>

                  <div style={detailsContentStyle}>{group.items.map(renderResource)}</div>
                </details>
              ))}
            </div>
          )}
        </section>

        {accessMessage && <div style={floatingMessageStyle}>{accessMessage}</div>}
        {renderVideoModal()}
      </main>
    )
  }

  return (
    <main style={pageStyle}>
      <section style={heroStyle}>
        <Link to="/teoria" style={backLinkStyle}>← Torna a Teoria</Link>
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

const eyebrowStyle: CSSProperties = dojoBadgeStyle

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

const resourceListStyle: CSSProperties = {
  display: 'grid',
  gap: '10px',
}

const resourceCardStyle: CSSProperties = {
  display: 'grid',
  gap: '8px',
  background: 'rgba(255,255,255,0.045)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '14px',
  padding: '10px',
}

const resourceItemStyle: CSSProperties = {
  display: 'flex',
  gap: '12px',
  alignItems: 'center',
  textDecoration: 'none',
  color: 'white',
}

const lockedResourceItemStyle: CSSProperties = {
  display: 'flex',
  gap: '12px',
  alignItems: 'center',
  width: '100%',
  textAlign: 'left',
  color: 'white',
  background: 'transparent',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
}

const videoResourceItemStyle: CSSProperties = {
  display: 'flex',
  gap: '12px',
  alignItems: 'center',
  width: '100%',
  textAlign: 'left',
  color: 'white',
  background: 'transparent',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
}

const videoThumbStyle: CSSProperties = {
  position: 'relative',
  width: '96px',
  height: '62px',
  flexShrink: 0,
  borderRadius: '10px',
  overflow: 'hidden',
  background: '#111827',
}

const videoPreviewStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
}

const youtubeThumbFallbackStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(180deg, #b9444f 0%, #82232b 100%)',
  color: 'white',
  fontWeight: 950,
  fontSize: '18px',
}

const playOverlayStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(0,0,0,0.22)',
  color: 'white',
  fontWeight: 950,
  fontSize: '18px',
}

const resourceTopRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flexWrap: 'wrap',
}

const resourceBadgeStyle: CSSProperties = {
  flexShrink: 0,
  width: 'fit-content',
  padding: '6px 10px',
  borderRadius: '999px',
  background: 'linear-gradient(180deg, #b9444f 0%, #82232b 100%)',
  color: 'white',
  fontSize: '11px',
  fontWeight: 900,
}

const lockedBadgeStyle: CSSProperties = {
  width: 'fit-content',
  padding: '5px 9px',
  borderRadius: '999px',
  background: 'rgba(255,255,255,0.10)',
  color: '#d8d8d8',
  fontSize: '10px',
  fontWeight: 900,
}

const openButtonStyle: CSSProperties = {
  width: 'fit-content',
  padding: '7px 12px',
  borderRadius: '999px',
  background: 'linear-gradient(180deg, #b9444f 0%, #82232b 100%)',
  color: 'white',
  textDecoration: 'none',
  fontSize: '12px',
  fontWeight: 900,
}

const resourceTextWrapperStyle: CSSProperties = {
  display: 'grid',
  gap: '4px',
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

const modalOverlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 1000,
  background: 'rgba(0,0,0,0.76)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px',
}

const videoModalStyle: CSSProperties = {
  position: 'relative',
  width: 'min(760px, 96vw)',
  background: '#020817',
  borderRadius: '20px',
  border: '1px solid rgba(255,255,255,0.12)',
  padding: '16px',
  boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
}

const closeButtonStyle: CSSProperties = {
  position: 'absolute',
  top: '-14px',
  right: '-14px',
  width: '36px',
  height: '36px',
  borderRadius: '999px',
  border: 'none',
  background: 'linear-gradient(180deg, #b9444f 0%, #82232b 100%)',
  color: 'white',
  fontSize: '24px',
  fontWeight: 900,
  cursor: 'pointer',
  lineHeight: 1,
  zIndex: 2,
}

const modalVideoStyle: CSSProperties = {
  width: '100%',
  maxHeight: '70vh',
  borderRadius: '14px',
  background: '#111827',
  display: 'block',
}

const youtubeFrameStyle: CSSProperties = {
  width: '100%',
  aspectRatio: '16 / 9',
  border: 0,
  borderRadius: '14px',
  display: 'block',
}

const modalTextStyle: CSSProperties = {
  color: '#d8d8d8',
  margin: 0,
}

const videoNoticeStyle: CSSProperties = {
  margin: '10px 2px 0',
  color: '#aeb6c4',
  fontSize: '12px',
}

export default Teoria