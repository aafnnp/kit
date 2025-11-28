import { z } from "zod"

// ==================== Bcrypt Hash Schemas ====================

/**
 * Security Level schema
 */
export const securityLevelSchema = z.enum(["low", "medium", "high", "very-high"])

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
})

/**
 * Password Strength schema
 */
export const passwordStrengthSchema = z.object({
  score: z.number(),
  level: z.enum(["very-weak", "weak", "fair", "good", "strong"]),
  feedback: z.array(z.string()),
  requirements: z.array(passwordRequirementSchema),
})

/**
 * Bcrypt Content schema
 */
export const bcryptContentSchema = z.object({
  content: z.string(),
  size: z.number(),
  type: z.enum(["password", "text"]),
  strength: passwordStrengthSchema.optional(),
})

/**
 * Bcrypt Result schema
 */
export const bcryptResultSchema = z.object({
  saltRounds: z.number(),
  hash: z.string(),
  salt: z.string(),
  processingTime: z.number(),
  verified: z.boolean().optional(),
  securityLevel: securityLevelSchema,
})

/**
 * Bcrypt Statistics schema
 */
export const bcryptStatisticsSchema = z.object({
  totalHashes: z.number(),
  saltRoundDistribution: z.record(z.string(), z.number()),
  averageProcessingTime: z.number(),
  totalProcessingTime: z.number(),
  verificationCount: z.number(),
  successRate: z.number(),
  securityScore: z.number(),
})

/**
 * Bcrypt Settings schema
 */
export const bcryptSettingsSchema = z.object({
  saltRounds: z.array(z.number()),
  includeTimestamp: z.boolean(),
  enableVerification: z.boolean(),
  batchProcessing: z.boolean(),
  realTimeHashing: z.boolean(),
  exportFormat: exportFormatSchema,
  showPasswords: z.boolean(),
  passwordStrengthCheck: z.boolean(),
})

/**
 * Bcrypt Data schema
 */
export const bcryptDataSchema = z.object({
  original: bcryptContentSchema,
  hashes: z.array(bcryptResultSchema),
  statistics: bcryptStatisticsSchema,
  settings: bcryptSettingsSchema,
})

/**
 * Bcrypt File schema
 */
export const bcryptFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  content: z.string(),
  size: z.number(),
  type: z.string(),
  status: z.enum(["pending", "processing", "completed", "error"]),
  error: z.string().optional(),
  processedAt: z.date().optional(),
  bcryptData: bcryptDataSchema.optional(),
})

/**
 * Bcrypt Template schema
 */
export const bcryptTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  settings: bcryptSettingsSchema.partial(),
  saltRounds: z.array(z.number()),
  securityLevel: securityLevelSchema,
})

/**
 * Bcrypt Verification schema
 */
export const bcryptVerificationSchema = z.object({
  id: z.string(),
  password: z.string(),
  hash: z.string(),
  isValid: z.boolean(),
  processingTime: z.number(),
})

// ==================== Type Exports ====================

export type SecurityLevel = z.infer<typeof securityLevelSchema>
export type ExportFormat = z.infer<typeof exportFormatSchema>
export type PasswordRequirement = z.infer<typeof passwordRequirementSchema>
export type PasswordStrength = z.infer<typeof passwordStrengthSchema>
export type BcryptContent = z.infer<typeof bcryptContentSchema>
export type BcryptResult = z.infer<typeof bcryptResultSchema>
export type BcryptStatistics = z.infer<typeof bcryptStatisticsSchema>
export type BcryptSettings = z.infer<typeof bcryptSettingsSchema>
export type BcryptData = z.infer<typeof bcryptDataSchema>
export type BcryptFile = z.infer<typeof bcryptFileSchema>
export type BcryptTemplate = z.infer<typeof bcryptTemplateSchema>
export type BcryptVerification = z.infer<typeof bcryptVerificationSchema>
