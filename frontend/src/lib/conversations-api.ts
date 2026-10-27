import { getAuthToken } from './auth-api'
import type { Conversation, StoredTurn } from './conversations'

const API_BASE = '/api'

export type ConversationSummary = {
  id: string
  title: string
  updatedAt: number
}

async function conversationsFetch(path: string, init: RequestInit = {}) {
  const token = getAuthToken()
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  const response = await fetch(`${API_BASE}${path}`, { ...init, headers })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message =
      typeof data?.error === 'string' ? data.error : 'Synchronisation impossible.'
    throw new Error(message)
  }
  return data
}

export async function fetchConversationSummaries(): Promise<ConversationSummary[]> {
  const data = await conversationsFetch('/conversations')
  const items = data.conversations
  if (!Array.isArray(items)) return []
  return items.filter(
    (item: ConversationSummary) =>
      typeof item?.id === 'string' &&
      typeof item?.title === 'string' &&
      typeof item?.updatedAt === 'number',
  )
}

export async function fetchConversationById(
  id: string,
): Promise<Conversation | null> {
  const data = await conversationsFetch(`/conversations/${encodeURIComponent(id)}`)
  const item = data.conversation as Conversation | undefined
  if (!item?.id || !Array.isArray(item.turns)) return null
  return item
}

export async function saveConversationRemote(
  conversation: Conversation,
): Promise<void> {
  await conversationsFetch(
    `/conversations/${encodeURIComponent(conversation.id)}`,
    {
      method: 'PUT',
      body: JSON.stringify({
        title: conversation.title,
        updatedAt: conversation.updatedAt,
        turns: conversation.turns as StoredTurn[],
      }),
    },
  )
}

export async function deleteConversationRemote(id: string): Promise<void> {
  await conversationsFetch(`/conversations/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export async function clearAllConversationsRemote(): Promise<void> {
  await conversationsFetch('/conversations', { method: 'DELETE' })
}
