// ==================== CSS Clamp Types ====================

/**
 * CSS Property type
 */
export type cssProperty = "font-size" | "width" | "height" | "margin" | "padding" | "gap" | "border-radius" | "line-height"

/**
 * CSS Unit type
 */
export type cssUnit = "px" | "rem" | "em" | "vw" | "vh" | "vmin" | "vmax" | "%" | "ch" | "ex"

/**
 * Export Format type
 */
export type exportFormat = "css" | "scss" | "json" | "js"

/**
 * Responsive Breakpoint type
 */
export interface responsiveBreakpoint {
  name: string,
  width: number,
  value: number,
  unit: cssUnit,
}

/**
 * Accessibility Info type
 */
export interface accessibilityInfo {
  meetsMinimumSize: boolean,
  scalingRatio: number,
  readabilityScore: number,
  contrastCompatible: boolean,
}

/**
 * Clamp Metadata type
 */
export interface clampMetadata {
  minViewport: number,
  maxViewport: number,
  scalingFactor: number,
  responsiveRange: number,
  isValid: boolean,
  breakpoints: responsiveBreakpoint[],
  accessibility: accessibilityInfo,
}

/**
 * Generated Clamp type
 */
export interface generatedClamp {
  id: string,
  property: cssProperty,
  minValue: number,
  idealValue: number,
  maxValue: number,
  minUnit: cssUnit,
  idealUnit: cssUnit,
  maxUnit: cssUnit,
  clampRule: string,
  cssRule: string,
  metadata: clampMetadata,
}

/**
 * Clamp Statistics type
 */
export interface clampStatistics {
  totalClamps: number,
  propertyDistribution: Record<string, number>,
  unitDistribution: Record<string, number>,
  averageScalingFactor: number,
  responsiveRangeAverage: number,
  accessibilityScore: number,
  processingTime: number,
}

/**
 * Viewport Range type
 */
export interface viewportRange {
  minWidth: number,
  maxWidth: number,
}

/**
 * Clamp Settings type
 */
export interface clampSettings {
  defaultProperty: cssProperty,
  defaultMinUnit: cssUnit,
  defaultIdealUnit: cssUnit,
  defaultMaxUnit: cssUnit,
  includeBreakpoints: boolean,
  generateFullCSS: boolean,
  optimizeForAccessibility: boolean,
  exportFormat: exportFormat,
  viewportRange: viewportRange,
}

/**
 * Clamp Data type
 */
export interface clampData {
  clamps: generatedClamp[],
  statistics: clampStatistics,
  settings: clampSettings,
}

/**
 * CSS Clamp File type
 */
export interface cssClampFile {
  id: string,
  name: string,
  content: string,
  size: number,
  type: string,
  status: "pending"| "processing" | "completed" | "error"
  error?: string
  processedAt?: Date
  clampData?: clampData
}

/**
 * Clamp Template type
 */
export interface clampTemplate {
  id: string,
  name: string,
  description: string,
  category: string,
  property: cssProperty,
  minValue: number,
  idealValue: number,
  maxValue: number,
  minUnit: cssUnit,
  idealUnit: cssUnit,
  maxUnit: cssUnit,
  viewportRange: viewportRange,
}

// ==================== Type Exports ====================

export type CssProperty = cssProperty
export type CssUnit = cssUnit
export type ExportFormat = exportFormat
export type ResponsiveBreakpoint = responsiveBreakpoint
export type AccessibilityInfo = accessibilityInfo
export type ClampMetadata = clampMetadata
export type GeneratedClamp = generatedClamp
export type ClampStatistics = clampStatistics
export type ViewportRange = viewportRange
export type ClampSettings = clampSettings
export type ClampData = clampData
export type CssClampFile = cssClampFile
export type ClampTemplate = clampTemplate
