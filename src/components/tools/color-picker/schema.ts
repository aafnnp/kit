// ==================== Color Picker Types ====================

/**
 * Color Format type
 */
export type colorFormat = "hex" | "rgb" | "hsl" | "hsv" | "cmyk" | "lab"

/**
 * Harmony Type type
 */
export type harmonyType = "complementary" | "analogous" | "triadic" | "tetradic" | "monochromatic" | "split-complementary"

/**
 * Sort By type
 */
export type sortBy = "hue" | "saturation" | "lightness" | "brightness" | "name"

/**
 * RGB type
 */
export interface rgb {
  r: number,
  g: number,
  b: number,
}

/**
 * HSL type
 */
export interface hsl {
  h: number,
  s: number,
  l: number,
}

/**
 * HSV type
 */
export interface hsv {
  h: number,
  s: number,
  v: number,
}

/**
 * CMYK type
 */
export interface cmyk {
  c: number,
  m: number,
  y: number,
  k: number,
}

/**
 * LAB type
 */
export interface lab {
  l: number,
  a: number,
  b: number,
}

/**
 * Accessibility Info type
 */
export interface accessibilityInfo {
  contrastRatios: {
    white: number,
    black: number,
  }
  wcagAA: {
    normal: boolean,
    large: boolean,
  }
  wcagAAA: {
    normal: boolean,
    large: boolean,
  }
  colorBlindSafe: boolean,
}
/**
 * Color type
 */
export interface color {
  hex: string,
  rgb: rgb,
  hsl: hsl,
  hsv: hsv,
  cmyk: cmyk,
  lab: lab
  name?: string
  accessibility: accessibilityInfo,
}

/**
 * Color Palette type
 */
export interface colorPalette {
  primary: color,
  complementary: color[],
  analogous: color[],
  triadic: color[],
  tetradic: color[],
  monochromatic: color[],
  splitComplementary: color[],
}

/**
 * Color Statistics type
 */
export interface colorStatistics {
  totalColors: number,
  dominantColor: color,
  averageBrightness: number,
  averageSaturation: number,
  colorDistribution: Record<string, number>,
  accessibilityScore: number,
  processingTime: number,
}

/**
 * Color Settings type
 */
export interface colorSettings {
  format: colorFormat,
  paletteSize: number,
  harmonyType: harmonyType,
  includeAccessibility: boolean,
  generateNames: boolean,
  sortBy: sortBy,
}

/**
 * Color Data type
 */
export interface colorData {
  colors: color[],
  palette: colorPalette,
  statistics: colorStatistics,
  format: colorFormat,
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
  colors: string[],
  category: string,
}

// ==================== Type Exports ====================

export type ColorFormat = colorFormat
export type HarmonyType = harmonyType
export type SortBy = sortBy
export type RGB = rgb
export type HSL = hsl
export type HSV = hsv
export type CMYK = cmyk
export type LAB = lab
export type AccessibilityInfo = accessibilityInfo
export type Color = color
export type ColorPalette = colorPalette
export type ColorStatistics = colorStatistics
export type ColorSettings = colorSettings
export type ColorData = colorData
export type ColorFile = colorFile
export type ColorTemplate = colorTemplate
export type Rgb = rgb
export type Hsl = hsl
export type Hsv = hsv
export type Cmyk = cmyk
export type Lab = lab
