// ==================== Markdown TOC Types ====================

/**
 * TOC Format type
 */
export type tocFormat = "markdown" | "html" | "json" | "plain" | "numbered"

/**
 * Indent Style type
 */
export type indentStyle = "spaces" | "tabs" | "none"

/**
 * Bullet Style type
 */
export type bulletStyle = "dash" | "asterisk" | "plus" | "number" | "custom"

/**
 * Case Style type
 */
export type caseStyle = "original" | "lowercase" | "uppercase" | "title" | "sentence"

/**
 * Heading type (recursive)
 */
export interface heading {
  level: number,
  text: string,
  anchor: string,
  line: number,
  children: heading[],
}

/**
 * TOC Statistics type
 */
export interface tocStatistics {
  totalHeadings: number,
  headingsByLevel: Record<string, number>,
  maxDepth: number,
  averageDepth: number,
  duplicateAnchors: string[],
  processingTime: number,
}

/**
 * TOC Settings type
 */
export interface tocSettings {
  format: tocFormat,
  maxDepth: number,
  minDepth: number,
  includeLinks: boolean,
  customPrefix: string,
  indentStyle: indentStyle,
  bulletStyle: bulletStyle,
  caseStyle: caseStyle,
  removeNumbers: boolean,
  removeSpecialChars: boolean,
  customAnchorPrefix: string,
}

/**
 * TOC Result type
 */
export interface tocResult {
  toc: string,
  headings: heading[],
  statistics: tocStatistics,
  format: tocFormat,
  settings: tocSettings,
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
  tocResult?: tocResult
}

/**
 * TOC Template type
 */
export interface tocTemplate {
  id: string,
  name: string,
  description: string,
  settings: tocSettings,
  example: string,
}

// ==================== Type Exports ====================

export type TOCFormat = tocFormat
export type IndentStyle = indentStyle
export type BulletStyle = bulletStyle
export type CaseStyle = caseStyle
export type Heading = heading
export type TOCStatistics = tocStatistics
export type TOCSettings = tocSettings
export type TOCResult = tocResult
export type MarkdownFile = markdownFile
export type TOCTemplate = tocTemplate
export type TocFormat = tocFormat
export type TocStatistics = tocStatistics
export type TocSettings = tocSettings
export type TocResult = tocResult
export type TocTemplate = tocTemplate
