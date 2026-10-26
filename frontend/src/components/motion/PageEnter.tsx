import { useEffect, type ReactNode } from 'react'

type PageEnterProps = {
  children: ReactNode
  className?: string
  pageKey?: string
}

export function PageEnter({ children, className = '', pageKey }: PageEnterProps) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [pageKey])

  return (
    <div key={pageKey} className={`page-enter ${className}`.trim()}>
      {children}
    </div>
  )
}
