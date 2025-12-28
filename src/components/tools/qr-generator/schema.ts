// ==================== QR Generator Types ====================

/**
 * QR Content Type type
 */
export type qrContentType = "text" | "url" | "email" | "phone" | "sms" | "wifi" | "vcard" | "event" | "location" | "payment"

/**
 * QR Format type
 */
export type qrFormat = "png" | "svg" | "jpeg" | "webp"

/**
 * Error Correction Level type
 */
export type errorCorrectionLevel = "L" | "M" | "Q" | "H"

/**
 * Export Format type
 */
export type exportFormat = "png" | "svg" | "pdf" | "zip"

/**
 * QR Capacity type
 */
export interface qrCapacity {
  numeric: number,
  alphanumeric: number,
  binary: number,
  kanji: number,
}

/**
 * QR Readability type
 */
export interface qrReadability {
  contrastRatio: number,
  moduleSize: number,
  quietZone: number,
  readabilityScore: number,
  scanDistance: string,
  lightingConditions: string[],
}

/**
 * QR Optimization type
 */
export interface qrOptimization {
  dataEfficiency: number,
  sizeOptimization: number,
  errorCorrectionUtilization: number,
  versionOptimality: number,
  overallOptimization: number,
}

/**
 * QR Compatibility type
 */
export interface qrCompatibility {
  readerCompatibility: string[],
  deviceCompatibility: string[],
  softwareCompatibility: string[],
  standardsCompliance: string[],
  limitations: string[],
}

/**
 * QR Security type
 */
export interface qrSecurity {
  dataExposure: "low"| "medium" | "high",
  tampering_resistance: "low"| "medium" | "high",
  privacy_level: "low"| "medium" | "high",
  security_score: number,
  vulnerabilities: string[],
  recommendations: string[],
}

/**
 * QR Metadata type
 */
export interface qrMetadata {
  version: number,
  modules: number,
  capacity: qrCapacity,
  actualSize: number,
  errorCorrectionPercentage: number,
  dataType: string,
  encoding: string,
  compressionRatio: number,
  qualityScore: number,
}

/**
 * QR Customization type
 */
export interface qrCustomization {
  cornerStyle: "square"| "rounded" | "circle",
  moduleStyle: "square"| "rounded" | "circle" | "diamond",
  gradientEnabled: boolean
  gradientColors?: string[]
  patternEnabled: boolean
  patternType?: "dots"| "lines" | "squares"
  borderEnabled: boolean
  borderWidth?: number
  borderColor?: string
}

/**
 * QR Settings type
 */
export interface qrSettings {
  content: string,
  type: qrContentType,
  format: qrFormat,
  size: number,
  errorCorrection: errorCorrectionLevel,
  margin: number,
  foregroundColor: string,
  backgroundColor: string
  logoUrl?: string
  logoSize?: number
  customization: qrCustomization,
}

/**
 * QR Analysis type
 */
export interface qrAnalysis {
  readability: qrReadability,
  optimization: qrOptimization,
  compatibility: qrCompatibility,
  security: qrSecurity,
  recommendations: string[],
  warnings: string[],
}

/**
 * QR Code Result type
 */
export interface qrCodeResult {
  id: string,
  content: string,
  type: qrContentType,
  format: qrFormat,
  size: number,
  errorCorrection: errorCorrectionLevel
  dataUrl?: string
  svgString?: string
  isValid: boolean
  error?: string
  metadata?: qrMetadata
  analysis?: qrAnalysis
  settings: qrSettings,
  createdAt: Date,
}

/**
 * Batch Settings type
 */
export interface batchSettings {
  baseSettings: qrSettings,
  contentList: string[],
  namingPattern: string,
  exportFormat: exportFormat,
  includeAnalysis: boolean,
  optimizeForBatch: boolean,
}

/**
 * Batch Statistics type
 */
export interface batchStatistics {
  totalGenerated: number,
  successfulGenerated: number,
  failedGenerated: number,
  averageSize: number,
  averageQuality: number,
  totalProcessingTime: number,
  averageProcessingTime: number,
  sizeDistribution: Record<string, number>,
  typeDistribution: Record<string, number>,
}

/**
 * QR Batch type
 */
export interface qrBatch {
  id: string,
  name: string,
  qrCodes: qrCodeResult[],
  settings: batchSettings,
  status: "pending"| "processing" | "completed" | "failed",
  progress: number,
  statistics: batchStatistics,
  createdAt: Date
  completedAt?: Date
}

/**
 * QR Error type
 */
export interface qrError {
  message: string,
  type: "content"| "size" | "format" | "settings" | "capacity",
  severity: "error"| "warning" | "info",
}

/**
 * QR Validation type
 */
export interface qrValidation {
  isValid: boolean,
  errors: qrError[],
  warnings: string[],
  suggestions: string[]
  estimatedSize?: number
  recommendedSettings?: qrSettings
}

/**
 * QR Template type
 */
export interface qrTemplate {
  id: string,
  name: string,
  description: string,
  category: string,
  type: qrContentType,
  settings: qrSettings,
  useCase: string[],
  examples: string[]
  preview?: string
}

// ==================== Type Exports ====================

/**
 * Type definitions
 */
export type QRContentType = qrContentType
export type QRFormat = qrFormat
export type ErrorCorrectionLevel = errorCorrectionLevel
export type ExportFormat = exportFormat
export type QRCapacity = qrCapacity
export type QRReadability = qrReadability
export type QROptimization = qrOptimization
export type QRCompatibility = qrCompatibility
export type QRSecurity = qrSecurity
export type QRMetadata = qrMetadata
export type QRCustomization = qrCustomization
export type QRSettings = qrSettings
export type QRAnalysis = qrAnalysis
export type QRCodeResult = qrCodeResult
export type BatchSettings = batchSettings
export type BatchStatistics = batchStatistics
export type QRBatch = qrBatch
export type QRError = qrError
export type QRValidation = qrValidation
export type QRTemplate = qrTemplate
export type QrContentType = qrContentType
export type QrFormat = qrFormat
export type QrCapacity = qrCapacity
export type QrReadability = qrReadability
export type QrOptimization = qrOptimization
export type QrCompatibility = qrCompatibility
export type QrSecurity = qrSecurity
export type QrMetadata = qrMetadata
export type QrCustomization = qrCustomization
export type QrSettings = qrSettings
export type QrAnalysis = qrAnalysis
export type QrCodeResult = qrCodeResult
export type QrBatch = qrBatch
export type QrError = qrError
export type QrValidation = qrValidation
export type QrTemplate = qrTemplate
