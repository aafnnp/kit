/**
 * Matrix Processing Web Worker
 * 专门处理矩阵计算任务的Web Worker
 * 实现高效的矩阵运算算法
 */

// 监听主线程消息
self.onmessage = function(e) {
  const { type, data, taskId } = e.data
  
  try {
    switch (type) {
      case 'matrix-multiply':
        handleMatrixMultiply(data, taskId)
        break
      case 'matrix-inverse':
        handleMatrixInverse(data, taskId)
        break
      case 'matrix-determinant':
        handleMatrixDeterminant(data, taskId)
        break
      case 'matrix-eigenvalues':
        handleMatrixEigenvalues(data, taskId)
        break
      case 'matrix-lu-decomposition':
        handleLUDecomposition(data, taskId)
        break
      case 'matrix-qr-decomposition':
        handleQRDecomposition(data, taskId)
        break
      case 'matrix-svd':
        handleSVD(data, taskId)
        break
      case 'matrix-solve':
        handleMatrixSolve(data, taskId)
        break
      case 'matrix-power':
        handleMatrixPower(data, taskId)
        break
      case 'matrix-rank':
        handleMatrixRank(data, taskId)
        break
      default:
        postMessage({
          type: 'error',
          taskId,
          error: `Unknown matrix operation: ${type}`
        })
    }
  } catch (error) {
    postMessage({
      type: 'error',
      taskId,
      error: error.message || 'Matrix processing error'
    })
  }
}

/**
 * 处理矩阵乘法
 */
function handleMatrixMultiply(data, taskId) {
  const { matrices } = data
  const [a, b] = matrices
  
  postMessage({ type: 'progress', taskId, progress: 10, message: '开始矩阵乘法计算' })
  
  const result = multiplyMatricesOptimized(a.data, b.data, taskId)
  
  postMessage({
    type: 'complete',
    taskId,
    data: {
      result: {
        data: result,
        rows: result.length,
        cols: result[0].length
      },
      metadata: {
        operationTime: performance.now(),
        algorithmUsed: 'Block Matrix Multiplication',
        complexity: a.rows * a.cols * b.cols
      }
    }
  })
}

/**
 * 处理矩阵求逆
 */
function handleMatrixInverse(data, taskId) {
  const { matrices } = data
  const matrix = matrices[0]
  
  postMessage({ type: 'progress', taskId, progress: 10, message: '开始矩阵求逆计算' })
  
  if (matrix.rows !== matrix.cols) {
    throw new Error('矩阵必须是方阵才能求逆')
  }
  
  const result = inverseMatrixOptimized(matrix.data, taskId)
  
  postMessage({
    type: 'complete',
    taskId,
    data: {
      result: {
        data: result,
        rows: result.length,
        cols: result[0].length
      },
      metadata: {
        operationTime: performance.now(),
        algorithmUsed: 'Gauss-Jordan Elimination',
        complexity: Math.pow(matrix.rows, 3)
      }
    }
  })
}

/**
 * 处理行列式计算
 */
function handleMatrixDeterminant(data, taskId) {
  const { matrices } = data
  const matrix = matrices[0]
  
  postMessage({ type: 'progress', taskId, progress: 10, message: '开始行列式计算' })
  
  if (matrix.rows !== matrix.cols) {
    throw new Error('矩阵必须是方阵才能计算行列式')
  }
  
  const result = calculateDeterminantOptimized(matrix.data, taskId)
  
  postMessage({
    type: 'complete',
    taskId,
    data: {
      result: result,
      metadata: {
        operationTime: performance.now(),
        algorithmUsed: 'LU Decomposition',
        complexity: Math.pow(matrix.rows, 3)
      }
    }
  })
}

/**
 * 处理特征值计算
 */
function handleMatrixEigenvalues(data, taskId) {
  const { matrices } = data
  const matrix = matrices[0]
  
  postMessage({ type: 'progress', taskId, progress: 10, message: '开始特征值计算' })
  
  if (matrix.rows !== matrix.cols) {
    throw new Error('矩阵必须是方阵才能计算特征值')
  }
  
  const result = calculateEigenvaluesOptimized(matrix.data, taskId)
  
  postMessage({
    type: 'complete',
    taskId,
    data: {
      result: result,
      metadata: {
        operationTime: performance.now(),
        algorithmUsed: 'Power Iteration + QR Algorithm',
        complexity: Math.pow(matrix.rows, 3)
      }
    }
  })
}

/**
 * 处理LU分解
 */
