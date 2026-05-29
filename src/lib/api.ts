const DEFAULT_API_BASE = 'https://sports-backend-fgsp.onrender.com/api'

const normalizeApiBaseUrl = (value: string): string => {
  const trimmed = String(value || '').trim().replace(/\/+$/, '');
  if (!trimmed) return DEFAULT_API_BASE;

  // Allow providing either:
  // - https://sports-backend-fgsp.onrender.com
  // - https://sports-backend-fgsp.onrender.com/api
  // - http://localhost:5001
  // - http://localhost:5001/api
  if (/\/api$/i.test(trimmed)) return trimmed;
  return `${trimmed}/api`;
};

export const API_BASE_URL: string = normalizeApiBaseUrl(
  (() => {
    const envUrl = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined
    // If we are in production (built) mode, but the env var claims to be localhost
    // (likely due to .env.local leaking into the build), we ignore it and use the default.
    if (import.meta.env.PROD && envUrl && envUrl.includes('localhost')) {
      console.warn('Ignoring localhost API URL in production', envUrl)
      return DEFAULT_API_BASE
    }

    return envUrl || DEFAULT_API_BASE
  })(),
)

const TOKEN_KEY = 'stfi.token'

export const getAuthToken = (): string | null => {
  try {
    const token = window.localStorage.getItem(TOKEN_KEY)
    const tokenValue = token || 'null'
    console.log('[getAuthToken] Token retrieved:', !!token, 'Key:', TOKEN_KEY, 'Value length:', tokenValue.length)
    return token
  } catch (err) {
    console.log('[getAuthToken] Error retrieving token:', err)
    return null
  }
}

export const setAuthToken = (token: string | null) => {
  console.log('[setAuthToken] Setting token:', !!token, 'Value length:', token?.length || 0)
  if (!token) {
    window.localStorage.removeItem(TOKEN_KEY)
    console.log('[setAuthToken] Token removed from localStorage')
    return
  }
  window.localStorage.setItem(TOKEN_KEY, token)
  console.log('[setAuthToken] Token saved to localStorage')
}

// Default timeout for regular API calls (auth, reads, deletes, etc.)
const API_TIMEOUT_MS = 10_000
// Extended timeout for file uploads — covers Render cold-start (30 s) + actual upload time
const UPLOAD_TIMEOUT_MS = 120_000
// Reduced from 2 → 1 so a single bad request costs at most 20 s, not 135 s.
const API_MAX_RETRIES = 1

