// ==================== UUID Batch Types ====================

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
 * View Mode type
 */
export type viewMode = "grid" | "list" | "compact"

/**
 * Security Level type
 */
export type securityLevel = "low" | "medium" | "high" | "very_high"

/**
 * Case Format type
 */
export type caseFormat = "uppercase" | "lowercase" | "mixed"

/**
 * Predictability type
 */
export type predictability = "low" | "medium" | "high"

/**
 * Cryptographic Strength type
 */
export type cryptographicStrength = "weak" | "moderate" | "strong" | "very_strong"

/**
 * Collision Resistance type
 */
export type collisionResistance = "low" | "medium" | "high" | "very_high"

/**
 * UUID Structure type
 */
export interface uuidStructure {
  segments: string[],
  separators: string[],
  character_set: string,
  case_format: caseFormat,
  has_hyphens: boolean,
  has_braces: boolean,
  total_length: number,
  data_length: number,
}

/**
 * UUID Security type
 */
export interface uuidSecurity {
  predictability: predictability,
  entropy_bits: number,
  cryptographic_strength: cryptographicStrength,
  timing_attack_resistant: boolean,
  collision_resistance: collisionResistance,
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
  security_level: securityLevel,
  use_cases: string[],
  standards_compliance: string[],
}

/**
 * Batch UUID type
 */
export interface batchUuid {
  id: string,
  value: string,
  type: uuidType
  version?: number
  timestamp: Date,
  isValid: boolean
  error?: string
  metadata?: uuidMetadata
  analysis?: uuidAnalysis
  selected: boolean,
  index: number,
}

/**
 * Sort Order type
 */
export type sortOrder = "none" | "alphabetical" | "timestamp" | "quality" | "security"

/**
 * Filter Criteria type
 */
export interface filterCriteria {
  minQuality?: number
  maxQuality?: number
  minSecurity?: number
  maxSecurity?: number
  minLength?: number
  maxLength?: number
  securityLevels?: string[]
  uuidTypes?: uuidType[]
  validOnly?: boolean
}

/**
 * Batch Settings type
 */
export interface batchSettings {
  type: uuidType,
  count: number,
  format: uuidFormat,
  case: caseFormat,
  includeBraces: boolean,
  includeHyphens: boolean
  customLength?: number
  customAlphabet?: string
  prefix?: string
  suffix?: string
  batchSize: number,
  enableAnalysis: boolean,
  enableValidation: boolean,
  enableDeduplication: boolean,
  sortOrder: sortOrder
  filterCriteria?: filterCriteria
  exportFormat: exportFormat,
}

/**
 * Batch Statistics type
 */
export interface batchStatistics {
  totalGenerated: number,
  validCount: number,
  invalidCount: number,
  uniqueCount: number,
  duplicateCount: number,
  averageEntropy: number,
  averageQuality: number,
  averageSecurity: number,
  generationTime: number,
  collisionRate: number,
  securityDistribution: Record<string, number>,
  qualityDistribution: Record<string, number>,
  lengthDistribution: Record<string, number>,
}

/**
 * Batch Operation type
 */
export interface batchOperation {
  id: string,
  name: string,
  type: uuidType,
  count: number,
  settings: batchSettings,
  uuids: batchUuid[],
  status: "pending"| "processing" | "completed" | "failed" | "paused",
  progress: number
  error?: string
  statistics: batchStatistics,
  createdAt: Date
  completedAt?: Date
}

/**
 * Batch Template type
 */
export interface batchTemplate {
  id: string,
  name: string,
  description: string,
  category: string,
  settings: batchSettings,
  useCase: string[],
  examples: string[],
  estimatedTime: string,
}

/**
 * Batch Error type
 */
export interface batchError {
  message: string,
  type: "count"| "settings" | "memory" | "performance",
  severity: "error"| "warning" | "info",
}

/**
 * Batch Validation type
 */
export interface batchValidation {
  isValid: boolean,
  errors: batchError[],
  warnings: string[],
  suggestions: string[],
}

// ==================== Type Exports ====================

export type UUIDType = uuidType
export type UUIDFormat = uuidFormat
export type ExportFormat = exportFormat
export type ViewMode = viewMode
export type SecurityLevel = securityLevel
export type CaseFormat = caseFormat
export type Predictability = predictability
export type CryptographicStrength = cryptographicStrength
export type CollisionResistance = collisionResistance
export type UUIDStructure = uuidStructure
export type UUIDSecurity = uuidSecurity
export type UUIDQuality = uuidQuality
export type UUIDCompatibility = uuidCompatibility
export type UUIDAnalysis = uuidAnalysis
export type UUIDMetadata = uuidMetadata
export type BatchUUID = batchUuid
export type SortOrder = sortOrder
export type FilterCriteria = filterCriteria
export type BatchSettings = batchSettings
export type BatchStatistics = batchStatistics
export type BatchOperation = batchOperation
export type BatchTemplate = batchTemplate
export type BatchError = batchError
export type BatchValidation = batchValidation
export type UuidType = uuidType
export type UuidFormat = uuidFormat
export type UuidStructure = uuidStructure
export type UuidSecurity = uuidSecurity
export type UuidQuality = uuidQuality
export type UuidCompatibility = uuidCompatibility
export type UuidAnalysis = uuidAnalysis
export type UuidMetadata = uuidMetadata
export type BatchUuid = batchUuid
