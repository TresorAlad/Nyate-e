import { useCallback, useEffect, useState } from 'react'

import { AuthModal } from './components/auth/AuthModal'
import { ChatPanel } from './components/ChatPanel'
import { IngestPanel } from './components/IngestPanel'
import { AppShell } from './components/shell/AppShell'
import { CitizenShell } from './components/shell/CitizenShell'
import type { AppRoute } from './components/shell/SidebarNav'
import { useAuth } from './context/AuthContext'
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
import { ParametresView } from './views/ParametresView'
import { ProfilView } from './views/ProfilView'
import { RedactionView } from './views/RedactionView'

type AuthModalState = {
  isOpen: boolean
  mode: 'login' | 'signup'
  redirectRoute?: AppRoute
}

function App() {
  const { user, logout } = useAuth()
  const [route, setRoute] = useState<AppRoute>(() => {
    const session = getSessionUser()
    return session ? defaultRouteForRole(session.role) : 'accueil'
  })
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [conversationsTick, setConversationsTick] = useState(0)

  useEffect(() => {
    if (user && route === 'accueil') {
      setRoute(defaultRouteForRole(user.role))
    }
  }, [user, route])
  const [authModal, setAuthModal] = useState<AuthModalState>({
    isOpen: false,
    mode: 'login',
  })

  const openAuth = useCallback(
    (mode: 'login' | 'signup', redirectRoute?: AppRoute) => {
      setAuthModal({ isOpen: true, mode, redirectRoute })
    },
    [],
  )

  const navigate = useCallback(
    (next: AppRoute) => {
      if (isPublicSiteRoute(next)) {
        if (user && next === 'accueil') {
          setRoute(defaultRouteForRole(user.role))
          return
        }
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
    setConversationId(null)
    setRoute('accueil')
  }

  function bumpConversations() {
    setConversationsTick((tick) => tick + 1)
  }

  function handleNewChat() {
    setConversationId(null)
    setRoute('assistant')
  }

  function handleSelectConversation(id: string) {
    setConversationId(id)
    setRoute('assistant')
  }

  function handleHistoryCleared() {
    setConversationId(null)
    bumpConversations()
    setRoute('assistant')
  }

  const authModalElement = (
    <AuthModal
      isOpen={authModal.isOpen}
      mode={authModal.mode}
      redirectRoute={authModal.redirectRoute}
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
        {route === 'accueil' && !user ? (
          <LandingView user={null} onNavigate={navigate} onOpenAuth={openAuth} />
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

  if (user.role === 'citizen') {
    return (
      <>
        <CitizenShell
          route={safeRoute}
          user={user}
          conversationId={conversationId}
          conversationsTick={conversationsTick}
          onNavigate={navigate}
          onLogout={handleLogout}
          onNewChat={handleNewChat}
          onSelectConversation={handleSelectConversation}
          onConversationsChange={bumpConversations}
        >
          {safeRoute === 'assistant' ? (
            <ChatPanel
              key="citizen-assistant"
              variant="gpt"
              conversationId={conversationId}
              onConversationIdChange={setConversationId}
              onConversationsChange={bumpConversations}
            />
          ) : null}
          {safeRoute === 'profil' ? <ProfilView /> : null}
          {safeRoute === 'parametres' ? (
            <ParametresView
              onNavigate={navigate}
              onLogout={handleLogout}
              onHistoryCleared={handleHistoryCleared}
            />
          ) : null}
        </CitizenShell>
        {authModalElement}
      </>
    )
  }

  const headerBadge =
    safeRoute === 'assistant'
      ? 'Assistant juridique · Togo'
      : safeRoute === 'bibliotheque'
        ? 'Bibliothèque · textes officiels'
        : safeRoute === 'redaction'
          ? 'Rédaction assistée'
          : safeRoute === 'ingest'
            ? 'Textes officiels · Togo'
            : safeRoute === 'profil'
              ? 'Profil'
              : safeRoute === 'parametres'
                ? 'Paramètres'
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
          {safeRoute === 'dashboard' ? (
            <DashboardView user={user} onNavigate={navigate} />
          ) : null}
          {safeRoute === 'assistant' ? (
            <ChatPanel
              key="workspace-assistant"
              variant="workspace"
              conversationId={conversationId}
              onConversationIdChange={setConversationId}
              onConversationsChange={bumpConversations}
            />
          ) : null}
          {safeRoute === 'bibliotheque' ? (
            <BibliothequeView onNavigate={navigate} />
          ) : null}
          {safeRoute === 'redaction' ? <RedactionView /> : null}
          {safeRoute === 'profil' ? <ProfilView /> : null}
          {safeRoute === 'parametres' ? (
            <ParametresView
              onNavigate={navigate}
              onLogout={handleLogout}
              onHistoryCleared={handleHistoryCleared}
            />
          ) : null}
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
