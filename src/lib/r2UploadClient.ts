type R2PresignResponse = {
  uploadUrl: string
  publicUrl: string
  key?: string
}

type R2PresignErrorResponse = {
  error: string
}

function isR2PresignResponse(data: unknown): data is R2PresignResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'uploadUrl' in data &&
    'publicUrl' in data &&
    typeof (data as R2PresignResponse).uploadUrl === 'string' &&
    typeof (data as R2PresignResponse).publicUrl === 'string'
  )
}

function isR2PresignErrorResponse(data: unknown): data is R2PresignErrorResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'error' in data &&
    typeof (data as R2PresignErrorResponse).error === 'string'
  )
}

function getFileExtension(fileName: string) {
  const extension = fileName.split('.').pop()?.toLowerCase()

  if (!extension || extension === fileName.toLowerCase()) {
    return ''
  }

  return extension
}

function sanitizeFileName(fileName: string) {
  const extension = getFileExtension(fileName)
  const baseName = extension
    ? fileName.slice(0, -(extension.length + 1))
    : fileName

  const cleanBaseName = baseName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()

  const safeBaseName = cleanBaseName || 'file'

  return extension ? `${safeBaseName}.${extension}` : safeBaseName
}

export async function uploadFileToR2(file: File, folder = 'uploads') {
  const safeFileName = sanitizeFileName(file.name)

  const presignResponse = await fetch('/.netlify/functions/r2-presign-upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fileName: safeFileName,
      contentType: file.type || 'application/octet-stream',
      folder,
    }),
  })

  const presignData: unknown = await presignResponse.json()

  if (!presignResponse.ok) {
    if (isR2PresignErrorResponse(presignData)) {
      throw new Error(presignData.error)
    }

    throw new Error('Errore generazione URL R2')
  }

  if (!isR2PresignResponse(presignData)) {
    throw new Error('Risposta R2 non valida')
  }

  const uploadResponse = await fetch(presignData.uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
    },
  })

  if (!uploadResponse.ok) {
    throw new Error('Errore upload file su R2')
  }

  return presignData.publicUrl
}
