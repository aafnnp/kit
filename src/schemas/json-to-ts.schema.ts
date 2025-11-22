import { z } from "zod"

// ==================== JSON to TS Schemas ====================

/**
 * Export Format schema
 */
export const exportFormatSchema = z.enum(["ts", "json", "csv", "txt"])

/**
 * Complexity Metrics schema
 */
export const complexityMetricsSchema = z.object({
  depth: z.number(),
  totalProperties: z.number(),
  nestedObjects: z.number(),
  arrays: z.number(),
  optionalProperties: z.number(),
  unionTypes: z.number(),
})

/**
 * Type Count schema
 */
export const typeCountSchema = z.object({
  primitives: z.number(),
  objects: z.number(),
  arrays: z.number(),
  unions: z.number(),
  literals: z.number(),
  any: z.number(),
})

/**
 * Generation Statistics schema
 */
export const generationStatisticsSchema = z.object({
  inputSize: z.number(),
  outputSize: z.number(),
  inputLines: z.number(),
  outputLines: z.number(),
  processingTime: z.number(),
  complexity: complexityMetricsSchema,
  typeCount: typeCountSchema,
})

/**
 * Type Analysis schema
 */
export const typeAnalysisSchema = z.object({
  rootType: z.string(),
  hasNestedObjects: z.boolean(),
  hasArrays: z.boolean(),
  hasOptionalProperties: z.boolean(),
  hasUnionTypes: z.boolean(),
  hasComplexTypes: z.boolean(),
  suggestedImprovements: z.array(z.string()),
  typeIssues: z.array(z.string()),
})

/**
 * TypeScript Generation Result schema
 */
export const typeScriptGenerationResultSchema = z.object({
  id: z.string(),
  input: z.string(),
  output: z.string(),
  interfaceName: z.string(),
  isValid: z.boolean(),
  error: z.string().optional(),
  statistics: generationStatisticsSchema,
  analysis: typeAnalysisSchema.optional(),
  createdAt: z.date(),
})

/**
 * Batch Statistics schema
 */
export const batchStatisticsSchema = z.object({
  totalGenerated: z.number(),
  validCount: z.number(),
  invalidCount: z.number(),
  averageComplexity: z.number(),
  totalInputSize: z.number(),
  totalOutputSize: z.number(),
  successRate: z.number(),
})

/**
 * Generation Settings schema
 */
export const generationSettingsSchema = z.object({
  interfaceName: z.string(),
  useOptionalProperties: z.boolean(),
  generateComments: z.boolean(),
  useStrictTypes: z.boolean(),
  exportInterface: z.boolean(),
  realTimeGeneration: z.boolean(),
  exportFormat: exportFormatSchema,
  indentSize: z.number(),
  useReadonly: z.boolean(),
  generateUtilityTypes: z.boolean(),
})

/**
 * Generation Batch schema
 */
export const generationBatchSchema = z.object({
  id: z.string(),
  results: z.array(typeScriptGenerationResultSchema),
  count: z.number(),
  settings: generationSettingsSchema,
  createdAt: z.date(),
  statistics: batchStatisticsSchema,
})

/**
 * TypeScript Template schema
 */
export const typeScriptTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  jsonExample: z.string(),
  expectedOutput: z.string(),
  useCase: z.array(z.string()),
})

/**
 * JSON Error schema
 */
export const jsonErrorSchema = z.object({
  message: z.string(),
  line: z.number().optional(),
  column: z.number().optional(),
  path: z.string().optional(),
})

/**
 * JSON Validation schema
 */
export const jsonValidationSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(jsonErrorSchema),
  warnings: z.array(z.string()),
  suggestions: z.array(z.string()),
})

// ==================== Type Exports ====================

export type ExportFormat = z.infer<typeof exportFormatSchema>
export type ComplexityMetrics = z.infer<typeof complexityMetricsSchema>
export type TypeCount = z.infer<typeof typeCountSchema>
export type GenerationStatistics = z.infer<typeof generationStatisticsSchema>
export type TypeAnalysis = z.infer<typeof typeAnalysisSchema>
export type TypeScriptGenerationResult = z.infer<typeof typeScriptGenerationResultSchema>
export type BatchStatistics = z.infer<typeof batchStatisticsSchema>
export type GenerationSettings = z.infer<typeof generationSettingsSchema>
export type GenerationBatch = z.infer<typeof generationBatchSchema>
export type TypeScriptTemplate = z.infer<typeof typeScriptTemplateSchema>
export type JSONError = z.infer<typeof jsonErrorSchema>
export type JSONValidation = z.infer<typeof jsonValidationSchema>
