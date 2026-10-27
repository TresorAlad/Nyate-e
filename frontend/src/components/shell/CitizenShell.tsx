import { useEffect, useMemo, useState, type ReactNode } from 'react'

import type { AuthUser } from '../../lib/auth-types'
import {
  deleteConversationRemote,
  fetchConversationSummaries,
  type ConversationSummary,
} from '../../lib/conversations-api'
import { conversationGroupLabel } from '../../lib/conversations'
import { NyatefeLogoMark } from '../NyatefeLogoMark'
import { AccountMenu } from './AccountMenu'
import { MaterialIcon } from './MaterialIcon'
import { HideChatSourcesContext } from '../../context/ChatExperienceContext'
import type { AppRoute } from './SidebarNav'

type CitizenShellProps = {
  route: AppRoute
  user: AuthUser
  conversationId: string | null
  conversationsTick: number
  onNavigate: (route: AppRoute) => void
  onLogout: () => void
  onNewChat: () => void
  onSelectConversation: (id: string) => void
  onConversationsChange: () => void
  children: ReactNode
}

const PAGE_TITLES: Partial<Record<AppRoute, string>> = {
  assistant: 'Nyateƒe',
  profil: 'Profil',
  parametres: 'Paramètres',
}

export function CitizenShell({
  route,
  user,
  conversationId,
  conversationsTick,
  onNavigate,
  onLogout,
  onNewChat,
  onSelectConversation,
  onConversationsChange,
  children,
}: CitizenShellProps) {
  const [isNavOpen, setIsNavOpen] = useState(false)
  const [conversations, setConversations] = useState<ConversationSummary[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const items = await fetchConversationSummaries()
        if (!cancelled) setConversations(items)
      } catch {
        if (!cancelled) setConversations([])
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [user.id, conversationsTick])

  useEffect(() => {
    setIsNavOpen(false)
  }, [route, conversationId])

  useEffect(() => {
    if (!isNavOpen) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsNavOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isNavOpen])

  const activeConversation = conversations.find((item) => item.id === conversationId)
  const headerTitle =
    route === 'assistant'
      ? (activeConversation?.title ?? 'Nouvelle conversation')
      : (PAGE_TITLES[route] ?? 'Nyateƒe')

  const grouped = useMemo(() => {
    const groups: { label: string; items: typeof conversations }[] = []
    for (const item of conversations) {
      const label = conversationGroupLabel(item.updatedAt)
      const last = groups[groups.length - 1]
      if (last?.label === label) last.items.push(item)
      else groups.push({ label, items: [item] })
    }
    return groups
  }, [conversations])

  function handleNewChat() {
    onNewChat()
    setIsNavOpen(false)
  }

  function handleDelete(id: string) {
    void deleteConversationRemote(id)
      .catch(() => undefined)
      .finally(() => {
        if (conversationId === id) onNewChat()
        onConversationsChange()
      })
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-background font-body text-body-md text-on-surface">
      {isNavOpen ? (
        <button
          type="button"
          aria-label="Fermer le menu"
          className="fixed inset-0 z-40 bg-primary/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsNavOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-primary text-surface transition-transform duration-300 lg:static lg:translate-x-0 ${
          isNavOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-3 pt-4">
          <button
            type="button"
            onClick={handleNewChat}
            className="flex min-w-0 items-center gap-2 px-1 text-left"
          >
            <NyatefeLogoMark
              className="h-8 w-8"
              boxClassName="flex items-center justify-center rounded-lg bg-surface/15"
              iconClassName="text-[18px] text-surface"
            />
            <span className="font-headline text-headline-sm text-surface">Nyateƒe</span>
          </button>
          <button
            type="button"
            onClick={() => setIsNavOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-surface/80 hover:bg-white/10 lg:hidden"
            aria-label="Fermer le menu"
          >
            <MaterialIcon name="close" className="text-[20px]" />
          </button>
        </div>

        <div className="px-3 pt-4">
          <button
            type="button"
            onClick={handleNewChat}
            className="flex w-full items-center gap-2 rounded-xl bg-surface/10 px-3 py-2.5 font-label text-label-md text-surface transition-colors hover:bg-surface/15"
          >
            <MaterialIcon name="edit_square" className="text-[18px]" />
            Nouvelle conversation
          </button>
        </div>

        <nav className="mt-4 flex-1 space-y-4 overflow-y-auto px-2 pb-3">
          {grouped.length === 0 ? (
            <p className="px-3 pt-2 font-body text-body-sm text-surface/55">
              Vos conversations apparaîtront ici.
            </p>
          ) : (
            grouped.map((group) => (
              <div key={group.label}>
                <p className="px-3 pb-1 font-label text-label-sm uppercase tracking-wide text-surface/50">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive =
                      route === 'assistant' && conversationId === item.id
                    return (
                      <div
                        key={item.id}
                        className={`group flex items-center rounded-lg ${
                          isActive ? 'bg-surface/15' : 'hover:bg-white/10'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => onSelectConversation(item.id)}
                          className="min-w-0 flex-1 truncate px-3 py-2 text-left font-label text-label-sm text-surface"
                        >
                          {item.title}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className={`mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-surface/70 hover:bg-white/10 ${
                            isActive
                              ? 'opacity-100'
                              : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'
                          }`}
                          aria-label="Supprimer la conversation"
                        >
                          <MaterialIcon name="delete" className="text-[16px]" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </nav>

        <div className="border-t border-white/10 p-2">
          <AccountMenu
            user={user}
            variant="on-dark"
            onNavigate={onNavigate}
            onLogout={onLogout}
            onNavigated={() => setIsNavOpen(false)}
          />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center justify-between gap-2 px-2 sm:px-4">
          <div className="flex min-w-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setIsNavOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-primary hover:bg-surface-container lg:hidden"
              aria-label="Ouvrir le menu"
            >
              <MaterialIcon name="menu" className="text-[22px]" />
            </button>
            <h1 className="truncate font-headline text-headline-sm text-primary">
              {headerTitle}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('parametres')}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
            aria-label="Paramètres"
          >
            <MaterialIcon name="settings" className="text-[22px]" />
          </button>
        </header>

        <main
          className={`relative min-h-0 flex-1 ${
            route === 'assistant' ? 'overflow-hidden' : 'overflow-y-auto'
          }`}
        >
          <HideChatSourcesContext.Provider value={true}>
            {children}
          </HideChatSourcesContext.Provider>
        </main>
      </div>
    </div>
  )
}
