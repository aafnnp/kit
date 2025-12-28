// ==================== Shared Types ====================
// 这些类型在多个工具中共享使用

/**
 * Common Export Format type
 */
export type ExportFormat = "json" | "csv" | "xml" | "txt"

/**
 * Common Batch Statistics type
 * 注意：不同工具可能有不同的 BatchStatistics 结构
 * 如果需要特定结构，请在各自的 schema 文件中定义
 */
export interface BaseBatchStatistics {
  totalProcessed: number
  validCount: number
  invalidCount: number
  successRate: number
}

/**
 * Common Processing Settings base type
 * 注意：不同工具可能有不同的 ProcessingSettings 结构
 * 如果需要特定结构，请在各自的 schema 文件中定义
 */
export interface BaseProcessingSettings {
  exportFormat: ExportFormat
}

