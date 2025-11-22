import { z } from "zod"

// ==================== Diff Viewer Schemas ====================

/**
 * Diff Algorithm schema
 */
export const diffAlgorithmSchema = z.enum(["myers", "patience", "histogram", "minimal"])

/**
 * Diff Format schema
 */
export const diffFormatSchema = z.enum(["unified", "side-by-side", "split", "inline"])

/**
 * Diff View Mode schema
 */
export const diffViewModeSchema = z.enum(["full", "changes-only", "context"])

/**
 * Diff File schema
 */
export const diffFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  content: z.string(),
  size: z.number(),
  type: z.string(),
  status: z.enum(["pending", "processing", "completed", "error"]),
  error: z.string().optional(),
  processedAt: z.date().optional(),
  pairedWith: z.string().optional(),
})

/**
 * Word Diff schema
 */
export const wordDiffSchema = z.object({
  type: z.enum(["added", "removed", "unchanged"]),
  content: z.string(),
})

/**
 * Diff Line schema
 */
export const diffLineSchema = z.object({
  type: z.enum(["added", "removed", "modified", "unchanged", "context"]),
  leftLineNumber: z.number().optional(),
  rightLineNumber: z.number().optional(),
  leftContent: z.string().optional(),
  rightContent: z.string().optional(),
  content: z.string(),
  wordDiffs: z.array(wordDiffSchema).optional(),
})

/**
 * Diff Statistics schema
 */
export const diffStatisticsSchema = z.object({
  totalLines: z.number(),
  addedLines: z.number(),
  removedLines: z.number(),
  modifiedLines: z.number(),
  unchangedLines: z.number(),
  addedWords: z.number(),
  removedWords: z.number(),
  similarity: z.number(),
  executionTime: z.number(),
})

/**
 * Diff Result schema
 */
export const diffResultSchema = z.object({
  lines: z.array(diffLineSchema),
  statistics: diffStatisticsSchema,
  algorithm: diffAlgorithmSchema,
  format: diffFormatSchema,
})

/**
 * Diff Pair schema
 */
export const diffPairSchema = z.object({
  id: z.string(),
  leftFile: diffFileSchema,
  rightFile: diffFileSchema,
  status: z.enum(["pending", "processing", "completed", "error"]),
  error: z.string().optional(),
  result: diffResultSchema.optional(),
  processedAt: z.date().optional(),
})

/**
 * Diff Settings schema
 */
export const diffSettingsSchema = z.object({
  algorithm: diffAlgorithmSchema,
  format: diffFormatSchema,
  viewMode: diffViewModeSchema,
  showLineNumbers: z.boolean(),
  showWhitespace: z.boolean(),
  ignoreWhitespace: z.boolean(),
  ignoreCase: z.boolean(),
  contextLines: z.number(),
  wordLevelDiff: z.boolean(),
  syntaxHighlighting: z.boolean(),
  wrapLines: z.boolean(),
})

// ==================== Type Exports ====================

export type DiffAlgorithm = z.infer<typeof diffAlgorithmSchema>
export type DiffFormat = z.infer<typeof diffFormatSchema>
export type DiffViewMode = z.infer<typeof diffViewModeSchema>
export type DiffFile = z.infer<typeof diffFileSchema>
export type WordDiff = z.infer<typeof wordDiffSchema>
export type DiffLine = z.infer<typeof diffLineSchema>
export type DiffStatistics = z.infer<typeof diffStatisticsSchema>
export type DiffResult = z.infer<typeof diffResultSchema>
export type DiffPair = z.infer<typeof diffPairSchema>
export type DiffSettings = z.infer<typeof diffSettingsSchema>
