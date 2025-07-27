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
  colors: Color[]
  palette: ColorPalette
  statistics: ColorStatistics
  format: ColorFormat
}

export interface Color {
  hex: string
  rgb: RGB
  hsl: HSL
  hsv: HSV
  cmyk: CMYK
  lab: LAB
  name?: string
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

export interface ColorPalette {
  primary: Color
  complementary: Color[]
  analogous: Color[]
  triadic: Color[]
  tetradic: Color[]
  monochromatic: Color[]
  splitComplementary: Color[]
}

export interface ColorStatistics {
  totalColors: number
  dominantColor: Color
  averageBrightness: number
  averageSaturation: number
  colorDistribution: Record<string, number>
  accessibilityScore: number
  processingTime: number
}

export interface ColorSettings {
  format: ColorFormat
  paletteSize: number
  harmonyType: HarmonyType
  includeAccessibility: boolean
  generateNames: boolean
  sortBy: SortBy
}

export interface ColorTemplate {
  id: string
  name: string
  description: string
  colors: string[]
  category: string
}

export type ColorFormat = 'hex' | 'rgb' | 'hsl' | 'hsv' | 'cmyk' | 'lab'
export type HarmonyType =
  | 'complementary'
  | 'analogous'
  | 'triadic'
  | 'tetradic'
  | 'monochromatic'
  | 'split-complementary'
export type SortBy = 'hue' | 'saturation' | 'lightness' | 'brightness' | 'name'
