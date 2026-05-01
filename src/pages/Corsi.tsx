import type { CSSProperties } from 'react'

type CourseLocation = {
  city: string
  place: string
  address?: string
  schedules: string[]
  courseType: string[]
  mapUrl: string
  mapEmbedUrl: string
}

const locations: CourseLocation[] = [
  {
    city: 'Airuno',
    place: 'Scuole Elementari',
    schedules: ['Lunedì / Venerdì 18:30 - 19:30'],
    courseType: ['Corso per bambini e ragazzi'],
    mapUrl:
      'https://www.google.com/maps/place/A.S.D+Dojo+Yamato+Arti+Marziali/@45.7553423,9.4203793,769m/data=!3m2!1e3!4b1!4m6!3m5!1s0x4786a93d81f2968d:0xa0e6a040827eaced!8m2!3d45.7553424!4d9.4252502!16s%2Fg%2F11f5t3y700?entry=ttu&g_ep=EgoyMDI2MDIwOS4wIKXMDSoASAFQAw%3D%3D',
    mapEmbedUrl:
      'https://maps.google.com/maps?q=45.7553424,9.4252502&z=16&output=embed',
  },
  {
    city: 'Merate - Sartirana',
    place: 'Scuole Elementari',
    schedules: ['Mercoledì 18:30 - 19:30', 'Venerdì 17:30 - 18:30'],
    courseType: ['Corso per bambini e ragazzi'],
    mapUrl:
      'https://www.google.com/maps/place/A.S.D.+Dojo+Yamato+Arti+Marziali/@45.7138341,9.4163903,770m/data=!3m2!1e3!4b1!4m6!3m5!1s0x4786af4cb15d6d95:0xd960a82e2752bf62!8m2!3d45.7138341!4d9.4189652!16s%2Fg%2F11g0728f_z?entry=ttu&g_ep=EgoyMDI2MDIwOS4wIKXMDSoASAFQAw%3D%3D',
    mapEmbedUrl:
      'https://maps.google.com/maps?q=45.7138341,9.4189652&z=16&output=embed',
  },
  {
    city: 'Cisano Bergamasco',
    place: 'Scuole Elementari',
    schedules: [
      'Mercoledì / Venerdì 16:45 - 17:45',
      'Mercoledì / Venerdì 20:00 - 21:00',
    ],
    courseType: ['Corso per bambini e ragazzi', 'Corso per adulti'],
    mapUrl:
      'https://www.google.com/maps/place/A.S.D+Dojo+Yamato+Arti+Marziali/@45.7384585,9.4773579,769m/data=!3m2!1e3!4b1!4m6!3m5!1s0x4786ad77a51b84db:0xd45651e8ed1cc9dd!8m2!3d45.7384585!4d9.4799328!16s%2Fg%2F11f5t3ztd4?entry=ttu&g_ep=EgoyMDI2MDIwOS4wIKXMDSoASAFQAw%3D%3D',
    mapEmbedUrl:
      'https://maps.google.com/maps?q=45.7384585,9.4799328&z=16&output=embed',
  },
  {
    city: 'Lecco',
    place: 'Scuole Medie T. Grossi',
    address: 'Via Dante',
    schedules: ['Martedì / Giovedì 19:00 - 20:00'],
    courseType: ['Corso per bambini e ragazzi'],
    mapUrl:
      'https://www.google.com/maps/place/A.S.D.+Dojo+Yamato+Arti+Marziali/@45.8514148,9.3928446,768m/data=!3m2!1e3!4b1!4m6!3m5!1s0x47841d0a7f06b087:0x99b635bf4b1019cd!8m2!3d45.8514148!4d9.3954195!16s%2Fg%2F11msd8dhnk?entry=ttu&g_ep=EgoyMDI2MDIwOS4wIKXMDSoASAFQAw%3D%3D',
    mapEmbedUrl:
      'https://maps.google.com/maps?q=45.8514148,9.3954195&z=16&output=embed',
  },
]

