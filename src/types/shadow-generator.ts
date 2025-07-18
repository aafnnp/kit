// Shadow Generator 相关类型声明
export interface ShadowFile {
  id: string
  name: string
  content: string
  size: number
  type: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
  processedAt?: Date
  shadowData?: ShadowData
}

export interface ShadowData {
  shadows: Shadow[]
  statistics: ShadowStatistics
  settings: ShadowSettings
}

export interface Shadow {
  id: string
  type: ShadowType
  layers: ShadowLayer[]
  css: string
  accessibility: ShadowAccessibility
}

export interface ShadowLayer {
  id: string
  x: number
  y: number
  blur: number
  spread?: number
  color: string
  opacity: number
  inset: boolean
}

export interface ShadowAccessibility {
  contrastRatio: number
  visibility: 'high' | 'medium' | 'low'
  readabilityImpact: 'none' | 'minimal' | 'moderate' | 'significant'
  wcagCompliant: boolean
}

export interface ShadowStatistics {
  totalShadows: number
  typeDistribution: Record<ShadowType, number>
  averageLayers: number
  averageBlur: number
  averageOpacity: number
  accessibilityScore: number
  processingTime: number
}

export interface ShadowSettings {
  defaultType: ShadowType
  maxLayers: number
  includeAccessibility: boolean
  optimizeOutput: boolean
  exportFormat: ExportFormat
  unit: 'px' | 'rem' | 'em'
}

export interface ShadowTemplate {
  id: string
  name: string
  description: string
  category: string
  shadow: Partial<Shadow>
  preview: string
}

// Enums
export type ShadowType = 'box-shadow' | 'text-shadow' | 'drop-shadow'
export type ExportFormat = 'css' | 'scss' | 'json' | 'tailwind'
