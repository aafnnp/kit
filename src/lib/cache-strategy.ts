/**
 * 缓存策略管理器 - 实现高级缓存策略和内存优化
 */
import React from 'react'
import { cache } from './cache'
import i18n from '@/locales'

interface CacheConfig {
  maxMemoryUsage: number // MB
  maxDiskUsage: number // MB
  compressionEnabled: boolean
  persistentCacheEnabled: boolean
  autoCleanupInterval: number // 分钟
}

interface MemoryStats {
  usedMemory: number
  totalMemory: number
  cacheMemory: number
  heapUsed: number
  heapTotal: number
}

interface CacheStrategyStats {
  memoryStats: MemoryStats
  diskCacheSize: number
  compressionRatio: number
  cleanupCount: number
  lastCleanup: number
  persistentCacheHits: number
  persistentCacheMisses: number
}

class CacheStrategyManager {
  private config: CacheConfig = {
    maxMemoryUsage: 100, // 100MB
    maxDiskUsage: 500, // 500MB
    compressionEnabled: true,
    persistentCacheEnabled: true,
    autoCleanupInterval: 30, // 30分钟
  }

  private stats: CacheStrategyStats = {
    memoryStats: {
      usedMemory: 0,
      totalMemory: 0,
      cacheMemory: 0,
      heapUsed: 0,
      heapTotal: 0,
    },
    diskCacheSize: 0,
    compressionRatio: 0,
    cleanupCount: 0,
    lastCleanup: Date.now(),
    persistentCacheHits: 0,
    persistentCacheMisses: 0,
  }

  private persistentCache = new Map<string, any>()
  private compressionCache = new Map<string, string>()
  private cleanupTimer: NodeJS.Timeout | null = null

  constructor() {
    this.initializeAutoCleanup()
    this.loadPersistentCache()
  }

