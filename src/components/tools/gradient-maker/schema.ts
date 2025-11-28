import { z } from "zod"

// ==================== Gradient Maker Schemas ====================

/**
 * Gradient Type schema
 */
export const gradientTypeSchema = z.enum(["linear", "radial", "conic", "repeating-linear", "repeating-radial"])

/**
 * Radial Shape schema
 */
export const radialShapeSchema = z.enum(["circle", "ellipse"])

/**
 * Radial Size schema
 */
export const radialSizeSchema = z.enum(["closest-side", "closest-corner", "farthest-side", "farthest-corner"])

/**
 * Blend Mode schema
 */
export const blendModeSchema = z.enum([
  "normal",
  "multiply",
  "screen",
  "overlay",
  "darken",
  "lighten",
  "color-dodge",
  "color-burn",
  "hard-light",
  "soft-light",
  "difference",
  "exclusion",
])

/**
 * Export Format schema
 */
export const exportFormatSchema = z.enum(["css", "scss", "svg", "png", "json"])

/**
 * Color Stop schema
 */
export const colorStopSchema = z.object({
  id: z.string(),
  color: z.string(),
  position: z.number(),
  opacity: z.number().optional(),
})

/**
 * Radial Position schema
 */
export const radialPositionSchema = z.object({
  x: z.number(),
  y: z.number(),
})

/**
 * Gradient Accessibility schema
 */
export const gradientAccessibilitySchema = z.object({
  contrastRatio: z.number(),
  wcagCompliant: z.boolean(),
  colorBlindSafe: z.boolean(),
  readabilityScore: z.number(),
})

/**
 * Gradient schema
 */
export const gradientSchema = z.object({
  id: z.string(),
  type: gradientTypeSchema,
  colors: z.array(colorStopSchema),
  angle: z.number().optional(),
  position: radialPositionSchema.optional(),
  shape: radialShapeSchema.optional(),
  size: radialSizeSchema.optional(),
  repeating: z.boolean().optional(),
  blendMode: blendModeSchema.optional(),
  css: z.string(),
  svg: z.string(),
  accessibility: gradientAccessibilitySchema,
})

/**
 * Gradient Statistics schema
 */
export const gradientStatisticsSchema = z.object({
  totalGradients: z.number(),
  typeDistribution: z.record(gradientTypeSchema, z.number()),
  averageColorStops: z.number(),
  averageContrastRatio: z.number(),
  accessibilityScore: z.number(),
  processingTime: z.number(),
})

/**
 * Gradient Settings schema
 */
export const gradientSettingsSchema = z.object({
  defaultType: gradientTypeSchema,
  maxColorStops: z.number(),
  includeAccessibility: z.boolean(),
  generateSVG: z.boolean(),
  optimizeOutput: z.boolean(),
  exportFormat: exportFormatSchema,
})

/**
 * Gradient Data schema
 */
export const gradientDataSchema = z.object({
  gradients: z.array(gradientSchema),
  statistics: gradientStatisticsSchema,
  settings: gradientSettingsSchema,
})

/**
 * Gradient File schema
 */
export const gradientFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  content: z.string(),
  size: z.number(),
  type: z.string(),
  status: z.enum(["pending", "processing", "completed", "error"]),
  error: z.string().optional(),
  processedAt: z.date().optional(),
  gradientData: gradientDataSchema.optional(),
})

/**
 * Gradient Template schema
 */
export const gradientTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  gradient: gradientSchema.partial(),
  preview: z.string(),
})

// ==================== Type Exports ====================

export type GradientType = z.infer<typeof gradientTypeSchema>
export type RadialShape = z.infer<typeof radialShapeSchema>
export type RadialSize = z.infer<typeof radialSizeSchema>
export type BlendMode = z.infer<typeof blendModeSchema>
export type ExportFormat = z.infer<typeof exportFormatSchema>
export type ColorStop = z.infer<typeof colorStopSchema>
export type RadialPosition = z.infer<typeof radialPositionSchema>
export type GradientAccessibility = z.infer<typeof gradientAccessibilitySchema>
export type Gradient = z.infer<typeof gradientSchema>
export type GradientStatistics = z.infer<typeof gradientStatisticsSchema>
export type GradientSettings = z.infer<typeof gradientSettingsSchema>
export type GradientData = z.infer<typeof gradientDataSchema>
export type GradientFile = z.infer<typeof gradientFileSchema>
export type GradientTemplate = z.infer<typeof gradientTemplateSchema>
