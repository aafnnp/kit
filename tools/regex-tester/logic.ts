export interface RegexMatch {
  value: string
  index: number
  groups: (string | undefined)[]
  named: Record<string, string>
}

export interface Segment {
  text: string
  match: boolean
}

export interface RegexResult {
  matches: RegexMatch[]
  segments: Segment[]
}

export function runRegex(pattern: string, flags: string, text: string): { ok: true; result: RegexResult } | { ok: false; error: string } {
  if (!pattern) return { ok: false, error: "Pattern is empty" }
  let regex: RegExp
  try {
    regex = new RegExp(pattern, flags)
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }

  const matches: RegexMatch[] = []
  const segments: Segment[] = []
  let last = 0
  let guard = 0

  if (regex.global || regex.sticky) {
    let match: RegExpExecArray | null
    while ((match = regex.exec(text)) !== null && guard < 10_000) {
      guard += 1
      const index = match.index
      if (index > last) segments.push({ text: text.slice(last, index), match: false })
      segments.push({ text: match[0], match: true })
      last = index + match[0].length
      matches.push(toMatch(match))
      if (match[0].length === 0) regex.lastIndex += 1
    }
  } else {
    const match = regex.exec(text)
    if (match) {
      if (match.index > 0) segments.push({ text: text.slice(0, match.index), match: false })
      segments.push({ text: match[0], match: true })
      last = match.index + match[0].length
      matches.push(toMatch(match))
    }
  }

  if (last < text.length) segments.push({ text: text.slice(last), match: false })
  return { ok: true, result: { matches, segments } }
}

function toMatch(match: RegExpExecArray): RegexMatch {
  return {
    value: match[0],
    index: match.index,
    groups: match.slice(1),
    named: match.groups ? { ...match.groups } as Record<string, string> : {},
  }
}

export const flagOptions: { flag: string; zh: string; en: string }[] = [
  { flag: "g", zh: "全局", en: "global" },
  { flag: "i", zh: "忽略大小写", en: "ignore case" },
  { flag: "m", zh: "多行", en: "multiline" },
  { flag: "s", zh: "点匹配换行", en: "dotall" },
  { flag: "u", zh: "Unicode", en: "unicode" },
]
