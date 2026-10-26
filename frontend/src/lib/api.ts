export type SourceItem = {
  document_id: string
  chunk_id: string
  title: string
  doc_type: string | null
  source_ref: string | null
  version_date: string | null
  chunk_index: number
  similarity: number
  excerpt: string
}

export type ChatResponse = {
  answer: string
  provider: 'ollama' | 'mistral_api'
  sources: SourceItem[]
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

export async function sendChat(question: string): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  })
  return parseJson<ChatResponse>(response)
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
