// ==================== Password Generator Types ====================

/**
 * Password Type type
 */
export type passwordType = "random" | "memorable" | "pin" | "passphrase" | "custom" | "pronounceable"

/**
 * Security Level type
 */
export type securityLevel = "low" | "medium" | "high" | "very-high" | "maximum"

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
  weight: number,
}

/**
 * Password Strength type
 */
export interface passwordStrength {
  score: number,
  level: "weak"| "fair" | "good" | "strong" | "very_strong" | "very-weak" | "very-strong",
  feedback: string[],
  requirements: passwordRequirement[],
  entropy: number,
  timeToCrack: string,
}

/**
 * Password Settings type
 */
export interface passwordSettings {
  length: number,
  includeUppercase: boolean,
  includeLowercase: boolean,
  includeNumbers: boolean,
  includeSymbols: boolean,
  excludeSimilar: boolean,
  excludeAmbiguous: boolean,
  customCharacters: string,
  pattern: string,
  wordCount: number,
  separator: string,
  minLength: number,
  maxLength: number,
}

/**
 * Password Item type
 */
export interface passwordItem {
  id: string,
  password: string,
  type: passwordType,
  strength: passwordStrength,
  entropy: number,
  createdAt: Date,
  settings: passwordSettings,
}

/**
 * Password Template type
 */
export interface passwordTemplate {
  id: string,
  name: string,
  description: string,
  category: string,
  settings: passwordSettings,
  type: passwordType,
  securityLevel: securityLevel,
}

/**
 * Pattern Analysis type
 */
export interface patternAnalysis {
  commonPatterns: string[],
  uniqueCharacters: number,
  repetitionScore: number,
  sequenceScore: number,
  dictionaryScore: number,
}

/**
 * Password Statistics type
 */
export interface passwordStatistics {
  totalGenerated: number,
  averageStrength: number,
  averageEntropy: number,
  strengthDistribution: Record<string, number>,
  typeDistribution: Record<string, number>,
  characterDistribution: Record<string, number>,
  patternAnalysis: patternAnalysis,
}

/**
 * Password Batch type
 */
export interface passwordBatch {
  id: string,
  passwords: passwordItem[],
  count: number,
  type: passwordType,
  settings: passwordSettings,
  createdAt: Date,
  statistics: passwordStatistics,
}

/**
 * Password History type
 */
export interface passwordHistory {
  id: string,
  password: string,
  type: passwordType,
  strength: passwordStrength,
  createdAt: Date,
  used: boolean,
}

// ==================== Type Exports ====================

export type PasswordType = passwordType
export type SecurityLevel = securityLevel
export type ExportFormat = exportFormat
export type PasswordRequirement = passwordRequirement
export type PasswordStrength = passwordStrength
export type PasswordSettings = passwordSettings
export type PasswordItem = passwordItem
export type PasswordTemplate = passwordTemplate
export type PatternAnalysis = patternAnalysis
export type PasswordStatistics = passwordStatistics
export type PasswordBatch = passwordBatch
export type PasswordHistory = passwordHistory
