// ==================== Time Diff Types ====================

/**
 * Date Format type
 */
export type dateFormat = "iso8601" | "rfc2822" | "unix" | "unix-ms" | "local" | "custom"

/**
 * Duration Format type
 */
export type durationFormat = "detailed" | "compact" | "human" | "iso8601"

/**
 * Duration Precision type
 */
export type durationPrecision = "milliseconds" | "seconds" | "minutes" | "hours" | "days"

/**
 * Export Format type
 */
export type exportFormat = "json" | "csv" | "txt" | "xml"

/**
 * Duration Breakdown type
 */
export interface durationBreakdown {
  years: number,
  months: number,
  weeks: number,
  days: number,
  hours: number,
  minutes: number,
  seconds: number,
  milliseconds: number,
}

/**
 * Duration type
 */
export interface duration {
  totalMilliseconds: number,
  totalSeconds: number,
  totalMinutes: number,
  totalHours: number,
  totalDays: number,
  totalWeeks: number,
  totalMonths: number,
  totalYears: number,
  breakdown: durationBreakdown,
  humanReadable: string,
  relative: string,
}

/**
 * Time Difference type
 */
export interface timeDifference {
  id: string,
  startDate: Date,
  endDate: Date,
  startInput: string,
  endInput: string,
  startFormat: dateFormat,
  endFormat: dateFormat,
  timezone: string,
  duration: duration,
  businessDays: number,
  isValid: boolean
  error?: string,
  createdAt: Date,
}

/**
 * Time Diff Statistics type
 */
export interface timeDiffStatistics {
  totalCalculations: number,
  validCount: number,
  invalidCount: number,
  averageDuration: number,
  longestDuration: number,
  shortestDuration: number,
  durationDistribution: Record<string, number>,
  timezoneDistribution: Record<string, number>,
  successRate: number,
}

/**
 * Time Diff Settings type
 */
export interface timeDiffSettings {
  defaultTimezone: string,
  includeBusinessDays: boolean,
  includeTime: boolean,
  outputFormat: durationFormat,
  exportFormat: exportFormat,
  realTimeCalculation: boolean,
  showRelativeTime: boolean,
  precision: durationPrecision,
}

/**
 * Time Diff Batch type
 */
export interface timeDiffBatch {
  id: string,
  calculations: timeDifference[],
  count: number,
  settings: timeDiffSettings,
  createdAt: Date,
  statistics: timeDiffStatistics,
}

/**
 * Time Diff Template type
 */
export interface timeDiffTemplate {
  id: string,
  name: string,
  description: string,
  category: string,
  startDate: string,
  endDate: string,
  useCase: string[],
}

/**
 * Date Validation type
 */
export interface dateValidation {
  isValid: boolean
  error?: string,
  parsedDate?: Date,
}

// ==================== Type Exports ====================

export type DateFormat = dateFormat
export type DurationFormat = durationFormat
export type DurationPrecision = durationPrecision
export type ExportFormat = exportFormat
export type DurationBreakdown = durationBreakdown
export type Duration = duration
export type TimeDifference = timeDifference
export type TimeDiffStatistics = timeDiffStatistics
export type TimeDiffSettings = timeDiffSettings
export type TimeDiffBatch = timeDiffBatch
export type TimeDiffTemplate = timeDiffTemplate
export type DateValidation = dateValidation
