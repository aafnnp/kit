import { z } from "zod"

// ==================== JSON Diff Schemas ====================

/**
 * Diff Type schema
 */
export const diffTypeSchema = z.enum(["added", "removed", "modified", "moved", "unchanged"])

/**
 * Export Format schema
 */
export const exportFormatSchema = z.enum(["json", "csv", "txt", "xml", "yaml", "html"])

/**
 * JSON Difference schema
 */
export const jsonDifferenceSchema = z.object({
  path: z.string(),
  type: diffTypeSchema,
  leftValue: z.any().optional(),
  rightValue: z.any().optional(),
  description: z.string(),
  severity: z.enum(["low", "medium", "high"]),
})

/**
 * Diff Summary schema
 */
export const diffSummarySchema = z.object({
  totalDifferences: z.number(),
  added: z.number(),
  removed: z.number(),
  modified: z.number(),
  moved: z.number(),
  unchanged: z.number(),
  similarity: z.number(),
  complexity: z.number(),
})

/**
 * Diff Metadata schema
 */
export const diffMetadataSchema = z.object({
  leftSize: z.number(),
  rightSize: z.number(),
  leftDepth: z.number(),
  rightDepth: z.number(),
  leftKeys: z.number(),
  rightKeys: z.number(),
  processingTime: z.number(),
  memoryUsage: z.number(),
})

/**
 * JSON Diff Result schema
 */
export const jsonDiffResultSchema = z.object({
  id: z.string(),
  leftJSON: z.any(),
  rightJSON: z.any(),
  leftText: z.string(),
  rightText: z.string(),
  differences: z.array(jsonDifferenceSchema),
  summary: diffSummarySchema,
  metadata: diffMetadataSchema,
  timestamp: z.date(),
})

/**
 * Diff Options schema
 */
export const diffOptionsSchema = z.object({
  ignoreCase: z.boolean(),
  ignoreWhitespace: z.boolean(),
  ignoreArrayOrder: z.boolean(),
  ignoreExtraKeys: z.boolean(),
  showUnchanged: z.boolean(),
  maxDepth: z.number(),
  precision: z.number(),
  customComparator: z.custom<(a: any, b: any) => boolean>().optional(),
})

/**
 * Diff Template schema
 */
export const diffTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  leftJSON: z.string(),
  rightJSON: z.string(),
  category: z.string(),
  useCase: z.array(z.string()),
  expectedDifferences: z.number(),
})

/**
 * Diff Error schema
 */
export const diffErrorSchema = z.object({
  message: z.string(),
  type: z.enum(["syntax", "structure", "performance", "logic"]),
  severity: z.enum(["error", "warning", "info"]),
  position: z.string().optional(),
})

/**
 * Diff Validation schema
 */
export const diffValidationSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(diffErrorSchema),
  warnings: z.array(z.string()),
  suggestions: z.array(z.string()),
  qualityScore: z.number(),
})

// ==================== Type Exports ====================

export type DiffType = z.infer<typeof diffTypeSchema>
export type ExportFormat = z.infer<typeof exportFormatSchema>
export type JSONDifference = z.infer<typeof jsonDifferenceSchema>
export type DiffSummary = z.infer<typeof diffSummarySchema>
export type DiffMetadata = z.infer<typeof diffMetadataSchema>
export type JSONDiffResult = z.infer<typeof jsonDiffResultSchema>
export type DiffOptions = z.infer<typeof diffOptionsSchema>
export type DiffTemplate = z.infer<typeof diffTemplateSchema>
export type DiffError = z.infer<typeof diffErrorSchema>
export type DiffValidation = z.infer<typeof diffValidationSchema>
