import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react'

import {
  fetchQueueStatus,
  isChatStreamEnabled,
  sendChat,
  sendChatStream,
  type ChatHistoryMessage,
  type ChatResponse,
  type SourceItem,
} from '../lib/api'
import { shortcutsForProfile } from '../lib/citizen-shortcuts'
import { saveConversationRemote, fetchConversationById } from '../lib/conversations-api'
import {
  getConversationLocal,
  titleFromQuestion,
  upsertConversationLocal,
  type StoredTurn,
} from '../lib/conversations'
import { consumePendingQuestion } from '../lib/pending-question'
import { useAuth } from '../context/AuthContext'
import { useHideChatSources } from '../context/ChatExperienceContext'
import { MaterialIcon } from './shell/MaterialIcon'
import { ChatAnswerMarkdown } from './ChatAnswerMarkdown'
import { SourceList } from './SourceList'

type ChatTurn = {
  id: string
  question: string
  status: 'loading' | 'streaming' | 'ok' | 'error'
  answer?: ChatResponse
  streamingText?: string
  error?: string
}

type ChatPanelProps = {
  variant?: 'gpt' | 'workspace'
  conversationId?: string | null
  onConversationIdChange?: (id: string | null) => void
  onConversationsChange?: () => void
}

function historyFromTurns(turns: ChatTurn[]): ChatHistoryMessage[] {
  const messages: ChatHistoryMessage[] = []
  for (const turn of turns) {
    if (turn.status !== 'ok' || !turn.answer?.answer) continue
    messages.push({ role: 'user', content: turn.question })
    messages.push({ role: 'assistant', content: turn.answer.answer })
  }
  return messages.slice(-8)
}

function toStoredTurns(turns: ChatTurn[]): StoredTurn[] {
  return turns
    .filter((turn) => turn.status !== 'loading')
    .map((turn) => ({
      id: turn.id,
      question: turn.question,
      status: turn.status === 'error' ? 'error' : 'ok',
      answer: turn.answer,
      error: turn.error,
    }))
}

function greetingWord(): string {
  return new Date().getHours() < 18 ? 'Bonjour' : 'Bonsoir'
}

function firstName(displayName: string): string {
  return displayName.trim().split(/\s+/)[0] || 'vous'
}

function persistTurns(
  userId: string,
  conversationId: string,
  turns: ChatTurn[],
  titleSeed: string,
) {
  const payload = {
    id: conversationId,
    title: titleFromQuestion(titleSeed),
    updatedAt: Date.now(),
    turns: toStoredTurns(turns),
  }
  void saveConversationRemote(payload).catch(() => {
    upsertConversationLocal(userId, payload)
  })
}

function storedTurnsToChatTurns(
  turns: StoredTurn[],
  sanitize: (response: ChatResponse) => ChatResponse,
): ChatTurn[] {
  return turns.map((turn) => ({
    id: turn.id,
    question: turn.question,
    status: turn.status === 'error' ? 'error' : 'ok',
    answer: turn.answer ? sanitize(turn.answer) : undefined,
    error: turn.error,
  }))
}

