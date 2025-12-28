// ==================== Random Color Types ====================

/**
 * Color Format type
 */
export type colorFormat = "hex" | "rgb" | "hsl" | "hsv" | "cmyk"

/**
 * Palette Type type
 */
export type paletteType = "monochromatic" | "analogous" | "complementary" | "triadic" | "tetradic" | "split-complementary" | "random"

/**
 * Harmony Type type
 */
export type harmonyType = "complementary" | "analogous" | "triadic" | "tetradic" | "split-complementary" | "monochromatic"

/**
 * Export Format type
 */
export type exportFormat = "json" | "css" | "scss" | "ase" | "gpl"

/**
 * Color Space type
 */
export type colorSpace = "sRGB" | "P3" | "Rec2020"

/**
 * RGB Color type
 */
export interface rgbColor {
  r: number,
  g: number,
  b: number,
}

/**
 * HSL Color type
 */
export interface hslColor {
  h: number,
  s: number,
  l: number,
}

/**
 * HSV Color type
 */
export interface hsvColor {
  h: number,
  s: number,
  v: number,
}

/**
 * CMYK Color type
 */
export interface cmykColor {
  c: number,
  m: number,
  y: number,
  k: number,
}

/**
 * Accessibility Info type
 */
export interface accessibilityInfo {
  wcagAA: boolean,
  wcagAAA: boolean,
  contrastRatio: number,
  readableOnWhite: boolean,
  readableOnBlack: boolean,
  colorBlindSafe: boolean,
}

/**
 * Color Harmony type
 */
export interface colorHarmony {
  type: harmonyType,
  colors: string[],
}

/**
 * Color Metadata type
 */
export interface colorMetadata {
  luminance: number,
  brightness: number,
  contrast: number,
  isLight: boolean,
  isDark: boolean,
  accessibility: accessibilityInfo,
  harmony: colorHarmony[],
}

/**
 * Generated Color type
 */
export interface generatedColor {
  id: string,
  hex: string,
  rgb: rgbColor,
  hsl: hslColor,
  hsv: hsvColor,
  cmyk: cmykColor
  name?: string
  metadata: colorMetadata,
}

/**
 * Palette Metadata type
 */
export interface paletteMetadata {
  dominantHue: number,
  averageSaturation: number,
  averageLightness: number,
  colorCount: number,
  harmonyScore: number,
  accessibilityScore: number,
}

/**
 * Color Palette type
 */
export interface colorPalette {
  id: string,
  name: string,
  colors: generatedColor[],
  type: paletteType,
  description: string,
  metadata: paletteMetadata,
}

/**
 * Color Statistics type
 */
export interface colorStatistics {
  totalColors: number,
  formatDistribution: Record<string, number>,
  paletteDistribution: Record<string, number>,
  averageLuminance: number,
  averageContrast: number,
  accessibilityScore: number,
  processingTime: number,
}

/**
 * Color Settings type
 */
export interface colorSettings {
  defaultFormat: colorFormat,
  includeHarmony: boolean,
  checkAccessibility: boolean,
  generatePalettes: boolean,
  paletteSize: number,
  exportFormat: exportFormat,
  colorSpace: colorSpace,
}

/**
 * Color Data type
 */
export interface colorData {
  colors: generatedColor[],
  palettes: colorPalette[],
  statistics: colorStatistics,
  settings: colorSettings,
}

/**
 * Color File type
 */
export interface colorFile {
  id: string,
  name: string,
  content: string,
  size: number,
  type: string,
  status: "pending"| "processing" | "completed" | "error"
  error?: string
  processedAt?: Date
  colorData?: colorData
}

/**
 * Color Template type
 */
export interface colorTemplate {
  id: string,
  name: string,
  description: string,
  category: string,
  type: paletteType,
  baseColors: string[],
  settings: colorSettings,
}

// ==================== Type Exports ====================

export type ColorFormat = colorFormat
export type PaletteType = paletteType
export type HarmonyType = harmonyType
export type ExportFormat = exportFormat
export type ColorSpace = colorSpace
export type RGBColor = rgbColor
export type HSLColor = hslColor
export type HSVColor = hsvColor
export type CMYKColor = cmykColor
export type AccessibilityInfo = accessibilityInfo
export type ColorHarmony = colorHarmony
export type ColorMetadata = colorMetadata
export type GeneratedColor = generatedColor
export type PaletteMetadata = paletteMetadata
export type ColorPalette = colorPalette
export type ColorStatistics = colorStatistics
export type ColorSettings = colorSettings
export type ColorData = colorData
export type ColorFile = colorFile
export type ColorTemplate = colorTemplate
export type RgbColor = rgbColor
export type HslColor = hslColor
export type HsvColor = hsvColor
export type CmykColor = cmykColor
