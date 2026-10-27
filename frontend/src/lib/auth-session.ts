import type { AppRoute } from '../components/shell/SidebarNav'

import type { AuthUser, UserRole } from './auth-types'
import { getCachedUser } from './auth-api'

export function getSessionUser(): AuthUser | null {
  return getCachedUser()
}

export function canAccessRoute(role: UserRole, route: AppRoute): boolean {
  if (
    route === 'accueil' ||
    route === 'mentions-legales' ||
    route === 'confidentialite'
  ) {
    return true
  }
  if (route === 'profil' || route === 'parametres') {
    return true
  }
  if (route === 'assistant') {
    return true
  }
  if (route === 'bibliotheque') {
    return role === 'cabinet' || role === 'admin'
  }
  if (route === 'dashboard') {
    return role !== 'citizen'
  }
  if (route === 'redaction') {
    return role === 'cabinet' || role === 'admin'
  }
  if (route === 'ingest') return role === 'admin'
  return false
}

export function defaultRouteForRole(role: UserRole): AppRoute {
  return role === 'citizen' ? 'assistant' : 'dashboard'
}
