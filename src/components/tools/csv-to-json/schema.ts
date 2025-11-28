import { z } from "zod"

// ==================== CSV to JSON Schemas ====================

/**
 * Conversion Direction schema
 */
export const conversionDirectionSchema = z.enum(["csv-to-json", "json-to-csv"])

/**
 * Export Format schema
 */
export const exportFormatSchema = z.enum(["json", "csv", "txt", "xlsx"])

/**
 * CSV Quoting schema
 */
export const csvQuotingSchema = z.enum(["minimal", "all", "non-numeric", "none"])

/**
 * Data Type Count schema
 */
export const dataTypeCountSchema = z.object({
  strings: z.number(),
  numbers: z.number(),
  booleans: z.number(),
  nulls: z.number(),
  dates: z.number(),
  objects: z.number(),
  arrays: z.number(),
})

/**
 * Data Metrics schema
 */
export const dataMetricsSchema = z.object({
  rowCount: z.number(),
  columnCount: z.number(),
  totalCells: z.number(),
  emptyValues: z.number(),
  dataTypes: dataTypeCountSchema,
  encoding: z.string(),
})

/**
 * Conversion Statistics schema
 */
export const conversionStatisticsSchema = z.object({
  inputSize: z.number(),
  outputSize: z.number(),
  inputLines: z.number(),
  outputLines: z.number(),
  processingTime: z.number(),
  dataMetrics: dataMetricsSchema,
  compressionRatio: z.number(),
})

/**
 * Data Analysis schema
 */
export const dataAnalysisSchema = z.object({
  hasHeaders: z.boolean(),
  delimiter: z.string(),
  quoteChar: z.string(),
  escapeChar: z.string(),
  hasNestedData: z.boolean(),
  hasSpecialChars: z.boolean(),
  suggestedImprovements: z.array(z.string()),
  dataIssues: z.array(z.string()),
  qualityScore: z.number(),
})

/**
 * Conversion Result schema
 */
export const conversionResultSchema = z.object({
  id: z.string(),
  input: z.string(),
  output: z.string(),
  direction: conversionDirectionSchema,
  isValid: z.boolean(),
  error: z.string().optional(),
  statistics: conversionStatisticsSchema,
  analysis: dataAnalysisSchema.optional(),
  createdAt: z.date(),
})

/**
 * Batch Statistics schema
 */
export const batchStatisticsSchema = z.object({
  totalConverted: z.number(),
  validCount: z.number(),
  invalidCount: z.number(),
  averageQuality: z.number(),
  totalInputSize: z.number(),
  totalOutputSize: z.number(),
  successRate: z.number(),
})

/**
 * Conversion Settings schema
 */
export const conversionSettingsSchema = z.object({
  delimiter: z.string(),
  quoteChar: z.string(),
  escapeChar: z.string(),
  hasHeaders: z.boolean(),
  skipEmptyLines: z.boolean(),
  trimWhitespace: z.boolean(),
  realTimeConversion: z.boolean(),
  exportFormat: exportFormatSchema,
  jsonIndentation: z.number(),
  csvQuoting: csvQuotingSchema,
  dateFormat: z.string(),
  numberFormat: z.string(),
})

/**
 * Conversion Batch schema
 */
export const conversionBatchSchema = z.object({
  id: z.string(),
  results: z.array(conversionResultSchema),
  count: z.number(),
  settings: conversionSettingsSchema,
  createdAt: z.date(),
  statistics: batchStatisticsSchema,
})

/**
 * CSV Template schema
 */
export const csvTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  csvExample: z.string(),
  jsonExample: z.string(),
  useCase: z.array(z.string()),
})

/**
 * Data Error schema
 */
export const dataErrorSchema = z.object({
  message: z.string(),
  line: z.number().optional(),
  column: z.string().optional(),
  value: z.string().optional(),
})

/**
 * Data Validation schema
 */
export const dataValidationSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(dataErrorSchema),
  warnings: z.array(z.string()),
  suggestions: z.array(z.string()),
})

// ==================== Type Exports ====================

export type ConversionDirection = z.infer<typeof conversionDirectionSchema>
export type ExportFormat = z.infer<typeof exportFormatSchema>
export type CSVQuoting = z.infer<typeof csvQuotingSchema>
export type DataTypeCount = z.infer<typeof dataTypeCountSchema>
export type DataMetrics = z.infer<typeof dataMetricsSchema>
export type ConversionStatistics = z.infer<typeof conversionStatisticsSchema>
export type DataAnalysis = z.infer<typeof dataAnalysisSchema>
export type ConversionResult = z.infer<typeof conversionResultSchema>
export type BatchStatistics = z.infer<typeof batchStatisticsSchema>
export type ConversionSettings = z.infer<typeof conversionSettingsSchema>
export type ConversionBatch = z.infer<typeof conversionBatchSchema>
export type CSVTemplate = z.infer<typeof csvTemplateSchema>
export type DataError = z.infer<typeof dataErrorSchema>
export type DataValidation = z.infer<typeof dataValidationSchema>