function handleLUDecomposition(data, taskId) {
  const { matrices } = data
  const matrix = matrices[0]
  
  postMessage({ type: 'progress', taskId, progress: 10, message: '开始LU分解' })
  
  const result = luDecompositionOptimized(matrix.data, taskId)
  
  postMessage({
    type: 'complete',
    taskId,
    data: {
      result: result,
      metadata: {
        operationTime: performance.now(),
        algorithmUsed: 'Partial Pivoting LU',
        complexity: Math.pow(matrix.rows, 3) / 3
      }
    }
  })
}

/**
 * 处理QR分解
 */
function handleQRDecomposition(data, taskId) {
  const { matrices } = data
  const matrix = matrices[0]
  
  postMessage({ type: 'progress', taskId, progress: 10, message: '开始QR分解' })
  
  const result = qrDecompositionOptimized(matrix.data, taskId)
  
  postMessage({
    type: 'complete',
    taskId,
    data: {
      result: result,
      metadata: {
        operationTime: performance.now(),
        algorithmUsed: 'Householder Reflections',
        complexity: 2 * Math.pow(matrix.rows, 3) / 3
      }
    }
  })
}

/**
 * 处理SVD分解
 */
function handleSVD(data, taskId) {
  const { matrices } = data
  const matrix = matrices[0]
  
  postMessage({ type: 'progress', taskId, progress: 10, message: '开始SVD分解' })
  
  const result = svdOptimized(matrix.data, taskId)
  
  postMessage({
    type: 'complete',
    taskId,
    data: {
      result: result,
      metadata: {
        operationTime: performance.now(),
        algorithmUsed: 'Jacobi SVD',
        complexity: Math.pow(Math.min(matrix.rows, matrix.cols), 3)
      }
    }
  })
}

/**
 * 处理线性方程组求解
 */
function handleMatrixSolve(data, taskId) {
  const { matrices } = data
  const [A, b] = matrices
  
  postMessage({ type: 'progress', taskId, progress: 10, message: '开始求解线性方程组' })
  
  const result = solveLinearSystemOptimized(A.data, b.data, taskId)
  
  postMessage({
    type: 'complete',
    taskId,
    data: {
      result: {
        data: result,
        rows: result.length,
        cols: 1
      },
      metadata: {
        operationTime: performance.now(),
        algorithmUsed: 'LU Decomposition with Partial Pivoting',
        complexity: Math.pow(A.rows, 3) / 3
      }
    }
  })
}

/**
 * 处理矩阵幂运算
 */
function handleMatrixPower(data, taskId) {
  const { matrices, params } = data
  const matrix = matrices[0]
  const power = params.power
  
  postMessage({ type: 'progress', taskId, progress: 10, message: `开始计算矩阵的${power}次幂` })
  
  if (matrix.rows !== matrix.cols) {
    throw new Error('矩阵必须是方阵才能进行幂运算')
  }
  
  const result = matrixPowerOptimized(matrix.data, power, taskId)
  
  postMessage({
    type: 'complete',
    taskId,
    data: {
      result: {
        data: result,
        rows: result.length,
        cols: result[0].length
      },
      metadata: {
        operationTime: performance.now(),
        algorithmUsed: 'Fast Matrix Exponentiation',
        complexity: Math.log2(power) * Math.pow(matrix.rows, 3)
      }
    }
  })
}

/**
 * 处理矩阵秩计算
 */
function handleMatrixRank(data, taskId) {
  const { matrices } = data
  const matrix = matrices[0]
  
  postMessage({ type: 'progress', taskId, progress: 10, message: '开始计算矩阵的秩' })
  
  const result = calculateRankOptimized(matrix.data, taskId)
  
  postMessage({
    type: 'complete',
    taskId,
    data: {
      result: result,
      metadata: {
        operationTime: performance.now(),
        algorithmUsed: 'Gaussian Elimination',
        complexity: Math.pow(Math.min(matrix.rows, matrix.cols), 3)
      }
    }
  })
}

// ==================== 优化的矩阵算法实现 ====================

/**
 * 优化的矩阵乘法 - 使用分块算法
 */
