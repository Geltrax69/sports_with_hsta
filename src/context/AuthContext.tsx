import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { apiRequest, getAuthToken, setAuthToken } from '../lib/api'

export type UserRole = 'admin' | 'coach' | 'player'

export type User = {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
}

type AuthContextType = {
  user: User | null
  login: (email: string, password: string, role?: UserRole) => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)



export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Check if user is stored in localStorage
    const storedUser = localStorage.getItem('stfi.user')
    if (storedUser) {
      try {
        const token = getAuthToken()
        if (!token) {
          // Avoid restoring a privileged UI state without an auth token.
          localStorage.removeItem('stfi.user')
          return
        }

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem('stfi.user')
      }
    }
  }, [])

  const login = async (email: string, password: string, role?: UserRole): Promise<boolean> => {
    if (!role) return false

    try {
      const data = await apiRequest<{
        token: string
        user: { id: string; role: UserRole; name: string; email: string }
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, role }),
      })

      console.log('[AuthContext] Login successful. Token received:', !!data.token)
      setAuthToken(data.token)
      console.log('[AuthContext] Token set. Verification:', !!getAuthToken())

      const nextUser: User = {
        id: data.user.id,
        role: data.user.role,
        name: data.user.name,
        email: data.user.email,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
          data.user.name || 'User',
        )}&background=5a0a8f&color=fff&bold=true`,
      }

      setUser(nextUser)
      localStorage.setItem('stfi.user', JSON.stringify(nextUser))
      return true
    } catch {
      return false
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('stfi.user')
    setAuthToken(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
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
