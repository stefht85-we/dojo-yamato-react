import { useEffect, useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'

const TEACHER_IMAGES_BUCKET = 'teacher-images'

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

function AdminInsegnanti() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [message, setMessage] = useState('')

  const [nome, setNome] = useState('')
  const [cognome, setCognome] = useState('')
  const [dataNascita, setDataNascita] = useState('')
  const [qualifica, setQualifica] = useState('')
  const [grado, setGrado] = useState('')
  const [descrizione, setDescrizione] = useState('')
  const [visible, setVisible] = useState(true)
  const [sortOrder, setSortOrder] = useState('0')

  const [fotoPrimoPianoFile, setFotoPrimoPianoFile] = useState<File | null>(null)
  const [fotoKarateFile, setFotoKarateFile] = useState<File | null>(null)

  const [existingFotoPrimoPianoUrl, setExistingFotoPrimoPianoUrl] = useState<string | null>(null)
  const [existingFotoKarateUrl, setExistingFotoKarateUrl] = useState<string | null>(null)

  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null)
  const [photoInputKey, setPhotoInputKey] = useState(0)

  useEffect(() => {
    loadTeachers()
  }, [])

  async function loadTeachers() {
    const { data, error } = await supabase
      .from('teachers')
      .select(
        'id, nome, cognome, data_nascita, qualifica, grado, descrizione, foto_primo_piano_url, foto_karate_url, visible, sort_order, created_at'
      )
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      setMessage(`Errore caricamento insegnanti: ${error.message}`)
      return
    }

    setTeachers((data ?? []) as Teacher[])
  }

  async function uploadTeacherImage(file: File, folder: string) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
    const filePath = `${folder}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from(TEACHER_IMAGES_BUCKET)
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data } = supabase.storage
      .from(TEACHER_IMAGES_BUCKET)
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  function resetForm() {
    setNome('')
    setCognome('')
    setDataNascita('')
    setQualifica('')
    setGrado('')
    setDescrizione('')
    setVisible(true)
    setSortOrder('0')
    setFotoPrimoPianoFile(null)
    setFotoKarateFile(null)
    setExistingFotoPrimoPianoUrl(null)
    setExistingFotoKarateUrl(null)
    setEditingTeacherId(null)
    setPhotoInputKey((prev) => prev + 1)
  }

  async function handleSaveTeacher(e: FormEvent) {
    e.preventDefault()

    if (!nome.trim() || !cognome.trim()) {
      setMessage('Inserisci almeno nome e cognome dell’insegnante')
      return
    }

    setMessage(editingTeacherId ? 'Aggiornamento insegnante...' : 'Salvataggio insegnante...')

    try {
      let finalFotoPrimoPianoUrl = existingFotoPrimoPianoUrl
      let finalFotoKarateUrl = existingFotoKarateUrl

      if (fotoPrimoPianoFile) {
        finalFotoPrimoPianoUrl = await uploadTeacherImage(
          fotoPrimoPianoFile,
          'primo-piano'
        )
      }

      if (fotoKarateFile) {
        finalFotoKarateUrl = await uploadTeacherImage(
          fotoKarateFile,
          'karate'
        )
      }

      const payload = {
        nome: nome.trim(),
        cognome: cognome.trim(),
        data_nascita: dataNascita || null,
        qualifica: qualifica.trim() || null,
        grado: grado.trim() || null,
        descrizione: descrizione.trim() || null,
        foto_primo_piano_url: finalFotoPrimoPianoUrl,
        foto_karate_url: finalFotoKarateUrl,
        visible,
        sort_order: Number(sortOrder) || 0,
      }

      if (editingTeacherId) {
        const { error } = await supabase
          .from('teachers')
          .update(payload)
          .eq('id', editingTeacherId)

        if (error) {
          setMessage(`Errore aggiornamento insegnante: ${error.message}`)
          return
        }

        setMessage('Insegnante aggiornato correttamente')
      } else {
        const { error } = await supabase.from('teachers').insert(payload)

        if (error) {
          setMessage(`Errore inserimento insegnante: ${error.message}`)
          return
        }

        setMessage('Insegnante inserito correttamente')
      }

      resetForm()
      loadTeachers()
    } catch (error) {
      console.error(error)

      if (error instanceof Error) {
        setMessage(`Errore durante salvataggio immagini/insegnante: ${error.message}`)
      } else {
        setMessage('Errore durante salvataggio immagini/insegnante')
      }
    }
  }

  function handleEditTeacher(teacher: Teacher) {
    setEditingTeacherId(teacher.id)
    setNome(teacher.nome)
    setCognome(teacher.cognome)
    setDataNascita(teacher.data_nascita ?? '')
    setQualifica(teacher.qualifica ?? '')
    setGrado(teacher.grado ?? '')
    setDescrizione(teacher.descrizione ?? '')
    setVisible(teacher.visible)
    setSortOrder(String(teacher.sort_order ?? 0))
    setExistingFotoPrimoPianoUrl(teacher.foto_primo_piano_url)
    setExistingFotoKarateUrl(teacher.foto_karate_url)
    setFotoPrimoPianoFile(null)
    setFotoKarateFile(null)
    setPhotoInputKey((prev) => prev + 1)
    setMessage('Modifica insegnante in corso')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleToggleVisible(teacher: Teacher) {
    const { error } = await supabase
      .from('teachers')
      .update({ visible: !teacher.visible })
      .eq('id', teacher.id)

    if (error) {
      setMessage(`Errore aggiornamento visibilità: ${error.message}`)
      return
    }

    setMessage('Visibilità insegnante aggiornata')
    loadTeachers()
  }

  async function handleDeleteTeacher(id: string) {
    const confirmDelete = window.confirm('Vuoi eliminare questo insegnante?')
    if (!confirmDelete) return

    const { error } = await supabase.from('teachers').delete().eq('id', id)

    if (error) {
      setMessage(`Errore eliminazione insegnante: ${error.message}`)
      return
    }

    setMessage('Insegnante eliminato')
    loadTeachers()
  }

  return (
    <div>
      {message && <div style={messageBox}>{message}</div>}

      <div style={adminCardStyle}>
        <h3>{editingTeacherId ? 'Modifica insegnante' : 'Inserisci nuovo insegnante'}</h3>

        <form onSubmit={handleSaveTeacher} style={formStyle}>
          <div style={twoColumnsStyle}>
            <input
              type="text"
              placeholder="Nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />

            <input
              type="text"
              placeholder="Cognome"
              value={cognome}
              onChange={(e) => setCognome(e.target.value)}
            />
          </div>

          <div style={twoColumnsStyle}>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={mutedText}>Data di nascita</label>
              <input
                type="date"
                value={dataNascita}
                onChange={(e) => setDataNascita(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={mutedText}>Ordine visualizzazione</label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              />
            </div>
          </div>

          <input
            type="text"
            placeholder="Qualifica insegnante, es. Maestro, Istruttore, Allenatore"
            value={qualifica}
            onChange={(e) => setQualifica(e.target.value)}
          />

          <input
            type="text"
            placeholder="Grado, es. Cintura nera 5° Dan"
            value={grado}
            onChange={(e) => setGrado(e.target.value)}
          />

          <textarea
            placeholder="Descrizione dell’insegnante"
            value={descrizione}
            onChange={(e) => setDescrizione(e.target.value)}
            rows={6}
            style={textareaStyle}
          />

          <div style={twoColumnsStyle}>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={mutedText}>Foto primo piano / viso</label>

              {existingFotoPrimoPianoUrl && (
                <img
                  src={existingFotoPrimoPianoUrl}
                  alt="Foto primo piano attuale"
                  style={previewImageStyle}
                />
              )}

              <input
                key={`portrait-${photoInputKey}`}
                type="file"
                accept="image/*"
                onChange={(e) => setFotoPrimoPianoFile(e.target.files?.[0] ?? null)}
              />

              {fotoPrimoPianoFile && (
                <small style={mutedText}>File selezionato: {fotoPrimoPianoFile.name}</small>
              )}
            </div>

            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={mutedText}>Foto in posizione di Karate</label>

              {existingFotoKarateUrl && (
                <img
                  src={existingFotoKarateUrl}
                  alt="Foto karate attuale"
                  style={previewImageStyle}
                />
              )}

              <input
                key={`karate-${photoInputKey}`}
                type="file"
                accept="image/*"
                onChange={(e) => setFotoKarateFile(e.target.files?.[0] ?? null)}
              />

              {fotoKarateFile && (
                <small style={mutedText}>File selezionato: {fotoKarateFile.name}</small>
              )}
            </div>
          </div>

          <label style={checkboxLabelStyle}>
            <input
              type="checkbox"
              checked={visible}
              onChange={(e) => setVisible(e.target.checked)}
            />
            Insegnante visibile nella pagina pubblica
          </label>

          <div style={actionsRow}>
            <button className="primary-auth-button" type="submit">
              {editingTeacherId ? 'Aggiorna insegnante' : 'Salva insegnante'}
            </button>

            {editingTeacherId && (
              <button
                className="secondary-auth-button"
                type="button"
                onClick={resetForm}
              >
                Annulla modifica
              </button>
            )}
          </div>
        </form>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h3>Insegnanti inseriti</h3>

        {teachers.length === 0 && (
          <p style={mutedText}>Non ci sono ancora insegnanti inseriti.</p>
        )}

        <div style={teachersListStyle}>
          {teachers.map((teacher) => (
            <article key={teacher.id} style={teacherRowStyle}>
              <div style={teacherImagesStyle}>
                {teacher.foto_primo_piano_url ? (
                  <img
                    src={teacher.foto_primo_piano_url}
                    alt={`${teacher.nome} ${teacher.cognome}`}
                    style={teacherThumbStyle}
                  />
                ) : (
                  <div style={teacherThumbPlaceholderStyle}>Viso</div>
                )}

                {teacher.foto_karate_url ? (
                  <img
                    src={teacher.foto_karate_url}
                    alt={`${teacher.nome} ${teacher.cognome} Karate`}
                    style={teacherThumbStyle}
                  />
                ) : (
                  <div style={teacherThumbPlaceholderStyle}>Karate</div>
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={teacherNameStyle}>
                  {teacher.nome} {teacher.cognome}
                </h4>

                <p style={teacherMetaStyle}>
                  {teacher.qualifica || 'Qualifica non indicata'}
                  {teacher.grado ? ` · ${teacher.grado}` : ''}
                  {' · '}
                  {teacher.visible ? 'Visibile' : 'Nascosto'}
                  {' · Ordine '}
                  {teacher.sort_order ?? 0}
                </p>

                {teacher.descrizione && (
                  <p style={teacherDescriptionStyle}>
                    {teacher.descrizione.length > 180
                      ? `${teacher.descrizione.substring(0, 180)}...`
                      : teacher.descrizione}
                  </p>
                )}
              </div>

              <div style={rowActionsStyle}>
                <button
                  type="button"
                  className="secondary-auth-button"
                  style={smallAdminButton}
                  onClick={() => handleEditTeacher(teacher)}
                >
                  Modifica
                </button>

                <button
                  type="button"
                  className="secondary-auth-button"
                  style={smallAdminButton}
                  onClick={() => handleToggleVisible(teacher)}
                >
                  {teacher.visible ? 'Nascondi' : 'Pubblica'}
                </button>

                <button
                  type="button"
                  className="primary-auth-button"
                  style={smallDangerButton}
                  onClick={() => handleDeleteTeacher(teacher.id)}
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

const adminCardStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: '18px',
  padding: '22px',
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

const previewImageStyle: CSSProperties = {
  width: '100%',
  height: '180px',
  objectFit: 'cover',
  borderRadius: '14px',
  background: '#111827',
}

const teachersListStyle: CSSProperties = {
  display: 'grid',
  gap: '10px',
  marginTop: '16px',
}

const teacherRowStyle: CSSProperties = {
  display: 'flex',
  gap: '12px',
  alignItems: 'center',
  background: 'rgba(255,255,255,0.06)',
  borderRadius: '14px',
  padding: '10px',
  border: '1px solid rgba(255,255,255,0.10)',
  flexWrap: 'wrap',
}

const teacherImagesStyle: CSSProperties = {
  display: 'flex',
  gap: '6px',
  flexShrink: 0,
}

const teacherThumbStyle: CSSProperties = {
  width: '58px',
  height: '58px',
  objectFit: 'cover',
  borderRadius: '10px',
  background: '#111827',
}

const teacherThumbPlaceholderStyle: CSSProperties = {
  width: '58px',
  height: '58px',
  borderRadius: '10px',
  background: 'rgba(185,68,79,0.18)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#d8d8d8',
  fontSize: '10px',
  fontWeight: 800,
}

const teacherNameStyle: CSSProperties = {
  margin: '0 0 4px',
  fontSize: '15px',
  fontWeight: 900,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}

const teacherMetaStyle: CSSProperties = {
  margin: 0,
  color: '#d8d8d8',
  fontSize: '12px',
  lineHeight: 1.35,
}

const teacherDescriptionStyle: CSSProperties = {
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

export default AdminInsegnanti