import { apiRequest } from './api'
import { imageRateLimiter } from './rateLimit'

export async function getSignedUrlForImage(originalUrl: string, requireAuth = true): Promise<string | null> {
  // Check rate limit before attempting
  if (!imageRateLimiter.canAttempt(originalUrl)) {
    console.warn(`[getSignedUrlForImage] Rate limit exceeded for: ${originalUrl}`)
    return null
  }

  try {
    imageRateLimiter.recordAttempt(originalUrl)
    
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
    // Check rate limit before attempting
    if (!imageRateLimiter.canAttempt(originalUrl)) {
      console.warn(`[resolveImageUrl] Rate limit exceeded, using placeholder for: ${originalUrl}`)
      return placeholder
    }

    try {
      const signed = await getSignedUrlForImage(originalUrl, requireAuth)
      if (signed) {
        return signed
      }
      return placeholder // Return placeholder instead of broken URL
    } catch (error) {
      console.error('Error getting signed URL:', error)
      return placeholder // Return placeholder on error
    }
  }
  
  // For other HTTPS URLs, try them directly
  if (originalUrl.startsWith('https://')) {
    return originalUrl
  }
  
  return originalUrl
}
