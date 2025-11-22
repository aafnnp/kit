import { z } from "zod"

// ==================== Lorem Image Schemas ====================

/**
 * Image Format schema
 */
export const imageFormatSchema = z.enum(["png", "jpeg", "webp", "svg"])

/**
 * Status schema
 */
export const statusSchema = z.enum(["pending", "generating", "completed", "error"])

/**
 * Lorem Image File schema
 */
export const loremImageFileSchema = z.object({
  id: z.string(),
  url: z.string(),
  width: z.number(),
  height: z.number(),
  format: imageFormatSchema,
  bgColor: z.string(),
  fgColor: z.string(),
  text: z.string(),
  category: z.string().optional(),
  status: statusSchema,
  error: z.string().optional(),
  size: z.number().optional(),
  generatedAt: z.date().optional(),
})

/**
 * Lorem Image Settings schema
 */
export const loremImageSettingsSchema = z.object({
  width: z.number(),
  height: z.number(),
  format: imageFormatSchema,
  bgColor: z.string(),
  fgColor: z.string(),
  text: z.string(),
  category: z.string().optional(),
  batchCount: z.number(),
  template: z.string().optional(),
})

/**
 * Lorem Image Stats schema
 */
export const loremImageStatsSchema = z.object({
  totalCount: z.number(),
  totalSize: z.number(),
  averageSize: z.number(),
  formats: z.record(z.string(), z.number()),
  categories: z.record(z.string(), z.number()),
})

// ==================== Type Exports ====================

export type ImageFormat = z.infer<typeof imageFormatSchema>
export type Status = z.infer<typeof statusSchema>
export type LoremImageFile = z.infer<typeof loremImageFileSchema>
export type LoremImageSettings = z.infer<typeof loremImageSettingsSchema>
export type LoremImageStats = z.infer<typeof loremImageStatsSchema>