/**
 * Wraps `fetch` with a per-request timeout AND honours an optional external AbortSignal.
 * When the caller's signal fires (e.g. component unmount), the HTTP request is actually
 * cancelled — not just ignored — so it cannot pile up in the browser connection pool.
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = API_TIMEOUT_MS,
  externalSignal?: AbortSignal,
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs)

  // Forward external abort to our internal controller so fetch() truly stops
  const onExternalAbort = () => controller.abort()
  if (externalSignal) {
    if (externalSignal.aborted) {
      window.clearTimeout(timeoutId)
      controller.abort()
    } else {
      externalSignal.addEventListener('abort', onExternalAbort, { once: true })
    }
  }

  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    window.clearTimeout(timeoutId)
    externalSignal?.removeEventListener('abort', onExternalAbort)
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { auth?: boolean; retries?: number; timeoutMs?: number } = {},
): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
  const timeoutMs = options.timeoutMs ?? API_TIMEOUT_MS
  const maxAttempts = (options.retries ?? API_MAX_RETRIES) + 1

  // `signal` is part of RequestInit — callers can pass it to cancel the request on unmount.
  const externalSignal = options.signal ?? undefined

  const headers = new Headers(options.headers || undefined)

  if (!(options.body instanceof FormData)) {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }
  }

  if (options.auth) {
    const token = getAuthToken()
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
  }

  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Bail out immediately if the caller has already cancelled
    if (externalSignal?.aborted) {
      throw new Error('Request was cancelled.')
    }
    try {
      const res = await fetchWithTimeout(url, { ...options, headers }, timeoutMs, externalSignal)

      const text = await res.text()
      let data: unknown = null
      try {
        data = text ? JSON.parse(text) : null
      } catch {
        data = text
      }

      if (!res.ok) {
        const raw =
          data && typeof data === 'object'
            ? (data as { error?: string; message?: string }).error || (data as { message?: string }).message
            : undefined
        const message = typeof raw === 'string' && raw.trim() ? raw : `Request failed (${res.status})`
        throw new Error(message)
      }

      return data as T
    } catch (err) {
      lastError = err instanceof Error ? err : new Error('Request failed')
      // If cancelled by caller, stop immediately — do not retry
      if (externalSignal?.aborted) {
        throw new Error('Request was cancelled.')
      }
      const isAbort   = lastError.name === 'AbortError'
      const isNetwork = lastError.message.includes('Failed to fetch') ||
                        lastError.message.includes('NetworkError') ||
                        lastError.message.includes('network')
      const isUpload  = timeoutMs >= UPLOAD_TIMEOUT_MS

      // For uploads: retry network errors (connection dropped before data sent — safe to retry)
      //              but never retry timeouts (upload may have partially succeeded — risky).
      // For regular calls: retry both network errors and timeouts (existing behaviour).
      const shouldRetry = isNetwork || (isAbort && !isUpload)
      if (attempt < maxAttempts - 1 && shouldRetry) {
        // Longer delay for uploads — gives Render's cold-start a few seconds to wake up
        const delayMs = isUpload ? 3000 : 800 * (attempt + 1)
        await new Promise((r) => window.setTimeout(r, delayMs))
        continue
      }

      if (isAbort) {
        throw new Error(
          isUpload
            ? 'Upload timed out — the file may be too large or the server is busy. Please try again.'
            : 'Request timed out. Please check your connection and try again.',
        )
      }
      if (isNetwork) {
        throw new Error('Network error — please check your connection and try again.')
      }
      throw lastError
    }
  }

  throw lastError || new Error('Request failed')
}

// ============================================
// DOCUMENTS API
// ============================================

export type DocumentCategory = 'official' | 'forms' | 'guidelines' | 'rules' | 'other'

export type DocumentItem = {
  _id: string
  title: string
  category: DocumentCategory
  description?: string
  fileUrl: string
  fileName: string
  fileSize: number
  uploadedAt: string
  uploadedBy?: {
    _id: string
    name: string
    email: string
  }
  tournament?: {
    _id: string
    title: string
  }
  downloadCount: number
}

export type DocumentsResponse = {
  success: boolean
  count: number
  data: DocumentItem[]
}

export type DocumentResponse = {
  success: boolean
  data: DocumentItem
}

export const documentsApi = {
  // Get all documents (public)
  getAll: async (params?: { category?: string; tournament?: string }) => {
    const query = new URLSearchParams()
    if (params?.category) query.set('category', params.category)
    if (params?.tournament) query.set('tournament', params.tournament)
    const queryString = query.toString()
    return apiRequest<DocumentsResponse>(`/documents${queryString ? `?${queryString}` : ''}`)
  },

  // Get single document (public)
  getById: async (id: string) => {
    return apiRequest<DocumentResponse>(`/documents/${id}`)
  },

  // Create document (admin only) — long timeout for large file uploads on Render
  create: async (formData: FormData) => {
    return apiRequest<DocumentResponse>('/documents', {
      method: 'POST',
      body: formData,
      auth: true,
      timeoutMs: UPLOAD_TIMEOUT_MS, // 2 min — covers cold-start + actual upload
      retries: 1,                    // 1 retry allowed for network drops (safe); timeouts are never retried
    })
  },

  // Update document (admin only) — same extended timeout for file replacement
  update: async (id: string, formData: FormData) => {
    return apiRequest<DocumentResponse>(`/documents/${id}`, {
      method: 'PATCH',
      body: formData,
      auth: true,
      timeoutMs: UPLOAD_TIMEOUT_MS,
      retries: 1,
    })
  },

  // Delete document (admin only)
  delete: async (id: string) => {
    return apiRequest<{ success: boolean; message: string }>(`/documents/${id}`, {
      method: 'DELETE',
      auth: true,
    })
  },

  // Increment download count (public)
  incrementDownload: async (id: string) => {
    return apiRequest<{ success: boolean; data: { downloadCount: number } }>(
      `/documents/${id}/download`,
      {
        method: 'POST',
      },
    )
  },
}

