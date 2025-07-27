// Gradient Maker 相关类型声明
export interface GradientFile {
  id: string
  name: string
  content: string
  size: number
  type: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
  processedAt?: Date
  gradientData?: GradientData
}

export interface GradientData {
  gradients: Gradient[]
  statistics: GradientStatistics
  settings: GradientSettings
}

export interface Gradient {
  id: string
  type: GradientType
  colors: ColorStop[]
  angle?: number
  position?: RadialPosition
  shape?: RadialShape
  size?: RadialSize
  repeating?: boolean
  blendMode?: BlendMode
  css: string
  svg: string
  accessibility: GradientAccessibility
}

export interface ColorStop {
  id: string
  color: string
  position: number
  opacity?: number
}

export interface RadialPosition {
  x: number
  y: number
}

export interface GradientAccessibility {
  contrastRatio: number
  wcagCompliant: boolean
  colorBlindSafe: boolean
  readabilityScore: number
}

export interface GradientStatistics {
  totalGradients: number
  typeDistribution: Record<GradientType, number>
  averageColorStops: number
  averageContrastRatio: number
  accessibilityScore: number
  processingTime: number
}

export interface GradientSettings {
  defaultType: GradientType
  maxColorStops: number
  includeAccessibility: boolean
  generateSVG: boolean
  optimizeOutput: boolean
  exportFormat: ExportFormat
}

export interface GradientTemplate {
  id: string
  name: string
  description: string
  category: string
  gradient: Partial<Gradient>
  preview: string
}

export type GradientType = 'linear' | 'radial' | 'conic' | 'repeating-linear' | 'repeating-radial'
export type RadialShape = 'circle' | 'ellipse'
export type RadialSize = 'closest-side' | 'closest-corner' | 'farthest-side' | 'farthest-corner'
export type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion'
export type ExportFormat = 'css' | 'scss' | 'svg' | 'png' | 'json'
