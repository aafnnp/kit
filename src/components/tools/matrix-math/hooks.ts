import { useState, useCallback, useRef } from 'react'
import { getWorkerManager } from '@/lib/worker-manager'
import type { Matrix, MatrixOperation, OperationType, MatrixAnalysis } from '@/types/matrix-math'

export interface UseMatrixOperationsReturn {
  executeOperation: (operation: OperationType, matrices: Matrix[], params?: any) => Promise<MatrixOperation>
  isProcessing: boolean
  progress: number
  cancelProcessing: () => void
}

// Worker 返回结果的最小约束类型
interface MatrixWorkerResult {
  result: Matrix | number | null | { data?: number[][] } | number[] | number[][] | null
  metadata?: {
    complexity?: number
    algorithmUsed?: string
  }
}

/**
 * 优化的矩阵运算钩子，支持Web Worker并行处理
 */
export function useMatrixOperations(
  onProgress?: (progress: number, message?: string) => void,
  onComplete?: (result: MatrixOperation) => void,
  onError?: (error: string) => void
): UseMatrixOperationsReturn {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const workerManager = useRef(getWorkerManager())
  const activeTaskId = useRef<string | null>(null)

  const executeOperation = useCallback(
    async (operation: OperationType, matrices: Matrix[], params?: any): Promise<MatrixOperation> => {
      setIsProcessing(true)
      setProgress(0)

      const taskId = `matrix-${operation}-${Date.now()}`
      activeTaskId.current = taskId

      try {
        const startTime = performance.now()

        // 准备数据
        const data = {
          operation,
          matrices: matrices.map((m) => ({
            data: m.data,
            rows: m.rows,
            cols: m.cols,
          })),
          params,
        }

        const workerResult = await workerManager.current.addTask<typeof data, MatrixWorkerResult>({
          id: taskId,
          type: `matrix-${operation}`,
          data,
          priority: 'high',
          onProgress: (value: number) => {
            setProgress(value)
            onProgress?.(value)
          },
          onError: (err: Error) => {
            onError?.(err.message)
            setProgress(0)
            activeTaskId.current = null
          },
        })

        const endTime = performance.now()

        const opResult = workerResult?.result as unknown as Matrix | number | null

        const primaryMatrix = matrices[0]
        const analysis: MatrixAnalysis = {
          dimensions: primaryMatrix ? `${primaryMatrix.rows}x${primaryMatrix.cols}` : '0x0',
          sparsity: primaryMatrix ? computeSparsity(primaryMatrix) : 0,
          norm: primaryMatrix ? computeFrobeniusNorm(primaryMatrix) : 0,
          condition: primaryMatrix ? estimateConditionNumber(primaryMatrix) : 0,
          singularValues: undefined,
          decomposition: undefined,
        }

        const matrixOperation: MatrixOperation = {
          id: generateId(),
          operation,
          matrices,
          result: opResult,
          metadata: {
            operationTime: endTime - startTime,
            complexity: workerResult?.metadata?.complexity ?? 0,
            numericalStability: calculateNumericalStability(matrices),
            memoryUsage: calculateMemoryUsage(matrices, workerResult?.result),
            algorithmUsed: workerResult?.metadata?.algorithmUsed ?? '',
          },
          analysis,
          timestamp: new Date(),
        }

        onComplete?.(matrixOperation)
        setProgress(100)
        activeTaskId.current = null

        return matrixOperation
      } catch (error) {
        setIsProcessing(false)
        setProgress(0)
        activeTaskId.current = null
        throw error
      } finally {
        setIsProcessing(false)
      }
    },
    [onProgress, onComplete, onError]
  )

  const cancelProcessing = useCallback(() => {
    if (activeTaskId.current) {
      workerManager.current.cancelTask(activeTaskId.current)
      activeTaskId.current = null
    }
    setIsProcessing(false)
    setProgress(0)
  }, [])

  return {
    executeOperation,
    isProcessing,
    progress,
    cancelProcessing,
  }
}

/**
 * 矩阵验证钩子
 */
export function useMatrixValidation() {
  const validateMatrixOperation = useCallback((operation: OperationType, matrices: Matrix[]) => {
    const expectedCount = getExpectedMatrixCount(operation)

    if (matrices.length !== expectedCount) {
      return {
        isValid: false,
        error: `Operation '${operation}' requires ${expectedCount} matrix(es), but ${matrices.length} provided`,
      }
    }

    switch (operation) {
      case 'add':
      case 'subtract':
        if (matrices[0].rows !== matrices[1].rows || matrices[0].cols !== matrices[1].cols) {
          return {
            isValid: false,
            error: 'Matrices must have the same dimensions for addition/subtraction',
          }
        }
        break

      case 'multiply':
        if (matrices[0].cols !== matrices[1].rows) {
          return {
            isValid: false,
            error: 'Number of columns in first matrix must equal number of rows in second matrix',
          }
        }
        break

      case 'inverse':
      case 'determinant':
      case 'eigenvalues':
      case 'power':
        if (matrices[0].rows !== matrices[0].cols) {
          return {
            isValid: false,
            error: 'Matrix must be square for this operation',
          }
        }
        break

      case 'lu':
      case 'qr':
      case 'svd':
        // 这些分解操作对矩阵形状没有严格要求
        break

      case 'solve':
        if (matrices.length !== 2) {
          return {
            isValid: false,
            error: 'Linear system solving requires exactly 2 matrices (A and b)',
          }
        }
        if (matrices[0].rows !== matrices[0].cols) {
          return {
            isValid: false,
            error: 'Coefficient matrix must be square',
          }
        }
        if (matrices[0].rows !== matrices[1].rows) {
          return {
            isValid: false,
            error: 'Coefficient matrix rows must match constant vector rows',
          }
        }
        if (matrices[1].cols !== 1) {
          return {
            isValid: false,
            error: 'Constant vector must be a column vector',
          }
        }
        break
    }

    return { isValid: true }
  }, [])

  return { validateMatrixOperation }
}

