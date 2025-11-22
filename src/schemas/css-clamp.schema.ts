import { z } from "zod"

// ==================== CSS Clamp Schemas ====================

/**
 * CSS Property schema
 */
export const cssPropertySchema = z.enum([
  "font-size",
  "width",
  "height",
  "margin",
  "padding",
  "gap",
  "border-radius",
  "line-height",
])

/**
 * CSS Unit schema
 */
export const cssUnitSchema = z.enum(["px", "rem", "em", "vw", "vh", "vmin", "vmax", "%", "ch", "ex"])

/**
 * Export Format schema
 */
export const exportFormatSchema = z.enum(["css", "scss", "json", "js"])

/**
 * Responsive Breakpoint schema
 */
export const responsiveBreakpointSchema = z.object({
  name: z.string(),
  width: z.number(),
  value: z.number(),
  unit: cssUnitSchema,
})

/**
 * Accessibility Info schema
 */
export const accessibilityInfoSchema = z.object({
  meetsMinimumSize: z.boolean(),
  scalingRatio: z.number(),
  readabilityScore: z.number(),
  contrastCompatible: z.boolean(),
})

/**
 * Clamp Metadata schema
 */
export const clampMetadataSchema = z.object({
  minViewport: z.number(),
  maxViewport: z.number(),
  scalingFactor: z.number(),
  responsiveRange: z.number(),
  isValid: z.boolean(),
  breakpoints: z.array(responsiveBreakpointSchema),
  accessibility: accessibilityInfoSchema,
})

/**
 * Generated Clamp schema
 */
export const generatedClampSchema = z.object({
  id: z.string(),
  property: cssPropertySchema,
  minValue: z.number(),
  idealValue: z.number(),
  maxValue: z.number(),
  minUnit: cssUnitSchema,
  idealUnit: cssUnitSchema,
  maxUnit: cssUnitSchema,
  clampRule: z.string(),
  cssRule: z.string(),
  metadata: clampMetadataSchema,
})

/**
 * Clamp Statistics schema
 */
export const clampStatisticsSchema = z.object({
  totalClamps: z.number(),
  propertyDistribution: z.record(cssPropertySchema, z.number()),
  unitDistribution: z.record(cssUnitSchema, z.number()),
  averageScalingFactor: z.number(),
  responsiveRangeAverage: z.number(),
  accessibilityScore: z.number(),
  processingTime: z.number(),
})

/**
 * Viewport Range schema
 */
export const viewportRangeSchema = z.object({
  minWidth: z.number(),
  maxWidth: z.number(),
})

/**
 * Clamp Settings schema
 */
export const clampSettingsSchema = z.object({
  defaultProperty: cssPropertySchema,
  defaultMinUnit: cssUnitSchema,
  defaultIdealUnit: cssUnitSchema,
  defaultMaxUnit: cssUnitSchema,
  includeBreakpoints: z.boolean(),
  generateFullCSS: z.boolean(),
  optimizeForAccessibility: z.boolean(),
  exportFormat: exportFormatSchema,
  viewportRange: viewportRangeSchema,
})

/**
 * Clamp Data schema
 */
export const clampDataSchema = z.object({
  clamps: z.array(generatedClampSchema),
  statistics: clampStatisticsSchema,
  settings: clampSettingsSchema,
})

/**
 * CSS Clamp File schema
 */
export const cssClampFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  content: z.string(),
  size: z.number(),
  type: z.string(),
  status: z.enum(["pending", "processing", "completed", "error"]),
  error: z.string().optional(),
  processedAt: z.date().optional(),
  clampData: clampDataSchema.optional(),
})

/**
 * Clamp Template schema
 */
export const clampTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  property: cssPropertySchema,
  minValue: z.number(),
  idealValue: z.number(),
  maxValue: z.number(),
  minUnit: cssUnitSchema,
  idealUnit: cssUnitSchema,
  maxUnit: cssUnitSchema,
  viewportRange: viewportRangeSchema,
})

// ==================== Type Exports ====================

export type CssProperty = z.infer<typeof cssPropertySchema>
export type CssUnit = z.infer<typeof cssUnitSchema>
export type ExportFormat = z.infer<typeof exportFormatSchema>
export type ResponsiveBreakpoint = z.infer<typeof responsiveBreakpointSchema>
export type AccessibilityInfo = z.infer<typeof accessibilityInfoSchema>
export type ClampMetadata = z.infer<typeof clampMetadataSchema>
export type GeneratedClamp = z.infer<typeof generatedClampSchema>
export type ClampStatistics = z.infer<typeof clampStatisticsSchema>
export type ViewportRange = z.infer<typeof viewportRangeSchema>
export type ClampSettings = z.infer<typeof clampSettingsSchema>
export type ClampData = z.infer<typeof clampDataSchema>
export type CssClampFile = z.infer<typeof cssClampFileSchema>
export type ClampTemplate = z.infer<typeof clampTemplateSchema>
