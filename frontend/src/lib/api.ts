export type SourceItem = {
  document_id: string
  chunk_id: string
  title: string
  doc_type: string | null
  source_ref: string | null
  version_date: string | null
  chunk_index: number
  article?: string | null
  content: string
  excerpt?: string
}

export type ChatResponse = {
  answer: string
  provider: 'ollama' | 'mistral_api' | 'rodium'
  sources: SourceItem[]
}

export type ChatHistoryMessage = {
  role: 'user' | 'assistant'
  content: string
}

export type SearchResult = {
  document_id: string
  chunk_id: string
  title: string
  doc_type: string | null
  source_ref: string | null
  version_date: string | null
  chunk_index: number
  similarity: number
  content: string
}

const API_BASE = '/api'

export type QueueStatus = {
  waiting: number
  active: number
  busy: boolean
}

async function parseJson<T>(response: Response): Promise<T> {
  const data = await response.json()
  if (!response.ok) {
    const message =
      typeof data?.error === 'string' ? data.error : 'Une erreur est survenue.'
    throw new Error(message)
  }
  return data as T
}

export async function fetchQueueStatus(): Promise<QueueStatus> {
  const response = await fetch(`${API_BASE}/queue`)
  return parseJson<QueueStatus>(response)
}

export async function sendChat(
  question: string,
  history: ChatHistoryMessage[] = [],
): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, history }),
  })
  return parseJson<ChatResponse>(response)
}

export type ChatStreamDone = ChatResponse & {
  mode?: string
}

type ChatStreamHandlers = {
  onPhase?: (step: 'retrieval' | 'generation') => void
  onMeta?: (meta: {
    mode?: string
    domains?: string[]
    documents?: string[]
  }) => void
  onSources?: (sources: SourceItem[]) => void
  onToken?: (text: string) => void
  onDone?: (payload: ChatStreamDone) => void
  onError?: (message: string) => void
}

function parseSseBlock(block: string): Record<string, unknown> | null {
  const dataLine = block
    .split('\n')
    .find((line) => line.startsWith('data:'))
  if (!dataLine) return null
  const raw = dataLine.slice(5).trim()
  if (!raw) return null
  try {
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    return null
  }
}

export async function sendChatStream(
  question: string,
  history: ChatHistoryMessage[],
  handlers: ChatStreamHandlers,
): Promise<void> {
  const response = await fetch(`${API_BASE}/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, history }),
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    const message =
      typeof data?.error === 'string'
        ? data.error
        : 'Impossible de contacter le serveur.'
    throw new Error(message)
  }

  if (!response.body) {
    throw new Error('Flux de réponse indisponible.')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    let splitIndex = buffer.indexOf('\n\n')
    while (splitIndex >= 0) {
      const block = buffer.slice(0, splitIndex)
      buffer = buffer.slice(splitIndex + 2)
      const payload = parseSseBlock(block)
      if (payload) {
        const event = String(payload.event ?? '')
        if (event === 'phase') {
          const step = payload.step
          if (step === 'retrieval' || step === 'generation') {
            handlers.onPhase?.(step)
          }
        } else if (event === 'meta') {
          handlers.onMeta?.({
            mode: typeof payload.mode === 'string' ? payload.mode : undefined,
            domains: Array.isArray(payload.domains)
              ? (payload.domains as string[])
              : undefined,
            documents: Array.isArray(payload.documents)
              ? (payload.documents as string[])
              : undefined,
          })
        } else if (event === 'sources') {
          handlers.onSources?.((payload.sources as SourceItem[]) ?? [])
        } else if (event === 'token') {
          handlers.onToken?.(String(payload.text ?? ''))
        } else if (event === 'done') {
          handlers.onDone?.({
            answer: String(payload.answer ?? ''),
            provider: (payload.provider as ChatResponse['provider']) ?? 'ollama',
            sources: (payload.sources as SourceItem[]) ?? [],
            mode: typeof payload.mode === 'string' ? payload.mode : undefined,
          })
        } else if (event === 'error') {
          handlers.onError?.(String(payload.message ?? 'Erreur de génération.'))
        }
      }
      splitIndex = buffer.indexOf('\n\n')
    }
  }
}

export function isChatStreamEnabled(): boolean {
  return import.meta.env.VITE_CHAT_STREAM !== 'false'
}

export async function searchLegal(query: string): Promise<SearchResult[]> {
  const response = await fetch(`${API_BASE}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, top_k: 5 }),
  })
  const data = await parseJson<{ results: SearchResult[] }>(response)
  return data.results
}

export type IngestPayload = {
  title: string
  body: string
  doc_type?: string
  source_ref?: string
  version_date?: string
}

export async function ingestDocument(
  payload: IngestPayload,
  ingestApiKey: string,
): Promise<void> {
  const response = await fetch(`${API_BASE}/documents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Nyatefe-Ingest-Key': ingestApiKey,
    },
    body: JSON.stringify(payload),
  })
  await parseJson(response)
}
