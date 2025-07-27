export type DataExposure = 'low' | 'medium' | 'high'

// Enhanced Types
export interface BarcodeResult {
  id: string
  content: string
  format: BarcodeFormat
  width: number
  height: number
  displayValue: boolean
  backgroundColor: string
  lineColor: string
  fontSize: number
  fontFamily: string
  textAlign: 'left' | 'center' | 'right'
  textPosition: 'top' | 'bottom'
  textMargin: number
  margin: number
  dataUrl?: string
  svgString?: string
  isValid: boolean
  error?: string
  metadata?: BarcodeMetadata
  analysis?: BarcodeAnalysis
  settings: BarcodeSettings
  createdAt: Date
}

export interface BarcodeMetadata {
  format: BarcodeFormat
  capacity: BarcodeCapacity
  actualSize: { width: number; height: number }
  dataLength: number
  checksum?: string
  encoding: string
  compressionRatio: number
  qualityScore: number
  readabilityScore: number
}

export interface BarcodeCapacity {
  numeric: number
  alphanumeric: number
  binary: number
  maxLength: number
  minLength: number
}

export interface BarcodeAnalysis {
  readability: BarcodeReadability
  optimization: BarcodeOptimization
  compatibility: BarcodeCompatibility
  security: BarcodeSecurity
  recommendations: string[]
  warnings: string[]
}

export interface BarcodeReadability {
  contrastRatio: number
  barWidth: number
  quietZone: number
  aspectRatio: number
  readabilityScore: number
  scanDistance: string
  lightingConditions: string[]
  printQuality: DataExposure
}

export interface BarcodeOptimization {
  dataEfficiency: number
  sizeOptimization: number
  printOptimization: number
  scanOptimization: number
  overallOptimization: number
}

export interface BarcodeCompatibility {
  scannerCompatibility: string[]
  industryStandards: string[]
  printCompatibility: string[]
  softwareCompatibility: string[]
  limitations: string[]
}

export interface BarcodeSecurity {
  dataExposure: DataExposure
  tampering_resistance: DataExposure
  privacy_level: DataExposure
  security_score: number
  vulnerabilities: string[]
  recommendations: string[]
}

export interface BarcodeSettings {
  content: string
  format: BarcodeFormat
  width: number
  height: number
  displayValue: boolean
  backgroundColor: string
  lineColor: string
  fontSize: number
  fontFamily: string
  textAlign: 'left' | 'center' | 'right'
  textPosition: 'top' | 'bottom'
  textMargin: number
  margin: number
  customization: BarcodeCustomization
}

export interface BarcodeCustomization {
  showBorder: boolean
  borderWidth: number
  borderColor: string
  showQuietZone: boolean
  quietZoneSize: number
  customFont: boolean
  fontWeight: 'normal' | 'bold'
  textCase: 'none' | 'uppercase' | 'lowercase'
}

export interface BarcodeBatch {
  id: string
  name: string
  barcodes: BarcodeResult[]
  settings: BatchSettings
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  statistics: BatchStatistics
  createdAt: Date
  completedAt?: Date
}

export interface BatchSettings {
  baseSettings: BarcodeSettings
  contentList: string[]
  namingPattern: string
  exportFormat: ExportFormat
  includeAnalysis: boolean
  optimizeForBatch: boolean
}

export interface BatchStatistics {
  totalGenerated: number
  successfulGenerated: number
  failedGenerated: number
  averageSize: number
  averageQuality: number
  totalProcessingTime: number
  averageProcessingTime: number
  sizeDistribution: Record<string, number>
  formatDistribution: Record<string, number>
}

export interface BarcodeTemplate {
  id: string
  name: string
  description: string
  category: string
  format: BarcodeFormat
  settings: Partial<BarcodeSettings>
  useCase: string[]
  examples: string[]
  preview?: string
}

export interface BarcodeValidation {
  isValid: boolean
  errors: BarcodeError[]
  warnings: string[]
  suggestions: string[]
  estimatedSize?: { width: number; height: number }
  recommendedSettings?: Partial<BarcodeSettings>
}

export interface BarcodeError {
  message: string
  type: 'content' | 'format' | 'size' | 'settings' | 'compatibility'
  severity: 'error' | 'warning' | 'info'
}

// Enums
export type BarcodeFormat =
  | 'CODE128'
  | 'EAN13'
  | 'EAN8'
  | 'UPC'
  | 'CODE39'
  | 'ITF14'
  | 'MSI'
  | 'pharmacode'
  | 'codabar'
  | 'CODE93'
export type ExportFormat = 'png' | 'svg' | 'pdf' | 'zip'
