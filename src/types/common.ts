// src/types/common.ts
export interface BaseFile {
  id: string
  file: File
  name: string
  size: number
  type: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
  timestamp: number
  processingTime?: number
}

export interface BaseStats {
  totalFiles: number
  processingTime: number
  averageProcessingTime: number
  totalSize: number
  averageSize: number
}

export interface HistoryEntryBase {
  id: string
  timestamp: number
  description: string
}

export interface ExportOptions {
  format: 'json' | 'csv' | 'txt' | 'html' | 'zip'
  includeMetadata: boolean
  prettyPrint?: boolean
  filename?: string
}

export interface ProcessingProgress {
  current: number
  total: number
  percentage: number
  currentFile?: string
}

export interface QualityMetrics {
  averageQuality: number
  compressionEfficiency: number
  formatOptimization: number
}

export interface ValidationResult {
  isValid: boolean
  error?: string
  warnings?: string[]
}

// 通用设置接口
export interface BaseSettings {
  outputFormat: string
  quality: number
  preserveMetadata: boolean
  optimizeForWeb: boolean
}

// 通用模板接口
export interface BaseTemplate {
  id: string
  name: string
  description: string
  category: string
  tags: string[]
  popularity: number
  settings: Record<string, any>
}

// 通用分析数据接口
export interface BaseAnalysisData {
  formatDistribution: Record<string, number>
  sizeDistribution: Record<string, number>
  qualityDistribution: Record<string, number>
  performanceMetrics: {
    averageProcessingTime: number
    totalProcessingTime: number
    throughput: number
  }
}

// 键盘快捷键类型
export type ShortcutHandler = (e: KeyboardEvent) => void
export type ShortcutMap = Record<string, ShortcutHandler>

// 拖放配置
export interface DragDropConfig {
  accept?: string | string[]
  maxSize?: number
  maxFiles?: number
  multiple?: boolean
}

// 通用错误类型
export interface ProcessingError extends Error {
  code?: string
  details?: any
  recoverable?: boolean
}