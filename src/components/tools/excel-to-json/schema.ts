// ==================== Excel to JSON Types ====================

/**
 * Export Format type
 */
export type exportFormat = "json" | "csv" | "txt" | "xlsx"

/**
 * Sheet Selection type
 */
export type sheetSelection = "all" | "first" | "selected" | "non-empty"

/**
 * Data Type Distribution type
 */
export interface dataTypeDistribution {
  strings: number,
  numbers: number,
  dates: number,
  booleans: number,
  formulas: number,
  errors: number,
  empty: number,
}

/**
 * Sheet Data type
 */
export interface sheetData {
  name: string,
  data: any[],
  headers: string[],
  rowCount: number,
  columnCount: number,
  isEmpty: boolean,
  hasHeaders: boolean,
  dataTypes: dataTypeDistribution,
}

/**
 * Processing Statistics type
 */
export interface processingStatistics {
  fileSize: number,
  totalSheets: number,
  totalRows: number,
  totalColumns: number,
  totalCells: number,
  emptySheets: number,
  processingTime: number,
  memoryUsage: number,
  compressionRatio: number,
}

/**
 * Sheet Analysis type
 */
export interface sheetAnalysis {
  sheetName: string,
  dataQuality: number,
  headerConsistency: boolean,
  hasEmptyRows: boolean,
  hasEmptyColumns: boolean,
  dataTypeConsistency: boolean,
  recommendations: string[],
}

/**
 * Excel Analysis type
 */
export interface excelAnalysis {
  hasMultipleSheets: boolean,
  hasFormulas: boolean,
  hasErrors: boolean,
  hasEmptySheets: boolean,
  hasInconsistentHeaders: boolean,
  suggestedImprovements: string[],
  dataIssues: string[],
  qualityScore: number,
  sheetAnalysis: sheetAnalysis[],
}

/**
 * Excel Processing Result type
 */
export interface excelProcessingResult {
  id: string,
  fileName: string,
  fileSize: number,
  sheets: sheetData[],
  isValid: boolean
  error?: string
  statistics: processingStatistics
  analysis?: excelAnalysis
  createdAt: Date,
}

/**
 * Batch Statistics type
 */
export interface batchStatistics {
  totalProcessed: number,
  validCount: number,
  invalidCount: number,
  averageQuality: number,
  totalFileSize: number,
  totalSheets: number,
  successRate: number,
}

/**
 * Processing Settings type
 */
export interface processingSettings {
  includeEmptyRows: boolean,
  includeEmptyColumns: boolean,
  detectDataTypes: boolean,
  preserveFormulas: boolean,
  exportFormat: exportFormat,
  jsonIndentation: number,
  sheetSelection: sheetSelection,
  headerRow: number,
  dateFormat: string,
  numberFormat: string,
  realTimeProcessing: boolean,
}

/**
 * Processing Batch type
 */
export interface processingBatch {
  id: string,
  results: excelProcessingResult[],
  count: number,
  settings: processingSettings,
  createdAt: Date,
  statistics: batchStatistics,
}

/**
 * Excel Template type
 */
export interface excelTemplate {
  id: string,
  name: string,
  description: string,
  category: string,
  excelStructure: string,
  jsonExample: string,
  useCase: string[],
}

/**
 * File Error type
 */
export interface fileError {
  message: string,
  type: "format"| "size" | "content" | "permission"
  details?: string
}

/**
 * File Validation type
 */
export interface fileValidation {
  isValid: boolean,
  errors: fileError[],
  warnings: string[],
  suggestions: string[],
}

// ==================== Type Exports ====================

export type ExportFormat = exportFormat
export type SheetSelection = sheetSelection
export type DataTypeDistribution = dataTypeDistribution
export type SheetData = sheetData
export type ProcessingStatistics = processingStatistics
export type SheetAnalysis = sheetAnalysis
export type ExcelAnalysis = excelAnalysis
export type ExcelProcessingResult = excelProcessingResult
export type BatchStatistics = batchStatistics
export type ProcessingSettings = processingSettings
export type ProcessingBatch = processingBatch
export type ExcelTemplate = excelTemplate
export type FileError = fileError
export type FileValidation = fileValidation
