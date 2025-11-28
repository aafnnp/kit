import { z } from "zod"

// ==================== Barcode Generator Schemas ====================

/**
 * Data Exposure schema
 */
export const dataExposureSchema = z.enum(["low", "medium", "high"])

/**
 * Barcode Format schema
 */
export const barcodeFormatSchema = z.enum([
  "CODE128",
  "EAN13",
  "EAN8",
  "UPC",
  "CODE39",
  "ITF14",
  "MSI",
  "pharmacode",
  "codabar",
  "CODE93",
])

/**
 * Export Format schema
 */
export const exportFormatSchema = z.enum(["png", "svg", "pdf", "zip"])

/**
 * Barcode Capacity schema
 */
export const barcodeCapacitySchema = z.object({
  numeric: z.number(),
  alphanumeric: z.number(),
  binary: z.number(),
  maxLength: z.number(),
  minLength: z.number(),
})

/**
 * Barcode Metadata schema
 */
export const barcodeMetadataSchema = z.object({
  format: barcodeFormatSchema,
  capacity: barcodeCapacitySchema,
  actualSize: z.object({
    width: z.number(),
    height: z.number(),
  }),
  dataLength: z.number(),
  checksum: z.string().optional(),
  encoding: z.string(),
  compressionRatio: z.number(),
  qualityScore: z.number(),
  readabilityScore: z.number(),
})

/**
 * Barcode Readability schema
 */
export const barcodeReadabilitySchema = z.object({
  contrastRatio: z.number(),
  barWidth: z.number(),
  quietZone: z.number(),
  aspectRatio: z.number(),
  readabilityScore: z.number(),
  scanDistance: z.string(),
  lightingConditions: z.array(z.string()),
  printQuality: dataExposureSchema,
})

/**
 * Barcode Optimization schema
 */
export const barcodeOptimizationSchema = z.object({
  dataEfficiency: z.number(),
  sizeOptimization: z.number(),
  printOptimization: z.number(),
  scanOptimization: z.number(),
  overallOptimization: z.number(),
})

/**
 * Barcode Compatibility schema
 */
export const barcodeCompatibilitySchema = z.object({
  scannerCompatibility: z.array(z.string()),
  industryStandards: z.array(z.string()),
  printCompatibility: z.array(z.string()),
  softwareCompatibility: z.array(z.string()),
  limitations: z.array(z.string()),
})

/**
 * Barcode Security schema
 */
export const barcodeSecuritySchema = z.object({
  dataExposure: dataExposureSchema,
  tampering_resistance: dataExposureSchema,
  privacy_level: dataExposureSchema,
  security_score: z.number(),
  vulnerabilities: z.array(z.string()),
  recommendations: z.array(z.string()),
})

/**
 * Barcode Analysis schema
 */
export const barcodeAnalysisSchema = z.object({
  readability: barcodeReadabilitySchema,
  optimization: barcodeOptimizationSchema,
  compatibility: barcodeCompatibilitySchema,
  security: barcodeSecuritySchema,
  recommendations: z.array(z.string()),
  warnings: z.array(z.string()),
})

/**
 * Barcode Customization schema
 */
export const barcodeCustomizationSchema = z.object({
  showBorder: z.boolean(),
  borderWidth: z.number(),
  borderColor: z.string(),
  showQuietZone: z.boolean(),
  quietZoneSize: z.number(),
  customFont: z.boolean(),
  fontWeight: z.enum(["normal", "bold"]),
  textCase: z.enum(["none", "uppercase", "lowercase"]),
})

/**
 * Barcode Settings schema
 */
export const barcodeSettingsSchema = z.object({
  content: z.string(),
  format: barcodeFormatSchema,
  width: z.number(),
  height: z.number(),
  displayValue: z.boolean(),
  backgroundColor: z.string(),
  lineColor: z.string(),
  fontSize: z.number(),
  fontFamily: z.string(),
  textAlign: z.enum(["left", "center", "right"]),
  textPosition: z.enum(["top", "bottom"]),
  textMargin: z.number(),
  margin: z.number(),
  customization: barcodeCustomizationSchema,
})

