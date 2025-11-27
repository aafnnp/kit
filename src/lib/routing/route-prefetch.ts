/**
 * 路由预取工具
 * 基于用户行为预测并预取下一个可能访问的路由
 * 增强版本：支持优先级队列、预取延迟、智能预测
 */

import { getToolLoaderBySlug, hasTool, preloader } from '@/lib/data'

interface RoutePrefetchConfig {
  enabled: boolean
  prefetchDelay: number // 延迟预取时间（ms）
  maxPrefetch: number // 最大预取数量
  priorityThreshold: number // 优先级阈值
}

interface PrefetchTask {
  slug: string
  priority: 'high' | 'medium' | 'low'
  scheduledAt: number
}

class RoutePrefetchManager {
  private config: RoutePrefetchConfig = {
    enabled: true,
    prefetchDelay: 100,
    maxPrefetch: 5, // 增加到5个
    priorityThreshold: 0.5,
  }

  private prefetchQueue: PrefetchTask[] = []
  private activePrefetches = new Set<string>()
  private prefetchTimers = new Map<string, NodeJS.Timeout>()

  /**
   * 预取工具路由
   */
  prefetchToolRoute(toolSlug: string, priority: 'high' | 'medium' | 'low' = 'medium'): void {
    if (!this.config.enabled || !hasTool(toolSlug)) {
      return
    }

    // 避免重复预取
    if (this.activePrefetches.has(toolSlug)) {
      return
    }

    // 清除之前的定时器（如果存在）
    const existingTimer = this.prefetchTimers.get(toolSlug)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    const delay = priority === 'high' ? 0 : this.config.prefetchDelay

    const timer = setTimeout(() => {
      this.activePrefetches.add(toolSlug)

      const loader = getToolLoaderBySlug(toolSlug)
      if (!loader) {
        this.activePrefetches.delete(toolSlug)
        return
      }

      preloader.register(toolSlug, { priority })
      preloader
        .preload(toolSlug, priority)
        .catch(() => {
          // 静默失败
        })
        .finally(() => {
          this.activePrefetches.delete(toolSlug)
        })

      this.prefetchTimers.delete(toolSlug)
    }, delay)

    this.prefetchTimers.set(toolSlug, timer)
  }

  /**
   * 批量预取工具路由（带优先级）
   */
  prefetchToolRoutes(toolSlugs: string[], priority: 'high' | 'medium' | 'low' = 'medium'): void {
    if (!this.config.enabled) return

    // 限制预取数量
    const limitedSlugs = toolSlugs.slice(0, this.config.maxPrefetch)

    limitedSlugs.forEach((slug, index) => {
      // 第一个工具使用高优先级，其他的使用传入的优先级
      const itemPriority = index === 0 ? 'high' : priority
      this.prefetchToolRoute(slug, itemPriority)
    })
  }

  /**
   * 基于当前工具预取关联工具（增强版）
   */
  prefetchRelatedTools(currentToolSlug: string): void {
    if (!this.config.enabled) return

    // 使用预加载管理器的关联预测
    const related = preloader.predictRelated(currentToolSlug, this.config.maxPrefetch)

    if (related.length === 0) {
      // 如果没有关联工具，预取常用工具
      this.prefetchCommonTools()
      return
    }

    related.forEach((slug, index) => {
      const priority = index === 0 ? 'high' : index < 2 ? 'medium' : 'low'
      this.prefetchToolRoute(slug, priority)
    })
  }

  /**
   * 预取常用工具（增强版）
   */
  prefetchCommonTools(): void {
    if (!this.config.enabled) return

    // 基于使用频率的常用工具
    const commonTools = [
      'json-pretty',
      'base64-encode',
      'url-encode',
      'color-picker',
      'uuid-generator',
      'markdown-preview',
    ]
    this.prefetchToolRoutes(commonTools.slice(0, this.config.maxPrefetch), 'medium')
  }

