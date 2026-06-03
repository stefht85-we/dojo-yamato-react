import { supabase } from './supabaseClient'

const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24

function isExternalUrl(url: string) {
  return /^https?:\/\//i.test(url) && !url.includes('/storage/v1/object/')
}

function cleanStoragePath(path: string) {
  return decodeURIComponent(path).replace(/^\/+/, '')
}

export function getStorageInfoFromUrl(url: string | null | undefined) {
  if (!url) return null

  const cleanUrl = url.trim()
  if (!cleanUrl) return null

  if (!/^https?:\/\//i.test(cleanUrl)) {
    const [bucket, ...pathParts] = cleanUrl.replace(/^\/+/, '').split('/')
    if (!bucket || pathParts.length === 0) return null
    return { bucket, path: cleanStoragePath(pathParts.join('/')) }
  }

  try {
    const parsed = new URL(cleanUrl)

    const publicMarker = '/storage/v1/object/public/'
    const signMarker = '/storage/v1/object/sign/'
    const authenticatedMarker = '/storage/v1/object/authenticated/'

    let marker = ''
    if (parsed.pathname.includes(publicMarker)) marker = publicMarker
    if (parsed.pathname.includes(signMarker)) marker = signMarker
    if (parsed.pathname.includes(authenticatedMarker)) marker = authenticatedMarker

    if (!marker) return null

    const afterMarker = parsed.pathname.split(marker)[1]
    if (!afterMarker) return null

    const [bucket, ...pathParts] = afterMarker.split('/')
    if (!bucket || pathParts.length === 0) return null

    return { bucket, path: cleanStoragePath(pathParts.join('/')) }
  } catch {
    return null
  }
}

export async function getSignedUrlFromPublicUrl(url: string | null | undefined) {
  if (!url) return null

  const cleanUrl = url.trim()
  if (!cleanUrl) return null

  if (isExternalUrl(cleanUrl)) return cleanUrl

  const storageInfo = getStorageInfoFromUrl(cleanUrl)
  if (!storageInfo) return cleanUrl

  const { data, error } = await supabase.storage
    .from(storageInfo.bucket)
    .createSignedUrl(storageInfo.path, SIGNED_URL_TTL_SECONDS)

  if (error || !data?.signedUrl) {
    return cleanUrl
  }

  return data.signedUrl
}
