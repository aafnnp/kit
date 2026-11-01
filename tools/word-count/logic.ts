export interface TextStats {
  characters: number
  charactersNoSpaces: number
  words: number
  lines: number
  sentences: number
  paragraphs: number
  readingMinutes: number
}

const CJK = /[\u3400-\u4DBF\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]/g

export function textStats(text: string, minutesPerWord = 200): TextStats {
  if (!text) {
    return { characters: 0, charactersNoSpaces: 0, words: 0, lines: 0, sentences: 0, paragraphs: 0, readingMinutes: 0 }
  }

  const characters = [...text].length
  const charactersNoSpaces = [...text.replace(/\s/g, "")].length
  const cjk = text.match(CJK)?.length ?? 0
  const latin = text
    .replace(CJK, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
  const words = latin + cjk
  const lines = text.split(/\r?\n/).length
  const sentences = text
    .split(/[.!?。！？…]+/)
    .map((part) => part.trim())
    .filter(Boolean).length
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean).length
  const readingMinutes = Math.max(1, Math.ceil(words / minutesPerWord))

  return { characters, charactersNoSpaces, words, lines, sentences, paragraphs, readingMinutes }
}

const STOP_WORDS = new Set([
  "the", "and", "for", "that", "with", "this", "from", "are", "was", "were", "have", "has", "had",
  "you", "your", "not", "but", "they", "their", "them", "then", "than", "there", "here", "what",
  "when", "where", "which", "who", "will", "would", "can", "could", "should", "about", "into",
  "than", "over", "into", "also", "just", "very", "more", "most", "some", "such", "only", "own",
])

export interface WordFrequency {
  word: string
  count: number
}

export function topWords(text: string, limit = 5): WordFrequency[] {
  const counts = new Map<string, number>()
  const words = text.toLowerCase().match(/[a-z][a-z0-9'-]{1,}/g) ?? []
  for (const word of words) {
    if (STOP_WORDS.has(word)) continue
    counts.set(word, (counts.get(word) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word))
    .slice(0, limit)
}
