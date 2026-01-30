import { apiRequest } from './api'

export async function getSignedUrlForImage(originalUrl: string, requireAuth = true): Promise<string | null> {
  try {
    const u = new URL(originalUrl)
    const key = u.pathname.replace(/^\/+/, '')
    const res = await apiRequest<{ url: string }>(`/uploads/signed-url?key=${encodeURIComponent(key)}`, {
      method: 'GET',
      auth: requireAuth, // Default to true for admin panel, can be false for public pages
    })
    return res.url || null
  } catch (error) {
    console.error('[getSignedUrlForImage] Error getting signed URL:', error)
    return null
  }
}

export async function resolveImageUrl(originalUrl: string, requireAuth = false): Promise<string> {
  const placeholder = '/assets/images/placeholder.svg'
  
  if (!originalUrl) return placeholder
  
  // For external URLs (Google, etc), use them directly
  if (originalUrl.startsWith('https://lh3.googleusercontent.com')) {
    return originalUrl
  }
  
  // For S3 URLs, always use signed URLs since bucket blocks public access
  if (originalUrl.includes('.s3.') || originalUrl.includes('s3-') || originalUrl.includes('amazonaws.com')) {
    try {
      const signed = await getSignedUrlForImage(originalUrl, requireAuth)
      if (signed) {
        return signed
      }
      return originalUrl
    } catch (error) {
      console.error('Error getting signed URL:', error)
      return originalUrl
    }
  }
  
  // For other HTTPS URLs, try them directly
  if (originalUrl.startsWith('https://')) {
    return originalUrl
  }
  
  return originalUrl
}
