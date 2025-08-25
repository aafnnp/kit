/**
 * 预加载管理器 - 实现预加载策略，提升常用工具的加载速度
 */

import React from 'react'
import { cache } from './cache'
import { getToolLoaderBySlug, hasTool } from './tools-map'

interface PreloadConfig {
  priority: 'high' | 'medium' | 'low'
  delay?: number // 延迟加载时间（毫秒）
  condition?: () => boolean // 预加载条件
}

class PreloadManager {
  private preloadQueue = new Map<string, PreloadConfig>()
  private loadedModules = new Set<string>()
  private loadingModules = new Set<string>()
  private observers = new Set<IntersectionObserver>()
  private stats = {
    preloadedModules: 0,
    hits: 0,
    misses: 0,
    totalLoadTime: 0,
    averageLoadTime: 0,
    loadCount: 0,
  }

  /**
   * 注册预加载模块
   * @param modulePath 模块路径
   * @param config 预加载配置
   */
  register(modulePath: string, config: PreloadConfig): void {
    this.preloadQueue.set(modulePath, config)
  }

  /**
   * 预加载模块
   * @param modulePath 模块路径
   */
  async preload(modulePath: string): Promise<any> {
    const startTime = performance.now()

    if (this.loadedModules.has(modulePath) || this.loadingModules.has(modulePath)) {
      if (this.loadedModules.has(modulePath)) {
        this.stats.hits++
      }
      return
    }

    this.loadingModules.add(modulePath)

    try {
      // 检查缓存
      const cacheKey = `preload_${modulePath}`
      const cached = cache.get(cacheKey)
      if (cached) {
        this.loadedModules.add(modulePath)
        this.loadingModules.delete(modulePath)
        this.stats.hits++
        return cached
      }

      // 动态导入模块
      const module = await import(/* @vite-ignore */ modulePath)

      // 缓存模块
      cache.set(cacheKey, module, 30 * 60 * 1000) // 缓存30分钟

      this.loadedModules.add(modulePath)
      this.loadingModules.delete(modulePath)

      // 更新统计
      const loadTime = performance.now() - startTime
      this.stats.preloadedModules++
      this.stats.loadCount++
      this.stats.totalLoadTime += loadTime
      this.stats.averageLoadTime = this.stats.totalLoadTime / this.stats.loadCount

      return module
    } catch (error) {
      console.warn(`Failed to preload module: ${modulePath}`, error)
      this.loadingModules.delete(modulePath)
      this.stats.misses++
      throw error
    }
  }

  /**
   * 批量预加载
   * @param modulePaths 模块路径数组
   */
  async preloadBatch(modulePaths: string[]): Promise<void> {
    const promises = modulePaths.map((path) => this.preload(path))
    await Promise.allSettled(promises)
  }

  /**
   * 根据优先级预加载
   */
  async preloadByPriority(): Promise<void> {
    const highPriority: string[] = []
    const mediumPriority: string[] = []
    const lowPriority: string[] = []

    for (const [modulePath, config] of this.preloadQueue.entries()) {
      // 检查预加载条件
      if (typeof config.condition === 'function' && !config.condition()) {
        continue
      }

      switch (config.priority) {
        case 'high':
          highPriority.push(modulePath)
          break
        case 'medium':
          mediumPriority.push(modulePath)
          break
        case 'low':
          lowPriority.push(modulePath)
          break
      }
    }

    // 按优先级顺序预加载
    await this.preloadBatch(highPriority)

    // 延迟加载中等优先级
    setTimeout(() => {
      this.preloadBatch(mediumPriority)
    }, 1000)

    // 延迟加载低优先级
    setTimeout(() => {
      this.preloadBatch(lowPriority)
    }, 3000)
  }

  /**
   * 预加载常用工具
   */
  preloadCommonTools(): void {
    const highPrioritySlugs = ['json-pretty', 'base64-encode', 'url-encode', 'color-picker', 'uuid-generator']

    const mediumPrioritySlugs = ['word-count', 'qr-generator', 'hex-rgb']

    highPrioritySlugs.forEach((slug) => {
      if (hasTool(slug)) {
        const modulePath = `/src/components/tools/${slug}/index.tsx`
        this.register(modulePath, { priority: 'high' })
      }
    })

    mediumPrioritySlugs.forEach((slug) => {
      if (hasTool(slug)) {
        const modulePath = `/src/components/tools/${slug}/index.tsx`
        this.register(modulePath, { priority: 'medium' })
      }
    })

    this.preloadByPriority()
  }

