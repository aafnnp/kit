import { z } from "zod"

// ==================== URL Parser Schemas ====================

/**
 * Export Format schema
 */
export const exportFormatSchema = z.enum(["json", "csv", "xml", "txt"])

/**
 * URL Search Param schema
 */
export const urlSearchParamSchema = z.object({
  key: z.string(),
  value: z.string(),
  encoded: z.boolean(),
})

/**
 * URL Components schema
 */
export const urlComponentsSchema = z.object({
  protocol: z.string(),
  hostname: z.string(),
  port: z.string(),
  pathname: z.string(),
  search: z.string(),
  hash: z.string(),
  origin: z.string(),
  host: z.string(),
  username: z.string().optional(),
  password: z.string().optional(),
  searchParams: z.array(urlSearchParamSchema),
  pathSegments: z.array(z.string()),
  subdomain: z.string().optional(),
  domain: z.string(),
  tld: z.string(),
  isSecure: z.boolean(),
  defaultPort: z.boolean(),
  hasCredentials: z.boolean(),
})

/**
 * URL Compliance schema
 */
export const urlComplianceSchema = z.object({
  rfc3986Compliant: z.boolean(),
  w3cCompliant: z.boolean(),
  seoFriendly: z.boolean(),
  accessibilityFriendly: z.boolean(),
  issues: z.array(z.string()),
  recommendations: z.array(z.string()),
})

/**
 * URL Analysis schema
 */
export const urlAnalysisSchema = z.object({
  isValidURL: z.boolean(),
  urlType: z.enum(["absolute", "relative", "protocol-relative", "invalid"]),
  hasCredentials: z.boolean(),
  hasQuery: z.boolean(),
  hasFragment: z.boolean(),
  hasPort: z.boolean(),
  isLocalhost: z.boolean(),
  isIP: z.boolean(),
  isDomain: z.boolean(),
  pathDepth: z.number(),
  queryParamCount: z.number(),
  urlLength: z.number(),
  qualityScore: z.number(),
  usabilityScore: z.number(),
  securityScore: z.number(),
  seoScore: z.number(),
  issues: z.array(z.string()),
  recommendations: z.array(z.string()),
  compliance: urlComplianceSchema,
})

/**
 * URL Security schema
 */
export const urlSecuritySchema = z.object({
  isSecure: z.boolean(),
  hasCredentials: z.boolean(),
  credentialExposure: z.boolean(),
  suspiciousPatterns: z.array(z.string()),
  securityIssues: z.array(z.string()),
  riskLevel: z.enum(["low", "medium", "high"]),
  securityScore: z.number(),
  recommendations: z.array(z.string()),
  phishingIndicators: z.array(z.string()),
  malwareIndicators: z.array(z.string()),
})

/**
 * URL SEO Analysis schema
 */
export const urlSEOAnalysisSchema = z.object({
  isSearchEngineFriendly: z.boolean(),
  hasReadableStructure: z.boolean(),
  hasKeywords: z.boolean(),
  pathStructureScore: z.number(),
  readabilityScore: z.number(),
  lengthScore: z.number(),
  issues: z.array(z.string()),
  recommendations: z.array(z.string()),
  keywords: z.array(z.string()),
  stopWords: z.array(z.string()),
})

/**
 * URL Statistics schema
 */
export const urlStatisticsSchema = z.object({
  urlLength: z.number(),
  pathLength: z.number(),
  queryLength: z.number(),
  fragmentLength: z.number(),
  parameterCount: z.number(),
  pathSegmentCount: z.number(),
  processingTime: z.number(),
  complexityScore: z.number(),
  readabilityIndex: z.number(),
})

/**
 * URL Parse Result schema
 */
export const urlParseResultSchema = z.object({
  id: z.string(),
  url: z.string(),
  isValid: z.boolean(),
  error: z.string().optional(),
  components: urlComponentsSchema.optional(),
  analysis: urlAnalysisSchema.optional(),
  security: urlSecuritySchema.optional(),
  seo: urlSEOAnalysisSchema.optional(),
  statistics: urlStatisticsSchema,
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
  averageSecurity: z.number(),
  averageSEO: z.number(),
  successRate: z.number(),
  protocolDistribution: z.record(z.string(), z.number()),
  domainDistribution: z.record(z.string(), z.number()),
  securityDistribution: z.record(z.string(), z.number()),
})

/**
 * Processing Settings schema
 */
export const processingSettingsSchema = z.object({
  includeSecurityAnalysis: z.boolean(),
  includeSEOAnalysis: z.boolean(),
  includeCompliance: z.boolean(),
  validateDomains: z.boolean(),
  checkSuspiciousPatterns: z.boolean(),
  exportFormat: exportFormatSchema,
  realTimeValidation: z.boolean(),
  maxResults: z.number(),
  strictMode: z.boolean(),
})

/**
 * Processing Batch schema
 */
export const processingBatchSchema = z.object({
  id: z.string(),
  results: z.array(urlParseResultSchema),
  count: z.number(),
  settings: processingSettingsSchema,
  createdAt: z.date(),
  statistics: batchStatisticsSchema,
})

/**
 * URL Error schema
 */
export const urlErrorSchema = z.object({
  message: z.string(),
  type: z.enum(["format", "protocol", "domain", "security", "compliance"]),
  severity: z.enum(["error", "warning", "info"]),
})

/**
 * URL Validation schema
 */
export const urlValidationSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(urlErrorSchema),
  warnings: z.array(z.string()),
  suggestions: z.array(z.string()),
  urlType: z.string().optional(),
})

/**
 * URL Template schema
 */
export const urlTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  urls: z.array(z.string()),
  analysisTypes: z.array(z.string()),
  useCase: z.array(z.string()),
  examples: z.array(z.string()),
})

// ==================== Type Exports ====================

/**
 * Type inference from zod schemas
 */
export type ExportFormat = z.infer<typeof exportFormatSchema>
export type URLSearchParam = z.infer<typeof urlSearchParamSchema>
export type URLComponents = z.infer<typeof urlComponentsSchema>
export type URLCompliance = z.infer<typeof urlComplianceSchema>
export type URLAnalysis = z.infer<typeof urlAnalysisSchema>
export type URLSecurity = z.infer<typeof urlSecuritySchema>
export type URLSEOAnalysis = z.infer<typeof urlSEOAnalysisSchema>
export type URLStatistics = z.infer<typeof urlStatisticsSchema>
export type URLParseResult = z.infer<typeof urlParseResultSchema>
export type BatchStatistics = z.infer<typeof batchStatisticsSchema>
export type ProcessingSettings = z.infer<typeof processingSettingsSchema>
export type ProcessingBatch = z.infer<typeof processingBatchSchema>
export type URLError = z.infer<typeof urlErrorSchema>
export type URLValidation = z.infer<typeof urlValidationSchema>
export type URLTemplate = z.infer<typeof urlTemplateSchema>

