// ==================== File Hash Types ====================

/**
 * Hash Algorithm type
 */
export type hashAlgorithm = "MD5" | "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512"

/**
 * Security Level type
 */
export type securityLevel = "low" | "medium" | "high" | "very-high"

/**
 * Export Format type
 */
export type exportFormat = "json" | "csv" | "txt" | "xml"

/**
 * File Content type
 */
export interface fileContent {
  name: string,
  size: number,
  type: string,
  lastModified: Date
  checksum?: string
}

/**
 * Hash Result type
 */
export interface hashResult {
  algorithm: hashAlgorithm,
  hash: string,
  processingTime: number
  verified?: boolean
  chunks?: number
}

/**
 * File Hash Statistics type
 */
export interface fileHashStatistics {
  totalFiles: number,
  totalSize: number,
  algorithmDistribution: Record<string, number>,
  averageProcessingTime: number,
  totalProcessingTime: number,
  verificationCount: number,
  successRate: number,
  integrityScore: number,
  largestFile: number,
  smallestFile: number,
}

/**
 * File Hash Settings type
 */
export interface fileHashSettings {
  algorithms: hashAlgorithm[],
  includeTimestamp: boolean,
  enableVerification: boolean,
  batchProcessing: boolean,
  realTimeHashing: boolean,
  exportFormat: exportFormat,
  chunkSize: number,
  showProgress: boolean,
  integrityCheck: boolean,
}

/**
 * File Hash Data type
 */
export interface fileHashData {
  original: fileContent,
  hashes: hashResult[],
  statistics: fileHashStatistics,
  settings: fileHashSettings,
}

/**
 * File Hash Item type
 */
export interface fileHashItem {
  id: string,
  file: File,
  name: string,
  size: number,
  type: string,
  status: "pending"| "processing" | "completed" | "error"
  error?: string
  processedAt?: Date
  hashData?: fileHashData
  progress?: number
}

/**
 * File Hash Template type
 */
export interface fileHashTemplate {
  id: string,
  name: string,
  description: string,
  category: string,
  settings: fileHashSettings,
  algorithms: hashAlgorithm[],
  securityLevel: securityLevel,
}

/**
 * File Integrity Check type
 */
export interface fileIntegrityCheck {
  id: string,
  fileName: string,
  expectedHash: string,
  actualHash: string,
  algorithm: hashAlgorithm,
  isValid: boolean,
  processingTime: number,
}

// ==================== Type Exports ====================

export type HashAlgorithm = hashAlgorithm
export type SecurityLevel = securityLevel
export type ExportFormat = exportFormat
export type FileContent = fileContent
export type HashResult = hashResult
export type FileHashStatistics = fileHashStatistics
export type FileHashSettings = fileHashSettings
export type FileHashData = fileHashData
export type FileHashItem = fileHashItem
export type FileHashTemplate = fileHashTemplate
export type FileIntegrityCheck = fileIntegrityCheck
