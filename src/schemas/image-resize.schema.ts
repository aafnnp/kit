import { z } from "zod"

// ==================== Image Resize Schemas ====================

/**
 * Image File schema
 */
export const imageFileSchema = z.object({
  id: z.string(),
  file: z.instanceof(File),
  originalUrl: z.string(),
  resizedUrl: z.string().optional(),
  originalSize: z.number(),
  resizedSize: z.number().optional(),
  originalDimensions: z.object({
    width: z.number(),
    height: z.number(),
  }),
  resizedDimensions: z
    .object({
      width: z.number(),
      height: z.number(),
    })
    .optional(),
  status: z.enum(["pending", "processing", "completed", "error"]),
  error: z.string().optional(),
  timestamp: z.number(),
  processingTime: z.number().optional(),
  format: z.string().optional(),
  aspectRatio: z.number().optional(),
})

/**
 * Resize Settings schema
 */
export const resizeSettingsSchema = z.object({
  width: z.number(),
  height: z.number(),
  maintainAspectRatio: z.boolean(),
  resizeMode: z.enum(["exact", "fit", "fill", "stretch"]),
  format: z.enum(["png", "jpeg", "webp"]),
  quality: z.number(),
  backgroundColor: z.string(),
  interpolation: z.enum(["nearest", "bilinear", "bicubic", "lanczos"]),
  sharpen: z.boolean(),
  removeMetadata: z.boolean(),
})

/**
 * Preset Dimension schema
 */
export const presetDimensionSchema = z.object({
  name: z.string(),
  width: z.number(),
  height: z.number(),
  category: z.enum(["social", "web", "print", "video", "mobile"]),
  description: z.string(),
  aspectRatio: z.string(),
  useCase: z.string(),
})

/**
 * Resize Stats schema
 */
export const resizeStatsSchema = z.object({
  totalOriginalSize: z.number(),
  totalResizedSize: z.number(),
  totalSavings: z.number(),
  averageSizeReduction: z.number(),
  processingTime: z.number(),
  imagesProcessed: z.number(),
  averageFileSize: z.number(),
  largestIncrease: z.number(),
  largestDecrease: z.number(),
  dimensionChanges: z.object({
    averageWidthChange: z.number(),
    averageHeightChange: z.number(),
    aspectRatioChanges: z.number(),
  }),
})

/**
 * History Entry schema
 */
export const historyEntrySchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  settings: resizeSettingsSchema,
  stats: resizeStatsSchema,
  imageCount: z.number(),
  totalSavings: z.number(),
  description: z.string(),
})

// ==================== Type Exports ====================

export type ImageFile = z.infer<typeof imageFileSchema>
export type ResizeSettings = z.infer<typeof resizeSettingsSchema>
export type PresetDimension = z.infer<typeof presetDimensionSchema>
export type ResizeStats = z.infer<typeof resizeStatsSchema>
export type HistoryEntry = z.infer<typeof historyEntrySchema>