  /**
   * 初始化自动清理
   */
  private initializeAutoCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }

    this.cleanupTimer = setInterval(
      () => {
        this.performAutoCleanup()
      },
      this.config.autoCleanupInterval * 60 * 1000
    )
  }

  /**
   * 加载持久化缓存
   */
  private async loadPersistentCache(): Promise<void> {
    if (!this.config.persistentCacheEnabled) return

    try {
      const stored = localStorage.getItem('kit_persistent_cache')
      if (stored) {
        const data = JSON.parse(stored)
        this.persistentCache = new Map(data.entries || [])
        this.stats.diskCacheSize = new Blob([stored]).size
      }
    } catch (error) {
      console.warn('Failed to load persistent cache:', error)
    }
  }

  /**
   * 保存持久化缓存
   */
  private async savePersistentCache(): Promise<void> {
    if (!this.config.persistentCacheEnabled) return

    try {
      const data = {
        entries: Array.from(this.persistentCache.entries()),
        timestamp: Date.now(),
      }
      const serialized = JSON.stringify(data)

      // 检查大小限制
      const size = new Blob([serialized]).size / 1024 / 1024 // MB
      if (size > this.config.maxDiskUsage) {
        await this.cleanupPersistentCache()
        return
      }

      localStorage.setItem('kit_persistent_cache', serialized)
      this.stats.diskCacheSize = size
    } catch (error) {
      console.warn('Failed to save persistent cache:', error)
    }
  }

  /**
   * 压缩数据
   */
  private compressData(data: string): string {
    if (!this.config.compressionEnabled) return data

    try {
      // 简单的压缩算法（实际项目中可以使用更好的压缩库）
      const compressed = btoa(data)
      const originalSize = data.length
      const compressedSize = compressed.length

      this.stats.compressionRatio = originalSize > 0 ? compressedSize / originalSize : 1

      return compressed
    } catch (error) {
      console.warn('Compression failed:', error)
      return data
    }
  }

  /**
   * 解压数据
   */
  private decompressData(data: string): string {
    if (!this.config.compressionEnabled) return data

    try {
      return atob(data)
    } catch (error) {
      console.warn('Decompression failed:', error)
      return data
    }
  }

  /**
   * 获取内存使用情况
   */
  private getMemoryStats(): MemoryStats {
    const stats: MemoryStats = {
      usedMemory: 0,
      totalMemory: 0,
      cacheMemory: 0,
      heapUsed: 0,
      heapTotal: 0,
    }

    // 获取性能内存信息（如果支持）
    if ('memory' in performance) {
      const memory = (performance as any).memory
      stats.heapUsed = memory.usedJSHeapSize / 1024 / 1024 // MB
      stats.heapTotal = memory.totalJSHeapSize / 1024 / 1024 // MB
      stats.usedMemory = stats.heapUsed
      stats.totalMemory = stats.heapTotal
    }

    // 估算缓存内存使用
    const cacheStats = cache.getStats()
    stats.cacheMemory = cacheStats.size * 0.001 // 粗略估算每个缓存项1KB

    return stats
  }

  /**
   * 执行自动清理
   */
  private async performAutoCleanup(): Promise<void> {
    const memoryStats = this.getMemoryStats()

    // 检查内存使用是否超限
    if (memoryStats.usedMemory > this.config.maxMemoryUsage) {
      await this.cleanupMemoryCache()
    }

    // 检查磁盘缓存是否超限
    if (this.stats.diskCacheSize > this.config.maxDiskUsage) {
      await this.cleanupPersistentCache()
    }

    // 清理过期缓存
    cache.cleanup()

    this.stats.cleanupCount++
    this.stats.lastCleanup = Date.now()
  }

  /**
   * 清理内存缓存
   */
  private async cleanupMemoryCache(): Promise<void> {
    // 清理一半的缓存
    const cacheStats = cache.getStats()
    const targetSize = Math.floor(cacheStats.maxSize * 0.5)
    cache.setMaxSize(targetSize)

    // 强制垃圾回收（如果支持）
    if ('gc' in window && typeof (window as any).gc === 'function') {
      ;(window as any).gc()
    }
  }

  /**
   * 清理持久化缓存
   */
  private async cleanupPersistentCache(): Promise<void> {
    // 删除最旧的一半缓存项
    const entries = Array.from(this.persistentCache.entries())
    const toDelete = Math.floor(entries.length * 0.5)

    for (let i = 0; i < toDelete; i++) {
      this.persistentCache.delete(entries[i][0])
    }

    await this.savePersistentCache()
  }

  /**
   * 设置持久化缓存
   */
  async setPersistent<T>(key: string, data: T, ttl: number = 24 * 60 * 60 * 1000): Promise<void> {
    const item = {
      data,
      timestamp: Date.now(),
      ttl,
    }

    const serialized = JSON.stringify(item)
    const compressed = this.compressData(serialized)

    this.persistentCache.set(key, compressed)
    await this.savePersistentCache()
  }

  /**
   * 获取持久化缓存
   */
  async getPersistent<T>(key: string): Promise<T | null> {
    const compressed = this.persistentCache.get(key)
    if (!compressed) {
      this.stats.persistentCacheMisses++
      return null
    }

    try {
      const serialized = this.decompressData(compressed)
      const item = JSON.parse(serialized)

      // 检查是否过期
      if (Date.now() - item.timestamp > item.ttl) {
        this.persistentCache.delete(key)
        await this.savePersistentCache()
        this.stats.persistentCacheMisses++
        return null
      }

      this.stats.persistentCacheHits++
      return item.data
    } catch (error) {
      console.warn('Failed to parse persistent cache item:', error)
      this.persistentCache.delete(key)
      this.stats.persistentCacheMisses++
      return null
    }
  }

  /**
   * 删除持久化缓存
   */
  async deletePersistent(key: string): Promise<boolean> {
    const result = this.persistentCache.delete(key)
    if (result) {
      await this.savePersistentCache()
    }
    return result
  }

  /**
   * 清空所有缓存
   */
  async clearAll(): Promise<void> {
    cache.clear()
    this.persistentCache.clear()
    this.compressionCache.clear()

    try {
      localStorage.removeItem('kit_persistent_cache')
    } catch (error) {
      console.warn('Failed to clear persistent cache:', error)
    }

    this.stats = {
      ...this.stats,
      diskCacheSize: 0,
      cleanupCount: 0,
      persistentCacheHits: 0,
      persistentCacheMisses: 0,
    }
  }

  /**
   * 获取缓存策略统计信息
   */
  getStats(): CacheStrategyStats {
    this.stats.memoryStats = this.getMemoryStats()
    return { ...this.stats }
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig }

    // 重新初始化自动清理
    if (newConfig.autoCleanupInterval !== undefined) {
      this.initializeAutoCleanup()
    }

    // 如果禁用持久化缓存，清理现有数据
    if (newConfig.persistentCacheEnabled === false) {
      this.persistentCache.clear()
      try {
        localStorage.removeItem('kit_persistent_cache')
      } catch (error) {
        console.warn('Failed to clear persistent cache:', error)
      }
    }
  }

  /**
   * 获取配置
   */
  getConfig(): CacheConfig {
    return { ...this.config }
  }

  /**
   * 获取缓存优化建议
   */
  getOptimizationSuggestions(): string[] {
    const suggestions: string[] = []
    const memoryStats = this.getMemoryStats()
    const cacheStats = cache.getStats()

    // 内存使用建议
    if (memoryStats.usedMemory > this.config.maxMemoryUsage * 0.8) {
      suggestions.push(i18n.t('settings.cacheStrategy.optimizeSuggestions.lowMemoryUsage'))
    }

    // 缓存命中率建议
    const hitRate = (cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100
    if (hitRate < 50) {
      suggestions.push(i18n.t('settings.cacheStrategy.optimizeSuggestions.lowCacheHitRate'))
    }

    // 磁盘缓存建议
    if (this.stats.diskCacheSize > this.config.maxDiskUsage * 0.8) {
      suggestions.push(i18n.t('settings.cacheStrategy.optimizeSuggestions.highDiskUsage'))
    }

    // 压缩建议
    if (!this.config.compressionEnabled && this.stats.diskCacheSize > 50) {
      suggestions.push(i18n.t('settings.cacheStrategy.optimizeSuggestions.enableCompression'))
    }

    // 自动清理建议
    if (this.config.autoCleanupInterval > 60) {
      suggestions.push(i18n.t('settings.cacheStrategy.optimizeSuggestions.shortAutoClearInterval'))
    }

    return suggestions
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
  }
}

