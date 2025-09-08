/**
 * Image Compression Web Worker
 * 图片压缩Web Worker，在后台线程处理图片压缩任务
 */

// Worker消息处理
self.onmessage = function(event) {
  const { taskId, type, data } = event.data

  try {
    switch (type) {
      case 'compress-image':
        compressImage(taskId, data)
        break
      case 'batch-compress':
        batchCompressImages(taskId, data)
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
 * 压缩单个图片
 */
function compressImage(taskId, { file, settings }) {
  const canvas = new OffscreenCanvas(1, 1)
  const ctx = canvas.getContext('2d')
  
  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }

  // 创建图片对象
  const img = new Image()
  
  img.onload = function() {
    try {
      // 报告进度
      postMessage({
        taskId,
        type: 'progress',
        progress: 10
      })

      // 计算新尺寸
      let { width, height } = img
      const originalAspectRatio = width / height

      if (settings.maxWidth && width > settings.maxWidth) {
        width = settings.maxWidth
        if (settings.maintainAspectRatio) {
          height = width / originalAspectRatio
        }
      }

      if (settings.maxHeight && height > settings.maxHeight) {
        height = settings.maxHeight
        if (settings.maintainAspectRatio) {
          width = height * originalAspectRatio
        }
      }

      // 确保尺寸为整数且在合理范围内
      width = Math.max(1, Math.min(8192, Math.round(width)))
      height = Math.max(1, Math.min(8192, Math.round(height)))

      // 设置画布尺寸
      canvas.width = width
      canvas.height = height

      // 报告进度
      postMessage({
        taskId,
        type: 'progress',
        progress: 30
      })

      // 配置画布以获得更好的质量
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'

      // 对于PNG格式，确保正确处理透明度
      if (settings.format === 'png') {
        ctx.globalCompositeOperation = 'source-over'
      }

      // 绘制图片
      ctx.drawImage(img, 0, 0, width, height)

      // 报告进度
      postMessage({
        taskId,
        type: 'progress',
        progress: 70
      })

      // 转换为blob
      const mimeType = `image/${settings.format}`
      const quality = settings.format === 'png' ? undefined : Math.max(0.1, Math.min(1, settings.quality / 100))

      canvas.convertToBlob({
        type: mimeType,
        quality: quality
      }).then(blob => {
        if (!blob || blob.size === 0) {
          throw new Error('Compression resulted in empty file')
        }

        // 报告完成
        postMessage({
          taskId,
          type: 'complete',
          data: {
            blob: blob,
            size: blob.size,
            width: width,
            height: height,
            format: settings.format
          }
        })
      }).catch(error => {
        throw new Error(`Failed to convert to blob: ${error.message}`)
      })

    } catch (error) {
      postMessage({
        taskId,
        type: 'error',
        error: error.message
      })
    }
  }

  img.onerror = function() {
    postMessage({
      taskId,
      type: 'error',
      error: 'Failed to load image'
    })
  }

  // 加载图片
  const url = URL.createObjectURL(file)
  img.src = url
}

/**
 * 批量压缩图片
 */
function batchCompressImages(taskId, { files, settings }) {
  const results = []
  let completed = 0
  const total = files.length

  function processNext(index) {
    if (index >= total) {
      // 所有图片处理完成
      postMessage({
        taskId,
        type: 'complete',
        data: results
      })
      return
    }

    const file = files[index]
    const individualTaskId = `${taskId}_${index}`
    
    // 创建临时的消息处理器
    const originalOnMessage = self.onmessage
    
    // 处理单个图片
    compressImage(individualTaskId, { file, settings })
    
    // 监听该图片的处理结果
    const checkResult = setInterval(() => {
      // 这里需要一个更好的方式来处理批量任务的结果
      // 暂时使用简化的方法
    }, 100)

    // 报告整体进度
    const overallProgress = Math.round((completed / total) * 100)
    postMessage({
      taskId,
      type: 'progress',
      progress: overallProgress
    })

    // 处理下一个
    setTimeout(() => processNext(index + 1), 50)
  }

  processNext(0)
}

/**
 * 验证图片文件
 */
function validateImageFile(file) {
  const maxSize = 100 * 1024 * 1024 // 100MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Unsupported image format' }
  }
  
  if (file.size > maxSize) {
    return { isValid: false, error: 'Image too large for processing' }
  }
  
  return { isValid: true }
}

/**
 * 计算压缩比
 */
function calculateCompressionRatio(originalSize, compressedSize) {
  return ((originalSize - compressedSize) / originalSize) * 100
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}