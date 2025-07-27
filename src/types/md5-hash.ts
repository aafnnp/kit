// MD5 Hash 相关类型声明
export interface HashFile {
  id: string
  name: string
  content: string | ArrayBuffer
  size: number
  type: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
  processedAt?: Date
  hashData?: HashData
}

export interface HashData {
  original: HashContent
  hashes: HashResult[]
  statistics: HashStatistics
  settings: HashSettings
}

export interface HashContent {
  content: string | ArrayBuffer
  size: number
  type: 'text' | 'file'
  encoding: string
}

export interface HashResult {
  algorithm: HashAlgorithm
  hash: string
  processingTime: number
  verified?: boolean
}

export interface HashStatistics {
  totalHashes: number
  algorithmDistribution: Record<string, number>
  averageProcessingTime: number
  totalProcessingTime: number
  collisionCount: number
  verificationCount: number
  successRate: number
}

export interface HashSettings {
  algorithms: HashAlgorithm[]
  outputFormat: OutputFormat
  includeTimestamp: boolean
  enableVerification: boolean
  batchProcessing: boolean
  realTimeHashing: boolean
  exportFormat: ExportFormat
}

export interface HashTemplate {
  id: string
  name: string
  description: string
  category: string
  settings: Partial<HashSettings>
  algorithms: HashAlgorithm[]
}

export type HashAlgorithm = 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-512' | 'SHA-384' | 'SHA-3'
export type OutputFormat = 'hex' | 'base64' | 'binary'
export type ExportFormat = 'json' | 'csv' | 'txt' | 'xml'
