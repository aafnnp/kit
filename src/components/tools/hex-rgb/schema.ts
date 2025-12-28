// ==================== HEX-RGB Types ====================

/**
 * Color Format type
 */
export type colorFormat = "hex" | "rgb" | "hsl" | "hsv" | "cmyk" | "lab"

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
  },
  wcagAA: {
    normal: boolean,
    large: boolean,
  },
  wcagAAA: {
    normal: boolean,
    large: boolean,
  },
  colorBlindSafe: boolean,
}
/**
 * Converted Color type
 */
export interface convertedColor {
  hex: string,
  rgb: rgb,
  hsl: hsl,
  hsv: hsv,
  cmyk: cmyk,
  lab: lab,
  accessibility: accessibilityInfo,
}

/**
 * Color Conversion type
 */
export interface colorConversion {
  original: string,
  originalFormat: colorFormat,
  converted: convertedColor,
  isValid: boolean
  error?: string
}

/**
 * Conversion Statistics type
 */
export interface conversionStatistics {
  totalConversions: number,
  successfulConversions: number,
  failedConversions: number,
  formatDistribution: Record<string, number>,
  averageAccessibilityScore: number,
  processingTime: number,
}

/**
 * Conversion Settings type
 */
export interface conversionSettings {
  inputFormat: colorFormat,
  outputFormat: colorFormat,
  includeAccessibility: boolean,
  validateColors: boolean,
  preserveCase: boolean,
  batchMode: boolean,
}

/**
 * Conversion Data type
 */
export interface conversionData {
  conversions: colorConversion[],
  statistics: conversionStatistics,
  settings: conversionSettings,
}

/**
 * Color Conversion File type
 */
export interface colorConversionFile {
  id: string,
  name: string,
  content: string,
  size: number,
  type: string,
  status: "pending"| "processing" | "completed" | "error"
  error?: string
  processedAt?: Date
  conversionData?: conversionData
}

/**
 * Conversion Template type
 */
export interface conversionTemplate {
  id: string,
  name: string,
  description: string,
  inputFormat: colorFormat,
  outputFormat: colorFormat,
  examples: {
    input: string,
    output: string,
  }[]
}
// ==================== Type Exports ====================

export type ColorFormat = colorFormat
export type RGB = rgb
export type HSL = hsl
export type HSV = hsv
export type CMYK = cmyk
export type LAB = lab
export type AccessibilityInfo = accessibilityInfo
export type ConvertedColor = convertedColor
export type ColorConversion = colorConversion
export type ConversionStatistics = conversionStatistics
export type ConversionSettings = conversionSettings
export type ConversionData = conversionData
export type ColorConversionFile = colorConversionFile
export type ConversionTemplate = conversionTemplate
export type Rgb = rgb
export type Hsl = hsl
export type Hsv = hsv
export type Cmyk = cmyk
export type Lab = lab
