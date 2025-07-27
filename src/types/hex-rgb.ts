// HEX-RGB 相关类型声明
export interface ColorConversionFile {
  id: string
  name: string
  content: string
  size: number
  type: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
  processedAt?: Date
  conversionData?: ConversionData
}

export interface ConversionData {
  conversions: ColorConversion[]
  statistics: ConversionStatistics
  settings: ConversionSettings
}

export interface ColorConversion {
  original: string
  originalFormat: ColorFormat
  converted: ConvertedColor
  isValid: boolean
  error?: string
}

export interface ConvertedColor {
  hex: string
  rgb: RGB
  hsl: HSL
  hsv: HSV
  cmyk: CMYK
  lab: LAB
  accessibility: AccessibilityInfo
}

export interface RGB {
  r: number
  g: number
  b: number
}

export interface HSL {
  h: number
  s: number
  l: number
}

export interface HSV {
  h: number
  s: number
  v: number
}

export interface CMYK {
  c: number
  m: number
  y: number
  k: number
}

export interface LAB {
  l: number
  a: number
  b: number
}

export interface AccessibilityInfo {
  contrastRatios: {
    white: number
    black: number
  }
  wcagAA: {
    normal: boolean
    large: boolean
  }
  wcagAAA: {
    normal: boolean
    large: boolean
  }
  colorBlindSafe: boolean
}

export interface ConversionStatistics {
  totalConversions: number
  successfulConversions: number
  failedConversions: number
  formatDistribution: Record<ColorFormat, number>
  averageAccessibilityScore: number
  processingTime: number
}

export interface ConversionSettings {
  inputFormat: ColorFormat
  outputFormat: ColorFormat
  includeAccessibility: boolean
  validateColors: boolean
  preserveCase: boolean
  batchMode: boolean
}

export interface ConversionTemplate {
  id: string
  name: string
  description: string
  inputFormat: ColorFormat
  outputFormat: ColorFormat
  examples: {
    input: string
    output: string
  }[]
}

// Enums
export type ColorFormat = 'hex' | 'rgb' | 'hsl' | 'hsv' | 'cmyk' | 'lab'
