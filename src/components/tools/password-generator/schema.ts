import { z } from "zod"

// ==================== Password Generator Schemas ====================

/**
 * Password Type schema
 */
export const passwordTypeSchema = z.enum([
  "random",
  "memorable",
  "pin",
  "passphrase",
  "custom",
  "pronounceable",
])

/**
 * Security Level schema
 */
export const securityLevelSchema = z.enum([
  "low",
  "medium",
  "high",
  "very-high",
  "maximum",
])

/**
 * Export Format schema
 */
export const exportFormatSchema = z.enum(["json", "csv", "txt", "xml"])

/**
 * Password Requirement schema
 */
export const passwordRequirementSchema = z.object({
  name: z.string(),
  met: z.boolean(),
  description: z.string(),
  weight: z.number(),
})

/**
 * Password Strength schema
 */
export const passwordStrengthSchema = z.object({
  score: z.number(),
  level: z.enum([
    "very-weak",
    "weak",
    "fair",
    "good",
    "strong",
    "very-strong",
  ]),
  feedback: z.array(z.string()),
  requirements: z.array(passwordRequirementSchema),
  entropy: z.number(),
  timeToCrack: z.string(),
})

/**
 * Password Settings schema
 */
export const passwordSettingsSchema = z.object({
  length: z.number(),
  includeUppercase: z.boolean(),
  includeLowercase: z.boolean(),
  includeNumbers: z.boolean(),
  includeSymbols: z.boolean(),
  excludeSimilar: z.boolean(),
  excludeAmbiguous: z.boolean(),
  customCharacters: z.string(),
  pattern: z.string(),
  wordCount: z.number(),
  separator: z.string(),
  minLength: z.number(),
  maxLength: z.number(),
})

/**
 * Password Item schema
 */
export const passwordItemSchema = z.object({
  id: z.string(),
  password: z.string(),
  type: passwordTypeSchema,
  strength: passwordStrengthSchema,
  entropy: z.number(),
  createdAt: z.date(),
  settings: passwordSettingsSchema,
})

/**
 * Password Template schema
 */
export const passwordTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  settings: passwordSettingsSchema.partial(),
  type: passwordTypeSchema,
  securityLevel: securityLevelSchema,
})

/**
 * Pattern Analysis schema
 */
export const patternAnalysisSchema = z.object({
  commonPatterns: z.array(z.string()),
  uniqueCharacters: z.number(),
  repetitionScore: z.number(),
  sequenceScore: z.number(),
  dictionaryScore: z.number(),
})

/**
 * Password Statistics schema
 */
export const passwordStatisticsSchema = z.object({
  totalGenerated: z.number(),
  averageStrength: z.number(),
  averageEntropy: z.number(),
  strengthDistribution: z.record(z.string(), z.number()),
  typeDistribution: z.record(z.string(), z.number()),
  characterDistribution: z.record(z.string(), z.number()),
  patternAnalysis: patternAnalysisSchema,
})

/**
 * Password Batch schema
 */
export const passwordBatchSchema = z.object({
  id: z.string(),
  passwords: z.array(passwordItemSchema),
  count: z.number(),
  type: passwordTypeSchema,
  settings: passwordSettingsSchema,
  createdAt: z.date(),
  statistics: passwordStatisticsSchema,
})

/**
 * Password History schema
 */
export const passwordHistorySchema = z.object({
  id: z.string(),
  password: z.string(),
  type: passwordTypeSchema,
  strength: passwordStrengthSchema,
  createdAt: z.date(),
  used: z.boolean(),
})

// ==================== Type Exports ====================

export type PasswordType = z.infer<typeof passwordTypeSchema>
export type SecurityLevel = z.infer<typeof securityLevelSchema>
export type ExportFormat = z.infer<typeof exportFormatSchema>
export type PasswordRequirement = z.infer<typeof passwordRequirementSchema>
export type PasswordStrength = z.infer<typeof passwordStrengthSchema>
export type PasswordSettings = z.infer<typeof passwordSettingsSchema>
export type PasswordItem = z.infer<typeof passwordItemSchema>
export type PasswordTemplate = z.infer<typeof passwordTemplateSchema>
export type PatternAnalysis = z.infer<typeof patternAnalysisSchema>
export type PasswordStatistics = z.infer<typeof passwordStatisticsSchema>
export type PasswordBatch = z.infer<typeof passwordBatchSchema>
export type PasswordHistory = z.infer<typeof passwordHistorySchema>

