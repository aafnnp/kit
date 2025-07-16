// Enhanced Types
export interface ImageProcessingResult {
  id: string
  input: string
  output: string
  direction: ConversionDirection
  isValid: boolean
  error?: string
  statistics: ImageStatistics
  analysis?: ImageAnalysis
  createdAt: Date
}

export interface ImageStatistics {
  inputSize: number
  outputSize: number
  compressionRatio: number
  processingTime: number
  imageMetadata: ImageMetadata
  qualityMetrics: QualityMetrics
}

export interface ImageMetadata {
  width: number
  height: number
  format: string
  mimeType: string
  aspectRatio: number
  pixelCount: number
  estimatedColors: number
  hasTransparency: boolean
}

export interface QualityMetrics {
  resolution: string
  sizeCategory: string
  compressionEfficiency: number
  dataUrlOverhead: number
  base64Efficiency: number
}

export interface ImageAnalysis {
  isValidImage: boolean
  hasDataUrlPrefix: boolean
  isOptimized: boolean
  suggestedImprovements: string[]
  imageIssues: string[]
  qualityScore: number
  formatRecommendations: string[]
}

export interface ProcessingBatch {
  id: string
  results: ImageProcessingResult[]
  count: number
  settings: ProcessingSettings
  createdAt: Date
  statistics: BatchStatistics
}

export interface BatchStatistics {
  totalProcessed: number
  validCount: number
  invalidCount: number
  averageQuality: number
  totalInputSize: number
  totalOutputSize: number
  successRate: number
}

export interface ProcessingSettings {
  outputFormat: ImageFormat
  quality: number
  maxWidth: number
  maxHeight: number
  includeDataUrlPrefix: boolean
  realTimeProcessing: boolean
  exportFormat: ExportFormat
  compressionLevel: number
  preserveMetadata: boolean
  autoOptimize: boolean
}

export interface ImageTemplate {
  id: string
  name: string
  description: string
  category: string
  base64Example: string
  imageInfo: string
  useCase: string[]
}

export interface ImageValidation {
  isValid: boolean
  errors: ImageError[]
  warnings: string[]
  suggestions: string[]
}

export interface ImageError {
  message: string
  type: 'format' | 'size' | 'encoding' | 'corruption'
  details?: string
}

// Enums
export type ConversionDirection = 'image-to-base64' | 'base64-to-image'
export type ImageFormat = 'jpeg' | 'png' | 'webp' | 'gif' | 'bmp'
export type ExportFormat = 'base64' | 'dataurl' | 'json' | 'txt'
