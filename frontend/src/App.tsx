import { useCallback, useState } from 'react'

import { AuthModal } from './components/auth/AuthModal'
import { ChatPanel } from './components/ChatPanel'
import { IngestPanel } from './components/IngestPanel'
import { AppShell } from './components/shell/AppShell'
import type { AppRoute } from './components/shell/SidebarNav'
import { useAuth } from './context/AuthContext'
import type { PublicProfile } from './lib/auth-types'
import {
  canAccessRoute,
  defaultRouteForRole,
  getSessionUser,
} from './lib/auth-session'
import { isPublicSiteRoute } from './lib/site-routes'
import { BibliothequeView } from './views/BibliothequeView'
import { ConfidentialiteView } from './views/ConfidentialiteView'
import { DashboardView } from './views/DashboardView'
import { LandingView } from './views/LandingView'
import { MentionsLegalesView } from './views/MentionsLegalesView'
import { RedactionView } from './views/RedactionView'

type AuthModalState = {
  isOpen: boolean
  mode: 'login' | 'signup'
  redirectRoute?: AppRoute
  initialPublicProfile?: PublicProfile
}

function App() {
  const { user, logout } = useAuth()
  const [route, setRoute] = useState<AppRoute>('accueil')
  const [authModal, setAuthModal] = useState<AuthModalState>({
    isOpen: false,
    mode: 'login',
  })

  const openAuth = useCallback(
    (
      mode: 'login' | 'signup',
      redirectRoute?: AppRoute,
      initialPublicProfile?: PublicProfile,
    ) => {
      setAuthModal({ isOpen: true, mode, redirectRoute, initialPublicProfile })
    },
    [],
  )

  const navigate = useCallback(
    (next: AppRoute) => {
      if (isPublicSiteRoute(next)) {
        setRoute(next)
        return
      }

      if (!user) {
        openAuth('login', next)
        return
      }

      if (!canAccessRoute(user.role, next)) {
        setRoute(defaultRouteForRole(user.role))
        return
      }

      setRoute(next)
    },
    [user, openAuth],
  )

  function handleAuthSuccess(target: AppRoute) {
    const session = getSessionUser()
    if (!session) return
    const resolved = canAccessRoute(session.role, target)
      ? target
      : defaultRouteForRole(session.role)
    setRoute(resolved)
  }

  function handleLogout() {
    logout()
    setRoute('accueil')
  }

  const authModalElement = (
    <AuthModal
      isOpen={authModal.isOpen}
      mode={authModal.mode}
      redirectRoute={authModal.redirectRoute}
      initialPublicProfile={authModal.initialPublicProfile}
      onClose={() => setAuthModal((prev) => ({ ...prev, isOpen: false }))}
      onSuccess={(target) => {
        setAuthModal((prev) => ({ ...prev, isOpen: false }))
        handleAuthSuccess(target)
      }}
      onSwitchMode={(mode) => setAuthModal((prev) => ({ ...prev, mode }))}
    />
  )

  if (isPublicSiteRoute(route)) {
    return (
      <>
        {route === 'accueil' ? (
          <LandingView user={user} onNavigate={navigate} onOpenAuth={openAuth} />
        ) : null}
        {route === 'mentions-legales' ? (
          <MentionsLegalesView
            user={user}
            onNavigate={navigate}
            onOpenAuth={openAuth}
          />
        ) : null}
        {route === 'confidentialite' ? (
          <ConfidentialiteView
            user={user}
            onNavigate={navigate}
            onOpenAuth={openAuth}
          />
        ) : null}
        {authModalElement}
      </>
    )
  }

  if (!user) {
    return (
      <>
        <LandingView user={null} onNavigate={navigate} onOpenAuth={openAuth} />
        {authModalElement}
      </>
    )
  }

  const safeRoute = canAccessRoute(user.role, route)
    ? route
    : defaultRouteForRole(user.role)

  const headerBadge =
    safeRoute === 'assistant'
      ? 'Assistant juridique · Togo'
      : safeRoute === 'bibliotheque'
        ? 'Bibliothèque · textes officiels'
        : safeRoute === 'redaction'
          ? 'Rédaction assistée'
          : safeRoute === 'ingest'
            ? 'Textes officiels · Togo'
            : 'Tableau de bord · Nyateƒe'

  return (
    <>
      <AppShell
        route={safeRoute}
        user={user}
        onNavigate={navigate}
        onLogout={handleLogout}
        headerBadge={headerBadge}
      >
        <div key={safeRoute} className="route-enter">
          {safeRoute === 'dashboard' ? <DashboardView user={user} /> : null}
          {safeRoute === 'assistant' ? <ChatPanel /> : null}
          {safeRoute === 'bibliotheque' ? <BibliothequeView /> : null}
          {safeRoute === 'redaction' ? <RedactionView /> : null}
          {safeRoute === 'ingest' ? (
            <div className="px-margin py-space-lg">
              <IngestPanel />
            </div>
          ) : null}
        </div>
      </AppShell>
      {authModalElement}
    </>
  )
}

export default App
