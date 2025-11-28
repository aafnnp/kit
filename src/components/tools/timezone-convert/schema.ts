import { z } from "zod"

// ==================== Timezone Convert Schemas ====================

/**
 * Date Format schema
 */
export const dateFormatSchema = z.enum(["iso", "us", "eu", "local", "custom"])

/**
 * Time Format schema
 */
export const timeFormatSchema = z.enum(["12h", "24h"])

/**
 * Export Format schema
 */
export const exportFormatSchema = z.enum(["json", "csv", "txt", "xml"])

/**
 * Timezone Info schema
 */
export const timezoneInfoSchema = z.object({
  name: z.string(),
  abbreviation: z.string(),
  offset: z.string(),
  offsetMinutes: z.number(),
  isDST: z.boolean(),
  currentTime: z.string(),
  utcOffset: z.string(),
})

/**
 * Timezone Conversion schema
 */
export const timezoneConversionSchema = z.object({
  id: z.string(),
  inputTime: z.string(),
  inputTimezone: z.string(),
  outputTimezone: z.string(),
  inputDate: z.date(),
  outputDate: z.date(),
  outputTime: z.string(),
  timeDifference: z.number(),
  isDST: z.boolean(),
  isValid: z.boolean(),
  error: z.string().optional(),
  createdAt: z.date(),
})

/**
 * World Clock schema
 */
export const worldClockSchema = z.object({
  timezone: z.string(),
  currentTime: z.date(),
  formattedTime: z.string(),
  info: timezoneInfoSchema,
})

/**
 * Timezone Statistics schema
 */
export const timezoneStatisticsSchema = z.object({
  totalConversions: z.number(),
  validCount: z.number(),
  invalidCount: z.number(),
  timezoneDistribution: z.record(z.string(), z.number()),
  averageTimeDifference: z.number(),
  dstCount: z.number(),
  successRate: z.number(),
})

/**
 * Timezone Settings schema
 */
export const timezoneSettingsSchema = z.object({
  defaultInputTimezone: z.string(),
  defaultOutputTimezone: z.string(),
  dateFormat: dateFormatSchema,
  timeFormat: timeFormatSchema,
  includeSeconds: z.boolean(),
  show24Hour: z.boolean(),
  showDST: z.boolean(),
  realTimeConversion: z.boolean(),
  autoRefresh: z.boolean(),
  refreshInterval: z.number(),
  exportFormat: exportFormatSchema,
})

/**
 * Timezone Conversion Batch schema
 */
export const timezoneConversionBatchSchema = z.object({
  id: z.string(),
  conversions: z.array(timezoneConversionSchema),
  count: z.number(),
  settings: timezoneSettingsSchema,
  createdAt: z.date(),
  statistics: timezoneStatisticsSchema,
})

/**
 * Timezone Template schema
 */
export const timezoneTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  inputTimezone: z.string(),
  outputTimezone: z.string(),
  useCase: z.array(z.string()),
})

/**
 * DateTime Validation schema
 */
export const dateTimeValidationSchema = z.object({
  isValid: z.boolean(),
  error: z.string().optional(),
  parsedDate: z.date().optional(),
})

// ==================== Type Exports ====================

export type DateFormat = z.infer<typeof dateFormatSchema>
export type TimeFormat = z.infer<typeof timeFormatSchema>
export type ExportFormat = z.infer<typeof exportFormatSchema>
export type TimezoneInfo = z.infer<typeof timezoneInfoSchema>
export type TimezoneConversion = z.infer<typeof timezoneConversionSchema>
export type WorldClock = z.infer<typeof worldClockSchema>
export type TimezoneStatistics = z.infer<typeof timezoneStatisticsSchema>
export type TimezoneSettings = z.infer<typeof timezoneSettingsSchema>
export type TimezoneConversionBatch = z.infer<typeof timezoneConversionBatchSchema>
export type TimezoneTemplate = z.infer<typeof timezoneTemplateSchema>
export type DateTimeValidation = z.infer<typeof dateTimeValidationSchema>
