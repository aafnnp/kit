import { z } from "zod"

// ==================== Common Schemas ====================

/**
 * Base File schema
 */
export const baseFileSchema = z.object({
  id: z.string(),
  file: z.instanceof(File),
  name: z.string(),
  size: z.number(),
  type: z.string(),
  status: z.enum(["pending", "processing", "completed", "error"]),
  error: z.string().optional(),
  timestamp: z.number(),
  processingTime: z.number().optional(),
})

/**
 * Base Stats schema
 */
export const baseStatsSchema = z.object({
  totalFiles: z.number(),
  processingTime: z.number(),
  averageProcessingTime: z.number(),
  totalSize: z.number(),
  averageSize: z.number(),
})

/**
 * History Entry Base schema
 */
export const historyEntryBaseSchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  description: z.string(),
})

/**
 * Export Options schema
 */
export const exportOptionsSchema = z.object({
  format: z.enum(["json", "csv", "txt", "html", "zip"]),
  includeMetadata: z.boolean(),
  prettyPrint: z.boolean().optional(),
  filename: z.string().optional(),
})

/**
 * Processing Progress schema
 */
export const processingProgressSchema = z.object({
  current: z.number(),
  total: z.number(),
  percentage: z.number(),
  currentFile: z.string().optional(),
})

/**
 * Quality Metrics schema
 */
export const qualityMetricsSchema = z.object({
  averageQuality: z.number(),
  compressionEfficiency: z.number(),
  formatOptimization: z.number(),
})

/**
 * Validation Result schema
 */
export const validationResultSchema = z.object({
  isValid: z.boolean(),
  error: z.string().optional(),
  warnings: z.array(z.string()).optional(),
})

/**
 * Base Settings schema
 */
export const baseSettingsSchema = z.object({
  outputFormat: z.string(),
  quality: z.number(),
  preserveMetadata: z.boolean(),
  optimizeForWeb: z.boolean(),
})

/**
 * Base Template schema
 */
export const baseTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  tags: z.array(z.string()),
  popularity: z.number(),
  settings: z.record(z.string(), z.any()),
})

/**
 * Performance Metrics schema
 */
export const performanceMetricsSchema = z.object({
  averageProcessingTime: z.number(),
  totalProcessingTime: z.number(),
  throughput: z.number(),
})

/**
 * Base Analysis Data schema
 */
export const baseAnalysisDataSchema = z.object({
  formatDistribution: z.record(z.string(), z.number()),
  sizeDistribution: z.record(z.string(), z.number()),
  qualityDistribution: z.record(z.string(), z.number()),
  performanceMetrics: performanceMetricsSchema,
})

/**
 * Drag Drop Config schema
 */
export const dragDropConfigSchema = z.object({
  accept: z.union([z.string(), z.array(z.string())]).optional(),
  maxSize: z.number().optional(),
  maxFiles: z.number().optional(),
  multiple: z.boolean().optional(),
})

/**
 * Processing Error schema
 */
export const processingErrorSchema = z.object({
  name: z.string(),
  message: z.string(),
  stack: z.string().optional(),
  code: z.string().optional(),
  details: z.any().optional(),
  recoverable: z.boolean().optional(),
})

// ==================== Type Exports ====================

/**
 * Type inference from zod schemas
 */
export type BaseFile = z.infer<typeof baseFileSchema>
export type BaseStats = z.infer<typeof baseStatsSchema>
export type HistoryEntryBase = z.infer<typeof historyEntryBaseSchema>
export type ExportOptions = z.infer<typeof exportOptionsSchema>
export type ProcessingProgress = z.infer<typeof processingProgressSchema>
export type QualityMetrics = z.infer<typeof qualityMetricsSchema>
export type ValidationResult = z.infer<typeof validationResultSchema>
export type BaseSettings = z.infer<typeof baseSettingsSchema>
export type BaseTemplate = z.infer<typeof baseTemplateSchema>
export type PerformanceMetrics = z.infer<typeof performanceMetricsSchema>
export type BaseAnalysisData = z.infer<typeof baseAnalysisDataSchema>
export type DragDropConfig = z.infer<typeof dragDropConfigSchema>
export type ProcessingError = z.infer<typeof processingErrorSchema> & Error

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
