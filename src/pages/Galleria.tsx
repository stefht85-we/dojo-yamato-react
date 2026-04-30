import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import './Galleria.css'

type GalleryItem = {
  id: string
  title: string
  image_url: string
  created_at: string
}

function Galleria() {
  const [images, setImages] = useState<GalleryItem[]>([])
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null)

  useEffect(() => {
    async function loadImages() {
      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Errore caricamento galleria:', error.message)
        return
      }

      setImages(data ?? [])
    }

    loadImages()
  }, [])

  return (
    <main style={{ minHeight: '90vh', background: '#0b0f1a', color: 'white', padding: '70px 32px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1>Galleria</h1>
        <p>Foto e momenti del Dojo Yamato.</p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '22px',
            marginTop: '40px',
          }}
        >
          {images.map((item) => (
            <div
              key={item.id}
              className="gallery-card"
              onClick={() => setSelectedImage(item)}
            >
              <img
                src={item.image_url}
                alt={item.title}
                style={{
                  width: '100%',
                  height: '260px',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />

              <div className="gallery-overlay">
                <h3>{item.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedImage && (
        <div className="lightbox" onClick={() => setSelectedImage(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setSelectedImage(null)}>
                  ×
            </button>

            <img src={selectedImage.image_url} alt={selectedImage.title} />

            <h2>{selectedImage.title}</h2>
          </div>
        </div>
      )}
    </main>
  )
}

export default Galleria