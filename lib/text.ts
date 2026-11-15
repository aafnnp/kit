interface GraphemeSegment {
  segment: string
}

type SegmenterConstructor = new (
  locales?: string | string[],
  options?: { granularity: "grapheme" },
) => { segment(input: string): Iterable<GraphemeSegment> }

const Segmenter = (Intl as unknown as { Segmenter?: SegmenterConstructor }).Segmenter

const ZERO_WIDTH_JOINER = 0x200d

function lastCodePoint(value: string): number {
  const points = [...value]
  return points[points.length - 1]?.codePointAt(0) ?? 0
}

function isCombining(code: number): boolean {
  return (
    (code >= 0x0300 && code <= 0x036f) ||
    (code >= 0x1ab0 && code <= 0x1aff) ||
    (code >= 0x1dc0 && code <= 0x1dff) ||
    (code >= 0x20d0 && code <= 0x20ff) ||
    (code >= 0xfe20 && code <= 0xfe2f)
  )
}

function isRegionalIndicator(code: number): boolean {
  return code >= 0x1f1e6 && code <= 0x1f1ff
}

/** Approximate grapheme clustering for runtimes without `Intl.Segmenter`. */
function fallbackGraphemes(value: string): string[] {
  const clusters: string[] = []
  for (const char of value) {
    const code = char.codePointAt(0)!
    const previous = clusters[clusters.length - 1]
    const previousCode = previous === undefined ? 0 : lastCodePoint(previous)
    const joinsPrevious =
      previous !== undefined &&
      (previousCode === ZERO_WIDTH_JOINER ||
        code === ZERO_WIDTH_JOINER ||
        isCombining(code) ||
        (code >= 0xfe00 && code <= 0xfe0f) ||
        (code >= 0xe0100 && code <= 0xe01ef) ||
        (code >= 0x1f3fb && code <= 0x1f3ff) ||
        code === 0x20e3 ||
        (code >= 0xe0020 && code <= 0xe007f) ||
        (isRegionalIndicator(code) && isRegionalIndicator(previousCode) && [...previous].filter((item) => isRegionalIndicator(item.codePointAt(0)!)).length % 2 === 1))

    if (joinsPrevious) clusters[clusters.length - 1] = `${previous}${char}`
    else clusters.push(char)
  }
  return clusters
}

/** Splits text into user-perceived characters so emoji and accents stay intact. */
export function splitGraphemes(value: string): string[] {
  if (Segmenter) {
    return [...new Segmenter(undefined, { granularity: "grapheme" }).segment(value)].map((part) => part.segment)
  }
  return fallbackGraphemes(value)
}

export function countGraphemes(value: string): number {
  return splitGraphemes(value).length
}

export function reverseGraphemes(value: string): string {
  return splitGraphemes(value).reverse().join("")
}
