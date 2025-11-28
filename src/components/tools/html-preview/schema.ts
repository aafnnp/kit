import { z } from "zod"

// ==================== HTML Preview Schemas ====================

/**
 * Preview Mode schema
 */
export const previewModeSchema = z.enum(["iframe", "popup", "split", "fullscreen"])

/**
 * Device Size schema
 */
export const deviceSizeSchema = z.enum(["desktop", "tablet", "mobile", "custom"])

/**
 * Export Format schema
 */
export const exportFormatSchema = z.enum(["html", "pdf", "png", "json", "txt"])

/**
 * External Resource schema
 */
export const externalResourceSchema = z.object({
  type: z.enum(["css", "js", "image", "font", "other"]),
  url: z.string(),
  isLocal: z.boolean(),
})

/**
 * Accessibility Feature schema
 */
export const accessibilityFeatureSchema = z.object({
  type: z.enum(["alt", "aria", "role", "label", "heading", "landmark"]),
  element: z.string(),
  description: z.string(),
})

/**
 * HTML Metrics schema
 */
export const htmlMetricsSchema = z.object({
  elementCount: z.number(),
  tagTypes: z.array(z.string()),
  hasDoctype: z.boolean(),
  hasHead: z.boolean(),
  hasBody: z.boolean(),
  hasTitle: z.boolean(),
  hasMeta: z.boolean(),
  hasCSS: z.boolean(),
  hasJavaScript: z.boolean(),
  externalResources: z.array(externalResourceSchema),
  semanticElements: z.array(z.string()),
  accessibilityFeatures: z.array(accessibilityFeatureSchema),
})

/**
 * Performance Metrics schema
 */
export const performanceMetricsSchema = z.object({
  renderTime: z.number(),
  domComplexity: z.number(),
  cssComplexity: z.number(),
  jsComplexity: z.number(),
  seoScore: z.number(),
  accessibilityScore: z.number(),
})

/**
 * HTML Statistics schema
 */
export const htmlStatisticsSchema = z.object({
  inputSize: z.number(),
  lineCount: z.number(),
  characterCount: z.number(),
  processingTime: z.number(),
  htmlMetrics: htmlMetricsSchema,
  performanceMetrics: performanceMetricsSchema,
})

/**
 * HTML Analysis schema
 */
export const htmlAnalysisSchema = z.object({
  isValidHTML: z.boolean(),
  hasModernStructure: z.boolean(),
  isResponsive: z.boolean(),
  hasAccessibilityFeatures: z.boolean(),
  hasSEOElements: z.boolean(),
  suggestedImprovements: z.array(z.string()),
  htmlIssues: z.array(z.string()),
  qualityScore: z.number(),
  securityIssues: z.array(z.string()),
  performanceIssues: z.array(z.string()),
})

/**
 * HTML Processing Result schema
 */
export const htmlProcessingResultSchema = z.object({
  id: z.string(),
  input: z.string(),
  isValid: z.boolean(),
  error: z.string().optional(),
  statistics: htmlStatisticsSchema,
  analysis: htmlAnalysisSchema.optional(),
  createdAt: z.date(),
})

/**
 * Batch Statistics schema
 */
export const batchStatisticsSchema = z.object({
  totalProcessed: z.number(),
  validCount: z.number(),
  invalidCount: z.number(),
  averageQuality: z.number(),
  totalInputSize: z.number(),
  successRate: z.number(),
})

/**
 * Processing Settings schema
 */
export const processingSettingsSchema = z.object({
  previewMode: previewModeSchema,
  deviceSize: deviceSizeSchema,
  showLineNumbers: z.boolean(),
  enableSyntaxHighlighting: z.boolean(),
  autoRefresh: z.boolean(),
  refreshInterval: z.number(),
  exportFormat: exportFormatSchema,
  includeCSS: z.boolean(),
  includeJS: z.boolean(),
  sanitizeHTML: z.boolean(),
  validateHTML: z.boolean(),
})

/**
 * Processing Batch schema
 */
export const processingBatchSchema = z.object({
  id: z.string(),
  results: z.array(htmlProcessingResultSchema),
  count: z.number(),
  settings: processingSettingsSchema,
  createdAt: z.date(),
  statistics: batchStatisticsSchema,
})

/**
 * HTML Template schema
 */
export const htmlTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  htmlCode: z.string(),
  features: z.array(z.string()),
  useCase: z.array(z.string()),
})

/**
 * HTML Error schema
 */
export const htmlErrorSchema = z.object({
  message: z.string(),
  line: z.number().optional(),
  column: z.number().optional(),
  type: z.enum(["syntax", "structure", "accessibility", "security"]),
  severity: z.enum(["error", "warning", "info"]),
})

/**
 * HTML Validation schema
 */
export const htmlValidationSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(htmlErrorSchema),
  warnings: z.array(z.string()),
  suggestions: z.array(z.string()),
})

// ==================== Type Exports ====================

export type PreviewMode = z.infer<typeof previewModeSchema>
export type DeviceSize = z.infer<typeof deviceSizeSchema>
export type ExportFormat = z.infer<typeof exportFormatSchema>
export type ExternalResource = z.infer<typeof externalResourceSchema>
export type AccessibilityFeature = z.infer<typeof accessibilityFeatureSchema>
export type HTMLMetrics = z.infer<typeof htmlMetricsSchema>
export type PerformanceMetrics = z.infer<typeof performanceMetricsSchema>
export type HTMLStatistics = z.infer<typeof htmlStatisticsSchema>
export type HTMLAnalysis = z.infer<typeof htmlAnalysisSchema>
export type HTMLProcessingResult = z.infer<typeof htmlProcessingResultSchema>
export type BatchStatistics = z.infer<typeof batchStatisticsSchema>
export type ProcessingSettings = z.infer<typeof processingSettingsSchema>
export type ProcessingBatch = z.infer<typeof processingBatchSchema>
export type HTMLTemplate = z.infer<typeof htmlTemplateSchema>
export type HTMLError = z.infer<typeof htmlErrorSchema>
export type HTMLValidation = z.infer<typeof htmlValidationSchema>
