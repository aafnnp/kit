// Enhanced Types
export interface CronExpression {
  id: string
  expression: string
  description: string
  isValid: boolean
  error?: string
  parsedFields: CronFields
  humanReadable: string
  nextRuns: Date[]
  frequency: CronFrequency
  timezone: string
  createdAt: Date
}

export interface CronFields {
  minute: CronField
  hour: CronField
  dayOfMonth: CronField
  month: CronField
  dayOfWeek: CronField
  year?: CronField
}

export interface CronField {
  raw: string
  values: number[]
  type: 'wildcard' | 'specific' | 'range' | 'step' | 'list' | 'invalid'
  description: string
  isValid: boolean
  error?: string
}

export interface CronFrequency {
  type: 'once' | 'minutely' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'
  interval: number
  description: string
}

export interface CronTemplate {
  id: string
  name: string
  expression: string
  description: string
  category: string
  frequency: string
  examples: string[]
}

export interface CronBatch {
  id: string
  expressions: CronExpression[]
  count: number
  settings: CronSettings
  createdAt: Date
  statistics: CronStatistics
}

export interface CronStatistics {
  totalExpressions: number
  validCount: number
  invalidCount: number
  frequencyDistribution: Record<string, number>
  fieldComplexity: Record<string, number>
  averageNextRuns: number
  successRate: number
}

export interface CronSettings {
  timezone: string
  includeSeconds: boolean
  includeYear: boolean
  maxNextRuns: number
  validateOnly: boolean
  exportFormat: ExportFormat
  realTimeValidation: boolean
  showExamples: boolean
}

export interface CronValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
  suggestions: string[]
}

// Enums
export type ExportFormat = 'json' | 'csv' | 'txt' | 'xml'
