// ==================== UUID Generator Types ====================

/**
 * UUID Type type
 */
export type uuidType = "uuid_v1" | "uuid_v4" | "uuid_v5" | "nanoid" | "ulid" | "cuid" | "short_uuid" | "custom"

/**
 * UUID Format type
 */
export type uuidFormat = "standard" | "compact" | "braced" | "urn" | "base64" | "hex"

/**
 * Export Format type
 */
export type exportFormat = "txt" | "json" | "csv" | "xml"

/**
 * UUID Structure type
 */
export interface uuidStructure {
  segments: string[],
  separators: string[],
  character_set: string,
  case_format: "uppercase"| "lowercase" | "mixed",
  has_hyphens: boolean,
  has_braces: boolean,
  total_length: number,
  data_length: number,
}

/**
 * UUID Security type
 */
export interface uuidSecurity {
  predictability: "low"| "medium" | "high",
  entropy_bits: number,
  cryptographic_strength: "weak"| "moderate" | "strong" | "very_strong",
  timing_attack_resistant: boolean,
  collision_resistance: "low"| "medium" | "high" | "very_high",
  security_score: number,
}

/**
 * UUID Quality type
 */
export interface uuidQuality {
  uniqueness_score: number,
  randomness_score: number,
  format_compliance: number,
  readability_score: number,
  overall_quality: number,
  issues: string[],
  strengths: string[],
}

/**
 * UUID Compatibility type
 */
export interface uuidCompatibility {
  database_systems: string[],
  programming_languages: string[],
  web_standards: string[],
  api_compatibility: string[],
  limitations: string[],
}

/**
 * UUID Analysis type
 */
export interface uuidAnalysis {
  structure: uuidStructure,
  security: uuidSecurity,
  quality: uuidQuality,
  compatibility: uuidCompatibility,
  recommendations: string[],
  warnings: string[],
}

/**
 * UUID Metadata type
 */
export interface uuidMetadata {
  length: number,
  format: string,
  encoding: string,
  entropy: number,
  randomness: number,
  collision_probability: number,
  security_level: "low"| "medium" | "high" | "very_high",
  use_cases: string[],
  standards_compliance: string[],
}

/**
 * UUID Result type
 */
export interface uuidResult {
  id: string,
  value: string,
  type: uuidType
  version?: number
  variant?: string
  timestamp?: Date
  isValid: boolean
  "error"?: string
  metadata?: uuidMetadata
  analysis?: uuidAnalysis
  createdAt: Date,
}

/**
 * Batch Statistics type
 */
export interface batchStatistics {
  totalGenerated: number,
  uniqueCount: number,
  duplicateCount: number,
  averageEntropy: number,
  averageQuality: number,
  generationTime: number,
  collisionRate: number,
  securityDistribution: Record<string, number>,
}

/**
 * Generation Settings type
 */
export interface generationSettings {
  type: uuidType,
  count: number,
  format: uuidFormat,
  case: "uppercase"| "lowercase",
  includeBraces: boolean,
  includeHyphens: boolean
  customLength?: number
  customAlphabet?: string
  prefix?: string
  suffix?: string
  exportFormat: exportFormat,
}

/**
 * Generation Batch type
 */
export interface generationBatch {
  id: string,
  uuids: uuidResult[],
  count: number,
  type: uuidType,
  settings: generationSettings,
  createdAt: Date,
  statistics: batchStatistics,
}

/**
 * UUID Error type
 */
export interface uuidError {
  message: string,
  type: "format"| "length" | "character" | "structure" | "version",
  severity: "error"| "warning" | "info",
}

/**
 * UUID Validation type
 */
export interface uuidValidation {
  isValid: boolean,
  errors: uuidError[],
  warnings: string[],
  suggestions: string[]
  detectedType?: uuidType
}

/**
 * UUID Template type
 */
export interface uuidTemplate {
  id: string,
  name: string,
  description: string,
  category: string,
  type: uuidType,
  settings: generationSettings,
  useCase: string[],
  examples: string[],
}

// ==================== Type Exports ====================

/**
 * Type definitions
 */
export type UUIDType = uuidType
export type UUIDFormat = uuidFormat
export type ExportFormat = exportFormat
export type UUIDStructure = uuidStructure
export type UUIDSecurity = uuidSecurity
export type UUIDQuality = uuidQuality
export type UUIDCompatibility = uuidCompatibility
export type UUIDAnalysis = uuidAnalysis
export type UUIDMetadata = uuidMetadata
export type UUIDResult = uuidResult
export type BatchStatistics = batchStatistics
export type GenerationSettings = generationSettings
export type GenerationBatch = generationBatch
export type UUIDError = uuidError
export type UUIDValidation = uuidValidation
export type UUIDTemplate = uuidTemplate
export type UuidType = uuidType
export type UuidFormat = uuidFormat
export type UuidStructure = uuidStructure
export type UuidSecurity = uuidSecurity
export type UuidQuality = uuidQuality
export type UuidCompatibility = uuidCompatibility
export type UuidAnalysis = uuidAnalysis
export type UuidMetadata = uuidMetadata
export type UuidResult = uuidResult
export type UuidError = uuidError
export type UuidValidation = uuidValidation
export type UuidTemplate = uuidTemplate
