import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import type { AuthUser, PublicProfile } from '../lib/auth-types'
import {
  getSessionUser,
  loginUser,
  logoutSession,
  registerUser,
} from '../lib/auth-session'

type AuthContextValue = {
  user: AuthUser | null
  login: (email: string, password: string) => AuthUser
  register: (input: {
    email: string
    password: string
    displayName: string
    publicProfile: PublicProfile
  }) => AuthUser
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getSessionUser())

  const login = useCallback((email: string, password: string) => {
    const session = loginUser(email, password)
    setUser(session)
    return session
  }, [])

  const register = useCallback(
    (input: {
      email: string
      password: string
      displayName: string
      publicProfile: PublicProfile
    }) => {
      const session = registerUser(input)
      setUser(session)
      return session
    },
    [],
  )

  const logout = useCallback(() => {
    logoutSession()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, login, register, logout }),
    [user, login, register, logout],
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
