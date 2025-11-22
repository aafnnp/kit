import { z } from "zod"

// ==================== Matrix Math Schemas ====================

/**
 * Operation Type schema
 */
export const operationTypeSchema = z.enum([
  "add",
  "subtract",
  "multiply",
  "transpose",
  "inverse",
  "determinant",
  "trace",
  "rank",
  "eigenvalues",
  "lu",
  "qr",
  "svd",
  "solve",
  "power",
])

/**
 * Export Format schema
 */
export const exportFormatSchema = z.enum(["json", "csv", "txt", "matlab", "python", "latex", "mathml"])

/**
 * Decomposition Type schema
 */
export const decompositionTypeSchema = z.enum(["LU", "QR", "SVD", "Eigenvalue"])

/**
 * Matrix Properties schema
 */
export const matrixPropertiesSchema = z.object({
  isSquare: z.boolean(),
  isSymmetric: z.boolean(),
  isIdentity: z.boolean(),
  isZero: z.boolean(),
  isDiagonal: z.boolean(),
  isUpperTriangular: z.boolean(),
  isLowerTriangular: z.boolean(),
  isOrthogonal: z.boolean(),
  isInvertible: z.boolean(),
  rank: z.number(),
  determinant: z.number().optional(),
  trace: z.number().optional(),
  eigenvalues: z.array(z.number()).optional(),
  condition: z.number().optional(),
})

/**
 * Matrix schema
 */
export const matrixSchema = z.object({
  id: z.string(),
  name: z.string(),
  data: z.array(z.array(z.number())),
  rows: z.number(),
  cols: z.number(),
  properties: matrixPropertiesSchema,
})

/**
 * Operation Metadata schema
 */
export const operationMetadataSchema = z.object({
  operationTime: z.number(),
  complexity: z.number(),
  numericalStability: z.number(),
  memoryUsage: z.number(),
  algorithmUsed: z.string(),
})

/**
 * Matrix Decomposition schema
 */
export const matrixDecompositionSchema = z.object({
  type: decompositionTypeSchema,
  factors: z.array(matrixSchema),
  metadata: z.any(),
})

/**
 * Matrix Analysis schema
 */
export const matrixAnalysisSchema = z.object({
  dimensions: z.string(),
  sparsity: z.number(),
  norm: z.number(),
  condition: z.number(),
  singularValues: z.array(z.number()).optional(),
  decomposition: matrixDecompositionSchema.optional(),
})

/**
 * Matrix Operation schema
 */
export const matrixOperationSchema = z.object({
  id: z.string(),
  operation: operationTypeSchema,
  matrices: z.array(matrixSchema),
  result: z.union([matrixSchema, z.number(), z.null()]),
  metadata: operationMetadataSchema,
  analysis: matrixAnalysisSchema,
  timestamp: z.date(),
})

/**
 * Matrix Template schema
 */
export const matrixTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  matrices: z.array(matrixSchema),
  operation: operationTypeSchema,
  useCase: z.array(z.string()),
  difficulty: z.enum(["simple", "medium", "complex"]),
})

/**
 * Matrix Error schema
 */
export const matrixErrorSchema = z.object({
  message: z.string(),
  type: z.enum(["dimension", "format", "numerical", "operation"]),
  severity: z.enum(["error", "warning", "info"]),
  position: z
    .object({
      row: z.number(),
      col: z.number(),
    })
    .optional(),
})

/**
 * Matrix Validation schema
 */
export const matrixValidationSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(matrixErrorSchema),
  warnings: z.array(z.string()),
  suggestions: z.array(z.string()),
  qualityScore: z.number(),
})

// ==================== Type Exports ====================

export type OperationType = z.infer<typeof operationTypeSchema>
export type ExportFormat = z.infer<typeof exportFormatSchema>
export type DecompositionType = z.infer<typeof decompositionTypeSchema>
export type MatrixProperties = z.infer<typeof matrixPropertiesSchema>
export type Matrix = z.infer<typeof matrixSchema>
export type OperationMetadata = z.infer<typeof operationMetadataSchema>
export type MatrixDecomposition = z.infer<typeof matrixDecompositionSchema>
export type MatrixAnalysis = z.infer<typeof matrixAnalysisSchema>
export type MatrixOperation = z.infer<typeof matrixOperationSchema>
export type MatrixTemplate = z.infer<typeof matrixTemplateSchema>
export type MatrixError = z.infer<typeof matrixErrorSchema>
export type MatrixValidation = z.infer<typeof matrixValidationSchema>
