import { z } from "zod"

// ==================== File Hash Schemas ====================

/**
 * Hash Algorithm schema
 */
export const hashAlgorithmSchema = z.enum(["MD5", "SHA-1", "SHA-256", "SHA-384", "SHA-512"])

/**
 * Security Level schema
 */
export const securityLevelSchema = z.enum(["low", "medium", "high", "very-high"])

/**
 * Export Format schema
 */
export const exportFormatSchema = z.enum(["json", "csv", "txt", "xml"])

/**
 * File Content schema
 */
export const fileContentSchema = z.object({
  name: z.string(),
  size: z.number(),
  type: z.string(),
  lastModified: z.date(),
  checksum: z.string().optional(),
})

/**
 * Hash Result schema
 */
export const hashResultSchema = z.object({
  algorithm: hashAlgorithmSchema,
  hash: z.string(),
  processingTime: z.number(),
  verified: z.boolean().optional(),
  chunks: z.number().optional(),
})

/**
 * File Hash Statistics schema
 */
export const fileHashStatisticsSchema = z.object({
  totalFiles: z.number(),
  totalSize: z.number(),
  algorithmDistribution: z.record(z.string(), z.number()),
  averageProcessingTime: z.number(),
  totalProcessingTime: z.number(),
  verificationCount: z.number(),
  successRate: z.number(),
  integrityScore: z.number(),
  largestFile: z.number(),
  smallestFile: z.number(),
})

/**
 * File Hash Settings schema
 */
export const fileHashSettingsSchema = z.object({
  algorithms: z.array(hashAlgorithmSchema),
  includeTimestamp: z.boolean(),
  enableVerification: z.boolean(),
  batchProcessing: z.boolean(),
  realTimeHashing: z.boolean(),
  exportFormat: exportFormatSchema,
  chunkSize: z.number(),
  showProgress: z.boolean(),
  integrityCheck: z.boolean(),
})

/**
 * File Hash Data schema
 */
export const fileHashDataSchema = z.object({
  original: fileContentSchema,
  hashes: z.array(hashResultSchema),
  statistics: fileHashStatisticsSchema,
  settings: fileHashSettingsSchema,
})

/**
 * File Hash Item schema
 */
export const fileHashItemSchema = z.object({
  id: z.string(),
  file: z.instanceof(File),
  name: z.string(),
  size: z.number(),
  type: z.string(),
  status: z.enum(["pending", "processing", "completed", "error"]),
  error: z.string().optional(),
  processedAt: z.date().optional(),
  hashData: fileHashDataSchema.optional(),
  progress: z.number().optional(),
})

/**
 * File Hash Template schema
 */
export const fileHashTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  settings: fileHashSettingsSchema.partial(),
  algorithms: z.array(hashAlgorithmSchema),
  securityLevel: securityLevelSchema,
})

/**
 * File Integrity Check schema
 */
export const fileIntegrityCheckSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  expectedHash: z.string(),
  actualHash: z.string(),
  algorithm: hashAlgorithmSchema,
  isValid: z.boolean(),
  processingTime: z.number(),
})

// ==================== Type Exports ====================

export type HashAlgorithm = z.infer<typeof hashAlgorithmSchema>
export type SecurityLevel = z.infer<typeof securityLevelSchema>
export type ExportFormat = z.infer<typeof exportFormatSchema>
export type FileContent = z.infer<typeof fileContentSchema>
export type HashResult = z.infer<typeof hashResultSchema>
export type FileHashStatistics = z.infer<typeof fileHashStatisticsSchema>
export type FileHashSettings = z.infer<typeof fileHashSettingsSchema>
export type FileHashData = z.infer<typeof fileHashDataSchema>
export type FileHashItem = z.infer<typeof fileHashItemSchema>
export type FileHashTemplate = z.infer<typeof fileHashTemplateSchema>
export type FileIntegrityCheck = z.infer<typeof fileIntegrityCheckSchema>
