import { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  Download,
  Trash2,
  Copy,
  Check,
  Shuffle,
  Zap,
  Settings,
  BookOpen,
  Eye,
  Clock,
  Plus,
  Grid,
  CircleDot,
  Wand2,
  Calculator,
  Equal,
  SquareFunction,
} from 'lucide-react'
import { nanoid } from 'nanoid'
// Enhanced Types
interface MatrixOperation {
  id: string
  operation: OperationType
  matrices: Matrix[]
  result: Matrix | number | null
  metadata: OperationMetadata
  analysis: MatrixAnalysis
  timestamp: Date
}

interface Matrix {
  id: string
  name: string
  data: number[][]
  rows: number
  cols: number
  properties: MatrixProperties
}

interface MatrixProperties {
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

interface OperationMetadata {
  operationTime: number
  complexity: number
  numericalStability: number
  memoryUsage: number
  algorithmUsed: string
}

interface MatrixAnalysis {
  dimensions: string
  sparsity: number
  norm: number
  condition: number
  singularValues?: number[]
  decomposition?: MatrixDecomposition
}

interface MatrixDecomposition {
  type: 'LU' | 'QR' | 'SVD' | 'Eigenvalue'
  factors: Matrix[]
  metadata: any
}

interface MatrixTemplate {
  id: string
  name: string
  description: string
  category: string
  matrices: Matrix[]
  operation: OperationType
  useCase: string[]
  difficulty: 'simple' | 'medium' | 'complex'
}

interface MatrixValidation {
  isValid: boolean
  errors: MatrixError[]
  warnings: string[]
  suggestions: string[]
  qualityScore: number
}

interface MatrixError {
  message: string
  type: 'dimension' | 'format' | 'numerical' | 'operation'
  severity: 'error' | 'warning' | 'info'
  position?: { row: number; col: number }
}

// Enums
type OperationType =
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
type ExportFormat = 'json' | 'csv' | 'txt' | 'matlab' | 'python' | 'latex' | 'mathml'

// Utility functions

const formatNumber = (num: number, precision: number = 6): string => {
  if (Math.abs(num) < 1e-10) return '0'
  if (Math.abs(num) > 1e6 || Math.abs(num) < 1e-3) {
    return num.toExponential(precision)
  }
  return parseFloat(num.toFixed(precision)).toString()
}

// Matrix creation and manipulation functions
const createMatrix = (rows: number, cols: number, data?: number[][]): Matrix => {
  const matrixData =
    data ||
    Array(rows)
      .fill(0)
      .map(() => Array(cols).fill(0))

  return {
    id: nanoid(),
    name: `Matrix_${rows}x${cols}`,
    data: matrixData,
    rows,
    cols,
    properties: analyzeMatrixProperties(matrixData),
  }
}

const createIdentityMatrix = (size: number): Matrix => {
  const data = Array(size)
    .fill(0)
    .map((_, i) =>
      Array(size)
        .fill(0)
        .map((_, j) => (i === j ? 1 : 0))
    )

  return {
    id: nanoid(),
    name: `Identity_${size}x${size}`,
    data,
    rows: size,
    cols: size,
    properties: analyzeMatrixProperties(data),
  }
}

const createZeroMatrix = (rows: number, cols: number): Matrix => {
  const data = Array(rows)
    .fill(0)
    .map(() => Array(cols).fill(0))

  return {
    id: nanoid(),
    name: `Zero_${rows}x${cols}`,
    data,
    rows,
    cols,
    properties: analyzeMatrixProperties(data),
  }
}

const createRandomMatrix = (rows: number, cols: number, min: number = -10, max: number = 10): Matrix => {
  const data = Array(rows)
    .fill(0)
    .map(() =>
      Array(cols)
        .fill(0)
        .map(() => Math.floor(Math.random() * (max - min + 1)) + min)
    )

  return {
    id: nanoid(),
    name: `Random_${rows}x${cols}`,
    data,
    rows,
    cols,
    properties: analyzeMatrixProperties(data),
  }
}

// Matrix property analysis
const analyzeMatrixProperties = (data: number[][]): MatrixProperties => {
  const rows = data.length
  const cols = data[0]?.length || 0

  const isSquare = rows === cols
  const isZero = data.every((row) => row.every((val) => Math.abs(val) < 1e-10))

  let isSymmetric = false
  let isIdentity = false
  let isDiagonal = false
  let isUpperTriangular = false
  let isLowerTriangular = false
  let isOrthogonal = false
  let determinant: number | undefined
  let trace: number | undefined

  if (isSquare) {
    // Check symmetry
    isSymmetric = data.every((row, i) => row.every((val, j) => Math.abs(val - data[j][i]) < 1e-10))

    // Check identity
    isIdentity = data.every((row, i) => row.every((val, j) => Math.abs(val - (i === j ? 1 : 0)) < 1e-10))

    // Check diagonal
    isDiagonal = data.every((row, i) => row.every((val, j) => i === j || Math.abs(val) < 1e-10))

    // Check triangular
    isUpperTriangular = data.every((row, i) => row.every((val, j) => j >= i || Math.abs(val) < 1e-10))

    isLowerTriangular = data.every((row, i) => row.every((val, j) => j <= i || Math.abs(val) < 1e-10))

    // Calculate trace
    trace = data.reduce((sum, row, i) => sum + row[i], 0)

    // Calculate determinant for small matrices
    if (rows <= 4) {
      determinant = calculateDeterminant(data)
    }
  }

  // Calculate rank
  const rank = calculateRank(data)

  const isInvertible = isSquare && rank === rows && Math.abs(determinant || 0) > 1e-10

  return {
    isSquare,
    isSymmetric,
    isIdentity,
    isZero,
    isDiagonal,
    isUpperTriangular,
    isLowerTriangular,
    isOrthogonal,
    isInvertible,
    rank,
    determinant,
    trace,
  }
}

// Basic matrix operations
const addMatrices = (a: Matrix, b: Matrix): Matrix => {
  if (a.rows !== b.rows || a.cols !== b.cols) {
    throw new Error('Matrices must have the same dimensions for addition')
  }

  const result = a.data.map((row, i) => row.map((val, j) => val + b.data[i][j]))

  return createMatrix(a.rows, a.cols, result)
}

const subtractMatrices = (a: Matrix, b: Matrix): Matrix => {
  if (a.rows !== b.rows || a.cols !== b.cols) {
    throw new Error('Matrices must have the same dimensions for subtraction')
  }

  const result = a.data.map((row, i) => row.map((val, j) => val - b.data[i][j]))

  return createMatrix(a.rows, a.cols, result)
}

const multiplyMatrices = (a: Matrix, b: Matrix): Matrix => {
  if (a.cols !== b.rows) {
    throw new Error('Number of columns in first matrix must equal number of rows in second matrix')
  }

  const result = Array(a.rows)
    .fill(0)
    .map(() => Array(b.cols).fill(0))

  for (let i = 0; i < a.rows; i++) {
    for (let j = 0; j < b.cols; j++) {
      for (let k = 0; k < a.cols; k++) {
        result[i][j] += a.data[i][k] * b.data[k][j]
      }
    }
  }

  return createMatrix(a.rows, b.cols, result)
}

const transposeMatrix = (matrix: Matrix): Matrix => {
  const result = Array(matrix.cols)
    .fill(0)
    .map(() => Array(matrix.rows).fill(0))

  for (let i = 0; i < matrix.rows; i++) {
    for (let j = 0; j < matrix.cols; j++) {
      result[j][i] = matrix.data[i][j]
    }
  }

  return createMatrix(matrix.cols, matrix.rows, result)
}

// Advanced matrix operations
const calculateDeterminant = (data: number[][]): number => {
  const n = data.length

  if (n === 1) return data[0][0]
  if (n === 2) return data[0][0] * data[1][1] - data[0][1] * data[1][0]

  if (n === 3) {
    return (
      data[0][0] * (data[1][1] * data[2][2] - data[1][2] * data[2][1]) -
      data[0][1] * (data[1][0] * data[2][2] - data[1][2] * data[2][0]) +
      data[0][2] * (data[1][0] * data[2][1] - data[1][1] * data[2][0])
    )
  }

  // For larger matrices, use LU decomposition
  const { U } = luDecomposition(data)
  let det = 1
  for (let i = 0; i < n; i++) {
    det *= U[i][i]
  }
  return det
}

const calculateRank = (data: number[][]): number => {
  const matrix = data.map((row) => [...row]) // Copy matrix
  const rows = matrix.length
  const cols = matrix[0]?.length || 0

  let rank = 0

  for (let col = 0; col < cols && rank < rows; col++) {
    // Find pivot
    let pivotRow = rank
    for (let row = rank + 1; row < rows; row++) {
      if (Math.abs(matrix[row][col]) > Math.abs(matrix[pivotRow][col])) {
        pivotRow = row
      }
    }

    if (Math.abs(matrix[pivotRow][col]) < 1e-10) continue

    // Swap rows
    if (pivotRow !== rank) {
      ;[matrix[rank], matrix[pivotRow]] = [matrix[pivotRow], matrix[rank]]
    }

    // Eliminate
    for (let row = rank + 1; row < rows; row++) {
      const factor = matrix[row][col] / matrix[rank][col]
      for (let c = col; c < cols; c++) {
        matrix[row][c] -= factor * matrix[rank][c]
      }
    }

    rank++
  }

  return rank
}

// Matrix decomposition functions
const luDecomposition = (data: number[][]): { L: number[][]; U: number[][] } => {
  const n = data.length
  const L = Array(n)
    .fill(0)
    .map(() => Array(n).fill(0))
  const U = Array(n)
    .fill(0)
    .map(() => Array(n).fill(0))

  for (let i = 0; i < n; i++) {
    // Upper triangular matrix
    for (let k = i; k < n; k++) {
      let sum = 0
      for (let j = 0; j < i; j++) {
        sum += L[i][j] * U[j][k]
      }
      U[i][k] = data[i][k] - sum
    }

    // Lower triangular matrix
    for (let k = i; k < n; k++) {
      if (i === k) {
        L[i][i] = 1
      } else {
        let sum = 0
        for (let j = 0; j < i; j++) {
          sum += L[k][j] * U[j][i]
        }
        L[k][i] = (data[k][i] - sum) / U[i][i]
      }
    }
  }

  return { L, U }
}

const inverseMatrix = (matrix: Matrix): Matrix => {
  if (!matrix.properties.isSquare) {
    throw new Error('Matrix must be square to calculate inverse')
  }

  if (!matrix.properties.isInvertible) {
    throw new Error('Matrix is not invertible (determinant is zero)')
  }

  const n = matrix.rows
  const augmented = matrix.data.map((row, i) => [
    ...row,
    ...Array(n)
      .fill(0)
      .map((_, j) => (i === j ? 1 : 0)),
  ])

  // Gaussian elimination
  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxRow = i
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
        maxRow = k
      }
    }

    // Swap rows
    ;[augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]]

    // Make diagonal element 1
    const pivot = augmented[i][i]
    for (let j = 0; j < 2 * n; j++) {
      augmented[i][j] /= pivot
    }

    // Eliminate column
    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const factor = augmented[k][i]
        for (let j = 0; j < 2 * n; j++) {
          augmented[k][j] -= factor * augmented[i][j]
        }
      }
    }
  }

  // Extract inverse matrix
  const inverse = augmented.map((row) => row.slice(n))
  return createMatrix(n, n, inverse)
}

