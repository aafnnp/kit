// ==================== Border Radius Types ====================

/**
 * Border Radius Type type
 */
export type borderRadiusType = "uniform" | "individual" | "percentage"

/**
 * Border Radius Unit type
 */
export type borderRadiusUnit = "px" | "rem" | "em" | "%"

/**
 * Export Format type
 */
export type exportFormat = "css" | "scss" | "json" | "tailwind"

/**
 * Border Radius Corners type
 */
export interface borderRadiusCorners {
  topLeft: number,
  topRight: number,
  bottomRight: number,
  bottomLeft: number,
  unit: borderRadiusUnit,
}

/**
 * Border Radius Accessibility type
 */
export interface borderRadiusAccessibility {
  uniformity: "uniform" | "mixed",
  readabilityImpact: "none" | "minimal" | "moderate",
  designConsistency: "consistent" | "varied" | "chaotic",
  usabilityScore: number,
}

/**
 * Border Radius type
 */
export interface borderRadius {
  id: string,
  type: borderRadiusType,
  corners: borderRadiusCorners,
  css: string,
  accessibility: borderRadiusAccessibility,
}

/**
 * Border Radius Statistics type
 */
export interface borderRadiusStatistics {
  totalBorderRadii: number,
  typeDistribution: Record<string, number>,
  averageRadius: number,
  uniformityRatio: number,
  accessibilityScore: number,
  processingTime: number,
}

/**
 * Border Radius Settings type
 */
export interface borderRadiusSettings {
  defaultType: borderRadiusType,
  defaultUnit: borderRadiusUnit,
  maxRadius: number,
  includeAccessibility: boolean,
  optimizeOutput: boolean,
  exportFormat: exportFormat,
}

/**
 * Border Radius Data type
 */
export interface borderRadiusData {
  borderRadii: borderRadius[],
  statistics: borderRadiusStatistics,
  settings: borderRadiusSettings,
}

/**
 * Border Radius File type
 */
export interface borderRadiusFile {
  id: string,
  name: string,
  content: string,
  size: number,
  type: string,
  status: "pending" | "processing" | "completed" | "error"
  error?: string
  processedAt?: Date
  borderRadiusData?: borderRadiusData
}

/**
 * Border Radius Template type
 */
export interface borderRadiusTemplate {
  id: string,
  name: string,
  description: string,
  category: string,
  borderRadius: Partial<borderRadius>,
  preview: string,
}

// ==================== Type Exports ====================

export type BorderRadiusType = borderRadiusType
export type BorderRadiusUnit = borderRadiusUnit
export type ExportFormat = exportFormat
export type BorderRadiusCorners = borderRadiusCorners
export type BorderRadiusAccessibility = borderRadiusAccessibility
export type BorderRadius = borderRadius
export type BorderRadiusStatistics = borderRadiusStatistics
export type BorderRadiusSettings = borderRadiusSettings
export type BorderRadiusData = borderRadiusData
export type BorderRadiusFile = borderRadiusFile
export type BorderRadiusTemplate = borderRadiusTemplate
