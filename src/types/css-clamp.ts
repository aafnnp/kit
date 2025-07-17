// Types
export interface CssClampFile {
  id: string
  name: string
  content: string
  size: number
  type: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
  processedAt?: Date
  clampData?: ClampData
}

export interface ClampData {
  clamps: GeneratedClamp[]
  statistics: ClampStatistics
  settings: ClampSettings
}

export interface GeneratedClamp {
  id: string
  property: CssProperty
  minValue: number
  idealValue: number
  maxValue: number
  minUnit: CssUnit
  idealUnit: CssUnit
  maxUnit: CssUnit
  clampRule: string
  cssRule: string
  metadata: ClampMetadata
}

export interface ClampMetadata {
  minViewport: number
  maxViewport: number
  scalingFactor: number
  responsiveRange: number
  isValid: boolean
  breakpoints: ResponsiveBreakpoint[]
  accessibility: AccessibilityInfo
}

export interface ResponsiveBreakpoint {
  name: string
  width: number
  value: number
  unit: CssUnit
}

export interface AccessibilityInfo {
  meetsMinimumSize: boolean
  scalingRatio: number
  readabilityScore: number
  contrastCompatible: boolean
}

export interface ClampStatistics {
  totalClamps: number
  propertyDistribution: Record<CssProperty, number>
  unitDistribution: Record<CssUnit, number>
  averageScalingFactor: number
  responsiveRangeAverage: number
  accessibilityScore: number
  processingTime: number
}

export interface ClampSettings {
  defaultProperty: CssProperty
  defaultMinUnit: CssUnit
  defaultIdealUnit: CssUnit
  defaultMaxUnit: CssUnit
  includeBreakpoints: boolean
  generateFullCSS: boolean
  optimizeForAccessibility: boolean
  exportFormat: ExportFormat
  viewportRange: ViewportRange
}

export interface ViewportRange {
  minWidth: number
  maxWidth: number
}

export interface ClampTemplate {
  id: string
  name: string
  description: string
  category: string
  property: CssProperty
  minValue: number
  idealValue: number
  maxValue: number
  minUnit: CssUnit
  idealUnit: CssUnit
  maxUnit: CssUnit
  viewportRange: ViewportRange
}

// Enums
export type CssProperty =
  | 'font-size'
  | 'width'
  | 'height'
  | 'margin'
  | 'padding'
  | 'gap'
  | 'border-radius'
  | 'line-height'
export type CssUnit = 'px' | 'rem' | 'em' | 'vw' | 'vh' | 'vmin' | 'vmax' | '%' | 'ch' | 'ex'
export type ExportFormat = 'css' | 'scss' | 'json' | 'js'
