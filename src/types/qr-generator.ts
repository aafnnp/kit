// QR Generator 相关类型声明
export interface QRCodeResult {
  id: string
  content: string
  type: QRContentType
  format: QRFormat
  size: number
  errorCorrection: ErrorCorrectionLevel
  dataUrl?: string
  svgString?: string
  isValid: boolean
  error?: string
  metadata?: QRMetadata
  analysis?: QRAnalysis
  settings: QRSettings
  createdAt: Date
}

export interface QRMetadata {
  version: number
  modules: number
  capacity: QRCapacity
  actualSize: number
  errorCorrectionPercentage: number
  dataType: string
  encoding: string
  compressionRatio: number
  qualityScore: number
}

export interface QRCapacity {
  numeric: number
  alphanumeric: number
  binary: number
  kanji: number
}

export interface QRAnalysis {
  readability: QRReadability
  optimization: QROptimization
  compatibility: QRCompatibility
  security: QRSecurity
  recommendations: string[]
  warnings: string[]
}

export interface QRReadability {
  contrastRatio: number
  moduleSize: number
  quietZone: number
  readabilityScore: number
  scanDistance: string
  lightingConditions: string[]
}

export interface QROptimization {
  dataEfficiency: number
  sizeOptimization: number
  errorCorrectionUtilization: number
  versionOptimality: number
  overallOptimization: number
}

export interface QRCompatibility {
  readerCompatibility: string[]
  deviceCompatibility: string[]
  softwareCompatibility: string[]
  standardsCompliance: string[]
  limitations: string[]
}

export interface QRSecurity {
  dataExposure: 'low' | 'medium' | 'high'
  tampering_resistance: 'low' | 'medium' | 'high'
  privacy_level: 'low' | 'medium' | 'high'
  security_score: number
  vulnerabilities: string[]
  recommendations: string[]
}

export interface QRSettings {
  content: string
  type: QRContentType
  format: QRFormat
  size: number
  errorCorrection: ErrorCorrectionLevel
  margin: number
  foregroundColor: string
  backgroundColor: string
  logoUrl?: string
  logoSize?: number
  customization: QRCustomization
}

export interface QRCustomization {
  cornerStyle: 'square' | 'rounded' | 'circle'
  moduleStyle: 'square' | 'rounded' | 'circle' | 'diamond'
  gradientEnabled: boolean
  gradientColors?: string[]
  patternEnabled: boolean
  patternType?: 'dots' | 'lines' | 'squares'
  borderEnabled: boolean
  borderWidth?: number
  borderColor?: string
}

export interface QRBatch {
  id: string
  name: string
  qrCodes: QRCodeResult[]
  settings: BatchSettings
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  statistics: BatchStatistics
  createdAt: Date
  completedAt?: Date
}

export interface BatchSettings {
  baseSettings: QRSettings
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
  typeDistribution: Record<string, number>
}

export interface QRTemplate {
  id: string
  name: string
  description: string
  category: string
  type: QRContentType
  settings: Partial<QRSettings>
  useCase: string[]
  examples: string[]
  preview?: string
}

export interface QRValidation {
  isValid: boolean
  errors: QRError[]
  warnings: string[]
  suggestions: string[]
  estimatedSize?: number
  recommendedSettings?: Partial<QRSettings>
}

export interface QRError {
  message: string
  type: 'content' | 'size' | 'format' | 'settings' | 'capacity'
  severity: 'error' | 'warning' | 'info'
}

export type QRContentType =
  | 'text'
  | 'url'
  | 'email'
  | 'phone'
  | 'sms'
  | 'wifi'
  | 'vcard'
  | 'event'
  | 'location'
  | 'payment'
export type QRFormat = 'png' | 'svg' | 'jpeg' | 'webp'
export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H'
export type ExportFormat = 'png' | 'svg' | 'pdf' | 'zip'
