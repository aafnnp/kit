/**
 * Universal Processing Web Worker
 * 通用处理Web Worker，支持多种类型的计算密集型任务
 */

// 导入其他worker脚本的功能
importScripts('./image-compression-worker.js')

// Worker消息处理
self.onmessage = function(event) {
  const { taskId, type, data } = event.data

  try {
    switch (type) {
      // 图片处理任务
      case 'compress-image':
      case 'batch-compress':
        handleImageTask(taskId, type, data)
        break
        
      // 矩阵运算任务
      case 'matrix-multiply':
      case 'matrix-inverse':
      case 'matrix-determinant':
      case 'matrix-eigenvalues':
        handleMatrixTask(taskId, type, data)
        break
        
      // 音频处理任务
      case 'audio-convert':
      case 'audio-analyze':
        handleAudioTask(taskId, type, data)
        break
        
      // 视频处理任务
      case 'video-trim':
      case 'video-compress':
        handleVideoTask(taskId, type, data)
        break
        
      // 正则表达式匹配任务
      case 'regex-match':
      case 'regex-replace':
        handleRegexTask(taskId, type, data)
        break
        
      default:
        throw new Error(`Unknown task type: ${type}`)
    }
  } catch (error) {
    postMessage({
      taskId,
      type: 'error',
      error: error.message
    })
  }
}

/**
 * 处理图片任务
 */
function handleImageTask(taskId, type, data) {
  // 重用图片压缩worker的逻辑
  if (type === 'compress-image') {
    compressImage(taskId, data)
  } else if (type === 'batch-compress') {
    batchCompressImages(taskId, data)
  }
}

/**
 * 处理矩阵运算任务 - 委托给专门的矩阵处理Worker
 */
function handleMatrixTask(taskId, type, data) {
  try {
    // 创建专门的矩阵处理Worker
    const matrixWorker = new Worker('/workers/matrix-processing-worker.js')
    
    // 转发消息到矩阵处理Worker
    matrixWorker.postMessage({
      type,
      data,
      taskId
    })
    
    // 监听矩阵处理Worker的消息并转发到主线程
    matrixWorker.onmessage = function(e) {
      postMessage(e.data)
      
      // 如果任务完成或出错，终止Worker
      if (e.data.type === 'complete' || e.data.type === 'error') {
        matrixWorker.terminate()
      }
    }
    
    matrixWorker.onerror = function(error) {
      postMessage({
        type: 'error',
        taskId,
        error: `Matrix worker error: ${error.message}`
      })
      matrixWorker.terminate()
    }
    
  } catch (error) {
    postMessage({
      type: 'error',
      taskId,
      error: error.message
    })
  }
}

/**
 * 优化的矩阵乘法 - 使用分块算法
 */
function multiplyMatricesOptimized(a, b) {
  const rowsA = a.length
  const colsA = a[0].length
  const colsB = b[0].length
  
  // 检查矩阵维度
  if (colsA !== b.length) {
    throw new Error('Matrix dimensions incompatible for multiplication')
  }
  
  const result = Array(rowsA).fill(0).map(() => Array(colsB).fill(0))
  
  // 使用分块算法优化缓存性能
  const blockSize = 64 // 优化的块大小
  
  for (let ii = 0; ii < rowsA; ii += blockSize) {
    for (let jj = 0; jj < colsB; jj += blockSize) {
      for (let kk = 0; kk < colsA; kk += blockSize) {
        
        // 处理块内的计算
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
      taskId: arguments[0], // 需要传递taskId
      type: 'progress',
      progress: progress
    })
  }
  
  return result
}

/**
 * 优化的矩阵求逆 - 使用LU分解
 */
function inverseMatrixOptimized(matrix) {
  const n = matrix.length
  
  // 检查是否为方阵
  if (n !== matrix[0].length) {
    throw new Error('Matrix must be square for inversion')
  }
  
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
      throw new Error('Matrix is singular and cannot be inverted')
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
      taskId: arguments[0], // 需要传递taskId
      type: 'progress',
      progress: progress
    })
  }
  
  // 提取逆矩阵
  const inverse = augmented.map(row => row.slice(n))
  return inverse
}

/**
 * 优化的行列式计算 - 使用LU分解
 */
