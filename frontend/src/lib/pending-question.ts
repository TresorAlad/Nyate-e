const QUESTION_KEY = 'nyatefe_pending_question'
const SEARCH_KEY = 'nyatefe_pending_search'

export function setPendingQuestion(question: string): void {
  sessionStorage.setItem(QUESTION_KEY, question.trim())
}

export function consumePendingQuestion(): string {
  const value = sessionStorage.getItem(QUESTION_KEY) ?? ''
  sessionStorage.removeItem(QUESTION_KEY)
  return value
}

export function setPendingSearch(query: string): void {
  sessionStorage.setItem(SEARCH_KEY, query.trim())
}

export function consumePendingSearch(): string {
  const value = sessionStorage.getItem(SEARCH_KEY) ?? ''
  sessionStorage.removeItem(SEARCH_KEY)
  return value
}
