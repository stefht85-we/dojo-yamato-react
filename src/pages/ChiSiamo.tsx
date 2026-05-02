import './ChiSiamo.css'

type VisualBlock = {
  title: string
  text: string
  image: string
  reverse?: boolean
}

const visualBlocks: VisualBlock[] = [
  {
    title: 'La persona prima dell’atleta',
    text: 'Siamo una scuola di Karate che pone al centro la persona, prima ancora dell’atleta.',
    image: '/images/chi-siamo-bambini.jpg',
  },
  {
    title: 'Shotokan, rispetto e disciplina',
    text: 'Il nostro insegnamento si basa sullo stile Shotokan e su valori come rispetto, disciplina, impegno e crescita personale.',
    image: '/images/chi-siamo-kumite.jpg',
    reverse: true,
  },
  {
    title: 'Un percorso per bambini, ragazzi e adulti',
    text: 'Nel nostro dojo il Karate non è solo tecnica o competizione, ma un percorso educativo che accompagna ogni allievo nella crescita del corpo, della mente e del carattere.',
    image: '/images/chi-siamo-gruppo.jpg',
  },
  {
    title: 'Per chi vuole crescere anche nelle gare',
    text: 'Per gli allievi che desiderano mettersi alla prova, il Dojo Yamato accompagna con serietà anche il percorso competitivo. Le gare di kata e kumite diventano occasioni per sviluppare concentrazione, coraggio, rispetto dell’avversario e capacità di gestire le emozioni.',
    image: '/images/chi-siamo-gare.jpg',
    reverse: true,
  },
]

function ChiSiamo() {
  return (
    <main className="chi-page">
      <section className="chi-hero">
        <div className="chi-container">
          <p className="chi-label">Chi siamo</p>

          <h1 className="chi-title">Dojo Yamato Arti Marziali</h1>

          <div className="chi-hero-textbox">
            <p>
              L’A.S.D. Dojo Yamato Arti Marziali, nata nel 1995, vive il Karate
              come percorso di crescita personale oltre che sportivo.
            </p>

            <p>
              Ispirata alla tradizione giapponese dello Shotokan, unisce
              disciplina, rispetto e cura tecnica a un ambiente familiare ed
              educativo.
            </p>

            <p>
              Guidata dall’esperienza del maestro Caforio, insegna ai bambini
              sicurezza, ai ragazzi autocontrollo e agli adulti equilibrio. Le
              gare sono importanti, ma contano di più la formazione del
              carattere, il rispetto e il miglioramento continuo in kihon, kata
              e kumite.
            </p>
          </div>
        </div>
      </section>

      <section className="chi-intro-section">
        <div className="chi-container">
          <div className="chi-intro-card">
            <div>
              <span className="chi-small-label">La nostra idea di Karate</span>
              <h2>Un dojo dove si cresce, prima ancora di competere.</h2>
            </div>

            <p>
              Nel Dojo Yamato il Karate è un percorso educativo: aiuta a
              costruire sicurezza, rispetto, disciplina e capacità di affrontare
              le difficoltà con equilibrio.
            </p>
          </div>
        </div>
      </section>

      <section className="chi-visual-section">
        <div className="chi-container">
          <div className="chi-blocks">
            {visualBlocks.map((block) => (
              <article
                key={block.title}
                className={`chi-block ${block.reverse ? 'chi-block-reverse' : ''}`}
              >
                <div className="chi-textbox">
                  <h2>{block.title}</h2>
                  <p>{block.text}</p>
                </div>

                <div className="chi-image-wrap">
                  <img src={block.image} alt={block.title} />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="chi-values-section">
        <div className="chi-container">
          <div className="chi-values-card">
            <span>Sicurezza</span>
            <span>Rispetto</span>
            <span>Crescita</span>
            <span>Impegno</span>
            <span>Consapevolezza</span>
          </div>
        </div>
      </section>

      <section className="chi-final-section">
        <div className="chi-container">
          <div className="chi-final-card">
            <p className="chi-final-quote">
              Il Karate inizia sul tatami, ma continua nella vita di tutti i
              giorni.
            </p>

            <p className="chi-final-text">
              Noi insegniamo a percorrere questa strada, un passo alla volta.
            </p>

            <div className="chi-buttons">
              <a href="/corsi" className="chi-button-primary">
                Scopri i corsi
              </a>

              <a href="/contatti" className="chi-button-secondary">
                Contattaci
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default ChiSiamo