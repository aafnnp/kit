import { z } from "zod"

// ==================== Shadow Generator Schemas ====================

/**
 * Shadow Type schema
 */
export const shadowTypeSchema = z.enum([
  "box-shadow",
  "text-shadow",
  "drop-shadow",
])

/**
 * Export Format schema
 */
export const exportFormatSchema = z.enum(["css", "scss", "json", "tailwind"])

/**
 * Shadow Layer schema
 */
export const shadowLayerSchema = z.object({
  id: z.string(),
  x: z.number(),
  y: z.number(),
  blur: z.number(),
  spread: z.number().optional(),
  color: z.string(),
  opacity: z.number(),
  inset: z.boolean(),
})

/**
 * Shadow Accessibility schema
 */
export const shadowAccessibilitySchema = z.object({
  contrastRatio: z.number(),
  visibility: z.enum(["high", "medium", "low"]),
  readabilityImpact: z.enum([
    "none",
    "minimal",
    "moderate",
    "significant",
  ]),
  wcagCompliant: z.boolean(),
})

/**
 * Shadow schema
 */
export const shadowSchema = z.object({
  id: z.string(),
  type: shadowTypeSchema,
  layers: z.array(shadowLayerSchema),
  css: z.string(),
  accessibility: shadowAccessibilitySchema,
})

/**
 * Shadow Statistics schema
 */
export const shadowStatisticsSchema = z.object({
  totalShadows: z.number(),
  typeDistribution: z.record(shadowTypeSchema, z.number()),
  averageLayers: z.number(),
  averageBlur: z.number(),
  averageOpacity: z.number(),
  accessibilityScore: z.number(),
  processingTime: z.number(),
})

/**
 * Shadow Settings schema
 */
export const shadowSettingsSchema = z.object({
  defaultType: shadowTypeSchema,
  maxLayers: z.number(),
  includeAccessibility: z.boolean(),
  optimizeOutput: z.boolean(),
  exportFormat: exportFormatSchema,
  unit: z.enum(["px", "rem", "em"]),
})

/**
 * Shadow Data schema
 */
export const shadowDataSchema = z.object({
  shadows: z.array(shadowSchema),
  statistics: shadowStatisticsSchema,
  settings: shadowSettingsSchema,
})

/**
 * Shadow File schema
 */
export const shadowFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  content: z.string(),
  size: z.number(),
  type: z.string(),
  status: z.enum(["pending", "processing", "completed", "error"]),
  error: z.string().optional(),
  processedAt: z.date().optional(),
  shadowData: shadowDataSchema.optional(),
})

/**
 * Shadow Template schema
 */
export const shadowTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  shadow: shadowSchema.partial(),
  preview: z.string(),
})

// ==================== Type Exports ====================

export type ShadowType = z.infer<typeof shadowTypeSchema>
export type ExportFormat = z.infer<typeof exportFormatSchema>
export type ShadowLayer = z.infer<typeof shadowLayerSchema>
export type ShadowAccessibility = z.infer<typeof shadowAccessibilitySchema>
export type Shadow = z.infer<typeof shadowSchema>
export type ShadowStatistics = z.infer<typeof shadowStatisticsSchema>
export type ShadowSettings = z.infer<typeof shadowSettingsSchema>
export type ShadowData = z.infer<typeof shadowDataSchema>
export type ShadowFile = z.infer<typeof shadowFileSchema>
export type ShadowTemplate = z.infer<typeof shadowTemplateSchema>

