import {
  fetchConversationSummaries,
  saveConversationRemote,
} from './conversations-api'
import { clearConversationsLocal, listConversationsLocal } from './conversations'

let migratePromise: Promise<void> | null = null

export function migrateLocalConversationsToServer(userId: string): Promise<void> {
  if (migratePromise) return migratePromise
  migratePromise = (async () => {
    const local = listConversationsLocal(userId)
    if (!local.length) return
    let remoteCount = 0
    try {
      remoteCount = (await fetchConversationSummaries()).length
    } catch {
      return
    }
    if (remoteCount > 0) {
      clearConversationsLocal(userId)
      return
    }
    for (const conversation of local) {
      try {
        await saveConversationRemote(conversation)
      } catch {
        break
      }
    }
    try {
      const synced = (await fetchConversationSummaries()).length
      if (synced > 0) {
        clearConversationsLocal(userId)
      }
    } catch {
      /* conserve le local si le serveur reste injoignable */
    }
  })().finally(() => {
    migratePromise = null
  })
  return migratePromise
}
