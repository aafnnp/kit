// ==================== Base64 Image Types ====================

/**
 * Conversion Direction type
 */
export type conversionDirection = "image-to-base64" | "base64-to-image"

/**
 * Image Format type
 */
export type imageFormat = "jpeg" | "png" | "webp" | "gif" | "bmp"

/**
 * Export Format type
 */
export type exportFormat = "base64" | "dataurl" | "json" | "txt"

/**
 * Image Metadata type
 */
export interface imageMetadata {
  width: number,
  height: number,
  format: string,
  mimeType: string,
  aspectRatio: number,
  pixelCount: number,
  estimatedColors: number,
  hasTransparency: boolean,
}

/**
 * Quality Metrics type
 */
export interface qualityMetrics {
  resolution: string,
  sizeCategory: string,
  compressionEfficiency: number,
  dataUrlOverhead: number,
  base64Efficiency: number,
}

/**
 * Image Statistics type
 */
export interface imageStatistics {
  inputSize: number,
  outputSize: number,
  compressionRatio: number,
  processingTime: number,
  imageMetadata: imageMetadata,
  qualityMetrics: qualityMetrics,
}

/**
 * Image Analysis type
 */
export interface imageAnalysis {
  isValidImage: boolean,
  hasDataUrlPrefix: boolean,
  isOptimized: boolean,
  suggestedImprovements: string[],
  imageIssues: string[],
  qualityScore: number,
  formatRecommendations: string[],
}

/**
 * Image Processing Result type
 */
export interface imageProcessingResult {
  id: string,
  input: string,
  output: string,
  direction: conversionDirection,
  isValid: boolean
  error?: string
  statistics: imageStatistics
  analysis?: imageAnalysis
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
  totalOutputSize: number,
  successRate: number,
}

/**
 * Processing Settings type
 */
export interface processingSettings {
  outputFormat: imageFormat,
  quality: number,
  maxWidth: number,
  maxHeight: number,
  includeDataUrlPrefix: boolean,
  realTimeProcessing: boolean,
  exportFormat: exportFormat,
  compressionLevel: number,
  preserveMetadata: boolean,
  autoOptimize: boolean,
}

/**
 * Processing Batch type
 */
export interface processingBatch {
  id: string,
  results: imageProcessingResult[],
  count: number,
  settings: processingSettings,
  createdAt: Date,
  statistics: batchStatistics,
}

/**
 * Image Template type
 */
export interface imageTemplate {
  id: string,
  name: string,
  description: string,
  category: string,
  base64Example: string,
  imageInfo: string,
  useCase: string[],
}

/**
 * Image Error type
 */
export interface imageError {
  message: string,
  type: "format" | "size" | "encoding" | "corruption"
  details?: string
}

/**
 * Image Validation type
 */
export interface imageValidation {
  isValid: boolean,
  errors: imageError[],
  warnings: string[],
  suggestions: string[],
}

// ==================== Type Exports ====================

export type ConversionDirection = conversionDirection
export type ImageFormat = imageFormat
export type ExportFormat = exportFormat
export type ImageMetadata = imageMetadata
export type QualityMetrics = qualityMetrics
export type ImageStatistics = imageStatistics
export type ImageAnalysis = imageAnalysis
export type ImageProcessingResult = imageProcessingResult
export type BatchStatistics = batchStatistics
export type ProcessingSettings = processingSettings
export type ProcessingBatch = processingBatch
export type ImageTemplate = imageTemplate
export type ImageError = imageError
export type ImageValidation = imageValidation
