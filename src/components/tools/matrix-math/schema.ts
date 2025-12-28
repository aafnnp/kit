// ==================== Matrix Math Types ====================

/**
 * Operation Type type
 */
export type operationType = "add" | "subtract" | "multiply" | "transpose" | "inverse" | "determinant" | "trace" | "rank" | "eigenvalues" | "lu" | "qr" | "svd" | "solve" | "power"

/**
 * Export Format type
 */
export type exportFormat = "json" | "csv" | "txt" | "matlab" | "python" | "latex" | "mathml"

/**
 * Decomposition Type type
 */
export type decompositionType = "LU" | "QR" | "SVD" | "Eigenvalue"

/**
 * Matrix Properties type
 */
export interface matrixProperties {
  isSquare: boolean,
  isSymmetric: boolean,
  isIdentity: boolean,
  isZero: boolean,
  isDiagonal: boolean,
  isUpperTriangular: boolean,
  isLowerTriangular: boolean,
  isOrthogonal: boolean,
  isInvertible: boolean,
  rank: number
  determinant?: number
  trace?: number
  eigenvalues?: number[]
  condition?: number
}

/**
 * Matrix type
 */
export interface matrix {
  id: string,
  name: string,
  data: number[][],
  rows: number,
  cols: number,
  properties: matrixProperties,
}

/**
 * Operation Metadata type
 */
export interface operationMetadata {
  operationTime: number,
  complexity: number,
  numericalStability: number,
  memoryUsage: number,
  algorithmUsed: string,
}

/**
 * Matrix Decomposition type
 */
export interface matrixDecomposition {
  type: decompositionType,
  factors: matrix[],
  metadata: any,
}

/**
 * Matrix Analysis type
 */
export interface matrixAnalysis {
  dimensions: string,
  sparsity: number,
  norm: number,
  condition: number
  singularValues?: number[]
  decomposition?: matrixDecomposition
}

/**
 * Matrix Operation type
 */
export interface matrixOperation {
  id: string,
  operation: operationType,
  matrices: matrix[],
  result: matrix | number | null,
  metadata: operationMetadata,
  analysis: matrixAnalysis,
  timestamp: Date,
}

/**
 * Matrix Template type
 */
export interface matrixTemplate {
  id: string,
  name: string,
  description: string,
  category: string,
  matrices: matrix[],
  operation: operationType,
  useCase: string[],
  difficulty: "simple"| "medium" | "complex",
}

/**
 * Matrix Error type
 */
export interface matrixError {
  message: string,
  type: "dimension"| "format" | "numerical" | "operation",
  severity: "error"| "warning" | "info",
  position?: number,
  row?: number,
  col?: number,
}
/**
 * Matrix Validation type
 */
export interface matrixValidation {
  isValid: boolean,
  errors: matrixError[],
  warnings: string[],
  suggestions: string[],
  qualityScore: number,
}

// ==================== Type Exports ====================

export type OperationType = operationType
export type ExportFormat = exportFormat
export type DecompositionType = decompositionType
export type MatrixProperties = matrixProperties
export type Matrix = matrix
export type OperationMetadata = operationMetadata
export type MatrixDecomposition = matrixDecomposition
export type MatrixAnalysis = matrixAnalysis
export type MatrixOperation = matrixOperation
export type MatrixTemplate = matrixTemplate
export type MatrixError = matrixError
export type MatrixValidation = matrixValidation
