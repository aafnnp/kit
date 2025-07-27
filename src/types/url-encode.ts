// 所有类型声明均从 url-encode.tsx 迁移
export interface URLProcessingResult {
  id: string
  input: string
  output: string
  operation: URLOperation
  encodingType: URLEncodingType
  isValid: boolean
  error?: string
  statistics: URLStatistics
  analysis?: URLAnalysis
  createdAt: Date
}

export interface URLStatistics {
  inputSize: number
  outputSize: number
  inputLength: number
  outputLength: number
  compressionRatio: number
  processingTime: number
  characterChanges: number
  specialCharacters: number
}

export interface URLAnalysis {
  protocol?: string
  domain?: string
  path?: string
  queryParams?: Record<string, string>
  fragment?: string
  isValidURL: boolean
  hasSpecialChars: boolean
  hasUnicodeChars: boolean
  hasSpaces: boolean
  encodingNeeded: string[]
  securityIssues: string[]
}

export interface URLBatch {
  id: string
  results: URLProcessingResult[]
  count: number
  settings: URLSettings
  createdAt: Date
  statistics: URLBatchStatistics
}

export interface URLBatchStatistics {
  totalProcessed: number
  validCount: number
  invalidCount: number
  averageCompressionRatio: number
  totalInputSize: number
  totalOutputSize: number
  operationDistribution: Record<string, number>
  successRate: number
}

export interface URLSettings {
  encodingType: URLEncodingType
  realTimeProcessing: boolean
  showAnalysis: boolean
  validateURLs: boolean
  exportFormat: ExportFormat
  maxLength: number
  preserveCase: boolean
}

export interface URLTemplate {
  id: string
  name: string
  description: string
  category: string
  operation: URLOperation
  encodingType: URLEncodingType
  example: string
  useCase: string[]
}

export interface URLValidation {
  isValid: boolean
  errors: URLError[]
  warnings: string[]
  suggestions: string[]
}

export interface URLError {
  message: string
  position?: number
  character?: string
}

export type URLOperation = 'encode' | 'decode'
export type URLEncodingType = 'component' | 'uri' | 'form' | 'path' | 'query'
export type ExportFormat = 'json' | 'csv' | 'txt' | 'xml'
