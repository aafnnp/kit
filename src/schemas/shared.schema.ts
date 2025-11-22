import { z } from "zod"

// ==================== Shared Schemas ====================
// 这些类型在多个工具中共享使用

/**
 * Common Export Format schema
 */
export const exportFormatSchema = z.enum(["json", "csv", "xml", "txt"])

/**
 * Common Export Format type
 */
export type ExportFormat = z.infer<typeof exportFormatSchema>

/**
 * Common Batch Statistics schema
 * 注意：不同工具可能有不同的 BatchStatistics 结构
 * 如果需要特定结构，请在各自的 schema 文件中定义
 */
export const baseBatchStatisticsSchema = z.object({
  totalProcessed: z.number(),
  validCount: z.number(),
  invalidCount: z.number(),
  successRate: z.number(),
})

/**
 * Common Processing Settings base schema
 * 注意：不同工具可能有不同的 ProcessingSettings 结构
 * 如果需要特定结构，请在各自的 schema 文件中定义
 */
export const baseProcessingSettingsSchema = z.object({
  exportFormat: exportFormatSchema,
})