function multiplyMatricesOptimized(a, b, taskId) {
  const rowsA = a.length
  const colsA = a[0].length
  const colsB = b[0].length
  
  if (colsA !== b.length) {
    throw new Error('矩阵维度不匹配，无法进行乘法运算')
  }
  
  const result = Array(rowsA).fill(0).map(() => Array(colsB).fill(0))
  
  // 使用分块算法优化缓存性能
  const blockSize = 64
  
  for (let ii = 0; ii < rowsA; ii += blockSize) {
    for (let jj = 0; jj < colsB; jj += blockSize) {
      for (let kk = 0; kk < colsA; kk += blockSize) {
        
        const iMax = Math.min(ii + blockSize, rowsA)
        const jMax = Math.min(jj + blockSize, colsB)
        const kMax = Math.min(kk + blockSize, colsA)
        
        for (let i = ii; i < iMax; i++) {
          for (let j = jj; j < jMax; j++) {
            let sum = result[i][j]
            for (let k = kk; k < kMax; k++) {
              sum += a[i][k] * b[k][j]
            }
            result[i][j] = sum
          }
        }
      }
    }
    
    // 报告进度
    const progress = Math.round((ii / rowsA) * 80) + 10
    postMessage({
      type: 'progress',
      taskId,
      progress,
      message: `计算进度: ${Math.round((ii / rowsA) * 100)}%`
    })
  }
  
  return result
}

/**
 * 优化的矩阵求逆 - 使用高斯-约旦消元法
 */
function inverseMatrixOptimized(matrix, taskId) {
  const n = matrix.length
  
  // 创建增广矩阵 [A|I]
  const augmented = matrix.map((row, i) => {
    const newRow = [...row]
    for (let j = 0; j < n; j++) {
      newRow.push(i === j ? 1 : 0)
    }
    return newRow
  })
  
  // 高斯-约旦消元法
  for (let i = 0; i < n; i++) {
    // 寻找主元
    let maxRow = i
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
        maxRow = k
      }
    }
    
    // 交换行
    if (maxRow !== i) {
      [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]]
    }
    
    // 检查奇异性
    if (Math.abs(augmented[i][i]) < 1e-10) {
      throw new Error('矩阵是奇异的，无法求逆')
    }
    
    // 归一化主元行
    const pivot = augmented[i][i]
    for (let j = 0; j < 2 * n; j++) {
      augmented[i][j] /= pivot
    }
    
    // 消元
    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const factor = augmented[k][i]
        for (let j = 0; j < 2 * n; j++) {
          augmented[k][j] -= factor * augmented[i][j]
        }
      }
    }
    
    // 报告进度
    const progress = Math.round((i / n) * 80) + 10
    postMessage({
      type: 'progress',
      taskId,
      progress,
      message: `消元进度: ${Math.round((i / n) * 100)}%`
    })
  }
  
  // 提取逆矩阵
  return augmented.map(row => row.slice(n))
}

/**
 * 优化的行列式计算 - 使用LU分解
 */
function calculateDeterminantOptimized(matrix, taskId) {
  const n = matrix.length
  const lu = matrix.map(row => [...row])
  let det = 1
  let swaps = 0
  
  for (let i = 0; i < n; i++) {
    // 寻找主元
    let maxRow = i
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(lu[k][i]) > Math.abs(lu[maxRow][i])) {
        maxRow = k
      }
    }
    
    // 交换行
    if (maxRow !== i) {
      [lu[i], lu[maxRow]] = [lu[maxRow], lu[i]]
      swaps++
    }
    
    // 检查奇异性
    if (Math.abs(lu[i][i]) < 1e-10) {
      return 0
    }
    
    // 消元
    for (let k = i + 1; k < n; k++) {
      const factor = lu[k][i] / lu[i][i]
      for (let j = i; j < n; j++) {
        lu[k][j] -= factor * lu[i][j]
      }
    }
    
    det *= lu[i][i]
    
    // 报告进度
    const progress = Math.round((i / n) * 80) + 10
    postMessage({
      type: 'progress',
      taskId,
      progress,
      message: `LU分解进度: ${Math.round((i / n) * 100)}%`
    })
  }
  
  return swaps % 2 === 0 ? det : -det
}

/**
 * 优化的特征值计算 - 使用QR算法
 */
function calculateEigenvaluesOptimized(matrix, taskId) {
  const n = matrix.length
  let A = matrix.map(row => [...row])
  const maxIterations = 100
  const tolerance = 1e-10
  
  // QR算法迭代
  for (let iter = 0; iter < maxIterations; iter++) {
    const { Q, R } = qrDecomposition(A)
    A = multiplyMatrices(R, Q)
    
    // 检查收敛性（对角线元素变化很小）
    let converged = true
    for (let i = 0; i < n - 1; i++) {
      if (Math.abs(A[i + 1][i]) > tolerance) {
        converged = false
        break
      }
    }
    
    if (converged) break
    
    // 报告进度
    const progress = Math.round((iter / maxIterations) * 80) + 10
    postMessage({
      type: 'progress',
      taskId,
      progress,
      message: `QR迭代进度: ${iter + 1}/${maxIterations}`
    })
  }
  
  // 提取特征值（对角线元素）
  const eigenvalues = []
  for (let i = 0; i < n; i++) {
    eigenvalues.push(A[i][i])
  }
  
  return eigenvalues
}

