import { z } from "zod"

// ==================== Regex Tester Schemas ====================

/**
 * Regex Match schema
 */
export const regexMatchSchema = z.object({
  match: z.string(),
  index: z.number(),
  groups: z.array(z.string()),
  namedGroups: z.record(z.string(), z.string()),
  input: z.string(),
  length: z.number(),
})

/**
 * Regex Statistics schema
 */
export const regexStatisticsSchema = z.object({
  totalMatches: z.number(),
  uniqueMatches: z.number(),
  averageMatchLength: z.number(),
  matchPositions: z.array(z.number()),
  captureGroups: z.number(),
  namedGroups: z.array(z.string()),
  executionTime: z.number(),
  textLength: z.number(),
  coverage: z.number(),
})

/**
 * Text File schema
 */
export const textFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  content: z.string(),
  size: z.number(),
  type: z.string(),
  status: z.enum(["pending", "processing", "completed", "error"]),
  error: z.string().optional(),
  processedAt: z.date().optional(),
  matches: z.array(regexMatchSchema).optional(),
  statistics: regexStatisticsSchema.optional(),
})

/**
 * Regex Flags schema
 */
export const regexFlagsSchema = z.object({
  global: z.boolean(),
  ignoreCase: z.boolean(),
  multiline: z.boolean(),
  dotAll: z.boolean(),
  unicode: z.boolean(),
  sticky: z.boolean(),
})

/**
 * Regex Settings schema
 */
export const regexSettingsSchema = z.object({
  flags: regexFlagsSchema,
  highlightMatches: z.boolean(),
  showCaptureGroups: z.boolean(),
  showMatchPositions: z.boolean(),
  maxMatches: z.number(),
  timeout: z.number(),
  enableReplacement: z.boolean(),
  replacementText: z.string(),
})

/**
 * Regex Pattern schema
 */
export const regexPatternSchema = z.object({
  name: z.string(),
  pattern: z.string(),
  description: z.string(),
  category: z.string(),
  flags: z.string(),
  example: z.string(),
})

/**
 * Regex Test Result schema
 */
export const regexTestResultSchema = z.object({
  isValid: z.boolean(),
  matches: z.array(regexMatchSchema),
  statistics: regexStatisticsSchema,
  error: z.string().optional(),
  replacementResult: z.string().optional(),
})

// ==================== Type Exports ====================

export type RegexMatch = z.infer<typeof regexMatchSchema>
export type RegexStatistics = z.infer<typeof regexStatisticsSchema>
export type TextFile = z.infer<typeof textFileSchema>
export type RegexFlags = z.infer<typeof regexFlagsSchema>
export type RegexSettings = z.infer<typeof regexSettingsSchema>
export type RegexPattern = z.infer<typeof regexPatternSchema>
export type RegexTestResult = z.infer<typeof regexTestResultSchema>
