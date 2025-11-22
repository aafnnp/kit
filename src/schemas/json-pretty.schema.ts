import { z } from "zod"

// ==================== JSON Pretty Schemas ====================

/**
 * JSON Operation schema
 */
export const jsonOperationSchema = z.enum(["format", "minify", "validate", "analyze", "escape", "unescape"])

/**
 * Export Format schema
 */
export const exportFormatSchema = z.enum(["json", "csv", "txt", "xml"])

/**
 * JSON Statistics schema
 */
export const jsonStatisticsSchema = z.object({
  size: z.number(),
  lines: z.number(),
  depth: z.number(),
  keys: z.number(),
  arrays: z.number(),
  objects: z.number(),
  primitives: z.number(),
  nullValues: z.number(),
  booleans: z.number(),
  numbers: z.number(),
  strings: z.number(),
  duplicateKeys: z.array(z.string()),
  circularReferences: z.boolean(),
})

/**
 * JSON Schema schema
 */
export const jsonSchemaSchema = z.object({
  type: z.string(),
  properties: z.record(z.string(), z.any()).optional(),
  items: z.any().optional(),
  required: z.array(z.string()).optional(),
  additionalProperties: z.boolean().optional(),
  description: z.string().optional(),
})

/**
 * JSON Processing Result schema
 */
export const jsonProcessingResultSchema = z.object({
  id: z.string(),
  input: z.string(),
  output: z.string(),
  operation: jsonOperationSchema,
  isValid: z.boolean(),
  error: z.string().optional(),
  statistics: jsonStatisticsSchema,
  schema: jsonSchemaSchema.optional(),
  createdAt: z.date(),
})

/**
 * JSON Batch Statistics schema
 */
export const jsonBatchStatisticsSchema = z.object({
  totalProcessed: z.number(),
  validCount: z.number(),
  invalidCount: z.number(),
  averageSize: z.number(),
  totalSize: z.number(),
  operationDistribution: z.record(z.string(), z.number()),
  successRate: z.number(),
})

/**
 * JSON Settings schema
 */
export const jsonSettingsSchema = z.object({
  indentSize: z.number(),
  sortKeys: z.boolean(),
  removeComments: z.boolean(),
  validateSchema: z.boolean(),
  showStatistics: z.boolean(),
  realTimeProcessing: z.boolean(),
  exportFormat: exportFormatSchema,
  maxDepth: z.number(),
  maxSize: z.number(),
})

/**
 * JSON Batch schema
 */
export const jsonBatchSchema = z.object({
  id: z.string(),
  results: z.array(jsonProcessingResultSchema),
  count: z.number(),
  settings: jsonSettingsSchema,
  createdAt: z.date(),
  statistics: jsonBatchStatisticsSchema,
})

/**
 * JSON Template schema
 */
export const jsonTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  content: z.string(),
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

export type JSONOperation = z.infer<typeof jsonOperationSchema>
export type ExportFormat = z.infer<typeof exportFormatSchema>
export type JSONStatistics = z.infer<typeof jsonStatisticsSchema>
export type JSONSchema = z.infer<typeof jsonSchemaSchema>
export type JSONProcessingResult = z.infer<typeof jsonProcessingResultSchema>
export type JSONBatchStatistics = z.infer<typeof jsonBatchStatisticsSchema>
export type JSONSettings = z.infer<typeof jsonSettingsSchema>
export type JSONBatch = z.infer<typeof jsonBatchSchema>
export type JSONTemplate = z.infer<typeof jsonTemplateSchema>
export type JSONError = z.infer<typeof jsonErrorSchema>
export type JSONValidation = z.infer<typeof jsonValidationSchema>
