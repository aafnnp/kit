import { z } from "zod"

// ==================== SHA-256 Hash Schemas ====================

/**
 * Hash Algorithm schema
 */
export const hashAlgorithmSchema = z.enum(["SHA-256", "SHA-1", "SHA-384", "SHA-512", "MD5", "SHA-3"])

/**
 * Output Format schema
 */
export const outputFormatSchema = z.enum(["hex", "base64", "binary"])

/**
 * Export Format schema
 */
export const exportFormatSchema = z.enum(["json", "csv", "txt", "xml"])

/**
 * Hash Content schema
 */
export const hashContentSchema = z.object({
  content: z.union([z.string(), z.instanceof(ArrayBuffer)]),
  size: z.number(),
  type: z.enum(["text", "file"]),
  encoding: z.string(),
})

/**
 * Hash Result schema
 */
export const hashResultSchema = z.object({
  algorithm: hashAlgorithmSchema,
  hash: z.string(),
  processingTime: z.number(),
  verified: z.boolean().optional(),
})

/**
 * Hash Statistics schema
 */
export const hashStatisticsSchema = z.object({
  totalHashes: z.number(),
  algorithmDistribution: z.record(z.string(), z.number()),
  averageProcessingTime: z.number(),
  totalProcessingTime: z.number(),
  collisionCount: z.number(),
  verificationCount: z.number(),
  successRate: z.number(),
})

/**
 * Hash Settings schema
 */
export const hashSettingsSchema = z.object({
  algorithms: z.array(hashAlgorithmSchema),
  outputFormat: outputFormatSchema,
  includeTimestamp: z.boolean(),
  enableVerification: z.boolean(),
  batchProcessing: z.boolean(),
  realTimeHashing: z.boolean(),
  exportFormat: exportFormatSchema,
})

/**
 * Hash Data schema
 */
export const hashDataSchema = z.object({
  original: hashContentSchema,
  hashes: z.array(hashResultSchema),
  statistics: hashStatisticsSchema,
  settings: hashSettingsSchema,
})

/**
 * Hash File schema
 */
export const hashFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  content: z.union([z.string(), z.instanceof(ArrayBuffer)]),
  size: z.number(),
  type: z.string(),
  status: z.enum(["pending", "processing", "completed", "error"]),
  error: z.string().optional(),
  processedAt: z.date().optional(),
  hashData: hashDataSchema.optional(),
})

/**
 * Hash Template schema
 */
export const hashTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  settings: hashSettingsSchema.partial(),
  algorithms: z.array(hashAlgorithmSchema),
})

// ==================== Type Exports ====================

export type HashAlgorithm = z.infer<typeof hashAlgorithmSchema>
export type OutputFormat = z.infer<typeof outputFormatSchema>
export type ExportFormat = z.infer<typeof exportFormatSchema>
export type HashContent = z.infer<typeof hashContentSchema>
export type HashResult = z.infer<typeof hashResultSchema>
export type HashStatistics = z.infer<typeof hashStatisticsSchema>
export type HashSettings = z.infer<typeof hashSettingsSchema>
export type HashData = z.infer<typeof hashDataSchema>
export type HashFile = z.infer<typeof hashFileSchema>
export type HashTemplate = z.infer<typeof hashTemplateSchema>
