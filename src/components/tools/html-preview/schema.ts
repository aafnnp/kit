// ==================== HTML Preview Types ====================

/**
 * Preview Mode type
 */
export type previewMode = "iframe" | "popup" | "split" | "fullscreen"

/**
 * Device Size type
 */
export type deviceSize = "desktop" | "tablet" | "mobile" | "custom"

/**
 * Export Format type
 */
export type exportFormat = "html" | "pdf" | "png" | "json" | "txt"

/**
 * External Resource type
 */
export interface externalResource {
  type: "css"| "js" | "image" | "font" | "other",
  url: string,
  isLocal: boolean,
}

/**
 * Accessibility Feature type
 */
export interface accessibilityFeature {
  type: "alt"| "aria" | "role" | "label" | "heading" | "landmark",
  element: string,
  description: string,
}

/**
 * HTML Metrics type
 */
export interface htmlMetrics {
  elementCount: number,
  tagTypes: string[],
  hasDoctype: boolean,
  hasHead: boolean,
  hasBody: boolean,
  hasTitle: boolean,
  hasMeta: boolean,
  hasCSS: boolean,
  hasJavaScript: boolean,
  externalResources: externalResource[],
  semanticElements: string[],
  accessibilityFeatures: accessibilityFeature[],
}

/**
 * Performance Metrics type
 */
export interface performanceMetrics {
  renderTime: number,
  domComplexity: number,
  cssComplexity: number,
  jsComplexity: number,
  seoScore: number,
  accessibilityScore: number,
}

/**
 * HTML Statistics type
 */
export interface htmlStatistics {
  inputSize: number,
  lineCount: number,
  characterCount: number,
  processingTime: number,
  htmlMetrics: htmlMetrics,
  performanceMetrics: performanceMetrics,
}

/**
 * HTML Analysis type
 */
export interface htmlAnalysis {
  isValidHTML: boolean,
  hasModernStructure: boolean,
  isResponsive: boolean,
  hasAccessibilityFeatures: boolean,
  hasSEOElements: boolean,
  suggestedImprovements: string[],
  htmlIssues: string[],
  qualityScore: number,
  securityIssues: string[],
  performanceIssues: string[],
}

/**
 * HTML Processing Result type
 */
export interface htmlProcessingResult {
  id: string,
  input: string,
  isValid: boolean
  error?: string
  statistics: htmlStatistics
  analysis?: htmlAnalysis
  createdAt: Date,
}

/**
 * Batch Statistics type
 */
export interface batchStatistics {
  totalProcessed: number,
  validCount: number,
  invalidCount: number,
  averageQuality: number,
  totalInputSize: number,
  successRate: number,
}

/**
 * Processing Settings type
 */
export interface processingSettings {
  previewMode: previewMode,
  deviceSize: deviceSize,
  showLineNumbers: boolean,
  enableSyntaxHighlighting: boolean,
  autoRefresh: boolean,
  refreshInterval: number,
  exportFormat: exportFormat,
  includeCSS: boolean,
  includeJS: boolean,
  sanitizeHTML: boolean,
  validateHTML: boolean,
}

/**
 * Processing Batch type
 */
export interface processingBatch {
  id: string,
  results: htmlProcessingResult[],
  count: number,
  settings: processingSettings,
  createdAt: Date,
  statistics: batchStatistics,
}

/**
 * HTML Template type
 */
export interface htmlTemplate {
  id: string,
  name: string,
  description: string,
  category: string,
  htmlCode: string,
  features: string[],
  useCase: string[],
}

/**
 * HTML Error type
 */
export interface htmlError {
  message: string
  line?: number
  column?: number
  type: "syntax"| "structure" | "accessibility" | "security",
  severity: "error"| "warning" | "info",
}

/**
 * HTML Validation type
 */
export interface htmlValidation {
  isValid: boolean,
  errors: htmlError[],
  warnings: string[],
  suggestions: string[],
}

// ==================== Type Exports ====================

export type PreviewMode = previewMode
export type DeviceSize = deviceSize
export type ExportFormat = exportFormat
export type ExternalResource = externalResource
export type AccessibilityFeature = accessibilityFeature
export type HTMLMetrics = htmlMetrics
export type PerformanceMetrics = performanceMetrics
export type HTMLStatistics = htmlStatistics
export type HTMLAnalysis = htmlAnalysis
export type HTMLProcessingResult = htmlProcessingResult
export type BatchStatistics = batchStatistics
export type ProcessingSettings = processingSettings
export type ProcessingBatch = processingBatch
export type HTMLTemplate = htmlTemplate
export type HTMLError = htmlError
export type HTMLValidation = htmlValidation
export type HtmlMetrics = htmlMetrics
export type HtmlStatistics = htmlStatistics
export type HtmlAnalysis = htmlAnalysis
export type HtmlProcessingResult = htmlProcessingResult
export type HtmlTemplate = htmlTemplate
export type HtmlError = htmlError
export type HtmlValidation = htmlValidation
