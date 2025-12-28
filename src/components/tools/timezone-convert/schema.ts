// ==================== Timezone Convert Types ====================

/**
 * Date Format type
 */
export type dateFormat = "iso" | "us" | "eu" | "local" | "custom"

/**
 * Time Format type
 */
export type timeFormat = "12h" | "24h"

/**
 * Export Format type
 */
export type exportFormat = "json" | "csv" | "txt" | "xml"

/**
 * Timezone Info type
 */
export interface timezoneInfo {
  name: string,
  abbreviation: string,
  offset: string,
  offsetMinutes: number,
  isDST: boolean,
  currentTime: string,
  utcOffset: string,
}

/**
 * Timezone Conversion type
 */
export interface timezoneConversion {
  id: string,
  inputTime: string,
  inputTimezone: string,
  outputTimezone: string,
  inputDate: Date,
  outputDate: Date,
  outputTime: string,
  timeDifference: number,
  isDST: boolean,
  isValid: boolean
  error?: string,
  createdAt: Date,
}

/**
 * World Clock type
 */
export interface worldClock {
  timezone: string,
  currentTime: Date,
  formattedTime: string,
  info: timezoneInfo,
}

/**
 * Timezone Statistics type
 */
export interface timezoneStatistics {
  totalConversions: number,
  validCount: number,
  invalidCount: number,
  timezoneDistribution: Record<string, number>,
  averageTimeDifference: number,
  dstCount: number,
  successRate: number,
}

/**
 * Timezone Settings type
 */
export interface timezoneSettings {
  defaultInputTimezone: string,
  defaultOutputTimezone: string,
  dateFormat: dateFormat,
  timeFormat: timeFormat,
  includeSeconds: boolean,
  show24Hour: boolean,
  showDST: boolean,
  realTimeConversion: boolean,
  autoRefresh: boolean,
  refreshInterval: number,
  exportFormat: exportFormat,
}

/**
 * Timezone Conversion Batch type
 */
export interface timezoneConversionBatch {
  id: string,
  conversions: timezoneConversion[],
  count: number,
  settings: timezoneSettings,
  createdAt: Date,
  statistics: timezoneStatistics,
}

/**
 * Timezone Template type
 */
export interface timezoneTemplate {
  id: string,
  name: string,
  description: string,
  category: string,
  inputTimezone: string,
  outputTimezone: string,
  useCase: string[],
}

/**
 * DateTime Validation type
 */
export interface dateTimeValidation {
  isValid: boolean
  error?: string,
  parsedDate?: Date,
}

// ==================== Type Exports ====================

export type DateFormat = dateFormat
export type TimeFormat = timeFormat
export type ExportFormat = exportFormat
export type TimezoneInfo = timezoneInfo
export type TimezoneConversion = timezoneConversion
export type WorldClock = worldClock
export type TimezoneStatistics = timezoneStatistics
export type TimezoneSettings = timezoneSettings
export type TimezoneConversionBatch = timezoneConversionBatch
export type TimezoneTemplate = timezoneTemplate
export type DateTimeValidation = dateTimeValidation