/**
 * 矩阵分析钩子
 */
export function useMatrixAnalysis() {
  const analyzeMatrix = useCallback((matrix: Matrix) => {
    const { data, rows, cols } = matrix

    // 基本属性
    const isSquare = rows === cols
    const isZero = data.every((row) => row.every((val) => Math.abs(val) < 1e-10))

    let isSymmetric = false
    let isIdentity = false
    let isDiagonal = false
    let isUpperTriangular = false
    let isLowerTriangular = false
    let determinant: number | undefined
    let trace: number | undefined
    let rank: number | undefined

    if (isSquare) {
      // 对称性检查
      isSymmetric = data.every((row, i) => row.every((val, j) => Math.abs(val - data[j][i]) < 1e-10))

      // 单位矩阵检查
      isIdentity = data.every((row, i) => row.every((val, j) => Math.abs(val - (i === j ? 1 : 0)) < 1e-10))

      // 对角矩阵检查
      isDiagonal = data.every((row, i) => row.every((val, j) => i === j || Math.abs(val) < 1e-10))

      // 上三角矩阵检查
      isUpperTriangular = data.every((row, i) => row.every((val, j) => j >= i || Math.abs(val) < 1e-10))

      // 下三角矩阵检查
      isLowerTriangular = data.every((row, i) => row.every((val, j) => j <= i || Math.abs(val) < 1e-10))

      // 计算迹
      trace = data.reduce((sum, row, i) => sum + row[i], 0)
    }

    // 计算范数
    const frobeniusNorm = Math.sqrt(
      data.reduce((sum, row) => sum + row.reduce((rowSum, val) => rowSum + val * val, 0), 0)
    )

    // 计算稀疏度
    const totalElements = rows * cols
    const nonZeroElements = data.reduce(
      (count, row) => count + row.reduce((rowCount, val) => rowCount + (Math.abs(val) > 1e-10 ? 1 : 0), 0),
      0
    )
    const sparsity = 1 - nonZeroElements / totalElements

    return {
      isSquare,
      isZero,
      isSymmetric,
      isIdentity,
      isDiagonal,
      isUpperTriangular,
      isLowerTriangular,
      determinant,
      trace,
      rank,
      frobeniusNorm,
      sparsity,
      nonZeroElements,
      totalElements,
    }
  }, [])

  return { analyzeMatrix }
}

// 辅助函数
function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

function calculateNumericalStability(matrices: Matrix[]): number {
  // 简化的数值稳定性评估
  let stability = 1.0

  for (const matrix of matrices) {
    const { data } = matrix

    // 检查条件数的近似值
    const maxElement = Math.max(...data.flat().map(Math.abs))
    const minElement = Math.min(
      ...data
        .flat()
        .filter((x) => Math.abs(x) > 1e-10)
        .map(Math.abs)
    )

    if (minElement > 0) {
      const conditionEstimate = maxElement / minElement
      stability *= Math.max(0.1, 1 / Math.log10(conditionEstimate + 1))
    }
  }

  return Math.max(0, Math.min(1, stability))
}

function calculateMemoryUsage(matrices: Matrix[], result: any): number {
  let totalElements = 0

  // 计算输入矩阵的元素总数
  for (const matrix of matrices) {
    totalElements += matrix.rows * matrix.cols
  }

  // 计算结果的元素数
  if (result && typeof result === 'object') {
    if (Array.isArray(result)) {
      if (Array.isArray(result[0])) {
        // 二维数组（矩阵）
        totalElements += result.length * result[0].length
      } else {
        // 一维数组（向量）
        totalElements += result.length
      }
    } else if (result.data && Array.isArray(result.data)) {
      // 矩阵对象
      totalElements += result.data.length * result.data[0].length
    }
  }

  // 假设每个数字占用8字节（double precision）
  return totalElements * 8
}

function getExpectedMatrixCount(operation: OperationType): number {
  switch (operation) {
    case 'add':
    case 'subtract':
    case 'multiply':
    case 'solve':
      return 2
    case 'transpose':
    case 'inverse':
    case 'determinant':
    case 'rank':
    case 'eigenvalues':
    case 'lu':
    case 'qr':
    case 'svd':
    case 'power':
      return 1
    default:
      return 1
  }
}

export { generateId, calculateNumericalStability, calculateMemoryUsage, getExpectedMatrixCount }

// 本地计算：与 MatrixAnalysis 字段对应的简单估计函数
function computeFrobeniusNorm(matrix: Matrix): number {
  return Math.sqrt(matrix.data.reduce((sum, row) => sum + row.reduce((rowSum, val) => rowSum + val * val, 0), 0))
}

function computeSparsity(matrix: Matrix): number {
  const totalElements = matrix.rows * matrix.cols
  const nonZero = matrix.data.reduce(
    (count, row) => count + row.reduce((acc, val) => acc + (Math.abs(val) > 1e-10 ? 1 : 0), 0),
    0
  )
  return 1 - nonZero / totalElements
}

function estimateConditionNumber(matrix: Matrix): number {
  const flat = matrix.data.flat().map(Math.abs)
  const maxVal = Math.max(...flat)
  const nonZero = flat.filter((v) => v > 1e-10)
  if (nonZero.length === 0) return 0
  const minNonZero = Math.min(...nonZero)
  if (!isFinite(maxVal) || !isFinite(minNonZero) || minNonZero <= 0) return 0
  return maxVal / minNonZero
}