const matrixPower = (matrix: Matrix, power: number): Matrix => {
  if (!matrix.properties.isSquare) {
    throw new Error('Matrix must be square for exponentiation')
  }

  if (power === 0) {
    return createIdentityMatrix(matrix.rows)
  }

  if (power === 1) {
    return matrix
  }

  if (power < 0) {
    const inv = inverseMatrix(matrix)
    return matrixPower(inv, -power)
  }

  let result = createIdentityMatrix(matrix.rows)
  let base = matrix
  let exp = power

  while (exp > 0) {
    if (exp % 2 === 1) {
      result = multiplyMatrices(result, base)
    }
    base = multiplyMatrices(base, base)
    exp = Math.floor(exp / 2)
  }

  return result
}

// Matrix analysis functions
const calculateNorm = (matrix: Matrix, type: 'frobenius' | '1' | 'inf' = 'frobenius'): number => {
  switch (type) {
    case 'frobenius':
      return Math.sqrt(matrix.data.reduce((sum, row) => sum + row.reduce((rowSum, val) => rowSum + val * val, 0), 0))

    case '1':
      return Math.max(
        ...Array(matrix.cols)
          .fill(0)
          .map((_, j) => matrix.data.reduce((sum, row) => sum + Math.abs(row[j]), 0))
      )

    case 'inf':
      return Math.max(...matrix.data.map((row) => row.reduce((sum, val) => sum + Math.abs(val), 0)))

    default:
      return 0
  }
}

const calculateConditionNumber = (matrix: Matrix): number => {
  if (!matrix.properties.isSquare || !matrix.properties.isInvertible) {
    return Number.POSITIVE_INFINITY
  }

  try {
    const inverse = inverseMatrix(matrix)
    const normA = calculateNorm(matrix, 'frobenius')
    const normInv = calculateNorm(inverse, 'frobenius')
    return normA * normInv
  } catch {
    return Number.POSITIVE_INFINITY
  }
}

const calculateSparsity = (matrix: Matrix): number => {
  const totalElements = matrix.rows * matrix.cols
  const zeroElements = matrix.data.reduce(
    (count, row) => count + row.reduce((rowCount, val) => rowCount + (Math.abs(val) < 1e-10 ? 1 : 0), 0),
    0
  )
  return zeroElements / totalElements
}

