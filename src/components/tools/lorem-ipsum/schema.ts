// ==================== Lorem Ipsum Types ====================

/**
 * Text Style type
 */
export type textStyle = "classic-latin" | "modern-english" | "tech-jargon" | "business-formal" | "creative-writing" | "academic-paper" | "casual-blog" | "custom"

/**
 * Output Format type
 */
export type outputFormat = "plain" | "html" | "markdown" | "json"

/**
 * Generated Text type
 */
export interface generatedText {
  id: string,
  content: string,
  format: outputFormat,
  style: textStyle,
  wordCount: number,
  paragraphCount: number,
  sentenceCount: number,
  characterCount: number,
  generatedAt: Date,
}

/**
 * Generation Settings type
 */
export interface generationSettings {
  textStyle: textStyle,
  outputFormat: outputFormat,
  paragraphCount: number,
  sentencesPerParagraph: number,
  wordsPerSentence: number,
  includeTitle: boolean,
  titleStyle: "h1"| "h2" | "h3" | "none",
  customWordList: string[],
  useCustomWords: boolean,
  startWithLorem: boolean,
  includeNumbers: boolean,
  includePunctuation: boolean,
}

/**
 * Generation Stats type
 */
export interface generationStats {
  totalGenerated: number,
  totalWords: number,
  totalCharacters: number,
  averageWordsPerParagraph: number,
  averageSentencesPerParagraph: number,
  mostUsedStyle: textStyle,
  generationTime: number,
}

/**
 * Text Preset type
 */
export interface textPreset {
  name: string,
  description: string,
  settings: generationSettings,
}

// ==================== Type Exports ====================

export type TextStyle = textStyle
export type OutputFormat = outputFormat
export type GeneratedText = generatedText
export type GenerationSettings = generationSettings
export type GenerationStats = generationStats
export type TextPreset = textPreset
