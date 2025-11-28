import { z } from "zod"

// ==================== Lottery Picker Schemas ====================

/**
 * Selection Mode schema
 */
export const selectionModeSchema = z.enum([
  "single",
  "multiple",
  "weighted",
  "tournament",
  "elimination",
  "round-robin",
])

/**
 * Export Format schema
 */
export const exportFormatSchema = z.enum(["json", "csv", "txt", "xml", "yaml"])

/**
 * Sort By schema
 */
export const sortBySchema = z.enum(["alphabetical", "weight", "category", "random"])

/**
 * Sort Order schema
 */
export const sortOrderSchema = z.enum(["asc", "desc"])

/**
 * Lottery Item schema
 */
export const lotteryItemSchema = z.object({
  id: z.string(),
  value: z.string(),
  weight: z.number(),
  category: z.string().optional(),
  description: z.string().optional(),
  isSelected: z.boolean(),
  selectionCount: z.number(),
  lastSelected: z.date().optional(),
})

/**
 * Filter Settings schema
 */
export const filterSettingsSchema = z.object({
  enabled: z.boolean(),
  minLength: z.number(),
  maxLength: z.number(),
  excludePatterns: z.array(z.string()),
  includePatterns: z.array(z.string()),
  caseSensitive: z.boolean(),
})

/**
 * Sort Settings schema
 */
export const sortSettingsSchema = z.object({
  enabled: z.boolean(),
  sortBy: sortBySchema,
  sortOrder: sortOrderSchema,
})

/**
 * Lottery Settings schema
 */
export const lotterySettingsSchema = z.object({
  selectionMode: selectionModeSchema,
  selectionCount: z.number(),
  allowDuplicates: z.boolean(),
  useWeights: z.boolean(),
  excludePrevious: z.boolean(),
  animationEnabled: z.boolean(),
  soundEnabled: z.boolean(),
  customSeparators: z.array(z.string()),
  filterSettings: filterSettingsSchema,
  sortSettings: sortSettingsSchema,
})

/**
 * Lottery Statistics schema
 */
export const lotteryStatisticsSchema = z.object({
  totalItems: z.number(),
  totalSelections: z.number(),
  averageWeight: z.number(),
  selectionDistribution: z.record(z.string(), z.number()),
  categoryDistribution: z.record(z.string(), z.number()),
  fairnessScore: z.number(),
  randomnessScore: z.number(),
})

/**
 * Lottery Result schema
 */
export const lotteryResultSchema = z.object({
  id: z.string(),
  items: z.array(lotteryItemSchema),
  selectedItems: z.array(lotteryItemSchema),
  selectionMode: selectionModeSchema,
  timestamp: z.date(),
  settings: lotterySettingsSchema,
  statistics: lotteryStatisticsSchema,
})

/**
 * Batch Settings schema
 */
export const batchSettingsSchema = z.object({
  baseSettings: lotterySettingsSchema,
  iterations: z.number(),
  namingPattern: z.string(),
  exportFormat: exportFormatSchema,
  includeAnalysis: z.boolean(),
  trackHistory: z.boolean(),
})

/**
 * Batch Statistics schema
 */
export const batchStatisticsSchema = z.object({
  totalIterations: z.number(),
  successfulIterations: z.number(),
  failedIterations: z.number(),
  averageFairnessScore: z.number(),
  averageRandomnessScore: z.number(),
  totalProcessingTime: z.number(),
  averageProcessingTime: z.number(),
  itemFrequency: z.record(z.string(), z.number()),
})

/**
 * Lottery Batch schema
 */
export const lotteryBatchSchema = z.object({
  id: z.string(),
  name: z.string(),
  results: z.array(lotteryResultSchema),
  settings: batchSettingsSchema,
  status: z.enum(["pending", "processing", "completed", "failed"]),
  progress: z.number(),
  statistics: batchStatisticsSchema,
  createdAt: z.date(),
  completedAt: z.date().optional(),
})

/**
 * Lottery Template schema
 */
export const lotteryTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  items: z.array(z.string()),
  settings: lotterySettingsSchema.partial(),
  useCase: z.array(z.string()),
  examples: z.array(z.string()),
  preview: z.string().optional(),
})

/**
 * Lottery Error schema
 */
export const lotteryErrorSchema = z.object({
  message: z.string(),
  type: z.enum(["items", "settings", "weights", "selection"]),
  severity: z.enum(["error", "warning", "info"]),
})

/**
 * Lottery Validation schema
 */
export const lotteryValidationSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(lotteryErrorSchema),
  warnings: z.array(z.string()),
  suggestions: z.array(z.string()),
  qualityScore: z.number(),
})

// ==================== Type Exports ====================

export type SelectionMode = z.infer<typeof selectionModeSchema>
export type ExportFormat = z.infer<typeof exportFormatSchema>
export type SortBy = z.infer<typeof sortBySchema>
export type SortOrder = z.infer<typeof sortOrderSchema>
export type LotteryItem = z.infer<typeof lotteryItemSchema>
export type FilterSettings = z.infer<typeof filterSettingsSchema>
export type SortSettings = z.infer<typeof sortSettingsSchema>
export type LotterySettings = z.infer<typeof lotterySettingsSchema>
export type LotteryStatistics = z.infer<typeof lotteryStatisticsSchema>
export type LotteryResult = z.infer<typeof lotteryResultSchema>
export type BatchSettings = z.infer<typeof batchSettingsSchema>
export type BatchStatistics = z.infer<typeof batchStatisticsSchema>
export type LotteryBatch = z.infer<typeof lotteryBatchSchema>
export type LotteryTemplate = z.infer<typeof lotteryTemplateSchema>
export type LotteryError = z.infer<typeof lotteryErrorSchema>
export type LotteryValidation = z.infer<typeof lotteryValidationSchema>
