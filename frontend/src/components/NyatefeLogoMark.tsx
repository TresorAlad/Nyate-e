import { MaterialIcon } from './shell/MaterialIcon'

type NyatefeLogoMarkProps = {
  className?: string
  boxClassName?: string
  iconClassName?: string
}

const DEFAULT_BOX =
  'flex items-center justify-center rounded-lg bg-surface-container shadow-sm'
const DEFAULT_ICON = 'text-primary'

export function NyatefeLogoMark({
  className = 'h-10 w-10',
  boxClassName = DEFAULT_BOX,
  iconClassName = DEFAULT_ICON,
}: NyatefeLogoMarkProps) {
  const iconSize =
    iconClassName.includes('text-[') || iconClassName.includes('text-1')
      ? iconClassName
      : `${iconClassName} text-[22px]`

  return (
    <div className={`${boxClassName} ${className}`.trim()} aria-hidden>
      <MaterialIcon name="balance" className={iconSize} />
    </div>
  )
}
