// ==================== Shadow Generator Types ====================

/**
 * Shadow Type type
 */
export type shadowType = "box-shadow" | "text-shadow" | "drop-shadow"

/**
 * Export Format type
 */
export type exportFormat = "css" | "scss" | "json" | "tailwind"

/**
 * Shadow Layer type
 */
export interface shadowLayer {
  id: string,
  x: number,
  y: number,
  blur: number
  spread?: number
  color: string,
  opacity: number,
  inset: boolean,
}

/**
 * Shadow Accessibility type
 */
export interface shadowAccessibility {
  contrastRatio: number,
  visibility: "high"| "medium" | "low",
  readabilityImpact: "none" | "minimal"| "moderate" | "significant",
  wcagCompliant: boolean,
}

/**
 * Shadow type
 */
export interface shadow {
  id: string,
  type: shadowType,
  layers: shadowLayer[],
  css: string,
  accessibility: shadowAccessibility,
}

/**
 * Shadow Statistics type
 */
export interface shadowStatistics {
  totalShadows: number,
  typeDistribution: Record<string, number>,
  averageLayers: number,
  averageBlur: number,
  averageOpacity: number,
  accessibilityScore: number,
  processingTime: number,
}

/**
 * Shadow Settings type
 */
export interface shadowSettings {
  defaultType: shadowType,
  maxLayers: number,
  includeAccessibility: boolean,
  optimizeOutput: boolean,
  exportFormat: exportFormat,
  unit: "px"| "rem" | "em",
}

/**
 * Shadow Data type
 */
export interface shadowData {
  shadows: shadow[],
  statistics: shadowStatistics,
  settings: shadowSettings,
}

/**
 * Shadow File type
 */
export interface shadowFile {
  id: string,
  name: string,
  content: string,
  size: number,
  type: string,
  status: "pending"| "processing" | "completed" | "error"
  error?: string
  processedAt?: Date
  shadowData?: shadowData
}

/**
 * Shadow Template type
 */
export interface shadowTemplate {
  id: string,
  name: string,
  description: string,
  category: string,
  shadow: Partial<shadow>,
  preview: string,
}

// ==================== Type Exports ====================

export type ShadowType = shadowType
export type ExportFormat = exportFormat
export type ShadowLayer = shadowLayer
export type ShadowAccessibility = shadowAccessibility
export type Shadow = shadow
export type ShadowStatistics = shadowStatistics
export type ShadowSettings = shadowSettings
export type ShadowData = shadowData
export type ShadowFile = shadowFile
export type ShadowTemplate = shadowTemplate
