import type { UserRole } from '../../lib/auth-types'
import { canAccessRoute } from '../../lib/auth-session'
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

type NavItem = {
  id: AppRoute
  label: string
  icon: string
}

const NAV_ITEMS: NavItem[] = [
  { id: 'accueil', label: 'Accueil public', icon: 'home' },
  { id: 'dashboard', label: 'Tableau de bord', icon: 'dashboard' },
  { id: 'assistant', label: 'Assistant juridique', icon: 'neurology' },
  { id: 'bibliotheque', label: 'Bibliothèque juridique', icon: 'menu_book' },
  { id: 'redaction', label: 'Rédaction assistée', icon: 'edit_document' },
  { id: 'ingest', label: 'Textes officiels', icon: 'upload_file' },
]

type SidebarNavProps = {
  active: AppRoute
  role: UserRole
  onNavigate: (route: AppRoute) => void
}

export function SidebarNav({ active, role, onNavigate }: SidebarNavProps) {
  const visibleItems = NAV_ITEMS.filter((item) => canAccessRoute(role, item.id))

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-full w-72 flex-col bg-surface-container-low pb-8 pt-6 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="mb-space-lg flex items-center gap-space-sm px-space-md">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <MaterialIcon name="balance" className="text-[20px] text-surface" />
        </div>
        <div className="flex flex-col">
          <span className="font-headline text-headline-sm leading-tight text-primary">
            Nyateƒe
          </span>
          <span className="font-label text-label-sm leading-none text-secondary">
            Doctrine &amp; pratique
          </span>
        </div>
      </div>

      <div className="mb-space-md px-space-md">
        <div className="flex items-center justify-between rounded-lg bg-surface-container p-space-sm">
          <div className="flex items-center gap-2">
            <MaterialIcon name="flag" className="text-[18px] text-primary" />
            <span className="font-label text-label-sm text-on-surface">Togo · Lomé</span>
          </div>
          <span className="font-label text-label-sm font-semibold text-tertiary">Actif</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-space-sm">
        {visibleItems.map((item) => {
          const isActive = active === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`flex w-full items-center gap-space-sm rounded-lg px-space-sm py-2.5 text-left transition-all ${
                isActive
                  ? 'bg-primary-container font-semibold text-on-primary'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <MaterialIcon name={item.icon} className="text-[20px]" />
              <span className="font-label text-label-md">{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="px-space-md pt-4">
        <p className="rounded-lg bg-primary-container p-space-sm font-body text-body-sm text-surface">
          L&apos;outil oriente. Il ne remplace pas un avocat inscrit au Barreau du Togo.
        </p>
      </div>
    </aside>
  )
}
