import type { ReactNode } from 'react'

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
  return (
    <div className="min-h-screen bg-background font-body text-body-md text-on-surface">
      <SidebarNav active={route} role={user.role} onNavigate={onNavigate} />
      <div className="pl-72">
        <TopHeader badge={headerBadge} user={user} onLogout={onLogout} />
        <main className="relative bg-background pt-20">{children}</main>
      </div>
    </div>
  )
}
