/**
 * Universal Processing Web Worker
 * 通用处理Web Worker，支持多种类型的计算密集型任务
 */

// 导入其他worker脚本的功能
importScripts('./image-compression-worker.js')

// Worker消息处理
self.onmessage = function (event) {
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
      error: error.message,
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
    const matrixWorker = new Worker('/workers/matrix-processing-worker.js')

    matrixWorker.postMessage({
      type,
      data,
      taskId,
    })

    matrixWorker.onmessage = function (e) {
      postMessage(e.data)

      if (e.data.type === 'progress') {
        // 已包含 taskId，无需额外处理
      }

      if (e.data.type === 'complete' || e.data.type === 'error') {
        matrixWorker.terminate()
      }
    }

    matrixWorker.onerror = function (error) {
      postMessage({
        type: 'error',
        taskId,
        error: `Matrix worker error: ${error.message}`,
      })
      matrixWorker.terminate()
    }
  } catch (error) {
    postMessage({
      type: 'error',
      taskId,
      error: error.message,
    })
  }
}

function reportProgress(taskId, progress, message) {
  postMessage({
    taskId,
    type: 'progress',
    progress,
    message,
  })
}

/**
 * 优化的矩阵乘法 - 使用分块算法
 */
function multiplyMatricesOptimized(a, b, taskId) {
  const rowsA = a.length
  const colsA = a[0].length
  const colsB = b[0].length
  if (colsA !== b.length) {
    throw new Error('Matrix dimensions incompatible for multiplication')
  }

  const result = Array(rowsA)
    .fill(0)
    .map(() => Array(colsB).fill(0))
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

    reportProgress(taskId, Math.min(95, Math.round((ii / rowsA) * 80) + 10), '矩阵乘法进行中')
  }

  return result
}

/**
 * 优化的矩阵求逆 - 使用LU分解
 */
function inverseMatrixOptimized(matrix, taskId) {
  const n = matrix.length
  if (n !== matrix[0].length) {
    throw new Error('Matrix must be square for inversion')
  }

  const augmented = matrix.map((row, i) => {
    const newRow = [...row]
    for (let j = 0; j < n; j++) {
      newRow.push(i === j ? 1 : 0)
    }
    return newRow
  })

  for (let i = 0; i < n; i++) {
    let maxRow = i
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
        maxRow = k
      }
    }

    if (maxRow !== i) {
      ;[augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]]
    }

    if (Math.abs(augmented[i][i]) < 1e-10) {
      throw new Error('Matrix is singular and cannot be inverted')
    }

    const pivot = augmented[i][i]
    for (let j = 0; j < 2 * n; j++) {
      augmented[i][j] /= pivot
    }

    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const factor = augmented[k][i]
        for (let j = 0; j < 2 * n; j++) {
          augmented[k][j] -= factor * augmented[i][j]
        }
      }
    }

    reportProgress(taskId, Math.min(95, Math.round((i / n) * 80) + 10), '矩阵求逆进行中')
  }

  const inverse = augmented.map((row) => row.slice(n))
  return inverse
}

/**
 * 优化的行列式计算 - 使用LU分解
 */
function calculateDeterminantOptimized(matrix, taskId) {
  const n = matrix.length
  if (n !== matrix[0].length) {
    throw new Error('Matrix must be square for determinant calculation')
  }

  const lu = matrix.map((row) => [...row])
  let det = 1
  let swaps = 0

  for (let i = 0; i < n; i++) {
    let maxRow = i
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(lu[k][i]) > Math.abs(lu[maxRow][i])) {
        maxRow = k
      }
    }

    if (maxRow !== i) {
      ;[lu[i], lu[maxRow]] = [lu[maxRow], lu[i]]
      swaps++
    }

    if (Math.abs(lu[i][i]) < 1e-10) {
      return 0
    }

    for (let k = i + 1; k < n; k++) {
      const factor = lu[k][i] / lu[i][i]
      for (let j = i; j < n; j++) {
        lu[k][j] -= factor * lu[i][j]
      }
    }

    det *= lu[i][i]
    reportProgress(taskId, Math.min(95, Math.round((i / n) * 80) + 10), '行列式计算进行中')
  }

  return swaps % 2 === 0 ? det : -det
}

/**
 * 简化的特征值计算（幂迭代法）
 */
function calculateEigenvaluesOptimized(matrix, taskId) {
  const n = matrix.length
  if (n !== matrix[0].length) {
    throw new Error('Matrix must be square for eigenvalue calculation')
  }

  let v = Array(n).fill(1)
  let eigenvalue = 0
  const maxIterations = 100
  const tolerance = 1e-10

  for (let iter = 0; iter < maxIterations; iter++) {
    const Av = Array(n).fill(0)
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        Av[i] += matrix[i][j] * v[j]
      }
    }

    const newEigenvalue = Av.reduce((sum, val, i) => sum + val * v[i], 0) / v.reduce((sum, val) => sum + val * val, 0)

    const norm = Math.sqrt(Av.reduce((sum, val) => sum + val * val, 0))
    v = Av.map((val) => val / norm)

    reportProgress(taskId, Math.min(95, Math.round((iter / maxIterations) * 80) + 10), '特征值计算进行中')

    if (Math.abs(newEigenvalue - eigenvalue) < tolerance) {
      eigenvalue = newEigenvalue
      break
    }

    eigenvalue = newEigenvalue
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
      taskId,
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
      error: error.message || 'Audio worker error',
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

  videoWorker.onmessage = function (e) {
    const { type: messageType, ...messageData } = e.data

    // 转发消息到主线程
    postMessage({
      taskId,
      type: messageType,
      ...messageData,
    })

    // 如果任务完成或出错，清理Worker
    if (messageType === 'complete' || messageType === 'error') {
      videoWorker.terminate()
    }
  }

  videoWorker.onerror = function (error) {
    postMessage({
      taskId,
      type: 'error',
      error: error.message,
    })
    videoWorker.terminate()
  }

  // 发送任务到视频处理Worker
  videoWorker.postMessage({
    taskId,
    type,
    data,
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
        count: (text.match(regex) || []).length,
      }
    } else if (type === 'regex-replace') {
      result = {
        text: text.replace(regex, replacement),
        count: (text.match(regex) || []).length,
      }
    }

    postMessage({
      taskId,
      type: 'complete',
      data: result,
    })
  } catch (error) {
    postMessage({
      taskId,
      type: 'error',
      error: error.message,
    })
  }
}