// 创建全局缓存策略管理器实例
export const cacheStrategy = new CacheStrategyManager()

// 文件处理工具的内存优化装饰器
export function memoryOptimized<T extends (...args: any[]) => any>(
  maxMemoryUsage: number = 50 // MB
) {
  return function (_target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: Parameters<T>): Promise<ReturnType<T>> {
      const memoryBefore = cacheStrategy.getStats().memoryStats.usedMemory

      try {
        const result = await originalMethod.apply(this, args)

        const memoryAfter = cacheStrategy.getStats().memoryStats.usedMemory
        const memoryUsed = memoryAfter - memoryBefore

        // 如果内存使用超过限制，触发清理
        if (memoryUsed > maxMemoryUsage) {
          console.warn(`Method ${propertyKey} used ${memoryUsed}MB memory, triggering cleanup`)
          await cacheStrategy.clearAll()
        }

        return result
      } catch (error) {
        // 发生错误时也要检查内存
        const memoryAfter = cacheStrategy.getStats().memoryStats.usedMemory
        if (memoryAfter > memoryBefore + maxMemoryUsage) {
          await cacheStrategy.clearAll()
        }
        throw error
      }
    }

    return descriptor
  }
}

// React Hook - 使用持久化缓存
export function usePersistentCache<T>(
  key: string,
  factory: () => Promise<T>,
  ttl: number = 24 * 60 * 60 * 1000
): [T | null, boolean, () => Promise<void>] {
  const [data, setData] = React.useState<T | null>(null)
  const [loading, setLoading] = React.useState(true)

  const refresh = React.useCallback(async () => {
    setLoading(true)
    try {
      // 先尝试从持久化缓存获取
      const cached = await cacheStrategy.getPersistent<T>(key)
      if (cached !== null) {
        setData(cached)
        setLoading(false)
        return
      }

      // 缓存未命中，执行工厂函数
      const newData = await factory()
      await cacheStrategy.setPersistent(key, newData, ttl)
      setData(newData)
    } catch (error) {
      console.error('Failed to load persistent cache:', error)
    } finally {
      setLoading(false)
    }
  }, [key, factory, ttl])

  React.useEffect(() => {
    refresh()
  }, [refresh])

  return [data, loading, refresh]
}

// 导出类型
export type { CacheConfig, MemoryStats, CacheStrategyStats }
