// 所有类型声明均从 uuid-generator.tsx 迁移
export interface UUIDResult {
  id: string
  value: string
  type: UUIDType
  version?: number
  variant?: string
  timestamp?: Date
  isValid: boolean
  error?: string
  metadata?: UUIDMetadata
  analysis?: UUIDAnalysis
  createdAt: Date
}

export interface UUIDMetadata {
  length: number
  format: string
  encoding: string
  entropy: number
  randomness: number
  collision_probability: number
  security_level: 'low' | 'medium' | 'high' | 'very_high'
  use_cases: string[]
  standards_compliance: string[]
}

export interface UUIDAnalysis {
  structure: UUIDStructure
  security: UUIDSecurity
  quality: UUIDQuality
  compatibility: UUIDCompatibility
  recommendations: string[]
  warnings: string[]
}

export interface UUIDStructure {
  segments: string[]
  separators: string[]
  character_set: string
  case_format: 'uppercase' | 'lowercase' | 'mixed'
  has_hyphens: boolean
  has_braces: boolean
  total_length: number
  data_length: number
}

export interface UUIDSecurity {
  predictability: 'low' | 'medium' | 'high'
  entropy_bits: number
  cryptographic_strength: 'weak' | 'moderate' | 'strong' | 'very_strong'
  timing_attack_resistant: boolean
  collision_resistance: 'low' | 'medium' | 'high' | 'very_high'
  security_score: number
}

export interface UUIDQuality {
  uniqueness_score: number
  randomness_score: number
  format_compliance: number
  readability_score: number
  overall_quality: number
  issues: string[]
  strengths: string[]
}

export interface UUIDCompatibility {
  database_systems: string[]
  programming_languages: string[]
  web_standards: string[]
  api_compatibility: string[]
  limitations: string[]
}

export interface GenerationBatch {
  id: string
  uuids: UUIDResult[]
  count: number
  type: UUIDType
  settings: GenerationSettings
  createdAt: Date
  statistics: BatchStatistics
}

export interface BatchStatistics {
  totalGenerated: number
  uniqueCount: number
  duplicateCount: number
  averageEntropy: number
  averageQuality: number
  generationTime: number
  collisionRate: number
  securityDistribution: Record<string, number>
}

export interface GenerationSettings {
  type: UUIDType
  count: number
  format: UUIDFormat
  case: 'uppercase' | 'lowercase'
  includeBraces: boolean
  includeHyphens: boolean
  customLength?: number
  customAlphabet?: string
  prefix?: string
  suffix?: string
  exportFormat: ExportFormat
}

export interface UUIDTemplate {
  id: string
  name: string
  description: string
  category: string
  type: UUIDType
  settings: Partial<GenerationSettings>
  useCase: string[]
  examples: string[]
}

export interface UUIDValidation {
  isValid: boolean
  errors: UUIDError[]
  warnings: string[]
  suggestions: string[]
  detectedType?: UUIDType
}

export interface UUIDError {
  message: string
  type: 'format' | 'length' | 'character' | 'structure' | 'version'
  severity: 'error' | 'warning' | 'info'
}

// Enums
export type UUIDType = 'uuid_v1' | 'uuid_v4' | 'uuid_v5' | 'nanoid' | 'ulid' | 'cuid' | 'short_uuid' | 'custom'
export type UUIDFormat = 'standard' | 'compact' | 'braced' | 'urn' | 'base64' | 'hex'
export type ExportFormat = 'txt' | 'json' | 'csv' | 'xml'
