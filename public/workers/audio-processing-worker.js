/**
 * Audio Processing Worker
 * 处理音频转换、分析等任务
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
 * 获取音频元数据
 */
async function getAudioMetadata(taskId, data) {
  try {
    const { fileBuffer, fileName } = data
    
    postMessage({
      taskId,
      type: 'progress',
      progress: 0,
      message: 'Analyzing audio metadata...'
    })
    
    const ffmpeg = await initFFmpeg()
    
    const inputExt = fileName.split('.').pop()
    const inputName = `input_${taskId}.${inputExt}`
    
    // 写入输入文件
    ffmpeg.FS('writeFile', inputName, new Uint8Array(fileBuffer))
    
    // 获取音频信息
    await ffmpeg.run('-i', inputName, '-f', 'null', '-')
    
    // 从 FFmpeg 日志中解析元数据（简化版本）
    const stats = {
      duration: 0, // 需要从 FFmpeg 输出解析
      bitrate: 0,
      sampleRate: 44100,
      channels: 2,
      format: inputExt,
      fileSize: fileBuffer.byteLength
    }
    
    // 清理临时文件
    try {
      ffmpeg.FS('unlink', inputName)
    } catch (e) {
      // 忽略清理错误
    }
    
    postMessage({
      taskId,
      type: 'complete',
      result: stats
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
 * 处理音频转换任务
 */
async function handleAudioConvert(taskId, data) {
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
    
    // 添加音频编码器
    switch (settings.format) {
      case 'mp3':
        args.push('-c:a', 'libmp3lame')
        break
      case 'aac':
        args.push('-c:a', 'aac')
        break
      case 'ogg':
        args.push('-c:a', 'libvorbis')
        break
      case 'flac':
        args.push('-c:a', 'flac')
        break
      case 'wav':
        args.push('-c:a', 'pcm_s16le')
        break
      default:
        args.push('-c:a', 'copy')
    }
    
    // 添加比特率设置
    if (settings.bitrate && settings.format !== 'wav' && settings.format !== 'flac') {
      args.push('-b:a', `${settings.bitrate}k`)
    }
    
    // 添加采样率设置
    if (settings.sampleRate) {
      args.push('-ar', settings.sampleRate.toString())
    }
    
    // 添加声道设置
    if (settings.channels) {
      args.push('-ac', settings.channels.toString())
    }
    
    // 添加音频标准化
    if (settings.normalizeAudio) {
      args.push('-af', 'loudnorm')
    }
    
    // 添加淡入淡出效果
    if (settings.fadeIn || settings.fadeOut) {
      let filter = ''
      if (settings.fadeIn) {
        filter += `afade=t=in:ss=0:d=${settings.fadeIn}`
      }
      if (settings.fadeOut) {
        if (filter) filter += ','
        filter += `afade=t=out:st=${(settings.trimEnd || 0) - settings.fadeOut}:d=${settings.fadeOut}`
      }
      if (filter) {
        args.push('-af', filter)
      }
    }
    
    // 添加裁剪设置
    if (settings.trimStart) {
      args.push('-ss', settings.trimStart.toString())
    }
    if (settings.trimEnd) {
      args.push('-to', settings.trimEnd.toString())
    }
    
    // 元数据处理
    if (!settings.preserveMetadata) {
      args.push('-map_metadata', '-1')
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
        format: outputExt,
        bitrate: settings.bitrate,
        sampleRate: settings.sampleRate,
        channels: settings.channels
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
 * 处理音频分析任务
 */
async function handleAudioAnalysis(taskId, data) {
  try {
    const { fileBuffer, fileName } = data
    
    postMessage({
      taskId,
      type: 'progress',
      progress: 0,
      message: 'Analyzing audio...'
    })
    
    // 使用 Web Audio API 进行基本分析
    const audioContext = new (self.AudioContext || self.webkitAudioContext)()
    const arrayBuffer = fileBuffer.slice()
    
    try {
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
      
      const stats = {
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate,
        channels: audioBuffer.numberOfChannels,
        fileSize: fileBuffer.byteLength,
        format: fileName.split('.').pop() || 'unknown'
      }
      
      postMessage({
        taskId,
        type: 'complete',
        result: stats
      })
      
    } catch (decodeError) {
      // 如果 Web Audio API 失败，回退到基本信息
      const stats = {
        duration: 0,
        sampleRate: 44100,
        channels: 2,
        fileSize: fileBuffer.byteLength,
        format: fileName.split('.').pop() || 'unknown'
      }
      
      postMessage({
        taskId,
        type: 'complete',
        result: stats
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

// 监听主线程消息
self.onmessage = function(e) {
  const { taskId, type, data } = e.data
  
  switch (type) {
    case 'convert-audio':
      handleAudioConvert(taskId, data)
      break
    case 'analyze-audio':
      handleAudioAnalysis(taskId, data)
      break
    case 'get-metadata':
      getAudioMetadata(taskId, data)
      break
    default:
      postMessage({
        taskId,
        type: 'error',
        error: `Unknown task type: ${type}`
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