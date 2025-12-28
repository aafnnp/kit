// ==================== MIME Search Types ====================

/**
 * Query Type type
 */
export type queryType = "extension" | "mimetype" | "keyword" | "category"

/**
 * MIME Category type
 */
export type mimeCategory = "image" | "video" | "audio" | "text" | "application" | "font" | "model" | "multipart" | "message"

/**
 * Security Risk type
 */
export type securityRisk = "high" | "medium" | "low" | "minimal"

/**
 * Search Mode type
 */
export type searchMode = "fuzzy" | "exact" | "partial" | "regex"

/**
 * Export Format type
 */
export type exportFormat = "json" | "csv" | "xml" | "txt"

/**
 * Security Info type
 */
export interface securityInfo {
  riskLevel: securityRisk,
  executable: boolean,
  scriptable: boolean,
  canContainMalware: boolean,
  requiresSandbox: boolean,
  warnings: string[],
}

/**
 * Compression Info type
 */
export interface compressionInfo {
  isCompressed: boolean
  compressionType?: string
  typicalSize: string
  compressionRatio?: number
}

/**
 * Browser Support type
 */
export interface browserSupport {
  chrome: boolean,
  firefox: boolean,
  safari: boolean,
  edge: boolean,
  ie: boolean,
  mobile: boolean,
  notes: string[],
}

/**
 * MIME Type Info type
 */
export interface mimeTypeInfo {
  mimeType: string,
  extensions: string[],
  category: mimeCategory,
  description: string,
  commonName: string,
  isStandard: boolean
  rfc?: string
  usage: string[],
  security: securityInfo,
  compression: compressionInfo,
  browserSupport: browserSupport,
}

/**
 * MIME Statistics type
 */
export interface mimeStatistics {
  queryLength: number,
  resultCount: number,
  processingTime: number,
  categoryDistribution: Record<string, number>,
  securityRiskCount: number,
  standardCompliantCount: number,
}

/**
 * MIME Search Result type
 */
export interface mimeSearchResult {
  id: string,
  query: string,
  queryType: queryType,
  results: mimeTypeInfo[],
  isValid: boolean
  error?: string
  statistics: mimeStatistics,
  createdAt: Date,
}

/**
 * Batch Statistics type
 */
export interface batchStatistics {
  totalProcessed: number,
  validCount: number,
  invalidCount: number,
  totalResults: number,
  categoryDistribution: Record<string, number>,
  securityDistribution: Record<string, number>,
  successRate: number,
}

/**
 * Processing Settings type
 */
export interface processingSettings {
  searchMode: searchMode,
  includeDeprecated: boolean,
  includeExperimental: boolean,
  includeVendorSpecific: boolean,
  caseSensitive: boolean,
  exactMatch: boolean,
  includeSecurityInfo: boolean,
  includeBrowserSupport: boolean,
  exportFormat: exportFormat,
  realTimeSearch: boolean,
  maxResults: number,
}

/**
 * Processing Batch type
 */
export interface processingBatch {
  id: string,
  results: mimeSearchResult[],
  count: number,
  settings: processingSettings,
  createdAt: Date,
  statistics: batchStatistics,
}

/**
 * MIME Error type
 */
export interface mimeError {
  message: string,
  type: "format"| "syntax" | "security" | "compatibility",
  severity: "error"| "warning" | "info",
}

/**
 * MIME Validation type
 */
export interface mimeValidation {
  isValid: boolean,
  errors: mimeError[],
  warnings: string[],
  suggestions: string[],
}

/**
 * MIME Template type
 */
export interface mimeTemplate {
  id: string,
  name: string,
  description: string,
  category: string,
  examples: string[],
  useCase: string[],
  searchTerms: string[],
}

// ==================== Type Exports ====================

/**
 * Type definitions
 */
export type QueryType = queryType
export type MimeCategory = mimeCategory
export type SecurityRisk = securityRisk
export type SearchMode = searchMode
export type ExportFormat = exportFormat
export type SecurityInfo = securityInfo
export type CompressionInfo = compressionInfo
export type BrowserSupport = browserSupport
export type MimeTypeInfo = mimeTypeInfo
export type MimeStatistics = mimeStatistics
export type MimeSearchResult = mimeSearchResult
export type BatchStatistics = batchStatistics
export type ProcessingSettings = processingSettings
export type ProcessingBatch = processingBatch
export type MimeError = mimeError
export type MimeValidation = mimeValidation
export type MimeTemplate = mimeTemplate
