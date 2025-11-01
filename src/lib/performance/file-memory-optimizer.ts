/**
 * 文件处理工具内存优化器 - 专门优化文件处理工具的内存使用
 */
import React from 'react'
import { cacheStrategy } from '@/lib/storage'

interface FileProcessingStats {
  totalFilesProcessed: number
  totalMemoryUsed: number
  averageMemoryPerFile: number
  peakMemoryUsage: number
  memoryLeaks: number
  gcTriggered: number
  lastOptimization: number
}

interface FileMemoryConfig {
  maxFileSize: number // MB
  maxConcurrentFiles: number
  memoryThreshold: number // MB
  enableChunkedProcessing: boolean
  chunkSize: number // MB
  autoGarbageCollection: boolean
  enableMemoryMonitoring: boolean
}

class FileMemoryOptimizer {
  private config: FileMemoryConfig = {
    maxFileSize: 100, // 100MB
    maxConcurrentFiles: 3,
    memoryThreshold: 200, // 200MB
    enableChunkedProcessing: true,
    chunkSize: 10, // 10MB
    autoGarbageCollection: true,
    enableMemoryMonitoring: true,
  }

  private stats: FileProcessingStats = {
    totalFilesProcessed: 0,
    totalMemoryUsed: 0,
    averageMemoryPerFile: 0,
    peakMemoryUsage: 0,
    memoryLeaks: 0,
    gcTriggered: 0,
    lastOptimization: Date.now(),
  }

  private processingQueue: Array<{
    id: string
    file: File
    processor: (file: File) => Promise<any>
    resolve: (value: any) => void
    reject: (error: any) => void
  }> = []

  private activeProcessing = new Set<string>()
  private memoryMonitorInterval: NodeJS.Timeout | null = null

  constructor() {}

  /**
   * 初始化内存监控
   */
  private initializeMemoryMonitoring(): void {
    if (this.memoryMonitorInterval || !this.config.enableMemoryMonitoring) return
    this.memoryMonitorInterval = setInterval(() => {
      this.checkMemoryUsage()
    }, 5000)
  }

  /**
   * 检查内存使用情况
   */
  private checkMemoryUsage(): void {
    const memoryStats = cacheStrategy.getStats().memoryStats
    const currentMemory = memoryStats.usedMemory

    // 更新峰值内存使用
    if (currentMemory > this.stats.peakMemoryUsage) {
      this.stats.peakMemoryUsage = currentMemory
    }

    // 检查是否超过阈值
    if (currentMemory > this.config.memoryThreshold) {
      this.triggerMemoryOptimization()
    }

    // 检测内存泄漏
    if (this.activeProcessing.size === 0 && currentMemory > this.config.memoryThreshold * 0.5) {
      this.stats.memoryLeaks++
      console.warn('Potential memory leak detected')
    }
  }

  /**
   * 触发内存优化
   */
  private async triggerMemoryOptimization(): Promise<void> {
    console.log('Triggering memory optimization...')

    // 清理缓存
    await cacheStrategy.clearAll()

    // 触发垃圾回收
    if (this.config.autoGarbageCollection && 'gc' in window) {
      try {
        ;(window as any).gc()
        this.stats.gcTriggered++
      } catch (error) {
        console.warn('Manual garbage collection failed:', error)
      }
    }

    this.stats.lastOptimization = Date.now()
  }

  /**
   * 验证文件是否可以处理
   */
  private validateFile(file: File): { valid: boolean; reason?: string } {
    const fileSizeMB = file.size / 1024 / 1024

    if (fileSizeMB > this.config.maxFileSize) {
      return {
        valid: false,
        reason: `文件大小 ${fileSizeMB.toFixed(1)}MB 超过限制 ${this.config.maxFileSize}MB`,
      }
    }

    if (this.activeProcessing.size >= this.config.maxConcurrentFiles) {
      return {
        valid: false,
        reason: `并发处理文件数量已达上限 ${this.config.maxConcurrentFiles}`,
      }
    }

    return { valid: true }
  }

  /**
   * 分块处理大文件
   */
  private async processFileInChunks<T>(
    file: File,
    processor: (chunk: Blob, index: number, total: number) => Promise<T>,
    combiner: (results: T[]) => T
  ): Promise<T> {
    const chunkSizeBytes = this.config.chunkSize * 1024 * 1024
    const totalChunks = Math.ceil(file.size / chunkSizeBytes)
    const results: T[] = []

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSizeBytes
      const end = Math.min(start + chunkSizeBytes, file.size)
      const chunk = file.slice(start, end)

      try {
        const result = await processor(chunk, i, totalChunks)
        results.push(result)

        // 检查内存使用
        const memoryStats = cacheStrategy.getStats().memoryStats
        if (memoryStats.usedMemory > this.config.memoryThreshold) {
          await this.triggerMemoryOptimization()
        }
      } catch (error) {
        throw new Error(`处理第 ${i + 1} 块时失败: ${error}`)
      }
    }

