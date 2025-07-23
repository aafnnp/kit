import { formatFileSize } from "@/lib/utils"
import { AudioFile, AudioFormatInfo, AudioProcessingProgress, AudioStats, AudioTemplate, AudioValidationResult, ConvertResult, ConvertSettings } from "@/types/audio-convert"
import { useCallback, useState } from "react"

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
    cons: ['Lossy compression', 'Patent restrictions', 'Not ideal for professional use']
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
    cons: ['Large file size', 'Limited metadata support', 'Not efficient for storage']
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
    cons: ['Larger than lossy formats', 'Limited mobile support', 'Higher CPU usage']
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
    cons: ['Less universal than MP3', 'Lossy compression', 'Patent restrictions']
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
    cons: ['Limited hardware support', 'Less popular', 'Compatibility issues']
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
    cons: ['Limited compatibility', 'Apple-centric', 'Complex format']
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
    cons: ['Microsoft proprietary', 'Limited cross-platform support', 'Declining popularity']
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
    cons: ['Limited offline support', 'Newer format', 'Less universal']
  }
}

// 音频转换模板
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
      quality: 95,
      preserveMetadata: true,
      normalizeAudio: false
    },
    useCase: 'High-quality music playback and storage',
    pros: ['Excellent quality', 'Universal compatibility', 'Reasonable file size'],
    cons: ['Still lossy', 'Larger than lower bitrates']
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
      quality: 80,
      preserveMetadata: true,
      normalizeAudio: true
    },
    useCase: 'Podcasts, audiobooks, speech recordings',
    pros: ['Small file size', 'Good for speech', 'Fast streaming'],
    cons: ['Not suitable for music', 'Lower quality', 'Mono audio']
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
      quality: 100,
      preserveMetadata: true,
      normalizeAudio: false
    },
    useCase: 'Music archiving, audiophile listening, professional use',
    pros: ['Perfect quality', 'Lossless compression', 'Excellent metadata'],
    cons: ['Large file size', 'Limited compatibility', 'Higher CPU usage']
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
      quality: 90,
      preserveMetadata: true,
      normalizeAudio: true
    },
    useCase: 'Streaming services, mobile apps, modern devices',
    pros: ['Better than MP3', 'Good compression', 'Modern standard'],
    cons: ['Less universal', 'Patent restrictions', 'Lossy compression']
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
      quality: 85,
      preserveMetadata: false,
      normalizeAudio: true
    },
    useCase: 'Web applications, online streaming, progressive web apps',
    pros: ['Web optimized', 'Good compression', 'Fast loading'],
    cons: ['Limited offline support', 'Newer format', 'Browser dependent']
  }
]

// 音频文件验证
export const validateAudioFile = (file: File): AudioValidationResult => {
  const maxSize = 200 * 1024 * 1024 // 200MB
  const supportedFormats = [
    'audio/mpeg',
    'audio/wav',
    'audio/x-wav',
    'audio/aac',
    'audio/ogg',
    'audio/flac',
    'audio/mp4',
    'audio/x-m4a',
    'audio/x-flac',
    'audio/x-aac',
    'audio/x-ms-wma',
    'audio/webm',
    'audio/3gpp',
    'audio/3gpp2'
  ]

  if (!supportedFormats.includes(file.type)) {
    return {
      isValid: false,
      error: `Unsupported format: ${file.type}`,
      supportedFormats,
      maxSize
    }
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File too large. Maximum size is ${formatFileSize(maxSize)}`,
      supportedFormats,
      maxSize
    }
  }

  const warnings: string[] = []
  if (file.size > 50 * 1024 * 1024) { // 50MB
    warnings.push('Large file may take longer to process')
  }

  return {
    isValid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
    supportedFormats,
    maxSize
  }
}

// 音频元数据分析 hook
export const useAudioAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const analyzeAudio = useCallback(async (file: File): Promise<AudioStats> => {
    setIsAnalyzing(true)
    try {
      return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file)
        const audio = document.createElement('audio')
        audio.preload = 'metadata'
        audio.src = url

        const timeout = setTimeout(() => {
          reject(new Error('Audio analysis timeout'))
          URL.revokeObjectURL(url)
        }, 10000) // 10 second timeout

        audio.onloadedmetadata = () => {
          clearTimeout(timeout)
          const stats: AudioStats = {
            duration: audio.duration || 0,
            bitrate: audio.duration > 0 ? Math.round((file.size * 8) / audio.duration / 1000) : 0,
            sampleRate: (audio as any).sampleRate || 44100,
            channels: (audio as any).channels || 2,
            fileSize: file.size,
            format: file.type.split('/')[1] || 'unknown',
            codec: file.type
          }
          resolve(stats)
          URL.revokeObjectURL(url)
        }

        audio.onerror = () => {
          clearTimeout(timeout)
          reject(new Error('Failed to analyze audio metadata'))
          URL.revokeObjectURL(url)
        }
      })
    } finally {
      setIsAnalyzing(false)
    }
  }, [])

  return { analyzeAudio, isAnalyzing }
}

// 音频转换 hook
export const useAudioConversion = () => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState<AudioProcessingProgress>({
    current: 0,
    total: 0,
    percentage: 0
  })

  const convertAudio = useCallback(async (file: File, settings: ConvertSettings): Promise<ConvertResult> => {
    setIsProcessing(true)
    setProgress({
      current: 1,
      total: 1,
      percentage: 0,
      currentFile: file.name,
      stage: 'loading'
    })

    try {
      // 模拟转换过程（实际项目中应该使用 FFmpeg.wasm 或服务器端转换）
      await new Promise(resolve => setTimeout(resolve, 1000))

      setProgress(prev => ({ ...prev, percentage: 25, stage: 'analyzing' }))
      await new Promise(resolve => setTimeout(resolve, 500))

      setProgress(prev => ({ ...prev, percentage: 50, stage: 'converting' }))
      await new Promise(resolve => setTimeout(resolve, 2000))

      setProgress(prev => ({ ...prev, percentage: 90, stage: 'finalizing' }))
      await new Promise(resolve => setTimeout(resolve, 500))

      // 创建模拟的转换结果
      const blob = new Blob([file], { type: `audio/${settings.format}` })
      const url = URL.createObjectURL(blob)

      setProgress(prev => ({ ...prev, percentage: 100 }))

      return {
        url,
        size: blob.size,
        format: settings.format,
        duration: 0, // 实际实现中应该获取真实时长
        bitrate: settings.bitrate,
        sampleRate: settings.sampleRate,
        channels: settings.channels
      }
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const convertBatch = useCallback(async (
    files: AudioFile[],
    settings: ConvertSettings,
    onProgress?: (current: number, total: number) => void
  ): Promise<ConvertResult[]> => {
    const results: ConvertResult[] = []
    const total = files.length

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      setProgress({
        current: i + 1,
        total,
        percentage: Math.round(((i + 1) / total) * 100),
        currentFile: file.name
      })

      try {
        const result = await convertAudio(file.file, settings)
        results.push(result)
        onProgress?.(i + 1, total)
      } catch (error) {
        console.error(`Failed to convert ${file.name}:`, error)
        // 继续处理其他文件
      }
    }

    return results
  }, [convertAudio])

  return {
    convertAudio,
    convertBatch,
    isProcessing,
    progress
  }
}