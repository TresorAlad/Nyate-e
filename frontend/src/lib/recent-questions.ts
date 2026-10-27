const KEY = 'nyatefe_recent_questions'
const MAX_ITEMS = 8

export type RecentQuestion = {
  text: string
  at: number
}

export function readRecentQuestions(): RecentQuestion[] {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as RecentQuestion[]
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item) => typeof item?.text === 'string' && item.text.trim())
  } catch {
    return []
  }
}

export function pushRecentQuestion(text: string): void {
  const trimmed = text.trim()
  if (!trimmed) return
  const next = [
    { text: trimmed, at: Date.now() },
    ...readRecentQuestions().filter((item) => item.text !== trimmed),
  ].slice(0, MAX_ITEMS)
  sessionStorage.setItem(KEY, JSON.stringify(next))
}

export function clearRecentQuestions(): void {
  sessionStorage.removeItem(KEY)
}
