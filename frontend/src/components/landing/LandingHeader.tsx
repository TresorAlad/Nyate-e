import { useEffect, useState } from 'react'

import type { AuthUser, PublicProfile } from '../../lib/auth-types'
import { MaterialIcon } from '../shell/MaterialIcon'
import type { AppRoute } from '../shell/SidebarNav'

type LandingHeaderProps = {
  user: AuthUser | null
  onNavigate: (route: AppRoute) => void
  onOpenAuth: (
    mode: 'login' | 'signup',
    redirect?: AppRoute,
    initialPublicProfile?: PublicProfile,
  ) => void
}

const NAV_LINKS: { route: AppRoute; label: string; icon: string }[] = [
  { route: 'accueil', label: 'Accueil', icon: 'home' },
  { route: 'assistant', label: 'Assistant', icon: 'psychology' },
  { route: 'bibliotheque', label: 'Bibliothèque', icon: 'menu_book' },
]

export function LandingHeader({ user, onNavigate, onOpenAuth }: LandingHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    function onScroll() {
      const doc = document.documentElement
      const max = doc.scrollHeight - doc.clientHeight
      setIsScrolled(doc.scrollTop > 16)
      setScrollProgress(max > 0 ? Math.min(doc.scrollTop / max, 1) : 0)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function handleNav(route: AppRoute) {
    setMobileOpen(false)
    onNavigate(route)
  }

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 bg-primary/95 backdrop-blur-md transition-shadow duration-300 ${
        isScrolled ? 'shadow-[0_8px_28px_rgba(66,12,20,0.22)]' : 'shadow-[0_4px_20px_rgba(66,12,20,0.12)]'
      }`}
    >
      <div
        className="absolute left-0 top-0 h-0.5 bg-primary-fixed-dim transition-[width] duration-150"
        style={{ width: `${scrollProgress * 100}%` }}
        aria-hidden
      />
      <div
        className={`flex w-full items-center justify-between gap-4 px-margin transition-[height] duration-300 ${
          isScrolled ? 'h-16' : 'h-20'
        }`}
      >
        <div className="flex min-w-0 items-center gap-space-md">
          <button
            type="button"
            onClick={() => handleNav('accueil')}
            className="flex shrink-0 items-center gap-space-sm text-left"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container shadow-sm transition-transform duration-500 hover:rotate-12">
              <MaterialIcon name="balance" className="text-[24px] text-primary" />
            </div>
            <div className="hidden flex-col sm:flex">
              <span className="font-headline text-headline-sm leading-none tracking-wide text-surface">
                Nyateƒe
              </span>
              <span className="mt-0.5 font-label text-label-sm uppercase tracking-wider text-primary-fixed-dim">
                Droit togolais
              </span>
            </div>
          </button>
          <div className="hidden items-center gap-1.5 rounded-full bg-primary-container px-space-sm py-1.5 xl:flex">
            <MaterialIcon name="gavel" className="text-[18px] text-tertiary-fixed" />
            <span className="font-label text-label-sm text-surface">
              République togolaise
            </span>
          </div>
        </div>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map(({ route, label, icon }) => {
            const isAccueil = route === 'accueil'
            return (
              <button
                key={route}
                type="button"
                onClick={() => handleNav(route)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 font-label text-label-md transition-all duration-200 ${
                  isAccueil
                    ? 'bg-primary-container font-semibold text-surface shadow-sm'
                    : 'text-primary-fixed-dim hover:bg-primary-container/40 hover:text-surface'
                }`}
              >
                <MaterialIcon name={icon} className="text-[20px]" />
                {label}
              </button>
            )
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-surface transition-colors hover:bg-primary-container/50 lg:hidden"
            aria-expanded={mobileOpen}
            aria-label="Menu"
          >
            <MaterialIcon name={mobileOpen ? 'close' : 'menu'} className="text-[26px]" />
          </button>

          {user ? (
            <button
              type="button"
              onClick={() => handleNav('dashboard')}
              className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2.5 font-label text-label-md text-primary shadow-sm transition-all duration-200 hover:bg-surface-variant sm:px-space-md"
            >
              <MaterialIcon name="dashboard" className="text-[20px]" />
              <span className="hidden sm:inline">Mon tableau de bord</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onOpenAuth('login', 'dashboard')}
                className="hidden items-center gap-1.5 rounded-lg px-3 py-2.5 font-label text-label-md text-surface transition-colors hover:bg-primary-container/50 sm:flex"
              >
                <MaterialIcon name="login" className="text-[20px]" />
                Se connecter
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth('signup', 'dashboard')}
                className="flex items-center gap-1.5 rounded-lg bg-surface px-3 py-2.5 font-label text-label-md text-primary shadow-sm transition-all duration-200 hover:bg-surface-variant sm:px-4"
              >
                <MaterialIcon name="person_add" className="text-[20px]" />
                <span>S&apos;inscrire</span>
              </button>
            </>
          )}
        </div>
      </div>

      {mobileOpen ? (
        <div className="border-t border-primary-container/30 bg-primary px-margin py-space-md lg:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map(({ route, label, icon }) => (
              <button
                key={route}
                type="button"
                onClick={() => handleNav(route)}
                className="flex items-center gap-3 rounded-lg px-3 py-3 font-label text-label-md text-surface transition-colors hover:bg-primary-container/50"
              >
                <MaterialIcon name={icon} className="text-[22px] text-primary-fixed-dim" />
                {label}
              </button>
            ))}
            {!user ? (
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false)
                  onOpenAuth('login', 'dashboard')
                }}
                className="mt-2 flex items-center gap-3 rounded-lg border border-surface/20 px-3 py-3 font-label text-label-md text-surface"
              >
                <MaterialIcon name="login" className="text-[22px]" />
                Se connecter
              </button>
            ) : null}
          </nav>
        </div>
      ) : null}
    </header>
  )
}
