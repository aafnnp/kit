// Types
export interface BorderRadiusFile {
  id: string
  name: string
  content: string
  size: number
  type: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
  processedAt?: Date
  borderRadiusData?: BorderRadiusData
}

export interface BorderRadiusData {
  borderRadii: BorderRadius[]
  statistics: BorderRadiusStatistics
  settings: BorderRadiusSettings
}

export interface BorderRadius {
  id: string
  type: BorderRadiusType
  corners: BorderRadiusCorners
  css: string
  accessibility: BorderRadiusAccessibility
}

export interface BorderRadiusCorners {
  topLeft: number
  topRight: number
  bottomRight: number
  bottomLeft: number
  unit: BorderRadiusUnit
}

export interface BorderRadiusAccessibility {
  uniformity: 'uniform' | 'mixed'
  readabilityImpact: 'none' | 'minimal' | 'moderate'
  designConsistency: 'consistent' | 'varied' | 'chaotic'
  usabilityScore: number
}

export interface BorderRadiusStatistics {
  totalBorderRadii: number
  typeDistribution: Record<BorderRadiusType, number>
  averageRadius: number
  uniformityRatio: number
  accessibilityScore: number
  processingTime: number
}

export interface BorderRadiusSettings {
  defaultType: BorderRadiusType
  defaultUnit: BorderRadiusUnit
  maxRadius: number
  includeAccessibility: boolean
  optimizeOutput: boolean
  exportFormat: ExportFormat
}

export interface BorderRadiusTemplate {
  id: string
  name: string
  description: string
  category: string
  borderRadius: Partial<BorderRadius>
  preview: string
}

// Enums
export type BorderRadiusType = 'uniform' | 'individual' | 'percentage'
export type BorderRadiusUnit = 'px' | 'rem' | 'em' | '%'
export type ExportFormat = 'css' | 'scss' | 'json' | 'tailwind'