  /**
   * 基于用户行为的智能预加载
   * @param recentTools 最近使用的工具
   * @param favoriteTools 收藏的工具
   */
  smartPreload(recentTools: string[], favoriteTools: string[]): void {
    // 预加载最近使用的工具
    recentTools.slice(0, 5).forEach((tool) => {
      if (hasTool(tool)) {
        const modulePath = `/src/components/tools/${tool}/index.tsx`
        this.register(modulePath, { priority: 'high' })
      }
    })

    // 预加载收藏的工具
    favoriteTools.slice(0, 3).forEach((tool) => {
      if (hasTool(tool)) {
        const modulePath = `/src/components/tools/${tool}/index.tsx`
        this.register(modulePath, { priority: 'medium' })
      }
    })

    this.preloadByPriority()
  }

  /**
   * 可视区域预加载 - 当元素进入视口时预加载
   * @param element 目标元素
   * @param modulePath 模块路径
   */
  preloadOnVisible(element: Element, modulePath: string): void {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.preload(modulePath)
            observer.unobserve(entry.target)
          }
        })
      },
      {
        rootMargin: '50px', // 提前50px开始预加载
      }
    )

    observer.observe(element)
    this.observers.add(observer)
  }

  /**
   * 鼠标悬停预加载
   * @param element 目标元素
   * @param modulePath 模块路径
   */
  preloadOnHover(element: Element, modulePath: string): void {
    let timeoutId: NodeJS.Timeout

    const handleMouseEnter = () => {
      timeoutId = setTimeout(() => {
        this.preload(modulePath)
      }, 200) // 200ms延迟，避免误触发
    }

    const handleMouseLeave = () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }

    element.addEventListener('mouseenter', handleMouseEnter)
    element.addEventListener('mouseleave', handleMouseLeave)
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    this.stats = {
      preloadedModules: 0,
      hits: 0,
      misses: 0,
      totalLoadTime: 0,
      averageLoadTime: 0,
      loadCount: 0,
    }
  }

  /**
   * 清理所有观察者
   */
  cleanup(): void {
    this.observers.forEach((observer) => observer.disconnect())
    this.observers.clear()
    this.preloadQueue.clear()
    this.loadedModules.clear()
    this.loadingModules.clear()
    this.resetStats()
  }

  /**
   * 获取统计信息
   */
  getStats = (): {
    preloadedModules: number
    hits: number
    misses: number
    totalLoadTime: number
    averageLoadTime: number
    loadCount: number
    total: number
    loaded: number
    loading: number
    pending: number
  } => {
    return {
      ...this.stats,
      total: this.preloadQueue.size,
      loaded: this.loadedModules.size,
      loading: this.loadingModules.size,
      pending: this.preloadQueue.size - this.loadedModules.size - this.loadingModules.size,
    }
  }
}

// 创建全局预加载管理器实例
export const preloader = new PreloadManager()

// 在应用启动时预加载常用工具
if (typeof window !== 'undefined') {
  // 页面加载完成后启动按优先级预加载（与路由懒加载兼容的 loader 映射）
  if (document.readyState === 'complete') {
    preloader.preloadCommonTools()
  } else {
    window.addEventListener('load', () => {
      preloader.preloadCommonTools()
    })
  }
}

/**
 * React Hook - 用于预加载功能
 */
export function usePreload() {
  const preloadTool = React.useCallback((toolSlug: string) => {
    const loader = getToolLoaderBySlug(toolSlug)
    if (!loader) return
    const modulePath = `/src/components/tools/${toolSlug}/index.tsx`
    preloader.register(modulePath, { priority: 'high' })
    preloader.preload(modulePath).catch(console.warn)
  }, [])

  const preloadCommonTools = React.useCallback(() => {
    preloader.preloadCommonTools()
  }, [])

  return {
    preloadTool,
    preloadCommonTools,
  }
}

/**
 * React Hook - 用于智能预加载
 */
export function useSmartPreload() {
  const trackToolUsage = React.useCallback((toolSlug: string) => {
    // 这里可以添加用户行为跟踪逻辑
    console.log(`Tool used: ${toolSlug}`)
  }, [])

  return {
    trackToolUsage,
  }
}
