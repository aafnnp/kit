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

const MAX_EVAL_MILLIS = 250

function quantifiedGroupRisk(pattern: string): string | null {
  const groups = /\((?:\?:)?((?:\\.|[^()\\])*)\)\s*(?:[*+]|\{\d+,\d*\})/g
  for (const match of pattern.matchAll(groups)) {
    const body = match[1] ?? ""
    if (/[*+]|\{\d+,\}/.test(body)) {
      return "nested quantifiers can backtrack exponentially"
    }
    const alternatives = body.split("|").map((part) => part.trim()).filter(Boolean)
    const ambiguous = alternatives.some((option, index) =>
      alternatives.some((other, otherIndex) => index !== otherIndex && other.length > option.length && other.startsWith(option)),
    )
    if (ambiguous) return "quantified alternatives share a prefix and can backtrack exponentially"
  }
  return null
}

export function runRegex(pattern: string, flags: string, text: string): { ok: true; result: RegexResult } | { ok: false; error: string } {
  if (!pattern) return { ok: false, error: "Pattern is empty" }
  if (pattern.length > 10_000 || text.length > 200_000) {
    return { ok: false, error: "Pattern or text is too large to evaluate safely" }
  }
  const risk = quantifiedGroupRisk(pattern)
  if (risk) return { ok: false, error: `Pattern rejected for safety: ${risk}.` }
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
  const deadline = Date.now() + MAX_EVAL_MILLIS

  if (regex.global || regex.sticky) {
    let match: RegExpExecArray | null
    while ((match = regex.exec(text)) !== null && guard < 10_000) {
      guard += 1
      if ((guard & 63) === 0 && Date.now() > deadline) {
        return { ok: false, error: "Regex evaluation exceeded the 250 ms safety budget." }
      }
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
