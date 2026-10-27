export function iconSizePx(className: string, fallback = 20): number {
  const bracket = className.match(/text-\[(\d+(?:\.\d+)?)px\]/)
  if (bracket) return Number(bracket[1])
  return fallback
}
