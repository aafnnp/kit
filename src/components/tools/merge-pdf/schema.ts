// ==================== Merge PDF Types ====================

/**
 * Export Format type
 */
export type exportFormat = "pdf" | "zip"

/**
 * Page Order type
 */
export type pageOrder = "original" | "reverse" | "custom"

/**
 * Quality type
 */
export type quality = "high" | "medium" | "low"

/**
 * Watermark Position type
 */
export type watermarkPosition = "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right"

/**
 * PDF Permissions type
 */
export interface pdfPermissions {
  canPrint: boolean,
  canModify: boolean,
  canCopy: boolean,
  canAnnotate: boolean,
  canFillForms: boolean,
  canExtractForAccessibility: boolean,
  canAssemble: boolean,
  canPrintHighQuality: boolean,
}

/**
 * PDF Page Info type
 */
export interface pdfPageInfo {
  pageNumber: number,
  width: number,
  height: number,
  rotation: number,
  selected: boolean
  thumbnail?: string
}

/**
 * PDF Metadata type
 */
export interface pdfMetadata {
  title?: string
  author?: string
  subject?: string
  creator?: string
  producer?: string
  creationDate?: Date
  modificationDate?: Date
  keywords?: string[]
  pageCount: number,
  fileSize: number
  version?: string
  encrypted: boolean
  permissions?: pdfPermissions
}

/**
 * PDF File type
 */
export interface pdfFile {
  id: string,
  file: File,
  name: string,
  size: number
  pageCount?: number
  isValid: boolean
  error?: string
  thumbnail?: string
  metadata?: pdfMetadata
  pages?: pdfPageInfo[]
  createdAt: Date,
}

/**
 * Page Range type
 */
export interface pageRange {
  fileId: string,
  startPage: number,
  endPage: number,
}

/**
 * Watermark Settings type
 */
export interface watermarkSettings {
  enabled: boolean,
  text: string,
  opacity: number,
  position: watermarkPosition,
  fontSize: number,
  color: string,
}

/**
 * Security Settings type
 */
export interface securitySettings {
  enabled: boolean
  userPassword?: string
  ownerPassword?: string
  permissions: pdfPermissions,
}

/**
 * Merge Settings type
 */
export interface mergeSettings {
  outputFileName: string,
  pageOrder: pageOrder,
  includeBookmarks: boolean,
  includeMetadata: boolean,
  optimizeSize: boolean,
  removeBlankPages: boolean
  pageRange?: pageRange[]
  watermark?: watermarkSettings
  security?: securitySettings
  quality: quality,
  compression: boolean,
}

/**
 * Merge Statistics type
 */
export interface mergeStatistics {
  totalFiles: number,
  totalPages: number,
  totalSize: number,
  compressionRatio: number,
  processingTime: number,
  qualityScore: number,
  optimizationSavings: number,
}

/**
 * Merge Result type
 */
export interface mergeResult {
  fileName: string,
  fileSize: number,
  pageCount: number,
  processingTime: number
  downloadUrl?: string
  statistics: mergeStatistics,
}

/**
 * Merge Operation type
 */
export interface mergeOperation {
  id: string,
  files: pdfFile[],
  settings: mergeSettings
  result?: mergeResult
  status: "pending"| "processing" | "completed" | "failed",
  progress: number
  error?: string
  createdAt: Date
  completedAt?: Date
}

/**
 * Processing Settings type
 */
export interface processingSettings {
  maxFileSize: number,
  maxFiles: number,
  allowedFormats: string[],
  autoOptimize: boolean,
  preserveQuality: boolean,
  enableParallelProcessing: boolean,
  exportFormat: exportFormat,
  realTimePreview: boolean,
}

/**
 * PDF Template type
 */
export interface pdfTemplate {
  id: string,
  name: string,
  description: string,
  category: string,
  settings: mergeSettings,
  useCase: string[],
  examples: string[],
}

/**
 * PDF Error type
 */
export interface pdfError {
  message: string,
  type: "format"| "size" | "corruption" | "security" | "compatibility",
  severity: "error"| "warning" | "info",
}

/**
 * PDF Validation type
 */
export interface pdfValidation {
  isValid: boolean,
  errors: pdfError[],
  warnings: string[],
  suggestions: string[],
}

// ==================== Type Exports ====================

export type ExportFormat = exportFormat
export type PageOrder = pageOrder
export type Quality = quality
export type WatermarkPosition = watermarkPosition
export type PDFPermissions = pdfPermissions
export type PDFPageInfo = pdfPageInfo
export type PDFMetadata = pdfMetadata
export type PDFFile = pdfFile
export type PageRange = pageRange
export type WatermarkSettings = watermarkSettings
export type SecuritySettings = securitySettings
export type MergeSettings = mergeSettings
export type MergeStatistics = mergeStatistics
export type MergeResult = mergeResult
export type MergeOperation = mergeOperation
export type ProcessingSettings = processingSettings
export type PDFTemplate = pdfTemplate
export type PDFError = pdfError
export type PDFValidation = pdfValidation
export type PdfPermissions = pdfPermissions
export type PdfPageInfo = pdfPageInfo
export type PdfMetadata = pdfMetadata
export type PdfFile = pdfFile
export type PdfTemplate = pdfTemplate
export type PdfError = pdfError
export type PdfValidation = pdfValidation
