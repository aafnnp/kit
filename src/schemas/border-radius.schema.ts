import { z } from "zod"

// ==================== Border Radius Schemas ====================

/**
 * Border Radius Type schema
 */
export const borderRadiusTypeSchema = z.enum(["uniform", "individual", "percentage"])

/**
 * Border Radius Unit schema
 */
export const borderRadiusUnitSchema = z.enum(["px", "rem", "em", "%"])

/**
 * Export Format schema
 */
export const exportFormatSchema = z.enum(["css", "scss", "json", "tailwind"])

/**
 * Border Radius Corners schema
 */
export const borderRadiusCornersSchema = z.object({
  topLeft: z.number(),
  topRight: z.number(),
  bottomRight: z.number(),
  bottomLeft: z.number(),
  unit: borderRadiusUnitSchema,
})

/**
 * Border Radius Accessibility schema
 */
export const borderRadiusAccessibilitySchema = z.object({
  uniformity: z.enum(["uniform", "mixed"]),
  readabilityImpact: z.enum(["none", "minimal", "moderate"]),
  designConsistency: z.enum(["consistent", "varied", "chaotic"]),
  usabilityScore: z.number(),
})

/**
 * Border Radius schema
 */
export const borderRadiusSchema = z.object({
  id: z.string(),
  type: borderRadiusTypeSchema,
  corners: borderRadiusCornersSchema,
  css: z.string(),
  accessibility: borderRadiusAccessibilitySchema,
})

/**
 * Border Radius Statistics schema
 */
export const borderRadiusStatisticsSchema = z.object({
  totalBorderRadii: z.number(),
  typeDistribution: z.record(borderRadiusTypeSchema, z.number()),
  averageRadius: z.number(),
  uniformityRatio: z.number(),
  accessibilityScore: z.number(),
  processingTime: z.number(),
})

/**
 * Border Radius Settings schema
 */
export const borderRadiusSettingsSchema = z.object({
  defaultType: borderRadiusTypeSchema,
  defaultUnit: borderRadiusUnitSchema,
  maxRadius: z.number(),
  includeAccessibility: z.boolean(),
  optimizeOutput: z.boolean(),
  exportFormat: exportFormatSchema,
})

/**
 * Border Radius Data schema
 */
export const borderRadiusDataSchema = z.object({
  borderRadii: z.array(borderRadiusSchema),
  statistics: borderRadiusStatisticsSchema,
  settings: borderRadiusSettingsSchema,
})

/**
 * Border Radius File schema
 */
export const borderRadiusFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  content: z.string(),
  size: z.number(),
  type: z.string(),
  status: z.enum(["pending", "processing", "completed", "error"]),
  error: z.string().optional(),
  processedAt: z.date().optional(),
  borderRadiusData: borderRadiusDataSchema.optional(),
})

/**
 * Border Radius Template schema
 */
export const borderRadiusTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  borderRadius: borderRadiusSchema.partial(),
  preview: z.string(),
})

// ==================== Type Exports ====================

export type BorderRadiusType = z.infer<typeof borderRadiusTypeSchema>
export type BorderRadiusUnit = z.infer<typeof borderRadiusUnitSchema>
export type ExportFormat = z.infer<typeof exportFormatSchema>
export type BorderRadiusCorners = z.infer<typeof borderRadiusCornersSchema>
export type BorderRadiusAccessibility = z.infer<typeof borderRadiusAccessibilitySchema>
export type BorderRadius = z.infer<typeof borderRadiusSchema>
export type BorderRadiusStatistics = z.infer<typeof borderRadiusStatisticsSchema>
export type BorderRadiusSettings = z.infer<typeof borderRadiusSettingsSchema>
export type BorderRadiusData = z.infer<typeof borderRadiusDataSchema>
export type BorderRadiusFile = z.infer<typeof borderRadiusFileSchema>
export type BorderRadiusTemplate = z.infer<typeof borderRadiusTemplateSchema>