// Matrix operation execution
const executeMatrixOperation = (operation: OperationType, matrices: Matrix[], params?: any): MatrixOperation => {
  const startTime = performance.now()

  let result: Matrix | number | null = null
  let algorithmUsed = ''

  try {
    switch (operation) {
      case 'add':
        if (matrices.length !== 2) throw new Error('Addition requires exactly 2 matrices')
        result = addMatrices(matrices[0], matrices[1])
        algorithmUsed = 'Element-wise addition'
        break

      case 'subtract':
        if (matrices.length !== 2) throw new Error('Subtraction requires exactly 2 matrices')
        result = subtractMatrices(matrices[0], matrices[1])
        algorithmUsed = 'Element-wise subtraction'
        break

      case 'multiply':
        if (matrices.length !== 2) throw new Error('Multiplication requires exactly 2 matrices')
        result = multiplyMatrices(matrices[0], matrices[1])
        algorithmUsed = 'Standard matrix multiplication'
        break

      case 'transpose':
        if (matrices.length !== 1) throw new Error('Transpose requires exactly 1 matrix')
        result = transposeMatrix(matrices[0])
        algorithmUsed = 'Matrix transposition'
        break

      case 'inverse':
        if (matrices.length !== 1) throw new Error('Inverse requires exactly 1 matrix')
        result = inverseMatrix(matrices[0])
        algorithmUsed = 'Gaussian elimination'
        break

      case 'determinant':
        if (matrices.length !== 1) throw new Error('Determinant requires exactly 1 matrix')
        if (!matrices[0].properties.isSquare) throw new Error('Determinant requires a square matrix')
        result = calculateDeterminant(matrices[0].data)
        algorithmUsed = matrices[0].rows <= 3 ? 'Direct calculation' : 'LU decomposition'
        break

      case 'trace':
        if (matrices.length !== 1) throw new Error('Trace requires exactly 1 matrix')
        if (!matrices[0].properties.isSquare) throw new Error('Trace requires a square matrix')
        result = matrices[0].properties.trace || 0
        algorithmUsed = 'Diagonal sum'
        break

      case 'rank':
        if (matrices.length !== 1) throw new Error('Rank requires exactly 1 matrix')
        result = matrices[0].properties.rank
        algorithmUsed = 'Gaussian elimination'
        break

      case 'power':
        if (matrices.length !== 1) throw new Error('Power requires exactly 1 matrix')
        const power = params?.power || 2
        result = matrixPower(matrices[0], power)
        algorithmUsed = 'Binary exponentiation'
        break

      default:
        throw new Error(`Unsupported operation: ${operation}`)
    }
  } catch (error) {
    throw error
  }

  const endTime = performance.now()
  const operationTime = endTime - startTime

  // Calculate metadata
  const complexity = calculateOperationComplexity(operation, matrices)
  const numericalStability = calculateNumericalStability(matrices)
  const memoryUsage = calculateMemoryUsage(matrices, result)

  // Analyze result
  const analysis = analyzeOperation(operation, matrices)

  return {
    id: nanoid(),
    operation,
    matrices,
    result,
    metadata: {
      operationTime,
      complexity,
      numericalStability,
      memoryUsage,
      algorithmUsed,
    },
    analysis,
    timestamp: new Date(),
  }
}

// Helper functions for operation analysis
const calculateOperationComplexity = (operation: OperationType, matrices: Matrix[]): number => {
  const matrix = matrices[0]
  const m = matrix.rows
  const n = matrix.cols

  switch (operation) {
    case 'add':
    case 'subtract':
      return m * n
    case 'multiply':
      const matrix2 = matrices[1]
      return m * n * matrix2.cols
    case 'transpose':
      return m * n
    case 'inverse':
      return Math.pow(m, 3)
    case 'determinant':
      return Math.pow(m, 3)
    case 'trace':
    case 'rank':
      return Math.pow(m, 2)
    default:
      return m * n
  }
}

const calculateNumericalStability = (matrices: Matrix[]): number => {
  let stability = 1.0

  // Check for very large or very small numbers
  for (const matrix of matrices) {
    for (const row of matrix.data) {
      for (const val of row) {
        if (Math.abs(val) > 1e6 || (Math.abs(val) < 1e-6 && Math.abs(val) > 0)) {
          stability *= 0.9
        }
      }
    }
  }

  // Check condition number for square matrices
  for (const matrix of matrices) {
    if (matrix.properties.isSquare && matrix.properties.condition) {
      if (matrix.properties.condition > 1e12) {
        stability *= 0.5
      } else if (matrix.properties.condition > 1e6) {
        stability *= 0.8
      }
    }
  }

  return Math.max(0.1, stability)
}

const calculateMemoryUsage = (matrices: Matrix[], result: Matrix | number | null): number => {
  let usage = 0

  for (const matrix of matrices) {
    usage += matrix.rows * matrix.cols * 8 // 8 bytes per number
  }

  if (result && typeof result === 'object') {
    usage += result.rows * result.cols * 8
  }

  return usage
}

const analyzeOperation = (_operation: OperationType, matrices: Matrix[]): MatrixAnalysis => {
  const matrix = matrices[0]

  return {
    dimensions: `${matrix.rows}×${matrix.cols}`,
    sparsity: calculateSparsity(matrix),
    norm: calculateNorm(matrix),
    condition: calculateConditionNumber(matrix),
    singularValues: undefined, // Would require SVD implementation
    decomposition: undefined,
  }
}

// Matrix parsing and validation
const parseMatrixString = (input: string): number[][] => {
  try {
    // Handle different formats
    let cleaned = input.trim()

    // Remove outer brackets if present
    cleaned = cleaned.replace(/^\[|\]$/g, '')

    // Split by semicolon or newline for rows
    const rows = cleaned
      .split(/[;\n]/)
      .map((row) => row.trim())
      .filter((row) => row.length > 0)

    const matrix = rows.map((row) => {
      // Remove brackets and split by comma or space
      const cleanRow = row.replace(/^\[|\]$/g, '').trim()
      const values = cleanRow.split(/[,\s]+/).filter((val) => val.length > 0)

      return values.map((val) => {
        const num = parseFloat(val)
        if (isNaN(num)) {
          throw new Error(`Invalid number: ${val}`)
        }
        return num
      })
    })

    // Validate rectangular matrix
    if (matrix.length === 0) {
      throw new Error('Matrix cannot be empty')
    }

    const cols = matrix[0].length
    if (cols === 0) {
      throw new Error('Matrix rows cannot be empty')
    }

    for (let i = 1; i < matrix.length; i++) {
      if (matrix[i].length !== cols) {
        throw new Error(`Row ${i + 1} has ${matrix[i].length} elements, expected ${cols}`)
      }
    }

    return matrix
  } catch (error: any) {
    throw new Error(`Matrix parsing error: ${error?.message}`)
  }
}

