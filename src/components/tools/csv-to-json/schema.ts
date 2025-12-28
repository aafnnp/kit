// ==================== CSV to JSON Types ====================

/**
 * Conversion Direction type
 */
export type conversionDirection = "csv-to-json" | "json-to-csv"

/**
 * Export Format type
 */
export type exportFormat = "json" | "csv" | "txt" | "xlsx"

/**
 * CSV Quoting type
 */
export type csvQuoting = "minimal" | "all" | "non-numeric" | "none"

/**
 * Data Type Count type
 */
export interface dataTypeCount {
  strings: number,
  numbers: number,
  booleans: number,
  nulls: number,
  dates: number,
  objects: number,
  arrays: number,
}

/**
 * Data Metrics type
 */
export interface dataMetrics {
  rowCount: number,
  columnCount: number,
  totalCells: number,
  emptyValues: number,
  dataTypes: dataTypeCount,
  encoding: string,
}

/**
 * Conversion Statistics type
 */
export interface conversionStatistics {
  inputSize: number,
  outputSize: number,
  inputLines: number,
  outputLines: number,
  processingTime: number,
  dataMetrics: dataMetrics,
  compressionRatio: number,
}

/**
 * Data Analysis type
 */
export interface dataAnalysis {
  hasHeaders: boolean,
  delimiter: string,
  quoteChar: string,
  escapeChar: string,
  hasNestedData: boolean,
  hasSpecialChars: boolean,
  suggestedImprovements: string[],
  dataIssues: string[],
  qualityScore: number,
}

/**
 * Conversion Result type
 */
export interface conversionResult {
  id: string,
  input: string,
  output: string,
  direction: conversionDirection,
  isValid: boolean
  error?: string,
  statistics: conversionStatistics
  analysis?: dataAnalysis,
  createdAt: Date,
}

/**
 * Batch Statistics type
 */
export interface batchStatistics {
  totalConverted: number,
  validCount: number,
  invalidCount: number,
  averageQuality: number,
  totalInputSize: number,
  totalOutputSize: number,
  successRate: number,
}

/**
 * Conversion Settings type
 */
export interface conversionSettings {
  delimiter: string,
  quoteChar: string,
  escapeChar: string,
  hasHeaders: boolean,
  skipEmptyLines: boolean,
  trimWhitespace: boolean,
  realTimeConversion: boolean,
  exportFormat: exportFormat,
  jsonIndentation: number,
  csvQuoting: csvQuoting,
  dateFormat: string,
  numberFormat: string,
}

/**
 * Conversion Batch type
 */
export interface conversionBatch {
  id: string,
  results: conversionResult[],
  count: number,
  settings: conversionSettings,
  createdAt: Date,
  statistics: batchStatistics,
}

/**
 * CSV Template type
 */
export interface csvTemplate {
  id: string,
  name: string,
  description: string,
  category: string,
  csvExample: string,
  jsonExample: string,
  useCase: string[],
}

/**
 * Data Error type
 */
export interface dataError {
  message: string
  line?: number,
  column?: string,
  value?: string,
}

/**
 * Data Validation type
 */
export interface dataValidation {
  isValid: boolean,
  errors: dataError[],
  warnings: string[],
  suggestions: string[],
}

// ==================== Type Exports ====================

export type ConversionDirection = conversionDirection
export type ExportFormat = exportFormat
export type CSVQuoting = csvQuoting
export type DataTypeCount = dataTypeCount
export type DataMetrics = dataMetrics
export type ConversionStatistics = conversionStatistics
export type DataAnalysis = dataAnalysis
export type ConversionResult = conversionResult
export type BatchStatistics = batchStatistics
export type ConversionSettings = conversionSettings
export type ConversionBatch = conversionBatch
export type CSVTemplate = csvTemplate
export type DataError = dataError
export type DataValidation = dataValidation
export type CsvQuoting = csvQuoting
export type CsvTemplate = csvTemplate
