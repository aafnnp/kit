import { z } from "zod"

// ==================== MIME Search Schemas ====================

/**
 * Query Type schema
 */
export const queryTypeSchema = z.enum([
  "extension",
  "mimetype",
  "keyword",
  "category",
])

/**
 * MIME Category schema
 */
export const mimeCategorySchema = z.enum([
  "image",
  "video",
  "audio",
  "text",
  "application",
  "font",
  "model",
  "multipart",
  "message",
])

/**
 * Security Risk schema
 */
export const securityRiskSchema = z.enum(["high", "medium", "low", "minimal"])

/**
 * Search Mode schema
 */
export const searchModeSchema = z.enum(["fuzzy", "exact", "partial", "regex"])

/**
 * Export Format schema
 */
export const exportFormatSchema = z.enum(["json", "csv", "xml", "txt"])

/**
 * Security Info schema
 */
export const securityInfoSchema = z.object({
  riskLevel: securityRiskSchema,
  executable: z.boolean(),
  scriptable: z.boolean(),
  canContainMalware: z.boolean(),
  requiresSandbox: z.boolean(),
  warnings: z.array(z.string()),
})

/**
 * Compression Info schema
 */
export const compressionInfoSchema = z.object({
  isCompressed: z.boolean(),
  compressionType: z.string().optional(),
  typicalSize: z.string(),
  compressionRatio: z.number().optional(),
})

/**
 * Browser Support schema
 */
export const browserSupportSchema = z.object({
  chrome: z.boolean(),
  firefox: z.boolean(),
  safari: z.boolean(),
  edge: z.boolean(),
  ie: z.boolean(),
  mobile: z.boolean(),
  notes: z.array(z.string()),
})

/**
 * MIME Type Info schema
 */
export const mimeTypeInfoSchema = z.object({
  mimeType: z.string(),
  extensions: z.array(z.string()),
  category: mimeCategorySchema,
  description: z.string(),
  commonName: z.string(),
  isStandard: z.boolean(),
  rfc: z.string().optional(),
  usage: z.array(z.string()),
  security: securityInfoSchema,
  compression: compressionInfoSchema,
  browserSupport: browserSupportSchema,
})

/**
 * MIME Statistics schema
 */
export const mimeStatisticsSchema = z.object({
  queryLength: z.number(),
  resultCount: z.number(),
  processingTime: z.number(),
  categoryDistribution: z.record(z.string(), z.number()),
  securityRiskCount: z.number(),
  standardCompliantCount: z.number(),
})

/**
 * MIME Search Result schema
 */
export const mimeSearchResultSchema = z.object({
  id: z.string(),
  query: z.string(),
  queryType: queryTypeSchema,
  results: z.array(mimeTypeInfoSchema),
  isValid: z.boolean(),
  error: z.string().optional(),
  statistics: mimeStatisticsSchema,
  createdAt: z.date(),
})

/**
 * Batch Statistics schema
 */
export const batchStatisticsSchema = z.object({
  totalProcessed: z.number(),
  validCount: z.number(),
  invalidCount: z.number(),
  totalResults: z.number(),
  categoryDistribution: z.record(z.string(), z.number()),
  securityDistribution: z.record(z.string(), z.number()),
  successRate: z.number(),
})

/**
 * Processing Settings schema
 */
export const processingSettingsSchema = z.object({
  searchMode: searchModeSchema,
  includeDeprecated: z.boolean(),
  includeExperimental: z.boolean(),
  includeVendorSpecific: z.boolean(),
  caseSensitive: z.boolean(),
  exactMatch: z.boolean(),
  includeSecurityInfo: z.boolean(),
  includeBrowserSupport: z.boolean(),
  exportFormat: exportFormatSchema,
  realTimeSearch: z.boolean(),
  maxResults: z.number(),
})

/**
 * Processing Batch schema
 */
export const processingBatchSchema = z.object({
  id: z.string(),
  results: z.array(mimeSearchResultSchema),
  count: z.number(),
  settings: processingSettingsSchema,
  createdAt: z.date(),
  statistics: batchStatisticsSchema,
})

/**
 * MIME Error schema
 */
export const mimeErrorSchema = z.object({
  message: z.string(),
  type: z.enum(["format", "syntax", "security", "compatibility"]),
  severity: z.enum(["error", "warning", "info"]),
})

/**
 * MIME Validation schema
 */
export const mimeValidationSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(mimeErrorSchema),
  warnings: z.array(z.string()),
  suggestions: z.array(z.string()),
})

/**
 * MIME Template schema
 */
export const mimeTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  examples: z.array(z.string()),
  useCase: z.array(z.string()),
  searchTerms: z.array(z.string()),
})

// ==================== Type Exports ====================

/**
 * Type inference from zod schemas
 */
export type QueryType = z.infer<typeof queryTypeSchema>
export type MimeCategory = z.infer<typeof mimeCategorySchema>
export type SecurityRisk = z.infer<typeof securityRiskSchema>
export type SearchMode = z.infer<typeof searchModeSchema>
export type ExportFormat = z.infer<typeof exportFormatSchema>
export type SecurityInfo = z.infer<typeof securityInfoSchema>
export type CompressionInfo = z.infer<typeof compressionInfoSchema>
export type BrowserSupport = z.infer<typeof browserSupportSchema>
export type MimeTypeInfo = z.infer<typeof mimeTypeInfoSchema>
export type MimeStatistics = z.infer<typeof mimeStatisticsSchema>
export type MimeSearchResult = z.infer<typeof mimeSearchResultSchema>
export type BatchStatistics = z.infer<typeof batchStatisticsSchema>
export type ProcessingSettings = z.infer<typeof processingSettingsSchema>
export type ProcessingBatch = z.infer<typeof processingBatchSchema>
export type MimeError = z.infer<typeof mimeErrorSchema>
export type MimeValidation = z.infer<typeof mimeValidationSchema>
export type MimeTemplate = z.infer<typeof mimeTemplateSchema>

