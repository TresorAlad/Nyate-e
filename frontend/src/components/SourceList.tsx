import type { SourceItem } from '../lib/api'

type SourceListProps = {
  sources: SourceItem[]
}

export function SourceList({ sources }: SourceListProps) {
  if (!sources.length) {
    return (
      <p className="font-body text-body-sm text-on-surface-variant">
        Aucune source pertinente trouvée dans la base pour cette question.
      </p>
    )
  }

  return (
    <div>
      <h3 className="mb-3 font-label text-label-md font-semibold text-primary">
        Sources utilisées
      </h3>
      <ul className="space-y-3">
        {sources.map((source) => (
          <li
            key={source.chunk_id}
            className="rounded-xl border border-outline-variant/40 bg-surface-container-low p-3"
          >
            <p className="font-label text-label-md font-semibold text-on-surface">
              {source.title}
            </p>
            <p className="mt-1 font-label text-label-sm text-on-surface-variant">
              {source.doc_type || 'Type non renseigné'}
              {source.source_ref ? ` · ${source.source_ref}` : ''}
              {source.version_date ? ` · ${source.version_date}` : ''}
              {' · '}
              similarité {(source.similarity * 100).toFixed(0)} %
            </p>
            <p className="mt-2 font-body text-body-sm text-on-surface">{source.excerpt}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
