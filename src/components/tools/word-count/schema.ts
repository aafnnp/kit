// ==================== Word Count Types ====================

/**
 * Text Analysis type
 */
export interface textAnalysis {
  characters: number,
  charactersNoSpaces: number,
  words: number,
  sentences: number,
  paragraphs: number,
  lines: number,
  readingTime: number,
  averageWordsPerSentence: number,
  averageCharactersPerWord: number,
  readabilityScore: number,
  keywordFrequency: Record<string, number>,
  mostCommonWords: Array<{
    word: string,
  count: number,
  }>
  longestWord: string,
  shortestWord: string,
}

/**
 * Text File type
 */
export interface textFile {
  id: string,
  file: File,
  content: string,
  name: string,
  size: number,
  type: string,
  status: "pending"| "processing" | "completed" | "error"
  error?: string
  analysis?: textAnalysis
}

/**
 * Analysis Settings type
 */
export interface analysisSettings {
  includeSpaces: boolean,
  countPunctuation: boolean,
  wordsPerMinute: number,
  minWordLength: number,
  excludeCommonWords: boolean,
  language: "en"| "zh" | "auto",
}

/**
 * Analysis Stats type
 */
export interface analysisStats {
  totalFiles: number,
  totalCharacters: number,
  totalWords: number,
  totalSentences: number,
  totalParagraphs: number,
  averageReadingTime: number,
  averageReadabilityScore: number,
}

// ==================== Type Exports ====================

export type TextAnalysis = textAnalysis
export type TextFile = textFile
export type AnalysisSettings = analysisSettings
export type AnalysisStats = analysisStats
