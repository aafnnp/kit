import { z } from "zod"

// ==================== Cron Parser Schemas ====================

/**
 * Export Format schema
 */
export const exportFormatSchema = z.enum(["json", "csv", "txt", "xml"])

/**
 * Cron Field schema
 */
export const cronFieldSchema = z.object({
  raw: z.string(),
  values: z.array(z.number()),
  type: z.enum(["wildcard", "specific", "range", "step", "list", "invalid"]),
  description: z.string(),
  isValid: z.boolean(),
  error: z.string().optional(),
})

/**
 * Cron Fields schema
 */
export const cronFieldsSchema = z.object({
  minute: cronFieldSchema,
  hour: cronFieldSchema,
  dayOfMonth: cronFieldSchema,
  month: cronFieldSchema,
  dayOfWeek: cronFieldSchema,
  year: cronFieldSchema.optional(),
})

/**
 * Cron Frequency schema
 */
export const cronFrequencySchema = z.object({
  type: z.enum(["once", "minutely", "hourly", "daily", "weekly", "monthly", "yearly", "custom"]),
  interval: z.number(),
  description: z.string(),
})

/**
 * Cron Expression schema
 */
export const cronExpressionSchema = z.object({
  id: z.string(),
  expression: z.string(),
  description: z.string(),
  isValid: z.boolean(),
  error: z.string().optional(),
  parsedFields: cronFieldsSchema,
  humanReadable: z.string(),
  nextRuns: z.array(z.date()),
  frequency: cronFrequencySchema,
  timezone: z.string(),
  createdAt: z.date(),
})

/**
 * Cron Statistics schema
 */
export const cronStatisticsSchema = z.object({
  totalExpressions: z.number(),
  validCount: z.number(),
  invalidCount: z.number(),
  frequencyDistribution: z.record(z.string(), z.number()),
  fieldComplexity: z.record(z.string(), z.number()),
  averageNextRuns: z.number(),
  successRate: z.number(),
})

/**
 * Cron Settings schema
 */
export const cronSettingsSchema = z.object({
  timezone: z.string(),
  includeSeconds: z.boolean(),
  includeYear: z.boolean(),
  maxNextRuns: z.number(),
  validateOnly: z.boolean(),
  exportFormat: exportFormatSchema,
  realTimeValidation: z.boolean(),
  showExamples: z.boolean(),
})

/**
 * Cron Batch schema
 */
export const cronBatchSchema = z.object({
  id: z.string(),
  expressions: z.array(cronExpressionSchema),
  count: z.number(),
  settings: cronSettingsSchema,
  createdAt: z.date(),
  statistics: cronStatisticsSchema,
})

/**
 * Cron Template schema
 */
export const cronTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  expression: z.string(),
  description: z.string(),
  category: z.string(),
  frequency: z.string(),
  examples: z.array(z.string()),
})

/**
 * Cron Validation schema
 */
export const cronValidationSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(z.string()),
  warnings: z.array(z.string()),
  suggestions: z.array(z.string()),
})

// ==================== Type Exports ====================

export type ExportFormat = z.infer<typeof exportFormatSchema>
export type CronField = z.infer<typeof cronFieldSchema>
export type CronFields = z.infer<typeof cronFieldsSchema>
export type CronFrequency = z.infer<typeof cronFrequencySchema>
export type CronExpression = z.infer<typeof cronExpressionSchema>
export type CronStatistics = z.infer<typeof cronStatisticsSchema>
export type CronSettings = z.infer<typeof cronSettingsSchema>
export type CronBatch = z.infer<typeof cronBatchSchema>
export type CronTemplate = z.infer<typeof cronTemplateSchema>
export type CronValidation = z.infer<typeof cronValidationSchema>
