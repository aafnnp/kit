import { z } from "zod"

// ==================== Time Diff Schemas ====================

/**
 * Date Format schema
 */
export const dateFormatSchema = z.enum([
  "iso8601",
  "rfc2822",
  "unix",
  "unix-ms",
  "local",
  "custom",
])

/**
 * Duration Format schema
 */
export const durationFormatSchema = z.enum([
  "detailed",
  "compact",
  "human",
  "iso8601",
])

/**
 * Duration Precision schema
 */
export const durationPrecisionSchema = z.enum([
  "milliseconds",
  "seconds",
  "minutes",
  "hours",
  "days",
])

/**
 * Export Format schema
 */
export const exportFormatSchema = z.enum(["json", "csv", "txt", "xml"])

/**
 * Duration Breakdown schema
 */
export const durationBreakdownSchema = z.object({
  years: z.number(),
  months: z.number(),
  weeks: z.number(),
  days: z.number(),
  hours: z.number(),
  minutes: z.number(),
  seconds: z.number(),
  milliseconds: z.number(),
})

/**
 * Duration schema
 */
export const durationSchema = z.object({
  totalMilliseconds: z.number(),
  totalSeconds: z.number(),
  totalMinutes: z.number(),
  totalHours: z.number(),
  totalDays: z.number(),
  totalWeeks: z.number(),
  totalMonths: z.number(),
  totalYears: z.number(),
  breakdown: durationBreakdownSchema,
  humanReadable: z.string(),
  relative: z.string(),
})

/**
 * Time Difference schema
 */
export const timeDifferenceSchema = z.object({
  id: z.string(),
  startDate: z.date(),
  endDate: z.date(),
  startInput: z.string(),
  endInput: z.string(),
  startFormat: dateFormatSchema,
  endFormat: dateFormatSchema,
  timezone: z.string(),
  duration: durationSchema,
  businessDays: z.number(),
  isValid: z.boolean(),
  error: z.string().optional(),
  createdAt: z.date(),
})

/**
 * Time Diff Statistics schema
 */
export const timeDiffStatisticsSchema = z.object({
  totalCalculations: z.number(),
  validCount: z.number(),
  invalidCount: z.number(),
  averageDuration: z.number(),
  longestDuration: z.number(),
  shortestDuration: z.number(),
  durationDistribution: z.record(z.string(), z.number()),
  timezoneDistribution: z.record(z.string(), z.number()),
  successRate: z.number(),
})

/**
 * Time Diff Settings schema
 */
export const timeDiffSettingsSchema = z.object({
  defaultTimezone: z.string(),
  includeBusinessDays: z.boolean(),
  includeTime: z.boolean(),
  outputFormat: durationFormatSchema,
  exportFormat: exportFormatSchema,
  realTimeCalculation: z.boolean(),
  showRelativeTime: z.boolean(),
  precision: durationPrecisionSchema,
})

/**
 * Time Diff Batch schema
 */
export const timeDiffBatchSchema = z.object({
  id: z.string(),
  calculations: z.array(timeDifferenceSchema),
  count: z.number(),
  settings: timeDiffSettingsSchema,
  createdAt: z.date(),
  statistics: timeDiffStatisticsSchema,
})

/**
 * Time Diff Template schema
 */
export const timeDiffTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  useCase: z.array(z.string()),
})

/**
 * Date Validation schema
 */
export const dateValidationSchema = z.object({
  isValid: z.boolean(),
  error: z.string().optional(),
  parsedDate: z.date().optional(),
})

// ==================== Type Exports ====================

export type DateFormat = z.infer<typeof dateFormatSchema>
export type DurationFormat = z.infer<typeof durationFormatSchema>
export type DurationPrecision = z.infer<typeof durationPrecisionSchema>
export type ExportFormat = z.infer<typeof exportFormatSchema>
export type DurationBreakdown = z.infer<typeof durationBreakdownSchema>
export type Duration = z.infer<typeof durationSchema>
export type TimeDifference = z.infer<typeof timeDifferenceSchema>
export type TimeDiffStatistics = z.infer<typeof timeDiffStatisticsSchema>
export type TimeDiffSettings = z.infer<typeof timeDiffSettingsSchema>
export type TimeDiffBatch = z.infer<typeof timeDiffBatchSchema>
export type TimeDiffTemplate = z.infer<typeof timeDiffTemplateSchema>
export type DateValidation = z.infer<typeof dateValidationSchema>

