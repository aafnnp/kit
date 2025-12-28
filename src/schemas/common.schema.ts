// ==================== Common Types ====================

/**
 * Base File type
 */
export interface BaseFile {
  id: string
  file: File
  name: string
  size: number
  type: string
  status: "pending" | "processing" | "completed" | "error"
  error?: string
  timestamp: number
  processingTime?: number
}

/**
 * Base Stats type
 */
export interface BaseStats {
  totalFiles: number
  processingTime: number
  averageProcessingTime: number
  totalSize: number
  averageSize: number
}

/**
 * History Entry Base type
 */
export interface HistoryEntryBase {
  id: string
  timestamp: number
  description: string
}

/**
 * Export Options type
 */
export interface ExportOptions {
  format: "json" | "csv" | "txt" | "html" | "zip"
  includeMetadata: boolean
  prettyPrint?: boolean
  filename?: string
}

/**
 * Processing Progress type
 */
export interface ProcessingProgress {
  current: number
  total: number
  percentage: number
  currentFile?: string
}

/**
 * Quality Metrics type
 */
export interface QualityMetrics {
  averageQuality: number
  compressionEfficiency: number
  formatOptimization: number
}

/**
 * Validation Result type
 */
export interface ValidationResult {
  isValid: boolean
  error?: string
  warnings?: string[]
}

/**
 * Base Settings type
 */
export interface BaseSettings {
  outputFormat: string
  quality: number
  preserveMetadata: boolean
  optimizeForWeb: boolean
}

/**
 * Base Template type
 */
export interface BaseTemplate {
  id: string
  name: string
  description: string
  category: string
  tags: string[]
  popularity: number
  settings: Record<string, any>
}

/**
 * Performance Metrics type
 */
export interface PerformanceMetrics {
  averageProcessingTime: number
  totalProcessingTime: number
  throughput: number
}

/**
 * Base Analysis Data type
 */
export interface BaseAnalysisData {
  formatDistribution: Record<string, number>
  sizeDistribution: Record<string, number>
  qualityDistribution: Record<string, number>
  performanceMetrics: PerformanceMetrics
}

/**
 * Drag Drop Config type
 */
export interface DragDropConfig {
  accept?: string | string[]
  maxSize?: number
  maxFiles?: number
  multiple?: boolean
}

/**
 * Processing Error type
 */
export interface ProcessingError extends Error {
  name: string
  message: string
  stack?: string
  code?: string
  details?: any
  recoverable?: boolean
}

/**
 * Shortcut Map type
 * 快捷键映射类型
 */
export type ShortcutMap = Record<string, (e: KeyboardEvent) => void>

/**
 * CSV Row type
 * CSV 行类型
 */
export type CSVRow = Record<string, any>

/**
 * JSON Array type
 * JSON 数组类型
 */
export type JSONArray = any[]
