/**
 * 缓存管理器 - 实现本地缓存机制，减少重复计算
 */

interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number // 生存时间（毫秒）
}

class CacheManager {
  private cache = new Map<string, CacheItem<any>>()
  private maxSize = 100 // 最大缓存条目数
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0,
  }

  /**
   * 设置缓存
   * @param key 缓存键
   * @param data 缓存数据
   * @param ttl 生存时间（毫秒），默认5分钟
   */
  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    // 如果缓存已满，删除最旧的条目
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey) {
        this.cache.delete(oldestKey)
        this.stats.evictions++
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
    this.stats.sets++
  }

  /**
   * 获取缓存
   * @param key 缓存键
   * @returns 缓存数据或null
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key)

    if (!item) {
      this.stats.misses++
      return null
    }

    // 检查是否过期
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      this.stats.misses++
      return null
    }

    this.stats.hits++
    return item.data
  }

  /**
   * 删除缓存
   * @param key 缓存键
   */
  delete(key: string): boolean {
    const result = this.cache.delete(key)
    if (result) {
      this.stats.deletes++
    }
    return result
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear()
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
    }
  }

  /**
   * 清理过期缓存
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): {
    size: number
    maxSize: number
    hits: number
    misses: number
    sets: number
    deletes: number
    evictions: number
  } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ...this.stats,
    }
  }

  /**
   * 设置最大缓存大小
   * @param size 最大缓存条目数
   */
  setMaxSize(size: number): void {
    this.maxSize = size

    // 如果当前缓存超过新的最大值，删除最旧的条目
    while (this.cache.size > this.maxSize) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey) {
        this.cache.delete(oldestKey)
      } else {
        break // 如果没有更多的键，退出循环
      }
    }
  }
}

// 创建全局缓存实例
export const cache = new CacheManager()

// 惰性清理守护：仅在有订阅者时启动，且可显式停止
let cleanupTimer: ReturnType<typeof setInterval> | null = null
let subscribers = 0

export function startCacheCleanupGuard(): void {
  if (cleanupTimer) return
  cleanupTimer = setInterval(
    () => {
      cache.cleanup()
    },
    5 * 60 * 1000
  )
}

export function stopCacheCleanupGuard(): void {
  if (cleanupTimer) {
    clearInterval(cleanupTimer)
    cleanupTimer = null
  }
}

export function subscribeCacheGuard(): () => void {
  subscribers++
  if (subscribers === 1) startCacheCleanupGuard()
  return () => {
    subscribers = Math.max(0, subscribers - 1)
    if (subscribers === 0) stopCacheCleanupGuard()
  }
}

/**
 * 缓存装饰器 - 用于函数结果缓存
 * @param ttl 生存时间（毫秒）
 * @param keyGenerator 缓存键生成函数
 */
export function cached<T extends (...args: any[]) => any>(
  ttl: number = 5 * 60 * 1000,
  keyGenerator?: (...args: Parameters<T>) => string
) {
  return function (_target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = function (...args: Parameters<T>): ReturnType<T> {
      const key = keyGenerator ? keyGenerator(...args) : `${propertyKey}_${JSON.stringify(args)}`

      // 尝试从缓存获取
      const cached = cache.get<ReturnType<T>>(key)
      if (cached !== null) {
        return cached
      }

      // 执行原方法并缓存结果
      const result = originalMethod.apply(this, args)
      cache.set(key, result, ttl)

      return result
    }

    return descriptor
  }
}

/**
 * 异步缓存装饰器 - 用于异步函数结果缓存
 * @param ttl 生存时间（毫秒）
 * @param keyGenerator 缓存键生成函数
 */
export function cachedAsync<T extends (...args: any[]) => Promise<any>>(
  ttl: number = 5 * 60 * 1000,
  keyGenerator?: (...args: Parameters<T>) => string
) {
  return function (_target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> {
      const key = keyGenerator ? keyGenerator(...args) : `${propertyKey}_${JSON.stringify(args)}`

      // 尝试从缓存获取
      const cached = cache.get<Awaited<ReturnType<T>>>(key)
      if (cached !== null) {
        return cached
      }

      // 执行原方法并缓存结果
      const result = await originalMethod.apply(this, args)
      cache.set(key, result, ttl)

      return result
    }

    return descriptor
  }
}
