/**
 * 路由预取工具
 * 基于用户行为预测并预取下一个可能访问的路由
 */

import { getToolLoaderBySlug, hasTool } from '@/lib/tools-map'
import { preloader } from './preloader'

interface RoutePrefetchConfig {
  enabled: boolean
  prefetchDelay: number // 延迟预取时间（ms）
  maxPrefetch: number // 最大预取数量
}

class RoutePrefetchManager {
  private config: RoutePrefetchConfig = {
    enabled: true,
    prefetchDelay: 100,
    maxPrefetch: 3,
  }

  /**
   * 预取工具路由
   */
  prefetchToolRoute(toolSlug: string): void {
    if (!this.config.enabled || !hasTool(toolSlug)) {
      return
    }

    const loader = getToolLoaderBySlug(toolSlug)
    if (!loader) return

    // 使用预加载管理器预取模块
    const modulePath = `/src/components/tools/${toolSlug}/index.tsx`
    preloader.register(modulePath, { priority: 'high' })
    preloader.preload(modulePath).catch(() => {
      // 静默失败
    })
  }

  /**
   * 基于当前工具预取关联工具
   */
  prefetchRelatedTools(currentToolSlug: string): void {
    if (!this.config.enabled) return

    // 使用预加载管理器的关联预测
    const related = preloader.predictRelated(currentToolSlug, this.config.maxPrefetch)
    related.forEach((slug) => {
      this.prefetchToolRoute(slug)
    })
  }

  /**
   * 预取常用工具
   */
  prefetchCommonTools(): void {
    if (!this.config.enabled) return

    const commonTools = ['json-pretty', 'base64-encode', 'url-encode', 'color-picker', 'uuid-generator']
    commonTools.slice(0, this.config.maxPrefetch).forEach((slug) => {
      this.prefetchToolRoute(slug)
    })
  }

  /**
   * 预取收藏的工具
   */
  prefetchFavoriteTools(favoriteSlugs: string[]): void {
    if (!this.config.enabled || favoriteSlugs.length === 0) return

    favoriteSlugs.slice(0, this.config.maxPrefetch).forEach((slug) => {
      this.prefetchToolRoute(slug)
    })
  }

  /**
   * 预取最近使用的工具
   */
  prefetchRecentTools(recentSlugs: string[]): void {
    if (!this.config.enabled || recentSlugs.length === 0) return

    recentSlugs.slice(0, this.config.maxPrefetch).forEach((slug) => {
      this.prefetchToolRoute(slug)
    })
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
  }
}

// 单例实例
export const routePrefetchManager = new RoutePrefetchManager()

/**
 * React Hook - 用于路由预取
 */
export function useRoutePrefetch() {
  const prefetchTool = (toolSlug: string) => {
    routePrefetchManager.prefetchToolRoute(toolSlug)
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

  return {
    prefetchTool,
    prefetchRelated,
    prefetchFavorites,
    prefetchRecent,
  }
}

export default routePrefetchManager
