import { createContext, useContext, useState, type ReactNode } from 'react'
import {
  apiRequest,
  getAuthToken,
  setAuthToken,
  getActiveRole,
  setActiveRole,
  getLastRole,
  setLastRole,
  getStoredUser,
  setStoredUser,
  clearAuthStorage,
} from '../lib/api'

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

/**
 * Restore this tab's session from storage, synchronously. Sessions are
 * stored per role so an admin tab and a district tab in the same browser
 * don't clobber each other (that used to produce "Forbidden" errors and
 * surprise logouts). Returns the restored user, or null.
 */
function restoreSession(): User | null {
  const tryRole = (role: string | null): User | null => {
    if (!role) return null
    setActiveRole(role)
    const storedUser = getStoredUser(role)
    const token = getAuthToken()
    if (storedUser && token) {
      try {
        const parsed = JSON.parse(storedUser) as User
        if (parsed && parsed.role === role) return parsed
      } catch {
        /* fall through to cleanup */
      }
    }
    // Stale/incomplete session for this role — drop it, don't half-login.
    clearAuthStorage(role)
    setActiveRole(null)
    return null
  }

  // 1. This tab already has an active role (e.g. after reload).
  const fromTab = tryRole(getActiveRole())
  if (fromTab) return fromTab

  // 2. Migrate a pre-existing single-key session (from before per-role
  //    storage) into the namespaced layout.
  try {
    const legacy = window.localStorage.getItem('stfi.user')
    if (legacy) {
      const parsed = JSON.parse(legacy) as User
      const legacyToken = window.localStorage.getItem('stfi.token')
      if (parsed?.role && legacyToken) {
        setActiveRole(parsed.role)
        setAuthToken(legacyToken, parsed.role)
        setStoredUser(parsed.role, legacy)
        setLastRole(parsed.role)
        window.localStorage.removeItem('stfi.user')
        window.localStorage.removeItem('stfi.token')
        return parsed
      }
    }
  } catch {
    /* corrupted legacy session — start logged out */
  }

  // 3. Fresh tab: pick up the most recently used role's session.
  return tryRole(getLastRole())
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Session restore is synchronous (lazy initializer), so auth is ready on
  // first render — no loading gate needed.
  const [user, setUser] = useState<User | null>(() => restoreSession())
  const authReady = true

  /** Persist a freshly authenticated session for its role. */
  const persistSession = (token: string, nextUser: User) => {
    setActiveRole(nextUser.role)
    setAuthToken(token, nextUser.role)
    setStoredUser(nextUser.role, JSON.stringify(nextUser))
    setLastRole(nextUser.role)
    setUser(nextUser)
  }

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

        const nextUser: User = {
          id:     data.user.id,
          role:   data.user.role,
          name:   data.user.name,
          email:  data.user.email,
          avatar: makeAvatar(data.user.name),
        }
        persistSession(data.token, nextUser)
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
        const nextUser: User = {
          id:     data.user.id,
          role:   data.user.role,
          name:   data.user.name,
          email:  data.user.email,
          avatar: makeAvatar(data.user.name),
        }
        persistSession(data.token, nextUser)
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

      const nextUser: User = {
        id:     data.user.id,
        role:   data.user.role,
        name:   data.user.name,
        email:  data.user.email,
        avatar: makeAvatar(data.user.name),
      }
      persistSession(data.token, nextUser)
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
      setStoredUser(getActiveRole(), JSON.stringify(next))
      return next
    })
  }

  // ── Logout ────────────────────────────────────────────────────────────────

  const logout = () => {
    setUser(null)
    clearAuthStorage()
    setActiveRole(null)
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
