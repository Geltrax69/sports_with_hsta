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

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`

  const headers = new Headers(options.headers || undefined)

  // Don't set Content-Type for FormData - browser will set it with boundary
  if (!(options.body instanceof FormData)) {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }
  }

  if (options.auth) {
    const token = getAuthToken()
    console.log('[API] Auth requested. Token exists:', !!token)
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
      console.log('[API] Authorization header set')
    } else {
      console.warn('[API] Auth requested but no token found!')
    }
  }

  const res = await fetch(url, {
    ...options,
    headers,
  })

  const text = await res.text()
  let data: any = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }

  if (!res.ok) {
    const message = (data && (data.error || data.message)) || `Request failed (${res.status})`
    throw new Error(message)
  }

  return data as T
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

  // Create document (admin only)
  create: async (formData: FormData) => {
    return apiRequest<DocumentResponse>('/documents', {
      method: 'POST',
      body: formData,
      auth: true,
    })
  },

  // Update document (admin only)
  update: async (id: string, formData: FormData) => {
    return apiRequest<DocumentResponse>(`/documents/${id}`, {
      method: 'PATCH',
      body: formData,
      auth: true,
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

