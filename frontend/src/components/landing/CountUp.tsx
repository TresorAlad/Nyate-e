import { useEffect, useRef, useState } from 'react'

type CountUpProps = {
  end: number
  suffix?: string
  prefix?: string
  durationMs?: number
}

export function CountUp({ end, suffix = '', prefix = '', durationMs = 1400 }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const [value, setValue] = useState(0)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setValue(end)
      return
    }

    let frame = 0
    let started = false

    function animate(start: number) {
      const elapsed = performance.now() - start
      const progress = Math.min(elapsed / durationMs, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(end * eased))
      if (progress < 1) frame = requestAnimationFrame(() => animate(start))
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || started) return
        started = true
        observer.disconnect()
        frame = requestAnimationFrame(() => animate(performance.now()))
      },
      { threshold: 0.4 },
    )
    observer.observe(node)

    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [end, durationMs])

  return (
    <span ref={ref}>
      {prefix}
      {value}
      {suffix}
    </span>
  )
}
