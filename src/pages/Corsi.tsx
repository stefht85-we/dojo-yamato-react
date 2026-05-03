import type { CSSProperties } from 'react'

type CourseLocation = {
  id: string
  city: string
  gymName: string
  address: string
  imageUrl: string
  mapUrl: string
  schedules: string[]
}

const locations: CourseLocation[] = [
  {
    id: 'airuno',
    city: 'Airuno',
    gymName: 'Scuole Elementari',
    address: 'Inserisci qui indirizzo palestra Airuno',
    imageUrl: '/images/palestre/airuno.jpg',
    mapUrl: 'https://www.google.com/maps?q=Airuno%20scuole%20elementari&output=embed',
    schedules: [
      'Bambini e ragazzi: inserisci giorno e orario',
      'Adulti: inserisci giorno e orario',
    ],
  },
  {
    id: 'cisano',
    city: 'Cisano Bergamasco',
    gymName: 'Scuole Elementari',
    address: 'Inserisci qui indirizzo palestra Cisano Bergamasco',
    imageUrl: '/images/palestre/cisano.jpg',
    mapUrl: 'https://www.google.com/maps?q=Cisano%20Bergamasco%20scuole%20elementari&output=embed',
    schedules: [
      'Bambini e ragazzi: inserisci giorno e orario',
      'Adulti: inserisci giorno e orario',
    ],
  },
  {
    id: 'lecco',
    city: 'Lecco',
    gymName: 'Scuole Elementari',
    address: 'Inserisci qui indirizzo palestra Lecco',
    imageUrl: '/images/palestre/lecco.jpg',
    mapUrl: 'https://www.google.com/maps?q=Lecco%20scuole%20elementari&output=embed',
    schedules: [
      'Bambini e ragazzi: inserisci giorno e orario',
      'Adulti: inserisci giorno e orario',
    ],
  },
  {
    id: 'merate',
    city: 'Merate - Sartirana',
    gymName: 'Scuole Elementari',
    address: 'Inserisci qui indirizzo palestra Merate / Sartirana',
    imageUrl: '/images/palestre/merate.jpg',
    mapUrl: 'https://www.google.com/maps?q=Sartirana%20Merate%20scuole%20elementari&output=embed',
    schedules: [
      'Bambini e ragazzi: inserisci giorno e orario',
      'Adulti: inserisci giorno e orario',
    ],
  },
]

function Corsi() {
  return (
    <>
      <style>{responsiveCss}</style>

      <main style={pageStyle}>
        <section style={heroStyle}>
          <div style={containerStyle}>
            <p style={labelStyle}>A.S.D. DOJO YAMATO</p>

            <h1 style={titleStyle}>Corsi e palestre</h1>

            <p style={introStyle}>
              I corsi dell’A.S.D. Dojo Yamato sono pensati per bambini, ragazzi e adulti.
              È possibile iniziare anche durante l’anno sportivo e provare una lezione
              gratuita prima dell’iscrizione.
            </p>
          </div>
        </section>

        <section style={locationsSectionStyle}>
          <div style={containerStyle}>
            <div style={locationsGridStyle}>
              {locations.map((location) => (
                <article key={location.id} className="course-location-card" style={locationCardStyle}>
                  <div style={textColumnStyle}>
                    <span style={cityBadgeStyle}>{location.city}</span>

                    <h2 style={gymNameStyle}>{location.gymName}</h2>

                    <p style={addressStyle}>{location.address}</p>

                    <div style={scheduleBoxStyle}>
                      <h3 style={scheduleTitleStyle}>Orari</h3>

                      <ul style={scheduleListStyle}>
                        {location.schedules.map((schedule) => (
                          <li key={schedule} style={scheduleItemStyle}>
                            {schedule}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div style={gymImageWrapperStyle}>
                    <img
                      src={location.imageUrl}
                      alt={`Esterno palestra ${location.city}`}
                      style={gymImageStyle}
                    />
                  </div>

                  <div style={mapWrapperStyle}>
                    <iframe
                      title={`Mappa palestra ${location.city}`}
                      src={location.mapUrl}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      style={mapStyle}
                    />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

const responsiveCss = `
@media (max-width: 1050px) {
  .course-location-card {
    grid-template-columns: 1fr !important;
  }
}
`

const pageStyle: CSSProperties = {
  minHeight: '100vh',
  background: '#020817',
  color: 'white',
}

const containerStyle: CSSProperties = {
  width: 'min(1240px, calc(100% - 32px))',
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
  maxWidth: '900px',
  color: '#d8d8d8',
  fontSize: '18px',
  lineHeight: 1.75,
  margin: 0,
}

const locationsSectionStyle: CSSProperties = {
  padding: '22px 0 86px',
}

const locationsGridStyle: CSSProperties = {
  display: 'grid',
  gap: '20px',
}

const locationCardStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.055)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: '24px',
  padding: '18px',
  display: 'grid',
  gridTemplateColumns: '1.08fr 0.88fr 0.88fr',
  gap: '16px',
  alignItems: 'stretch',
  boxShadow: '0 18px 42px rgba(0,0,0,0.18)',
}

const textColumnStyle: CSSProperties = {
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  gap: '11px',
  padding: '4px',
}

const cityBadgeStyle: CSSProperties = {
  display: 'inline-flex',
  width: 'fit-content',
  padding: '11px 20px',
  borderRadius: '999px',
  background: 'linear-gradient(180deg, #b9444f 0%, #82232b 100%)',
  color: 'white',
  fontWeight: 950,
  fontSize: '22px',
  lineHeight: 1,
  boxShadow: '0 8px 18px rgba(80,10,18,0.24)',
}

const gymNameStyle: CSSProperties = {
  margin: '2px 0 0',
  fontSize: '18px',
  lineHeight: 1.15,
  fontWeight: 800,
  color: '#d8d8d8',
}

const addressStyle: CSSProperties = {
  margin: 0,
  color: '#f3dede',
  fontSize: '15px',
  lineHeight: 1.5,
  fontWeight: 800,
}

const scheduleBoxStyle: CSSProperties = {
  display: 'grid',
  gap: '7px',
  marginTop: '4px',
}

const scheduleTitleStyle: CSSProperties = {
  margin: 0,
  color: '#d95b64',
  textTransform: 'uppercase',
  letterSpacing: '1.5px',
  fontSize: '12px',
  fontWeight: 950,
}

const scheduleListStyle: CSSProperties = {
  margin: 0,
  paddingLeft: '18px',
  color: '#e5e7eb',
  lineHeight: 1.6,
  fontSize: '14px',
}

const scheduleItemStyle: CSSProperties = {
  marginBottom: '2px',
}

const gymImageWrapperStyle: CSSProperties = {
  width: '100%',
  minHeight: '220px',
  maxHeight: '220px',
  borderRadius: '18px',
  overflow: 'hidden',
  border: '1px solid rgba(255,255,255,0.09)',
  background: '#111827',
}

const gymImageStyle: CSSProperties = {
  width: '100%',
  height: '220px',
  objectFit: 'cover',
  display: 'block',
}

const mapWrapperStyle: CSSProperties = {
  width: '100%',
  minHeight: '220px',
  maxHeight: '220px',
  borderRadius: '18px',
  overflow: 'hidden',
  border: '1px solid rgba(255,255,255,0.09)',
  background: '#111827',
}

const mapStyle: CSSProperties = {
  width: '100%',
  height: '220px',
  border: 0,
  display: 'block',
}

export default Corsi