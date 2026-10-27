import type { AuthUser, PublicProfile } from './auth-types'

const API_BASE = '/api'

const TOKEN_KEY = 'nyatefe_auth_token_v1'
const USER_KEY = 'nyatefe_session_v1'

type AuthPayload = {
  token: string
  user: AuthUser
}

async function parseJson<T>(response: Response): Promise<T> {
  const data = await response.json()
  if (!response.ok) {
    const message =
      typeof data?.error === 'string' ? data.error : 'Une erreur est survenue.'
    throw new Error(message)
  }
  return data as T
}

export function getAuthToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function getCachedUser(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(USER_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthUser
    if (!parsed?.id || !parsed?.email) return null
    return parsed
  } catch {
    return null
  }
}

export function persistAuthSession(token: string, user: AuthUser) {
  sessionStorage.setItem(TOKEN_KEY, token)
  sessionStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearAuthSession() {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(USER_KEY)
}

async function authFetch(path: string, init: RequestInit = {}) {
  const token = getAuthToken()
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  return fetch(`${API_BASE}${path}`, { ...init, headers })
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const response = await authFetch('/auth/me')
  const data = await parseJson<{ user: AuthUser }>(response)
  const token = getAuthToken()
  if (token) {
    persistAuthSession(token, data.user)
  }
  return data.user
}

export async function apiLogin(email: string, password: string): Promise<AuthPayload> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await parseJson<AuthPayload>(response)
  persistAuthSession(data.token, data.user)
  return data
}

export async function apiRegister(input: {
  firstName: string
  lastName: string
  email: string
  password: string
  passwordConfirm: string
}): Promise<AuthPayload> {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      password: input.password,
      passwordConfirm: input.passwordConfirm,
    }),
  })
  const data = await parseJson<AuthPayload>(response)
  persistAuthSession(data.token, data.user)
  return data
}

export async function apiUpdateProfile(input: {
  displayName?: string
  email?: string
  publicProfile?: PublicProfile
  currentPassword?: string
  newPassword?: string
}): Promise<AuthUser> {
  const response = await authFetch('/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
  const data = await parseJson<{ user: AuthUser }>(response)
  const token = getAuthToken()
  if (token) {
    persistAuthSession(token, data.user)
  }
  return data.user
}
