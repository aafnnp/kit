import { z } from "zod"

// ==================== HEX-RGB Schemas ====================

/**
 * Color Format schema
 */
export const colorFormatSchema = z.enum([
  "hex",
  "rgb",
  "hsl",
  "hsv",
  "cmyk",
  "lab",
])

/**
 * RGB schema
 */
export const rgbSchema = z.object({
  r: z.number(),
  g: z.number(),
  b: z.number(),
})

/**
 * HSL schema
 */
export const hslSchema = z.object({
  h: z.number(),
  s: z.number(),
  l: z.number(),
})

/**
 * HSV schema
 */
export const hsvSchema = z.object({
  h: z.number(),
  s: z.number(),
  v: z.number(),
})

/**
 * CMYK schema
 */
export const cmykSchema = z.object({
  c: z.number(),
  m: z.number(),
  y: z.number(),
  k: z.number(),
})

/**
 * LAB schema
 */
export const labSchema = z.object({
  l: z.number(),
  a: z.number(),
  b: z.number(),
})

/**
 * Accessibility Info schema
 */
export const accessibilityInfoSchema = z.object({
  contrastRatios: z.object({
    white: z.number(),
    black: z.number(),
  }),
  wcagAA: z.object({
    normal: z.boolean(),
    large: z.boolean(),
  }),
  wcagAAA: z.object({
    normal: z.boolean(),
    large: z.boolean(),
  }),
  colorBlindSafe: z.boolean(),
})

/**
 * Converted Color schema
 */
export const convertedColorSchema = z.object({
  hex: z.string(),
  rgb: rgbSchema,
  hsl: hslSchema,
  hsv: hsvSchema,
  cmyk: cmykSchema,
  lab: labSchema,
  accessibility: accessibilityInfoSchema,
})

/**
 * Color Conversion schema
 */
export const colorConversionSchema = z.object({
  original: z.string(),
  originalFormat: colorFormatSchema,
  converted: convertedColorSchema,
  isValid: z.boolean(),
  error: z.string().optional(),
})

/**
 * Conversion Statistics schema
 */
export const conversionStatisticsSchema = z.object({
  totalConversions: z.number(),
  successfulConversions: z.number(),
  failedConversions: z.number(),
  formatDistribution: z.record(colorFormatSchema, z.number()),
  averageAccessibilityScore: z.number(),
  processingTime: z.number(),
})

/**
 * Conversion Settings schema
 */
export const conversionSettingsSchema = z.object({
  inputFormat: colorFormatSchema,
  outputFormat: colorFormatSchema,
  includeAccessibility: z.boolean(),
  validateColors: z.boolean(),
  preserveCase: z.boolean(),
  batchMode: z.boolean(),
})

/**
 * Conversion Data schema
 */
export const conversionDataSchema = z.object({
  conversions: z.array(colorConversionSchema),
  statistics: conversionStatisticsSchema,
  settings: conversionSettingsSchema,
})

/**
 * Color Conversion File schema
 */
export const colorConversionFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  content: z.string(),
  size: z.number(),
  type: z.string(),
  status: z.enum(["pending", "processing", "completed", "error"]),
  error: z.string().optional(),
  processedAt: z.date().optional(),
  conversionData: conversionDataSchema.optional(),
})

/**
 * Conversion Template schema
 */
export const conversionTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  inputFormat: colorFormatSchema,
  outputFormat: colorFormatSchema,
  examples: z.array(
    z.object({
      input: z.string(),
      output: z.string(),
    })
  ),
})

// ==================== Type Exports ====================

export type ColorFormat = z.infer<typeof colorFormatSchema>
export type RGB = z.infer<typeof rgbSchema>
export type HSL = z.infer<typeof hslSchema>
export type HSV = z.infer<typeof hsvSchema>
export type CMYK = z.infer<typeof cmykSchema>
export type LAB = z.infer<typeof labSchema>
export type AccessibilityInfo = z.infer<typeof accessibilityInfoSchema>
export type ConvertedColor = z.infer<typeof convertedColorSchema>
export type ColorConversion = z.infer<typeof colorConversionSchema>
export type ConversionStatistics = z.infer<typeof conversionStatisticsSchema>
export type ConversionSettings = z.infer<typeof conversionSettingsSchema>
export type ConversionData = z.infer<typeof conversionDataSchema>
export type ColorConversionFile = z.infer<typeof colorConversionFileSchema>
export type ConversionTemplate = z.infer<typeof conversionTemplateSchema>

