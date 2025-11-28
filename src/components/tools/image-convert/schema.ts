import { z } from "zod"

// ==================== Image Convert Schemas ====================

/**
 * Image File schema
 */
export const imageFileSchema = z.object({
  id: z.string(),
  file: z.instanceof(File),
  originalUrl: z.string(),
  convertedUrl: z.string().optional(),
  originalSize: z.number(),
  convertedSize: z.number().optional(),
  originalFormat: z.string(),
  targetFormat: z.string(),
  originalDimensions: z.object({
    width: z.number(),
    height: z.number(),
  }),
  status: z.enum(["pending", "processing", "completed", "error"]),
  error: z.string().optional(),
  timestamp: z.number(),
  processingTime: z.number().optional(),
  compressionRatio: z.number().optional(),
  qualityScore: z.number().optional(),
})

/**
 * Conversion Settings schema
 */
export const conversionSettingsSchema = z.object({
  targetFormat: z.enum(["png", "jpeg", "webp", "gif", "bmp", "tiff"]),
  quality: z.number(),
  preserveTransparency: z.boolean(),
  backgroundColor: z.string(),
  colorProfile: z.enum(["sRGB", "P3", "Rec2020"]),
  dithering: z.boolean(),
  progressive: z.boolean(),
  lossless: z.boolean(),
  resizeMode: z.enum(["none", "scale", "crop", "fit"]),
  targetWidth: z.number().optional(),
  targetHeight: z.number().optional(),
  removeMetadata: z.boolean(),
  optimizeForWeb: z.boolean(),
})

/**
 * Format Info schema
 */
export const formatInfoSchema = z.object({
  name: z.string(),
  extension: z.string(),
  mimeType: z.string(),
  supportsTransparency: z.boolean(),
  supportsAnimation: z.boolean(),
  supportsLossless: z.boolean(),
  supportsLossy: z.boolean(),
  description: z.string(),
  maxQuality: z.number(),
  useCase: z.string(),
  pros: z.array(z.string()),
  cons: z.array(z.string()),
})

/**
 * Conversion Stats schema
 */
export const conversionStatsSchema = z.object({
  totalOriginalSize: z.number(),
  totalConvertedSize: z.number(),
  totalSavings: z.number(),
  averageSizeChange: z.number(),
  formatDistribution: z.record(z.string(), z.number()),
  processingTime: z.number(),
  imagesProcessed: z.number(),
  averageFileSize: z.number(),
  largestIncrease: z.number(),
  largestDecrease: z.number(),
  qualityMetrics: z.object({
    averageQuality: z.number(),
    compressionEfficiency: z.number(),
    formatOptimization: z.number(),
  }),
})

/**
 * History Entry schema
 */
export const historyEntrySchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  settings: conversionSettingsSchema,
  stats: conversionStatsSchema,
  imageCount: z.number(),
  totalSavings: z.number(),
  description: z.string(),
})

// ==================== Type Exports ====================

export type ImageFile = z.infer<typeof imageFileSchema>
export type ConversionSettings = z.infer<typeof conversionSettingsSchema>
export type FormatInfo = z.infer<typeof formatInfoSchema>
export type ConversionStats = z.infer<typeof conversionStatsSchema>
export type HistoryEntry = z.infer<typeof historyEntrySchema>
