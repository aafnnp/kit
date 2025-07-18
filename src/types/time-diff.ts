// 所有类型声明均从 time-diff.tsx 迁移
export interface TimeDifference {
  id: string
  startDate: Date
  endDate: Date
  startInput: string
  endInput: string
  startFormat: DateFormat
  endFormat: DateFormat
  timezone: string
  duration: Duration
  businessDays: number
  isValid: boolean
  error?: string
  createdAt: Date
}

export interface Duration {
  totalMilliseconds: number
  totalSeconds: number
  totalMinutes: number
  totalHours: number
  totalDays: number
  totalWeeks: number
  totalMonths: number
  totalYears: number
  breakdown: DurationBreakdown
  humanReadable: string
  relative: string
}

export interface DurationBreakdown {
  years: number
  months: number
  weeks: number
  days: number
  hours: number
  minutes: number
  seconds: number
  milliseconds: number
}

export interface TimeDiffBatch {
  id: string
  calculations: TimeDifference[]
  count: number
  settings: TimeDiffSettings
  createdAt: Date
  statistics: TimeDiffStatistics
}

export interface TimeDiffStatistics {
  totalCalculations: number
  validCount: number
  invalidCount: number
  averageDuration: number
  longestDuration: number
  shortestDuration: number
  durationDistribution: Record<string, number>
  timezoneDistribution: Record<string, number>
  successRate: number
}

export interface TimeDiffSettings {
  defaultTimezone: string
  includeBusinessDays: boolean
  includeTime: boolean
  outputFormat: DurationFormat
  exportFormat: ExportFormat
  realTimeCalculation: boolean
  showRelativeTime: boolean
  precision: DurationPrecision
}

export interface TimeDiffTemplate {
  id: string
  name: string
  description: string
  category: string
  startDate: string
  endDate: string
  useCase: string[]
}

export interface DateValidation {
  isValid: boolean
  error?: string
  parsedDate?: Date
}

export type DateFormat = 'iso8601' | 'rfc2822' | 'unix' | 'unix-ms' | 'local' | 'custom'
export type DurationFormat = 'detailed' | 'compact' | 'human' | 'iso8601'
export type DurationPrecision = 'milliseconds' | 'seconds' | 'minutes' | 'hours' | 'days'
export type ExportFormat = 'json' | 'csv' | 'txt' | 'xml'