/**
 * Barcode Result schema
 */
export const barcodeResultSchema = z.object({
  id: z.string(),
  content: z.string(),
  format: barcodeFormatSchema,
  width: z.number(),
  height: z.number(),
  displayValue: z.boolean(),
  backgroundColor: z.string(),
  lineColor: z.string(),
  fontSize: z.number(),
  fontFamily: z.string(),
  textAlign: z.enum(["left", "center", "right"]),
  textPosition: z.enum(["top", "bottom"]),
  textMargin: z.number(),
  margin: z.number(),
  dataUrl: z.string().optional(),
  svgString: z.string().optional(),
  isValid: z.boolean(),
  error: z.string().optional(),
  metadata: barcodeMetadataSchema.optional(),
  analysis: barcodeAnalysisSchema.optional(),
  settings: barcodeSettingsSchema,
  createdAt: z.date(),
})

/**
 * Batch Settings schema
 */
export const batchSettingsSchema = z.object({
  baseSettings: barcodeSettingsSchema,
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
  formatDistribution: z.record(z.string(), z.number()),
})

/**
 * Barcode Batch schema
 */
export const barcodeBatchSchema = z.object({
  id: z.string(),
  name: z.string(),
  barcodes: z.array(barcodeResultSchema),
  settings: batchSettingsSchema,
  status: z.enum(["pending", "processing", "completed", "failed"]),
  progress: z.number(),
  statistics: batchStatisticsSchema,
  createdAt: z.date(),
  completedAt: z.date().optional(),
})

/**
 * Barcode Template schema
 */
export const barcodeTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  format: barcodeFormatSchema,
  settings: barcodeSettingsSchema.partial(),
  useCase: z.array(z.string()),
  examples: z.array(z.string()),
  preview: z.string().optional(),
})

/**
 * Barcode Error schema
 */
export const barcodeErrorSchema = z.object({
  message: z.string(),
  type: z.enum(["content", "format", "size", "settings", "compatibility"]),
  severity: z.enum(["error", "warning", "info"]),
})

/**
 * Barcode Validation schema
 */
export const barcodeValidationSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(barcodeErrorSchema),
  warnings: z.array(z.string()),
  suggestions: z.array(z.string()),
  estimatedSize: z
    .object({
      width: z.number(),
      height: z.number(),
    })
    .optional(),
  recommendedSettings: barcodeSettingsSchema.partial().optional(),
})

// ==================== Type Exports ====================

export type DataExposure = z.infer<typeof dataExposureSchema>
export type BarcodeFormat = z.infer<typeof barcodeFormatSchema>
export type ExportFormat = z.infer<typeof exportFormatSchema>
export type BarcodeCapacity = z.infer<typeof barcodeCapacitySchema>
export type BarcodeMetadata = z.infer<typeof barcodeMetadataSchema>
export type BarcodeReadability = z.infer<typeof barcodeReadabilitySchema>
export type BarcodeOptimization = z.infer<typeof barcodeOptimizationSchema>
export type BarcodeCompatibility = z.infer<typeof barcodeCompatibilitySchema>
export type BarcodeSecurity = z.infer<typeof barcodeSecuritySchema>
export type BarcodeAnalysis = z.infer<typeof barcodeAnalysisSchema>
export type BarcodeCustomization = z.infer<typeof barcodeCustomizationSchema>
export type BarcodeSettings = z.infer<typeof barcodeSettingsSchema>
export type BarcodeResult = z.infer<typeof barcodeResultSchema>
export type BatchSettings = z.infer<typeof batchSettingsSchema>
export type BatchStatistics = z.infer<typeof batchStatisticsSchema>
export type BarcodeBatch = z.infer<typeof barcodeBatchSchema>
export type BarcodeTemplate = z.infer<typeof barcodeTemplateSchema>
export type BarcodeError = z.infer<typeof barcodeErrorSchema>
export type BarcodeValidation = z.infer<typeof barcodeValidationSchema>
