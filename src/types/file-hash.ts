// File Hash 相关类型声明
export interface FileHashItem {
  id: string
  file: File
  name: string
  size: number
  type: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
  processedAt?: Date
  hashData?: FileHashData
  progress?: number
}

export interface FileHashData {
  original: FileContent
  hashes: HashResult[]
  statistics: FileHashStatistics
  settings: FileHashSettings
}

export interface FileContent {
  name: string
  size: number
  type: string
  lastModified: Date
  checksum?: string
}

export interface HashResult {
  algorithm: HashAlgorithm
  hash: string
  processingTime: number
  verified?: boolean
  chunks?: number
}

export interface FileHashStatistics {
  totalFiles: number
  totalSize: number
  algorithmDistribution: Record<string, number>
  averageProcessingTime: number
  totalProcessingTime: number
  verificationCount: number
  successRate: number
  integrityScore: number
  largestFile: number
  smallestFile: number
}

export interface FileHashSettings {
  algorithms: HashAlgorithm[]
  includeTimestamp: boolean
  enableVerification: boolean
  batchProcessing: boolean
  realTimeHashing: boolean
  exportFormat: ExportFormat
  chunkSize: number
  showProgress: boolean
  integrityCheck: boolean
}

export interface FileHashTemplate {
  id: string
  name: string
  description: string
  category: string
  settings: Partial<FileHashSettings>
  algorithms: HashAlgorithm[]
  securityLevel: SecurityLevel
}

export interface FileIntegrityCheck {
  id: string
  fileName: string
  expectedHash: string
  actualHash: string
  algorithm: HashAlgorithm
  isValid: boolean
  processingTime: number
}

export type HashAlgorithm = 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512'
export type SecurityLevel = 'low' | 'medium' | 'high' | 'very-high'
export type ExportFormat = 'json' | 'csv' | 'txt' | 'xml'
