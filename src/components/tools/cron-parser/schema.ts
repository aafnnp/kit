// ==================== Cron Parser Types ====================

/**
 * Export Format type
 */
export type exportFormat = "json" | "csv" | "txt" | "xml"

/**
 * Cron Field type
 */
export interface cronField {
  raw: string,
  values: number[],
  type: "wildcard"| "specific" | "range" | "step" | "list" | "invalid",
  description: string,
  isValid: boolean
  error?: string
}

/**
 * Cron Fields type
 */
export interface cronFields {
  minute: cronField,
  hour: cronField,
  dayOfMonth: cronField,
  month: cronField,
  dayOfWeek: cronField
  year?: cronField
}

/**
 * Cron Frequency type
 */
export interface cronFrequency {
  type: "once"| "minutely" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "custom",
  interval: number,
  description: string,
}

/**
 * Cron Expression type
 */
export interface cronExpression {
  id: string,
  expression: string,
  description: string,
  isValid: boolean
  error?: string
  parsedFields: cronFields,
  humanReadable: string,
  nextRuns: Date[],
  frequency: cronFrequency,
  timezone: string,
  createdAt: Date,
}

/**
 * Cron Statistics type
 */
export interface cronStatistics {
  totalExpressions: number,
  validCount: number,
  invalidCount: number,
  frequencyDistribution: Record<string, number>,
  fieldComplexity: Record<string, number>,
  averageNextRuns: number,
  successRate: number,
}

/**
 * Cron Settings type
 */
export interface cronSettings {
  timezone: string,
  includeSeconds: boolean,
  includeYear: boolean,
  maxNextRuns: number,
  validateOnly: boolean,
  exportFormat: exportFormat,
  realTimeValidation: boolean,
  showExamples: boolean,
}

/**
 * Cron Batch type
 */
export interface cronBatch {
  id: string,
  expressions: cronExpression[],
  count: number,
  settings: cronSettings,
  createdAt: Date,
  statistics: cronStatistics,
}

/**
 * Cron Template type
 */
export interface cronTemplate {
  id: string,
  name: string,
  expression: string,
  description: string,
  category: string,
  frequency: string,
  examples: string[],
}

/**
 * Cron Validation type
 */
export interface cronValidation {
  isValid: boolean,
  errors: string[],
  warnings: string[],
  suggestions: string[],
}

// ==================== Type Exports ====================

export type ExportFormat = exportFormat
export type CronField = cronField
export type CronFields = cronFields
export type CronFrequency = cronFrequency
export type CronExpression = cronExpression
export type CronStatistics = cronStatistics
export type CronSettings = cronSettings
export type CronBatch = cronBatch
export type CronTemplate = cronTemplate
export type CronValidation = cronValidation
