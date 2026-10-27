import { useEffect, useState, type ReactNode } from 'react'

import type { AuthUser } from '../../lib/auth-types'
import { SidebarNav, type AppRoute } from './SidebarNav'
import { TopHeader } from './TopHeader'

type AppShellProps = {
  route: AppRoute
  user: AuthUser
  onNavigate: (route: AppRoute) => void
  onLogout: () => void
  headerBadge?: string
  children: ReactNode
}

export function AppShell({
  route,
  user,
  onNavigate,
  onLogout,
  headerBadge,
  children,
}: AppShellProps) {
  const [isNavOpen, setIsNavOpen] = useState(false)

  useEffect(() => {
    setIsNavOpen(false)
  }, [route])

  useEffect(() => {
    if (!isNavOpen) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsNavOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isNavOpen])

  return (
    <div className="min-h-screen bg-background font-body text-body-md text-on-surface">
      {isNavOpen ? (
        <button
          type="button"
          aria-label="Fermer le menu"
          className="fixed inset-0 z-40 bg-primary/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsNavOpen(false)}
        />
      ) : null}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 transition-transform duration-300 lg:translate-x-0 ${
          isNavOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarNav
          active={route}
          role={user.role}
          user={user}
          onNavigate={onNavigate}
          onLogout={onLogout}
          onClose={() => setIsNavOpen(false)}
        />
      </div>

      <div className="lg:pl-72">
        <TopHeader
          badge={headerBadge}
          user={user}
          onLogout={onLogout}
          onNavigate={onNavigate}
          onOpenMenu={() => setIsNavOpen(true)}
        />
        <main className="relative bg-background pt-16">{children}</main>
      </div>
    </div>
  )
}
