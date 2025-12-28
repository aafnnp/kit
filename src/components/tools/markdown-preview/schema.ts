// ==================== Markdown Preview Types ====================

/**
 * Markdown Statistics type
 */
export interface markdownStatistics {
  wordCount: number,
  characterCount: number,
  lineCount: number,
  paragraphCount: number,
  headingCount: number,
  linkCount: number,
  imageCount: number,
  codeBlockCount: number,
  listItemCount: number,
  tableCount: number,
  readingTime: number,
}

/**
 * Markdown File type
 */
export interface markdownFile {
  id: string,
  name: string,
  content: string,
  size: number,
  type: string,
  status: "pending"| "processing" | "completed" | "error"
  error?: string
  processedAt?: Date
  htmlContent?: string
  statistics?: markdownStatistics
}

/**
 * Preview Settings type
 */
export interface previewSettings {
  viewMode: "split"| "preview" | "source",
  theme: "light"| "dark" | "auto",
  fontSize: "small"| "medium" | "large",
  lineNumbers: boolean,
  wordWrap: boolean,
  syntaxHighlighting: boolean,
  mathSupport: boolean,
  mermaidSupport: boolean,
  tableOfContents: boolean,
  autoSave: boolean,
}

/**
 * Export Options type
 */
export interface exportOptions {
  format: "html"| "pdf" | "txt" | "docx",
  includeCSS: boolean,
  includeTableOfContents: boolean,
  pageBreaks: boolean
  customCSS?: string
}

// ==================== Type Exports ====================

export type MarkdownStatistics = markdownStatistics
export type MarkdownFile = markdownFile
export type PreviewSettings = previewSettings
export type ExportOptions = exportOptions
