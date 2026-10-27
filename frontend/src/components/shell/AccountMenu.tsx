import { useEffect, useRef, useState } from 'react'

import { PUBLIC_PROFILE_LABELS, type AuthUser } from '../../lib/auth-types'
import type { AppRoute } from './SidebarNav'
import { MaterialIcon } from './MaterialIcon'

type AccountMenuProps = {
  user: AuthUser
  onNavigate: (route: AppRoute) => void
  onLogout: () => void
  variant: 'on-dark' | 'on-light'
  placement?: 'up' | 'down'
  stretch?: boolean
  onNavigated?: () => void
}

export function AccountMenu({
  user,
  onNavigate,
  onLogout,
  variant,
  placement = 'up',
  stretch = true,
  onNavigated,
}: AccountMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const isDark = variant === 'on-dark'
  const initials = user.displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

  useEffect(() => {
    if (!isOpen) return

    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', onPointer)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      window.removeEventListener('keydown', onKey)
    }
  }, [isOpen])

  function go(route: AppRoute) {
    setIsOpen(false)
    onNavigate(route)
    onNavigated?.()
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={`flex items-center gap-2 rounded-xl px-2 py-2 text-left transition-colors ${
          stretch ? 'w-full' : ''
        } ${
          isDark
            ? 'text-surface hover:bg-white/10'
            : 'text-on-surface hover:bg-surface-container'
        }`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-label text-label-sm font-semibold ${
            isDark ? 'bg-surface text-primary' : 'bg-primary text-surface'
          }`}
        >
          {initials || 'N'}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-label text-label-md font-semibold">
            {user.displayName}
          </span>
          <span
            className={`block truncate font-label text-label-sm ${
              isDark ? 'text-surface/70' : 'text-on-surface-variant'
            }`}
          >
            {PUBLIC_PROFILE_LABELS[user.publicProfile]}
          </span>
        </span>
        <MaterialIcon
          name={isOpen ? 'expand_more' : 'more_horiz'}
          className="text-[20px]"
        />
      </button>

      {isOpen ? (
        <div
          role="menu"
          className={`absolute z-50 overflow-hidden rounded-xl bg-surface-container-lowest py-1 shadow-lg ring-1 ring-outline-variant/30 ${
            placement === 'up'
              ? 'bottom-full left-0 right-0 mb-2'
              : 'right-0 top-full mt-2 w-56'
          }`}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => go('profil')}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left font-label text-label-md text-on-surface hover:bg-surface-container"
          >
            <MaterialIcon name="person" className="text-[18px] text-primary" />
            Profil
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => go('parametres')}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left font-label text-label-md text-on-surface hover:bg-surface-container"
          >
            <MaterialIcon name="settings" className="text-[18px] text-primary" />
            Paramètres
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setIsOpen(false)
              onLogout()
            }}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left font-label text-label-md text-on-surface hover:bg-surface-container"
          >
            <MaterialIcon name="logout" className="text-[18px] text-primary" />
            Se déconnecter
          </button>
        </div>
      ) : null}
    </div>
  )
}
