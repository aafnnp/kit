import { z } from "zod"

// ==================== UUID Batch Schemas ====================

/**
 * UUID Type schema
 */
export const uuidTypeSchema = z.enum([
  "uuid_v1",
  "uuid_v4",
  "uuid_v5",
  "nanoid",
  "ulid",
  "cuid",
  "short_uuid",
  "custom",
])

/**
 * UUID Format schema
 */
export const uuidFormatSchema = z.enum(["standard", "compact", "braced", "urn", "base64", "hex"])

/**
 * Export Format schema
 */
export const exportFormatSchema = z.enum(["txt", "json", "csv", "xml"])

/**
 * View Mode schema
 */
export const viewModeSchema = z.enum(["grid", "list", "compact"])

/**
 * Security Level schema
 */
export const securityLevelSchema = z.enum(["low", "medium", "high", "very_high"])

/**
 * Case Format schema
 */
export const caseFormatSchema = z.enum(["uppercase", "lowercase", "mixed"])

/**
 * Predictability schema
 */
export const predictabilitySchema = z.enum(["low", "medium", "high"])

/**
 * Cryptographic Strength schema
 */
export const cryptographicStrengthSchema = z.enum(["weak", "moderate", "strong", "very_strong"])

/**
 * Collision Resistance schema
 */
export const collisionResistanceSchema = z.enum(["low", "medium", "high", "very_high"])

/**
 * UUID Structure schema
 */
export const uuidStructureSchema = z.object({
  segments: z.array(z.string()),
  separators: z.array(z.string()),
  character_set: z.string(),
  case_format: caseFormatSchema,
  has_hyphens: z.boolean(),
  has_braces: z.boolean(),
  total_length: z.number(),
  data_length: z.number(),
})

/**
 * UUID Security schema
 */
export const uuidSecuritySchema = z.object({
  predictability: predictabilitySchema,
  entropy_bits: z.number(),
  cryptographic_strength: cryptographicStrengthSchema,
  timing_attack_resistant: z.boolean(),
  collision_resistance: collisionResistanceSchema,
  security_score: z.number(),
})

/**
 * UUID Quality schema
 */
export const uuidQualitySchema = z.object({
  uniqueness_score: z.number(),
  randomness_score: z.number(),
  format_compliance: z.number(),
  readability_score: z.number(),
  overall_quality: z.number(),
  issues: z.array(z.string()),
  strengths: z.array(z.string()),
})

/**
 * UUID Compatibility schema
 */
export const uuidCompatibilitySchema = z.object({
  database_systems: z.array(z.string()),
  programming_languages: z.array(z.string()),
  web_standards: z.array(z.string()),
  api_compatibility: z.array(z.string()),
  limitations: z.array(z.string()),
})

/**
 * UUID Analysis schema
 */
export const uuidAnalysisSchema = z.object({
  structure: uuidStructureSchema,
  security: uuidSecuritySchema,
  quality: uuidQualitySchema,
  compatibility: uuidCompatibilitySchema,
  recommendations: z.array(z.string()),
  warnings: z.array(z.string()),
})

/**
 * UUID Metadata schema
 */
export const uuidMetadataSchema = z.object({
  length: z.number(),
  format: z.string(),
  encoding: z.string(),
  entropy: z.number(),
  randomness: z.number(),
  collision_probability: z.number(),
  security_level: securityLevelSchema,
  use_cases: z.array(z.string()),
  standards_compliance: z.array(z.string()),
})

/**
 * Batch UUID schema
 */
export const batchUuidSchema = z.object({
  id: z.string(),
  value: z.string(),
  type: uuidTypeSchema,
  version: z.number().optional(),
  timestamp: z.date(),
  isValid: z.boolean(),
  error: z.string().optional(),
  metadata: uuidMetadataSchema.optional(),
  analysis: uuidAnalysisSchema.optional(),
  selected: z.boolean(),
  index: z.number(),
})

/**
 * Sort Order schema
 */
export const sortOrderSchema = z.enum(["none", "alphabetical", "timestamp", "quality", "security"])

/**
 * Filter Criteria schema
 */
export const filterCriteriaSchema = z.object({
  minQuality: z.number().optional(),
  maxQuality: z.number().optional(),
  minSecurity: z.number().optional(),
  maxSecurity: z.number().optional(),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  securityLevels: z.array(z.string()).optional(),
  uuidTypes: z.array(uuidTypeSchema).optional(),
  validOnly: z.boolean().optional(),
})

