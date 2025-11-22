import { z } from "zod"

// ==================== Unix Timestamp Schemas ====================

/**
 * Timestamp Format schema
 */
export const timestampFormatSchema = z.enum(["unix", "unix-ms", "iso8601", "rfc2822", "local", "utc", "custom"])

/**
 * Export Format schema
 */
export const exportFormatSchema = z.enum(["json", "csv", "txt", "xml"])

/**
 * Timestamp Output schema
 */
export const timestampOutputSchema = z.object({
  format: timestampFormatSchema,
  value: z.string(),
  timezone: z.string(),
  isValid: z.boolean(),
  relativeTime: z.string().optional(),
})

/**
 * Timestamp Item schema
 */
export const timestampItemSchema = z.object({
  id: z.string(),
  input: z.string(),
  inputType: timestampFormatSchema,
  outputs: z.array(timestampOutputSchema),
  timezone: z.string(),
  status: z.enum(["pending", "processing", "completed", "error"]),
  error: z.string().optional(),
  processedAt: z.date().optional(),
  isValid: z.boolean(),
})

/**
 * Timestamp Statistics schema
 */
export const timestampStatisticsSchema = z.object({
  totalProcessed: z.number(),
  validCount: z.number(),
  invalidCount: z.number(),
  formatDistribution: z.record(z.string(), z.number()),
  timezoneDistribution: z.record(z.string(), z.number()),
  averageProcessingTime: z.number(),
  totalProcessingTime: z.number(),
  successRate: z.number(),
})

/**
 * Timestamp Settings schema
 */
export const timestampSettingsSchema = z.object({
  inputFormat: timestampFormatSchema,
  outputFormats: z.array(timestampFormatSchema),
  timezone: z.string(),
  includeRelativeTime: z.boolean(),
  includeTimestamp: z.boolean(),
  batchProcessing: z.boolean(),
  realTimeConversion: z.boolean(),
  exportFormat: exportFormatSchema,
  autoRefresh: z.boolean(),
  refreshInterval: z.number(),
})

/**
 * Timestamp Batch schema
 */
export const timestampBatchSchema = z.object({
  id: z.string(),
  items: z.array(timestampItemSchema),
  count: z.number(),
  settings: timestampSettingsSchema,
  createdAt: z.date(),
  statistics: timestampStatisticsSchema,
})

/**
 * Timestamp Template schema
 */
export const timestampTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  settings: timestampSettingsSchema.partial(),
  formats: z.array(timestampFormatSchema),
})

/**
 * Current Time schema
 */
export const currentTimeSchema = z.object({
  unix: z.number(),
  unixMs: z.number(),
  iso: z.string(),
  rfc2822: z.string(),
  local: z.string(),
  utc: z.string(),
  timezone: z.string(),
  relativeTime: z.string(),
})

/**
 * Timezone Info schema
 */
export const timezoneInfoSchema = z.object({
  name: z.string(),
  offset: z.string(),
  abbreviation: z.string(),
  isDST: z.boolean(),
})

// ==================== Type Exports ====================

export type TimestampFormat = z.infer<typeof timestampFormatSchema>
export type ExportFormat = z.infer<typeof exportFormatSchema>
export type TimestampOutput = z.infer<typeof timestampOutputSchema>
export type TimestampItem = z.infer<typeof timestampItemSchema>
export type TimestampStatistics = z.infer<typeof timestampStatisticsSchema>
export type TimestampSettings = z.infer<typeof timestampSettingsSchema>
export type TimestampBatch = z.infer<typeof timestampBatchSchema>
export type TimestampTemplate = z.infer<typeof timestampTemplateSchema>
export type CurrentTime = z.infer<typeof currentTimeSchema>
export type TimezoneInfo = z.infer<typeof timezoneInfoSchema>
