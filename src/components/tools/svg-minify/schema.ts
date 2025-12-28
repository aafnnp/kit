// ==================== SVG Minify Types ====================

/**
 * Optimization Level type
 */
export type optimizationLevel = "basic" | "aggressive" | "custom"

/**
 * Export Format type
 */
export type exportFormat = "svg" | "minified" | "gzipped" | "base64"

/**
 * Optimization Type type
 */
export type optimizationType = "comments" | "whitespace" | "attributes" | "paths" | "metadata" | "unused"

/**
 * SVG Element type
 */
export interface svgElement {
  tag: string,
  count: number,
  attributes: string[],
  hasChildren: boolean,
}

/**
 * SVG Attribute type
 */
export interface svgAttribute {
  name: string,
  count: number,
  totalLength: number,
  canOptimize: boolean,
}

/**
 * SVG Metadata type
 */
export interface svgMetadata {
  viewBox: string,
  width: string,
  height: string,
  xmlns: string,
  version: string,
  hasComments: boolean,
  hasWhitespace: boolean,
  hasUnusedElements: boolean,
}

/**
 * SVG Content type
 */
export interface svgContent {
  content: string,
  size: number,
  elements: svgElement[],
  attributes: svgAttribute[],
  metadata: svgMetadata,
}

/**
 * SVG Statistics type
 */
export interface svgStatistics {
  originalSize: number,
  optimizedSize: number,
  compressionRatio: number,
  spaceSaved: number,
  elementsRemoved: number,
  attributesOptimized: number,
  commentsRemoved: number,
  whitespaceRemoved: number,
  processingTime: number,
}

/**
 * SVG Settings type
 */
export interface svgSettings {
  optimizationLevel: optimizationLevel,
  removeComments: boolean,
  removeWhitespace: boolean,
  removeUnusedElements: boolean,
  optimizeAttributes: boolean,
  simplifyPaths: boolean,
  removeMetadata: boolean,
  exportFormat: exportFormat,
  preserveAccessibility: boolean,
}

/**
 * SVG Data type
 */
export interface svgData {
  original: svgContent,
  optimized: svgContent,
  statistics: svgStatistics,
  settings: svgSettings,
}

/**
 * SVG File type
 */
export interface svgFile {
  id: string,
  name: string,
  content: string,
  size: number,
  type: string,
  status: "pending"| "processing" | "completed" | "error"
  error?: string
  processedAt?: Date
  svgData?: svgData
}

/**
 * SVG Template type
 */
export interface svgTemplate {
  id: string,
  name: string,
  description: string,
  category: string,
  settings: svgSettings,
  optimizations: optimizationType[],
}

// ==================== Type Exports ====================

export type OptimizationLevel = optimizationLevel
export type ExportFormat = exportFormat
export type OptimizationType = optimizationType
export type SvgElement = svgElement
export type SvgAttribute = svgAttribute
export type SvgMetadata = svgMetadata
export type SvgContent = svgContent
export type SvgStatistics = svgStatistics
export type SvgSettings = svgSettings
export type SvgData = svgData
export type SvgFile = svgFile
export type SvgTemplate = svgTemplate