function calculateDeterminantOptimized(matrix) {
  const n = matrix.length
  
  if (n !== matrix[0].length) {
    throw new Error('Matrix must be square for determinant calculation')
  }
  
  // 创建矩阵副本
  const lu = matrix.map(row => [...row])
  let det = 1
  let swaps = 0
  
  // LU分解
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
      taskId: arguments[0], // 需要传递taskId
      type: 'progress',
      progress: progress
    })
  }
  
  // 考虑行交换的影响
  return swaps % 2 === 0 ? det : -det
}

/**
 * 简化的特征值计算（幂迭代法）
 */
function calculateEigenvaluesOptimized(matrix) {
  const n = matrix.length
  
  if (n !== matrix[0].length) {
    throw new Error('Matrix must be square for eigenvalue calculation')
  }
  
  // 使用幂迭代法计算最大特征值
  let v = Array(n).fill(1) // 初始向量
  let eigenvalue = 0
  const maxIterations = 100
  const tolerance = 1e-10
  
  for (let iter = 0; iter < maxIterations; iter++) {
    // Av
    const Av = Array(n).fill(0)
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        Av[i] += matrix[i][j] * v[j]
      }
    }
    
    // 计算特征值估计
    const newEigenvalue = Av.reduce((sum, val, i) => sum + val * v[i], 0) / 
                         v.reduce((sum, val) => sum + val * val, 0)
    
    // 归一化向量
    const norm = Math.sqrt(Av.reduce((sum, val) => sum + val * val, 0))
    v = Av.map(val => val / norm)
    
    // 检查收敛
    if (Math.abs(newEigenvalue - eigenvalue) < tolerance) {
      break
    }
    
    eigenvalue = newEigenvalue
    
    // 报告进度
    const progress = Math.round((iter / maxIterations) * 80) + 10
    postMessage({
      taskId: arguments[0], // 需要传递taskId
      type: 'progress',
      progress: progress
    })
  }
  
  return { dominantEigenvalue: eigenvalue, eigenvector: v }
}

/**
 * 处理音频任务
 */
function handleAudioTask(taskId, type, data) {
  // 委托给专门的音频处理 Worker
  const audioWorker = new Worker('/workers/audio-processing-worker.js')
  
  // 转发消息到主线程
  audioWorker.onmessage = (e) => {
    postMessage({
      ...e.data,
      taskId
    })
    
    // 如果任务完成或出错，终止 Worker
    if (e.data.type === 'complete' || e.data.type === 'error') {
      audioWorker.terminate()
    }
  }
  
  audioWorker.onerror = (error) => {
    postMessage({
      type: 'error',
      taskId,
      error: error.message || 'Audio worker error'
    })
    audioWorker.terminate()
  }
  
  // 发送任务数据到音频处理 Worker
  audioWorker.postMessage({ type, data, taskId })
}

/**
 * 处理视频任务
 */
function handleVideoTask(taskId, type, data) {
  // 将视频任务委托给专门的视频处理Worker
  const videoWorker = new Worker('/workers/video-processing-worker.js')
  
  videoWorker.onmessage = function(e) {
    const { type: messageType, ...messageData } = e.data
    
    // 转发消息到主线程
    postMessage({
      taskId,
      type: messageType,
      ...messageData
    })
    
    // 如果任务完成或出错，清理Worker
    if (messageType === 'complete' || messageType === 'error') {
      videoWorker.terminate()
    }
  }
  
  videoWorker.onerror = function(error) {
    postMessage({
      taskId,
      type: 'error',
      error: error.message
    })
    videoWorker.terminate()
  }
  
  // 发送任务到视频处理Worker
  videoWorker.postMessage({
    taskId,
    type,
    data
  })
}

/**
 * 处理正则表达式任务
 */
function handleRegexTask(taskId, type, data) {
  const { pattern, text, flags, replacement } = data
  
  try {
    const regex = new RegExp(pattern, flags)
    let result
    
    if (type === 'regex-match') {
      result = {
        matches: [...text.matchAll(regex)],
        count: (text.match(regex) || []).length
      }
    } else if (type === 'regex-replace') {
      result = {
        text: text.replace(regex, replacement),
        count: (text.match(regex) || []).length
      }
    }
    
    postMessage({
      taskId,
      type: 'complete',
      data: result
    })
    
  } catch (error) {
    postMessage({
      taskId,
      type: 'error',
      error: error.message
    })
  }
}