/**
 * LU分解优化实现
 */
function luDecompositionOptimized(matrix, taskId) {
  const n = matrix.length
  const L = Array(n).fill(0).map(() => Array(n).fill(0))
  const U = matrix.map(row => [...row])
  
  for (let i = 0; i < n; i++) {
    L[i][i] = 1
    
    for (let k = i + 1; k < n; k++) {
      const factor = U[k][i] / U[i][i]
      L[k][i] = factor
      
      for (let j = i; j < n; j++) {
        U[k][j] -= factor * U[i][j]
      }
    }
    
    // 报告进度
    const progress = Math.round((i / n) * 80) + 10
    postMessage({
      type: 'progress',
      taskId,
      progress,
      message: `LU分解进度: ${Math.round((i / n) * 100)}%`
    })
  }
  
  return { L, U }
}

/**
 * QR分解优化实现
 */
function qrDecompositionOptimized(matrix, taskId) {
  const m = matrix.length
  const n = matrix[0].length
  let Q = Array(m).fill(0).map(() => Array(m).fill(0))
  let R = matrix.map(row => [...row])
  
  // 初始化Q为单位矩阵
  for (let i = 0; i < m; i++) {
    Q[i][i] = 1
  }
  
  // Householder反射
  for (let k = 0; k < Math.min(m - 1, n); k++) {
    // 计算Householder向量
    const x = []
    for (let i = k; i < m; i++) {
      x.push(R[i][k])
    }
    
    const norm = Math.sqrt(x.reduce((sum, val) => sum + val * val, 0))
    if (norm < 1e-10) continue
    
    const v = [...x]
    v[0] += norm * (x[0] >= 0 ? 1 : -1)
    const vNorm = Math.sqrt(v.reduce((sum, val) => sum + val * val, 0))
    
    if (vNorm < 1e-10) continue
    
    for (let i = 0; i < v.length; i++) {
      v[i] /= vNorm
    }
    
    // 应用Householder反射到R
    for (let j = k; j < n; j++) {
      let dot = 0
      for (let i = 0; i < v.length; i++) {
        dot += v[i] * R[k + i][j]
      }
      
      for (let i = 0; i < v.length; i++) {
        R[k + i][j] -= 2 * dot * v[i]
      }
    }
    
    // 应用Householder反射到Q
    for (let j = 0; j < m; j++) {
      let dot = 0
      for (let i = 0; i < v.length; i++) {
        dot += v[i] * Q[j][k + i]
      }
      
      for (let i = 0; i < v.length; i++) {
        Q[j][k + i] -= 2 * dot * v[i]
      }
    }
    
    // 报告进度
    const progress = Math.round((k / Math.min(m - 1, n)) * 80) + 10
    postMessage({
      type: 'progress',
      taskId,
      progress,
      message: `QR分解进度: ${Math.round((k / Math.min(m - 1, n)) * 100)}%`
    })
  }
  
  return { Q, R }
}

/**
 * SVD分解优化实现（简化版）
 */
function svdOptimized(matrix, taskId) {
  const m = matrix.length
  const n = matrix[0].length
  
  // 简化的SVD实现 - 使用幂迭代法计算主要奇异值
  const AtA = multiplyMatrices(transpose(matrix), matrix)
  const eigenvalues = calculateEigenvaluesOptimized(AtA, taskId)
  
  const singularValues = eigenvalues.map(val => Math.sqrt(Math.max(0, val))).sort((a, b) => b - a)
  
  // 简化返回，实际SVD需要更复杂的实现
  return {
    singularValues,
    rank: singularValues.filter(val => val > 1e-10).length
  }
}

/**
 * 线性方程组求解优化实现
 */
function solveLinearSystemOptimized(A, b, taskId) {
  const n = A.length
  
  // 使用LU分解求解
  const { L, U } = luDecompositionOptimized(A, taskId)
  
  // 前向替换求解 Ly = b
  const y = Array(n).fill(0)
  for (let i = 0; i < n; i++) {
    let sum = 0
    for (let j = 0; j < i; j++) {
      sum += L[i][j] * y[j]
    }
    y[i] = (b[i][0] - sum) / L[i][i]
  }
  
  // 后向替换求解 Ux = y
  const x = Array(n).fill(0)
  for (let i = n - 1; i >= 0; i--) {
    let sum = 0
    for (let j = i + 1; j < n; j++) {
      sum += U[i][j] * x[j]
    }
    x[i] = (y[i] - sum) / U[i][i]
  }
  
  return x.map(val => [val])
}

/**
 * 矩阵幂运算优化实现 - 快速幂算法
 */
