import { useEffect, useRef, useState, type ReactNode } from 'react'

type RevealVariant = 'up' | 'left' | 'right' | 'scale' | 'blur'

type RevealProps = {
  children: ReactNode
  className?: string
  delayMs?: number
  as?: 'div' | 'section' | 'article'
  id?: string
  variant?: RevealVariant
}

const VARIANT_CLASS: Record<RevealVariant, string> = {
  up: '',
  left: 'reveal-from-left',
  right: 'reveal-from-right',
  scale: 'reveal-from-scale',
  blur: 'reveal-from-blur',
}

export function Reveal({
  children,
  className = '',
  delayMs = 0,
  as: Tag = 'div',
  id,
  variant = 'up',
}: RevealProps) {
  const ref = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -6% 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <Tag
      id={id}
      ref={ref as never}
      className={`reveal ${VARIANT_CLASS[variant]} ${isVisible ? 'reveal-visible' : ''} ${className}`.trim()}
      style={{ transitionDelay: `${delayMs}ms` }}
    >
      {children}
    </Tag>
  )
}
