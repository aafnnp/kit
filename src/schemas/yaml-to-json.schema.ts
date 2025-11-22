import { z } from "zod"

// ==================== YAML to JSON Schemas ====================

/**
 * Data Format schema
 */
export const dataFormatSchema = z.enum(["yaml", "json"])

/**
 * Export Format schema
 */
export const exportFormatSchema = z.enum(["json", "csv", "txt", "xml"])

/**
 * YAML Features schema
 */
export const yamlFeaturesSchema = z.object({
  hasComments: z.boolean(),
  hasMultilineStrings: z.boolean(),
  hasAnchors: z.boolean(),
  hasReferences: z.boolean(),
  hasDocumentSeparators: z.boolean(),
  hasDirectives: z.boolean(),
})

/**
 * Complexity Metrics schema
 */
export const complexityMetricsSchema = z.object({
  depth: z.number(),
  keys: z.number(),
  arrays: z.number(),
  objects: z.number(),
  primitives: z.number(),
  yamlFeatures: yamlFeaturesSchema.optional(),
})

/**
 * Conversion Statistics schema
 */
export const conversionStatisticsSchema = z.object({
  inputSize: z.number(),
  outputSize: z.number(),
  inputLines: z.number(),
  outputLines: z.number(),
  compressionRatio: z.number(),
  processingTime: z.number(),
  complexity: complexityMetricsSchema,
})

/**
 * Conversion Result schema
 */
export const conversionResultSchema = z.object({
  id: z.string(),
  input: z.string(),
  output: z.string(),
  inputFormat: dataFormatSchema,
  outputFormat: dataFormatSchema,
  isValid: z.boolean(),
  error: z.string().optional(),
  statistics: conversionStatisticsSchema,
  createdAt: z.date(),
})

/**
 * Batch Statistics schema
 */
export const batchStatisticsSchema = z.object({
  totalConversions: z.number(),
  validCount: z.number(),
  invalidCount: z.number(),
  averageCompressionRatio: z.number(),
  totalInputSize: z.number(),
  totalOutputSize: z.number(),
  formatDistribution: z.record(z.string(), z.number()),
  successRate: z.number(),
})

/**
 * Conversion Settings schema
 */
export const conversionSettingsSchema = z.object({
  yamlIndentSize: z.number(),
  jsonIndentSize: z.number(),
  preserveComments: z.boolean(),
  sortKeys: z.boolean(),
  flowStyle: z.boolean(),
  realTimeConversion: z.boolean(),
  validateOutput: z.boolean(),
  exportFormat: exportFormatSchema,
  maxFileSize: z.number(),
})

/**
 * Conversion Batch schema
 */
export const conversionBatchSchema = z.object({
  id: z.string(),
  conversions: z.array(conversionResultSchema),
  count: z.number(),
  settings: conversionSettingsSchema,
  createdAt: z.date(),
  statistics: batchStatisticsSchema,
})

/**
 * Conversion Template schema
 */
export const conversionTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  yamlContent: z.string(),
  jsonContent: z.string(),
  useCase: z.array(z.string()),
})

/**
 * Validation Error schema
 */
export const validationErrorSchema = z.object({
  message: z.string(),
  line: z.number().optional(),
  column: z.number().optional(),
  path: z.string().optional(),
})

/**
 * Validation Result schema
 */
export const validationResultSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(validationErrorSchema),
  warnings: z.array(z.string()),
  suggestions: z.array(z.string()),
})

// ==================== Type Exports ====================

export type DataFormat = z.infer<typeof dataFormatSchema>
export type ExportFormat = z.infer<typeof exportFormatSchema>
export type YAMLFeatures = z.infer<typeof yamlFeaturesSchema>
export type ComplexityMetrics = z.infer<typeof complexityMetricsSchema>
export type ConversionStatistics = z.infer<typeof conversionStatisticsSchema>
export type ConversionResult = z.infer<typeof conversionResultSchema>
export type BatchStatistics = z.infer<typeof batchStatisticsSchema>
export type ConversionSettings = z.infer<typeof conversionSettingsSchema>
export type ConversionBatch = z.infer<typeof conversionBatchSchema>
export type ConversionTemplate = z.infer<typeof conversionTemplateSchema>
export type ValidationError = z.infer<typeof validationErrorSchema>
export type ValidationResult = z.infer<typeof validationResultSchema>
