const KEY = 'nyatefe_pending_question'

export function setPendingQuestion(question: string): void {
  sessionStorage.setItem(KEY, question.trim())
}

export function consumePendingQuestion(): string {
  const value = sessionStorage.getItem(KEY) ?? ''
  sessionStorage.removeItem(KEY)
  return value
}
