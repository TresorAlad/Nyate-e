import type { AuthUser } from '../../lib/auth-types'
import { MaterialIcon } from './MaterialIcon'

type TopHeaderProps = {
  badge?: string
  user: AuthUser
  onLogout: () => void
}

export function TopHeader({
  badge = 'Lois & décrets applicables (Togo)',
  user,
  onLogout,
}: TopHeaderProps) {
  return (
    <header className="fixed left-72 right-0 top-0 z-40 flex h-20 items-center justify-between bg-primary px-space-lg shadow-[0_4px_20px_rgba(66,12,20,0.12)]">
      <div className="flex items-center gap-space-md">
        <div className="flex items-center gap-2 rounded-full bg-primary-container px-space-sm py-1.5 text-surface">
          <MaterialIcon name="balance" className="text-[16px] text-tertiary-fixed" />
          <span className="font-label text-label-sm">{badge}</span>
        </div>
      </div>
      <div className="flex items-center gap-space-md">
        <div className="hidden flex-col items-end sm:flex">
          <span className="font-label text-label-md text-surface">{user.displayName}</span>
          <span className="font-label text-label-sm text-tertiary-fixed">Membre Nyateƒe</span>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-1 rounded-lg bg-surface/10 px-3 py-2 font-label text-label-sm text-surface transition-colors hover:bg-surface/20"
        >
          <MaterialIcon name="logout" className="text-[18px]" />
          <span className="hidden md:inline">Déconnexion</span>
        </button>
      </div>
    </header>
  )
}
