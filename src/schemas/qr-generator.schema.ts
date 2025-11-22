import { z } from "zod"

// ==================== QR Generator Schemas ====================

/**
 * QR Content Type schema
 */
export const qrContentTypeSchema = z.enum([
  "text",
  "url",
  "email",
  "phone",
  "sms",
  "wifi",
  "vcard",
  "event",
  "location",
  "payment",
])

/**
 * QR Format schema
 */
export const qrFormatSchema = z.enum(["png", "svg", "jpeg", "webp"])

/**
 * Error Correction Level schema
 */
export const errorCorrectionLevelSchema = z.enum(["L", "M", "Q", "H"])

/**
 * Export Format schema
 */
export const exportFormatSchema = z.enum(["png", "svg", "pdf", "zip"])

/**
 * QR Capacity schema
 */
export const qrCapacitySchema = z.object({
  numeric: z.number(),
  alphanumeric: z.number(),
  binary: z.number(),
  kanji: z.number(),
})

/**
 * QR Readability schema
 */
export const qrReadabilitySchema = z.object({
  contrastRatio: z.number(),
  moduleSize: z.number(),
  quietZone: z.number(),
  readabilityScore: z.number(),
  scanDistance: z.string(),
  lightingConditions: z.array(z.string()),
})

/**
 * QR Optimization schema
 */
export const qrOptimizationSchema = z.object({
  dataEfficiency: z.number(),
  sizeOptimization: z.number(),
  errorCorrectionUtilization: z.number(),
  versionOptimality: z.number(),
  overallOptimization: z.number(),
})

/**
 * QR Compatibility schema
 */
export const qrCompatibilitySchema = z.object({
  readerCompatibility: z.array(z.string()),
  deviceCompatibility: z.array(z.string()),
  softwareCompatibility: z.array(z.string()),
  standardsCompliance: z.array(z.string()),
  limitations: z.array(z.string()),
})

/**
 * QR Security schema
 */
export const qrSecuritySchema = z.object({
  dataExposure: z.enum(["low", "medium", "high"]),
  tampering_resistance: z.enum(["low", "medium", "high"]),
  privacy_level: z.enum(["low", "medium", "high"]),
  security_score: z.number(),
  vulnerabilities: z.array(z.string()),
  recommendations: z.array(z.string()),
})

/**
 * QR Metadata schema
 */
export const qrMetadataSchema = z.object({
  version: z.number(),
  modules: z.number(),
  capacity: qrCapacitySchema,
  actualSize: z.number(),
  errorCorrectionPercentage: z.number(),
  dataType: z.string(),
  encoding: z.string(),
  compressionRatio: z.number(),
  qualityScore: z.number(),
})

/**
 * QR Customization schema
 */
export const qrCustomizationSchema = z.object({
  cornerStyle: z.enum(["square", "rounded", "circle"]),
  moduleStyle: z.enum(["square", "rounded", "circle", "diamond"]),
  gradientEnabled: z.boolean(),
  gradientColors: z.array(z.string()).optional(),
  patternEnabled: z.boolean(),
  patternType: z.enum(["dots", "lines", "squares"]).optional(),
  borderEnabled: z.boolean(),
  borderWidth: z.number().optional(),
  borderColor: z.string().optional(),
})

/**
 * QR Settings schema
 */
export const qrSettingsSchema = z.object({
  content: z.string(),
  type: qrContentTypeSchema,
  format: qrFormatSchema,
  size: z.number(),
  errorCorrection: errorCorrectionLevelSchema,
  margin: z.number(),
  foregroundColor: z.string(),
  backgroundColor: z.string(),
  logoUrl: z.string().optional(),
  logoSize: z.number().optional(),
  customization: qrCustomizationSchema,
})

/**
 * QR Analysis schema
 */
export const qrAnalysisSchema = z.object({
  readability: qrReadabilitySchema,
  optimization: qrOptimizationSchema,
  compatibility: qrCompatibilitySchema,
  security: qrSecuritySchema,
  recommendations: z.array(z.string()),
  warnings: z.array(z.string()),
})

/**
 * QR Code Result schema
 */
