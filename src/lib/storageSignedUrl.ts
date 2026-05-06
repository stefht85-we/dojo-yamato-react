import { supabase } from './supabaseClient'

const SIGNED_URL_EXPIRES_IN = 60 * 60 // 1 ora

type CacheItem = {
  signedUrl: string
  expiresAt: number
}

const signedUrlCache = new Map<string, CacheItem>()

function extractBucketAndPathFromUrl(url: string) {
  try {
    const parsed = new URL(url)

    const marker = '/storage/v1/object/public/'
    const index = parsed.pathname.indexOf(marker)

    if (index === -1) return null

    const fullPath = parsed.pathname.substring(index + marker.length)
    const [bucket, ...pathParts] = fullPath.split('/')

    if (!bucket || pathParts.length === 0) return null

    return {
      bucket,
      path: decodeURIComponent(pathParts.join('/')),
    }
  } catch {
    return null
  }
}

export async function getSignedUrlFromPublicUrl(
  url: string | null | undefined
): Promise<string | null> {
  if (!url) return null

  const now = Date.now()
  const cached = signedUrlCache.get(url)

  if (cached && cached.expiresAt > now) {
    return cached.signedUrl
  }

  const extracted = extractBucketAndPathFromUrl(url)

  if (!extracted) {
    return url
  }

  const { bucket, path } = extracted

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, SIGNED_URL_EXPIRES_IN)

  if (error || !data?.signedUrl) {
    console.error('Errore creazione signed URL:', error)
    return null
  }

  signedUrlCache.set(url, {
    signedUrl: data.signedUrl,
    expiresAt: now + SIGNED_URL_EXPIRES_IN * 1000 - 60 * 1000,
  })

  return data.signedUrl
}

export function clearSignedUrlCache() {
  signedUrlCache.clear()
}