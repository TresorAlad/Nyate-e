import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import type { AuthUser, PublicProfile } from '../lib/auth-types'
import {
  apiLogin,
  apiRegister,
  apiUpdateProfile,
  clearAuthSession,
  fetchCurrentUser,
  getAuthToken,
  getCachedUser,
} from '../lib/auth-api'

type ProfileUpdateInput = {
  displayName?: string
  email?: string
  publicProfile?: PublicProfile
  currentPassword?: string
  newPassword?: string
}

type AuthContextValue = {
  user: AuthUser | null
  isBootstrapping: boolean
  login: (email: string, password: string) => Promise<AuthUser>
  register: (input: {
    firstName: string
    lastName: string
    email: string
    password: string
    passwordConfirm: string
  }) => Promise<AuthUser>
  updateProfile: (input: ProfileUpdateInput) => Promise<AuthUser>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getCachedUser())
  const [isBootstrapping, setIsBootstrapping] = useState(() => Boolean(getAuthToken()))

  useEffect(() => {
    const token = getAuthToken()
    if (!token) {
      setIsBootstrapping(false)
      return
    }

    let cancelled = false

    async function bootstrap() {
      try {
        const sessionUser = await fetchCurrentUser()
        if (!cancelled) setUser(sessionUser)
      } catch {
        clearAuthSession()
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setIsBootstrapping(false)
      }
    }

    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiLogin(email, password)
    setUser(data.user)
    return data.user
  }, [])

  const register = useCallback(
    async (input: {
      firstName: string
      lastName: string
      email: string
      password: string
      passwordConfirm: string
    }) => {
      const data = await apiRegister(input)
      setUser(data.user)
      return data.user
    },
    [],
  )

  const updateProfile = useCallback(async (input: ProfileUpdateInput) => {
    const session = await apiUpdateProfile(input)
    setUser(session)
    return session
  }, [])

  const logout = useCallback(() => {
    clearAuthSession()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, isBootstrapping, login, register, updateProfile, logout }),
    [user, isBootstrapping, login, register, updateProfile, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth doit être utilisé dans AuthProvider.')
  }
  return ctx
}
