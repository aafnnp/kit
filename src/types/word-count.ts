// 所有类型声明均从 word-count.tsx 迁移
export interface TextFile {
  id: string
  file: File
  content: string
  name: string
  size: number
  type: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
  analysis?: TextAnalysis
}

export interface TextAnalysis {
  characters: number
  charactersNoSpaces: number
  words: number
  sentences: number
  paragraphs: number
  lines: number
  readingTime: number // in minutes
  averageWordsPerSentence: number
  averageCharactersPerWord: number
  readabilityScore: number
  keywordFrequency: Record<string, number>
  mostCommonWords: Array<{ word: string; count: number }>
  longestWord: string
  shortestWord: string
}

export interface AnalysisSettings {
  includeSpaces: boolean
  countPunctuation: boolean
  wordsPerMinute: number // for reading time calculation
  minWordLength: number // for keyword analysis
  excludeCommonWords: boolean
  language: 'en' | 'zh' | 'auto'
}

export interface AnalysisStats {
  totalFiles: number
  totalCharacters: number
  totalWords: number
  totalSentences: number
  totalParagraphs: number
  averageReadingTime: number
  averageReadabilityScore: number
}
