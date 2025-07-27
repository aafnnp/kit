// 所有类型声明均从 timezone-convert.tsx 迁移
export interface TimezoneConversion {
  id: string
  inputTime: string
  inputTimezone: string
  outputTimezone: string
  inputDate: Date
  outputDate: Date
  outputTime: string
  timeDifference: number
  isDST: boolean
  isValid: boolean
  error?: string
  createdAt: Date
}

export interface TimezoneInfo {
  name: string
  abbreviation: string
  offset: string
  offsetMinutes: number
  isDST: boolean
  currentTime: string
  utcOffset: string
}

export interface WorldClock {
  timezone: string
  currentTime: Date
  formattedTime: string
  info: TimezoneInfo
}

export interface TimezoneConversionBatch {
  id: string
  conversions: TimezoneConversion[]
  count: number
  settings: TimezoneSettings
  createdAt: Date
  statistics: TimezoneStatistics
}

export interface TimezoneStatistics {
  totalConversions: number
  validCount: number
  invalidCount: number
  timezoneDistribution: Record<string, number>
  averageTimeDifference: number
  dstCount: number
  successRate: number
}

export interface TimezoneSettings {
  defaultInputTimezone: string
  defaultOutputTimezone: string
  dateFormat: DateFormat
  timeFormat: TimeFormat
  includeSeconds: boolean
  show24Hour: boolean
  showDST: boolean
  realTimeConversion: boolean
  autoRefresh: boolean
  refreshInterval: number
  exportFormat: ExportFormat
}

export interface TimezoneTemplate {
  id: string
  name: string
  description: string
  category: string
  inputTimezone: string
  outputTimezone: string
  useCase: string[]
}

export interface DateTimeValidation {
  isValid: boolean
  error?: string
  parsedDate?: Date
}

export type DateFormat = 'iso' | 'us' | 'eu' | 'local' | 'custom'
export type TimeFormat = '12h' | '24h'
export type ExportFormat = 'json' | 'csv' | 'txt' | 'xml'
