import type { AppRoute } from '../components/shell/SidebarNav'

const PUBLIC_SITE_ROUTES: AppRoute[] = [
  'accueil',
  'mentions-legales',
  'confidentialite',
]

export function isPublicSiteRoute(route: AppRoute): boolean {
  return PUBLIC_SITE_ROUTES.includes(route)
}
