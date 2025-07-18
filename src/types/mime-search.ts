// MIME Search 相关类型声明
export interface MimeSearchResult {
  id: string
  query: string
  queryType: QueryType
  results: MimeTypeInfo[]
  isValid: boolean
  error?: string
  statistics: MimeStatistics
  createdAt: Date
}

export interface MimeTypeInfo {
  mimeType: string
  extensions: string[]
  category: MimeCategory
  description: string
  commonName: string
  isStandard: boolean
  rfc?: string
  usage: string[]
  security: SecurityInfo
  compression: CompressionInfo
  browserSupport: BrowserSupport
}

export interface MimeStatistics {
  queryLength: number
  resultCount: number
  processingTime: number
  categoryDistribution: Record<string, number>
  securityRiskCount: number
  standardCompliantCount: number
}

export interface SecurityInfo {
  riskLevel: SecurityRisk
  executable: boolean
  scriptable: boolean
  canContainMalware: boolean
  requiresSandbox: boolean
  warnings: string[]
}

export interface CompressionInfo {
  isCompressed: boolean
  compressionType?: string
  typicalSize: string
  compressionRatio?: number
}

export interface BrowserSupport {
  chrome: boolean
  firefox: boolean
  safari: boolean
  edge: boolean
  ie: boolean
  mobile: boolean
  notes: string[]
}

export interface ProcessingBatch {
  id: string
  results: MimeSearchResult[]
  count: number
  settings: ProcessingSettings
  createdAt: Date
  statistics: BatchStatistics
}

export interface BatchStatistics {
  totalProcessed: number
  validCount: number
  invalidCount: number
  totalResults: number
  categoryDistribution: Record<string, number>
  securityDistribution: Record<string, number>
  successRate: number
}

export interface ProcessingSettings {
  searchMode: SearchMode
  includeDeprecated: boolean
  includeExperimental: boolean
  includeVendorSpecific: boolean
  caseSensitive: boolean
  exactMatch: boolean
  includeSecurityInfo: boolean
  includeBrowserSupport: boolean
  exportFormat: ExportFormat
  realTimeSearch: boolean
  maxResults: number
}

export interface MimeTemplate {
  id: string
  name: string
  description: string
  category: string
  examples: string[]
  useCase: string[]
  searchTerms: string[]
}

export interface MimeValidation {
  isValid: boolean
  errors: MimeError[]
  warnings: string[]
  suggestions: string[]
}

export interface MimeError {
  message: string
  type: 'format' | 'syntax' | 'security' | 'compatibility'
  severity: 'error' | 'warning' | 'info'
}

export type QueryType = 'extension' | 'mimetype' | 'keyword' | 'category'
export type MimeCategory =
  | 'image'
  | 'video'
  | 'audio'
  | 'text'
  | 'application'
  | 'font'
  | 'model'
  | 'multipart'
  | 'message'
export type SecurityRisk = 'high' | 'medium' | 'low' | 'minimal'
export type SearchMode = 'fuzzy' | 'exact' | 'partial' | 'regex'
export type ExportFormat = 'json' | 'csv' | 'xml' | 'txt'