    return combiner(results)
  }

  /**
   * 优化文件处理
   */
  async processFile<T>(
    file: File,
    processor: (file: File) => Promise<T>,
    options: {
      enableChunking?: boolean
      chunkProcessor?: (chunk: Blob, index: number, total: number) => Promise<any>
      chunkCombiner?: (results: any[]) => T
    } = {}
  ): Promise<T> {
    const validation = this.validateFile(file)
    if (!validation.valid) {
      throw new Error(validation.reason)
    }

    const processingId = `${file.name}_${Date.now()}`
    this.activeProcessing.add(processingId)

    const memoryBefore = cacheStrategy.getStats().memoryStats.usedMemory

    try {
      let result: T

      // 检查是否需要分块处理
      const fileSizeMB = file.size / 1024 / 1024
      const shouldChunk =
        options.enableChunking &&
        this.config.enableChunkedProcessing &&
        fileSizeMB > this.config.chunkSize &&
        options.chunkProcessor &&
        options.chunkCombiner

      if (shouldChunk) {
        result = await this.processFileInChunks(file, options.chunkProcessor!, options.chunkCombiner!)
      } else {
        result = await processor(file)
      }

      // 更新统计信息
      const memoryAfter = cacheStrategy.getStats().memoryStats.usedMemory
      const memoryUsed = memoryAfter - memoryBefore

      this.stats.totalFilesProcessed++
      this.stats.totalMemoryUsed += memoryUsed
      this.stats.averageMemoryPerFile = this.stats.totalMemoryUsed / this.stats.totalFilesProcessed

      return result
    } finally {
      this.activeProcessing.delete(processingId)
    }
  }

  /**
   * 批量处理文件
   */
  async processBatch<T>(
    files: File[],
    processor: (file: File) => Promise<T>,
    options: {
      maxConcurrent?: number
      onProgress?: (completed: number, total: number) => void
      enableChunking?: boolean
    } = {}
  ): Promise<T[]> {
    const maxConcurrent = options.maxConcurrent || this.config.maxConcurrentFiles
    const results: T[] = []
    let completed = 0

    // 分批处理
    for (let i = 0; i < files.length; i += maxConcurrent) {
      const batch = files.slice(i, i + maxConcurrent)

      const batchPromises = batch.map(async (file) => {
        try {
          const result = await this.processFile(file, processor, {
            enableChunking: options.enableChunking,
          })
          completed++
          options.onProgress?.(completed, files.length)
          return result
        } catch (error) {
          completed++
          options.onProgress?.(completed, files.length)
          throw error
        }
      })

      const batchResults = await Promise.allSettled(batchPromises)

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value)
        } else {
          console.error('File processing failed:', result.reason)
          throw result.reason
        }
      }

      // 批次间检查内存
      const memoryStats = cacheStrategy.getStats().memoryStats
      if (memoryStats.usedMemory > this.config.memoryThreshold) {
        await this.triggerMemoryOptimization()
      }
    }

    return results
  }

  /**
   * 创建内存优化的文件读取器
   */
  createOptimizedFileReader(): {
    readAsText: (file: File) => Promise<string>
    readAsDataURL: (file: File) => Promise<string>
    readAsArrayBuffer: (file: File) => Promise<ArrayBuffer>
  } {
    const readFile = <T>(file: File, method: 'readAsText' | 'readAsDataURL' | 'readAsArrayBuffer'): Promise<T> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()

        reader.onload = () => resolve(reader.result as T)
        reader.onerror = () => reject(new Error('文件读取失败'))

        // 检查内存使用
        const memoryStats = cacheStrategy.getStats().memoryStats
        if (memoryStats.usedMemory > this.config.memoryThreshold) {
          reject(new Error('内存使用过高，无法读取文件'))
          return
        }

        reader[method](file)
      })
    }

    return {
      readAsText: (file: File) => readFile<string>(file, 'readAsText'),
      readAsDataURL: (file: File) => readFile<string>(file, 'readAsDataURL'),
      readAsArrayBuffer: (file: File) => readFile<ArrayBuffer>(file, 'readAsArrayBuffer'),
    }
  }

  /**
   * 获取统计信息
   */
  getStats(): FileProcessingStats {
    return { ...this.stats }
  }

  /**
   * 获取配置
   */
  getConfig(): FileMemoryConfig {
    return { ...this.config }
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<FileMemoryConfig>): void {
    this.config = { ...this.config, ...newConfig }

    // 重新初始化内存监控
    if (newConfig.enableMemoryMonitoring !== undefined) {
      if (this.memoryMonitorInterval && !this.config.enableMemoryMonitoring) {
        clearInterval(this.memoryMonitorInterval)
        this.memoryMonitorInterval = null
      } else if (!this.memoryMonitorInterval && this.config.enableMemoryMonitoring) {
        this.initializeMemoryMonitoring()
      }
    }
  }

  /**
   * 获取内存优化建议
   */
  getOptimizationSuggestions(): string[] {
    const suggestions: string[] = []
    const memoryStats = cacheStrategy.getStats().memoryStats

    // 内存使用建议
    if (memoryStats.usedMemory > this.config.memoryThreshold * 0.8) {
      suggestions.push('内存使用接近阈值，建议减少并发处理文件数量')
    }

    // 文件大小建议
    if (this.stats.averageMemoryPerFile > 50) {
      suggestions.push('平均每文件内存使用较高，建议启用分块处理')
    }

    // 内存泄漏建议
    if (this.stats.memoryLeaks > 5) {
      suggestions.push('检测到多次内存泄漏，建议检查文件处理逻辑')
    }

    // 垃圾回收建议
    if (!this.config.autoGarbageCollection) {
      suggestions.push('建议启用自动垃圾回收以优化内存使用')
    }

    // 分块处理建议
    if (!this.config.enableChunkedProcessing && this.config.maxFileSize > 50) {
      suggestions.push('处理大文件时建议启用分块处理')
    }

    return suggestions
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    if (this.memoryMonitorInterval) {
      clearInterval(this.memoryMonitorInterval)
      this.memoryMonitorInterval = null
    }

    this.processingQueue.length = 0
    this.activeProcessing.clear()
  }

  /**
   * 销毁优化器
   */
  destroy(): void {
    this.cleanup()
    this.stats = {
      totalFilesProcessed: 0,
      totalMemoryUsed: 0,
      averageMemoryPerFile: 0,
      peakMemoryUsage: 0,
      memoryLeaks: 0,
      gcTriggered: 0,
      lastOptimization: Date.now(),
    }
  }

  // 外部控制：当有订阅者时启动监控
  startGuard(): void {
    this.initializeMemoryMonitoring()
  }
  stopGuard(): void {
    if (this.memoryMonitorInterval) {
      clearInterval(this.memoryMonitorInterval)
      this.memoryMonitorInterval = null
    }
  }
}