  /**
   * 预取收藏的工具（增强版）
   */
  prefetchFavoriteTools(favoriteSlugs: string[]): void {
    if (!this.config.enabled || favoriteSlugs.length === 0) return

    this.prefetchToolRoutes(favoriteSlugs.slice(0, this.config.maxPrefetch), 'high')
  }

  /**
   * 预取最近使用的工具（增强版）
   */
  prefetchRecentTools(recentSlugs: string[]): void {
    if (!this.config.enabled || recentSlugs.length === 0) return

    this.prefetchToolRoutes(recentSlugs.slice(0, this.config.maxPrefetch), 'high')
  }

  /**
   * 智能预取：基于鼠标悬停预测用户意图
   */
  prefetchOnHover(toolSlug: string): void {
    if (!this.config.enabled) return

    // 悬停时立即预取（高优先级）
    this.prefetchToolRoute(toolSlug, 'high')

    // 预取关联工具（低优先级，延迟更久）
    setTimeout(() => {
      const related = preloader.predictRelated(toolSlug, 2)
      related.forEach((slug) => {
        if (slug !== toolSlug) {
          this.prefetchToolRoute(slug, 'low')
        }
      })
    }, this.config.prefetchDelay * 2)
  }

  /**
   * 预取可见区域内的工具
   */
  prefetchVisibleTools(toolSlugs: string[]): void {
    if (!this.config.enabled || toolSlugs.length === 0) return

    // 预取前3个可见工具
    this.prefetchToolRoutes(toolSlugs.slice(0, 3), 'medium')
  }

  /**
   * 取消预取
   */
  cancelPrefetch(toolSlug: string): void {
    const timer = this.prefetchTimers.get(toolSlug)
    if (timer) {
      clearTimeout(timer)
      this.prefetchTimers.delete(toolSlug)
    }
    this.activePrefetches.delete(toolSlug)
  }

  /**
   * 清除所有预取任务
   */
  clearAll(): void {
    this.prefetchTimers.forEach((timer) => clearTimeout(timer))
    this.prefetchTimers.clear()
    this.activePrefetches.clear()
    this.prefetchQueue = []
  }

  /**
   * 设置配置
   */
  setConfig(config: Partial<RoutePrefetchConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * 启用/禁用预取
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled
    if (!enabled) {
      this.clearAll()
    }
  }

  /**
   * 获取预取统计
   */
  getStats() {
    return {
      activePrefetches: this.activePrefetches.size,
      queuedPrefetches: this.prefetchQueue.length,
      scheduledPrefetches: this.prefetchTimers.size,
    }
  }
}

// 单例实例
export const routePrefetchManager = new RoutePrefetchManager()

/**
 * React Hook - 用于路由预取
 */
export function useRoutePrefetch() {
  const prefetchTool = (toolSlug: string, priority: 'high' | 'medium' | 'low' = 'medium') => {
    routePrefetchManager.prefetchToolRoute(toolSlug, priority)
  }

  const prefetchRelated = (currentToolSlug: string) => {
    routePrefetchManager.prefetchRelatedTools(currentToolSlug)
  }

  const prefetchFavorites = (favoriteSlugs: string[]) => {
    routePrefetchManager.prefetchFavoriteTools(favoriteSlugs)
  }

  const prefetchRecent = (recentSlugs: string[]) => {
    routePrefetchManager.prefetchRecentTools(recentSlugs)
  }

  const prefetchOnHover = (toolSlug: string) => {
    routePrefetchManager.prefetchOnHover(toolSlug)
  }

  const prefetchVisible = (toolSlugs: string[]) => {
    routePrefetchManager.prefetchVisibleTools(toolSlugs)
  }

  const getStats = () => {
    return routePrefetchManager.getStats()
  }

  return {
    prefetchTool,
    prefetchRelated,
    prefetchFavorites,
    prefetchRecent,
    prefetchOnHover,
    prefetchVisible,
    getStats,
  }
}

export default routePrefetchManager
