// ==================== Unix Timestamp Types ====================

/**
 * Timestamp Format type
 */
export type timestampFormat = "unix" | "unix-ms" | "iso8601" | "rfc2822" | "local" | "utc" | "custom"

/**
 * Export Format type
 */
export type exportFormat = "json" | "csv" | "txt" | "xml"

/**
 * Timestamp Output type
 */
export interface timestampOutput {
  format: timestampFormat,
  value: string,
  timezone: string,
  isValid: boolean
  relativeTime?: string
}

/**
 * Timestamp Item type
 */
export interface timestampItem {
  id: string,
  input: string,
  inputType: timestampFormat,
  outputs: timestampOutput[],
  timezone: string,
  status: "pending"| "processing" | "completed" | "error"
  error?: string
  processedAt?: Date
  isValid: boolean,
}

/**
 * Timestamp Statistics type
 */
export interface timestampStatistics {
  totalProcessed: number,
  validCount: number,
  invalidCount: number,
  formatDistribution: Record<string, number>,
  timezoneDistribution: Record<string, number>,
  averageProcessingTime: number,
  totalProcessingTime: number,
  successRate: number,
}

/**
 * Timestamp Settings type
 */
export interface timestampSettings {
  inputFormat: timestampFormat,
  outputFormats: timestampFormat[],
  timezone: string,
  includeRelativeTime: boolean,
  includeTimestamp: boolean,
  batchProcessing: boolean,
  realTimeConversion: boolean,
  exportFormat: exportFormat,
  autoRefresh: boolean,
  refreshInterval: number,
}

/**
 * Timestamp Batch type
 */
export interface timestampBatch {
  id: string,
  items: timestampItem[],
  count: number,
  settings: timestampSettings,
  createdAt: Date,
  statistics: timestampStatistics,
}

/**
 * Timestamp Template type
 */
export interface timestampTemplate {
  id: string,
  name: string,
  description: string,
  category: string,
  settings: timestampSettings,
  formats: timestampFormat[],
}

/**
 * Current Time type
 */
export interface currentTime {
  unix: number,
  unixMs: number,
  iso: string,
  rfc2822: string,
  local: string,
  utc: string,
  timezone: string,
  relativeTime: string,
}

/**
 * Timezone Info type
 */
export interface timezoneInfo {
  name: string,
  offset: string,
  abbreviation: string,
  isDST: boolean,
}

// ==================== Type Exports ====================

export type TimestampFormat = timestampFormat
export type ExportFormat = exportFormat
export type TimestampOutput = timestampOutput
export type TimestampItem = timestampItem
export type TimestampStatistics = timestampStatistics
export type TimestampSettings = timestampSettings
export type TimestampBatch = timestampBatch
export type TimestampTemplate = timestampTemplate
export type CurrentTime = currentTime
export type TimezoneInfo = timezoneInfo
