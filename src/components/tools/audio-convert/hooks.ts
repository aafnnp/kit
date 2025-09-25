import { useState, useCallback, useRef } from 'react'
import { getWorkerManager } from '@/lib/worker-manager'
import type { WorkerManager } from '@/lib/worker-manager'
import type {
  AudioFile,
  ConvertSettings,
  ConvertResult,
  AudioStats,
  AudioValidationResult,
  AudioTemplate,
  AudioFormatInfo,
} from '@/types/audio-convert'
import { formatFileSize } from '@/lib/utils'

export interface UseAudioConvertReturn {
  convertAudios: (audios: AudioFile[], settings: ConvertSettings) => Promise<void>
  isProcessing: boolean
  progress: number
  cancelProcessing: () => void
}

/**
 * 优化的音频转换钩子，支持Web Worker并行处理
 */
export function useAudioConversion(
  onProgress?: (audioId: string, progress: number, message?: string) => void,
  onComplete?: (audioId: string, result: ConvertResult) => void,
  onError?: (audioId: string, error: string) => void
): UseAudioConvertReturn {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const workerManager = useRef<WorkerManager>(getWorkerManager())
  const activeTaskIds = useRef<Set<string>>(new Set())

  const convertAudios = useCallback(
    async (audios: AudioFile[], settings: ConvertSettings) => {
      if (audios.length === 0) return

      setIsProcessing(true)
      setProgress(0)

      const completedCount = { value: 0 }
      const totalAudios = audios.length

      try {
        // 为每个音频创建转换任务
        const tasks = audios.map(async (audio) => {
          const taskId = `convert-${audio.id}-${Date.now()}`
          activeTaskIds.current.add(taskId)

          try {
            // 将文件转换为ArrayBuffer
            const arrayBuffer = await audio.file.arrayBuffer()

            await workerManager.current.addTask({
              id: taskId,
              type: 'convert-audio',
              data: {
                fileBuffer: arrayBuffer,
                fileName: audio.file.name,
                settings,
              },
              onProgress: (progressValue: number) => {
                onProgress?.(audio.id, progressValue)
              },
              onComplete: (result: {
                buffer: ArrayBuffer | Uint8Array
                size: number
                format: string
                duration?: number
                bitrate?: number
                sampleRate?: number
                channels?: number
              }) => {
                // 创建 Blob URL（确保使用 ArrayBuffer，避免 SharedArrayBuffer 类型不兼容）
                const blobSource: ArrayBuffer =
                  result.buffer instanceof ArrayBuffer ? result.buffer : result.buffer.slice().buffer
                const blob = new Blob([blobSource], {
                  type: `audio/${result.format}`,
                })
                const url = URL.createObjectURL(blob)

                const convertResult: ConvertResult = {
                  url,
                  size: result.size,
                  format: result.format,
                  duration: result.duration || 0,
                  bitrate: result.bitrate,
                  sampleRate: result.sampleRate,
                  channels: result.channels,
                }

                onComplete?.(audio.id, convertResult)

                completedCount.value++
                setProgress(Math.round((completedCount.value / totalAudios) * 100))

                activeTaskIds.current.delete(taskId)
              },
              onError: (error: Error) => {
                onError?.(audio.id, error.message)
                completedCount.value++
                setProgress(Math.round((completedCount.value / totalAudios) * 100))
                activeTaskIds.current.delete(taskId)
              },
            })
          } catch (error) {
            onError?.(audio.id, error instanceof Error ? error.message : 'Unknown error')
            completedCount.value++
            setProgress(Math.round((completedCount.value / totalAudios) * 100))
            activeTaskIds.current.delete(taskId)
          }
        })

        // 等待所有任务完成
        await Promise.allSettled(tasks)
      } finally {
        setIsProcessing(false)
        setProgress(100)
      }
    },
    [onProgress, onComplete, onError]
  )

  const cancelProcessing = useCallback(() => {
    // 取消所有活动任务
    activeTaskIds.current.forEach((taskId) => {
      workerManager.current.cancelTask(taskId)
    })
    activeTaskIds.current.clear()
    setIsProcessing(false)
    setProgress(0)
  }, [])

  return {
    convertAudios,
    isProcessing,
    progress,
    cancelProcessing,
  }
}

/**
 * 音频分析钩子
 */
export function useAudioAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const workerManager = useRef(getWorkerManager())

  const analyzeAudio = useCallback(async (file: File): Promise<AudioStats> => {
    setIsAnalyzing(true)

    try {
      const arrayBuffer = await file.arrayBuffer()
      const taskId = `analyze-${Date.now()}`

      const result = await workerManager.current.addTask({
        id: taskId,
        type: 'analyze-audio',
        data: {
          fileBuffer: arrayBuffer,
          fileName: file.name,
        },
      })

      return result as AudioStats
    } finally {
      setIsAnalyzing(false)
    }
  }, [])

  return {
    analyzeAudio,
    isAnalyzing,
  }
}

