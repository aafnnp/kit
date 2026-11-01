const WORDS = [
  "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit", "sed", "do",
  "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore", "magna", "aliqua", "enim",
  "ad", "minim", "veniam", "quis", "nostrud", "exercitation", "ullamco", "laboris", "nisi", "aliquip",
  "ex", "ea", "commodo", "consequat", "duis", "aute", "irure", "in", "reprehenderit", "voluptate",
  "velit", "esse", "cillum", "fugiat", "nulla", "pariatur", "excepteur", "sint", "occaecat",
  "cupidatat", "non", "proident", "sunt", "culpa", "qui", "officia", "deserunt", "mollit", "anim",
  "id", "est", "laborum",
]

export interface LoremOptions {
  paragraphs: number
  sentencesPerParagraph: number
  startWithLorem: boolean
  seed?: number
}

/** Small deterministic PRNG so tests can assert on generated text. */
function mulberry32(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function words(random: () => number, count: number): string {
  const result: string[] = []
  for (let i = 0; i < count; i += 1) result.push(WORDS[Math.floor(random() * WORDS.length)]!)
  return result.join(" ")
}

function sentence(random: () => number): string {
  const length = 6 + Math.floor(random() * 9)
  const text = words(random, length)
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}.`
}

export function generateLorem(options: LoremOptions): string {
  const random = mulberry32(options.seed ?? Math.floor(Math.random() * 0xffffffff))
  const paragraphs: string[] = []

  for (let p = 0; p < Math.max(1, options.paragraphs); p += 1) {
    const sentences: string[] = []
    for (let s = 0; s < Math.max(1, options.sentencesPerParagraph); s += 1) {
      if (p === 0 && s === 0 && options.startWithLorem) {
        sentences.push(`Lorem ipsum dolor sit amet, ${sentence(random).toLowerCase()}`)
      } else {
        sentences.push(sentence(random))
      }
    }
    paragraphs.push(sentences.join(" "))
  }

  return paragraphs.join("\n\n")
}
