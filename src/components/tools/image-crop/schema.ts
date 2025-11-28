import { z } from "zod"

// ==================== Image Crop Schemas ====================

/**
 * Crop Area schema
 */
export const cropAreaSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
})

/**
 * Crop Settings schema
 */
export const cropSettingsSchema = z.object({
  aspectRatio: z.enum(["free", "1:1", "16:9", "4:3", "3:2", "2:3", "9:16", "custom"]),
  customAspectRatio: z
    .object({
      width: z.number(),
      height: z.number(),
    })
    .optional(),
  outputFormat: z.enum(["png", "jpeg", "webp"]),
  quality: z.number(),
  maintainOriginalSize: z.boolean(),
  cropPosition: z.enum(["center", "top-left", "top-right", "bottom-left", "bottom-right", "custom"]),
  backgroundColor: z.string(),
  preserveMetadata: z.boolean(),
  optimizeForWeb: z.boolean(),
  enableSmartCrop: z.boolean(),
  cropPadding: z.number(),
})

/**
 * Aspect Ratio Preset schema
 */
export const aspectRatioPresetSchema = z.object({
  name: z.string(),
  value: z.string(),
  ratio: z.number(),
  description: z.string(),
  icon: z.string().optional(),
  useCase: z.string(),
  pros: z.array(z.string()),
  cons: z.array(z.string()),
})

/**
 * Crop Template schema
 */
export const cropTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  settings: cropSettingsSchema.partial(),
  cropArea: cropAreaSchema.partial().optional(),
  category: z.enum(["social", "print", "web", "mobile", "custom"]),
  tags: z.array(z.string()),
  popularity: z.number(),
})

/**
 * Crop Stats schema
 */
export const cropStatsSchema = z.object({
  totalOriginalSize: z.number(),
  totalCroppedSize: z.number(),
  totalSavings: z.number(),
  averageSizeReduction: z.number(),
  averageCropPercentage: z.number(),
  processingTime: z.number(),
  imagesProcessed: z.number(),
  averageFileSize: z.number(),
  largestReduction: z.number(),
  smallestReduction: z.number(),
  qualityMetrics: z.object({
    averageQuality: z.number(),
    compressionEfficiency: z.number(),
    cropOptimization: z.number(),
  }),
})

/**
 * Image File schema
 */
export const imageFileSchema = z.object({
  id: z.string(),
  file: z.instanceof(File),
  originalUrl: z.string(),
  croppedUrl: z.string().optional(),
  originalSize: z.number(),
  croppedSize: z.number().optional(),
  originalDimensions: z.object({
    width: z.number(),
    height: z.number(),
  }),
  croppedDimensions: z
    .object({
      width: z.number(),
      height: z.number(),
    })
    .optional(),
  cropArea: cropAreaSchema,
  status: z.enum(["pending", "processing", "completed", "error"]),
  error: z.string().optional(),
  timestamp: z.number(),
  processingTime: z.number().optional(),
  compressionRatio: z.number().optional(),
  qualityScore: z.number().optional(),
  cropPercentage: z.number().optional(),
  templateUsed: z.string().optional(),
})

/**
 * History Entry schema
 */
export const historyEntrySchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  settings: cropSettingsSchema,
  stats: cropStatsSchema,
  imageCount: z.number(),
  totalSavings: z.number(),
  description: z.string(),
})

// ==================== Type Exports ====================

export type CropArea = z.infer<typeof cropAreaSchema>
export type CropSettings = z.infer<typeof cropSettingsSchema>
export type AspectRatioPreset = z.infer<typeof aspectRatioPresetSchema>
export type CropTemplate = z.infer<typeof cropTemplateSchema>
export type CropStats = z.infer<typeof cropStatsSchema>
export type ImageFile = z.infer<typeof imageFileSchema>
export type HistoryEntry = z.infer<typeof historyEntrySchema>
