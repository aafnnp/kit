import { useState, useCallback, useRef } from 'react'
import { getWorkerManager } from '@/lib/workers'
import type { ImageFile, CompressionSettings, WorkerImageData, WorkerCompressionResult } from './types'

export interface UseImageCompressionReturn {
  compressImages: (images: ImageFile[], settings: CompressionSettings) => Promise<void>
  isCompressing: boolean
  progress: number
  cancelCompression: () => void
}

/**
 * 优化的图片压缩钩子，支持Web Worker并行处理
 */
export function useImageCompression(
  onProgress?: (imageId: string, progress: number) => void,
  onComplete?: (imageId: string, result: Blob, originalSize: number, compressedSize: number) => void,
  onError?: (imageId: string, error: string) => void
): UseImageCompressionReturn {
  const [isCompressing, setIsCompressing] = useState(false)
  const [progress, setProgress] = useState(0)
  const workerManager = useRef(getWorkerManager())
  const activeTaskIds = useRef<Set<string>>(new Set())

  const compressImages = useCallback(
    async (images: ImageFile[], settings: CompressionSettings) => {
      if (images.length === 0) return

      setIsCompressing(true)
      setProgress(0)

      const completedCount = { value: 0 }
      const totalImages = images.length

      try {
        // 为每个图片创建压缩任务
        const tasks = images.map(async (image) => {
          const taskId = `compress-${image.id}-${Date.now()}`
          activeTaskIds.current.add(taskId)

          try {
            // 将文件转换为ArrayBuffer
            const arrayBuffer = await image.file.arrayBuffer()

            const result = await workerManager.current.addTask<WorkerImageData, WorkerCompressionResult>({
              id: taskId,
              type: 'compress-image',
              data: {
                imageData: arrayBuffer,
                fileName: image.file.name,
                settings: settings,
              },
              priority: 'high',
              onProgress: (progress) => {
                onProgress?.(image.id, progress)
              },
              onComplete: (result: WorkerCompressionResult) => {
                const { compressedBlob, originalSize, compressedSize } = result
                onComplete?.(image.id, compressedBlob, originalSize, compressedSize)

                completedCount.value++
                const overallProgress = (completedCount.value / totalImages) * 100
                setProgress(overallProgress)

                activeTaskIds.current.delete(taskId)
              },
              onError: (error: Error) => {
                onError?.(image.id, error.message)
                completedCount.value++
                const overallProgress = (completedCount.value / totalImages) * 100
                setProgress(overallProgress)

                activeTaskIds.current.delete(taskId)
              },
            })

            return result
          } catch (error) {
            activeTaskIds.current.delete(taskId)
            onError?.(image.id, error instanceof Error ? error.message : 'Unknown error')
            completedCount.value++
            const overallProgress = (completedCount.value / totalImages) * 100
            setProgress(overallProgress)
            throw error
          }
        })

        // 等待所有任务完成
        await Promise.allSettled(tasks)
      } catch (error) {
        console.error('Batch compression error:', error)
      } finally {
        setIsCompressing(false)
        setProgress(100)
      }
    },
    [onProgress, onComplete, onError]
  )

  const cancelCompression = useCallback(() => {
    // 取消所有活跃的任务
    activeTaskIds.current.forEach((taskId) => {
      workerManager.current.cancelTask(taskId)
    })
    activeTaskIds.current.clear()

    setIsCompressing(false)
    setProgress(0)
  }, [])

  return {
    compressImages,
    isCompressing,
    progress,
    cancelCompression,
  }
}

/**
 * 验证图片文件
 */
export function validateImageFile(file: File): { isValid: boolean; error?: string } {
  // 检查文件类型
  if (!file.type.startsWith('image/')) {
    return { isValid: false, error: 'File must be an image' }
  }

  // 检查支持的格式
  const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  if (!supportedTypes.includes(file.type)) {
    return { isValid: false, error: 'Unsupported image format' }
  }

  // 检查文件大小 (100MB)
  const maxSize = 100 * 1024 * 1024
  if (file.size > maxSize) {
    return { isValid: false, error: 'File size must be less than 100MB' }
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
 * 计算压缩比
 */
export function calculateCompressionRatio(originalSize: number, compressedSize: number): number {
  if (originalSize === 0) return 0
  return Math.round(((originalSize - compressedSize) / originalSize) * 100)
}

/**
 * 下载文件
 */
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

/**
 * 批量下载为ZIP文件
 */
export async function downloadAsZip(files: { blob: Blob; filename: string }[], zipName: string): Promise<void> {
  try {
    // 动态导入JSZip
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()

    // 添加文件到ZIP
    files.forEach(({ blob, filename }) => {
      zip.file(filename, blob)
    })

    // 生成ZIP文件
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    downloadFile(zipBlob, zipName)
  } catch (error) {
    console.error('Failed to create ZIP file:', error)
    throw new Error('Failed to create ZIP file')
  }
}
