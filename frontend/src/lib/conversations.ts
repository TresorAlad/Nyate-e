import type { ChatResponse } from './api'

const MAX_CONVERSATIONS = 30

export type StoredTurn = {
  id: string
  question: string
  status: 'ok' | 'error'
  answer?: ChatResponse
  error?: string
}

export type Conversation = {
  id: string
  title: string
  updatedAt: number
  turns: StoredTurn[]
}

function storageKey(userId: string): string {
  return `nyatefe_conversations_${userId}`
}

function readAll(userId: string): Conversation[] {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return []
    const parsed = JSON.parse(raw) as Conversation[]
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item) =>
        typeof item?.id === 'string' &&
        typeof item?.title === 'string' &&
        item.title.trim().length > 0 &&
        Array.isArray(item.turns),
    )
  } catch {
    return []
  }
}

function writeAll(userId: string, conversations: Conversation[]): void {
  localStorage.setItem(
    storageKey(userId),
    JSON.stringify(conversations.slice(0, MAX_CONVERSATIONS)),
  )
}

export function titleFromQuestion(question: string): string {
  const compact = question.trim().replace(/\s+/g, ' ')
  if (compact.length <= 48) return compact
  return `${compact.slice(0, 45).trim()}...`
}

export function listConversations(userId: string): Conversation[] {
  return [...readAll(userId)].sort((a, b) => b.updatedAt - a.updatedAt)
}

export function getConversation(
  userId: string,
  id: string,
): Conversation | null {
  return readAll(userId).find((item) => item.id === id) ?? null
}

export function upsertConversation(
  userId: string,
  conversation: Conversation,
): void {
  const others = readAll(userId).filter((item) => item.id !== conversation.id)
  writeAll(userId, [conversation, ...others])
}

export function deleteConversation(userId: string, id: string): void {
  writeAll(
    userId,
    readAll(userId).filter((item) => item.id !== id),
  )
}

export function clearConversations(userId: string): void {
  localStorage.removeItem(storageKey(userId))
}

export function conversationGroupLabel(updatedAt: number): string {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const startMs = start.getTime()
  const day = 24 * 60 * 60 * 1000
  if (updatedAt >= startMs) return "Aujourd'hui"
  if (updatedAt >= startMs - day) return 'Hier'
  if (updatedAt >= startMs - 7 * day) return '7 derniers jours'
  return 'Plus ancien'
}
