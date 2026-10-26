type MarqueeStripProps = {
  items: string[]
  direction?: 'left' | 'right'
}

export function MarqueeStrip({ items, direction = 'left' }: MarqueeStripProps) {
  const doubled = [...items, ...items]

  return (
    <div className={`marquee ${direction === 'left' ? 'marquee-left' : 'marquee-right'}`}>
      <div className="marquee-track py-2">
        {doubled.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-outline-variant/40 bg-surface-container-lowest/80 px-4 py-1.5 font-label text-label-sm text-on-surface-variant shadow-sm"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary-container" />
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
