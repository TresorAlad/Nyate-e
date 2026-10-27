import type { SourceItem } from '../lib/api'

type SourceListProps = {
  sources: SourceItem[]
}

function articleHeading(source: SourceItem): string {
  const raw = source.article?.trim()
  if (!raw) {
    return 'Extrait officiel'
  }
  if (/^article/i.test(raw)) {
    return raw.charAt(0).toUpperCase() + raw.slice(1)
  }
  return `Article ${raw}`
}

function sourceBody(source: SourceItem): string {
  return (source.content || source.excerpt || '').trim()
}

function metaLine(source: SourceItem): string {
  const parts: string[] = []
  if (source.source_ref) {
    parts.push(source.source_ref)
  }
  if (source.version_date) {
    parts.push(source.version_date)
  }
  if (source.doc_type) {
    parts.push(source.doc_type)
  }
  return parts.join(' · ')
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
      <ul className="space-y-4">
        {sources.map((source) => {
          const meta = metaLine(source)
          const body = sourceBody(source)
          return (
            <li
              key={source.chunk_id}
              className="rounded-xl border border-outline-variant/40 bg-surface-container-low p-4"
            >
              <p className="font-label text-label-md font-semibold text-on-surface">
                {source.title}
              </p>
              {meta ? (
                <p className="mt-1 font-label text-label-sm text-on-surface-variant">
                  {meta}
                </p>
              ) : null}
              <p className="mt-3 font-label text-label-sm font-semibold text-primary">
                {articleHeading(source)}
              </p>
              <p className="mt-2 whitespace-pre-wrap font-body text-body-sm leading-relaxed text-on-surface">
                {body}
              </p>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
