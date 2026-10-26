import type { ReactNode } from 'react'

import type { AuthUser, PublicProfile } from '../../lib/auth-types'
import type { AppRoute } from '../shell/SidebarNav'
import { MaterialIcon } from '../shell/MaterialIcon'
import { LandingFooter } from './LandingFooter'
import { LandingHeader } from './LandingHeader'

type PublicPageShellProps = {
  user: AuthUser | null
  pageKey: string
  title: string
  children: ReactNode
  onNavigate: (route: AppRoute) => void
  onOpenAuth: (
    mode: 'login' | 'signup',
    redirect?: AppRoute,
    initialPublicProfile?: PublicProfile,
  ) => void
}

export function PublicPageShell({
  user,
  pageKey,
  title,
  children,
  onNavigate,
  onOpenAuth,
}: PublicPageShellProps) {
  return (
    <div className="min-h-screen bg-background font-body text-body-md text-on-surface">
      <LandingHeader user={user} onNavigate={onNavigate} onOpenAuth={onOpenAuth} />

      <main className="w-full bg-background pt-20">
        <div className="page-enter px-margin py-space-lg" key={pageKey}>
          <div className="mx-auto max-w-3xl">
            <button
              type="button"
              onClick={() => onNavigate('accueil')}
              className="mb-space-md inline-flex items-center gap-2 rounded-lg bg-surface-container-high px-3 py-2 font-label text-label-md text-primary transition-all duration-200 hover:bg-primary-container hover:text-surface"
            >
              <MaterialIcon name="arrow_back" className="text-[20px]" />
              Retour à l&apos;accueil
            </button>
            <h1 className="font-headline text-headline-lg text-primary">{title}</h1>
            <div className="mt-space-md space-y-space-md">{children}</div>
          </div>
        </div>
      </main>

      <LandingFooter
        onNavigate={onNavigate}
        onProfilsClick={() => {
          sessionStorage.setItem('nyatefe_scroll_profils', '1')
          onNavigate('accueil')
        }}
      />
    </div>
  )
}
