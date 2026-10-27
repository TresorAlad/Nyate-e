import { resolveAppIcon } from '../../lib/app-icon-map'
import { iconSizePx } from '../../lib/icon-size'

type MaterialIconProps = {
  name: string
  className?: string
}

export function MaterialIcon({ name, className = '' }: MaterialIconProps) {
  const Icon = resolveAppIcon(name)
  const size = iconSizePx(className)

  return (
    <Icon
      aria-hidden
      width={size}
      height={size}
      strokeWidth={1.75}
      className={`inline-block shrink-0 ${className}`.trim()}
    />
  )
}
