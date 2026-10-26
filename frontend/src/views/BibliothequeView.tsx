import { useState, type FormEvent } from 'react'

import { MaterialIcon } from '../components/shell/MaterialIcon'
import { searchLegal, type SearchResult } from '../lib/api'

export function BibliothequeView() {
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<SearchResult[]>([])

  async function handleSearch(event: FormEvent) {
    event.preventDefault()
    const trimmed = query.trim()
    if (!trimmed || isLoading) return

    setIsLoading(true)
    setError(null)
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

  return (
    <div className="relative overflow-hidden px-margin py-space-lg">
      <div className="pointer-events-none absolute -left-20 -top-32 h-96 w-96 rounded-full bg-tertiary-fixed opacity-40 blur-3xl" />

      <div className="relative z-10">
        <div className="mb-space-lg inline-flex items-center gap-2 rounded-full bg-surface-container-high px-3 py-1 text-primary">
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

        <form
          onSubmit={handleSearch}
          className="relative z-10 mb-space-lg mt-space-lg rounded-xl bg-surface-container-lowest p-space-md shadow-md"
        >
          <div className="flex items-center gap-space-sm rounded-lg bg-surface-container-low px-space-sm py-2">
            <MaterialIcon name="search" className="text-[24px] text-primary" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher un thème, un article, un mot-clé..."
              className="w-full bg-transparent font-body text-body-md text-on-surface placeholder:text-outline focus:outline-none"
            />
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="rounded-lg bg-primary px-space-md py-2 font-label text-label-md text-surface transition hover:bg-primary-container disabled:opacity-50"
            >
              {isLoading ? 'Recherche…' : 'Rechercher'}
            </button>
          </div>
        </form>

        {error ? (
          <p className="mb-space-md rounded-lg border border-error/30 bg-error/10 px-3 py-2 font-body text-body-sm text-error">
            {error}
          </p>
        ) : null}

        <div className="grid gap-gutter md:grid-cols-2 lg:grid-cols-3">
          {results.map((row) => (
            <article
              key={row.chunk_id}
              className="card-lift flex flex-col justify-between rounded-xl bg-surface-container-low p-space-lg shadow-sm"
            >
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-tertiary-fixed px-2.5 py-1 font-label text-label-sm font-semibold text-primary">
                  {(row.similarity * 100).toFixed(0)} % pertinence
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
            </article>
          ))}
        </div>

        {!isLoading && results.length === 0 && query.trim() ? (
          <p className="font-body text-body-md text-on-surface-variant">
            Aucun extrait ne correspond suffisamment à votre recherche. Essayez une
            formulation plus précise ou un autre mot-clé.
          </p>
        ) : null}
      </div>
    </div>
  )
}