const validateMatrixOperation = (operation: OperationType, matrices: Matrix[]): MatrixValidation => {
  const validation: MatrixValidation = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
    qualityScore: 100,
  }

  // Check matrix count
  const expectedCount = getExpectedMatrixCount(operation)
  if (matrices.length !== expectedCount) {
    validation.isValid = false
    validation.errors.push({
      message: `Operation '${operation}' requires ${expectedCount} matrix(es), got ${matrices.length}`,
      type: 'operation',
      severity: 'error',
    })
    validation.qualityScore -= 50
    return validation
  }

  // Operation-specific validations
  switch (operation) {
    case 'add':
    case 'subtract':
      if (matrices[0].rows !== matrices[1].rows || matrices[0].cols !== matrices[1].cols) {
        validation.isValid = false
        validation.errors.push({
          message: 'Matrices must have the same dimensions for addition/subtraction',
          type: 'dimension',
          severity: 'error',
        })
        validation.qualityScore -= 40
      }
      break

    case 'multiply':
      if (matrices[0].cols !== matrices[1].rows) {
        validation.isValid = false
        validation.errors.push({
          message: 'Number of columns in first matrix must equal number of rows in second matrix',
          type: 'dimension',
          severity: 'error',
        })
        validation.qualityScore -= 40
      }
      break

    case 'inverse':
    case 'determinant':
    case 'trace':
      if (!matrices[0].properties.isSquare) {
        validation.isValid = false
        validation.errors.push({
          message: `Operation '${operation}' requires a square matrix`,
          type: 'dimension',
          severity: 'error',
        })
        validation.qualityScore -= 40
      }

      if (operation === 'inverse' && !matrices[0].properties.isInvertible) {
        validation.isValid = false
        validation.errors.push({
          message: 'Matrix is not invertible (determinant is zero or near zero)',
          type: 'numerical',
          severity: 'error',
        })
        validation.qualityScore -= 30
      }
      break
  }

  // General warnings
  for (const matrix of matrices) {
    if (matrix.rows > 10 || matrix.cols > 10) {
      validation.warnings.push('Large matrices may impact performance')
      validation.qualityScore -= 5
    }

    if (calculateSparsity(matrix) > 0.8) {
      validation.suggestions.push('Consider using sparse matrix algorithms for better performance')
      validation.qualityScore -= 5
    }

    const condition = calculateConditionNumber(matrix)
    if (condition > 1e12) {
      validation.warnings.push('Matrix is ill-conditioned - results may be numerically unstable')
      validation.qualityScore -= 15
    } else if (condition > 1e6) {
      validation.warnings.push('Matrix has high condition number - be cautious of numerical errors')
      validation.qualityScore -= 10
    }
  }

  // Quality suggestions
  if (validation.qualityScore >= 90) {
    validation.suggestions.push('Excellent matrix setup for computation')
  } else if (validation.qualityScore >= 70) {
    validation.suggestions.push('Good matrices with minor considerations')
  } else if (validation.qualityScore >= 50) {
    validation.suggestions.push('Matrices need improvement for optimal computation')
  } else {
    validation.suggestions.push('Matrices have significant issues')
  }

  return validation
}

const getExpectedMatrixCount = (operation: OperationType): number => {
  switch (operation) {
    case 'add':
    case 'subtract':
    case 'multiply':
      return 2
    case 'transpose':
    case 'inverse':
    case 'determinant':
    case 'trace':
    case 'rank':
    case 'power':
      return 1
    default:
      return 1
  }
}

// Matrix templates
const matrixTemplates: MatrixTemplate[] = [
  {
    id: 'basic-2x2',
    name: 'Basic 2×2 Matrices',
    description: 'Simple 2×2 matrices for basic operations',
    category: 'Basic',
    matrices: [
      createMatrix(2, 2, [
        [1, 2],
        [3, 4],
      ]),
      createMatrix(2, 2, [
        [5, 6],
        [7, 8],
      ]),
    ],
    operation: 'add',
    useCase: ['Learning', 'Basic operations', 'Introduction to matrices'],
    difficulty: 'simple',
  },
  {
    id: 'identity-matrices',
    name: 'Identity Matrices',
    description: 'Identity matrices for multiplication properties',
    category: 'Special',
    matrices: [
      createMatrix(3, 3, [
        [2, 1, 0],
        [1, 3, 1],
        [0, 1, 2],
      ]),
      createIdentityMatrix(3),
    ],
    operation: 'multiply',
    useCase: ['Identity properties', 'Matrix multiplication', 'Linear algebra'],
    difficulty: 'simple',
  },
  {
    id: 'symmetric-matrix',
    name: 'Symmetric Matrix',
    description: 'Symmetric matrix for eigenvalue analysis',
    category: 'Special',
    matrices: [
      createMatrix(3, 3, [
        [4, 1, 2],
        [1, 3, 0],
        [2, 0, 5],
      ]),
    ],
    operation: 'determinant',
    useCase: ['Eigenvalues', 'Symmetric properties', 'Quadratic forms'],
    difficulty: 'medium',
  },
  {
    id: 'rotation-matrix',
    name: 'Rotation Matrix',
    description: '2D rotation matrix (45 degrees)',
    category: 'Geometric',
    matrices: [
      createMatrix(2, 2, [
        [Math.cos(Math.PI / 4), -Math.sin(Math.PI / 4)],
        [Math.sin(Math.PI / 4), Math.cos(Math.PI / 4)],
      ]),
    ],
    operation: 'inverse',
    useCase: ['Rotations', 'Computer graphics', 'Geometric transformations'],
    difficulty: 'medium',
  },
  {
    id: 'singular-matrix',
    name: 'Singular Matrix',
    description: 'Non-invertible matrix for rank analysis',
    category: 'Special',
    matrices: [
      createMatrix(3, 3, [
        [1, 2, 3],
        [2, 4, 6],
        [1, 2, 3],
      ]),
    ],
    operation: 'rank',
    useCase: ['Rank analysis', 'Linear dependence', 'Null space'],
    difficulty: 'medium',
  },
  {
    id: 'large-sparse',
    name: 'Large Sparse Matrix',
    description: 'Large matrix with many zeros',
    category: 'Performance',
    matrices: [
      createMatrix(5, 5, [
        [1, 0, 0, 0, 2],
        [0, 3, 0, 0, 0],
        [0, 0, 4, 0, 0],
        [0, 0, 0, 5, 0],
        [6, 0, 0, 0, 7],
      ]),
    ],
    operation: 'transpose',
    useCase: ['Sparse matrices', 'Performance testing', 'Large systems'],
    difficulty: 'medium',
  },
  {
    id: 'ill-conditioned',
    name: 'Ill-conditioned Matrix',
    description: 'Matrix with high condition number',
    category: 'Numerical',
    matrices: [
      createMatrix(3, 3, [
        [1, 1, 1],
        [1, 1.0001, 1],
        [1, 1, 1.0001],
      ]),
    ],
    operation: 'inverse',
    useCase: ['Numerical stability', 'Condition numbers', 'Error analysis'],
    difficulty: 'complex',
  },
  {
    id: 'matrix-power',
    name: 'Matrix Powers',
    description: 'Matrix for exponentiation testing',
    category: 'Advanced',
    matrices: [
      createMatrix(2, 2, [
        [2, 1],
        [0, 2],
      ]),
    ],
    operation: 'power',
    useCase: ['Matrix exponentiation', 'Markov chains', 'Recurrence relations'],
    difficulty: 'complex',
  },
]

