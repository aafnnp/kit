// Matrix Math 相关类型声明
export interface MatrixOperation {
  id: string
  operation: OperationType
  matrices: Matrix[]
  result: Matrix | number | null
  metadata: OperationMetadata
  analysis: MatrixAnalysis
  timestamp: Date
}

export interface Matrix {
  id: string
  name: string
  data: number[][]
  rows: number
  cols: number
  properties: MatrixProperties
}

export interface MatrixProperties {
  isSquare: boolean
  isSymmetric: boolean
  isIdentity: boolean
  isZero: boolean
  isDiagonal: boolean
  isUpperTriangular: boolean
  isLowerTriangular: boolean
  isOrthogonal: boolean
  isInvertible: boolean
  rank: number
  determinant?: number
  trace?: number
  eigenvalues?: number[]
  condition?: number
}

export interface OperationMetadata {
  operationTime: number
  complexity: number
  numericalStability: number
  memoryUsage: number
  algorithmUsed: string
}

export interface MatrixAnalysis {
  dimensions: string
  sparsity: number
  norm: number
  condition: number
  singularValues?: number[]
  decomposition?: MatrixDecomposition
}

export interface MatrixDecomposition {
  type: 'LU' | 'QR' | 'SVD' | 'Eigenvalue'
  factors: Matrix[]
  metadata: any
}

export interface MatrixTemplate {
  id: string
  name: string
  description: string
  category: string
  matrices: Matrix[]
  operation: OperationType
  useCase: string[]
  difficulty: 'simple' | 'medium' | 'complex'
}

export interface MatrixValidation {
  isValid: boolean
  errors: MatrixError[]
  warnings: string[]
  suggestions: string[]
  qualityScore: number
}

export interface MatrixError {
  message: string
  type: 'dimension' | 'format' | 'numerical' | 'operation'
  severity: 'error' | 'warning' | 'info'
  position?: { row: number; col: number }
}

export type OperationType =
  | 'add'
  | 'subtract'
  | 'multiply'
  | 'transpose'
  | 'inverse'
  | 'determinant'
  | 'trace'
  | 'rank'
  | 'eigenvalues'
  | 'lu'
  | 'qr'
  | 'svd'
  | 'solve'
  | 'power'

export type ExportFormat = 'json' | 'csv' | 'txt' | 'matlab' | 'python' | 'latex' | 'mathml'
