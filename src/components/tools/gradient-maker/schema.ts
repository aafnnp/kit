// ==================== Gradient Maker Types ====================

/**
 * Gradient Type type
 */
export type gradientType = "linear" | "radial" | "conic" | "repeating-linear" | "repeating-radial"

/**
 * Radial Shape type
 */
export type radialShape = "circle" | "ellipse"

/**
 * Radial Size type
 */
export type radialSize = "closest-side" | "closest-corner" | "farthest-side" | "farthest-corner"

/**
 * Blend Mode type
 */
export type blendMode = "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn" | "hard-light" | "soft-light" | "difference" | "exclusion"

/**
 * Export Format type
 */
export type exportFormat = "css" | "scss" | "svg" | "png" | "json"

/**
 * Color Stop type
 */
export interface colorStop {
  id: string,
  color: string,
  position: number
  opacity?: number
}

/**
 * Radial Position type
 */
export interface radialPosition {
  x: number,
  y: number,
}

/**
 * Gradient Accessibility type
 */
export interface gradientAccessibility {
  contrastRatio: number,
  wcagCompliant: boolean,
  colorBlindSafe: boolean,
  readabilityScore: number,
}

/**
 * Gradient type
 */
export interface gradient {
  id: string,
  type: gradientType,
  colors: colorStop[]
  angle?: number
  position?: radialPosition
  shape?: radialShape
  size?: radialSize
  repeating?: boolean
  blendMode?: blendMode
  css: string,
  svg: string,
  accessibility: gradientAccessibility,
}

/**
 * Gradient Statistics type
 */
export interface gradientStatistics {
  totalGradients: number,
  typeDistribution: Record<string, number>,
  averageColorStops: number,
  averageContrastRatio: number,
  accessibilityScore: number,
  processingTime: number,
}

/**
 * Gradient Settings type
 */
export interface gradientSettings {
  defaultType: gradientType,
  maxColorStops: number,
  includeAccessibility: boolean,
  generateSVG: boolean,
  optimizeOutput: boolean,
  exportFormat: exportFormat,
}

/**
 * Gradient Data type
 */
export interface gradientData {
  gradients: gradient[],
  statistics: gradientStatistics,
  settings: gradientSettings,
}

/**
 * Gradient File type
 */
export interface gradientFile {
  id: string,
  name: string,
  content: string,
  size: number,
  type: string,
  status: "pending"| "processing" | "completed" | "error"
  error?: string
  processedAt?: Date
  gradientData?: gradientData
}

/**
 * Gradient Template type
 */
export interface gradientTemplate {
  id: string,
  name: string,
  description: string,
  category: string,
  gradient: Partial<gradient>,
  preview: string,
}

// ==================== Type Exports ====================

export type GradientType = gradientType
export type RadialShape = radialShape
export type RadialSize = radialSize
export type BlendMode = blendMode
export type ExportFormat = exportFormat
export type ColorStop = colorStop
export type RadialPosition = radialPosition
export type GradientAccessibility = gradientAccessibility
export type Gradient = gradient
export type GradientStatistics = gradientStatistics
export type GradientSettings = gradientSettings
export type GradientData = gradientData
export type GradientFile = gradientFile
export type GradientTemplate = gradientTemplate