// 创建全局文件内存优化器实例
export const fileMemoryOptimizer = new FileMemoryOptimizer()

// 文件处理装饰器 - 自动应用内存优化
export function optimizedFileProcessing<T extends (...args: any[]) => Promise<any>>(
  options: {
    maxMemoryUsage?: number
    enableChunking?: boolean
    maxFileSize?: number
  } = {}
) {
  return function (_target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    console.log(propertyKey, 'propertyKey')
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: Parameters<T>): Promise<any> {
      const file = args.find((arg) => arg instanceof File)

      if (!file) {
        return originalMethod.apply(this, args)
      }

      return fileMemoryOptimizer.processFile(file, () => originalMethod.apply(this, args), {
        enableChunking: options.enableChunking,
      })
    }

    return descriptor
  }
}

// React Hook - 使用优化的文件处理
export function useOptimizedFileProcessing() {
  const processFile = React.useCallback(
    async <T>(
      file: File,
      processor: (file: File) => Promise<T>,
      options?: {
        enableChunking?: boolean
        onProgress?: (progress: number) => void
      }
    ): Promise<T> => {
      return fileMemoryOptimizer.processFile(file, processor, {
        enableChunking: options?.enableChunking,
      })
    },
    []
  )

  const processBatch = React.useCallback(
    async <T>(
      files: File[],
      processor: (file: File) => Promise<T>,
      options?: {
        maxConcurrent?: number
        onProgress?: (completed: number, total: number) => void
        enableChunking?: boolean
      }
    ): Promise<T[]> => {
      return fileMemoryOptimizer.processBatch(files, processor, options)
    },
    []
  )

  const getStats = React.useCallback(() => {
    return fileMemoryOptimizer.getStats()
  }, [])

  const getOptimizationSuggestions = React.useCallback(() => {
    return fileMemoryOptimizer.getOptimizationSuggestions()
  }, [])

  return {
    processFile,
    processBatch,
    getStats,
    getOptimizationSuggestions,
    fileReader: fileMemoryOptimizer.createOptimizedFileReader(),
  }
}

// 导出类型
export type { FileProcessingStats, FileMemoryConfig }
