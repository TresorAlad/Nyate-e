import { useState } from 'react'

import { Reveal } from '../components/motion/Reveal'
import { MaterialIcon } from '../components/shell/MaterialIcon'
import type { AppRoute } from '../components/shell/SidebarNav'
import { PUBLIC_PROFILE_LABELS, type AuthUser } from '../lib/auth-types'
import { shortcutsForProfile } from '../lib/citizen-shortcuts'
import { setPendingQuestion } from '../lib/pending-question'
import {
  clearRecentQuestions,
  readRecentQuestions,
} from '../lib/recent-questions'

type DashboardViewProps = {
  user: AuthUser
  onNavigate: (route: AppRoute) => void
}

function dashboardHint(user: AuthUser): string {
  if (user.role === 'cabinet' || user.role === 'admin') {
    return 'Consultez la bibliothèque, l\'assistant et la rédaction assistée pour vos dossiers.'
  }
  switch (user.publicProfile) {
    case 'student':
      return 'Retrouvez rapidement un texte, un article ou une règle pour vos travaux.'
    case 'enterprise':
      return 'Orientez-vous sur les questions juridiques du quotidien de votre activité.'
    default:
      return 'Comprenez vos droits et obligations en posant vos questions à l\'assistant.'
  }
}

export function DashboardView({ user, onNavigate }: DashboardViewProps) {
  const [recent, setRecent] = useState(() => readRecentQuestions())
  const shortcuts = shortcutsForProfile(user.publicProfile)
  const canWrite = user.role === 'cabinet' || user.role === 'admin'

  function goToAssistant(question?: string) {
    if (question?.trim()) setPendingQuestion(question)
    onNavigate('assistant')
  }

  function handleClearRecent() {
    clearRecentQuestions()
    setRecent([])
  }

  return (
    <div className="px-margin py-space-lg">
      <Reveal delayMs={0}>
        <div className="flex flex-col justify-between gap-space-md lg:flex-row lg:items-end">
          <div>
            <p className="font-label text-label-sm uppercase tracking-widest text-primary-container">
              Espace {PUBLIC_PROFILE_LABELS[user.publicProfile].toLowerCase()}
            </p>
            <h1 className="font-headline text-headline-lg text-primary">
              Bonjour, {user.displayName}
            </h1>
            <p className="mt-2 max-w-2xl font-body text-body-md text-on-surface-variant">
              {dashboardHint(user)}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => goToAssistant()}
              className="btn-shine inline-flex items-center justify-center gap-2 rounded-xl bg-primary-container px-space-md py-3 font-label text-label-md text-surface shadow-sm transition-colors hover:bg-primary"
            >
              <MaterialIcon name="chat" className="text-[20px]" />
              Poser une question
            </button>
            <button
              type="button"
              onClick={() => onNavigate('bibliotheque')}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-surface-container px-space-md py-3 font-label text-label-md text-primary transition-colors hover:bg-surface-container-high"
            >
              <MaterialIcon name="menu_book" className="text-[20px]" />
              Explorer les textes
            </button>
          </div>
        </div>
      </Reveal>

      <div className="mt-space-lg grid gap-gutter md:grid-cols-3">
        {[
          {
            label: 'Assistant',
            value: 'Questions en langage clair',
            icon: 'forum',
            action: 'Ouvrir l\'assistant',
            onClick: () => goToAssistant(),
          },
          {
            label: 'Bibliothèque',
            value: 'Lois, codes et décrets togolais',
            icon: 'menu_book',
            action: 'Consulter les sources',
            onClick: () => onNavigate('bibliotheque'),
          },
          canWrite
            ? {
                label: 'Rédaction',
                value: 'Préparer un acte ou une note',
                icon: 'edit_document',
                action: 'Ouvrir la rédaction',
                onClick: () => onNavigate('redaction'),
              }
            : {
                label: 'Rappel',
                value: 'Orientation, pas conseil personnalisé',
                icon: 'policy',
                action: 'Lire l\'avertissement',
                onClick: () => {
                  document.getElementById('rappel-deontologie')?.scrollIntoView({
                    behavior: 'smooth',
                  })
                },
              },
        ].map((card, index) => (
          <Reveal key={card.label} delayMs={index * 80}>
            <button
              type="button"
              onClick={card.onClick}
              className="card-lift flex h-full w-full flex-col rounded-2xl bg-surface-container-lowest p-space-lg text-left shadow-sm transition-colors hover:shadow-md"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-container text-primary-container">
                <MaterialIcon name={card.icon} className="text-[22px]" />
              </div>
              <p className="mt-space-sm font-label text-label-sm text-secondary">{card.label}</p>
              <p className="font-headline text-headline-sm text-primary">{card.value}</p>
              <span className="mt-space-md inline-flex items-center gap-1 font-label text-label-md text-primary-container">
                {card.action}
                <MaterialIcon name="arrow_forward" className="text-[16px]" />
              </span>
            </button>
          </Reveal>
        ))}
      </div>

      <Reveal delayMs={120} className="mt-space-xl">
        <div className="flex flex-wrap items-end justify-between gap-space-sm">
          <div>
            <p className="font-label text-label-sm font-semibold uppercase tracking-widest text-primary-container">
              Démarrer vite
            </p>
            <h2 className="font-headline text-headline-sm text-primary">Questions fréquentes</h2>
          </div>
        </div>
        <div className="mt-space-md grid gap-3 sm:grid-cols-2">
          {shortcuts.map((item) => (
            <button
              key={item.title}
              type="button"
              onClick={() => goToAssistant(item.title)}
              className="group flex items-start gap-space-sm rounded-2xl bg-surface-container-lowest p-space-md text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-container text-primary-container">
                <MaterialIcon name={item.icon} className="text-[20px]" />
              </span>
              <span>
                <span className="block font-label text-label-md font-semibold text-primary">
                  {item.title}
                </span>
                <span className="mt-1 block font-body text-body-sm text-on-surface-variant">
                  {item.hint}
                </span>
              </span>
            </button>
          ))}
        </div>
      </Reveal>

      <Reveal delayMs={160} className="mt-space-xl">
        <div className="flex flex-wrap items-center justify-between gap-space-sm">
          <div>
            <p className="font-label text-label-sm font-semibold uppercase tracking-widest text-primary-container">
              Activité
            </p>
            <h2 className="font-headline text-headline-sm text-primary">Consultations récentes</h2>
          </div>
          {recent.length ? (
            <button
              type="button"
              onClick={handleClearRecent}
              className="rounded-lg px-3 py-2 font-label text-label-sm text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
            >
              Effacer l&apos;historique
            </button>
          ) : null}
        </div>

        {recent.length === 0 ? (
          <div className="mt-space-md rounded-2xl bg-surface-container-low p-space-lg">
            <p className="font-body text-body-md text-on-surface-variant">
              Aucune consultation récente pour cette session. Posez une première question
              pour retrouver vos recherches ici.
            </p>
            <button
              type="button"
              onClick={() => goToAssistant()}
              className="mt-space-md inline-flex items-center gap-2 rounded-xl bg-primary-container px-space-md py-2.5 font-label text-label-md text-surface"
            >
              <MaterialIcon name="chat" className="text-[18px]" />
              Commencer une consultation
            </button>
          </div>
        ) : (
          <ul className="mt-space-md space-y-2">
            {recent.map((item) => (
              <li key={`${item.at}-${item.text}`}>
                <button
                  type="button"
                  onClick={() => goToAssistant(item.text)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl bg-surface-container-lowest px-space-md py-3 text-left shadow-sm transition-colors hover:bg-surface-container"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-label text-label-md text-primary">
                      {item.text}
                    </span>
                    <span className="font-label text-label-sm text-on-surface-variant">
                      Reprendre cette question
                    </span>
                  </span>
                  <MaterialIcon name="replay" className="shrink-0 text-[20px] text-primary-container" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Reveal>

      <Reveal delayMs={200} className="mt-space-xl" id="rappel-deontologie">
        <div className="flex flex-col items-start justify-between gap-space-md rounded-2xl bg-primary p-space-lg text-surface lg:flex-row lg:items-center">
          <div className="flex items-start gap-space-sm">
            <MaterialIcon name="policy" className="mt-0.5 text-[28px] text-primary-fixed-dim" />
            <div>
              <p className="font-label text-label-md font-semibold">Indépendance et déontologie</p>
              <p className="mt-1 max-w-2xl font-body text-body-sm text-surface/90">
                Nyateƒe clarifie les textes officiels et affiche les sources. Pour un conseil
                personnalisé ou une représentation, consultez un avocat inscrit au Barreau de Lomé.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => goToAssistant('Quels sont mes droits en droit togolais ?')}
            className="btn-shine shrink-0 rounded-xl bg-surface px-space-md py-2.5 font-label text-label-md text-primary"
          >
            Consulter l&apos;assistant
          </button>
        </div>
      </Reveal>
    </div>
  )
}
