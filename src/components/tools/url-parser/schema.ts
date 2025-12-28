// ==================== URL Parser Types ====================

/**
 * Export Format type
 */
export type exportFormat = "json" | "csv" | "xml" | "txt"

/**
 * URL Search Param type
 */
export interface urlSearchParam {
  key: string,
  value: string,
  encoded: boolean,
}

/**
 * URL Components type
 */
export interface urlComponents {
  protocol: string,
  hostname: string,
  port: string,
  pathname: string,
  search: string,
  hash: string,
  origin: string,
  host: string
  username?: string
  password?: string
  searchParams: urlSearchParam[],
  pathSegments: string[]
  subdomain?: string
  domain: string,
  tld: string,
  isSecure: boolean,
  defaultPort: boolean,
  hasCredentials: boolean,
}

/**
 * URL Compliance type
 */
export interface urlCompliance {
  rfc3986Compliant: boolean,
  w3cCompliant: boolean,
  seoFriendly: boolean,
  accessibilityFriendly: boolean,
  issues: string[],
  recommendations: string[],
}

/**
 * URL Analysis type
 */
export interface urlAnalysis {
  isValidURL: boolean,
  urlType: "absolute"| "relative" | "protocol-relative" | "invalid",
  hasCredentials: boolean,
  hasQuery: boolean,
  hasFragment: boolean,
  hasPort: boolean,
  isLocalhost: boolean,
  isIP: boolean,
  isDomain: boolean,
  pathDepth: number,
  queryParamCount: number,
  urlLength: number,
  qualityScore: number,
  usabilityScore: number,
  securityScore: number,
  seoScore: number,
  issues: string[],
  recommendations: string[],
  compliance: urlCompliance,
}

/**
 * URL Security type
 */
export interface urlSecurity {
  isSecure: boolean,
  hasCredentials: boolean,
  credentialExposure: boolean,
  suspiciousPatterns: string[],
  securityIssues: string[],
  riskLevel: "low"| "medium" | "high",
  securityScore: number,
  recommendations: string[],
  phishingIndicators: string[],
  malwareIndicators: string[],
}

/**
 * URL SEO Analysis type
 */
export interface urlSEOAnalysis {
  isSearchEngineFriendly: boolean,
  hasReadableStructure: boolean,
  hasKeywords: boolean,
  pathStructureScore: number,
  readabilityScore: number,
  lengthScore: number,
  issues: string[],
  recommendations: string[],
  keywords: string[],
  stopWords: string[],
}

/**
 * URL Statistics type
 */
export interface urlStatistics {
  urlLength: number,
  pathLength: number,
  queryLength: number,
  fragmentLength: number,
  parameterCount: number,
  pathSegmentCount: number,
  processingTime: number,
  complexityScore: number,
  readabilityIndex: number,
}

/**
 * URL Parse Result type
 */
export interface urlParseResult {
  id: string,
  url: string,
  isValid: boolean
  error?: string
  components?: urlComponents
  analysis?: urlAnalysis
  security?: urlSecurity
  seo?: urlSEOAnalysis
  statistics: urlStatistics,
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
  averageSecurity: number,
  averageSEO: number,
  successRate: number,
  protocolDistribution: Record<string, number>,
  domainDistribution: Record<string, number>,
  securityDistribution: Record<string, number>,
}

/**
 * Processing Settings type
 */
export interface processingSettings {
  includeSecurityAnalysis: boolean,
  includeSEOAnalysis: boolean,
  includeCompliance: boolean,
  validateDomains: boolean,
  checkSuspiciousPatterns: boolean,
  exportFormat: exportFormat,
  realTimeValidation: boolean,
  maxResults: number,
  strictMode: boolean,
}

/**
 * Processing Batch type
 */
export interface processingBatch {
  id: string,
  results: urlParseResult[],
  count: number,
  settings: processingSettings,
  createdAt: Date,
  statistics: batchStatistics,
}

/**
 * URL Error type
 */
export interface urlError {
  message: string,
  type: "format"| "protocol" | "domain" | "security" | "compliance",
  severity: "error"| "warning" | "info",
}

/**
 * URL Validation type
 */
export interface urlValidation {
  isValid: boolean,
  errors: urlError[],
  warnings: string[],
  suggestions: string[]
  urlType?: string
}

/**
 * URL Template type
 */
export interface urlTemplate {
  id: string,
  name: string,
  description: string,
  category: string,
  urls: string[],
  analysisTypes: string[],
  useCase: string[],
  examples: string[],
}

// ==================== Type Exports ====================

/**
 * Type definitions
 */
export type ExportFormat = exportFormat
export type URLSearchParam = urlSearchParam
export type URLComponents = urlComponents
export type URLCompliance = urlCompliance
export type URLAnalysis = urlAnalysis
export type URLSecurity = urlSecurity
export type URLSEOAnalysis = urlSEOAnalysis
export type URLStatistics = urlStatistics
export type URLParseResult = urlParseResult
export type BatchStatistics = batchStatistics
export type ProcessingSettings = processingSettings
export type ProcessingBatch = processingBatch
export type URLError = urlError
export type URLValidation = urlValidation
export type URLTemplate = urlTemplate
export type UrlSearchParam = urlSearchParam
export type UrlComponents = urlComponents
export type UrlCompliance = urlCompliance
export type UrlAnalysis = urlAnalysis
export type UrlSecurity = urlSecurity
export type UrlSEOAnalysis = urlSEOAnalysis
export type UrlStatistics = urlStatistics
export type UrlParseResult = urlParseResult
export type UrlError = urlError
export type UrlValidation = urlValidation
export type UrlTemplate = urlTemplate
