// ==================== Bcrypt Hash Types ====================

/**
 * Security Level type
 */
export type securityLevel = "low" | "medium" | "high" | "very-high"

/**
 * Export Format type
 */
export type exportFormat = "json" | "csv" | "txt" | "xml"

/**
 * Password Requirement type
 */
export interface passwordRequirement {
  name: string,
  met: boolean,
  description: string,
}

/**
 * Password Strength type
 */
export interface passwordStrength {
  score: number,
  level: "very-weak" | "weak" | "fair" | "good" | "strong",
  feedback: string[],
  requirements: passwordRequirement[],
}

/**
 * Bcrypt Content type
 */
export interface bcryptContent {
  content: string,
  size: number,
  type: "password" | "text"
  strength?: passwordStrength
}

/**
 * Bcrypt Result type
 */
export interface bcryptResult {
  saltRounds: number,
  hash: string,
  salt: string,
  processingTime: number
  verified?: boolean
  securityLevel: securityLevel,
}

/**
 * Bcrypt Statistics type
 */
export interface bcryptStatistics {
  totalHashes: number,
  saltRoundDistribution: Record<string, number>,
  averageProcessingTime: number,
  totalProcessingTime: number,
  verificationCount: number,
  successRate: number,
  securityScore: number,
}

/**
 * Bcrypt Settings type
 */
export interface bcryptSettings {
  saltRounds: number[],
  includeTimestamp: boolean,
  enableVerification: boolean,
  batchProcessing: boolean,
  realTimeHashing: boolean,
  exportFormat: exportFormat,
  showPasswords: boolean,
  passwordStrengthCheck: boolean,
}

/**
 * Bcrypt Data type
 */
export interface bcryptData {
  original: bcryptContent,
  hashes: bcryptResult[],
  statistics: bcryptStatistics,
  settings: bcryptSettings,
}

/**
 * Bcrypt File type
 */
export interface bcryptFile {
  id: string,
  name: string,
  content: string,
  size: number,
  type: string,
  status: "pending" | "processing" | "completed" | "error"
  error?: string
  processedAt?: Date
  bcryptData?: bcryptData
}

/**
 * Bcrypt Template type
 */
export interface bcryptTemplate {
  id: string,
  name: string,
  description: string,
  category: string,
  settings: bcryptSettings,
  saltRounds: number[],
  securityLevel: securityLevel,
}

/**
 * Bcrypt Verification type
 */
export interface bcryptVerification {
  id: string,
  password: string,
  hash: string,
  isValid: boolean,
  processingTime: number,
}

// ==================== Type Exports ====================

export type SecurityLevel = securityLevel
export type ExportFormat = exportFormat
export type PasswordRequirement = passwordRequirement
export type PasswordStrength = passwordStrength
export type BcryptContent = bcryptContent
export type BcryptResult = bcryptResult
export type BcryptStatistics = bcryptStatistics
export type BcryptSettings = bcryptSettings
export type BcryptData = bcryptData
export type BcryptFile = bcryptFile
export type BcryptTemplate = bcryptTemplate
export type BcryptVerification = bcryptVerification
