import { useEffect, useRef } from 'react'

export function HeroAtmosphere() {
  const spotlightRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    function onMove(event: PointerEvent) {
      const node = spotlightRef.current
      if (!node) return
      node.style.background = `radial-gradient(520px circle at ${event.clientX}px ${event.clientY}px, rgba(115, 44, 44, 0.16), transparent 58%)`
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  return (
    <div className="hero-atmosphere absolute inset-0 overflow-hidden" aria-hidden>
      <div className="hero-grid absolute inset-0" />
      <div
        className="orb bg-primary-container/25"
        style={{ width: 420, height: 420, top: -80, right: -60, animationDelay: '0s' }}
      />
      <div
        className="orb bg-tertiary/20"
        style={{ width: 340, height: 340, bottom: -90, left: -80, animationDelay: '-6s' }}
      />
      <div
        className="orb bg-secondary/20"
        style={{ width: 220, height: 220, top: '38%', left: '42%', animationDelay: '-11s' }}
      />
      <div
        className="absolute left-1/2 top-24 h-64 w-64 -translate-x-1/2 rounded-full border border-primary/10 spin-slow"
        style={{ boxShadow: 'inset 0 0 80px rgba(86, 22, 24, 0.06)' }}
      />
      <div ref={spotlightRef} className="absolute inset-0" />
    </div>
  )
}
