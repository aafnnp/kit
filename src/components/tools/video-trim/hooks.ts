import { useState, useCallback, useRef } from 'react'
import { getWorkerManager } from '@/lib/worker-manager'
import type { VideoFile, TrimSettings, TrimResult, VideoStats } from '@/types/video-trim'

export interface UseVideoTrimReturn {
  trimVideos: (videos: VideoFile[], settings: TrimSettings) => Promise<void>
  isProcessing: boolean
  progress: number
  cancelProcessing: () => void
}

/**
 * 优化的视频裁剪钩子，支持Web Worker并行处理
 */
export function useVideoTrim(
  onProgress?: (videoId: string, progress: number, message?: string) => void,
  onComplete?: (videoId: string, result: TrimResult) => void,
  onError?: (videoId: string, error: string) => void
): UseVideoTrimReturn {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const workerManager = useRef(getWorkerManager())
  const activeTaskIds = useRef<Set<string>>(new Set())

  const trimVideos = useCallback(
    async (videos: VideoFile[], settings: TrimSettings) => {
      if (videos.length === 0) return

      setIsProcessing(true)
      setProgress(0)

      const completedCount = { value: 0 }
      const totalVideos = videos.length

      try {
        // 为每个视频创建裁剪任务
        const tasks = videos.map(async (video) => {
          const taskId = `trim-${video.id}-${Date.now()}`
          activeTaskIds.current.add(taskId)

          try {
            // 将文件转换为ArrayBuffer
            const arrayBuffer = await video.file.arrayBuffer()

            const result = await workerManager.current.addTask<
              { fileBuffer: ArrayBuffer; fileName: string; settings: TrimSettings },
              { buffer: ArrayBuffer; size: number; format: string; duration: number }
            >({
              id: taskId,
              type: 'trim-video',
              data: {
                fileBuffer: arrayBuffer,
                fileName: video.file.name,
                settings,
              },
              priority: 'high',
              onProgress: (progressValue: number, message?: string) => {
                onProgress?.(video.id, progressValue, message)
              },
            })

            // 创建结果Blob
            const blob = new Blob([result.buffer], { type: `video/${result.format}` })
            const url = URL.createObjectURL(blob)

            const trimResult: TrimResult = {
              url,
              size: result.size,
              format: result.format,
              duration: result.duration,
            }

            onComplete?.(video.id, trimResult)

            completedCount.value++
            setProgress(Math.round((completedCount.value / totalVideos) * 100))
          } catch (error) {
            console.error(`Video trim failed for ${video.id}:`, error)
            onError?.(video.id, error instanceof Error ? error.message : 'Video trim failed')
          } finally {
            activeTaskIds.current.delete(taskId)
          }
        })

        // 等待所有任务完成
        await Promise.allSettled(tasks)
      } catch (error) {
        console.error('Batch video trim failed:', error)
        throw error
      } finally {
        setIsProcessing(false)
        setProgress(100)
      }
    },
    [onProgress, onComplete, onError]
  )

  const cancelProcessing = useCallback(() => {
    // 取消所有活跃任务
    activeTaskIds.current.forEach((taskId) => {
      workerManager.current.cancelTask(taskId)
    })
    activeTaskIds.current.clear()
    setIsProcessing(false)
    setProgress(0)
  }, [])

  return {
    trimVideos,
    isProcessing,
    progress,
    cancelProcessing,
  }
}

/**
 * 视频文件验证
 */
export function validateVideoFile(file: File): { isValid: boolean; error?: string } {
  const maxSize = 500 * 1024 * 1024 // 500MB
  const allowedTypes = [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
    'video/x-matroska',
    'video/avi',
    'video/mov',
  ]

  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: '不支持的格式' }
  }

  if (file.size > maxSize) {
    return { isValid: false, error: '文件过大，最大 500MB' }
  }

  return { isValid: true }
}

/**
 * 生成唯一ID
 */
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 格式化时间（秒转为 mm:ss 格式）
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * 下载文件
 */
export function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * 批量下载为ZIP
 */
export async function downloadAsZip(files: { blob: Blob; filename: string }[], zipName: string): Promise<void> {
  const { zipSync } = await import('fflate')

  const zipData: Record<string, Uint8Array> = {}

  for (const file of files) {
    const arrayBuffer = await file.blob.arrayBuffer()
    zipData[file.filename] = new Uint8Array(arrayBuffer)
  }

  const zipped = zipSync(zipData)
  const zipBlob = new Blob([zipped], { type: 'application/zip' })

  downloadFile(zipBlob, zipName)
}

/**
 * 获取视频元数据（使用HTML5 Video API）
 */
export function getVideoStats(file: File): Promise<VideoStats> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')

    video.preload = 'metadata'
    video.src = url

    video.onloadedmetadata = () => {
      const stats: VideoStats = {
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        bitrate: Math.round((file.size * 8) / video.duration),
        fileSize: file.size,
        format: file.type.split('/')[1] || 'unknown',
      }

      resolve(stats)
      URL.revokeObjectURL(url)
    }

    video.onerror = () => {
      reject(new Error('无法读取视频元数据'))
      URL.revokeObjectURL(url)
    }
  })
}
