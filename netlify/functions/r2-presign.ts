import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  }
}

function cleanPathPart(value: string) {
  return value
    .replace(/^\/+|\/+$/g, '')
    .replace(/\.\./g, '')
    .replace(/[^a-zA-Z0-9/_.,=-]+/g, '-')
}

export const handler = async (event: any) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Metodo non consentito' })
  }

  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  const bucket = process.env.R2_BUCKET
  const publicUrl = process.env.R2_PUBLIC_URL

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
    return json(500, { error: 'Variabili ambiente R2 mancanti' })
  }

  let payload: { folder?: string; fileName?: string; contentType?: string }

  try {
    payload = JSON.parse(event.body || '{}')
  } catch {
    return json(400, { error: 'Payload non valido' })
  }

  const folder = cleanPathPart(payload.folder || 'uploads')
  const fileName = cleanPathPart(payload.fileName || `file-${Date.now()}`)
  const contentType = payload.contentType || 'application/octet-stream'
  const key = `${folder}/${fileName}`.replace(/\/+/g, '/')

  try {
    const client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      forcePathStyle: true,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    })

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    })

    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 300 })

    return json(200, {
      uploadUrl,
      publicUrl: `${publicUrl.replace(/\/$/, '')}/${key}`,
      key,
    })
  } catch (error) {
    console.error('R2 presign error:', error)
    return json(500, { error: 'Errore generazione presigned URL R2' })
  }
}
