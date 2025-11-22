import { z } from "zod"

// ==================== Base64 Encode Schemas ====================

/**
 * Encoding Operation schema
 */
export const encodingOperationSchema = z.enum(["encode", "decode"])

/**
 * Encoding Format schema
 */
export const encodingFormatSchema = z.enum([
  "text",
  "base64",
  "url",
  "hex",
  "binary",
])

/**
 * Export Format schema
 */
export const exportFormatSchema = z.enum(["txt", "json", "csv"])

/**
 * Encoding Metadata schema
 */
export const encodingMetadataSchema = z.object({
  inputSize: z.number(),
  outputSize: z.number(),
  compressionRatio: z.number(),
  processingTime: z.number(),
  isValid: z.boolean(),
  encoding: z.string(),
})

/**
 * Encoding Result schema
 */
export const encodingResultSchema = z.object({
  id: z.string(),
  operation: encodingOperationSchema,
  input: z.string(),
  output: z.string(),
  inputFormat: encodingFormatSchema,
  outputFormat: encodingFormatSchema,
  metadata: encodingMetadataSchema,
})

/**
 * Encoding Statistics schema
 */
export const encodingStatisticsSchema = z.object({
  totalEncodings: z.number(),
  operationDistribution: z.record(encodingOperationSchema, z.number()),
  averageCompressionRatio: z.number(),
  averageProcessingTime: z.number(),
  successRate: z.number(),
  processingTime: z.number(),
})

/**
 * Encoding Settings schema
 */
export const encodingSettingsSchema = z.object({
  defaultOperation: encodingOperationSchema,
  defaultFormat: encodingFormatSchema,
  includeMetadata: z.boolean(),
  optimizeOutput: z.boolean(),
  exportFormat: exportFormatSchema,
  chunkSize: z.number(),
})

/**
 * Base64 File schema
 */
export const base64FileSchema = z.object({
  id: z.string(),
  name: z.string(),
  content: z.string(),
  size: z.number(),
  type: z.string(),
  status: z.enum(["pending", "processing", "completed", "error"]),
  error: z.string().optional(),
  processedAt: z.date().optional(),
  encodingData: z
    .object({
      encodings: z.array(encodingResultSchema),
      statistics: encodingStatisticsSchema,
      settings: encodingSettingsSchema,
    })
    .optional(),
})

/**
 * Encoding Template schema
 */
export const encodingTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  operation: encodingOperationSchema,
  inputFormat: encodingFormatSchema,
  outputFormat: encodingFormatSchema,
  example: z.string(),
})

// ==================== Type Exports ====================

/**
 * Type inference from zod schemas
 */
export type EncodingOperation = z.infer<typeof encodingOperationSchema>
export type EncodingFormat = z.infer<typeof encodingFormatSchema>
export type ExportFormat = z.infer<typeof exportFormatSchema>
export type EncodingMetadata = z.infer<typeof encodingMetadataSchema>
export type EncodingResult = z.infer<typeof encodingResultSchema>
export type EncodingStatistics = z.infer<typeof encodingStatisticsSchema>
export type EncodingSettings = z.infer<typeof encodingSettingsSchema>
export type Base64File = z.infer<typeof base64FileSchema>
export type EncodingData = z.infer<
  typeof base64FileSchema.shape.encodingData
>
export type EncodingTemplate = z.infer<typeof encodingTemplateSchema>

