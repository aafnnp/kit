// Excel to JSON 相关类型声明
export interface ExcelProcessingResult {
  id: string
  fileName: string
  fileSize: number
  sheets: SheetData[]
  isValid: boolean
  error?: string
  statistics: ProcessingStatistics
  analysis?: ExcelAnalysis
  createdAt: Date
}

export interface SheetData {
  name: string
  data: any[]
  headers: string[]
  rowCount: number
  columnCount: number
  isEmpty: boolean
  hasHeaders: boolean
  dataTypes: DataTypeDistribution
}

export interface ProcessingStatistics {
  fileSize: number
  totalSheets: number
  totalRows: number
  totalColumns: number
  totalCells: number
  emptySheets: number
  processingTime: number
  memoryUsage: number
  compressionRatio: number
}

export interface DataTypeDistribution {
  strings: number
  numbers: number
  dates: number
  booleans: number
  formulas: number
  errors: number
  empty: number
}

export interface ExcelAnalysis {
  hasMultipleSheets: boolean
  hasFormulas: boolean
  hasErrors: boolean
  hasEmptySheets: boolean
  hasInconsistentHeaders: boolean
  suggestedImprovements: string[]
  dataIssues: string[]
  qualityScore: number
  sheetAnalysis: SheetAnalysis[]
}

export interface SheetAnalysis {
  sheetName: string
  dataQuality: number
  headerConsistency: boolean
  hasEmptyRows: boolean
  hasEmptyColumns: boolean
  dataTypeConsistency: boolean
  recommendations: string[]
}

export interface ProcessingBatch {
  id: string
  results: ExcelProcessingResult[]
  count: number
  settings: ProcessingSettings
  createdAt: Date
  statistics: BatchStatistics
}

export interface BatchStatistics {
  totalProcessed: number
  validCount: number
  invalidCount: number
  averageQuality: number
  totalFileSize: number
  totalSheets: number
  successRate: number
}

export interface ProcessingSettings {
  includeEmptyRows: boolean
  includeEmptyColumns: boolean
  detectDataTypes: boolean
  preserveFormulas: boolean
  exportFormat: ExportFormat
  jsonIndentation: number
  sheetSelection: SheetSelection
  headerRow: number
  dateFormat: string
  numberFormat: string
  realTimeProcessing: boolean
}

export interface ExcelTemplate {
  id: string
  name: string
  description: string
  category: string
  excelStructure: string
  jsonExample: string
  useCase: string[]
}

export interface FileValidation {
  isValid: boolean
  errors: FileError[]
  warnings: string[]
  suggestions: string[]
}

export interface FileError {
  message: string
  type: 'format' | 'size' | 'content' | 'permission'
  details?: string
}

export type ExportFormat = 'json' | 'csv' | 'txt' | 'xlsx'
export type SheetSelection = 'all' | 'first' | 'selected' | 'non-empty'
