import { z } from "zod"

// ==================== Base64 Image Schemas ====================

/**
 * Conversion Direction schema
 */
export const conversionDirectionSchema = z.enum(["image-to-base64", "base64-to-image"])

/**
 * Image Format schema
 */
export const imageFormatSchema = z.enum(["jpeg", "png", "webp", "gif", "bmp"])

/**
 * Export Format schema
 */
export const exportFormatSchema = z.enum(["base64", "dataurl", "json", "txt"])

/**
 * Image Metadata schema
 */
export const imageMetadataSchema = z.object({
  width: z.number(),
  height: z.number(),
  format: z.string(),
  mimeType: z.string(),
  aspectRatio: z.number(),
  pixelCount: z.number(),
  estimatedColors: z.number(),
  hasTransparency: z.boolean(),
})

/**
 * Quality Metrics schema
 */
export const qualityMetricsSchema = z.object({
  resolution: z.string(),
  sizeCategory: z.string(),
  compressionEfficiency: z.number(),
  dataUrlOverhead: z.number(),
  base64Efficiency: z.number(),
})

/**
 * Image Statistics schema
 */
export const imageStatisticsSchema = z.object({
  inputSize: z.number(),
  outputSize: z.number(),
  compressionRatio: z.number(),
  processingTime: z.number(),
  imageMetadata: imageMetadataSchema,
  qualityMetrics: qualityMetricsSchema,
})

/**
 * Image Analysis schema
 */
export const imageAnalysisSchema = z.object({
  isValidImage: z.boolean(),
  hasDataUrlPrefix: z.boolean(),
  isOptimized: z.boolean(),
  suggestedImprovements: z.array(z.string()),
  imageIssues: z.array(z.string()),
  qualityScore: z.number(),
  formatRecommendations: z.array(z.string()),
})

/**
 * Image Processing Result schema
 */
export const imageProcessingResultSchema = z.object({
  id: z.string(),
  input: z.string(),
  output: z.string(),
  direction: conversionDirectionSchema,
  isValid: z.boolean(),
  error: z.string().optional(),
  statistics: imageStatisticsSchema,
  analysis: imageAnalysisSchema.optional(),
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
  totalInputSize: z.number(),
  totalOutputSize: z.number(),
  successRate: z.number(),
})

/**
 * Processing Settings schema
 */
export const processingSettingsSchema = z.object({
  outputFormat: imageFormatSchema,
  quality: z.number(),
  maxWidth: z.number(),
  maxHeight: z.number(),
  includeDataUrlPrefix: z.boolean(),
  realTimeProcessing: z.boolean(),
  exportFormat: exportFormatSchema,
  compressionLevel: z.number(),
  preserveMetadata: z.boolean(),
  autoOptimize: z.boolean(),
})

/**
 * Processing Batch schema
 */
export const processingBatchSchema = z.object({
  id: z.string(),
  results: z.array(imageProcessingResultSchema),
  count: z.number(),
  settings: processingSettingsSchema,
  createdAt: z.date(),
  statistics: batchStatisticsSchema,
})

/**
 * Image Template schema
 */
export const imageTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  base64Example: z.string(),
  imageInfo: z.string(),
  useCase: z.array(z.string()),
})

/**
 * Image Error schema
 */
export const imageErrorSchema = z.object({
  message: z.string(),
  type: z.enum(["format", "size", "encoding", "corruption"]),
  details: z.string().optional(),
})

/**
 * Image Validation schema
 */
export const imageValidationSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(imageErrorSchema),
  warnings: z.array(z.string()),
  suggestions: z.array(z.string()),
})

// ==================== Type Exports ====================

export type ConversionDirection = z.infer<typeof conversionDirectionSchema>
export type ImageFormat = z.infer<typeof imageFormatSchema>
export type ExportFormat = z.infer<typeof exportFormatSchema>
export type ImageMetadata = z.infer<typeof imageMetadataSchema>
export type QualityMetrics = z.infer<typeof qualityMetricsSchema>
export type ImageStatistics = z.infer<typeof imageStatisticsSchema>
export type ImageAnalysis = z.infer<typeof imageAnalysisSchema>
export type ImageProcessingResult = z.infer<typeof imageProcessingResultSchema>
export type BatchStatistics = z.infer<typeof batchStatisticsSchema>
export type ProcessingSettings = z.infer<typeof processingSettingsSchema>
export type ProcessingBatch = z.infer<typeof processingBatchSchema>
export type ImageTemplate = z.infer<typeof imageTemplateSchema>
export type ImageError = z.infer<typeof imageErrorSchema>
export type ImageValidation = z.infer<typeof imageValidationSchema>
