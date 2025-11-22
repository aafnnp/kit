import { z } from "zod"

// ==================== Image Compress Schemas ====================

/**
 * Compression Settings schema
 */
export const compressionSettingsSchema = z.object({
  quality: z.number(),
  format: z.enum(["jpeg", "png", "webp"]),
  maxWidth: z.number().optional(),
  maxHeight: z.number().optional(),
  maintainAspectRatio: z.boolean(),
  enableProgressive: z.boolean(),
  removeMetadata: z.boolean(),
  resizeMethod: z.enum(["lanczos", "bilinear", "bicubic"]),
  colorSpace: z.enum(["srgb", "p3", "rec2020"]),
  dithering: z.boolean(),
})

/**
 * Image File schema
 */
export const imageFileSchema = z.object({
  id: z.string(),
  file: z.instanceof(File),
  originalUrl: z.string(),
  compressedUrl: z.string().optional(),
  originalSize: z.number(),
  compressedSize: z.number().optional(),
  compressionRatio: z.number().optional(),
  status: z.enum(["pending", "processing", "completed", "error"]),
  error: z.string().optional(),
  dimensions: z
    .object({
      width: z.number(),
      height: z.number(),
    })
    .optional(),
  format: z.string().optional(),
  timestamp: z.number(),
  processingTime: z.number().optional(),
})

/**
 * Compression Stats schema
 */
export const compressionStatsSchema = z.object({
  totalOriginalSize: z.number(),
  totalCompressedSize: z.number(),
  totalSavings: z.number(),
  averageCompressionRatio: z.number(),
  processingTime: z.number(),
  imagesProcessed: z.number(),
  averageFileSize: z.number(),
  largestReduction: z.number(),
  smallestReduction: z.number(),
})

/**
 * Compression Template schema
 */
export const compressionTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  settings: compressionSettingsSchema,
  category: z.enum(["web", "print", "mobile", "social", "custom"]),
  useCase: z.string(),
  estimatedSavings: z.string(),
})

/**
 * History Entry schema
 */
export const historyEntrySchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  settings: compressionSettingsSchema,
  stats: compressionStatsSchema,
  imageCount: z.number(),
  totalSavings: z.number(),
  description: z.string(),
})

// ==================== Type Exports ====================

export type CompressionSettings = z.infer<typeof compressionSettingsSchema>
export type ImageFile = z.infer<typeof imageFileSchema>
export type CompressionStats = z.infer<typeof compressionStatsSchema>
export type CompressionTemplate = z.infer<typeof compressionTemplateSchema>
export type HistoryEntry = z.infer<typeof historyEntrySchema>

