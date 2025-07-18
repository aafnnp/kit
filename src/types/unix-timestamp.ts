// 所有类型声明均从 unix-timestamp.tsx 迁移
export interface TimestampItem {
  id: string
  input: string
  inputType: TimestampFormat
  outputs: TimestampOutput[]
  timezone: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
  processedAt?: Date
  isValid: boolean
}

export interface TimestampOutput {
  format: TimestampFormat
  value: string
  timezone: string
  isValid: boolean
  relativeTime?: string
}

export interface TimestampBatch {
  id: string
  items: TimestampItem[]
  count: number
  settings: TimestampSettings
  createdAt: Date
  statistics: TimestampStatistics
}

export interface TimestampStatistics {
  totalProcessed: number
  validCount: number
  invalidCount: number
  formatDistribution: Record<string, number>
  timezoneDistribution: Record<string, number>
  averageProcessingTime: number
  totalProcessingTime: number
  successRate: number
}

export interface TimestampSettings {
  inputFormat: TimestampFormat
  outputFormats: TimestampFormat[]
  timezone: string
  includeRelativeTime: boolean
  includeTimestamp: boolean
  batchProcessing: boolean
  realTimeConversion: boolean
  exportFormat: ExportFormat
  autoRefresh: boolean
  refreshInterval: number
}

export interface TimestampTemplate {
  id: string
  name: string
  description: string
  category: string
  settings: Partial<TimestampSettings>
  formats: TimestampFormat[]
}

export interface CurrentTime {
  unix: number
  unixMs: number
  iso: string
  rfc2822: string
  local: string
  utc: string
  timezone: string
  relativeTime: string
}

export interface TimezoneInfo {
  name: string
  offset: string
  abbreviation: string
  isDST: boolean
}

export type TimestampFormat = 'unix' | 'unix-ms' | 'iso8601' | 'rfc2822' | 'local' | 'utc' | 'custom'
export type ExportFormat = 'json' | 'csv' | 'txt' | 'xml'
