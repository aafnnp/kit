import { z } from "zod"

// ==================== URL Encode Schemas ====================

/**
 * URL Operation schema
 */
export const urlOperationSchema = z.enum(["encode", "decode"])

/**
 * URL Encoding Type schema
 */
export const urlEncodingTypeSchema = z.enum(["component", "uri", "form", "path", "query"])

/**
 * Export Format schema
 */
export const exportFormatSchema = z.enum(["json", "csv", "txt", "xml"])

/**
 * URL Statistics schema
 */
export const urlStatisticsSchema = z.object({
  inputSize: z.number(),
  outputSize: z.number(),
  inputLength: z.number(),
  outputLength: z.number(),
  compressionRatio: z.number(),
  processingTime: z.number(),
  characterChanges: z.number(),
  specialCharacters: z.number(),
})

/**
 * URL Analysis schema
 */
export const urlAnalysisSchema = z.object({
  protocol: z.string().optional(),
  domain: z.string().optional(),
  path: z.string().optional(),
  queryParams: z.record(z.string(), z.string()).optional(),
  fragment: z.string().optional(),
  isValidURL: z.boolean(),
  hasSpecialChars: z.boolean(),
  hasUnicodeChars: z.boolean(),
  hasSpaces: z.boolean(),
  encodingNeeded: z.array(z.string()),
  securityIssues: z.array(z.string()),
})

/**
 * URL Processing Result schema
 */
export const urlProcessingResultSchema = z.object({
  id: z.string(),
  input: z.string(),
  output: z.string(),
  operation: urlOperationSchema,
  encodingType: urlEncodingTypeSchema,
  isValid: z.boolean(),
  error: z.string().optional(),
  statistics: urlStatisticsSchema,
  analysis: urlAnalysisSchema.optional(),
  createdAt: z.date(),
})

/**
 * URL Batch Statistics schema
 */
export const urlBatchStatisticsSchema = z.object({
  totalProcessed: z.number(),
  validCount: z.number(),
  invalidCount: z.number(),
  averageCompressionRatio: z.number(),
  totalInputSize: z.number(),
  totalOutputSize: z.number(),
  operationDistribution: z.record(z.string(), z.number()),
  successRate: z.number(),
})

/**
 * URL Settings schema
 */
export const urlSettingsSchema = z.object({
  encodingType: urlEncodingTypeSchema,
  realTimeProcessing: z.boolean(),
  showAnalysis: z.boolean(),
  validateURLs: z.boolean(),
  exportFormat: exportFormatSchema,
  maxLength: z.number(),
  preserveCase: z.boolean(),
})

/**
 * URL Batch schema
 */
export const urlBatchSchema = z.object({
  id: z.string(),
  results: z.array(urlProcessingResultSchema),
  count: z.number(),
  settings: urlSettingsSchema,
  createdAt: z.date(),
  statistics: urlBatchStatisticsSchema,
})

/**
 * URL Template schema
 */
export const urlTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  operation: urlOperationSchema,
  encodingType: urlEncodingTypeSchema,
  example: z.string(),
  useCase: z.array(z.string()),
})

/**
 * URL Error schema
 */
export const urlErrorSchema = z.object({
  message: z.string(),
  position: z.number().optional(),
  character: z.string().optional(),
})

/**
 * URL Validation schema
 */
export const urlValidationSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(urlErrorSchema),
  warnings: z.array(z.string()),
  suggestions: z.array(z.string()),
})

// ==================== Type Exports ====================

export type URLOperation = z.infer<typeof urlOperationSchema>
export type URLEncodingType = z.infer<typeof urlEncodingTypeSchema>
export type ExportFormat = z.infer<typeof exportFormatSchema>
export type URLStatistics = z.infer<typeof urlStatisticsSchema>
export type URLAnalysis = z.infer<typeof urlAnalysisSchema>
export type URLProcessingResult = z.infer<typeof urlProcessingResultSchema>
export type URLBatchStatistics = z.infer<typeof urlBatchStatisticsSchema>
export type URLSettings = z.infer<typeof urlSettingsSchema>
export type URLBatch = z.infer<typeof urlBatchSchema>
export type URLTemplate = z.infer<typeof urlTemplateSchema>
export type URLError = z.infer<typeof urlErrorSchema>
export type URLValidation = z.infer<typeof urlValidationSchema>
