import { z } from "zod"

// ==================== Char Case Schemas ====================

/**
 * Case Type schema
 */
export const caseTypeSchema = z.enum([
  "uppercase",
  "lowercase",
  "titlecase",
  "sentencecase",
  "camelcase",
  "pascalcase",
  "snakecase",
  "kebabcase",
  "constantcase",
  "dotcase",
  "pathcase",
  "togglecase",
])

/**
 * Conversion Result schema
 */
export const conversionResultSchema = z.object({
  type: caseTypeSchema,
  content: z.string(),
  preview: z.string(),
})

/**
 * Text File schema
 */
export const textFileSchema = z.object({
  id: z.string(),
  file: z.instanceof(File),
  originalContent: z.string(),
  convertedContent: z.string(),
  name: z.string(),
  size: z.number(),
  type: z.string(),
  status: z.enum(["pending", "processing", "completed", "error"]),
  error: z.string().optional(),
  conversions: z.array(conversionResultSchema).optional(),
})

/**
 * Conversion Settings schema
 */
export const conversionSettingsSchema = z.object({
  preserveFormatting: z.boolean(),
  handleSpecialChars: z.boolean(),
  customDelimiter: z.string(),
  batchMode: z.boolean(),
  previewLength: z.number(),
})

/**
 * Conversion Stats schema
 */
export const conversionStatsSchema = z.object({
  totalFiles: z.number(),
  totalCharacters: z.number(),
  totalWords: z.number(),
  totalConversions: z.number(),
  averageFileSize: z.number(),
  processingTime: z.number(),
})

/**
 * Case Option schema
 */
export const caseOptionSchema = z.object({
  value: caseTypeSchema,
  name: z.string(),
  description: z.string(),
  example: z.string(),
  icon: z.custom<React.ReactNode>(),
})

// ==================== Type Exports ====================

export type CaseType = z.infer<typeof caseTypeSchema>
export type ConversionResult = z.infer<typeof conversionResultSchema>
export type TextFile = z.infer<typeof textFileSchema>
export type ConversionSettings = z.infer<typeof conversionSettingsSchema>
export type ConversionStats = z.infer<typeof conversionStatsSchema>
export type CaseOption = z.infer<typeof caseOptionSchema>
