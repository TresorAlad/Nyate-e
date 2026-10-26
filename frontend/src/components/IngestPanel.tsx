import { useState, type FormEvent } from 'react'

import { ingestDocument } from '../lib/api'
import { getIngestApiKey, setIngestApiKey } from '../lib/ingest-key'

export function IngestPanel() {
  const [ingestKey, setIngestKey] = useState(getIngestApiKey())
  const [title, setTitle] = useState('')
  const [docType, setDocType] = useState('loi')
  const [sourceRef, setSourceRef] = useState('')
  const [versionDate, setVersionDate] = useState('')
  const [body, setBody] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (isLoading) return

    setIsLoading(true)
    setMessage(null)
    setError(null)

    if (!ingestKey.trim()) {
      setError('Renseignez la clé d\'accès.')
      setIsLoading(false)
      return
    }

    try {
      setIngestApiKey(ingestKey)
      await ingestDocument(
        {
          title: title.trim(),
          body: body.trim(),
          doc_type: docType.trim() || undefined,
          source_ref: sourceRef.trim() || undefined,
          version_date: versionDate.trim() || undefined,
        },
        ingestKey.trim(),
      )
      setMessage('Texte enregistré avec succès.')
      setBody('')
    } catch (submitError) {
      const text =
        submitError instanceof Error
          ? submitError.message
          : 'Enregistrement impossible.'
      setError(text)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="max-w-4xl rounded-2xl bg-surface-container-low p-space-lg shadow-md">
      <div className="mb-space-md">
        <h2 className="font-headline text-headline-sm text-primary">Publier un texte</h2>
        <p className="mt-1 font-body text-body-sm text-on-surface-variant">
          Ajoutez un texte officiel pour enrichir la base juridique consultée par
          l&apos;assistant et la bibliothèque.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-2 block font-label text-label-md text-on-surface">
            Clé d&apos;accès
          </span>
          <input
            type="password"
            value={ingestKey}
            onChange={(event) => setIngestKey(event.target.value)}
            autoComplete="off"
            required
            placeholder="Clé fournie par Nyateƒe"
            className="w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-2.5 font-body text-body-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>

        <label className="block sm:col-span-2">
          <span className="mb-2 block font-label text-label-md text-on-surface">
            Titre
          </span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            className="w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-2.5 font-body text-body-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>

        <label className="block">
          <span className="mb-2 block font-label text-label-md text-on-surface">
            Type
          </span>
          <select
            value={docType}
            onChange={(event) => setDocType(event.target.value)}
            className="w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-2.5 font-body text-body-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="code">Code</option>
            <option value="loi">Loi</option>
            <option value="decret">Décret</option>
            <option value="constitution">Constitution</option>
            <option value="autre">Autre</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block font-label text-label-md text-on-surface">
            Référence
          </span>
          <input
            value={sourceRef}
            onChange={(event) => setSourceRef(event.target.value)}
            placeholder="Art. 12, Loi n°…"
            className="w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-2.5 font-body text-body-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>

        <label className="block sm:col-span-2">
          <span className="mb-2 block font-label text-label-md text-on-surface">
            Date de version
          </span>
          <input
            type="date"
            value={versionDate}
            onChange={(event) => setVersionDate(event.target.value)}
            className="w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-2.5 font-body text-body-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>

        <label className="block sm:col-span-2">
          <span className="mb-2 block font-label text-label-md text-on-surface">
            Texte intégral
          </span>
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            required
            rows={8}
            className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm outline-none focus:border-sky-600 focus:bg-white focus:ring-2 focus:ring-sky-700/30"
          />
        </label>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-xl bg-primary px-5 py-2.5 font-label text-label-md text-on-primary hover:bg-primary-container disabled:opacity-50"
          >
            {isLoading ? 'Enregistrement…' : 'Enregistrer le texte'}
          </button>
        </div>
      </form>

      {message && (
        <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {message}
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}
    </section>
  )
}
