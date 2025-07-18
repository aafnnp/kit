// 所有类型声明均从 uuid-batch.tsx 迁移
export interface BatchUUID {
  id: string
  value: string
  type: UUIDType
  version?: number
  timestamp: Date
  isValid: boolean
  error?: string
  metadata?: UUIDMetadata
  analysis?: UUIDAnalysis
  selected: boolean
  index: number
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

export interface BatchOperation {
  id: string
  name: string
  type: UUIDType
  count: number
  settings: BatchSettings
  uuids: BatchUUID[]
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'paused'
  progress: number
  error?: string
  statistics: BatchStatistics
  createdAt: Date
  completedAt?: Date
}

export interface BatchStatistics {
  totalGenerated: number
  validCount: number
  invalidCount: number
  uniqueCount: number
  duplicateCount: number
  averageEntropy: number
  averageQuality: number
  averageSecurity: number
  generationTime: number
  collisionRate: number
  securityDistribution: Record<string, number>
  qualityDistribution: Record<string, number>
  lengthDistribution: Record<string, number>
}

export interface BatchSettings {
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
  batchSize: number
  enableAnalysis: boolean
  enableValidation: boolean
  enableDeduplication: boolean
  sortOrder: 'none' | 'alphabetical' | 'timestamp' | 'quality' | 'security'
  filterCriteria?: FilterCriteria
  exportFormat: ExportFormat
}

export interface FilterCriteria {
  minQuality?: number
  maxQuality?: number
  minSecurity?: number
  maxSecurity?: number
  minLength?: number
  maxLength?: number
  securityLevels?: string[]
  uuidTypes?: UUIDType[]
  validOnly?: boolean
}

export interface BatchTemplate {
  id: string
  name: string
  description: string
  category: string
  settings: Partial<BatchSettings>
  useCase: string[]
  examples: string[]
  estimatedTime: string
}

export interface BatchValidation {
  isValid: boolean
  errors: BatchError[]
  warnings: string[]
  suggestions: string[]
}

export interface BatchError {
  message: string
  type: 'count' | 'settings' | 'memory' | 'performance'
  severity: 'error' | 'warning' | 'info'
}

export type UUIDType = 'uuid_v1' | 'uuid_v4' | 'uuid_v5' | 'nanoid' | 'ulid' | 'cuid' | 'short_uuid' | 'custom'
export type UUIDFormat = 'standard' | 'compact' | 'braced' | 'urn' | 'base64' | 'hex'
export type ExportFormat = 'txt' | 'json' | 'csv' | 'xml'
export type ViewMode = 'grid' | 'list' | 'compact'
