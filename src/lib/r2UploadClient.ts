export type R2UploadResponse = {
  publicUrl: string
  key: string
}

const MAX_NETLIFY_FUNCTION_UPLOAD_MB = 5.5

function sanitizeFileName(fileName: string) {
  const name = fileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()

  return name || `file-${Date.now()}`
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      const result = String(reader.result || '')
      const base64 = result.includes(',') ? result.split(',')[1] : result
      resolve(base64)
    }

    reader.onerror = () => reject(new Error('Errore lettura file locale'))
    reader.readAsDataURL(file)
  })
}

export async function uploadToR2(file: File, folder: string) {
  const sizeMb = file.size / 1024 / 1024

  if (sizeMb > MAX_NETLIFY_FUNCTION_UPLOAD_MB) {
    throw new Error(
      `File troppo grande per upload tramite Netlify Function (${sizeMb.toFixed(1)} MB). ` +
        `Riduci il file sotto ${MAX_NETLIFY_FUNCTION_UPLOAD_MB} MB oppure useremo una modalità dedicata per video grandi.`
    )
  }

  const cleanFolder = folder.replace(/^\/+|\/+$/g, '')
  const safeName = sanitizeFileName(file.name)
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`
  const base64 = await fileToBase64(file)

  const response = await fetch('/.netlify/functions/r2-presign', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      folder: cleanFolder,
      fileName,
      contentType: file.type || 'application/octet-stream',
      base64,
    }),
  })

  const text = await response.text()
  let data: Partial<R2UploadResponse> & { error?: string } = {}

  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    data = { error: text }
  }

  if (!response.ok) {
    throw new Error(data.error || 'Errore upload file news su Cloudflare R2')
  }

  if (!data.publicUrl) {
    throw new Error('Upload R2 completato senza URL pubblico')
  }

  return data.publicUrl
}