export function ChatPanel({
  variant = 'workspace',
  conversationId = null,
  onConversationIdChange,
  onConversationsChange,
}: ChatPanelProps) {
  const { user } = useAuth()
  const isControlled = Boolean(onConversationIdChange)
  const [localConversationId, setLocalConversationId] = useState<string | null>(
    null,
  )
  const activeConversationId = isControlled ? conversationId : localConversationId
  const setActiveConversationId = onConversationIdChange ?? setLocalConversationId
  const [draft, setDraft] = useState('')
  const [turns, setTurns] = useState<ChatTurn[]>([])
  const [queueWaiting, setQueueWaiting] = useState(0)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const threadRef = useRef<HTMLDivElement>(null)
  const conversationIdRef = useRef(activeConversationId)
  const turnsRef = useRef<ChatTurn[]>([])
  const skipLoadRef = useRef(false)
  const isLoading = turns.some(
    (turn) => turn.status === 'loading' || turn.status === 'streaming',
  )
  const shortcuts = shortcutsForProfile(user?.publicProfile ?? 'citizen')
  const hideChatSources = useHideChatSources()
  const isGpt = hideChatSources || variant === 'gpt' || user?.role === 'citizen'
  const showSources =
    !hideChatSources && variant === 'workspace' && user?.role !== 'citizen'

  function sanitizeChatResponse(response: ChatResponse): ChatResponse {
    if (showSources) return response
    return { ...response, sources: [] }
  }

  conversationIdRef.current = activeConversationId
  turnsRef.current = turns

  useEffect(() => {
    let cancelled = false

    function applyStoredTurns(storedTurns: StoredTurn[]) {
      if (cancelled) return
      setTurns(storedTurnsToChatTurns(storedTurns, sanitizeChatResponse))
    }

    async function loadConversation() {
      if (skipLoadRef.current) {
        skipLoadRef.current = false
        if (turnsRef.current.length === 0 && user && activeConversationId) {
          try {
            const remote = await fetchConversationById(activeConversationId)
            if (remote?.turns.length) {
              applyStoredTurns(remote.turns)
              return
            }
          } catch {
            /* fallback local */
          }
          const stored = getConversationLocal(user.id, activeConversationId)
          if (stored?.turns.length) {
            applyStoredTurns(stored.turns)
          }
        }
        return
      }
      if (!user || !activeConversationId) {
        setTurns([])
        return
      }
      try {
        const remote = await fetchConversationById(activeConversationId)
        if (remote) {
          applyStoredTurns(remote.turns)
          return
        }
      } catch {
        /* fallback local */
      }
      const stored = getConversationLocal(user.id, activeConversationId)
      applyStoredTurns(stored?.turns ?? [])
    }

    void loadConversation()
    return () => {
      cancelled = true
    }
  }, [activeConversationId, hideChatSources, user?.id, user?.role, variant])

  function commitTurns(boundId: string, next: ChatTurn[]) {
    if (!user) return
    persistTurns(user.id, boundId, next, next[0]?.question ?? '')
    onConversationsChange?.()
    if (conversationIdRef.current === boundId) {
      turnsRef.current = next
      setTurns(next)
    }
  }

  function turnsForBoundId(boundId: string, fallback: ChatTurn[]): ChatTurn[] {
    const live =
      conversationIdRef.current === boundId ? turnsRef.current : []
    return live.some((turn) => fallback.some((item) => item.id === turn.id))
      ? live
      : fallback
  }

  async function submitQuestion(text: string) {
    const trimmed = text.trim()
    if (!trimmed || isLoading || !user) return

    const turnId = crypto.randomUUID()
    const boundId = conversationIdRef.current ?? crypto.randomUUID()
    if (conversationIdRef.current !== boundId) {
      skipLoadRef.current = true
      conversationIdRef.current = boundId
      setActiveConversationId(boundId)
    }

    const loadingTurn: ChatTurn = {
      id: turnId,
      question: trimmed,
      status: 'loading',
    }
    const storedTurns =
      conversationIdRef.current === boundId && turnsRef.current.length > 0
        ? turnsRef.current
        : (getConversationLocal(user.id, boundId)?.turns.map((turn) => ({
            ...turn,
            status: turn.status,
          })) ?? [])
    const snapshot = [...storedTurns, loadingTurn]
    setDraft('')
    commitTurns(boundId, snapshot)

    const applyTurnUpdate = (nextTurn: ChatTurn) => {
      const base = turnsForBoundId(boundId, snapshot).map((turn) =>
        turn.id === turnId ? nextTurn : turn,
      )
      turnsRef.current = base
      setTurns(base)
    }

    async function runClassicChat() {
      const response = await sendChat(trimmed, historyFromTurns(storedTurns))
      commitTurns(
        boundId,
        turnsForBoundId(boundId, snapshot).map((turn) =>
          turn.id === turnId
            ? { ...turn, status: 'ok', answer: sanitizeChatResponse(response) }
            : turn,
        ),
      )
    }

    try {
      if (isChatStreamEnabled()) {
        let streamText = ''
        let streamSources: SourceItem[] = []
        let streamProvider: ChatResponse['provider'] = 'ollama'

        const streamingTurn = (): ChatTurn => ({
          ...loadingTurn,
          status: 'streaming',
          streamingText: streamText,
          answer: sanitizeChatResponse({
            answer: streamText,
            provider: streamProvider,
            sources: streamSources,
          }),
        })

        try {
          await sendChatStream(trimmed, historyFromTurns(storedTurns), {
            onToken: (token) => {
              streamText += token
              applyTurnUpdate(streamingTurn())
            },
            onSources: (sources) => {
              if (!showSources) return
              streamSources = sources
              applyTurnUpdate(streamingTurn())
            },
            onDone: (payload) => {
              streamProvider = payload.provider
              streamText = payload.answer || streamText
              streamSources = payload.sources ?? streamSources
            },
            onError: (message) => {
              throw new Error(message)
            },
          })

          commitTurns(
            boundId,
            turnsForBoundId(boundId, snapshot).map((turn) =>
              turn.id === turnId
                ? {
                    ...turn,
                    status: 'ok',
                    streamingText: undefined,
                    answer: sanitizeChatResponse({
                      answer: streamText,
                      provider: streamProvider,
                      sources: streamSources,
                    }),
                  }
                : turn,
            ),
          )
          return
        } catch {
          applyTurnUpdate({ ...loadingTurn, status: 'loading', streamingText: undefined })
        }
      }

      await runClassicChat()
    } catch (submitError) {
      commitTurns(
        boundId,
        turnsForBoundId(boundId, snapshot).map((turn) =>
          turn.id === turnId
            ? {
                ...turn,
                status: 'error',
                error:
                  submitError instanceof Error
                    ? submitError.message
                    : 'Impossible de générer une réponse.',
              }
            : turn,
        ),
      )
    }
  }

  useEffect(() => {
    const pending = consumePendingQuestion()
    if (pending) {
      setDraft(pending)
      void submitQuestion(pending)
    } else {
      inputRef.current?.focus()
    }
  }, [])

  useEffect(() => {
    if (!isLoading) {
      setQueueWaiting(0)
      return
    }

    let cancelled = false

    async function pollQueue() {
      try {
        const status = await fetchQueueStatus()
        if (!cancelled) setQueueWaiting(status.waiting + status.active)
      } catch {
        if (!cancelled) setQueueWaiting(0)
      }
    }

    pollQueue()
    const timer = window.setInterval(pollQueue, 2500)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [isLoading])

  useEffect(() => {
    threadRef.current?.scrollTo({
      top: threadRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [turns])

  function resizeComposer() {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    await submitQuestion(draft)
  }

  function handleComposerKey(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void submitQuestion(draft)
    }
  }

  async function copyAnswer(turn: ChatTurn) {
    if (!turn.answer?.answer) return
    try {
      await navigator.clipboard.writeText(turn.answer.answer)
      setCopiedId(turn.id)
      window.setTimeout(() => setCopiedId(null), 1800)
    } catch {
      setCopiedId(null)
    }
  }

  const composer = (
    <form onSubmit={handleSubmit} className="w-full">
      <label className="sr-only" htmlFor="chat-question">
        Votre question juridique
      </label>
      <div className="flex items-end gap-2 rounded-[1.6rem] bg-surface-container-lowest px-3 py-2 shadow-[0_8px_28px_rgba(86,22,24,0.08)] ring-1 ring-outline-variant/25">
        <textarea
          id="chat-question"
          ref={inputRef}
          rows={1}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value)
            resizeComposer()
          }}
          onKeyDown={handleComposerKey}
          placeholder="Posez une question en droit togolais..."
          className="max-h-40 min-h-11 w-full resize-none bg-transparent py-2.5 font-body text-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none"
        />
        <button
          type="submit"
          disabled={isLoading || !draft.trim()}
          className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary transition-opacity hover:bg-primary-container disabled:opacity-35"
          aria-label="Envoyer"
        >
          <MaterialIcon name="arrow_upward" className="text-[20px]" />
        </button>
      </div>
      <p className="mt-2 text-center font-body text-body-sm text-on-surface-variant">
        {isGpt
          ? 'Nyateƒe peut se tromper. Consultez un professionnel du droit si besoin.'
          : 'Nyateƒe peut se tromper. Vérifiez les sources officielles.'}
        {isLoading && queueWaiting > 1 ? ' File d\'attente en cours.' : ''}
      </p>
    </form>
  )

  const thread = turns.map((turn) => (
    <article key={turn.id} className="flex flex-col gap-4">
      <div className="ml-8 self-end rounded-3xl rounded-tr-md bg-primary px-4 py-3 text-surface">
        <p className="font-body text-body-sm leading-relaxed">{turn.question}</p>
      </div>

      {turn.status === 'loading' ? (
        <div className="flex items-center gap-2 px-1">
          <span className="typing-dot h-2 w-2 rounded-full bg-primary-container" />
          <span
            className="typing-dot h-2 w-2 rounded-full bg-primary-container"
            style={{ animationDelay: '0.15s' }}
          />
          <span
            className="typing-dot h-2 w-2 rounded-full bg-primary-container"
            style={{ animationDelay: '0.3s' }}
          />
          <span className="font-label text-label-sm text-on-surface-variant">
            {isGpt ? 'Préparation de la réponse...' : 'Recherche des sources officielles...'}
          </span>
        </div>
      ) : null}

      {turn.status === 'streaming' ? (
        <div className="px-1">
          <p className="whitespace-pre-wrap font-body text-body-md text-on-surface">
            {turn.streamingText || ''}
          </p>
          {showSources && turn.answer && turn.answer.sources.length > 0 ? (
            <div className="mt-4">
              <SourceList sources={turn.answer.sources} />
            </div>
          ) : null}
        </div>
      ) : null}

      {turn.status === 'error' ? (
        <div className="rounded-2xl border border-error/30 bg-error/10 p-4">
          <p className="font-body text-body-sm text-error">{turn.error}</p>
          <button
            type="button"
            onClick={() => void submitQuestion(turn.question)}
            className="mt-3 inline-flex items-center gap-1 rounded-lg bg-surface px-3 py-2 font-label text-label-sm text-primary"
          >
            <MaterialIcon name="refresh" className="text-[16px]" />
            Réessayer
          </button>
        </div>
      ) : null}

      {turn.status === 'ok' && turn.answer ? (
        <div className="px-1">
          <ChatAnswerMarkdown content={turn.answer.answer} />
          {showSources && turn.answer.sources.length > 0 ? (
            <div className="mt-4">
              <SourceList sources={turn.answer.sources} />
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => void copyAnswer(turn)}
            className="mt-3 inline-flex items-center gap-1 rounded-lg px-2 py-1.5 font-label text-label-sm text-on-surface-variant hover:bg-surface-container hover:text-primary"
          >
            <MaterialIcon name="content_copy" className="text-[16px]" />
            {copiedId === turn.id ? 'Copié' : 'Copier'}
          </button>
        </div>
      ) : null}
    </article>
  ))

  const emptyState = (
    <div className="flex flex-1 flex-col items-center justify-center px-4">
      <h2 className="text-center font-headline text-headline-lg text-primary">
        {greetingWord()}, {firstName(user?.displayName ?? '')}
      </h2>
      <p className="mt-2 max-w-md text-center font-body text-body-md text-on-surface-variant">
        Posez votre question, puis enchaînez avec des relances dans le même fil.
        Nyateƒe s&apos;appuie sur les textes officiels indexés pour vous orienter.
      </p>
      <div className="mt-8 w-full max-w-2xl">{composer}</div>
      <div className="mt-5 flex max-w-2xl flex-wrap justify-center gap-2">
        {shortcuts.slice(0, 3).map((item) => (
          <button
            key={item.title}
            type="button"
            disabled={isLoading}
            onClick={() => void submitQuestion(item.title)}
            className="rounded-full bg-surface-container-lowest px-3 py-1.5 font-label text-label-sm text-primary shadow-sm ring-1 ring-outline-variant/20 hover:bg-surface-container disabled:opacity-60"
          >
            {item.hint}
          </button>
        ))}
      </div>
    </div>
  )

  if (isGpt) {
    if (turns.length === 0) {
      return <div className="flex h-full min-h-0 flex-col pb-6">{emptyState}</div>
    }

    return (
      <div className="flex h-full min-h-0 flex-col">
        <div ref={threadRef} className="flex-1 overflow-y-auto">
          <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-6">
            {thread}
          </div>
        </div>
        <div className="shrink-0 bg-background px-4 pb-4 pt-2">
          <div className="mx-auto max-w-2xl">{composer}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col px-space-sm py-space-md sm:px-space-lg">
      <div className="mb-space-md flex items-center justify-between gap-3">
        <div>
          <h1 className="font-headline text-headline-sm tracking-tight text-primary">
            Assistant juridique
          </h1>
          <p className="font-body text-body-sm text-on-surface-variant">
            Posez votre question. Les sources officielles s&apos;affichent avec la
            réponse.
          </p>
        </div>
        {turns.length ? (
          <button
            type="button"
            onClick={() => {
              setActiveConversationId(null)
              setTurns([])
              setDraft('')
              inputRef.current?.focus()
            }}
            className="inline-flex items-center gap-1 rounded-lg bg-surface-container px-3 py-2 font-label text-label-sm text-primary hover:bg-surface-container-high"
          >
            <MaterialIcon name="add" className="text-[18px]" />
            Nouvelle conversation
          </button>
        ) : null}
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
        <div
          ref={threadRef}
          className="flex flex-1 flex-col gap-5 overflow-y-auto rounded-2xl bg-surface-container-low p-space-md"
        >
          {turns.length === 0 ? (
            <div className="flex flex-1 flex-col items-start justify-center gap-3 px-1 py-8">
              <h2 className="font-headline text-headline-sm text-primary">
                Posez votre question
              </h2>
              <p className="max-w-lg font-body text-body-md text-on-surface-variant">
                Décrivez les faits et ce que vous cherchez : procédure, délai ou
                conditions.
              </p>
              <div className="mt-1 flex flex-wrap gap-2">
                {shortcuts.slice(0, 3).map((item) => (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => void submitQuestion(item.title)}
                    className="rounded-full bg-surface-container-lowest px-3 py-1.5 font-label text-label-sm text-primary shadow-sm"
                  >
                    {item.hint}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            thread
          )}
        </div>
        <div className="mt-4">{composer}</div>
      </div>
    </div>
  )
}
