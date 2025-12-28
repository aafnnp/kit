// ==================== URL Encode Types ====================

/**
 * URL Operation type
 */
export type urlOperation = "encode" | "decode"

/**
 * URL Encoding Type type
 */
export type urlEncodingType = "component" | "uri" | "form" | "path" | "query"

/**
 * Export Format type
 */
export type exportFormat = "json" | "csv" | "txt" | "xml"

/**
 * URL Statistics type
 */
export interface urlStatistics {
  inputSize: number,
  outputSize: number,
  inputLength: number,
  outputLength: number,
  compressionRatio: number,
  processingTime: number,
  characterChanges: number,
  specialCharacters: number,
}

/**
 * URL Analysis type
 */
export interface urlAnalysis {
  protocol?: string,
  domain?: string,
  path?: string,
  queryParams?: Record<string, string>,
  fragment?: string,
  isValidURL: boolean,
  hasSpecialChars: boolean,
  hasUnicodeChars: boolean,
  hasSpaces: boolean,
  encodingNeeded: string[],
  securityIssues: string[],
}

/**
 * URL Processing Result type
 */
export interface urlProcessingResult {
  id: string,
  input: string,
  output: string,
  operation: urlOperation,
  encodingType: urlEncodingType,
  isValid: boolean
  error?: string,
  statistics: urlStatistics
  analysis?: urlAnalysis,
  createdAt: Date,
}

/**
 * URL Batch Statistics type
 */
export interface urlBatchStatistics {
  totalProcessed: number,
  validCount: number,
  invalidCount: number,
  averageCompressionRatio: number,
  totalInputSize: number,
  totalOutputSize: number,
  operationDistribution: Record<string, number>,
  successRate: number,
}

/**
 * URL Settings type
 */
export interface urlSettings {
  encodingType: urlEncodingType,
  realTimeProcessing: boolean,
  showAnalysis: boolean,
  validateURLs: boolean,
  exportFormat: exportFormat,
  maxLength: number,
  preserveCase: boolean,
}

/**
 * URL Batch type
 */
export interface urlBatch {
  id: string,
  results: urlProcessingResult[],
  count: number,
  settings: urlSettings,
  createdAt: Date,
  statistics: urlBatchStatistics,
}

/**
 * URL Template type
 */
export interface urlTemplate {
  id: string,
  name: string,
  description: string,
  category: string,
  operation: urlOperation,
  encodingType: urlEncodingType,
  example: string,
  useCase: string[],
}

/**
 * URL Error type
 */
export interface urlError {
  message: string
  position?: number,
  character?: string,
}

/**
 * URL Validation type
 */
export interface urlValidation {
  isValid: boolean,
  errors: urlError[],
  warnings: string[],
  suggestions: string[],
}

// ==================== Type Exports ====================

export type URLOperation = urlOperation
export type URLEncodingType = urlEncodingType
export type ExportFormat = exportFormat
export type URLStatistics = urlStatistics
export type URLAnalysis = urlAnalysis
export type URLProcessingResult = urlProcessingResult
export type URLBatchStatistics = urlBatchStatistics
export type URLSettings = urlSettings
export type URLBatch = urlBatch
export type URLTemplate = urlTemplate
export type URLError = urlError
export type URLValidation = urlValidation
export type UrlOperation = urlOperation
export type UrlEncodingType = urlEncodingType
export type UrlStatistics = urlStatistics
export type UrlAnalysis = urlAnalysis
export type UrlProcessingResult = urlProcessingResult
export type UrlBatchStatistics = urlBatchStatistics
export type UrlSettings = urlSettings
export type UrlBatch = urlBatch
export type UrlTemplate = urlTemplate
export type UrlError = urlError
export type UrlValidation = urlValidation
