import { z } from "zod"

// ==================== Random Color Schemas ====================

/**
 * Color Format schema
 */
export const colorFormatSchema = z.enum(["hex", "rgb", "hsl", "hsv", "cmyk"])

/**
 * Palette Type schema
 */
export const paletteTypeSchema = z.enum([
  "monochromatic",
  "analogous",
  "complementary",
  "triadic",
  "tetradic",
  "split-complementary",
  "random",
])

/**
 * Harmony Type schema
 */
export const harmonyTypeSchema = z.enum([
  "complementary",
  "analogous",
  "triadic",
  "tetradic",
  "split-complementary",
  "monochromatic",
])

/**
 * Export Format schema
 */
export const exportFormatSchema = z.enum(["json", "css", "scss", "ase", "gpl"])

/**
 * Color Space schema
 */
export const colorSpaceSchema = z.enum(["sRGB", "P3", "Rec2020"])

/**
 * RGB Color schema
 */
export const rgbColorSchema = z.object({
  r: z.number(),
  g: z.number(),
  b: z.number(),
})

/**
 * HSL Color schema
 */
export const hslColorSchema = z.object({
  h: z.number(),
  s: z.number(),
  l: z.number(),
})

/**
 * HSV Color schema
 */
export const hsvColorSchema = z.object({
  h: z.number(),
  s: z.number(),
  v: z.number(),
})

/**
 * CMYK Color schema
 */
export const cmykColorSchema = z.object({
  c: z.number(),
  m: z.number(),
  y: z.number(),
  k: z.number(),
})

/**
 * Accessibility Info schema
 */
export const accessibilityInfoSchema = z.object({
  wcagAA: z.boolean(),
  wcagAAA: z.boolean(),
  contrastRatio: z.number(),
  readableOnWhite: z.boolean(),
  readableOnBlack: z.boolean(),
  colorBlindSafe: z.boolean(),
})

/**
 * Color Harmony schema
 */
export const colorHarmonySchema = z.object({
  type: harmonyTypeSchema,
  colors: z.array(z.string()),
})

/**
 * Color Metadata schema
 */
export const colorMetadataSchema = z.object({
  luminance: z.number(),
  brightness: z.number(),
  contrast: z.number(),
  isLight: z.boolean(),
  isDark: z.boolean(),
  accessibility: accessibilityInfoSchema,
  harmony: z.array(colorHarmonySchema),
})

/**
 * Generated Color schema
 */
export const generatedColorSchema = z.object({
  id: z.string(),
  hex: z.string(),
  rgb: rgbColorSchema,
  hsl: hslColorSchema,
  hsv: hsvColorSchema,
  cmyk: cmykColorSchema,
  name: z.string().optional(),
  metadata: colorMetadataSchema,
})

/**
 * Palette Metadata schema
 */
export const paletteMetadataSchema = z.object({
  dominantHue: z.number(),
  averageSaturation: z.number(),
  averageLightness: z.number(),
  colorCount: z.number(),
  harmonyScore: z.number(),
  accessibilityScore: z.number(),
})

/**
 * Color Palette schema
 */
export const colorPaletteSchema = z.object({
  id: z.string(),
  name: z.string(),
  colors: z.array(generatedColorSchema),
  type: paletteTypeSchema,
  description: z.string(),
  metadata: paletteMetadataSchema,
})

/**
 * Color Statistics schema
 */
export const colorStatisticsSchema = z.object({
  totalColors: z.number(),
  formatDistribution: z.record(colorFormatSchema, z.number()),
  paletteDistribution: z.record(paletteTypeSchema, z.number()),
  averageLuminance: z.number(),
  averageContrast: z.number(),
  accessibilityScore: z.number(),
  processingTime: z.number(),
})

/**
 * Color Settings schema
 */
export const colorSettingsSchema = z.object({
  defaultFormat: colorFormatSchema,
  includeHarmony: z.boolean(),
  checkAccessibility: z.boolean(),
  generatePalettes: z.boolean(),
  paletteSize: z.number(),
  exportFormat: exportFormatSchema,
  colorSpace: colorSpaceSchema,
})

/**
 * Color Data schema
 */
export const colorDataSchema = z.object({
  colors: z.array(generatedColorSchema),
  palettes: z.array(colorPaletteSchema),
  statistics: colorStatisticsSchema,
  settings: colorSettingsSchema,
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
  category: z.string(),
  type: paletteTypeSchema,
  baseColors: z.array(z.string()),
  settings: colorSettingsSchema.partial(),
})

// ==================== Type Exports ====================

export type ColorFormat = z.infer<typeof colorFormatSchema>
export type PaletteType = z.infer<typeof paletteTypeSchema>
export type HarmonyType = z.infer<typeof harmonyTypeSchema>
export type ExportFormat = z.infer<typeof exportFormatSchema>
export type ColorSpace = z.infer<typeof colorSpaceSchema>
export type RGBColor = z.infer<typeof rgbColorSchema>
export type HSLColor = z.infer<typeof hslColorSchema>
export type HSVColor = z.infer<typeof hsvColorSchema>
export type CMYKColor = z.infer<typeof cmykColorSchema>
export type AccessibilityInfo = z.infer<typeof accessibilityInfoSchema>
export type ColorHarmony = z.infer<typeof colorHarmonySchema>
export type ColorMetadata = z.infer<typeof colorMetadataSchema>
export type GeneratedColor = z.infer<typeof generatedColorSchema>
export type PaletteMetadata = z.infer<typeof paletteMetadataSchema>
export type ColorPalette = z.infer<typeof colorPaletteSchema>
export type ColorStatistics = z.infer<typeof colorStatisticsSchema>
export type ColorSettings = z.infer<typeof colorSettingsSchema>
export type ColorData = z.infer<typeof colorDataSchema>
export type ColorFile = z.infer<typeof colorFileSchema>
export type ColorTemplate = z.infer<typeof colorTemplateSchema>
