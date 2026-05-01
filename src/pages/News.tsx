import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

type NewsItem = {
  id: string
  title: string
  content: string
  image_url: string | null
  published: boolean
  created_at: string
}

function News() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function loadNews() {
      setLoading(true)
      setErrorMessage('')

      const { data, error } = await supabase
        .from('news')
        .select('id, title, content, image_url, published, created_at')
        .eq('published', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Errore caricamento news:', error)
        setErrorMessage('Non è stato possibile caricare le news.')
        setLoading(false)
        return
      }

      setNews(data ?? [])
      setLoading(false)
    }

    loadNews()
  }, [])

  return (
    <main
      style={{
        minHeight: '90vh',
        background:
          'radial-gradient(circle at top, rgba(230,57,70,0.22), transparent 36%), #0b0f1a',
        color: 'white',
        padding: '80px 24px',
      }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <section style={{ textAlign: 'center', marginBottom: '48px' }}>
          <p
            style={{
              color: '#e63946',
              fontWeight: 700,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              marginBottom: '12px',
            }}
          >
            Dojo Yamato
          </p>

          <h1
            style={{
              fontSize: '48px',
              margin: 0,
            }}
          >
            News
          </h1>

          <p
            style={{
              maxWidth: '700px',
              margin: '20px auto 0',
              color: '#d8d8d8',
              fontSize: '18px',
              lineHeight: 1.7,
            }}
          >
            Ultime comunicazioni, eventi, aggiornamenti e novità dal Dojo Yamato.
          </p>
        </section>

        {loading && (
          <p style={{ textAlign: 'center', color: '#d8d8d8' }}>
            Caricamento news...
          </p>
        )}

        {!loading && errorMessage && (
          <div
            style={{
              background: 'rgba(230,57,70,0.15)',
              border: '1px solid rgba(230,57,70,0.45)',
              padding: '24px',
              borderRadius: '16px',
              textAlign: 'center',
              color: '#ffd6d6',
            }}
          >
            {errorMessage}
          </div>
        )}

        {!loading && !errorMessage && news.length === 0 && (
          <div
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              padding: '32px',
              borderRadius: '18px',
              textAlign: 'center',
              color: '#d8d8d8',
            }}
          >
            <h2 style={{ marginTop: 0, color: 'white' }}>
              Nessuna news pubblicata
            </h2>

            <p style={{ marginBottom: 0 }}>
              Al momento non ci sono news disponibili. Torna presto per scoprire le novità dal Dojo.
            </p>
          </div>
        )}

        {!loading && !errorMessage && news.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px',
            }}
          >
            {news.map((item) => (
              <article
                key={item.id}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  color: 'white',
                  boxShadow: '0 18px 50px rgba(0,0,0,0.24)',
                }}
              >
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    style={{
                      width: '100%',
                      height: '220px',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                )}

                <div style={{ padding: '28px' }}>
                  <small
                    style={{
                      color: '#e63946',
                      fontWeight: 700,
                    }}
                  >
                    {item.created_at
                      ? new Date(item.created_at).toLocaleDateString('it-IT', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })
                      : ''}
                  </small>

                  <h2 style={{ margin: '12px 0 14px' }}>{item.title}</h2>

                  <p
                    style={{
                      marginTop: '18px',
                      lineHeight: 1.7,
                      color: '#d8d8d8',
                      whiteSpace: 'pre-line',
                    }}
                  >
                    {item.content}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

export default News