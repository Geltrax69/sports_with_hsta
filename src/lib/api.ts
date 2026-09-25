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
    // `import.meta.env` is Vite's; `process.env` is the fallback so this module can be
    // exercised outside the bundler without silently pointing at the production API.
    const envUrl = ((import.meta as any).env?.VITE_API_BASE_URL
      ?? (globalThis as any).process?.env?.VITE_API_BASE_URL) as string | undefined
    // If we are in production (built) mode, but the env var claims to be localhost
    // (likely due to .env.local leaking into the build), we ignore it and use the default.
    if ((import.meta as any).env?.PROD && envUrl && envUrl.includes('localhost')) {
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
// Extended timeout for anything carrying files — covers Render cold-start (up to 60 s)
// plus the actual upload on a slow mobile connection.
const UPLOAD_TIMEOUT_MS = 120_000
const API_MAX_RETRIES = 1

/** Methods that can be safely repeated. A POST that timed out may already have been processed. */
const IDEMPOTENT_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

export type ApiErrorKind =
  | 'offline'      // the device has no connection — nothing was sent
  | 'timeout'      // we gave up waiting; the server may or may not have processed it
  | 'network'      // could not reach the server (DNS, CORS, connection reset)
  | 'ratelimit'    // 429
  | 'too-large'    // 413
  | 'server'       // 5xx — our problem, not the user's
  | 'client'       // 4xx — the request itself was rejected
  | 'cancelled'    // the caller aborted (navigation, unmount)
  | 'unknown'

/** Error carrying enough context to diagnose a failure from a log line alone. */
export class ApiError extends Error {
  kind: ApiErrorKind
  status?: number
  path: string
  method: string
  durationMs: number
  requestId?: string
  attempts: number

  constructor(
    message: string,
    info: {
      kind: ApiErrorKind
      status?: number
      path: string
      method: string
      durationMs: number
      requestId?: string
      attempts: number
      cause?: unknown
    },
  ) {
    super(message)
    this.name = 'ApiError'
    this.kind = info.kind
    this.status = info.status
    this.path = info.path
    this.method = info.method
    this.durationMs = info.durationMs
    this.requestId = info.requestId
    this.attempts = info.attempts
    if (info.cause !== undefined) (this as { cause?: unknown }).cause = info.cause
  }
}

const isUploadBody = (body: unknown) => typeof FormData !== 'undefined' && body instanceof FormData

/** Turns a failure into a sentence that names the cause and the next step. */
function describeFailure(args: {
  kind: ApiErrorKind
  status?: number
  serverMessage?: string
  isUpload: boolean
  isWrite: boolean
  retryAfterSeconds?: number
}): string {
  const { kind, status, serverMessage, isUpload, isWrite, retryAfterSeconds } = args

  switch (kind) {
    case 'offline':
      return 'Your device is offline, so nothing was sent. Reconnect to the internet and try again.'

    case 'timeout':
      if (isUpload) {
        return isWrite
          ? 'The upload was still running after 2 minutes and was stopped. Your connection may be slow or your files too large (each must be under 5 MB). Before submitting again, check whether it already went through.'
          : 'The upload was still running after 2 minutes and was stopped. Your connection may be slow or the file too large.'
      }
      return isWrite
        ? 'The server did not answer in time, so we stopped waiting. It may still have received your request — check before sending it again.'
        : 'The server did not answer in time. Check your connection and try again.'

    case 'network':
      return 'We could not reach the server. Either your connection dropped, or the server is temporarily unavailable — please try again in a moment.'

    case 'ratelimit':
      return retryAfterSeconds
        ? `Too many attempts from this connection. Please wait ${retryAfterSeconds} second${retryAfterSeconds === 1 ? '' : 's'} and try again.`
        : 'Too many attempts from this connection. Please wait a minute and try again.'

    case 'too-large':
      return 'Your files are too large to upload. Each file must be under 5 MB — try a smaller photo or document.'

    case 'cancelled':
      return 'The request was cancelled.'

    case 'server':
      if (status === 503) {
        return 'The server is starting up or its database is unavailable. This is on our side — please wait about a minute and try again.'
      }
      return `The server hit an error (${status ?? 500}) while handling this. That is a problem on our side, not your connection — please try again shortly, and tell us if it keeps happening.`

    case 'client':
      // 4xx: the server explained exactly what was wrong. Say that, not a guess.
      return serverMessage || `The request was rejected (${status}).`

    default:
      return serverMessage || 'Something went wrong. Please try again.'
  }
}

/** One structured line per failure, so the browser console shows the cause, not just the message. */
function logApiFailure(error: ApiError, extra?: Record<string, unknown>) {
  const detail = {
    kind: error.kind,
    status: error.status ?? null,
    method: error.method,
    path: error.path,
    durationMs: error.durationMs,
    attempts: error.attempts,
    requestId: error.requestId ?? null,
    online: typeof navigator !== 'undefined' ? navigator.onLine : null,
    at: new Date().toISOString(),
    ...extra,
  }
  console.error(`[api] ${error.method} ${error.path} failed — ${error.kind}: ${error.message}`, detail)
  void reportClientError({ message: error.message, ...detail })
}

/**
 * Ships a client-side failure to the server log so an admin can see what users hit
 * in production without asking them to open devtools. Never throws, never retried.
 */
export async function reportClientError(payload: Record<string, unknown>): Promise<void> {
  if (payload?.path === '/client-errors') return // never report our own reporting
  try {
    await fetchWithTimeout(
      `${API_BASE_URL}/client-errors`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          url: typeof window !== 'undefined' ? window.location.href : undefined,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        }),
      },
      5_000,
    )
  } catch {
    // Reporting is best-effort — a failure here must never mask the original error.
  }
}

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
  const method = (options.method || 'GET').toUpperCase()
  const isUpload = isUploadBody(options.body)
  const isWrite = !IDEMPOTENT_METHODS.has(method)
  // Anything carrying files gets the long timeout by default. Registration sends a
  // photo and ID scans over mobile data; 10 s was never enough and surfaced as
  // "Request timed out" even when the upload was progressing normally.
  const timeoutMs = options.timeoutMs ?? (isUpload ? UPLOAD_TIMEOUT_MS : API_TIMEOUT_MS)
  const maxAttempts = (options.retries ?? API_MAX_RETRIES) + 1
  const startedAt = Date.now()

  // `signal` is part of RequestInit — callers can pass it to cancel the request on unmount.
  const externalSignal = options.signal ?? undefined

  const headers = new Headers(options.headers || undefined)

  if (!isUpload) {
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

  const fail = (
    kind: ApiErrorKind,
    info: { status?: number; serverMessage?: string; requestId?: string; retryAfterSeconds?: number; attempts: number; cause?: unknown },
  ) => {
    const error = new ApiError(
      describeFailure({
        kind,
        status: info.status,
        serverMessage: info.serverMessage,
        isUpload,
        isWrite,
        retryAfterSeconds: info.retryAfterSeconds,
      }),
      {
        kind,
        status: info.status,
        path,
        method,
        durationMs: Date.now() - startedAt,
        requestId: info.requestId,
        attempts: info.attempts,
        cause: info.cause,
      },
    )
    if (kind !== 'cancelled') logApiFailure(error, { serverMessage: info.serverMessage ?? null })
    return error
  }

  // Nothing leaves the device when it is offline — say so instead of blaming a timeout.
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw fail('offline', { attempts: 0 })
  }

  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Bail out immediately if the caller has already cancelled
    if (externalSignal?.aborted) {
      throw fail('cancelled', { attempts: attempt })
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
        const body = data && typeof data === 'object' ? (data as Record<string, unknown>) : undefined
        const serverMessage =
          typeof body?.error === 'string'
            ? body.error
            : typeof body?.message === 'string'
              ? body.message
              : undefined
        const requestId =
          res.headers.get('x-request-id') ||
          (typeof body?.requestId === 'string' ? body.requestId : undefined) ||
          undefined
        const retryAfterHeader = Number(res.headers.get('retry-after'))

        const kind: ApiErrorKind =
          res.status === 429
            ? 'ratelimit'
            : res.status === 413
              ? 'too-large'
              : res.status >= 500
                ? 'server'
                : 'client'

        throw fail(kind, {
          status: res.status,
          serverMessage,
          requestId,
          retryAfterSeconds: Number.isFinite(retryAfterHeader) && retryAfterHeader > 0 ? retryAfterHeader : undefined,
          attempts: attempt + 1,
        })
      }

      return data as T
    } catch (err) {
      // Already classified and logged — pass it straight through.
      if (err instanceof ApiError) throw err

      lastError = err instanceof Error ? err : new Error('Request failed')
      // If cancelled by caller, stop immediately — do not retry
      if (externalSignal?.aborted) {
        throw fail('cancelled', { attempts: attempt + 1 })
      }
      const isAbort = lastError.name === 'AbortError'
      const isNetwork =
        lastError.message.includes('Failed to fetch') ||
        lastError.message.includes('NetworkError') ||
        lastError.message.includes('network')

      // Only repeat requests that are safe to repeat. Retrying a POST that timed out
      // is how one registration attempt becomes two accounts.
      const shouldRetry = !isWrite && (isNetwork || isAbort)
      if (attempt < maxAttempts - 1 && shouldRetry) {
        await new Promise((r) => window.setTimeout(r, 800 * (attempt + 1)))
        continue
      }

      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        throw fail('offline', { attempts: attempt + 1, cause: lastError })
      }
      if (isAbort) throw fail('timeout', { attempts: attempt + 1, cause: lastError })
      if (isNetwork) throw fail('network', { attempts: attempt + 1, cause: lastError })
      throw fail('unknown', { serverMessage: lastError.message, attempts: attempt + 1, cause: lastError })
    }
  }

  throw fail('unknown', { serverMessage: lastError?.message, attempts: maxAttempts })
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