/**
 * Batch Settings schema
 */
export const batchSettingsSchema = z.object({
  type: uuidTypeSchema,
  count: z.number(),
  format: uuidFormatSchema,
  case: caseFormatSchema,
  includeBraces: z.boolean(),
  includeHyphens: z.boolean(),
  customLength: z.number().optional(),
  customAlphabet: z.string().optional(),
  prefix: z.string().optional(),
  suffix: z.string().optional(),
  batchSize: z.number(),
  enableAnalysis: z.boolean(),
  enableValidation: z.boolean(),
  enableDeduplication: z.boolean(),
  sortOrder: sortOrderSchema,
  filterCriteria: filterCriteriaSchema.optional(),
  exportFormat: exportFormatSchema,
})

/**
 * Batch Statistics schema
 */
export const batchStatisticsSchema = z.object({
  totalGenerated: z.number(),
  validCount: z.number(),
  invalidCount: z.number(),
  uniqueCount: z.number(),
  duplicateCount: z.number(),
  averageEntropy: z.number(),
  averageQuality: z.number(),
  averageSecurity: z.number(),
  generationTime: z.number(),
  collisionRate: z.number(),
  securityDistribution: z.record(z.string(), z.number()),
  qualityDistribution: z.record(z.string(), z.number()),
  lengthDistribution: z.record(z.string(), z.number()),
})

/**
 * Batch Operation schema
 */
export const batchOperationSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: uuidTypeSchema,
  count: z.number(),
  settings: batchSettingsSchema,
  uuids: z.array(batchUuidSchema),
  status: z.enum(["pending", "processing", "completed", "failed", "paused"]),
  progress: z.number(),
  error: z.string().optional(),
  statistics: batchStatisticsSchema,
  createdAt: z.date(),
  completedAt: z.date().optional(),
})

/**
 * Batch Template schema
 */
export const batchTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  settings: batchSettingsSchema.partial(),
  useCase: z.array(z.string()),
  examples: z.array(z.string()),
  estimatedTime: z.string(),
})

/**
 * Batch Error schema
 */
export const batchErrorSchema = z.object({
  message: z.string(),
  type: z.enum(["count", "settings", "memory", "performance"]),
  severity: z.enum(["error", "warning", "info"]),
})

/**
 * Batch Validation schema
 */
export const batchValidationSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(batchErrorSchema),
  warnings: z.array(z.string()),
  suggestions: z.array(z.string()),
})

// ==================== Type Exports ====================

export type UUIDType = z.infer<typeof uuidTypeSchema>
export type UUIDFormat = z.infer<typeof uuidFormatSchema>
export type ExportFormat = z.infer<typeof exportFormatSchema>
export type ViewMode = z.infer<typeof viewModeSchema>
export type SecurityLevel = z.infer<typeof securityLevelSchema>
export type CaseFormat = z.infer<typeof caseFormatSchema>
export type Predictability = z.infer<typeof predictabilitySchema>
export type CryptographicStrength = z.infer<typeof cryptographicStrengthSchema>
export type CollisionResistance = z.infer<typeof collisionResistanceSchema>
export type UUIDStructure = z.infer<typeof uuidStructureSchema>
export type UUIDSecurity = z.infer<typeof uuidSecuritySchema>
export type UUIDQuality = z.infer<typeof uuidQualitySchema>
export type UUIDCompatibility = z.infer<typeof uuidCompatibilitySchema>
export type UUIDAnalysis = z.infer<typeof uuidAnalysisSchema>
export type UUIDMetadata = z.infer<typeof uuidMetadataSchema>
export type BatchUUID = z.infer<typeof batchUuidSchema>
export type SortOrder = z.infer<typeof sortOrderSchema>
export type FilterCriteria = z.infer<typeof filterCriteriaSchema>
export type BatchSettings = z.infer<typeof batchSettingsSchema>
export type BatchStatistics = z.infer<typeof batchStatisticsSchema>
export type BatchOperation = z.infer<typeof batchOperationSchema>
export type BatchTemplate = z.infer<typeof batchTemplateSchema>
export type BatchError = z.infer<typeof batchErrorSchema>
export type BatchValidation = z.infer<typeof batchValidationSchema>
