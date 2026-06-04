export type R2UploadResponse = {
  uploadUrl: string
  publicUrl: string
  key: string
}

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

export async function uploadToR2(file: File, folder: string) {
  const cleanFolder = folder.replace(/^\/+|\/+$/g, '')
  const safeName = sanitizeFileName(file.name)
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`
  const contentType = file.type || 'application/octet-stream'

  const response = await fetch('/.netlify/functions/r2-presign', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      folder: cleanFolder,
      fileName,
      contentType,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Errore creazione URL upload R2')
  }

  const data = (await response.json()) as R2UploadResponse

  const uploadResponse = await fetch(data.uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
    },
    body: file,
  })

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text()
    throw new Error(errorText || `Errore upload Cloudflare R2 (${uploadResponse.status})`)
  }

  return data.publicUrl
}