// Custom hooks
const useMatrixOperations = () => {
  const [operations, setOperations] = useState<MatrixOperation[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const executeOperation = useCallback(
    async (operation: OperationType, matrices: Matrix[], params?: any): Promise<MatrixOperation> => {
      setIsProcessing(true)
      try {
        const result = executeMatrixOperation(operation, matrices, params)
        setOperations((prev) => [result, ...prev.slice(0, 99)]) // Keep last 100 operations
        return result
      } finally {
        setIsProcessing(false)
      }
    },
    []
  )

  const clearOperations = useCallback(() => {
    setOperations([])
  }, [])

  const removeOperation = useCallback((id: string) => {
    setOperations((prev) => prev.filter((op) => op.id !== id))
  }, [])

  return {
    operations,
    isProcessing,
    executeOperation,
    clearOperations,
    removeOperation,
  }
}

// Copy to clipboard functionality
const useCopyToClipboard = () => {
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const copyToClipboard = useCallback(async (text: string, label?: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(label || 'text')
      toast.success(`${label || 'Text'} copied to clipboard`)

      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedText(null), 2000)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }, [])

  return { copyToClipboard, copiedText }
}

// Export functionality
const useMatrixExport = () => {
  const exportOperation = useCallback((operation: MatrixOperation, format: ExportFormat, filename?: string) => {
    let content = ''
    let mimeType = 'text/plain'
    let extension = '.txt'

    switch (format) {
      case 'json':
        content = JSON.stringify(operation, null, 2)
        mimeType = 'application/json'
        extension = '.json'
        break
      case 'csv':
        content = generateCSVFromOperation(operation)
        mimeType = 'text/csv'
        extension = '.csv'
        break
      case 'txt':
        content = generateTextFromOperation(operation)
        mimeType = 'text/plain'
        extension = '.txt'
        break
      case 'matlab':
        content = generateMatlabFromOperation(operation)
        mimeType = 'text/plain'
        extension = '.m'
        break
      case 'python':
        content = generatePythonFromOperation(operation)
        mimeType = 'text/plain'
        extension = '.py'
        break
      case 'latex':
        content = generateLatexFromOperation(operation)
        mimeType = 'text/plain'
        extension = '.tex'
        break
      default:
        content = generateTextFromOperation(operation)
        break
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename || `matrix-operation-${operation.id}${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const exportMatrix = useCallback((matrix: Matrix, format: ExportFormat, filename?: string) => {
    let content = ''
    let mimeType = 'text/plain'
    let extension = '.txt'

    switch (format) {
      case 'json':
        content = JSON.stringify(matrix, null, 2)
        mimeType = 'application/json'
        extension = '.json'
        break
      case 'csv':
        content = matrix.data.map((row) => row.join(',')).join('\n')
        mimeType = 'text/csv'
        extension = '.csv'
        break
      case 'matlab':
        content = `${matrix.name} = [${matrix.data.map((row) => row.join(' ')).join('; ')}];`
        mimeType = 'text/plain'
        extension = '.m'
        break
      case 'python':
        content = `import numpy as np\n${matrix.name} = np.array([${matrix.data.map((row) => `[${row.join(', ')}]`).join(', ')}])`
        mimeType = 'text/plain'
        extension = '.py'
        break
      default:
        content = matrix.data.map((row) => row.join('\t')).join('\n')
        break
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename || `matrix-${matrix.id}${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  return { exportOperation, exportMatrix }
}

// Helper functions for export formats
const generateCSVFromOperation = (operation: MatrixOperation): string => {
  const headers = ['Property', 'Value']
  const rows = [
    ['Operation', operation.operation],
    ['Operation Time (ms)', operation.metadata.operationTime.toFixed(2)],
    ['Algorithm', operation.metadata.algorithmUsed],
    ['Complexity', operation.metadata.complexity.toString()],
    ['Numerical Stability', operation.metadata.numericalStability.toFixed(3)],
    ['Memory Usage (bytes)', operation.metadata.memoryUsage.toString()],
  ]

  if (typeof operation.result === 'number') {
    rows.push(['Result', operation.result.toString()])
  } else if (operation.result) {
    rows.push(['Result Dimensions', `${operation.result.rows}×${operation.result.cols}`])
  }

  return [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n')
}

const generateTextFromOperation = (operation: MatrixOperation): string => {
  let content = `Matrix Operation Report - ${operation.timestamp.toLocaleString()}\n\n`

  content += `=== OPERATION ===\n`
  content += `Type: ${operation.operation.toUpperCase()}\n`
  content += `Algorithm: ${operation.metadata.algorithmUsed}\n\n`

  content += `=== INPUT MATRICES ===\n`
  operation.matrices.forEach((matrix, index) => {
    content += `Matrix ${index + 1} (${matrix.rows}×${matrix.cols}):\n`
    content += matrix.data.map((row) => row.map((val) => formatNumber(val)).join('\t')).join('\n')
    content += '\n\n'
  })

  content += `=== RESULT ===\n`
  if (typeof operation.result === 'number') {
    content += `Scalar Result: ${formatNumber(operation.result)}\n`
  } else if (operation.result) {
    content += `Result Matrix (${operation.result.rows}×${operation.result.cols}):\n`
    content += operation.result.data.map((row) => row.map((val) => formatNumber(val)).join('\t')).join('\n')
  } else {
    content += 'No result\n'
  }

  content += `\n=== PERFORMANCE ===\n`
  content += `Operation Time: ${operation.metadata.operationTime.toFixed(2)} ms\n`
  content += `Complexity: ${operation.metadata.complexity}\n`
  content += `Numerical Stability: ${operation.metadata.numericalStability.toFixed(3)}\n`
  content += `Memory Usage: ${operation.metadata.memoryUsage} bytes\n`

  return content
}

const generateMatlabFromOperation = (operation: MatrixOperation): string => {
  let content = `% Matrix Operation: ${operation.operation}\n`
  content += `% Generated on ${operation.timestamp.toLocaleString()}\n\n`

  operation.matrices.forEach((matrix, index) => {
    content += `A${index + 1} = [${matrix.data.map((row) => row.join(' ')).join('; ')}];\n`
  })

  content += '\n'

  switch (operation.operation) {
    case 'add':
      content += 'result = A1 + A2;\n'
      break
    case 'subtract':
      content += 'result = A1 - A2;\n'
      break
    case 'multiply':
      content += 'result = A1 * A2;\n'
      break
    case 'transpose':
      content += "result = A1';\n"
      break
    case 'inverse':
      content += 'result = inv(A1);\n'
      break
    case 'determinant':
      content += 'result = det(A1);\n'
      break
    case 'trace':
      content += 'result = trace(A1);\n'
      break
    case 'rank':
      content += 'result = rank(A1);\n'
      break
  }

  return content
}

const generatePythonFromOperation = (operation: MatrixOperation): string => {
  let content = `# Matrix Operation: ${operation.operation}\n`
  content += `# Generated on ${operation.timestamp.toLocaleString()}\n\n`
  content += `import numpy as np\n\n`

  operation.matrices.forEach((matrix, index) => {
    content += `A${index + 1} = np.array([${matrix.data.map((row) => `[${row.join(', ')}]`).join(', ')}])\n`
  })

  content += '\n'

  switch (operation.operation) {
    case 'add':
      content += 'result = A1 + A2\n'
      break
    case 'subtract':
      content += 'result = A1 - A2\n'
      break
    case 'multiply':
      content += 'result = np.dot(A1, A2)\n'
      break
    case 'transpose':
      content += 'result = A1.T\n'
      break
    case 'inverse':
      content += 'result = np.linalg.inv(A1)\n'
      break
    case 'determinant':
      content += 'result = np.linalg.det(A1)\n'
      break
    case 'trace':
      content += 'result = np.trace(A1)\n'
      break
    case 'rank':
      content += 'result = np.linalg.matrix_rank(A1)\n'
      break
  }

  return content
}

const generateLatexFromOperation = (operation: MatrixOperation): string => {
  let content = `\\documentclass{article}\n`
  content += `\\usepackage{amsmath}\n`
  content += `\\begin{document}\n\n`
  content += `\\section{Matrix Operation: ${operation.operation}}\n\n`

  operation.matrices.forEach((matrix, index) => {
    content += `\\subsection{Matrix ${index + 1}}\n`
    content += `\\[\n\\begin{bmatrix}\n`
    content += matrix.data.map((row) => row.map((val) => formatNumber(val)).join(' & ')).join(' \\\\\n')
    content += `\n\\end{bmatrix}\n\\]\n\n`
  })

  if (operation.result && typeof operation.result === 'object') {
    content += `\\subsection{Result}\n`
    content += `\\[\n\\begin{bmatrix}\n`
    content += operation.result.data.map((row) => row.map((val) => formatNumber(val)).join(' & ')).join(' \\\\\n')
    content += `\n\\end{bmatrix}\n\\]\n\n`
  } else if (typeof operation.result === 'number') {
    content += `\\subsection{Result}\n`
    content += `\\[${formatNumber(operation.result)}\\]\n\n`
  }

  content += `\\end{document}`
  return content
}

/**
 * Enhanced Matrix Math & Linear Algebra Tool
 * Features: Advanced matrix operations, linear algebra functions, matrix analysis, and comprehensive mathematical computation
 */
const MatrixMathCore = () => {
  const [activeTab, setActiveTab] = useState<'calculator' | 'builder' | 'history' | 'templates' | 'settings'>(
    'calculator'
  )
  const [matrices, setMatrices] = useState<Matrix[]>([
    createMatrix(2, 2, [
      [1, 2],
      [3, 4],
    ]),
    createMatrix(2, 2, [
      [5, 6],
      [7, 8],
    ]),
  ])
  const [selectedOperation, setSelectedOperation] = useState<OperationType>('add')
  const [currentResult, setCurrentResult] = useState<MatrixOperation | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [matrixInput, setMatrixInput] = useState<string>('')
  const [matrixRows, setMatrixRows] = useState(3)
  const [matrixCols, setMatrixCols] = useState(3)

  const { operations, isProcessing, executeOperation, clearOperations, removeOperation } = useMatrixOperations()
  const { exportOperation, exportMatrix } = useMatrixExport()
  const { copyToClipboard, copiedText } = useCopyToClipboard()

  // Apply template
  const applyTemplate = useCallback((templateId: string) => {
    const template = matrixTemplates.find((t) => t.id === templateId)
    if (template) {
      setMatrices([...template.matrices])
      setSelectedOperation(template.operation)
      setSelectedTemplate(templateId)
      toast.success(`Applied template: ${template.name}`)
    }
  }, [])

  // Execute matrix operation
  const handleExecuteOperation = useCallback(async () => {
    const validation = validateMatrixOperation(selectedOperation, matrices)
    if (!validation.isValid) {
      toast.error(`Operation error: ${validation.errors[0]?.message}`)
      return
    }

    try {
      const result = await executeOperation(selectedOperation, matrices)
      setCurrentResult(result)
      toast.success(`Operation '${selectedOperation}' completed successfully`)
    } catch (error: any) {
      toast.error(`Failed to execute operation: ${error?.message}`)
      console.error(error)
    }
  }, [selectedOperation, matrices, executeOperation])

  // Add matrix from input
  const handleAddMatrix = useCallback(() => {
    if (!matrixInput.trim()) {
      toast.error('Please enter matrix data')
      return
    }

    try {
      const data = parseMatrixString(matrixInput)
      const newMatrix = createMatrix(data.length, data[0].length, data)
      setMatrices((prev) => [...prev, newMatrix])
      setMatrixInput('')
      toast.success(`Added ${data.length}×${data[0].length} matrix`)
    } catch (error: any) {
      toast.error(`Matrix parsing error: ${error?.message}`)
    }
  }, [matrixInput])

  // Create new matrix
  const handleCreateMatrix = useCallback(
    (type: 'zero' | 'identity' | 'random') => {
      let newMatrix: Matrix

      switch (type) {
        case 'zero':
          newMatrix = createZeroMatrix(matrixRows, matrixCols)
          break
        case 'identity':
          if (matrixRows !== matrixCols) {
            toast.error('Identity matrix must be square')
            return
          }
          newMatrix = createIdentityMatrix(matrixRows)
          break
        case 'random':
          newMatrix = createRandomMatrix(matrixRows, matrixCols)
          break
        default:
          return
      }

      setMatrices((prev) => [...prev, newMatrix])
      toast.success(`Created ${newMatrix.rows}×${newMatrix.cols} ${type} matrix`)
    },
    [matrixRows, matrixCols]
  )

  // Remove matrix
  const handleRemoveMatrix = useCallback((index: number) => {
    setMatrices((prev) => prev.filter((_, i) => i !== index))
    toast.success('Matrix removed')
  }, [])

  // Format matrix for display
  const formatMatrixDisplay = useCallback((matrix: Matrix): string => {
    return matrix.data.map((row) => '[' + row.map((val) => formatNumber(val, 3)).join(', ') + ']').join('\n')
  }, [])

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Skip link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50"
      >
        Skip to main content
      </a>

      <div id="main-content" className="flex flex-col gap-4">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {/* <Matrix className="h-5 w-5" aria-hidden="true" /> */}
              Matrix Math & Linear Algebra Tool
            </CardTitle>
            <CardDescription>
              Advanced matrix mathematics tool with support for linear algebra operations, matrix analysis, and
              comprehensive mathematical computation. Perform matrix operations, analyze properties, and explore linear
              algebra concepts with detailed analysis. Use keyboard navigation: Tab to move between controls, Enter or
              Space to activate buttons.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="calculator" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Calculator
            </TabsTrigger>
            <TabsTrigger value="builder" className="flex items-center gap-2">
              <Grid className="h-4 w-4" />
              Builder
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Matrix Calculator Tab */}
          <TabsContent value="calculator" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Operation Setup */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <SquareFunction className="h-5 w-5" />
                    Matrix Operation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="operation" className="text-sm font-medium">
                      Operation Type
                    </Label>
                    <Select
                      value={selectedOperation}
                      onValueChange={(value) => setSelectedOperation(value as OperationType)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="add">Addition (A + B)</SelectItem>
                        <SelectItem value="subtract">Subtraction (A - B)</SelectItem>
                        <SelectItem value="multiply">Multiplication (A × B)</SelectItem>
                        <SelectItem value="transpose">Transpose (A^T)</SelectItem>
                        <SelectItem value="inverse">Inverse (A^-1)</SelectItem>
                        <SelectItem value="determinant">Determinant (det(A))</SelectItem>
                        <SelectItem value="trace">Trace (tr(A))</SelectItem>
                        <SelectItem value="rank">Rank (rank(A))</SelectItem>
                        <SelectItem value="power">Power (A^n)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Available Matrices ({matrices.length})</Label>
                    {matrices.map((matrix, index) => (
                      <div key={matrix.id} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium text-sm">
                            Matrix {index + 1} ({matrix.rows}×{matrix.cols})
                          </div>
                          <Button size="sm" variant="ghost" onClick={() => handleRemoveMatrix(index)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-xs font-mono bg-muted p-2 rounded max-h-20 overflow-y-auto">
                          {formatMatrixDisplay(matrix)}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" variant="outline" onClick={() => exportMatrix(matrix, 'json')}>
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(formatMatrixDisplay(matrix), 'Matrix')}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={handleExecuteOperation}
                    disabled={isProcessing || matrices.length === 0}
                    className="w-full"
                  >
                    {isProcessing ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                    ) : (
                      <Zap className="mr-2 h-4 w-4" />
                    )}
                    {isProcessing ? 'Computing...' : `Execute ${selectedOperation}`}
                  </Button>
                </CardContent>
              </Card>

              {/* Result Display */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Equal className="h-5 w-5" />
                    Result
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {currentResult ? (
                    <div className="space-y-4">
                      {/* Operation Info */}
                      <div className="text-center p-4 rounded-lg border">
                        <div className="text-lg font-medium mb-2">{currentResult.operation.toUpperCase()}</div>
                        <div className="text-sm text-muted-foreground">{currentResult.metadata.algorithmUsed}</div>
                      </div>

                      {/* Result Value */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Result</Label>
                        {typeof currentResult.result === 'number' ? (
                          <div className="p-3 bg-muted rounded-lg text-center">
                            <div className="text-2xl font-bold text-blue-600">{formatNumber(currentResult.result)}</div>
                            <div className="text-sm text-muted-foreground">Scalar Value</div>
                          </div>
                        ) : currentResult.result ? (
                          <div className="space-y-2">
                            <div className="text-sm text-muted-foreground">
                              Matrix ({currentResult.result.rows}×{currentResult.result.cols})
                            </div>
                            <div className="text-xs font-mono bg-muted p-3 rounded max-h-40 overflow-y-auto">
                              {formatMatrixDisplay(currentResult.result)}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-muted-foreground">No result</div>
                        )}
                      </div>

                      {/* Performance Metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">
                            {currentResult.metadata.operationTime.toFixed(2)}ms
                          </div>
                          <div className="text-xs text-muted-foreground">Time</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">{currentResult.metadata.complexity}</div>
                          <div className="text-xs text-muted-foreground">Complexity</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-orange-600">
                            {currentResult.metadata.numericalStability.toFixed(2)}
                          </div>
                          <div className="text-xs text-muted-foreground">Stability</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-purple-600">
                            {Math.round(currentResult.metadata.memoryUsage / 1024)}KB
                          </div>
                          <div className="text-xs text-muted-foreground">Memory</div>
                        </div>
                      </div>

                      {/* Matrix Properties */}
                      {currentResult.result && typeof currentResult.result === 'object' && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Matrix Properties</Label>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {Object.entries(currentResult.result.properties).map(([key, value]) => (
                              <div key={key} className="flex justify-between p-2 bg-muted rounded">
                                <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                <span
                                  className={
                                    typeof value === 'boolean'
                                      ? value
                                        ? 'text-green-600'
                                        : 'text-red-600'
                                      : 'text-blue-600'
                                  }
                                >
                                  {typeof value === 'boolean'
                                    ? value
                                      ? 'Yes'
                                      : 'No'
                                    : typeof value === 'number'
                                      ? formatNumber(value)
                                      : value?.toString() || 'N/A'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Export Options */}
                      <div className="flex gap-2 pt-4 border-t">
                        <Button onClick={() => exportOperation(currentResult, 'json')} variant="outline" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          JSON
                        </Button>
                        <Button onClick={() => exportOperation(currentResult, 'matlab')} variant="outline" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          MATLAB
                        </Button>
                        <Button onClick={() => exportOperation(currentResult, 'python')} variant="outline" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          Python
                        </Button>
                        <Button
                          onClick={() => {
                            const resultText =
                              typeof currentResult.result === 'number'
                                ? currentResult.result.toString()
                                : currentResult.result
                                  ? formatMatrixDisplay(currentResult.result)
                                  : 'No result'
                            copyToClipboard(resultText, 'Result')
                          }}
                          variant="outline"
                          size="sm"
                        >
                          {copiedText === 'Result' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      {/* <Matrix className="mx-auto h-12 w-12 text-muted-foreground mb-4" /> */}
                      <h3 className="text-lg font-semibold mb-2">No Result</h3>
                      <p className="text-muted-foreground">Execute a matrix operation to see the result</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Matrix Builder Tab */}
          <TabsContent value="builder" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Matrix Input */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Grid className="h-5 w-5" />
                    Matrix Input
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="matrix-input" className="text-sm font-medium">
                      Matrix Data
                    </Label>
                    <Textarea
                      id="matrix-input"
                      value={matrixInput}
                      onChange={(e) => setMatrixInput(e.target.value)}
                      placeholder="Enter matrix data:&#10;1,2,3&#10;4,5,6&#10;7,8,9&#10;&#10;Or: 1 2 3; 4 5 6; 7 8 9"
                      className="mt-2 font-mono"
                      rows={6}
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      Formats: comma/space separated, semicolon/newline for rows
                    </div>
                  </div>

                  <Button onClick={handleAddMatrix} disabled={!matrixInput.trim()} className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Matrix
                  </Button>
                </CardContent>
              </Card>

              {/* Matrix Generator */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Wand2 className="h-5 w-5" />
                    Matrix Generator
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="matrix-rows" className="text-sm font-medium">
                        Rows
                      </Label>
                      <Input
                        id="matrix-rows"
                        type="number"
                        value={matrixRows}
                        onChange={(e) => setMatrixRows(parseInt(e.target.value) || 3)}
                        className="mt-2"
                        min="1"
                        max="10"
                      />
                    </div>
                    <div>
                      <Label htmlFor="matrix-cols" className="text-sm font-medium">
                        Columns
                      </Label>
                      <Input
                        id="matrix-cols"
                        type="number"
                        value={matrixCols}
                        onChange={(e) => setMatrixCols(parseInt(e.target.value) || 3)}
                        className="mt-2"
                        min="1"
                        max="10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Generate Matrix</Label>
                    <div className="grid grid-cols-1 gap-2">
                      <Button onClick={() => handleCreateMatrix('zero')} variant="outline" className="w-full">
                        <CircleDot className="mr-2 h-4 w-4" />
                        Zero Matrix
                      </Button>
                      <Button
                        onClick={() => handleCreateMatrix('identity')}
                        variant="outline"
                        className="w-full"
                        disabled={matrixRows !== matrixCols}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Identity Matrix
                      </Button>
                      <Button onClick={() => handleCreateMatrix('random')} variant="outline" className="w-full">
                        <Shuffle className="mr-2 h-4 w-4" />
                        Random Matrix
                      </Button>
                    </div>
                  </div>

                  {/* Quick Templates */}
                  <div className="space-y-2 border-t pt-4">
                    <Label className="text-sm font-medium">Quick Templates</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {matrixTemplates.slice(0, 4).map((template) => (
                        <Button
                          key={template.id}
                          onClick={() => applyTemplate(template.id)}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          {template.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Operation History</CardTitle>
                <CardDescription>View and manage your matrix operation history</CardDescription>
              </CardHeader>
              <CardContent>
                {operations.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        {operations.length} operation{operations.length !== 1 ? 's' : ''} in history
                      </span>
                      <Button onClick={clearOperations} variant="outline" size="sm">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Clear History
                      </Button>
                    </div>

                    {operations.map((operation) => (
                      <div key={operation.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium text-sm">
                            {operation.operation.toUpperCase()} - {operation.timestamp.toLocaleString()}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-1 bg-muted rounded">
                              {operation.metadata.algorithmUsed}
                            </span>
                            <Button size="sm" variant="ghost" onClick={() => removeOperation(operation.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-sm">
                            <strong>Matrices:</strong> {operation.matrices.map((m) => `${m.rows}×${m.cols}`).join(', ')}
                          </div>
                          <div className="text-sm">
                            <strong>Result:</strong>{' '}
                            {typeof operation.result === 'number'
                              ? formatNumber(operation.result)
                              : operation.result
                                ? `${operation.result.rows}×${operation.result.cols} matrix`
                                : 'No result'}
                          </div>
                          <div className="grid grid-cols-4 gap-4 text-xs text-center">
                            <div>
                              <div className="font-medium">{operation.metadata.operationTime.toFixed(2)}ms</div>
                              <div className="text-muted-foreground">Time</div>
                            </div>
                            <div>
                              <div className="font-medium">{operation.metadata.complexity}</div>
                              <div className="text-muted-foreground">Complexity</div>
                            </div>
                            <div>
                              <div className="font-medium">{operation.metadata.numericalStability.toFixed(2)}</div>
                              <div className="text-muted-foreground">Stability</div>
                            </div>
                            <div>
                              <div className="font-medium">{Math.round(operation.metadata.memoryUsage / 1024)}KB</div>
                              <div className="text-muted-foreground">Memory</div>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setMatrices([...operation.matrices])
                              setSelectedOperation(operation.operation)
                              setCurrentResult(operation)
                              setActiveTab('calculator')
                            }}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => exportOperation(operation, 'json')}>
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const resultText =
                                typeof operation.result === 'number'
                                  ? operation.result.toString()
                                  : operation.result
                                    ? formatMatrixDisplay(operation.result)
                                    : 'No result'
                              copyToClipboard(resultText, 'Result')
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No History</h3>
                    <p className="text-muted-foreground">Perform some matrix operations to see them here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Matrix Templates</CardTitle>
                <CardDescription>Pre-built matrix examples for learning and testing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {matrixTemplates.map((template) => (
                    <div
                      key={template.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedTemplate === template.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                      }`}
                      onClick={() => applyTemplate(template.id)}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">{template.name}</h4>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-1 bg-muted rounded">{template.category}</span>
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                template.difficulty === 'simple'
                                  ? 'bg-green-100 text-green-800'
                                  : template.difficulty === 'medium'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {template.difficulty}
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">{template.description}</div>
                        <div>
                          <div className="text-xs font-medium mb-1">Matrices ({template.matrices.length}):</div>
                          <div className="text-xs text-muted-foreground">
                            {template.matrices.map((m) => `${m.rows}×${m.cols}`).join(', ')}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium mb-1">Operation:</div>
                          <div className="text-xs text-muted-foreground capitalize">{template.operation}</div>
                        </div>
                        <div>
                          <div className="text-xs font-medium mb-1">Use Cases:</div>
                          <div className="text-xs text-muted-foreground">{template.useCase.join(', ')}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Matrix Settings</CardTitle>
                <CardDescription>Configure matrix computation preferences and display options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Precision Settings */}
                <div className="space-y-4">
                  <h4 className="font-medium">Precision & Display</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>Matrix elements are displayed with up to 6 decimal places for clarity</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>Very small numbers (&lt; 1e-10) are treated as zero</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>Scientific notation is used for very large or very small numbers</div>
                    </div>
                  </div>
                </div>

                {/* Algorithm Information */}
                <div className="space-y-4">
                  <h4 className="font-medium">Algorithms & Methods</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h5 className="font-medium text-sm mb-2">Matrix Multiplication</h5>
                      <p className="text-xs text-muted-foreground">
                        Uses standard O(n³) algorithm for matrix multiplication.
                        <br />
                        Optimized for numerical stability and accuracy.
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h5 className="font-medium text-sm mb-2">Matrix Inversion</h5>
                      <p className="text-xs text-muted-foreground">
                        Uses Gaussian elimination with partial pivoting for numerical stability.
                        <br />
                        Automatically detects singular matrices and provides appropriate error messages.
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h5 className="font-medium text-sm mb-2">Determinant Calculation</h5>
                      <p className="text-xs text-muted-foreground">
                        Uses direct calculation for 2×2 and 3×3 matrices, LU decomposition for larger matrices.
                        <br />
                        Provides optimal performance for different matrix sizes.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Performance Tips */}
                <div className="space-y-4">
                  <h4 className="font-medium">Performance & Best Practices</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>Matrices larger than 10×10 may impact performance</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>Ill-conditioned matrices may produce numerically unstable results</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>Sparse matrices (many zeros) are detected and flagged for optimization</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-pink-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>Matrix properties are automatically analyzed for mathematical insights</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Main component with error boundary
const MatrixMath = () => {
  return <MatrixMathCore />
}

export default MatrixMath