function Corsi() {
  return (
    <main style={pageStyle}>
      <section style={heroStyle}>
        <div style={containerStyle}>
          <p style={labelStyle}>I nostri corsi</p>

          <h1 style={titleStyle}>Sedi e orari</h1>

          <p style={introTextStyle}>
            L’ASD Dojo Yamato svolge la propria attività in diverse sedi del
            territorio, per permettere a bambini, ragazzi e adulti di allenarsi
            in ambienti comodi e facilmente raggiungibili.
          </p>
        </div>
      </section>

      <section style={sectionStyle}>
        <div style={containerStyle}>
          <div style={locationsGridStyle}>
            {locations.map((location) => (
              <article key={location.city} style={locationCardStyle}>
                <div style={locationInfoStyle}>
                  <div style={titleRowStyle}>
                    <div style={{ minWidth: 0 }}>
                      <p style={smallLabelStyle}>Palestra</p>

                      <h2 style={locationTitleStyle}>{location.city}</h2>
                    </div>

                    <a
                      href={location.mapUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={mapButtonStyle}
                    >
                      Maps
                    </a>
                  </div>

                  <p style={placeStyle}>
                    {location.place}
                    {location.address ? ` · ${location.address}` : ''}
                  </p>

                  <div style={detailsBoxStyle}>
                    <div>
                      <h3 style={detailTitleStyle}>Orari</h3>

                      <div style={listStyle}>
                        {location.schedules.map((schedule) => (
                          <span key={schedule} style={pillStyle}>
                            {schedule}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 style={detailTitleStyle}>Corsi</h3>

                      <div style={listStyle}>
                        {location.courseType.map((type) => (
                          <span key={type} style={coursePillStyle}>
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={mapWrapperStyle}>
                  <iframe
                    title={`Mappa ${location.city}`}
                    src={location.mapEmbedUrl}
                    width="100%"
                    height="100%"
                    style={mapIframeStyle}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section style={notesSectionStyle}>
        <div style={containerStyle}>
          <div style={notesCardStyle}>
            <div>
              <p style={labelStyle}>Informazioni utili</p>

              <h2 style={notesTitleStyle}>Vuoi iniziare?</h2>

              <p style={notesTextStyle}>
                Per ricevere informazioni aggiornate su sedi, orari e
                disponibilità, contattaci senza impegno. Ti aiuteremo a trovare
                la sede e il corso più adatti.
              </p>
            </div>

            <div style={notesGridStyle}>
              <div style={noteItemStyle}>
                Iscrizioni aperte anche a stagione avviata
              </div>

              <div style={noteItemStyle}>
                Prima lezione di prova gratuita
              </div>

              <div style={noteItemStyle}>
                Nessuna esperienza precedente richiesta
              </div>

              <div style={noteItemStyle}>
                Corsi suddivisi per età e livello
              </div>
            </div>

            <a href="/contatti" style={contactButtonStyle}>
              Contattaci
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}

const pageStyle: CSSProperties = {
  minHeight: '90vh',
  background:
    'radial-gradient(circle at top, rgba(230,57,70,0.10), transparent 30%), #0b0f1a',
  color: 'white',
}

const heroStyle: CSSProperties = {
  padding: '54px 22px 18px',
}

const containerStyle: CSSProperties = {
  maxWidth: '1120px',
  margin: '0 auto',
}

const labelStyle: CSSProperties = {
  color: '#e63946',
  fontWeight: 900,
  letterSpacing: '2px',
  textTransform: 'uppercase',
  fontSize: '12px',
  marginBottom: '8px',
}

const titleStyle: CSSProperties = {
  fontSize: 'clamp(2.1rem, 6vw, 4rem)',
  lineHeight: 1.02,
  margin: 0,
}

const introTextStyle: CSSProperties = {
  maxWidth: '840px',
  color: '#cfd3dc',
  fontSize: '16px',
  lineHeight: 1.6,
  marginTop: '14px',
}

const sectionStyle: CSSProperties = {
  padding: '20px 22px 48px',
}

const locationsGridStyle: CSSProperties = {
  display: 'grid',
  gap: '14px',
}

const locationCardStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 330px), 1fr))',
  gap: '14px',
  background: 'rgba(255,255,255,0.052)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: '18px',
  padding: '16px',
  boxShadow: '0 12px 28px rgba(0,0,0,0.14)',
}

const locationInfoStyle: CSSProperties = {
  minWidth: 0,
}

const titleRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '10px',
  flexWrap: 'wrap',
}

const smallLabelStyle: CSSProperties = {
  color: '#e63946',
  fontWeight: 900,
  letterSpacing: '1.4px',
  textTransform: 'uppercase',
  fontSize: '11px',
  margin: 0,
}

const locationTitleStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  width: 'fit-content',
  fontSize: 'clamp(21px, 4vw, 28px)',
  margin: '6px 0 8px',
  lineHeight: 1.05,
  color: '#ffffff',
  fontWeight: 950,
  letterSpacing: '-0.3px',
  background:
    'linear-gradient(135deg, rgba(230,57,70,0.95), rgba(150,24,34,0.85))',
  padding: '8px 14px',
  borderRadius: '999px',
  boxShadow: '0 10px 24px rgba(230,57,70,0.25)',
}

const placeStyle: CSSProperties = {
  color: '#f2f2f2',
  fontSize: '14px',
  lineHeight: 1.45,
  margin: 0,
  fontWeight: 700,
}

const detailsBoxStyle: CSSProperties = {
  display: 'grid',
  gap: '12px',
  marginTop: '16px',
}

const detailTitleStyle: CSSProperties = {
  fontSize: '12px',
  margin: '0 0 7px',
  color: '#d8d8d8',
  textTransform: 'uppercase',
  letterSpacing: '1px',
}

const listStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '6px',
}

const pillStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.10)',
  border: '1px solid rgba(255,255,255,0.10)',
  color: 'white',
  padding: '6px 9px',
  borderRadius: '999px',
  fontSize: '12px',
  fontWeight: 800,
}

const coursePillStyle: CSSProperties = {
  ...pillStyle,
  background: 'rgba(230,57,70,0.16)',
  color: '#ffd7d7',
}

const mapButtonStyle: CSSProperties = {
  display: 'inline-block',
  background: '#e63946',
  color: 'white',
  textDecoration: 'none',
  padding: '8px 13px',
  borderRadius: '999px',
  fontWeight: 900,
  fontSize: '12px',
  whiteSpace: 'nowrap',
  boxShadow: '0 8px 18px rgba(230,57,70,0.25)',
}

const mapWrapperStyle: CSSProperties = {
  height: 'clamp(155px, 30vw, 210px)',
  minHeight: '155px',
  borderRadius: '15px',
  overflow: 'hidden',
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(0,0,0,0.18)',
}

const mapIframeStyle: CSSProperties = {
  border: 0,
  display: 'block',
  height: '100%',
  minHeight: '155px',
}

const notesSectionStyle: CSSProperties = {
  padding: '0 22px 60px',
}

const notesCardStyle: CSSProperties = {
  background:
    'linear-gradient(135deg, rgba(230,57,70,0.20), rgba(255,255,255,0.052))',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '20px',
  padding: '22px',
  display: 'grid',
  gap: '16px',
}

const notesTitleStyle: CSSProperties = {
  fontSize: '28px',
  margin: 0,
}

const notesTextStyle: CSSProperties = {
  color: '#f2f2f2',
  lineHeight: 1.55,
  maxWidth: '820px',
  fontSize: '15px',
  marginTop: '10px',
}

const notesGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
  gap: '9px',
}

const noteItemStyle: CSSProperties = {
  background: 'rgba(0,0,0,0.18)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: '13px',
  padding: '14px 12px',
  color: 'white',
  fontWeight: 800,
  lineHeight: 1.35,
  fontSize: '13px',
  minHeight: '58px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
}

const contactButtonStyle: CSSProperties = {
  width: 'fit-content',
  background: 'white',
  color: '#111',
  textDecoration: 'none',
  padding: '10px 16px',
  borderRadius: '999px',
  fontWeight: 900,
  fontSize: '13px',
}

export default Corsi