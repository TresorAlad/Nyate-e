import { useEffect, useState, type FormEvent } from 'react'

import { MaterialIcon } from '../components/shell/MaterialIcon'
import type { AppRoute } from '../components/shell/SidebarNav'
import { searchLegal, type SearchResult } from '../lib/api'
import { LIBRARY_SHORTCUTS } from '../lib/citizen-shortcuts'
import { consumePendingSearch, setPendingQuestion } from '../lib/pending-question'

type BibliothequeViewProps = {
  onNavigate?: (route: AppRoute) => void
}

export function BibliothequeView({ onNavigate }: BibliothequeViewProps) {
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<SearchResult[]>([])
  const [hasSearched, setHasSearched] = useState(false)

  async function runSearch(text: string) {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return

    setQuery(trimmed)
    setIsLoading(true)
    setError(null)
    setHasSearched(true)
    try {
      const rows = await searchLegal(trimmed)
      setResults(rows)
    } catch (searchError) {
      setError(
        searchError instanceof Error
          ? searchError.message
          : 'Recherche impossible.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const pending = consumePendingSearch()
    if (pending) void runSearch(pending)
  }, [])

  async function handleSearch(event: FormEvent) {
    event.preventDefault()
    await runSearch(query)
  }

  function askAssistant(text: string) {
    setPendingQuestion(text)
    onNavigate?.('assistant')
  }

  return (
    <div className="relative overflow-hidden px-margin py-space-lg">
      <div className="pointer-events-none absolute -left-20 -top-32 h-96 w-96 rounded-full bg-tertiary-fixed opacity-40 blur-3xl" />

      <div className="relative z-10">
        <div className="flex flex-col justify-between gap-space-md lg:flex-row lg:items-end">
          <div>
            <div className="mb-space-sm inline-flex items-center gap-2 rounded-full bg-surface-container-high px-3 py-1 text-primary">
              <MaterialIcon name="verified" className="text-[15px]" />
              <span className="font-label text-label-sm uppercase tracking-wider">
                Sources officielles
              </span>
            </div>
            <h1 className="font-headline text-headline-lg text-primary">
              Bibliothèque juridique
            </h1>
            <p className="mt-2 max-w-2xl font-body text-body-lg font-light text-on-surface-variant">
              Recherchez par thème, mot-clé ou formulation naturelle dans le corpus
              juridique togolais disponible sur Nyateƒe.
            </p>
          </div>
          {onNavigate ? (
            <button
              type="button"
              onClick={() => askAssistant(query || 'Quels sont mes droits en droit togolais ?')}
              className="btn-shine inline-flex items-center justify-center gap-2 rounded-xl bg-primary-container px-space-md py-3 font-label text-label-md text-surface"
            >
              <MaterialIcon name="chat" className="text-[20px]" />
              Poser à l&apos;assistant
            </button>
          ) : null}
        </div>

        <form
          onSubmit={handleSearch}
          className="search-glow relative z-10 mb-space-md mt-space-lg rounded-2xl bg-surface-container-lowest p-space-md"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-space-sm rounded-xl bg-surface-container-low px-space-sm py-2">
              <MaterialIcon name="search" className="text-[24px] text-primary" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher un thème, un article, un mot-clé…"
                className="w-full bg-transparent font-body text-body-md text-on-surface placeholder:text-outline focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="btn-shine rounded-xl bg-primary px-space-md py-3 font-label text-label-md text-surface transition hover:bg-primary-container disabled:opacity-50"
            >
              {isLoading ? 'Recherche…' : 'Rechercher'}
            </button>
          </div>
        </form>

        <div className="mb-space-lg flex flex-wrap gap-2">
          {LIBRARY_SHORTCUTS.map((label) => (
            <button
              key={label}
              type="button"
              disabled={isLoading}
              onClick={() => void runSearch(label)}
              className="rounded-full bg-surface-container px-3 py-1.5 font-label text-label-sm text-on-surface transition-all hover:-translate-y-0.5 hover:bg-surface-container-high disabled:opacity-60"
            >
              {label}
            </button>
          ))}
        </div>

        {error ? (
          <div className="mb-space-md rounded-xl border border-error/30 bg-error/10 px-space-md py-space-sm">
            <p className="font-body text-body-sm text-error">{error}</p>
            <button
              type="button"
              onClick={() => void runSearch(query)}
              className="mt-2 inline-flex items-center gap-1 rounded-lg bg-surface px-3 py-2 font-label text-label-sm text-primary"
            >
              <MaterialIcon name="refresh" className="text-[16px]" />
              Réessayer
            </button>
          </div>
        ) : null}

        {isLoading ? (
          <p className="mb-space-md font-body text-body-md text-on-surface-variant">
            Recherche dans le corpus officiel…
          </p>
        ) : null}

        {!hasSearched && !isLoading ? (
          <div className="rounded-2xl bg-surface-container-low p-space-lg">
            <h2 className="font-headline text-headline-sm text-primary">
              Par où commencer
            </h2>
            <p className="mt-2 max-w-xl font-body text-body-md text-on-surface-variant">
              Choisissez un thème ci-dessus ou saisissez un mot-clé. Chaque extrait
              peut ensuite être posé à l&apos;assistant pour une explication claire.
            </p>
          </div>
        ) : null}

        <div className="grid gap-gutter md:grid-cols-2 lg:grid-cols-3">
          {results.map((row) => (
            <article
              key={row.chunk_id}
              className="card-lift flex flex-col justify-between rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm"
            >
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-tertiary-fixed px-2.5 py-1 font-label text-label-sm font-semibold text-primary">
                  {(row.similarity * 100).toFixed(0)} % de pertinence
                </span>
                <h2 className="mt-space-sm font-headline text-headline-sm text-primary">
                  {row.title}
                </h2>
                <p className="mt-1 font-label text-label-sm text-outline">
                  {row.doc_type || 'Type non renseigné'}
                  {row.source_ref ? ` · ${row.source_ref}` : ''}
                </p>
                <p className="mt-space-sm line-clamp-4 font-body text-body-sm text-on-surface-variant">
                  {row.content}
                </p>
              </div>
              {onNavigate ? (
                <button
                  type="button"
                  onClick={() =>
                    askAssistant(
                      `Expliquez cet extrait : ${row.title}${row.source_ref ? ` (${row.source_ref})` : ''}. ${row.content.slice(0, 280)}`,
                    )
                  }
                  className="mt-space-md inline-flex w-full items-center justify-center gap-1 rounded-lg bg-surface-container-high py-2.5 font-label text-label-md text-primary transition-colors hover:bg-primary-container hover:text-surface"
                >
                  Expliquer avec l&apos;assistant
                  <MaterialIcon name="arrow_outward" className="text-[16px]" />
                </button>
              ) : null}
            </article>
          ))}
        </div>

        {!isLoading && hasSearched && results.length === 0 && !error ? (
          <div className="rounded-2xl bg-surface-container-low p-space-lg">
            <p className="font-body text-body-md text-on-surface-variant">
              Aucun extrait ne correspond suffisamment à votre recherche. Essayez une
              formulation plus précise ou un autre mot-clé.
            </p>
            {onNavigate ? (
              <button
                type="button"
                onClick={() => askAssistant(query)}
                className="mt-space-md inline-flex items-center gap-2 rounded-xl bg-primary-container px-space-md py-2.5 font-label text-label-md text-surface"
              >
                <MaterialIcon name="chat" className="text-[18px]" />
                Poser cette question à l&apos;assistant
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
