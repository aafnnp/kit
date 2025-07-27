// Random Color 相关类型声明
export interface ColorFile {
  id: string
  name: string
  content: string
  size: number
  type: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
  processedAt?: Date
  colorData?: ColorData
}

export interface ColorData {
  colors: GeneratedColor[]
  palettes: ColorPalette[]
  statistics: ColorStatistics
  settings: ColorSettings
}

export interface GeneratedColor {
  id: string
  hex: string
  rgb: RGBColor
  hsl: HSLColor
  hsv: HSVColor
  cmyk: CMYKColor
  name?: string
  metadata: ColorMetadata
}

export interface RGBColor {
  r: number
  g: number
  b: number
}

export interface HSLColor {
  h: number
  s: number
  l: number
}

export interface HSVColor {
  h: number
  s: number
  v: number
}

export interface CMYKColor {
  c: number
  m: number
  y: number
  k: number
}

export interface ColorMetadata {
  luminance: number
  brightness: number
  contrast: number
  isLight: boolean
  isDark: boolean
  accessibility: AccessibilityInfo
  harmony: ColorHarmony[]
}

export interface AccessibilityInfo {
  wcagAA: boolean
  wcagAAA: boolean
  contrastRatio: number
  readableOnWhite: boolean
  readableOnBlack: boolean
  colorBlindSafe: boolean
}

export interface ColorHarmony {
  type: HarmonyType
  colors: string[]
}

export interface ColorPalette {
  id: string
  name: string
  colors: GeneratedColor[]
  type: PaletteType
  description: string
  metadata: PaletteMetadata
}

export interface PaletteMetadata {
  dominantHue: number
  averageSaturation: number
  averageLightness: number
  colorCount: number
  harmonyScore: number
  accessibilityScore: number
}

export interface ColorStatistics {
  totalColors: number
  formatDistribution: Record<ColorFormat, number>
  paletteDistribution: Record<PaletteType, number>
  averageLuminance: number
  averageContrast: number
  accessibilityScore: number
  processingTime: number
}

export interface ColorSettings {
  defaultFormat: ColorFormat
  includeHarmony: boolean
  checkAccessibility: boolean
  generatePalettes: boolean
  paletteSize: number
  exportFormat: ExportFormat
  colorSpace: ColorSpace
}

export interface ColorTemplate {
  id: string
  name: string
  description: string
  category: string
  type: PaletteType
  baseColors: string[]
  settings: Partial<ColorSettings>
}

// Enums
export type ColorFormat = 'hex' | 'rgb' | 'hsl' | 'hsv' | 'cmyk'
export type PaletteType =
  | 'monochromatic'
  | 'analogous'
  | 'complementary'
  | 'triadic'
  | 'tetradic'
  | 'split-complementary'
  | 'random'
export type HarmonyType =
  | 'complementary'
  | 'analogous'
  | 'triadic'
  | 'tetradic'
  | 'split-complementary'
  | 'monochromatic'
export type ExportFormat = 'json' | 'css' | 'scss' | 'ase' | 'gpl'
export type ColorSpace = 'sRGB' | 'P3' | 'Rec2020'
