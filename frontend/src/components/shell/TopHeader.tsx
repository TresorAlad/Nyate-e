import type { AuthUser } from '../../lib/auth-types'
import { AccountMenu } from './AccountMenu'
import type { AppRoute } from './SidebarNav'
import { MaterialIcon } from './MaterialIcon'

type TopHeaderProps = {
  badge?: string
  user: AuthUser
  onLogout: () => void
  onNavigate: (route: AppRoute) => void
  onOpenMenu: () => void
}

export function TopHeader({
  badge = 'Lois et décrets applicables (Togo)',
  user,
  onLogout,
  onNavigate,
  onOpenMenu,
}: TopHeaderProps) {
  return (
    <header className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between gap-3 bg-primary px-space-sm shadow-[0_4px_20px_rgba(66,12,20,0.12)] lg:left-72 lg:px-space-lg">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={onOpenMenu}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-surface transition-colors hover:bg-primary-container/50 lg:hidden"
          aria-label="Ouvrir le menu"
        >
          <MaterialIcon name="menu" className="text-[24px]" />
        </button>
        <div className="hidden min-w-0 items-center gap-2 rounded-full bg-primary-container px-space-sm py-1.5 text-surface sm:flex">
          <MaterialIcon name="balance" className="text-[16px] text-tertiary-fixed" />
          <span className="truncate font-label text-label-sm">{badge}</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => onNavigate('parametres')}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-surface/80 transition-colors hover:bg-white/10 hover:text-surface"
          aria-label="Paramètres"
        >
          <MaterialIcon name="settings" className="text-[22px]" />
        </button>
        <AccountMenu
          user={user}
          variant="on-dark"
          placement="down"
          stretch={false}
          onNavigate={onNavigate}
          onLogout={onLogout}
        />
      </div>
    </header>
  )
}
