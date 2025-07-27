// Enhanced Types
export interface ConversionResult {
  id: string
  input: string
  output: string
  direction: ConversionDirection
  isValid: boolean
  error?: string
  statistics: ConversionStatistics
  analysis?: DataAnalysis
  createdAt: Date
}

export interface ConversionStatistics {
  inputSize: number
  outputSize: number
  inputLines: number
  outputLines: number
  processingTime: number
  dataMetrics: DataMetrics
  compressionRatio: number
}

export interface DataMetrics {
  rowCount: number
  columnCount: number
  totalCells: number
  emptyValues: number
  dataTypes: DataTypeCount
  encoding: string
}

export interface DataTypeCount {
  strings: number
  numbers: number
  booleans: number
  nulls: number
  dates: number
  objects: number
  arrays: number
}

export interface DataAnalysis {
  hasHeaders: boolean
  delimiter: string
  quoteChar: string
  escapeChar: string
  hasNestedData: boolean
  hasSpecialChars: boolean
  suggestedImprovements: string[]
  dataIssues: string[]
  qualityScore: number
}

export interface ConversionBatch {
  id: string
  results: ConversionResult[]
  count: number
  settings: ConversionSettings
  createdAt: Date
  statistics: BatchStatistics
}

export interface BatchStatistics {
  totalConverted: number
  validCount: number
  invalidCount: number
  averageQuality: number
  totalInputSize: number
  totalOutputSize: number
  successRate: number
}

export interface ConversionSettings {
  delimiter: string
  quoteChar: string
  escapeChar: string
  hasHeaders: boolean
  skipEmptyLines: boolean
  trimWhitespace: boolean
  realTimeConversion: boolean
  exportFormat: ExportFormat
  jsonIndentation: number
  csvQuoting: CSVQuoting
  dateFormat: string
  numberFormat: string
}

export interface CSVTemplate {
  id: string
  name: string
  description: string
  category: string
  csvExample: string
  jsonExample: string
  useCase: string[]
}

export interface DataValidation {
  isValid: boolean
  errors: DataError[]
  warnings: string[]
  suggestions: string[]
}

export interface DataError {
  message: string
  line?: number
  column?: string
  value?: string
}

// Enums
export type ConversionDirection = 'csv-to-json' | 'json-to-csv'
export type ExportFormat = 'json' | 'csv' | 'txt' | 'xlsx'
export type CSVQuoting = 'minimal' | 'all' | 'non-numeric' | 'none'
