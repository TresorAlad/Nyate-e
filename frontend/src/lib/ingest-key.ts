const STORAGE_KEY = 'nyatefe_ingest_key'

export function getIngestApiKey(): string {
  return sessionStorage.getItem(STORAGE_KEY) ?? ''
}

export function setIngestApiKey(value: string): void {
  const trimmed = value.trim()
  if (trimmed) {
    sessionStorage.setItem(STORAGE_KEY, trimmed)
    return
  }
  sessionStorage.removeItem(STORAGE_KEY)
}