// 音频格式信息
export const audioFormats: Record<string, AudioFormatInfo> = {
  mp3: {
    name: 'MP3',
    extension: 'mp3',
    description: 'Most popular lossy audio format',
    supportsLossless: false,
    supportsLossy: true,
    supportsMetadata: true,
    maxQuality: 320,
    useCase: 'General music playback, streaming, portable devices',
    pros: ['Universal compatibility', 'Small file size', 'Good quality at high bitrates'],
    cons: ['Lossy compression', 'Patent restrictions', 'Not ideal for professional use'],
  },
  wav: {
    name: 'WAV',
    extension: 'wav',
    description: 'Uncompressed audio format',
    supportsLossless: true,
    supportsLossy: false,
    supportsMetadata: false,
    maxQuality: 1411,
    useCase: 'Professional audio, editing, mastering',
    pros: ['Lossless quality', 'No compression artifacts', 'Professional standard'],
    cons: ['Large file size', 'Limited metadata support', 'Not efficient for storage'],
  },
  flac: {
    name: 'FLAC',
    extension: 'flac',
    description: 'Free lossless audio codec',
    supportsLossless: true,
    supportsLossy: false,
    supportsMetadata: true,
    maxQuality: 1411,
    useCase: 'High-quality music archiving, audiophile listening',
    pros: ['Lossless compression', 'Open source', 'Excellent metadata support'],
    cons: ['Larger than lossy formats', 'Limited mobile support', 'Higher CPU usage'],
  },
  aac: {
    name: 'AAC',
    extension: 'aac',
    description: 'Advanced Audio Coding',
    supportsLossless: false,
    supportsLossy: true,
    supportsMetadata: true,
    maxQuality: 320,
    useCase: 'Apple devices, streaming services, modern applications',
    pros: ['Better quality than MP3', 'Efficient compression', 'Good mobile support'],
    cons: ['Less universal than MP3', 'Lossy compression', 'Patent restrictions'],
  },
  ogg: {
    name: 'OGG Vorbis',
    extension: 'ogg',
    description: 'Open source audio format',
    supportsLossless: false,
    supportsLossy: true,
    supportsMetadata: true,
    maxQuality: 500,
    useCase: 'Open source projects, gaming, web applications',
    pros: ['Open source', 'Good compression', 'No patent restrictions'],
    cons: ['Limited hardware support', 'Less popular', 'Compatibility issues'],
  },
  m4a: {
    name: 'M4A',
    extension: 'm4a',
    description: 'MPEG-4 Audio',
    supportsLossless: true,
    supportsLossy: true,
    supportsMetadata: true,
    maxQuality: 320,
    useCase: 'Apple ecosystem, iTunes, high-quality audio',
    pros: ['Good quality', 'Apple integration', 'Supports both lossy and lossless'],
    cons: ['Limited compatibility', 'Apple-centric', 'Complex format'],
  },
  wma: {
    name: 'WMA',
    extension: 'wma',
    description: 'Windows Media Audio',
    supportsLossless: true,
    supportsLossy: true,
    supportsMetadata: true,
    maxQuality: 320,
    useCase: 'Windows ecosystem, legacy systems',
    pros: ['Good compression', 'Windows integration', 'DRM support'],
    cons: ['Microsoft proprietary', 'Limited cross-platform support', 'Declining popularity'],
  },
  webm: {
    name: 'WebM Audio',
    extension: 'webm',
    description: 'Web-optimized audio format',
    supportsLossless: false,
    supportsLossy: true,
    supportsMetadata: true,
    maxQuality: 256,
    useCase: 'Web applications, streaming, modern browsers',
    pros: ['Web optimized', 'Open source', 'Good streaming support'],
    cons: ['Limited offline support', 'Newer format', 'Less universal'],
  },
}

