import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  authApi,
  ApiError,
  clearAuthFailed,
  clearToken,
  getToken,
  markAuthFailed,
  type AdminProfile,
} from '@/lib/api'

type AuthContextValue = {
  admin: AdminProfile | null
  loading: boolean
  logout: () => void
  hasPermission: (...codes: string[]) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    if (!getToken()) {
      setLoading(false)
      return
    }
    authApi
      .me()
      .then((profile) => {
        if (!cancelled) {
          if (!profile?.id || !profile?.email) {
            clearToken()
            markAuthFailed()
            setAdmin(null)
            return
          }
          clearAuthFailed()
          setAdmin(profile)
        }
      })
      .catch((error) => {
        if (!cancelled) {
          clearToken()
          markAuthFailed()
          setAdmin(null)
          if (!(error instanceof ApiError && error.status === 401)) {
            console.error('[Auth] Session validation failed:', error)
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const logout = () => {
    clearToken()
    window.location.replace('/st-hq/login.html')
  }

  const hasPermission = (...codes: string[]) => {
    if (!admin?.permissions?.length) return true
    return codes.some((code) => admin.permissions.includes(code))
  }

  return (
    <AuthContext.Provider value={{ admin, loading, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
