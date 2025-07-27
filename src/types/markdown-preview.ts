// Markdown Preview 相关类型声明
export interface MarkdownFile {
  id: string
  name: string
  content: string
  size: number
  type: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
  processedAt?: Date
  htmlContent?: string
  statistics?: MarkdownStatistics
}

export interface MarkdownStatistics {
  wordCount: number
  characterCount: number
  lineCount: number
  paragraphCount: number
  headingCount: number
  linkCount: number
  imageCount: number
  codeBlockCount: number
  listItemCount: number
  tableCount: number
  readingTime: number
}

export interface PreviewSettings {
  viewMode: 'split' | 'preview' | 'source'
  theme: 'light' | 'dark' | 'auto'
  fontSize: 'small' | 'medium' | 'large'
  lineNumbers: boolean
  wordWrap: boolean
  syntaxHighlighting: boolean
  mathSupport: boolean
  mermaidSupport: boolean
  tableOfContents: boolean
  autoSave: boolean
}

export interface ExportOptions {
  format: 'html' | 'pdf' | 'txt' | 'docx'
  includeCSS: boolean
  includeTableOfContents: boolean
  pageBreaks: boolean
  customCSS?: string
}
