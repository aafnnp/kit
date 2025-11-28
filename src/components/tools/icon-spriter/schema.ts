import { z } from "zod"

// ==================== Icon Spriter Schemas ====================

/**
 * Layout schema
 */
export const layoutSchema = z.enum(["symbol", "grid"])

/**
 * Naming schema
 */
export const namingSchema = z.enum(["auto", "filename", "custom"])

/**
 * Output Format schema
 */
export const outputFormatSchema = z.enum(["svg", "png", "css", "zip"])

/**
 * Icon File schema
 */
export const iconFileSchema = z.object({
  id: z.string(),
  file: z.instanceof(File),
  name: z.string(),
  size: z.number(),
  type: z.string(),
  status: z.enum(["pending", "processing", "completed", "error"]),
  error: z.string().optional(),
  content: z.string().optional(),
  url: z.string().optional(),
})

/**
 * Sprite Settings schema
 */
export const spriteSettingsSchema = z.object({
  layout: layoutSchema,
  spacing: z.number(),
  naming: namingSchema,
  customPrefix: z.string(),
  output: outputFormatSchema,
})

/**
 * Sprite Stats schema
 */
export const spriteStatsSchema = z.object({
  iconCount: z.number(),
  totalSize: z.number(),
  formats: z.array(z.string()),
})

// ==================== Type Exports ====================

export type Layout = z.infer<typeof layoutSchema>
export type Naming = z.infer<typeof namingSchema>
export type OutputFormat = z.infer<typeof outputFormatSchema>
export type IconFile = z.infer<typeof iconFileSchema>
export type SpriteSettings = z.infer<typeof spriteSettingsSchema>
export type SpriteStats = z.infer<typeof spriteStatsSchema>
