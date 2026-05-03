import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

type Teacher = {
  id: string
  nome: string
  cognome: string
  data_nascita: string | null
  qualifica: string | null
  grado: string | null
  descrizione: string | null
  foto_primo_piano_url: string | null
  foto_karate_url: string | null
  visible: boolean
  sort_order: number | null
  created_at: string
}

function Insegnanti() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadTeachers()
  }, [])

  async function loadTeachers() {
    setLoading(true)
    setMessage('')

    const { data, error } = await supabase
      .from('teachers')
      .select(
        'id, nome, cognome, data_nascita, qualifica, grado, descrizione, foto_primo_piano_url, foto_karate_url, visible, sort_order, created_at'
      )
      .eq('visible', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Errore caricamento insegnanti:', error)
      setMessage('Errore durante il caricamento degli insegnanti.')
      setLoading(false)
      return
    }

    setTeachers((data ?? []) as Teacher[])
    setLoading(false)
  }

  function formatBirthDate(date: string | null) {
    if (!date) return null

    return new Date(date).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <>
      <style>{responsiveCss}</style>

      <main style={pageStyle}>
        <section style={heroStyle}>
          <div style={containerStyle}>
            <p style={labelStyle}>A.S.D. DOJO YAMATO</p>

            <h1 style={titleStyle}>I nostri insegnanti</h1>

            <p style={introStyle}>
              Nel Dojo Yamato l’insegnamento nasce dall’esperienza, dalla passione
              e dal rispetto per la tradizione del Karate Shotokan. Ogni insegnante
              accompagna gli allievi in un percorso che unisce tecnica, disciplina,
              educazione e crescita personale, valorizzando bambini, ragazzi e adulti
              secondo le loro capacità e il loro cammino.
            </p>
          </div>
        </section>

        <section style={contentStyle}>
          <div style={containerStyle}>
            {loading && <div style={messageBoxStyle}>Caricamento insegnanti...</div>}

            {!loading && message && <div style={messageBoxStyle}>{message}</div>}

            {!loading && !message && teachers.length === 0 && (
              <div style={messageBoxStyle}>
                Gli insegnanti verranno pubblicati prossimamente.
              </div>
            )}

            {!loading && teachers.length > 0 && (
              <div style={teachersGridStyle}>
                {teachers.map((teacher) => (
                  <article key={teacher.id} className="teacher-card" style={teacherCardStyle}>
                    <div style={portraitBoxStyle}>
                      {teacher.foto_primo_piano_url ? (
                        <img
                          src={teacher.foto_primo_piano_url}
                          alt={`${teacher.nome} ${teacher.cognome}`}
                          style={portraitImageStyle}
                        />
                      ) : (
                        <div style={photoPlaceholderStyle}>Primo piano</div>
                      )}
                    </div>

                    <div style={teacherContentStyle}>
                      <h2 style={teacherNameStyle}>
                        {teacher.nome} {teacher.cognome}
                      </h2>

                      <div style={badgesRowStyle}>
                        {teacher.qualifica && (
                          <span style={qualificationBadgeStyle}>{teacher.qualifica}</span>
                        )}

                        {teacher.grado && (
                          <span style={gradeBadgeStyle}>{teacher.grado}</span>
                        )}
                      </div>

                      {formatBirthDate(teacher.data_nascita) && (
                        <p style={metaStyle}>
                          Data di nascita:{' '}
                          <strong>{formatBirthDate(teacher.data_nascita)}</strong>
                        </p>
                      )}

                      {teacher.descrizione && (
                        <p style={descriptionStyle}>{teacher.descrizione}</p>
                      )}
                    </div>

                    <div style={karateBoxStyle}>
                      {teacher.foto_karate_url ? (
                        <img
                          src={teacher.foto_karate_url}
                          alt={`${teacher.nome} ${teacher.cognome} in posizione di Karate`}
                          style={karateImageStyle}
                        />
                      ) : (
                        <div style={photoPlaceholderStyle}>Karate</div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  )
}

const responsiveCss = `
@media (max-width: 920px) {
  .teacher-card {
    grid-template-columns: 1fr !important;
  }
}
`

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background:
    'radial-gradient(circle at top, rgba(185,68,79,0.16), transparent 32%), #020817',
  color: 'white',
}

const containerStyle: React.CSSProperties = {
  maxWidth: '1180px',
  margin: '0 auto',
  width: 'min(1180px, calc(100% - 32px))',
}

const heroStyle: React.CSSProperties = {
  padding: '64px 0 28px',
}

const labelStyle: React.CSSProperties = {
  color: '#ff4d5f',
  fontWeight: 900,
  letterSpacing: '2px',
  textTransform: 'uppercase',
  fontSize: '13px',
  margin: '0 0 14px',
}

const titleStyle: React.CSSProperties = {
  fontSize: 'clamp(42px, 7vw, 76px)',
  lineHeight: 1.02,
  margin: '0 0 20px',
  fontWeight: 950,
}

const introStyle: React.CSSProperties = {
  maxWidth: '920px',
  color: '#d9dde7',
  fontSize: '18px',
  lineHeight: 1.75,
  margin: 0,
}

const contentStyle: React.CSSProperties = {
  padding: '22px 0 86px',
}

const teachersGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: '24px',
}

const teacherCardStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '210px 1fr 280px',
  gap: '24px',
  alignItems: 'stretch',
  background: 'rgba(255,255,255,0.055)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: '24px',
  padding: '18px',
  boxShadow: '0 18px 42px rgba(0,0,0,0.18)',
}

const portraitBoxStyle: React.CSSProperties = {
  minWidth: 0,
}

const karateBoxStyle: React.CSSProperties = {
  minWidth: 0,
}

const portraitImageStyle: React.CSSProperties = {
  width: '100%',
  height: '300px',
  objectFit: 'cover',
  borderRadius: '18px',
  background: '#111827',
}

const karateImageStyle: React.CSSProperties = {
  width: '100%',
  height: '300px',
  objectFit: 'cover',
  borderRadius: '18px',
  background: '#111827',
}

const photoPlaceholderStyle: React.CSSProperties = {
  height: '300px',
  borderRadius: '18px',
  background: 'rgba(255,255,255,0.08)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#d9dde7',
  fontWeight: 800,
  textAlign: 'center',
}

const teacherContentStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  padding: '4px 4px 4px',
}

const teacherNameStyle: React.CSSProperties = {
  margin: '0 0 14px',
  fontSize: 'clamp(32px, 4vw, 48px)',
  lineHeight: 1.02,
  fontWeight: 950,
  letterSpacing: '-0.8px',
}

const badgesRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
  flexWrap: 'wrap',
  marginBottom: '16px',
}

const qualificationBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  width: 'fit-content',
  padding: '10px 16px',
  borderRadius: '999px',
  background: 'linear-gradient(180deg, #b9444f 0%, #82232b 100%)',
  color: 'white',
  fontWeight: 950,
  fontSize: '14px',
  boxShadow: '0 8px 18px rgba(80,10,18,0.24)',
}

const gradeBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  width: 'fit-content',
  padding: '10px 16px',
  borderRadius: '999px',
  background: 'rgba(255,255,255,0.13)',
  border: '1px solid rgba(255,255,255,0.12)',
  color: 'white',
  fontWeight: 950,
  fontSize: '14px',
}

const metaStyle: React.CSSProperties = {
  color: '#cbd5e1',
  margin: '0 0 14px',
  fontSize: '14px',
}

const descriptionStyle: React.CSSProperties = {
  color: '#e5e7eb',
  fontSize: '16px',
  lineHeight: 1.75,
  margin: 0,
}

const messageBoxStyle: React.CSSProperties = {
  padding: '22px',
  borderRadius: '20px',
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.05)',
  color: '#e5e7eb',
}

export default Insegnanti