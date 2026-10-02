import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { apiRequest, getAuthToken, setAuthToken } from '../lib/api'

export type UserRole = 'admin' | 'coach' | 'player' | 'referee' | 'district'

export type User = {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
}

// ── Login result discriminated union ──────────────────────────────────────────
export type LoginResult =
  | { status: 'success' }
  | { status: 'otp_required'; email: string }
  | { status: 'error' }

type AuthContextType = {
  user: User | null
  authReady: boolean
  login: (email: string, password: string, role?: UserRole) => Promise<LoginResult>
  verifyAdminOtp: (email: string, otp: string) => Promise<{ success: boolean; error?: string }>
  resendAdminOtp: (email: string) => Promise<{ ok: boolean; waitSeconds?: number; error?: string }>
  setUserEmail: (email: string) => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeAvatar = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=5a0a8f&color=fff&bold=true`

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    const storedUser = localStorage.getItem('stfi.user')
    if (storedUser) {
      try {
        const token = getAuthToken()
        if (!token) {
          localStorage.removeItem('stfi.user')
        } else {
          setUser(JSON.parse(storedUser))
        }
      } catch {
        localStorage.removeItem('stfi.user')
      }
    }
    setAuthReady(true)
  }, [])

  // ── Step 1: password login ───────────────────────────────────────────────

  const login = async (email: string, password: string, role?: UserRole): Promise<LoginResult> => {
    if (!role) return { status: 'error' }

    // Non-admin: use the unified /auth/login endpoint (returns JWT directly)
    if (role !== 'admin') {
      try {
        const data = await apiRequest<{
          token: string
          user: { id: string; role: UserRole; name: string; email: string }
        }>('/auth/login', {
          method: 'POST',
          body:   JSON.stringify({ email, password, role }),
        })

        setAuthToken(data.token)
        const nextUser: User = {
          id:     data.user.id,
          role:   data.user.role,
          name:   data.user.name,
          email:  data.user.email,
          avatar: makeAvatar(data.user.name),
        }
        setUser(nextUser)
        localStorage.setItem('stfi.user', JSON.stringify(nextUser))
        return { status: 'success' }
      } catch {
        return { status: 'error' }
      }
    }

    // Admin: call /auth/admin/login — backend responds with requiresOtp
    try {
      const data = await apiRequest<
        | { requiresOtp: true; email: string }
        | { token: string; user: { id: string; role: UserRole; name: string; email: string } }
      >('/auth/admin/login', {
        method: 'POST',
        body:   JSON.stringify({ email, password }),
      })

      // Type guard: check if OTP is needed
      if ('requiresOtp' in data && data.requiresOtp) {
        return { status: 'otp_required', email: data.email }
      }

      // Shouldn't reach here normally, but handle direct JWT just in case
      if ('token' in data) {
        setAuthToken(data.token)
        const nextUser: User = {
          id:     data.user.id,
          role:   data.user.role,
          name:   data.user.name,
          email:  data.user.email,
          avatar: makeAvatar(data.user.name),
        }
        setUser(nextUser)
        localStorage.setItem('stfi.user', JSON.stringify(nextUser))
        return { status: 'success' }
      }

      return { status: 'error' }
    } catch {
      return { status: 'error' }
    }
  }

  // ── Step 2: OTP verification (admin only) ────────────────────────────────

  const verifyAdminOtp = async (
    email: string,
    otp: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const data = await apiRequest<{
        token: string
        user: { id: string; role: UserRole; name: string; email: string }
      }>('/auth/admin/verify-otp', {
        method: 'POST',
        body:   JSON.stringify({ email, otp }),
      })

      setAuthToken(data.token)
      const nextUser: User = {
        id:     data.user.id,
        role:   data.user.role,
        name:   data.user.name,
        email:  data.user.email,
        avatar: makeAvatar(data.user.name),
      }
      setUser(nextUser)
      localStorage.setItem('stfi.user', JSON.stringify(nextUser))
      return { success: true }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err !== null && 'error' in err
          ? String((err as { error: unknown }).error)
          : 'Verification failed. Please try again.'
      return { success: false, error: msg }
    }
  }

  // ── Resend OTP ────────────────────────────────────────────────────────────

  const resendAdminOtp = async (
    email: string,
  ): Promise<{ ok: boolean; waitSeconds?: number; error?: string }> => {
    try {
      await apiRequest('/auth/admin/resend-otp', {
        method: 'POST',
        body:   JSON.stringify({ email }),
      })
      return { ok: true }
    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'waitSeconds' in err
      ) {
        const e = err as { waitSeconds?: number; error?: string }
        return { ok: false, waitSeconds: e.waitSeconds, error: e.error }
      }
      const msg = err instanceof Error ? err.message : 'Failed to resend OTP.'
      return { ok: false, error: msg }
    }
  }

  // ── Email change (keeps the cached session in sync after a verified change) ─

  const setUserEmail = (email: string) => {
    setUser((prev) => {
      if (!prev) return prev
      const next = { ...prev, email }
      localStorage.setItem('stfi.user', JSON.stringify(next))
      return next
    })
  }

  // ── Logout ────────────────────────────────────────────────────────────────

  const logout = () => {
    setUser(null)
    localStorage.removeItem('stfi.user')
    setAuthToken(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        authReady,
        login,
        verifyAdminOtp,
        resendAdminOtp,
        setUserEmail,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
