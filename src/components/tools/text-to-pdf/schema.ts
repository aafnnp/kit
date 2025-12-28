// ==================== Text to PDF Types ====================

/**
 * Page Size type
 */
export type pageSize = "A4" | "A3" | "A5" | "Letter" | "Legal" | "Tabloid"

/**
 * Font Family type
 */
export type fontFamily = "Arial" | "Times" | "Courier" | "Helvetica" | "Georgia" | "Verdana"

/**
 * Text Align type
 */
export type textAlign = "left" | "center" | "right" | "justify"

/**
 * PDF Settings type
 */
export interface pdfSettings {
  pageSize: pageSize,
  orientation: "portrait"| "landscape",
  margins: {
    top: number,
    right: number,
    bottom: number,
    left: number,
  },
  font: {
    family: fontFamily,
    size: number,
    lineHeight: number,
  },
  styling: {
    textAlign: textAlign,
    textColor: string,
    backgroundColor: string,
    enableSyntaxHighlighting: boolean,
  },
  header: {
    enabled: boolean,
    text: string,
    fontSize: number,
    alignment: textAlign,
  },
  footer: {
    enabled: boolean,
    text: string,
    fontSize: number,
    alignment: textAlign,
    showPageNumbers: boolean,
  },
  tableOfContents: {
    enabled: boolean,
    title: string,
    maxDepth: number,
  },
  metadata: {
    title: string,
    author: string,
    subject: string,
    keywords: string,
  }
}

/**
 * PDF Result type
 */
export interface pdfResult {
  blob: Blob,
  url: string,
  filename: string,
  size: number,
  pageCount: number,
  generationTime: number,
  settings: pdfSettings,
}

/**
 * Text File type
 */
export interface textFile {
  id: string,
  name: string,
  content: string,
  size: number,
  type: string,
  status: "pending"| "processing" | "completed" | "error"
  error?: string
  processedAt?: Date
  pdfResult?: pdfResult
}

/**
 * PDF Statistics type
 */
export interface pdfStatistics {
  totalFiles: number,
  totalPages: number,
  totalSize: number,
  averageGenerationTime: number,
  successfulConversions: number,
  failedConversions: number,
}

/**
 * PDF Template type
 */
export interface pdfTemplate {
  id: string,
  name: string,
  description: string,
  settings: Partial<pdfSettings>,
  preview: string,
}

// ==================== Type Exports ====================

export type PageSize = pageSize
export type FontFamily = fontFamily
export type TextAlign = textAlign
export type PDFSettings = pdfSettings
export type PDFResult = pdfResult
export type TextFile = textFile
export type PDFStatistics = pdfStatistics
export type PDFTemplate = pdfTemplate
export type PdfSettings = pdfSettings
export type PdfResult = pdfResult
export type PdfStatistics = pdfStatistics
export type PdfTemplate = pdfTemplate
