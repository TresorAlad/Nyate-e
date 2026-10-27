import { useState } from 'react'

import { MaterialIcon } from '../components/shell/MaterialIcon'
import type { AppRoute } from '../components/shell/SidebarNav'
import { useAuth } from '../context/AuthContext'
import { clearConversations } from '../lib/conversations'
import { clearRecentQuestions } from '../lib/recent-questions'

type ParametresViewProps = {
  onNavigate: (route: AppRoute) => void
  onLogout: () => void
  onHistoryCleared?: () => void
}

export function ParametresView({
  onNavigate,
  onLogout,
  onHistoryCleared,
}: ParametresViewProps) {
  const { user } = useAuth()
  const [cleared, setCleared] = useState(false)

  function handleClearHistory() {
    if (!user) return
    const confirmed = window.confirm(
      'Supprimer tout l\'historique des conversations de cet appareil ?',
    )
    if (!confirmed) return
    clearConversations(user.id)
    clearRecentQuestions()
    setCleared(true)
    onHistoryCleared?.()
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:px-6">
      <p className="font-label text-label-sm uppercase tracking-wider text-secondary">
        Compte
      </p>
      <h2 className="mt-1 font-headline text-headline-md text-primary">
        Paramètres
      </h2>
      <p className="mt-2 font-body text-body-md text-on-surface-variant">
        Gérez l&apos;historique local et les informations légales de Nyateƒe.
      </p>

      <section className="mt-8 rounded-2xl bg-surface-container-lowest p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <MaterialIcon name="history" className="mt-0.5 text-[22px] text-primary" />
          <div className="min-w-0 flex-1">
            <h3 className="font-label text-label-md font-semibold text-on-surface">
              Historique des conversations
            </h3>
            <p className="mt-1 font-body text-body-sm text-on-surface-variant">
              Les échanges sont stockés sur cet appareil uniquement. Les supprimer
              n&apos;efface pas votre compte.
            </p>
            <button
              type="button"
              onClick={handleClearHistory}
              className="mt-3 inline-flex items-center gap-1 rounded-lg bg-surface-container px-3 py-2 font-label text-label-sm text-primary hover:bg-surface-container-high"
            >
              <MaterialIcon name="delete" className="text-[16px]" />
              Effacer l&apos;historique
            </button>
            {cleared ? (
              <p className="mt-2 font-body text-body-sm text-tertiary">
                Historique effacé sur cet appareil.
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-2xl bg-surface-container-lowest p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <MaterialIcon name="policy" className="mt-0.5 text-[22px] text-primary" />
          <div>
            <h3 className="font-label text-label-md font-semibold text-on-surface">
              À propos des réponses
            </h3>
            <p className="mt-1 font-body text-body-sm leading-relaxed text-on-surface-variant">
              Nyateƒe oriente à partir de textes officiels togolais. Il peut se
              tromper. Vérifiez les sources et consultez un professionnel du droit
              pour une situation concrète.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-4 overflow-hidden rounded-2xl bg-surface-container-lowest shadow-sm">
        <button
          type="button"
          onClick={() => onNavigate('mentions-legales')}
          className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-surface-container-low"
        >
          <span className="inline-flex items-center gap-2 font-label text-label-md text-on-surface">
            <MaterialIcon name="gavel" className="text-[18px] text-primary" />
            Mentions légales
          </span>
          <MaterialIcon name="chevron_right" className="text-[20px] text-outline" />
        </button>
        <div className="h-px bg-outline-variant/30" />
        <button
          type="button"
          onClick={() => onNavigate('confidentialite')}
          className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-surface-container-low"
        >
          <span className="inline-flex items-center gap-2 font-label text-label-md text-on-surface">
            <MaterialIcon name="lock" className="text-[18px] text-primary" />
            Confidentialité
          </span>
          <MaterialIcon name="chevron_right" className="text-[20px] text-outline" />
        </button>
      </section>

      <button
        type="button"
        onClick={onLogout}
        className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-surface-container py-3 font-label text-label-md text-primary hover:bg-surface-container-high"
      >
        <MaterialIcon name="logout" className="text-[18px]" />
        Se déconnecter
      </button>
    </div>
  )
}
