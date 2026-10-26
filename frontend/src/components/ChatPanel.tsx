import { useEffect, useState, type FormEvent } from 'react'

import { fetchQueueStatus, sendChat, type ChatResponse } from '../lib/api'
import { consumePendingQuestion } from '../lib/pending-question'
import { MaterialIcon } from './shell/MaterialIcon'
import { SourceList } from './SourceList'

const SUGGESTED_QUERIES = [
  {
    icon: 'home_work',
    title: 'Hausse de loyer sans préavis',
    hint: 'Baux d\'habitation au Togo',
  },
  {
    icon: 'corporate_fare',
    title: 'Créer une SARL à Lomé',
    hint: 'Formalités et OHADA',
  },
  {
    icon: 'badge',
    title: 'Période d\'essai Code du travail',
    hint: 'Licenciement et préavis',
  },
]

export function ChatPanel() {
  const [question, setQuestion] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ChatResponse | null>(null)
  const [queueWaiting, setQueueWaiting] = useState(0)

  async function submitQuestion(text: string) {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return

    setQuestion(trimmed)
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await sendChat(trimmed)
      setResult(response)
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Impossible de générer une réponse.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const pending = consumePendingQuestion()
    if (pending) {
      setQuestion(pending)
      void submitQuestion(pending)
    }
  }, [])

  useEffect(() => {
    if (!isLoading) {
      setQueueWaiting(0)
      return
    }

    let cancelled = false

    async function pollQueue() {
      try {
        const status = await fetchQueueStatus()
        if (!cancelled) setQueueWaiting(status.waiting + status.active)
      } catch {
        if (!cancelled) setQueueWaiting(0)
      }
    }

    pollQueue()
    const timer = window.setInterval(pollQueue, 2500)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [isLoading])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    await submitQuestion(question)
  }

  return (
    <div className="flex min-h-[calc(100vh-5rem)] flex-col px-space-lg py-space-md">
      <div className="mb-space-md flex flex-wrap items-center justify-between gap-space-sm border-none pb-space-sm">
        <div className="flex items-center gap-space-sm">
          <span className="font-headline text-headline-sm tracking-tight text-primary">
            Consultation interactive
          </span>
          <span className="rounded-full bg-tertiary-fixed px-2.5 py-0.5 font-label text-label-sm font-semibold text-tertiary">
            Assistant Nyateƒe
          </span>
        </div>
        {isLoading ? (
          <div className="flex items-center gap-1.5 rounded-full bg-surface-container-high px-3 py-1 text-on-surface">
            <span className="h-2 w-2 animate-pulse rounded-full bg-tertiary" />
            <span className="font-label text-label-sm">
              Analyse en cours
              {queueWaiting > 1 ? ' · patientez un instant' : ''}
            </span>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-12 items-start gap-space-lg">
        <aside className="col-span-12 flex flex-col gap-space-md xl:col-span-4">
          <div className="flex flex-col gap-space-xs rounded-xl bg-surface-container-low p-space-md shadow-sm">
            <div className="flex items-center gap-space-xs font-headline text-headline-sm text-primary">
              <MaterialIcon name="verified" className="text-[24px]" />
              <span>République togolaise</span>
            </div>
            <p className="font-body text-body-sm leading-relaxed text-on-surface-variant">
              Réponses fondées sur des sources officielles enregistrées dans Nyateƒe,
              avec les références affichées.
            </p>
          </div>

          <div className="flex flex-col gap-space-sm rounded-xl bg-surface-container-low p-space-md shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-label text-label-md uppercase tracking-wider text-primary">
                Requêtes fréquentes
              </span>
              <MaterialIcon name="bolt" className="text-[18px] text-secondary" />
            </div>
            <div className="mt-1 flex flex-col gap-2">
              {SUGGESTED_QUERIES.map((item) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => {
                    setQuestion(item.title)
                    void submitQuestion(item.title)
                  }}
                  className="group flex items-start gap-space-xs rounded-lg bg-surface-container-lowest p-space-sm text-left transition-all hover:bg-surface-container"
                >
                  <MaterialIcon
                    name={item.icon}
                    className="mt-0.5 text-[18px] text-secondary transition-colors group-hover:text-primary"
                  />
                  <div className="flex flex-col">
                    <span className="font-label text-label-md font-semibold text-on-surface">
                      {item.title}
                    </span>
                    <span className="font-body text-[0.75rem] text-on-surface-variant">
                      {item.hint}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-space-sm rounded-xl bg-primary-container p-space-md text-surface shadow-md">
            <MaterialIcon name="policy" className="mt-0.5 text-[22px] text-secondary-container" />
            <div className="flex flex-col gap-1">
              <span className="font-label text-label-md text-secondary-container">
                Avertissement déontologique
              </span>
              <p className="font-body text-[0.8rem] leading-normal text-surface">
                Nyateƒe oriente à partir de textes officiels. Consultez un
                professionnel du droit pour votre situation concrète.
              </p>
            </div>
          </div>
        </aside>

        <section className="col-span-12 flex flex-col gap-space-md xl:col-span-8">
          {result ? (
            <div className="flex w-full items-start gap-space-sm self-start">
              <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container-highest shadow-sm">
                <MaterialIcon name="balance" className="text-[20px] text-primary" />
              </div>
              <div className="flex w-full flex-col gap-space-md rounded-2xl rounded-tl-xs bg-surface-container-lowest p-space-lg shadow-md">
                <p className="font-label text-label-sm font-semibold uppercase tracking-wide text-primary">
                  Réponse Nyateƒe
                </p>
                <p className="whitespace-pre-wrap font-body text-body-md leading-relaxed text-on-surface">
                  {result.answer}
                </p>
                <SourceList sources={result.sources} />
              </div>
            </div>
          ) : null}

          {error ? (
            <p className="rounded-lg border border-error/30 bg-error/10 px-3 py-2 font-body text-body-sm text-error">
              {error}
            </p>
          ) : null}

          <form
            onSubmit={handleSubmit}
            className="sticky bottom-4 flex w-full flex-col gap-2 rounded-2xl bg-surface-container-lowest p-space-sm shadow-xl"
          >
            <div className="flex items-center gap-space-sm rounded-xl bg-surface-container-low px-space-md py-2">
              <MaterialIcon name="search" className="text-[22px] text-secondary" />
              <input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Posez une question en droit togolais..."
                className="w-full border-none bg-transparent font-body text-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none"
              />
              <button
                type="submit"
                disabled={isLoading || !question.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-on-primary transition-all hover:bg-primary-container disabled:opacity-50"
              >
                <MaterialIcon name="send" className="text-[20px]" />
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}
