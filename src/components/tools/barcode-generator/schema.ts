// ==================== Barcode Generator Types ====================

/**
 * Data Exposure type
 */
export type dataExposure = "low" | "medium" | "high"

/**
 * Barcode Format type
 */
export type barcodeFormat = "CODE128" | "EAN13" | "EAN8" | "UPC" | "CODE39" | "ITF14" | "MSI" | "pharmacode" | "codabar" | "CODE93"

/**
 * Export Format type
 */
export type exportFormat = "png" | "svg" | "pdf" | "zip"

/**
 * Barcode Capacity type
 */
export interface barcodeCapacity {
  numeric: number,
  alphanumeric: number,
  binary: number,
  maxLength: number,
  minLength: number,
}

/**
 * Barcode Metadata type
 */
export interface barcodeMetadata {
  format: barcodeFormat,
  capacity: barcodeCapacity,
  actualSize: {
    width: number,
    height: number,
  },
  dataLength: number
  checksum?: string
  encoding: string,
  compressionRatio: number,
  qualityScore: number,
  readabilityScore: number,
}

/**
 * Barcode Readability type
 */
export interface barcodeReadability {
  contrastRatio: number,
  barWidth: number,
  quietZone: number,
  aspectRatio: number,
  readabilityScore: number,
  scanDistance: string,
  lightingConditions: string[],
  printQuality: dataExposure,
}

/**
 * Barcode Optimization type
 */
export interface barcodeOptimization {
  dataEfficiency: number,
  sizeOptimization: number,
  printOptimization: number,
  scanOptimization: number,
  overallOptimization: number,
}

/**
 * Barcode Compatibility type
 */
export interface barcodeCompatibility {
  scannerCompatibility: string[],
  industryStandards: string[],
  printCompatibility: string[],
  softwareCompatibility: string[],
  limitations: string[],
}

/**
 * Barcode Security type
 */
export interface barcodeSecurity {
  dataExposure: dataExposure,
  tampering_resistance: dataExposure,
  privacy_level: dataExposure,
  security_score: number,
  vulnerabilities: string[],
  recommendations: string[],
}

/**
 * Barcode Analysis type
 */
export interface barcodeAnalysis {
  readability: barcodeReadability,
  optimization: barcodeOptimization,
  compatibility: barcodeCompatibility,
  security: barcodeSecurity,
  recommendations: string[],
  warnings: string[],
}

/**
 * Barcode Customization type
 */
export interface barcodeCustomization {
  showBorder: boolean,
  borderWidth: number,
  borderColor: string,
  showQuietZone: boolean,
  quietZoneSize: number,
  customFont: boolean,
  fontWeight: "normal" | "bold",
  textCase: "none" | "uppercase" | "lowercase",
}

/**
 * Barcode Settings type
 */
export interface barcodeSettings {
  content: string,
  format: barcodeFormat,
  width: number,
  height: number,
  displayValue: boolean,
  backgroundColor: string,
  lineColor: string,
  fontSize: number,
  fontFamily: string,
  textAlign: "left" | "center" | "right",
  textPosition: "top" | "bottom",
  textMargin: number,
  margin: number,
  customization: barcodeCustomization,
}

/**
 * Barcode Result type
 */
export interface barcodeResult {
  id: string,
  content: string,
  format: barcodeFormat,
  width: number,
  height: number,
  displayValue: boolean,
  backgroundColor: string,
  lineColor: string,
  fontSize: number,
  fontFamily: string,
  textAlign: "left" | "center" | "right",
  textPosition: "top" | "bottom",
  textMargin: number,
  margin: number
  dataUrl?: string
  svgString?: string
  isValid: boolean
  error?: string
  metadata?: barcodeMetadata
  analysis?: barcodeAnalysis
  settings: barcodeSettings,
  createdAt: Date,
}

/**
 * Batch Settings type
 */
export interface batchSettings {
  baseSettings: barcodeSettings,
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
  formatDistribution: Record<string, number>,
}

/**
 * Barcode Batch type
 */
export interface barcodeBatch {
  id: string,
  name: string,
  barcodes: barcodeResult[],
  settings: batchSettings,
  status: "pending" | "processing" | "completed" | "failed",
  progress: number,
  statistics: batchStatistics,
  createdAt: Date
  completedAt?: Date
}

/**
 * Barcode Template type
 */
export interface barcodeTemplate {
  id: string,
  name: string,
  description: string,
  category: string,
  format: barcodeFormat,
  settings: barcodeSettings,
  useCase: string[],
  examples: string[]
  preview?: string
}

/**
 * Barcode Error type
 */
export interface barcodeError {
  message: string,
  type: "content" | "format" | "size" | "settings" | "compatibility",
  severity: "error" | "warning" | "info",
}

/**
 * Barcode Validation type
 */
export interface barcodeValidation {
  isValid: boolean,
  errors: barcodeError[],
  warnings: string[],
  suggestions: string[],
  estimatedSize: number,
  width: number,
  height: number
  recommendedSettings?: barcodeSettings
}

// ==================== Type Exports ====================

export type DataExposure = dataExposure
export type BarcodeFormat = barcodeFormat
export type ExportFormat = exportFormat
export type BarcodeCapacity = barcodeCapacity
export type BarcodeMetadata = barcodeMetadata
export type BarcodeReadability = barcodeReadability
export type BarcodeOptimization = barcodeOptimization
export type BarcodeCompatibility = barcodeCompatibility
export type BarcodeSecurity = barcodeSecurity
export type BarcodeAnalysis = barcodeAnalysis
export type BarcodeCustomization = barcodeCustomization
export type BarcodeSettings = barcodeSettings
export type BarcodeResult = barcodeResult
export type BatchSettings = batchSettings
export type BatchStatistics = batchStatistics
export type BarcodeBatch = barcodeBatch
export type BarcodeTemplate = barcodeTemplate
export type BarcodeError = barcodeError
export type BarcodeValidation = barcodeValidation
