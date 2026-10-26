import { useEffect, useState } from 'react'

import { MaterialIcon } from '../shell/MaterialIcon'

const QUESTION =
  "Quelles sont les conditions de validité d'une vente de terrain coutumier ?"
const ANSWER =
  "La vente d'un terrain coutumier s'apprécie au regard du Code foncier et domanial (loi n° 2018-005) : capacité des parties, consentement, objet et formalités d'enregistrement."
const SOURCES = ['Loi 2018-005', 'Code foncier', 'Journal officiel']

type PreviewPhase = 'question' | 'typing' | 'answer'

export function AssistantPreview() {
  const [phase, setPhase] = useState<PreviewPhase>('question')

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setPhase('answer')
      return
    }

    let cancelled = false
    const timers: number[] = []

    function cycle() {
      if (cancelled) return
      setPhase('question')
      timers.push(window.setTimeout(() => {
        if (!cancelled) setPhase('typing')
      }, 900))
      timers.push(window.setTimeout(() => {
        if (!cancelled) setPhase('answer')
      }, 2300))
      timers.push(window.setTimeout(cycle, 8200))
    }

    cycle()
    return () => {
      cancelled = true
      timers.forEach((id) => window.clearTimeout(id))
    }
  }, [])

  return (
    <div className="relative">
      <div className="float-badge absolute -left-2 top-10 z-10 hidden rounded-full bg-surface px-3 py-1.5 shadow-lg xl:block">
        <span className="font-label text-label-sm font-semibold text-primary">Sources JO</span>
      </div>
      <div
        className="float-badge absolute -right-2 top-24 z-10 hidden rounded-full bg-tertiary px-3 py-1.5 text-tertiary-fixed shadow-lg xl:block"
        style={{ animationDelay: '-1.6s' }}
      >
        <span className="font-label text-label-sm font-semibold">Mode délibéré</span>
      </div>
      <div
        className="float-badge absolute bottom-8 -left-2 z-10 hidden rounded-full bg-primary-container px-3 py-1.5 text-surface shadow-lg xl:block"
        style={{ animationDelay: '-3.2s' }}
      >
        <span className="font-label text-label-sm font-semibold">Loi 2018-005</span>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary-container text-surface">
              <span className="pulse-ring absolute inset-0 rounded-lg bg-primary-container/40" />
              <MaterialIcon name="psychology" className="relative text-[18px]" />
            </span>
            <div>
              <p className="font-label text-label-md font-semibold text-primary">Assistant Nyateƒe</p>
              <p className="font-label text-label-sm text-on-surface-variant">Réponse sourcée · Togo</p>
            </div>
          </div>
          <span className="rounded-full bg-tertiary-fixed px-2.5 py-1 font-label text-label-sm font-semibold text-on-tertiary-fixed">
            En direct
          </span>
        </div>

        <div className="space-y-3">
          <div className="ml-8 rounded-2xl rounded-tr-sm bg-primary px-4 py-3 text-surface shadow-md">
            <p className="font-body text-body-sm leading-relaxed">{QUESTION}</p>
          </div>

          {phase === 'typing' ? (
            <div className="mr-6 flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-surface-container-low px-4 py-3">
              <span className="typing-dot h-2 w-2 rounded-full bg-primary-container" />
              <span className="typing-dot h-2 w-2 rounded-full bg-primary-container" style={{ animationDelay: '0.15s' }} />
              <span className="typing-dot h-2 w-2 rounded-full bg-primary-container" style={{ animationDelay: '0.3s' }} />
            </div>
          ) : null}

          {phase === 'answer' ? (
            <div className="mr-4 rounded-2xl rounded-tl-sm bg-surface-container-low px-4 py-3">
              <p className="font-body text-body-sm text-on-surface">{ANSWER}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {SOURCES.map((source) => (
                  <span
                    key={source}
                    className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 font-label text-label-sm text-primary"
                  >
                    <MaterialIcon name="verified" className="text-[14px] text-tertiary" />
                    {source}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
