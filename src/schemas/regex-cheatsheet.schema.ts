import { z } from "zod"

// ==================== Regex Cheatsheet Schemas ====================

/**
 * Export Format schema
 */
export const exportFormatSchema = z.enum(["json", "csv", "txt", "xml", "yaml"])

/**
 * Difficulty schema
 */
export const difficultySchema = z.enum(["beginner", "intermediate", "advanced", "expert"])

/**
 * Performance schema
 */
export const performanceSchema = z.enum(["fast", "medium", "slow"])

/**
 * Regex Example schema
 */
export const regexExampleSchema = z.object({
  input: z.string(),
  matches: z.boolean(),
  explanation: z.string(),
  groups: z.array(z.string()).optional(),
})

/**
 * Regex Category schema
 */
export const regexCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  icon: z.string(),
  color: z.string(),
  patterns: z.number(),
})

/**
 * Regex Pattern schema
 */
export const regexPatternSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  pattern: z.string(),
  flags: z.string().optional(),
  category: regexCategorySchema,
  difficulty: difficultySchema,
  examples: z.array(regexExampleSchema),
  explanation: z.string(),
  useCase: z.array(z.string()),
  tags: z.array(z.string()),
  alternatives: z.array(z.string()).optional(),
  performance: performanceSchema,
  compatibility: z.array(z.string()),
  createdAt: z.date(),
})

/**
 * Regex Match schema
 */
export const regexMatchSchema = z.object({
  match: z.string(),
  index: z.number(),
  groups: z.array(z.string()),
  namedGroups: z.record(z.string(), z.string()).optional(),
})

/**
 * Regex Performance schema
 */
export const regexPerformanceSchema = z.object({
  steps: z.number(),
  backtracking: z.boolean(),
  complexity: z.enum(["linear", "polynomial", "exponential"]),
  recommendation: z.string().optional(),
})

/**
 * Regex Test Result schema
 */
export const regexTestResultSchema = z.object({
  isValid: z.boolean(),
  matches: z.array(regexMatchSchema),
  groups: z.array(z.string()),
  error: z.string().optional(),
  executionTime: z.number(),
  performance: regexPerformanceSchema,
})

/**
 * Regex Test schema
 */
export const regexTestSchema = z.object({
  id: z.string(),
  pattern: z.string(),
  flags: z.string(),
  testString: z.string(),
  result: regexTestResultSchema,
  timestamp: z.date(),
})

/**
 * Regex Cheatsheet schema
 */
export const regexCheatsheetSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  categories: z.array(regexCategorySchema),
  patterns: z.array(regexPatternSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// ==================== Type Exports ====================

export type ExportFormat = z.infer<typeof exportFormatSchema>
export type Difficulty = z.infer<typeof difficultySchema>
export type Performance = z.infer<typeof performanceSchema>
export type RegexExample = z.infer<typeof regexExampleSchema>
export type RegexCategory = z.infer<typeof regexCategorySchema>
export type RegexPattern = z.infer<typeof regexPatternSchema>
export type RegexMatch = z.infer<typeof regexMatchSchema>
export type RegexPerformance = z.infer<typeof regexPerformanceSchema>
export type RegexTestResult = z.infer<typeof regexTestResultSchema>
export type RegexTest = z.infer<typeof regexTestSchema>
export type RegexCheatsheet = z.infer<typeof regexCheatsheetSchema>
