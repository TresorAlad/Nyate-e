import type { ReactNode } from 'react'

type ChatAnswerMarkdownProps = {
  content: string
}

type Block =
  | { kind: 'p'; text: string }
  | { kind: 'h2'; text: string }
  | { kind: 'h3'; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[] }
  | { kind: 'quote'; text: string }

function parseBlocks(source: string): Block[] {
  const lines = source.replace(/\r\n/g, '\n').trim().split('\n')
  const blocks: Block[] = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index].trim()
    if (!line) {
      index += 1
      continue
    }

    if (line.startsWith('## ')) {
      blocks.push({ kind: 'h2', text: line.slice(3).trim() })
      index += 1
      continue
    }
    if (line.startsWith('### ')) {
      blocks.push({ kind: 'h3', text: line.slice(4).trim() })
      index += 1
      continue
    }
    if (line.startsWith('> ')) {
      blocks.push({ kind: 'quote', text: line.slice(2).trim() })
      index += 1
      continue
    }
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = []
      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^[-*]\s+/, ''))
        index += 1
      }
      blocks.push({ kind: 'ul', items })
      continue
    }
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = []
      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+\.\s+/, ''))
        index += 1
      }
      blocks.push({ kind: 'ol', items })
      continue
    }

    const paragraphLines: string[] = [line]
    index += 1
    while (index < lines.length) {
      const next = lines[index].trim()
      if (
        !next ||
        next.startsWith('## ') ||
        next.startsWith('### ') ||
        next.startsWith('> ') ||
        /^[-*]\s+/.test(next) ||
        /^\d+\.\s+/.test(next)
      ) {
        break
      }
      paragraphLines.push(next)
      index += 1
    }
    blocks.push({ kind: 'p', text: paragraphLines.join(' ') })
  }

  return blocks
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*)/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  let partIndex = 0

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index))
    }
    const token = match[0]
    if (token.startsWith('**')) {
      nodes.push(
        <strong key={`${keyPrefix}-b-${partIndex}`} className="font-semibold text-primary">
          {token.slice(2, -2)}
        </strong>,
      )
    } else {
      nodes.push(
        <em key={`${keyPrefix}-i-${partIndex}`} className="text-on-surface-variant">
          {token.slice(1, -1)}
        </em>,
      )
    }
    partIndex += 1
    lastIndex = match.index + token.length
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  return nodes.length ? nodes : [text]
}

export function ChatAnswerMarkdown({ content }: ChatAnswerMarkdownProps) {
  const blocks = parseBlocks(content)

  return (
    <div className="chat-answer-markdown space-y-1">
      {blocks.map((block, blockIndex) => {
        const key = `block-${blockIndex}`
        if (block.kind === 'h2') {
          return (
            <h2
              key={key}
              className="mb-2 mt-5 font-headline text-headline-sm text-primary first:mt-0"
            >
              {renderInline(block.text, key)}
            </h2>
          )
        }
        if (block.kind === 'h3') {
          return (
            <h3
              key={key}
              className="mb-2 mt-4 font-label text-label-md font-semibold text-primary first:mt-0"
            >
              {renderInline(block.text, key)}
            </h3>
          )
        }
        if (block.kind === 'quote') {
          return (
            <blockquote
              key={key}
              className="my-3 rounded-lg border-l-4 border-tertiary bg-surface-container-low px-4 py-3 font-body text-body-sm italic text-on-surface-variant"
            >
              {renderInline(block.text, key)}
            </blockquote>
          )
        }
        if (block.kind === 'ul') {
          return (
            <ul
              key={key}
              className="mb-3 ml-1 space-y-2 border-l-2 border-primary-container pl-4"
            >
              {block.items.map((item, itemIndex) => (
                <li
                  key={`${key}-li-${itemIndex}`}
                  className="font-body text-body-md leading-relaxed text-on-surface"
                >
                  {renderInline(item, `${key}-li-${itemIndex}`)}
                </li>
              ))}
            </ul>
          )
        }
        if (block.kind === 'ol') {
          return (
            <ol key={key} className="mb-3 ml-4 list-decimal space-y-2">
              {block.items.map((item, itemIndex) => (
                <li
                  key={`${key}-li-${itemIndex}`}
                  className="font-body text-body-md leading-relaxed text-on-surface"
                >
                  {renderInline(item, `${key}-li-${itemIndex}`)}
                </li>
              ))}
            </ol>
          )
        }
        return (
          <p key={key} className="mb-3 font-body text-body-md leading-relaxed text-on-surface">
            {renderInline(block.text, key)}
          </p>
        )
      })}
    </div>
  )
}
