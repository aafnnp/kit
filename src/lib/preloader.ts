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
  // 使用频次与关联矩阵（有向图，带权重）
  private usageCounts = new Map<string, number>()
  private associationMatrix = new Map<string, Map<string, number>>()
  private lastUsedSlug: string | null = null
  private stats = {
    preloadedModules: 0,
    hits: 0,
    misses: 0,
    totalLoadTime: 0,
    averageLoadTime: 0,
    loadCount: 0,
  }

  constructor() {
    this.hydrateBehaviorData()
    this.seedDefaultAssociations()
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
    // 条件：仅在网络良好且未开启省流时执行，并对 RTT/下行速率进行自适应判断
    const anyNav: any = typeof navigator !== 'undefined' ? navigator : null
    const connection = anyNav?.connection || anyNav?.mozConnection || anyNav?.webkitConnection
    const effectiveType = connection?.effectiveType
    const saveData = Boolean(connection?.saveData)
    const rtt = typeof connection?.rtt === 'number' ? connection.rtt : undefined
    const downlink = typeof connection?.downlink === 'number' ? connection.downlink : undefined

    const isSaveData = saveData === true
    const isGoodEffective = effectiveType ? effectiveType === '4g' : true
    const isGoodRtt = rtt !== undefined ? rtt < 250 : true // 小于250ms视为可接受
    const isGoodDownlink = downlink !== undefined ? downlink >= 1.5 : true // 下行>=1.5Mbps
    const goodNetwork = isGoodEffective && isGoodRtt && isGoodDownlink

    if (!goodNetwork || isSaveData) {
      // 跳过预加载，保持更细粒度的按需加载
      return
    }

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

    // 并发限制 + 空闲调度
    const schedule = (cb: () => void) => {
      if (typeof (window as any).requestIdleCallback === 'function') {
        ;(window as any).requestIdleCallback(cb, { timeout: 3000 })
      } else {
        setTimeout(cb, 1000)
      }
    }

    // 包装批量预加载以限制同时进行的模块数
    const originalPreload = this.preload.bind(this)
    const concurrency = 3
    let running = 0
    const queue: string[] = []

    this.preload = async (modulePath: string) => {
      if (running >= concurrency) {
        queue.push(modulePath)
        return
      }
      running++
      try {
        return await originalPreload(modulePath)
      } finally {
        running--
        const next = queue.shift()
        if (next) {
          // 让出事件循环
          setTimeout(() => {
            this.preload(next)
          }, 0)
        }
      }
    }

    schedule(() => this.preloadByPriority())
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
   * 记录一次工具使用，并更新关联关系
   */
  recordUsage(current: string): void {
    // 使用计数
    const count = (this.usageCounts.get(current) || 0) + 1
    this.usageCounts.set(current, count)

    // 关联：上一个 -> 当前
    if (this.lastUsedSlug && this.lastUsedSlug !== current) {
      const from = this.lastUsedSlug
      const row = this.associationMatrix.get(from) || new Map<string, number>()
      row.set(current, (row.get(current) || 0) + 1)
      this.associationMatrix.set(from, row)
    }

    this.lastUsedSlug = current
    this.persistBehaviorData()
  }

  /**
   * 为某个工具增加静态的先验关联（可多次调用做补充）
   */
  addAssociations(from: string, tos: string[], weight: number = 1): void {
    const row = this.associationMatrix.get(from) || new Map<string, number>()
    tos.forEach((to) => row.set(to, (row.get(to) || 0) + weight))
    this.associationMatrix.set(from, row)
    this.persistBehaviorData()
  }

  /**
   * 基于最近一次使用的工具，预加载其强关联工具
   */
  preloadRelated(from: string, topN: number = 3): void {
    const related = this.predictRelated(from, topN)
    const modulePaths: string[] = []
    related.forEach((slug, index) => {
      if (hasTool(slug)) {
        const modulePath = `/src/components/tools/${slug}/index.tsx`
        this.register(modulePath, { priority: index === 0 ? 'high' : 'medium' })
        modulePaths.push(modulePath)
      }
    })
    if (modulePaths.length) {
      this.preloadByPriority()
    }
  }

  /**
   * 预测与某工具强相关的工具（按权重降序）
   */
  predictRelated(from: string, topN: number = 3): string[] {
    const row = this.associationMatrix.get(from)
    if (!row) return []
    return Array.from(row.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([slug]) => slug)
  }

  /**
   * 将一批工具按动态优先级加入队列并执行
   */
  scheduleToolsWithDynamicPriority(toolSlugs: string[]): void {
    // 动态评分：usage 权重 + 与 lastUsed 的关联权重
    const scored = toolSlugs.map((slug) => {
      const usage = this.usageCounts.get(slug) || 0
      const assoc = this.lastUsedSlug ? this.associationMatrix.get(this.lastUsedSlug)?.get(slug) || 0 : 0
      const score = usage * 1.0 + assoc * 2.0
      return { slug, score }
    })

    scored
      .sort((a, b) => b.score - a.score)
      .forEach((item, index) => {
        if (!hasTool(item.slug)) return
        const modulePath = `/src/components/tools/${item.slug}/index.tsx`
        const priority: PreloadConfig['priority'] = index < 2 ? 'high' : index < 5 ? 'medium' : 'low'
        this.register(modulePath, { priority })
      })

    this.preloadByPriority()
  }

  /**
   * 恢复/持久化 用户行为数据
   */
  private hydrateBehaviorData(): void {
    try {
      const usageRaw = localStorage.getItem('preload_usage')
      const assocRaw = localStorage.getItem('preload_assoc')
      if (usageRaw) {
        const obj = JSON.parse(usageRaw) as Record<string, number>
        this.usageCounts = new Map(Object.entries(obj))
      }
      if (assocRaw) {
        const obj = JSON.parse(assocRaw) as Record<string, Record<string, number>>
        const matrix = new Map<string, Map<string, number>>()
        Object.entries(obj).forEach(([from, row]) => {
          matrix.set(from, new Map(Object.entries(row)))
        })
        this.associationMatrix = matrix
      }
    } catch {}
  }

  private persistBehaviorData(): void {
    try {
      const usageObj = Object.fromEntries(this.usageCounts.entries())
      const assocObj: Record<string, Record<string, number>> = {}
      this.associationMatrix.forEach((row, from) => {
        assocObj[from] = Object.fromEntries(row.entries())
      })
      localStorage.setItem('preload_usage', JSON.stringify(usageObj))
      localStorage.setItem('preload_assoc', JSON.stringify(assocObj))
    } catch {}
  }

  /**
   * 预置一些常见的业务关联，提供冷启动效果
   */
  private seedDefaultAssociations(): void {
    const add = (from: string, tos: string[]) => this.addAssociations(from, tos, 2)
    // 示例：二维码生成后常见图片处理
    add('qr-generator', ['image-compress', 'image-resize'])
    // 图像类互相关联
    add('image-compress', ['image-resize', 'image-convert'])
    add('image-resize', ['image-compress', 'image-convert'])
    // SVG 相关工具联动
    add('svg-minify', ['icon-spriter'])
    // 生成 favicon 常搭配格式转换
    add('favicon-generator', ['image-convert'])
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

  // 监听网络变化，动态收敛或恢复预加载策略
  const anyNav: any = navigator as any
  const connection = anyNav?.connection || anyNav?.mozConnection || anyNav?.webkitConnection
  if (connection && typeof connection.addEventListener === 'function') {
    const handler = () => {
      // 在弱网或省流开启时，清空队列以避免带宽竞争；网络恢复后再尝试
      preloader.cleanup()
      preloader.preloadCommonTools()
    }
    connection.addEventListener('change', handler)
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
    preloader.recordUsage(toolSlug)
    // 使用后主动预热其关联工具
    preloader.preloadRelated(toolSlug)
  }, [])

  return {
    trackToolUsage,
  }
}
