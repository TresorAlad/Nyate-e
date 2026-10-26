import type { AppRoute } from '../components/shell/SidebarNav'

import type { AuthUser, PublicProfile, StoredUser, UserRole } from './auth-types'

const USERS_STORAGE_KEY = 'nyatefe_users_v2'
const SESSION_STORAGE_KEY = 'nyatefe_session_v1'

function roleFromPublicProfile(profile: PublicProfile): Exclude<UserRole, 'admin'> {
  return profile === 'jurist' ? 'cabinet' : 'citizen'
}

function readUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY)
    if (!raw) {
      const legacy = localStorage.getItem('nyatefe_users_v1')
      if (!legacy) return []
      const parsed = JSON.parse(legacy) as StoredUser[]
      if (!Array.isArray(parsed)) return []
      const migrated = parsed.map((u) => ({
        ...u,
        publicProfile: (u.publicProfile ??
          (u.role === 'cabinet' || u.role === 'admin'
            ? 'jurist'
            : 'citizen')) as PublicProfile,
      }))
      writeUsers(migrated)
      return migrated
    }
    const parsed = JSON.parse(raw) as StoredUser[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
}

function hashPassword(password: string): string {
  return btoa(unescape(encodeURIComponent(password)))
}

function toPublicUser(user: StoredUser): AuthUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    publicProfile: user.publicProfile,
  }
}

export function getSessionUser(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthUser
    if (!parsed?.email || !parsed?.role) return null
    const exists = readUsers().find((u) => u.id === parsed.id)
    return exists ? toPublicUser(exists) : null
  } catch {
    return null
  }
}

export function setSessionUser(user: AuthUser | null) {
  if (!user) {
    sessionStorage.removeItem(SESSION_STORAGE_KEY)
    return
  }
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user))
}

export function logoutSession() {
  setSessionUser(null)
}

export function loginUser(email: string, password: string): AuthUser {
  const normalizedEmail = email.trim().toLowerCase()
  const users = readUsers()
  const match = users.find((u) => u.email === normalizedEmail)
  if (!match || match.passwordHash !== hashPassword(password)) {
    throw new Error('Identifiants incorrects.')
  }
  const session = toPublicUser(match)
  setSessionUser(session)
  return session
}

export function registerUser(input: {
  email: string
  password: string
  displayName: string
  publicProfile: PublicProfile
}): AuthUser {
  const normalizedEmail = input.email.trim().toLowerCase()
  if (normalizedEmail.length < 5 || !normalizedEmail.includes('@')) {
    throw new Error('Adresse e-mail invalide.')
  }
  if (input.password.length < 8) {
    throw new Error('Le mot de passe doit contenir au moins 8 caractères.')
  }
  const name = input.displayName.trim()
  if (!name) {
    throw new Error('Indiquez votre nom ou celui de votre structure.')
  }

  const users = readUsers()
  if (users.some((u) => u.email === normalizedEmail)) {
    throw new Error('Un compte existe déjà avec cette adresse e-mail.')
  }

  const role = roleFromPublicProfile(input.publicProfile)
  const stored: StoredUser = {
    id: crypto.randomUUID(),
    email: normalizedEmail,
    displayName: name,
    role,
    publicProfile: input.publicProfile,
    passwordHash: hashPassword(input.password),
  }
  writeUsers([...users, stored])
  const session = toPublicUser(stored)
  setSessionUser(session)
  return session
}

export function canAccessRoute(role: UserRole, route: AppRoute): boolean {
  if (
    route === 'accueil' ||
    route === 'mentions-legales' ||
    route === 'confidentialite'
  ) {
    return true
  }
  if (route === 'dashboard' || route === 'assistant') return true
  if (route === 'bibliotheque' || route === 'redaction') {
    return role === 'cabinet' || role === 'admin'
  }
  if (route === 'ingest') return role === 'admin'
  return false
}

export function defaultRouteForRole(role: UserRole): AppRoute {
  if (role === 'admin') return 'dashboard'
  if (role === 'cabinet') return 'dashboard'
  return 'assistant'
}
