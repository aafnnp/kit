// Lorem Ipsum 相关类型声明
export interface GeneratedText {
  id: string
  content: string
  format: OutputFormat
  style: TextStyle
  wordCount: number
  paragraphCount: number
  sentenceCount: number
  characterCount: number
  generatedAt: Date
}

export interface GenerationSettings {
  textStyle: TextStyle
  outputFormat: OutputFormat
  paragraphCount: number
  sentencesPerParagraph: number
  wordsPerSentence: number
  includeTitle: boolean
  titleStyle: 'h1' | 'h2' | 'h3' | 'none'
  customWordList: string[]
  useCustomWords: boolean
  startWithLorem: boolean
  includeNumbers: boolean
  includePunctuation: boolean
}

export interface GenerationStats {
  totalGenerated: number
  totalWords: number
  totalCharacters: number
  averageWordsPerParagraph: number
  averageSentencesPerParagraph: number
  mostUsedStyle: TextStyle
  generationTime: number
}

export interface TextPreset {
  name: string
  description: string
  settings: Partial<GenerationSettings>
}

export type TextStyle =
  | 'classic-latin'
  | 'modern-english'
  | 'tech-jargon'
  | 'business-formal'
  | 'creative-writing'
  | 'academic-paper'
  | 'casual-blog'
  | 'custom'

export type OutputFormat = 'plain' | 'html' | 'markdown' | 'json'