// 音频模板
export const audioTemplates: AudioTemplate[] = [
  {
    id: 'high-quality-mp3',
    name: 'High Quality MP3',
    description: 'Best quality MP3 for music listening',
    category: 'music',
    tags: ['mp3', 'high-quality', 'music'],
    popularity: 95,
    settings: {
      format: 'mp3',
      bitrate: 320,
      sampleRate: 44100,
      preserveMetadata: true,
      normalizeAudio: false,
    },
    useCase: 'High-quality music playback and storage',
    pros: ['Excellent quality', 'Universal compatibility', 'Reasonable file size'],
    cons: ['Still lossy', 'Larger than lower bitrates'],
  },
  {
    id: 'podcast-optimized',
    name: 'Podcast Optimized',
    description: 'Optimized for speech and podcasts',
    category: 'speech',
    tags: ['podcast', 'speech', 'optimized'],
    popularity: 85,
    settings: {
      format: 'mp3',
      bitrate: 128,
      sampleRate: 22050,
      channels: 1,
      preserveMetadata: true,
      normalizeAudio: true,
    },
    useCase: 'Podcasts, audiobooks, speech recordings',
    pros: ['Small file size', 'Good for speech', 'Fast streaming'],
    cons: ['Not suitable for music', 'Lower quality', 'Mono audio'],
  },
  {
    id: 'lossless-flac',
    name: 'Lossless FLAC',
    description: 'Perfect quality preservation',
    category: 'archival',
    tags: ['flac', 'lossless', 'archival'],
    popularity: 75,
    settings: {
      format: 'flac',
      bitrate: 1411,
      sampleRate: 44100,
      preserveMetadata: true,
      normalizeAudio: false,
    },
    useCase: 'Music archiving, audiophile listening, professional use',
    pros: ['Perfect quality', 'Lossless compression', 'Excellent metadata'],
    cons: ['Large file size', 'Limited compatibility', 'Higher CPU usage'],
  },
  {
    id: 'streaming-aac',
    name: 'Streaming AAC',
    description: 'Optimized for streaming services',
    category: 'streaming',
    tags: ['aac', 'streaming', 'modern'],
    popularity: 80,
    settings: {
      format: 'aac',
      bitrate: 256,
      sampleRate: 44100,
      preserveMetadata: true,
      normalizeAudio: true,
    },
    useCase: 'Streaming services, mobile apps, modern devices',
    pros: ['Better than MP3', 'Good compression', 'Modern standard'],
    cons: ['Less universal', 'Patent restrictions', 'Lossy compression'],
  },
  {
    id: 'web-optimized',
    name: 'Web Optimized',
    description: 'Perfect for web applications',
    category: 'web',
    tags: ['web', 'optimized', 'streaming'],
    popularity: 70,
    settings: {
      format: 'webm',
      bitrate: 192,
      sampleRate: 44100,
      preserveMetadata: false,
      normalizeAudio: true,
    },
    useCase: 'Web applications, online streaming, progressive web apps',
    pros: ['Web optimized', 'Good compression', 'Fast loading'],
    cons: ['Limited offline support', 'Newer format', 'Browser dependent'],
  },
]

// 验证音频文件
export function validateAudioFile(file: File): AudioValidationResult {
  const maxSize = 500 * 1024 * 1024 // 500MB
  const allowedTypes = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/wave',
    'audio/x-wav',
    'audio/aac',
    'audio/ogg',
    'audio/flac',
    'audio/x-flac',
    'audio/m4a',
    'audio/mp4',
    'audio/x-m4a',
    'audio/wma',
    'audio/x-ms-wma',
    'audio/webm',
  ]

  const warnings: string[] = []

  // 检查文件类型
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: '不支持的音频格式',
      supportedFormats: ['MP3', 'WAV', 'AAC', 'OGG', 'FLAC', 'M4A', 'WMA', 'WebM'],
    }
  }

  // 检查文件大小
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `文件过大，最大支持 ${formatFileSize(maxSize)}`,
      maxSize,
    }
  }

  // 检查文件大小警告
  if (file.size > 100 * 1024 * 1024) {
    // 100MB
    warnings.push('文件较大，处理可能需要较长时间')
  }

  return {
    isValid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
  }
}

// 工具函数
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

// 注意：格式化文件大小请使用 '@/lib/utils' 中的 formatFileSize

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function downloadAsZip(files: { blob: Blob; filename: string }[], zipName: string): Promise<void> {
  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()

  files.forEach(({ blob, filename }) => {
    zip.file(filename, blob)
  })

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  downloadFile(zipBlob, zipName)
}

export function getAudioStats(file: File): Promise<AudioStats> {
  return new Promise((resolve, reject) => {
    const audio = document.createElement('audio')
    const url = URL.createObjectURL(file)

    audio.preload = 'metadata'
    audio.src = url

    audio.onloadedmetadata = () => {
      resolve({
        duration: audio.duration,
        bitrate: Math.round((file.size * 8) / audio.duration / 1000), // 估算比特率
        sampleRate: 44100, // 默认值，实际需要更复杂的分析
        channels: 2, // 默认值
        fileSize: file.size,
        format: file.type.split('/')[1] || 'unknown',
      })
      URL.revokeObjectURL(url)
    }

    audio.onerror = () => {
      reject(new Error('无法读取音频元数据'))
      URL.revokeObjectURL(url)
    }
  })
}