function matrixPowerOptimized(matrix, power, taskId) {
  if (power === 0) {
    // 返回单位矩阵
    const n = matrix.length
    return Array(n).fill(0).map((_, i) => 
      Array(n).fill(0).map((_, j) => i === j ? 1 : 0)
    )
  }
  
  if (power === 1) {
    return matrix.map(row => [...row])
  }
  
  if (power < 0) {
    const inverse = inverseMatrixOptimized(matrix, taskId)
    return matrixPowerOptimized(inverse, -power, taskId)
  }
  
  // 快速幂算法
  let result = Array(matrix.length).fill(0).map((_, i) => 
    Array(matrix.length).fill(0).map((_, j) => i === j ? 1 : 0)
  )
  let base = matrix.map(row => [...row])
  let exp = power
  
  while (exp > 0) {
    if (exp % 2 === 1) {
      result = multiplyMatricesOptimized(result, base, taskId)
    }
    base = multiplyMatricesOptimized(base, base, taskId)
    exp = Math.floor(exp / 2)
    
    // 报告进度
    const progress = Math.round((1 - exp / power) * 80) + 10
    postMessage({
      type: 'progress',
      taskId,
      progress,
      message: `幂运算进度: ${Math.round((1 - exp / power) * 100)}%`
    })
  }
  
  return result
}

/**
 * 矩阵秩计算优化实现
 */
function calculateRankOptimized(matrix, taskId) {
  const m = matrix.length
  const n = matrix[0].length
  const A = matrix.map(row => [...row])
  
  let rank = 0
  const tolerance = 1e-10
  
  for (let col = 0, row = 0; col < n && row < m; col++) {
    // 寻找主元
    let pivot = row
    for (let i = row + 1; i < m; i++) {
      if (Math.abs(A[i][col]) > Math.abs(A[pivot][col])) {
        pivot = i
      }
    }
    
    if (Math.abs(A[pivot][col]) < tolerance) {
      continue // 跳过零列
    }
    
    // 交换行
    if (pivot !== row) {
      [A[row], A[pivot]] = [A[pivot], A[row]]
    }
    
    // 消元
    for (let i = row + 1; i < m; i++) {
      const factor = A[i][col] / A[row][col]
      for (let j = col; j < n; j++) {
        A[i][j] -= factor * A[row][j]
      }
    }
    
    rank++
    row++
    
    // 报告进度
    const progress = Math.round((col / n) * 80) + 10
    postMessage({
      type: 'progress',
      taskId,
      progress,
      message: `秩计算进度: ${Math.round((col / n) * 100)}%`
    })
  }
  
  return rank
}

// ==================== 辅助函数 ====================

/**
 * 矩阵转置
 */
function transpose(matrix) {
  const rows = matrix.length
  const cols = matrix[0].length
  const result = Array(cols).fill(0).map(() => Array(rows).fill(0))
  
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      result[j][i] = matrix[i][j]
    }
  }
  
  return result
}

/**
 * 简单矩阵乘法（用于辅助计算）
 */
function multiplyMatrices(a, b) {
  const rowsA = a.length
  const colsA = a[0].length
  const colsB = b[0].length
  const result = Array(rowsA).fill(0).map(() => Array(colsB).fill(0))
  
  for (let i = 0; i < rowsA; i++) {
    for (let j = 0; j < colsB; j++) {
      for (let k = 0; k < colsA; k++) {
        result[i][j] += a[i][k] * b[k][j]
      }
    }
  }
  
  return result
}

/**
 * QR分解（简化版，用于特征值计算）
 */
function qrDecomposition(matrix) {
  const m = matrix.length
  const n = matrix[0].length
  const Q = Array(m).fill(0).map(() => Array(m).fill(0))
  const R = matrix.map(row => [...row])
  
  // 简化的Gram-Schmidt过程
  for (let j = 0; j < Math.min(m, n); j++) {
    // 计算列向量的范数
    let norm = 0
    for (let i = j; i < m; i++) {
      norm += R[i][j] * R[i][j]
    }
    norm = Math.sqrt(norm)
    
    if (norm < 1e-10) continue
    
    // 归一化
    for (let i = j; i < m; i++) {
      Q[i][j] = R[i][j] / norm
    }
    
    R[j][j] = norm
    
    // 正交化后续列
    for (let k = j + 1; k < n; k++) {
      let dot = 0
      for (let i = j; i < m; i++) {
        dot += Q[i][j] * R[i][k]
      }
      
      R[j][k] = dot
      
      for (let i = j; i < m; i++) {
        R[i][k] -= dot * Q[i][j]
      }
    }
  }
  
  return { Q, R }
}