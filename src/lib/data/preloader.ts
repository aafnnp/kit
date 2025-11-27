/**
 * 预加载管理器 - 实现预加载策略，提升常用工具的加载速度
 */

import React from "react"
import { getToolLoaderBySlug, hasTool } from "./tools-map"

type PreloadPriority = "high" | "medium" | "low"

interface PreloadConfig {
  priority: PreloadPriority
  delay?: number
  condition?: () => boolean
}

interface QueueTask {
  slug: string
  priority: PreloadPriority
}

interface Deferred<T> {
  promise: Promise<T>
  resolve: (value: T | PromiseLike<T>) => void
  reject: (reason?: unknown) => void
}

const PRIORITY_WEIGHT: Record<PreloadPriority, number> = {
  high: 1,
  medium: 5,
  low: 10,
}

const createDeferred = <T,>(): Deferred<T> => {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

class PreloadManager {
  private preloadQueue = new Map<string, PreloadConfig>()
  private loadedModules = new Set<string>()
  private loadingModules = new Set<string>()
  private preloadPromises = new Map<string, Promise<void>>()
  private pendingQueue: QueueTask[] = []
  private deferredMap = new Map<string, Deferred<void>>()
  private concurrencyLimit = 3
  private activeLoads = 0
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

  register(slug: string, config: PreloadConfig): void {
    if (!hasTool(slug)) return
    this.preloadQueue.set(slug, config)
  }

  preload(slug: string, priority: PreloadPriority = "medium"): Promise<void> {
    if (!hasTool(slug)) return Promise.resolve()

    const existingPromise = this.preloadPromises.get(slug)
    if (existingPromise) {
      if (this.loadedModules.has(slug)) {
        this.stats.hits++
      }
      return existingPromise
    }

    const deferred = createDeferred<void>()
    this.deferredMap.set(slug, deferred)
    this.preloadPromises.set(slug, deferred.promise)
    this.enqueueTask({ slug, priority })
    this.processQueue()

    return deferred.promise
  }

  async preloadBatch(slugs: string[], priority: PreloadPriority = "medium"): Promise<void> {
    const promises = slugs.map((slug) => this.preload(slug, priority))
    await Promise.allSettled(promises)
  }

  async preloadByPriority(): Promise<void> {
    const high: string[] = []
    const medium: string[] = []
    const low: string[] = []

    for (const [slug, config] of this.preloadQueue.entries()) {
      if (typeof config.condition === "function" && !config.condition()) continue
      if (this.loadedModules.has(slug)) continue
      switch (config.priority) {
        case "high":
          high.push(slug)
          break
        case "medium":
          medium.push(slug)
          break
        case "low":
          low.push(slug)
          break
      }
    }

    this.scheduleBatch(high, "high")
    this.scheduleBatch(medium, "medium", 1000)
    this.scheduleBatch(low, "low", 3000)
  }

  preloadCommonTools(): void {
    const anyNav: any = typeof navigator !== "undefined" ? navigator : null
    const connection = anyNav?.connection || anyNav?.mozConnection || anyNav?.webkitConnection
    const effectiveType = connection?.effectiveType
    const saveData = Boolean(connection?.saveData)
    const rtt = typeof connection?.rtt === "number" ? connection.rtt : undefined
    const downlink = typeof connection?.downlink === "number" ? connection.downlink : undefined

    const isSaveData = saveData === true
    const isGoodEffective = effectiveType ? effectiveType === "4g" : true
    const isGoodRtt = rtt !== undefined ? rtt < 250 : true
    const isGoodDownlink = downlink !== undefined ? downlink >= 1.5 : true
    const goodNetwork = isGoodEffective && isGoodRtt && isGoodDownlink

    if (!goodNetwork || isSaveData) {
      return
    }

    const highPrioritySlugs = ["json-pretty", "base64-encode", "url-encode", "color-picker", "uuid-generator"]
    const mediumPrioritySlugs = ["word-count", "qr-generator", "hex-rgb"]

    highPrioritySlugs.forEach((slug) => {
      if (hasTool(slug)) {
        this.register(slug, { priority: "high" })
      }
    })

    mediumPrioritySlugs.forEach((slug) => {
      if (hasTool(slug)) {
        this.register(slug, { priority: "medium" })
      }
    })

    this.scheduleWithIdle(() => this.preloadByPriority())
  }

  smartPreload(recentTools: string[], favoriteTools: string[]): void {
    recentTools.slice(0, 5).forEach((tool) => {
      if (hasTool(tool)) {
        this.register(tool, { priority: "high" })
      }
    })

    favoriteTools.slice(0, 3).forEach((tool) => {
      if (hasTool(tool)) {
        this.register(tool, { priority: "medium" })
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
    related.forEach((slug, index) => {
      if (hasTool(slug)) {
        this.register(slug, { priority: index === 0 ? "high" : "medium" })
      }
    })
    this.preloadByPriority()
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
        const priority: PreloadPriority = index < 2 ? "high" : index < 5 ? "medium" : "low"
        this.register(item.slug, { priority })
      })

    this.preloadByPriority()
  }

  /**
   * 恢复/持久化 用户行为数据
   */
  private hydrateBehaviorData(): void {
    try {
      const usageRaw = localStorage.getItem("preload_usage")
      const assocRaw = localStorage.getItem("preload_assoc")
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
      localStorage.setItem("preload_usage", JSON.stringify(usageObj))
      localStorage.setItem("preload_assoc", JSON.stringify(assocObj))
    } catch {}
  }

  /**
   * 预置一些常见的业务关联，提供冷启动效果
   */
  private seedDefaultAssociations(): void {
    const add = (from: string, tos: string[]) => this.addAssociations(from, tos, 2)
    // 示例：二维码生成后常见图片处理
    add("qr-generator", ["image-compress", "image-resize"])
    // 图像类互相关联
    add("image-compress", ["image-resize", "image-convert"])
    add("image-resize", ["image-compress", "image-convert"])
    // SVG 相关工具联动
    add("svg-minify", ["icon-spriter"])
    // 生成 favicon 常搭配格式转换
    add("favicon-generator", ["image-convert"])
  }

  /**
   * 可视区域预加载 - 当元素进入视口时预加载
   * @param element 目标元素
   * @param slug 工具标识
   */
  preloadOnVisible(element: Element, slug: string): void {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.preload(slug, "medium").catch(() => {})
            observer.unobserve(entry.target)
          }
        })
      },
      {
        rootMargin: "50px",
      }
    )

    observer.observe(element)
    this.observers.add(observer)
  }

  /**
   * 鼠标悬停预加载
   * @param element 目标元素
   * @param slug 工具标识
   */
  preloadOnHover(element: Element, slug: string): void {
    let timeoutId: NodeJS.Timeout

    const handleMouseEnter = () => {
      timeoutId = setTimeout(() => {
        this.preload(slug, "high").catch(() => {})
      }, 200)
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
    this.pendingQueue = []
    this.deferredMap.clear()
    this.preloadPromises.clear()
    this.loadedModules.clear()
    this.loadingModules.clear()
    this.activeLoads = 0
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
      pending: Math.max(this.pendingQueue.length, 0),
    }
  }

  private enqueueTask(task: QueueTask): void {
    if (this.loadedModules.has(task.slug) || this.loadingModules.has(task.slug)) {
      if (this.loadedModules.has(task.slug)) this.stats.hits++
      return
    }

    const alreadyQueued = this.pendingQueue.findIndex((queued) => queued.slug === task.slug)
    if (alreadyQueued >= 0) {
      this.pendingQueue[alreadyQueued].priority =
        PRIORITY_WEIGHT[task.priority] < PRIORITY_WEIGHT[this.pendingQueue[alreadyQueued].priority]
          ? task.priority
          : this.pendingQueue[alreadyQueued].priority
      return
    }

    this.pendingQueue.push(task)
    this.pendingQueue.sort((a, b) => PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority])
  }

  private processQueue(): void {
    while (this.activeLoads < this.concurrencyLimit && this.pendingQueue.length > 0) {
      const task = this.pendingQueue.shift()
      if (!task) {
        return
      }
      const deferred = this.deferredMap.get(task.slug)
      if (!deferred) {
        continue
      }

      this.activeLoads++
      this.loadSlug(task.slug)
        .then(() => deferred.resolve())
        .catch((error) => deferred.reject(error))
        .finally(() => {
          this.activeLoads--
          this.deferredMap.delete(task.slug)
          this.processQueue()
        })
    }
  }

  private async loadSlug(slug: string): Promise<void> {
    const loader = getToolLoaderBySlug(slug)
    if (!loader) {
      this.stats.misses++
      this.preloadPromises.delete(slug)
      return
    }

    const startTime = performance.now()
    this.loadingModules.add(slug)

    try {
      await loader()
      this.loadedModules.add(slug)
      const loadTime = performance.now() - startTime
      this.stats.preloadedModules++
      this.stats.loadCount++
      this.stats.totalLoadTime += loadTime
      this.stats.averageLoadTime = this.stats.totalLoadTime / this.stats.loadCount
    } catch (error) {
      this.stats.misses++
      this.preloadPromises.delete(slug)
      throw error
    } finally {
      this.loadingModules.delete(slug)
    }
  }

  private scheduleBatch(slugs: string[], priority: PreloadPriority, delay = 0): void {
    if (!slugs.length) return
    const runner = () => {
      slugs.forEach((slug) => {
        this.preload(slug, priority).catch(() => {})
      })
    }
    if (delay > 0) {
      setTimeout(runner, delay)
    } else {
      runner()
    }
  }

  private scheduleWithIdle(callback: () => void, timeout = 3000, fallbackDelay = 1000): void {
    const win = typeof window !== "undefined" ? (window as any) : null
    if (win?.requestIdleCallback) {
      win.requestIdleCallback(callback, { timeout })
      return
    }
    setTimeout(callback, fallbackDelay)
  }
}

// 创建全局预加载管理器实例
export const preloader = new PreloadManager()

// 在应用启动时预加载常用工具
if (typeof window !== "undefined") {
  // 页面加载完成后启动按优先级预加载（与路由懒加载兼容的 loader 映射）
  if (document.readyState === "complete") {
    preloader.preloadCommonTools()
  } else {
    window.addEventListener("load", () => {
      preloader.preloadCommonTools()
    })
  }

  // 监听网络变化，动态收敛或恢复预加载策略
  const anyNav: any = navigator as any
  const connection = anyNav?.connection || anyNav?.mozConnection || anyNav?.webkitConnection
  if (connection && typeof connection.addEventListener === "function") {
    const handler = () => {
      preloader.cleanup()
      preloader.preloadCommonTools()
    }
    connection.addEventListener("change", handler)
  }
}

/**
 * React Hook - 用于预加载功能
 */
export function usePreload() {
  const preloadTool = React.useCallback((toolSlug: string) => {
    if (!hasTool(toolSlug)) return
    preloader.register(toolSlug, { priority: "high" })
    preloader.preload(toolSlug, "high").catch(console.warn)
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
