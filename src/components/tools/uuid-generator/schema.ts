import { z } from "zod"

// ==================== UUID Generator Schemas ====================

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
export const uuidFormatSchema = z.enum([
  "standard",
  "compact",
  "braced",
  "urn",
  "base64",
  "hex",
])

/**
 * Export Format schema
 */
export const exportFormatSchema = z.enum(["txt", "json", "csv", "xml"])

/**
 * UUID Structure schema
 */
export const uuidStructureSchema = z.object({
  segments: z.array(z.string()),
  separators: z.array(z.string()),
  character_set: z.string(),
  case_format: z.enum(["uppercase", "lowercase", "mixed"]),
  has_hyphens: z.boolean(),
  has_braces: z.boolean(),
  total_length: z.number(),
  data_length: z.number(),
})

/**
 * UUID Security schema
 */
export const uuidSecuritySchema = z.object({
  predictability: z.enum(["low", "medium", "high"]),
  entropy_bits: z.number(),
  cryptographic_strength: z.enum(["weak", "moderate", "strong", "very_strong"]),
  timing_attack_resistant: z.boolean(),
  collision_resistance: z.enum(["low", "medium", "high", "very_high"]),
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
  security_level: z.enum(["low", "medium", "high", "very_high"]),
  use_cases: z.array(z.string()),
  standards_compliance: z.array(z.string()),
})

/**
 * UUID Result schema
 */
export const uuidResultSchema = z.object({
  id: z.string(),
  value: z.string(),
  type: uuidTypeSchema,
  version: z.number().optional(),
  variant: z.string().optional(),
  timestamp: z.date().optional(),
  isValid: z.boolean(),
  error: z.string().optional(),
  metadata: uuidMetadataSchema.optional(),
  analysis: uuidAnalysisSchema.optional(),
  createdAt: z.date(),
})

/**
 * Batch Statistics schema
 */
export const batchStatisticsSchema = z.object({
  totalGenerated: z.number(),
  uniqueCount: z.number(),
  duplicateCount: z.number(),
  averageEntropy: z.number(),
  averageQuality: z.number(),
  generationTime: z.number(),
  collisionRate: z.number(),
  securityDistribution: z.record(z.string(), z.number()),
})

/**
 * Generation Settings schema
 */
export const generationSettingsSchema = z.object({
  type: uuidTypeSchema,
  count: z.number(),
  format: uuidFormatSchema,
  case: z.enum(["uppercase", "lowercase"]),
  includeBraces: z.boolean(),
  includeHyphens: z.boolean(),
  customLength: z.number().optional(),
  customAlphabet: z.string().optional(),
  prefix: z.string().optional(),
  suffix: z.string().optional(),
  exportFormat: exportFormatSchema,
})

/**
 * Generation Batch schema
 */
export const generationBatchSchema = z.object({
  id: z.string(),
  uuids: z.array(uuidResultSchema),
  count: z.number(),
  type: uuidTypeSchema,
  settings: generationSettingsSchema,
  createdAt: z.date(),
  statistics: batchStatisticsSchema,
})

/**
 * UUID Error schema
 */
export const uuidErrorSchema = z.object({
  message: z.string(),
  type: z.enum(["format", "length", "character", "structure", "version"]),
  severity: z.enum(["error", "warning", "info"]),
})

/**
 * UUID Validation schema
 */
export const uuidValidationSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(uuidErrorSchema),
  warnings: z.array(z.string()),
  suggestions: z.array(z.string()),
  detectedType: uuidTypeSchema.optional(),
})

/**
 * UUID Template schema
 */
export const uuidTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  type: uuidTypeSchema,
  settings: generationSettingsSchema.partial(),
  useCase: z.array(z.string()),
  examples: z.array(z.string()),
})

// ==================== Type Exports ====================

/**
 * Type inference from zod schemas
 */
export type UUIDType = z.infer<typeof uuidTypeSchema>
export type UUIDFormat = z.infer<typeof uuidFormatSchema>
export type ExportFormat = z.infer<typeof exportFormatSchema>
export type UUIDStructure = z.infer<typeof uuidStructureSchema>
export type UUIDSecurity = z.infer<typeof uuidSecuritySchema>
export type UUIDQuality = z.infer<typeof uuidQualitySchema>
export type UUIDCompatibility = z.infer<typeof uuidCompatibilitySchema>
export type UUIDAnalysis = z.infer<typeof uuidAnalysisSchema>
export type UUIDMetadata = z.infer<typeof uuidMetadataSchema>
export type UUIDResult = z.infer<typeof uuidResultSchema>
export type BatchStatistics = z.infer<typeof batchStatisticsSchema>
export type GenerationSettings = z.infer<typeof generationSettingsSchema>
export type GenerationBatch = z.infer<typeof generationBatchSchema>
export type UUIDError = z.infer<typeof uuidErrorSchema>
export type UUIDValidation = z.infer<typeof uuidValidationSchema>
export type UUIDTemplate = z.infer<typeof uuidTemplateSchema>

