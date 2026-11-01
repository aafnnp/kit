export interface MarkdownHeading {
  level: number
  text: string
  slug: string
}

export function parseHeadings(markdown: string): MarkdownHeading[] {
  const headings: MarkdownHeading[] = []
  const slugCounts = new Map<string, number>()
  let fence: { character: string; length: number } | null = null

  for (const line of markdown.split(/\r?\n/)) {
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

    const match = line.match(/^ {0,3}(#{1,6})\s+(.+?)\s*#*\s*$/)
    if (!match) continue

    const text = match[2]!.trim()
    const slug = text
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
    const baseSlug = slug || "section"
    const count = slugCounts.get(baseSlug) ?? 0
    slugCounts.set(baseSlug, count + 1)

    headings.push({
      level: match[1]!.length,
      text,
      slug: count === 0 ? baseSlug : `${baseSlug}-${count}`,
    })
  }
  return headings
}

export function generateMarkdownToc(markdown: string): string {
  return parseHeadings(markdown)
    .map(({ level, text, slug }) => `${"  ".repeat(level - 1)}- [${text}](#${slug})`)
    .join("\n")
}
