import { useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'

const CONTACT_EMAIL = ''

function Contatti() {
  const [nome, setNome] = useState('')
  const [cognome, setCognome] = useState('')
  const [eta, setEta] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')
  const [message, setMessage] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (!nome.trim() || !cognome.trim() || !telefono.trim() || !email.trim()) {
      setMessage('Compila almeno nome, cognome, telefono ed email.')
      return
    }

    if (!CONTACT_EMAIL) {
      setMessage(
        'Richiesta preparata correttamente. L’indirizzo email di destinazione non è ancora configurato nel sito.'
      )
      return
    }

    const subject = encodeURIComponent(
      `Richiesta informazioni corso Karate - ${nome} ${cognome}`
    )

    const body = encodeURIComponent(
      `Richiesta informazioni dal sito A.S.D. Dojo Yamato\n\n` +
        `Nome: ${nome}\n` +
        `Cognome: ${cognome}\n` +
        `Età atleta / bambino: ${eta || 'Non indicata'}\n` +
        `Telefono: ${telefono}\n` +
        `Email: ${email}\n\n` +
        `Note / informazioni aggiuntive:\n${note || 'Nessuna nota'}`
    )

    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`
    setMessage('Si sta aprendo il programma email per inviare la richiesta.')
  }

  return (
    <>
      <style>{responsiveCss}</style>

      <main style={pageStyle}>
        <section style={heroStyle}>
          <div style={containerStyle}>
            <p style={labelStyle}>A.S.D. DOJO YAMATO</p>

            <h1 style={titleStyle}>Contatti</h1>

            <p style={introStyle}>
              Per informazioni sui corsi, sugli orari o per prenotare una lezione di prova,
              puoi contattarci direttamente oppure compilare il modulo qui sotto.
            </p>
          </div>
        </section>

        <section style={contentStyle}>
          <div style={containerStyle}>
            <div className="contact-grid" style={contactGridStyle}>
              <aside style={infoCardStyle}>
                <span style={badgeStyle}>Contatto diretto</span>

                <h2 style={cardTitleStyle}>Telefono e WhatsApp</h2>

                <p style={textStyle}>
                  Puoi chiamare oppure scrivere su WhatsApp per ricevere informazioni sui corsi,
                  sugli orari e sulle lezioni di prova.
                </p>

                <div style={directContactsStyle}>
                  <ContactRow
                    phone="338 2792973"
                    telHref="tel:+393382792973"
                    whatsappHref="https://wa.me/393382792973"
                    name="Salvatore"
                  />

                  <ContactRow
                    phone="338 6811675"
                    telHref="tel:+393386811675"
                    whatsappHref="https://wa.me/393386811675"
                    name="Stefano"
                  />
                </div>

                <div style={dividerStyle} />

                <h3 style={smallTitleStyle}>Informazioni utili</h3>

                <ul style={infoListStyle}>
                  <li>Vengono offerte due lezioni di prova completamente gratuite.</li>
                  <li>Non serve portare kimono o attrezzatura, ma abbigliamento sportivo comodo.</li>
                  <li>Si pratica scalzi o con calzini antiscivolo.</li>
                  <li>Durata lezione: 60 minuti.</li>
                  <li>Per i minori è necessario che ci sia un genitore per iniziare la prova.</li>
                  <li>Lezioni ad hoc per agonisti o per chi vuole competere nelle gare.</li>
                </ul>
              </aside>

              <section style={formCardStyle}>
                <span style={badgeStyle}>Richiedi informazioni</span>

                <h2 style={cardTitleStyle}>Compila il form</h2>

                <p style={formIntroStyle}>
                  Inserisci i dati dell’atleta interessato o del genitore/tutore.
                  Verrai ricontattato appena possibile.
                </p>

                <form onSubmit={handleSubmit} style={formStyle}>
                  <div style={twoColumnsStyle}>
                    <input
                      type="text"
                      placeholder="Nome"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      style={inputStyle}
                    />

                    <input
                      type="text"
                      placeholder="Cognome"
                      value={cognome}
                      onChange={(e) => setCognome(e.target.value)}
                      style={inputStyle}
                    />
                  </div>

                  <div style={twoColumnsStyle}>
                    <input
                      type="text"
                      placeholder="Età atleta / bambino"
                      value={eta}
                      onChange={(e) => setEta(e.target.value)}
                      style={inputStyle}
                    />

                    <input
                      type="tel"
                      placeholder="Numero di telefono"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      style={inputStyle}
                    />
                  </div>

                  <input
                    type="email"
                    placeholder="Email per essere ricontattati"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={inputStyle}
                  />

                  <textarea
                    placeholder="Note o informazioni aggiuntive"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={5}
                    style={textareaStyle}
                  />

                  <button type="submit" style={submitButtonStyle}>
                    Invia richiesta
                  </button>

                  {message && <p style={messageStyle}>{message}</p>}
                </form>
              </section>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

type ContactRowProps = {
  phone: string
  telHref: string
  whatsappHref: string
  name: string
}

function ContactRow({ phone, telHref, whatsappHref, name }: ContactRowProps) {
  return (
    <div className="direct-contact-row" style={directContactRowStyle}>
      <a href={telHref} style={phonePillStyle}>
        {phone}
      </a>

      <a
        href={whatsappHref}
        target="_blank"
        rel="noreferrer"
        style={whatsappButtonStyle}
        aria-label={`Scrivi a ${name} su WhatsApp`}
      >
        <WhatsAppIcon />
      </a>

      <span style={namePillStyle}>({name})</span>
    </div>
  )
}

function WhatsAppIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 32 32"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      <path
        fill="currentColor"
        d="M16.04 3C8.86 3 3.02 8.84 3.02 16.02c0 2.3.6 4.54 1.74 6.52L3 29l6.62-1.73a12.93 12.93 0 0 0 6.42 1.7h.01c7.18 0 13.02-5.84 13.02-13.02C29.07 8.84 23.22 3 16.04 3Zm0 23.77h-.01c-1.9 0-3.76-.51-5.38-1.48l-.39-.23-3.93 1.03 1.05-3.83-.25-.4a10.71 10.71 0 0 1-1.65-5.84c0-5.82 4.74-10.56 10.57-10.56 2.82 0 5.47 1.1 7.46 3.09a10.49 10.49 0 0 1 3.1 7.46c0 5.83-4.74 10.56-10.57 10.56Zm5.79-7.91c-.32-.16-1.88-.93-2.17-1.04-.29-.1-.5-.16-.71.16-.21.32-.82 1.04-1 1.25-.18.21-.37.24-.69.08-.32-.16-1.34-.49-2.55-1.57-.94-.84-1.58-1.88-1.76-2.2-.18-.32-.02-.49.14-.65.14-.14.32-.37.48-.56.16-.18.21-.32.32-.53.1-.21.05-.4-.03-.56-.08-.16-.71-1.71-.98-2.34-.26-.62-.52-.53-.71-.54h-.61c-.21 0-.56.08-.85.4-.29.32-1.11 1.09-1.11 2.66 0 1.57 1.14 3.09 1.3 3.3.16.21 2.24 3.42 5.43 4.8.76.33 1.35.52 1.81.67.76.24 1.45.21 2 .13.61-.09 1.88-.77 2.14-1.51.26-.74.26-1.38.18-1.51-.08-.13-.29-.21-.61-.37Z"
      />
    </svg>
  )
}

const responsiveCss = `
@media (max-width: 1040px) {
  .contact-grid {
    grid-template-columns: 1fr !important;
  }
}

@media (max-width: 720px) {
  .direct-contact-row {
    grid-template-columns: 1fr 40px !important;
  }

  .direct-contact-row span {
    grid-column: 1 / -1;
    justify-self: center;
  }
}
`

const pageStyle: CSSProperties = {
  minHeight: '100vh',
  background: '#020817',
  color: 'white',
}

const containerStyle: CSSProperties = {
  width: 'min(1180px, calc(100% - 32px))',
  margin: '0 auto',
}

const heroStyle: CSSProperties = {
  padding: '64px 0 28px',
}

const labelStyle: CSSProperties = {
  color: '#d95b64',
  fontWeight: 900,
  letterSpacing: '2px',
  textTransform: 'uppercase',
  fontSize: '13px',
  margin: '0 0 14px',
}

const titleStyle: CSSProperties = {
  fontSize: 'clamp(42px, 7vw, 76px)',
  lineHeight: 1.02,
  margin: '0 0 20px',
  fontWeight: 950,
}

const introStyle: CSSProperties = {
  maxWidth: '880px',
  color: '#d8d8d8',
  fontSize: '18px',
  lineHeight: 1.75,
  margin: 0,
}

const contentStyle: CSSProperties = {
  padding: '22px 0 86px',
}

const contactGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(410px, 1fr) minmax(320px, 0.95fr)',
  gap: '22px',
  alignItems: 'start',
}

const infoCardStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.055)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: '24px',
  padding: '24px',
  boxShadow: '0 18px 42px rgba(0,0,0,0.18)',
}

const formCardStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.055)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: '24px',
  padding: '24px',
  boxShadow: '0 18px 42px rgba(0,0,0,0.18)',
}

const badgeStyle: CSSProperties = {
  display: 'inline-flex',
  width: 'fit-content',
  padding: '9px 16px',
  borderRadius: '999px',
  background: 'linear-gradient(180deg, #b9444f 0%, #82232b 100%)',
  color: 'white',
  fontWeight: 900,
  fontSize: '13px',
  boxShadow: '0 8px 18px rgba(80,10,18,0.24)',
}

const cardTitleStyle: CSSProperties = {
  margin: '18px 0 10px',
  fontSize: 'clamp(28px, 4vw, 40px)',
  lineHeight: 1.08,
  fontWeight: 950,
}

const textStyle: CSSProperties = {
  color: '#d8d8d8',
  fontSize: '16px',
  lineHeight: 1.7,
  margin: '0 0 18px',
}

const directContactsStyle: CSSProperties = {
  display: 'grid',
  gap: '12px',
  marginTop: '18px',
  width: '100%',
}

const directContactRowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(160px, 0.75fr) 40px minmax(90px, 0.32fr)',
  gap: '9px',
  alignItems: 'center',
}

const phonePillStyle: CSSProperties = {
  minHeight: '40px',
  borderRadius: '999px',
  background: 'white',
  color: '#030b1b',
  textDecoration: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  fontSize: 'clamp(17px, 2.2vw, 23px)',
  fontWeight: 950,
  lineHeight: 1,
  letterSpacing: '0.2px',
  boxShadow: '0 6px 12px rgba(0,0,0,0.14)',
}

const whatsappButtonStyle: CSSProperties = {
  width: '40px',
  height: '40px',
  borderRadius: '11px',
  background: '#25D366',
  color: '#031407',
  textDecoration: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 6px 12px rgba(0,0,0,0.14)',
}

const namePillStyle: CSSProperties = {
  minHeight: '34px',
  borderRadius: '8px',
  background: '#020817',
  border: '1px solid rgba(255,255,255,0.07)',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  fontSize: 'clamp(13px, 1.7vw, 17px)',
  fontWeight: 900,
  lineHeight: 1,
  padding: '0 10px',
  boxShadow: '0 6px 12px rgba(0,0,0,0.12)',
}

const dividerStyle: CSSProperties = {
  height: '1px',
  background: 'rgba(255,255,255,0.10)',
  margin: '28px 0 24px',
}

const smallTitleStyle: CSSProperties = {
  margin: '0 0 12px',
  color: '#f3dede',
  fontSize: '18px',
  fontWeight: 950,
}

const infoListStyle: CSSProperties = {
  margin: 0,
  paddingLeft: '20px',
  color: '#e5e7eb',
  lineHeight: 1.7,
  fontSize: '15px',
}

const formIntroStyle: CSSProperties = {
  color: '#d8d8d8',
  lineHeight: 1.7,
  margin: '0 0 18px',
}

const formStyle: CSSProperties = {
  display: 'grid',
  gap: '14px',
}

const twoColumnsStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '14px',
}

const inputStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  border: '1px solid rgba(255,255,255,0.14)',
  background: 'rgba(255,255,255,0.08)',
  color: 'white',
  borderRadius: '14px',
  padding: '14px 15px',
  fontSize: '15px',
  outline: 'none',
}

const textareaStyle: CSSProperties = {
  ...inputStyle,
  resize: 'vertical',
  minHeight: '120px',
  fontFamily: 'inherit',
}

const submitButtonStyle: CSSProperties = {
  width: 'fit-content',
  border: 'none',
  borderRadius: '999px',
  padding: '13px 22px',
  background: 'linear-gradient(180deg, #b9444f 0%, #82232b 100%)',
  color: 'white',
  fontWeight: 950,
  cursor: 'pointer',
  boxShadow: '0 8px 18px rgba(80,10,18,0.24)',
}

const messageStyle: CSSProperties = {
  margin: 0,
  padding: '12px 14px',
  borderRadius: '14px',
  background: 'rgba(185,68,79,0.18)',
  border: '1px solid rgba(185,68,79,0.28)',
  color: '#f3dede',
  lineHeight: 1.5,
}

export default Contatti