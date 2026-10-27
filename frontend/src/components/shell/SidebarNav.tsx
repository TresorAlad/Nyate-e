import type { AuthUser, UserRole } from '../../lib/auth-types'
import { canAccessRoute } from '../../lib/auth-session'
import { NyatefeLogoMark } from '../NyatefeLogoMark'
import { AccountMenu } from './AccountMenu'
import { MaterialIcon } from './MaterialIcon'

export type AppRoute =
  | 'accueil'
  | 'mentions-legales'
  | 'confidentialite'
  | 'dashboard'
  | 'assistant'
  | 'bibliotheque'
  | 'redaction'
  | 'ingest'
  | 'profil'
  | 'parametres'

type NavItem = {
  id: AppRoute
  label: string
  icon: string
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Accueil', icon: 'home' },
  { id: 'assistant', label: 'Assistant', icon: 'psychology' },
  { id: 'bibliotheque', label: 'Bibliothèque', icon: 'menu_book' },
  { id: 'redaction', label: 'Rédaction assistée', icon: 'edit_document' },
  { id: 'ingest', label: 'Textes officiels', icon: 'upload_file' },
]

type SidebarNavProps = {
  active: AppRoute
  role: UserRole
  user: AuthUser
  onNavigate: (route: AppRoute) => void
  onLogout: () => void
  onClose?: () => void
}

export function SidebarNav({
  active,
  role,
  user,
  onNavigate,
  onLogout,
  onClose,
}: SidebarNavProps) {
  const visibleItems = NAV_ITEMS.filter((item) => canAccessRoute(role, item.id))

  function handleNav(route: AppRoute) {
    onNavigate(route)
    onClose?.()
  }

  return (
    <aside className="flex h-full w-72 flex-col bg-surface-container-low pb-6 pt-5 shadow-[0_1px_8px_rgba(0,0,0,0.06)]">
      <div className="mb-space-md flex items-center justify-between gap-space-sm px-space-md">
        <button
          type="button"
          onClick={() => handleNav('dashboard')}
          className="flex min-w-0 items-center gap-space-sm text-left"
        >
          <NyatefeLogoMark
            boxClassName="flex items-center justify-center rounded-xl bg-primary shadow-sm"
            iconClassName="text-[22px] text-surface"
          />
          <div className="flex min-w-0 flex-col">
            <span className="font-headline text-headline-sm leading-tight text-primary">
              Nyateƒe
            </span>
            <span className="font-label text-label-sm leading-none text-secondary">
              Droit togolais
            </span>
          </div>
        </button>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container lg:hidden"
            aria-label="Fermer le menu"
          >
            <MaterialIcon name="close" className="text-[22px]" />
          </button>
        ) : null}
      </div>

      <nav className="flex-1 space-y-1 px-space-sm">
        {visibleItems.map((item) => {
          const isActive = active === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNav(item.id)}
              className={`flex w-full items-center gap-space-sm rounded-xl px-space-sm py-2.5 text-left transition-all duration-200 ${
                isActive
                  ? 'bg-primary-container font-semibold text-surface shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <MaterialIcon name={item.icon} className="text-[20px]" />
              <span className="font-label text-label-md">{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="border-t border-outline-variant/30 px-2 pt-2">
        <AccountMenu
          user={user}
          variant="on-light"
          onNavigate={onNavigate}
          onLogout={onLogout}
          onNavigated={onClose}
        />
      </div>
    </aside>
  )
}
