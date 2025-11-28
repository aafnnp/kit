import { z } from "zod"

// ==================== Color Picker Schemas ====================

/**
 * Color Format schema
 */
export const colorFormatSchema = z.enum(["hex", "rgb", "hsl", "hsv", "cmyk", "lab"])

/**
 * Harmony Type schema
 */
export const harmonyTypeSchema = z.enum([
  "complementary",
  "analogous",
  "triadic",
  "tetradic",
  "monochromatic",
  "split-complementary",
])

/**
 * Sort By schema
 */
export const sortBySchema = z.enum(["hue", "saturation", "lightness", "brightness", "name"])

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
 * Color schema
 */
export const colorSchema = z.object({
  hex: z.string(),
  rgb: rgbSchema,
  hsl: hslSchema,
  hsv: hsvSchema,
  cmyk: cmykSchema,
  lab: labSchema,
  name: z.string().optional(),
  accessibility: accessibilityInfoSchema,
})

/**
 * Color Palette schema
 */
export const colorPaletteSchema = z.object({
  primary: colorSchema,
  complementary: z.array(colorSchema),
  analogous: z.array(colorSchema),
  triadic: z.array(colorSchema),
  tetradic: z.array(colorSchema),
  monochromatic: z.array(colorSchema),
  splitComplementary: z.array(colorSchema),
})

/**
 * Color Statistics schema
 */
export const colorStatisticsSchema = z.object({
  totalColors: z.number(),
  dominantColor: colorSchema,
  averageBrightness: z.number(),
  averageSaturation: z.number(),
  colorDistribution: z.record(z.string(), z.number()),
  accessibilityScore: z.number(),
  processingTime: z.number(),
})

/**
 * Color Settings schema
 */
export const colorSettingsSchema = z.object({
  format: colorFormatSchema,
  paletteSize: z.number(),
  harmonyType: harmonyTypeSchema,
  includeAccessibility: z.boolean(),
  generateNames: z.boolean(),
  sortBy: sortBySchema,
})

/**
 * Color Data schema
 */
export const colorDataSchema = z.object({
  colors: z.array(colorSchema),
  palette: colorPaletteSchema,
  statistics: colorStatisticsSchema,
  format: colorFormatSchema,
})

/**
 * Color File schema
 */
export const colorFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  content: z.string(),
  size: z.number(),
  type: z.string(),
  status: z.enum(["pending", "processing", "completed", "error"]),
  error: z.string().optional(),
  processedAt: z.date().optional(),
  colorData: colorDataSchema.optional(),
})

/**
 * Color Template schema
 */
export const colorTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  colors: z.array(z.string()),
  category: z.string(),
})

// ==================== Type Exports ====================

export type ColorFormat = z.infer<typeof colorFormatSchema>
export type HarmonyType = z.infer<typeof harmonyTypeSchema>
export type SortBy = z.infer<typeof sortBySchema>
export type RGB = z.infer<typeof rgbSchema>
export type HSL = z.infer<typeof hslSchema>
export type HSV = z.infer<typeof hsvSchema>
export type CMYK = z.infer<typeof cmykSchema>
export type LAB = z.infer<typeof labSchema>
export type AccessibilityInfo = z.infer<typeof accessibilityInfoSchema>
export type Color = z.infer<typeof colorSchema>
export type ColorPalette = z.infer<typeof colorPaletteSchema>
export type ColorStatistics = z.infer<typeof colorStatisticsSchema>
export type ColorSettings = z.infer<typeof colorSettingsSchema>
export type ColorData = z.infer<typeof colorDataSchema>
export type ColorFile = z.infer<typeof colorFileSchema>
export type ColorTemplate = z.infer<typeof colorTemplateSchema>
