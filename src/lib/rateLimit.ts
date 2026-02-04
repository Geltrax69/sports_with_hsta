/**
 * Rate limiter for image requests to prevent repeated failed attempts
 * Tracks attempts per URL and enforces a maximum retry limit
 */

interface RateLimitEntry {
  count: number
  lastAttempt: number
}

class ImageRateLimiter {
  private attempts: Map<string, RateLimitEntry> = new Map()
  private maxAttempts: number
  private resetTimeMs: number

  constructor(maxAttempts = 5, resetTimeMs = 60000) {
    this.maxAttempts = maxAttempts
    this.resetTimeMs = resetTimeMs
  }

  /**
   * Check if a URL can be attempted
   * @param url - The image URL to check
   * @returns true if the URL can be attempted, false if rate limit exceeded
   */
  canAttempt(url: string): boolean {
    const entry = this.attempts.get(url)
    
    if (!entry) {
      return true
    }

    // Reset if enough time has passed
    const now = Date.now()
    if (now - entry.lastAttempt > this.resetTimeMs) {
      this.attempts.delete(url)
      return true
    }

    return entry.count < this.maxAttempts
  }

  /**
   * Record an attempt for a URL
   * @param url - The image URL being attempted
   */
  recordAttempt(url: string): void {
    const now = Date.now()
    const entry = this.attempts.get(url)

    if (!entry) {
      this.attempts.set(url, { count: 1, lastAttempt: now })
    } else {
      // Reset if enough time has passed
      if (now - entry.lastAttempt > this.resetTimeMs) {
        this.attempts.set(url, { count: 1, lastAttempt: now })
      } else {
        entry.count++
        entry.lastAttempt = now
      }
    }
  }

  /**
   * Get the current attempt count for a URL
   * @param url - The image URL to check
   * @returns The number of attempts made
   */
  getAttemptCount(url: string): number {
    const entry = this.attempts.get(url)
    if (!entry) return 0

    // Check if it should be reset
    const now = Date.now()
    if (now - entry.lastAttempt > this.resetTimeMs) {
      this.attempts.delete(url)
      return 0
    }

    return entry.count
  }

  /**
   * Reset tracking for a specific URL
   * @param url - The image URL to reset
   */
  reset(url: string): void {
    this.attempts.delete(url)
  }

  /**
   * Clear all tracked attempts
   */
  clearAll(): void {
    this.attempts.clear()
  }

  /**
   * Clean up expired entries (older than reset time)
   */
  cleanup(): void {
    const now = Date.now()
    for (const [url, entry] of this.attempts.entries()) {
      if (now - entry.lastAttempt > this.resetTimeMs) {
        this.attempts.delete(url)
      }
    }
  }
}

// Singleton instance for global rate limiting
export const imageRateLimiter = new ImageRateLimiter(5, 60000) // Max 5 attempts, 60s reset

// Cleanup expired entries every 5 minutes
setInterval(() => {
  imageRateLimiter.cleanup()
}, 5 * 60 * 1000)
