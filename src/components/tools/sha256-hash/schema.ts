// ==================== SHA-256 Hash Types ====================

/**
 * Hash Algorithm type
 */
export type hashAlgorithm = "SHA-256" | "SHA-1" | "SHA-384" | "SHA-512" | "MD5" | "SHA-3"

/**
 * Output Format type
 */
export type outputFormat = "hex" | "base64" | "binary"

/**
 * Export Format type
 */
export type exportFormat = "json" | "csv" | "txt" | "xml"

/**
 * Hash Content type
 */
export interface hashContent {
  content: string | ArrayBuffer,
  size: number,
  type: "text"| "file",
  encoding: string,
}

/**
 * Hash Result type
 */
export interface hashResult {
  algorithm: hashAlgorithm,
  hash: string,
  processingTime: number
  verified?: boolean
}

/**
 * Hash Statistics type
 */
export interface hashStatistics {
  totalHashes: number,
  algorithmDistribution: Record<string, number>,
  averageProcessingTime: number,
  totalProcessingTime: number,
  collisionCount: number,
  verificationCount: number,
  successRate: number,
}

/**
 * Hash Settings type
 */
export interface hashSettings {
  algorithms: hashAlgorithm[],
  outputFormat: outputFormat,
  includeTimestamp: boolean,
  enableVerification: boolean,
  batchProcessing: boolean,
  realTimeHashing: boolean,
  exportFormat: exportFormat,
}

/**
 * Hash Data type
 */
export interface hashData {
  original: hashContent,
  hashes: hashResult[],
  statistics: hashStatistics,
  settings: hashSettings,
}

/**
 * Hash File type
 */
export interface hashFile {
  id: string,
  name: string,
  content: string | ArrayBuffer,
  size: number,
  type: string,
  status: "pending"| "processing" | "completed" | "error"
  error?: string
  processedAt?: Date
  hashData?: hashData
}

/**
 * Hash Template type
 */
export interface hashTemplate {
  id: string,
  name: string,
  description: string,
  category: string,
  settings: hashSettings,
  algorithms: hashAlgorithm[],
}

// ==================== Type Exports ====================

export type HashAlgorithm = hashAlgorithm
export type OutputFormat = outputFormat
export type ExportFormat = exportFormat
export type HashContent = hashContent
export type HashResult = hashResult
export type HashStatistics = hashStatistics
export type HashSettings = hashSettings
export type HashData = hashData
export type HashFile = hashFile
export type HashTemplate = hashTemplate
