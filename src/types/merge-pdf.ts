// Merge PDF 相关类型声明
export interface PDFFile {
  id: string
  file: File
  name: string
  size: number
  pageCount?: number
  isValid: boolean
  error?: string
  thumbnail?: string
  metadata?: PDFMetadata
  pages?: PDFPageInfo[]
  createdAt: Date
}

export interface PDFPageInfo {
  pageNumber: number
  width: number
  height: number
  rotation: number
  selected: boolean
  thumbnail?: string
}

export interface PDFMetadata {
  title?: string
  author?: string
  subject?: string
  creator?: string
  producer?: string
  creationDate?: Date
  modificationDate?: Date
  keywords?: string[]
  pageCount: number
  fileSize: number
  version?: string
  encrypted: boolean
  permissions?: PDFPermissions
}

export interface PDFPermissions {
  canPrint: boolean
  canModify: boolean
  canCopy: boolean
  canAnnotate: boolean
  canFillForms: boolean
  canExtractForAccessibility: boolean
  canAssemble: boolean
  canPrintHighQuality: boolean
}

export interface MergeOperation {
  id: string
  files: PDFFile[]
  settings: MergeSettings
  result?: MergeResult
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  error?: string
  createdAt: Date
  completedAt?: Date
}

export interface MergeResult {
  fileName: string
  fileSize: number
  pageCount: number
  processingTime: number
  downloadUrl?: string
  statistics: MergeStatistics
}

export interface MergeStatistics {
  totalFiles: number
  totalPages: number
  totalSize: number
  compressionRatio: number
  processingTime: number
  qualityScore: number
  optimizationSavings: number
}

export interface MergeSettings {
  outputFileName: string
  pageOrder: 'original' | 'reverse' | 'custom'
  includeBookmarks: boolean
  includeMetadata: boolean
  optimizeSize: boolean
  removeBlankPages: boolean
  pageRange?: PageRange[]
  watermark?: WatermarkSettings
  security?: SecuritySettings
  quality: 'high' | 'medium' | 'low'
  compression: boolean
}

export interface PageRange {
  fileId: string
  startPage: number
  endPage: number
}

export interface WatermarkSettings {
  enabled: boolean
  text: string
  opacity: number
  position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  fontSize: number
  color: string
}

export interface SecuritySettings {
  enabled: boolean
  userPassword?: string
  ownerPassword?: string
  permissions: PDFPermissions
}

export interface ProcessingSettings {
  maxFileSize: number
  maxFiles: number
  allowedFormats: string[]
  autoOptimize: boolean
  preserveQuality: boolean
  enableParallelProcessing: boolean
  exportFormat: ExportFormat
  realTimePreview: boolean
}

export interface PDFTemplate {
  id: string
  name: string
  description: string
  category: string
  settings: Partial<MergeSettings>
  useCase: string[]
  examples: string[]
}

export interface PDFValidation {
  isValid: boolean
  errors: PDFError[]
  warnings: string[]
  suggestions: string[]
}

export interface PDFError {
  message: string
  type: 'format' | 'size' | 'corruption' | 'security' | 'compatibility'
  severity: 'error' | 'warning' | 'info'
}

export type ExportFormat = 'pdf' | 'zip'
