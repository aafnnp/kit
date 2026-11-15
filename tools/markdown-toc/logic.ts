export interface MarkdownHeading {
  level: number
  text: string
  slug: string
}

function cleanHeading(raw: string): string {
  return raw
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

export function parseHeadings(markdown: string): MarkdownHeading[] {
  const headings: MarkdownHeading[] = []
  const slugCounts = new Map<string, number>()
  const lines = markdown.split(/\r?\n/)
  let fence: { character: string; length: number } | null = null

  const push = (level: number, raw: string) => {
    const text = cleanHeading(raw)
    if (!text) return
    const slug = text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
    const baseSlug = slug || "section"
    const count = slugCounts.get(baseSlug) ?? 0
    slugCounts.set(baseSlug, count + 1)
    headings.push({ level, text, slug: count === 0 ? baseSlug : `${baseSlug}-${count}` })
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]!
    const fenceMatch = line.match(/^ {0,3}(`{3,}|~{3,})/)
    if (fenceMatch) {
      const marker = fenceMatch[1]!
      if (fence === null) {
        fence = { character: marker[0]!, length: marker.length }
      } else if (
        marker[0] === fence.character &&
        marker.length >= fence.length &&
        line.slice(fenceMatch[0].length).trim() === ""
      ) {
        fence = null
      }
      continue
    }
    if (fence !== null) continue

    const atx = line.match(/^ {0,3}(#{1,6})\s+(.+?)\s*#*\s*$/)
    if (atx) {
      push(atx[1]!.length, atx[2]!)
      continue
    }

    const underline = lines[index + 1]?.match(/^ {0,3}(=+|-+)\s*$/)
    if (underline && line.trim()) {
      push(underline[1]!.startsWith("=") ? 1 : 2, line)
      index += 1
    }
  }

  return headings
}

export interface TocOptions {
  maxDepth?: number
  numbered?: boolean
}

export function generateMarkdownToc(markdown: string, options: TocOptions = {}): string {
  const maxDepth = options.maxDepth ?? 6
  const counters = [0, 0, 0, 0, 0, 0]
  return parseHeadings(markdown)
    .filter((heading) => heading.level <= maxDepth)
    .map(({ level, text, slug }) => {
      if (!options.numbered) return `${"  ".repeat(level - 1)}- [${text}](#${slug})`
      counters[level - 1] = (counters[level - 1] ?? 0) + 1
      for (let deeper = level; deeper < counters.length; deeper += 1) counters[deeper] = 0
      return `${"  ".repeat(level - 1)}${counters[level - 1]}. [${text}](#${slug})`
    })
    .join("\n")
}
