/**
 * Video Processing Worker
 * 处理视频裁剪、转换等任务
 */

// 动态导入 FFmpeg
let ffmpegLoaded = false
let ffmpeg = null

/**
 * 初始化 FFmpeg
 */
async function initFFmpeg() {
  if (ffmpegLoaded && ffmpeg) return ffmpeg
  
  try {
    // 动态导入 FFmpeg
    const ffmpegModule = await import('https://unpkg.com/@ffmpeg/ffmpeg@0.12.10/dist/esm/index.js')
    const { createFFmpeg, fetchFile } = ffmpegModule
    
    ffmpeg = createFFmpeg({
      log: false,
      progress: ({ ratio }) => {
        // 发送进度更新
        postMessage({
          type: 'progress',
          progress: Math.round(ratio * 100)
        })
      }
    })
    
    if (!ffmpeg.isLoaded()) {
      await ffmpeg.load()
    }
    
    ffmpegLoaded = true
    return ffmpeg
  } catch (error) {
    throw new Error(`FFmpeg initialization failed: ${error.message}`)
  }
}

/**
 * 处理视频裁剪任务
 */
async function handleVideoTrim(taskId, data) {
  try {
    const { fileBuffer, fileName, settings } = data
    
    postMessage({
      taskId,
      type: 'progress',
      progress: 0,
      message: 'Initializing FFmpeg...'
    })
    
    const ffmpeg = await initFFmpeg()
    
    postMessage({
      taskId,
      type: 'progress',
      progress: 10,
      message: 'Processing video...'
    })
    
    const ext = settings.format || 'mp4'
    const inputName = `input_${taskId}.${fileName.split('.').pop()}`
    const outputName = `output_${taskId}.${ext}`
    
    // 写入输入文件
    ffmpeg.FS('writeFile', inputName, new Uint8Array(fileBuffer))
    
    // 构建 FFmpeg 命令
    const args = [
      '-ss', settings.start.toString(),
      '-to', settings.end.toString(),
      '-i', inputName,
      '-c:v', 'copy',
      '-c:a', 'copy',
      outputName
    ]
    
    // 执行裁剪
    await ffmpeg.run(...args)
    
    postMessage({
      taskId,
      type: 'progress',
      progress: 90,
      message: 'Finalizing...'
    })
    
    // 读取输出文件
    const data_output = ffmpeg.FS('readFile', outputName)
    const outputBuffer = data_output.buffer
    
    // 清理临时文件
    try {
      ffmpeg.FS('unlink', inputName)
      ffmpeg.FS('unlink', outputName)
    } catch (e) {
      // 忽略清理错误
    }
    
    postMessage({
      taskId,
      type: 'complete',
      result: {
        buffer: outputBuffer,
        size: outputBuffer.byteLength,
        format: ext,
        duration: settings.end - settings.start
      }
    })
    
  } catch (error) {
    postMessage({
      taskId,
      type: 'error',
      error: error.message
    })
  }
}

/**
 * 处理视频格式转换任务
 */
async function handleVideoConvert(taskId, data) {
  try {
    const { fileBuffer, fileName, settings } = data
    
    postMessage({
      taskId,
      type: 'progress',
      progress: 0,
      message: 'Initializing FFmpeg...'
    })
    
    const ffmpeg = await initFFmpeg()
    
    const inputExt = fileName.split('.').pop()
    const outputExt = settings.format
    const inputName = `input_${taskId}.${inputExt}`
    const outputName = `output_${taskId}.${outputExt}`
    
    // 写入输入文件
    ffmpeg.FS('writeFile', inputName, new Uint8Array(fileBuffer))
    
    // 构建转换命令
    const args = ['-i', inputName]
    
    // 添加质量设置
    if (settings.quality) {
      args.push('-crf', settings.quality.toString())
    }
    
    // 添加分辨率设置
    if (settings.width && settings.height) {
      args.push('-s', `${settings.width}x${settings.height}`)
    }
    
    // 添加比特率设置
    if (settings.bitrate) {
      args.push('-b:v', `${settings.bitrate}k`)
    }
    
    args.push(outputName)
    
    // 执行转换
    await ffmpeg.run(...args)
    
    // 读取输出文件
    const data_output = ffmpeg.FS('readFile', outputName)
    const outputBuffer = data_output.buffer
    
    // 清理临时文件
    try {
      ffmpeg.FS('unlink', inputName)
      ffmpeg.FS('unlink', outputName)
    } catch (e) {
      // 忽略清理错误
    }
    
    postMessage({
      taskId,
      type: 'complete',
      result: {
        buffer: outputBuffer,
        size: outputBuffer.byteLength,
        format: outputExt
      }
    })
    
  } catch (error) {
    postMessage({
      taskId,
      type: 'error',
      error: error.message
    })
  }
}

/**
 * 获取视频元数据
 */
async function handleVideoMetadata(taskId, data) {
  try {
    const { fileBuffer, fileName } = data
    
    const ffmpeg = await initFFmpeg()
    
    const inputName = `input_${taskId}.${fileName.split('.').pop()}`
    ffmpeg.FS('writeFile', inputName, new Uint8Array(fileBuffer))
    
    // 使用 ffprobe 获取元数据
    await ffmpeg.run('-i', inputName, '-f', 'null', '-')
    
    // 清理文件
    try {
      ffmpeg.FS('unlink', inputName)
    } catch (e) {
      // 忽略清理错误
    }
    
    // 注意：这里简化了元数据提取，实际应用中需要解析 ffmpeg 输出
    postMessage({
      taskId,
      type: 'complete',
      result: {
        duration: 0, // 需要从 ffmpeg 输出解析
        width: 0,
        height: 0,
        bitrate: 0
      }
    })
    
  } catch (error) {
    postMessage({
      taskId,
      type: 'error',
      error: error.message
    })
  }
}

// 监听主线程消息
self.onmessage = async function(e) {
  const { taskId, type, data } = e.data
  
  try {
    switch (type) {
      case 'trim-video':
        await handleVideoTrim(taskId, data)
        break
        
      case 'convert-video':
        await handleVideoConvert(taskId, data)
        break
        
      case 'video-metadata':
        await handleVideoMetadata(taskId, data)
        break
        
      default:
        postMessage({
          taskId,
          type: 'error',
          error: `Unknown task type: ${type}`
        })
    }
  } catch (error) {
    postMessage({
      taskId,
      type: 'error',
      error: error.message
    })
  }
}

// 错误处理
self.onerror = function(error) {
  postMessage({
    type: 'error',
    error: error.message
  })
}