export const qrCodeResultSchema = z.object({
  id: z.string(),
  content: z.string(),
  type: qrContentTypeSchema,
  format: qrFormatSchema,
  size: z.number(),
  errorCorrection: errorCorrectionLevelSchema,
  dataUrl: z.string().optional(),
  svgString: z.string().optional(),
  isValid: z.boolean(),
  error: z.string().optional(),
  metadata: qrMetadataSchema.optional(),
  analysis: qrAnalysisSchema.optional(),
  settings: qrSettingsSchema,
  createdAt: z.date(),
})

/**
 * Batch Settings schema
 */
export const batchSettingsSchema = z.object({
  baseSettings: qrSettingsSchema,
  contentList: z.array(z.string()),
  namingPattern: z.string(),
  exportFormat: exportFormatSchema,
  includeAnalysis: z.boolean(),
  optimizeForBatch: z.boolean(),
})

/**
 * Batch Statistics schema
 */
export const batchStatisticsSchema = z.object({
  totalGenerated: z.number(),
  successfulGenerated: z.number(),
  failedGenerated: z.number(),
  averageSize: z.number(),
  averageQuality: z.number(),
  totalProcessingTime: z.number(),
  averageProcessingTime: z.number(),
  sizeDistribution: z.record(z.string(), z.number()),
  typeDistribution: z.record(z.string(), z.number()),
})

/**
 * QR Batch schema
 */
export const qrBatchSchema = z.object({
  id: z.string(),
  name: z.string(),
  qrCodes: z.array(qrCodeResultSchema),
  settings: batchSettingsSchema,
  status: z.enum(["pending", "processing", "completed", "failed"]),
  progress: z.number(),
  statistics: batchStatisticsSchema,
  createdAt: z.date(),
  completedAt: z.date().optional(),
})

/**
 * QR Error schema
 */
export const qrErrorSchema = z.object({
  message: z.string(),
  type: z.enum(["content", "size", "format", "settings", "capacity"]),
  severity: z.enum(["error", "warning", "info"]),
})

/**
 * QR Validation schema
 */
export const qrValidationSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(qrErrorSchema),
  warnings: z.array(z.string()),
  suggestions: z.array(z.string()),
  estimatedSize: z.number().optional(),
  recommendedSettings: qrSettingsSchema.partial().optional(),
})

/**
 * QR Template schema
 */
export const qrTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  type: qrContentTypeSchema,
  settings: qrSettingsSchema.partial(),
  useCase: z.array(z.string()),
  examples: z.array(z.string()),
  preview: z.string().optional(),
})

// ==================== Type Exports ====================

/**
 * Type inference from zod schemas
 */
export type QRContentType = z.infer<typeof qrContentTypeSchema>
export type QRFormat = z.infer<typeof qrFormatSchema>
export type ErrorCorrectionLevel = z.infer<typeof errorCorrectionLevelSchema>
export type ExportFormat = z.infer<typeof exportFormatSchema>
export type QRCapacity = z.infer<typeof qrCapacitySchema>
export type QRReadability = z.infer<typeof qrReadabilitySchema>
export type QROptimization = z.infer<typeof qrOptimizationSchema>
export type QRCompatibility = z.infer<typeof qrCompatibilitySchema>
export type QRSecurity = z.infer<typeof qrSecuritySchema>
export type QRMetadata = z.infer<typeof qrMetadataSchema>
export type QRCustomization = z.infer<typeof qrCustomizationSchema>
export type QRSettings = z.infer<typeof qrSettingsSchema>
export type QRAnalysis = z.infer<typeof qrAnalysisSchema>
export type QRCodeResult = z.infer<typeof qrCodeResultSchema>
export type BatchSettings = z.infer<typeof batchSettingsSchema>
export type BatchStatistics = z.infer<typeof batchStatisticsSchema>
export type QRBatch = z.infer<typeof qrBatchSchema>
export type QRError = z.infer<typeof qrErrorSchema>
export type QRValidation = z.infer<typeof qrValidationSchema>
export type QRTemplate = z.infer<typeof qrTemplateSchema>

