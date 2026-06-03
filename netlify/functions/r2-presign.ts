import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const allowedFolders = [
  'news',
  'galleria',
  'eventi',
  'teoria',
  'documenti',
  'difesa-personale',
  'insegnanti',
]

function json(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    },
    body: JSON.stringify(body),
  }
}

function normalizeFolder(folder: string) {
  return folder
    .replace(/^\/+|\/+$/g, '')
    .replace(/\.\./g, '')
}

function normalizeFileName(fileName: string) {
  return fileName
    .replace(/^\/+|\/+$/g, '')
    .replace(/\.\./g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .slice(0, 140)
}

export const handler = async (event: any) => {
  if (event.httpMethod === 'OPTIONS') return json(200, {})

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Metodo non consentito' })
  }

  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  const bucket = process.env.R2_BUCKET || 'dojo-yamato'
  const publicUrl = (process.env.R2_PUBLIC_URL || '').replace(/\/+$/g, '')

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
    return json(500, { error: 'Variabili ambiente R2 mancanti' })
  }

  let payload: { folder?: string; fileName?: string; contentType?: string }

  try {
    payload = JSON.parse(event.body || '{}')
  } catch {
    return json(400, { error: 'Body JSON non valido' })
  }

  const folder = normalizeFolder(payload.folder || '')
  const fileName = normalizeFileName(payload.fileName || '')
  const contentType = payload.contentType || 'application/octet-stream'

  if (!folder || !fileName) {
    return json(400, { error: 'Cartella o nome file mancante' })
  }

  const rootFolder = folder.split('/')[0]
  if (!allowedFolders.includes(rootFolder)) {
    return json(400, { error: `Cartella R2 non consentita: ${rootFolder}` })
  }

  const key = `${folder}/${fileName}`

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  })

  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    })

    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 60 * 10 })

    return json(200, {
      uploadUrl,
      publicUrl: `${publicUrl}/${key}`,
      key,
    })
  } catch (error) {
    console.error(error)
    return json(500, { error: 'Errore generazione presigned URL R2' })
  }
}
