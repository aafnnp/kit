// Markdown TOC 相关类型声明
export interface MarkdownFile {
  id: string
  name: string
  content: string
  size: number
  type: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
  processedAt?: Date
  tocResult?: TOCResult
}

export interface TOCResult {
  toc: string
  headings: Heading[]
  statistics: TOCStatistics
  format: TOCFormat
  settings: TOCSettings
}

export interface Heading {
  level: number
  text: string
  anchor: string
  line: number
  children: Heading[]
}

export interface TOCStatistics {
  totalHeadings: number
  headingsByLevel: Record<number, number>
  maxDepth: number
  averageDepth: number
  duplicateAnchors: string[]
  processingTime: number
}

export interface TOCSettings {
  format: TOCFormat
  maxDepth: number
  minDepth: number
  includeLinks: boolean
  customPrefix: string
  indentStyle: IndentStyle
  bulletStyle: BulletStyle
  caseStyle: CaseStyle
  removeNumbers: boolean
  removeSpecialChars: boolean
  customAnchorPrefix: string
}

export interface TOCTemplate {
  id: string
  name: string
  description: string
  settings: Partial<TOCSettings>
  example: string
}

export type TOCFormat = 'markdown' | 'html' | 'json' | 'plain' | 'numbered'
export type IndentStyle = 'spaces' | 'tabs' | 'none'
export type BulletStyle = 'dash' | 'asterisk' | 'plus' | 'number' | 'custom'
export type CaseStyle = 'original' | 'lowercase' | 'uppercase' | 'title' | 'sentence'
