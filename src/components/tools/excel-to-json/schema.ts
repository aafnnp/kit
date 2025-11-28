import { z } from "zod"

// ==================== Excel to JSON Schemas ====================

/**
 * Export Format schema
 */
export const exportFormatSchema = z.enum(["json", "csv", "txt", "xlsx"])

/**
 * Sheet Selection schema
 */
export const sheetSelectionSchema = z.enum(["all", "first", "selected", "non-empty"])

/**
 * Data Type Distribution schema
 */
export const dataTypeDistributionSchema = z.object({
  strings: z.number(),
  numbers: z.number(),
  dates: z.number(),
  booleans: z.number(),
  formulas: z.number(),
  errors: z.number(),
  empty: z.number(),
})

/**
 * Sheet Data schema
 */
export const sheetDataSchema = z.object({
  name: z.string(),
  data: z.array(z.any()),
  headers: z.array(z.string()),
  rowCount: z.number(),
  columnCount: z.number(),
  isEmpty: z.boolean(),
  hasHeaders: z.boolean(),
  dataTypes: dataTypeDistributionSchema,
})

/**
 * Processing Statistics schema
 */
export const processingStatisticsSchema = z.object({
  fileSize: z.number(),
  totalSheets: z.number(),
  totalRows: z.number(),
  totalColumns: z.number(),
  totalCells: z.number(),
  emptySheets: z.number(),
  processingTime: z.number(),
  memoryUsage: z.number(),
  compressionRatio: z.number(),
})

/**
 * Sheet Analysis schema
 */
export const sheetAnalysisSchema = z.object({
  sheetName: z.string(),
  dataQuality: z.number(),
  headerConsistency: z.boolean(),
  hasEmptyRows: z.boolean(),
  hasEmptyColumns: z.boolean(),
  dataTypeConsistency: z.boolean(),
  recommendations: z.array(z.string()),
})

/**
 * Excel Analysis schema
 */
export const excelAnalysisSchema = z.object({
  hasMultipleSheets: z.boolean(),
  hasFormulas: z.boolean(),
  hasErrors: z.boolean(),
  hasEmptySheets: z.boolean(),
  hasInconsistentHeaders: z.boolean(),
  suggestedImprovements: z.array(z.string()),
  dataIssues: z.array(z.string()),
  qualityScore: z.number(),
  sheetAnalysis: z.array(sheetAnalysisSchema),
})

/**
 * Excel Processing Result schema
 */
export const excelProcessingResultSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  fileSize: z.number(),
  sheets: z.array(sheetDataSchema),
  isValid: z.boolean(),
  error: z.string().optional(),
  statistics: processingStatisticsSchema,
  analysis: excelAnalysisSchema.optional(),
  createdAt: z.date(),
})

/**
 * Batch Statistics schema
 */
export const batchStatisticsSchema = z.object({
  totalProcessed: z.number(),
  validCount: z.number(),
  invalidCount: z.number(),
  averageQuality: z.number(),
  totalFileSize: z.number(),
  totalSheets: z.number(),
  successRate: z.number(),
})

/**
 * Processing Settings schema
 */
export const processingSettingsSchema = z.object({
  includeEmptyRows: z.boolean(),
  includeEmptyColumns: z.boolean(),
  detectDataTypes: z.boolean(),
  preserveFormulas: z.boolean(),
  exportFormat: exportFormatSchema,
  jsonIndentation: z.number(),
  sheetSelection: sheetSelectionSchema,
  headerRow: z.number(),
  dateFormat: z.string(),
  numberFormat: z.string(),
  realTimeProcessing: z.boolean(),
})

/**
 * Processing Batch schema
 */
export const processingBatchSchema = z.object({
  id: z.string(),
  results: z.array(excelProcessingResultSchema),
  count: z.number(),
  settings: processingSettingsSchema,
  createdAt: z.date(),
  statistics: batchStatisticsSchema,
})

/**
 * Excel Template schema
 */
export const excelTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  excelStructure: z.string(),
  jsonExample: z.string(),
  useCase: z.array(z.string()),
})

/**
 * File Error schema
 */
export const fileErrorSchema = z.object({
  message: z.string(),
  type: z.enum(["format", "size", "content", "permission"]),
  details: z.string().optional(),
})

/**
 * File Validation schema
 */
export const fileValidationSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(fileErrorSchema),
  warnings: z.array(z.string()),
  suggestions: z.array(z.string()),
})

// ==================== Type Exports ====================

export type ExportFormat = z.infer<typeof exportFormatSchema>
export type SheetSelection = z.infer<typeof sheetSelectionSchema>
export type DataTypeDistribution = z.infer<typeof dataTypeDistributionSchema>
export type SheetData = z.infer<typeof sheetDataSchema>
export type ProcessingStatistics = z.infer<typeof processingStatisticsSchema>
export type SheetAnalysis = z.infer<typeof sheetAnalysisSchema>
export type ExcelAnalysis = z.infer<typeof excelAnalysisSchema>
export type ExcelProcessingResult = z.infer<typeof excelProcessingResultSchema>
export type BatchStatistics = z.infer<typeof batchStatisticsSchema>
export type ProcessingSettings = z.infer<typeof processingSettingsSchema>
export type ProcessingBatch = z.infer<typeof processingBatchSchema>
export type ExcelTemplate = z.infer<typeof excelTemplateSchema>
export type FileError = z.infer<typeof fileErrorSchema>
export type FileValidation = z.infer<typeof fileValidationSchema>
