/**
 * 代码分割与懒加载优化系统
 * 实现更细粒度的代码分割，减少初始加载时间，添加预加载策略
 */

import React from 'react'
import { cache } from './cache'
import { preloader } from './preloader'

// 工具分类配置
interface ToolCategory {
  id: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  tools: string[]
  dependencies?: string[]
}

// 工具分类定义
const TOOL_CATEGORIES: ToolCategory[] = [
  {
    id: 'critical',
    priority: 'critical',
    tools: ['json-pretty', 'base64-encode', 'url-encode', 'color-picker'],
    dependencies: []
  },
  {
    id: 'text-processing',
    priority: 'high',
    tools: ['word-count', 'char-case', 'lorem-ipsum', 'markdown-preview', 'regex-tester'],
    dependencies: []
  },
  {
    id: 'image-processing',
    priority: 'medium',
    tools: ['image-compress', 'image-resize', 'image-convert', 'image-crop'],
    dependencies: ['canvas-api']
  },
  {
    id: 'advanced-tools',
    priority: 'low',
    tools: ['video-trim', 'audio-convert', 'gif-split'],
    dependencies: ['ffmpeg', 'gifuct-js']
  }
]

// 动态导入配置
interface DynamicImportConfig {
  retries: number
  timeout: number
  fallback?: React.ComponentType
  preload?: boolean
}

const DEFAULT_IMPORT_CONFIG: DynamicImportConfig = {
  retries: 3,
  timeout: 10000,
  preload: false
}

/**
 * 代码分割管理器
 */
class CodeSplittingManager {
  private loadedChunks = new Set<string>()
  private loadingChunks = new Map<string, Promise<any>>()
  private failedChunks = new Set<string>()
  private loadStats = {
    totalChunks: 0,
    loadedChunks: 0,
    failedChunks: 0,
    totalLoadTime: 0,
    averageLoadTime: 0
  }

  /**
   * 动态导入工具组件（带重试机制）
   */
  async importTool(
    toolSlug: string, 
    config: Partial<DynamicImportConfig> = {}
  ): Promise<React.ComponentType> {
    const finalConfig = { ...DEFAULT_IMPORT_CONFIG, ...config }
    const cacheKey = `tool_component_${toolSlug}`
    
    // 检查缓存
    const cached = cache.get(cacheKey)
    if (cached) {
      return cached.default || cached
    }

    // 检查是否正在加载
    if (this.loadingChunks.has(toolSlug)) {
      return this.loadingChunks.get(toolSlug)!
    }

    // 创建加载Promise
    const loadPromise = this.loadToolWithRetry(toolSlug, finalConfig)
    this.loadingChunks.set(toolSlug, loadPromise)

    try {
      const module = await loadPromise
      this.loadedChunks.add(toolSlug)
      this.loadingChunks.delete(toolSlug)
      
      // 缓存模块
      cache.set(cacheKey, module, 30 * 60 * 1000) // 缓存30分钟
      
      return module.default || module
    } catch (error) {
      this.failedChunks.add(toolSlug)
      this.loadingChunks.delete(toolSlug)
      throw error
    }
  }

  /**
   * 带重试机制的工具加载
   */
  private async loadToolWithRetry(
    toolSlug: string, 
    config: DynamicImportConfig
  ): Promise<any> {
    const startTime = performance.now()
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= config.retries; attempt++) {
      try {
        // 设置超时
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Import timeout')), config.timeout)
        })

        // 动态导入
        const importPromise = import(`@/components/tools/${toolSlug}.tsx`)
        
        const module = await Promise.race([importPromise, timeoutPromise])
        
        // 更新统计
        const loadTime = performance.now() - startTime
        this.updateLoadStats(loadTime)
        
        return module
      } catch (error) {
        lastError = error as Error
        console.warn(`Tool import attempt ${attempt} failed for ${toolSlug}:`, error)
        
        // 如果不是最后一次尝试，等待一段时间再重试
        if (attempt < config.retries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
        }
      }
    }

    throw lastError || new Error(`Failed to import tool: ${toolSlug}`)
  }

  /**
   * 预加载工具分类
   */
  async preloadCategory(categoryId: string): Promise<void> {
    const category = TOOL_CATEGORIES.find(cat => cat.id === categoryId)
    if (!category) return

    // 预加载依赖
    if (category.dependencies) {
      await this.preloadDependencies(category.dependencies)
    }

    // 预加载工具
    const preloadPromises = category.tools.map(tool => 
      this.importTool(tool, { preload: true }).catch(error => {
        console.warn(`Failed to preload tool: ${tool}`, error)
      })
    )

    await Promise.allSettled(preloadPromises)
  }

  /**
   * 预加载依赖项
   */
  private async preloadDependencies(dependencies: string[]): Promise<void> {
    const dependencyPromises = dependencies.map(async (dep) => {
      try {
        switch (dep) {
          case 'canvas-api':
            // Canvas API 是浏览器原生的，无需导入
            break
          case 'ffmpeg':
            try {
              await import('@ffmpeg/ffmpeg')
            } catch {
              console.warn('FFmpeg not available, skipping preload')
            }
            break
          case 'gifuct-js':
            try {
              await import('gifuct-js')
            } catch {
              console.warn('gifuct-js not available, skipping preload')
            }
            break
          default:
            console.warn(`Unknown dependency: ${dep}`)
        }
      } catch (error) {
        console.warn(`Failed to preload dependency: ${dep}`, error)
      }
    })

    await Promise.allSettled(dependencyPromises)
  }

  /**
   * 智能预加载策略
   */
  async smartPreload(
    recentTools: string[] = [],
    favoriteTools: string[] = [],
    currentCategory?: string
  ): Promise<void> {
    // 1. 预加载关键工具
    await this.preloadCategory('critical')

    // 2. 预加载最近使用的工具
    const recentPreloads = recentTools.slice(0, 3).map(tool => 
      this.importTool(tool, { preload: true }).catch(() => {})
    )
    await Promise.allSettled(recentPreloads)

    // 3. 预加载收藏工具
    const favoritePreloads = favoriteTools.slice(0, 2).map(tool => 
      this.importTool(tool, { preload: true }).catch(() => {})
    )
    await Promise.allSettled(favoritePreloads)

    // 4. 如果用户在特定分类页面，预加载该分类的其他工具
    if (currentCategory) {
      setTimeout(() => {
        this.preloadCategory(currentCategory)
      }, 2000)
    }
  }

  /**
   * 按需加载策略
   */
  setupLazyLoading(): void {
    // 监听路由变化，预加载相关工具
    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', () => {
        this.handleRouteChange()
      })
    }
  }

  /**
   * 处理路由变化
   */
  private handleRouteChange(): void {
    const path = window.location.pathname
    
    // 如果是工具页面，预加载相关工具
    if (path.startsWith('/tool/')) {
      const toolSlug = path.split('/tool/')[1]
      if (toolSlug) {
        this.preloadRelatedTools(toolSlug)
      }
    }
  }

  /**
   * 预加载相关工具
   */
  private async preloadRelatedTools(currentTool: string): Promise<void> {
    // 找到当前工具所属的分类
    const category = TOOL_CATEGORIES.find(cat => 
      cat.tools.includes(currentTool)
    )

    if (category) {
      // 预加载同分类的其他工具（延迟加载）
      setTimeout(() => {
        const relatedTools = category.tools
          .filter(tool => tool !== currentTool)
          .slice(0, 3)
        
        relatedTools.forEach(tool => {
          this.importTool(tool, { preload: true }).catch(() => {})
        })
      }, 1000)
    }
  }

  /**
   * 更新加载统计
   */
  private updateLoadStats(loadTime: number): void {
    this.loadStats.totalChunks++
    this.loadStats.loadedChunks++
    this.loadStats.totalLoadTime += loadTime
    this.loadStats.averageLoadTime = this.loadStats.totalLoadTime / this.loadStats.loadedChunks
  }

  /**
   * 获取加载统计
   */
  getLoadStats() {
    return {
      ...this.loadStats,
      failedChunks: this.failedChunks.size,
      loadedChunks: this.loadedChunks.size,
      loadingChunks: this.loadingChunks.size
    }
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.loadingChunks.clear()
    this.loadedChunks.clear()
    this.failedChunks.clear()
  }
}

// 创建全局代码分割管理器
export const codeSplittingManager = new CodeSplittingManager()

/**
 * React Hook - 懒加载工具组件
 */
export function useLazyTool(toolSlug: string) {
  const [component, setComponent] = React.useState<React.ComponentType | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    let mounted = true

    const loadComponent = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const Component = await codeSplittingManager.importTool(toolSlug)
        
        if (mounted) {
          setComponent(() => Component)
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadComponent()

    return () => {
      mounted = false
    }
  }, [toolSlug])

  const retry = React.useCallback(() => {
    setError(null)
    setLoading(true)
    codeSplittingManager.importTool(toolSlug)
      .then(Component => {
        setComponent(() => Component)
        setLoading(false)
      })
      .catch(err => {
        setError(err)
        setLoading(false)
      })
  }, [toolSlug])

  return { component, loading, error, retry }
}

/**
 * React Hook - 预加载管理
 */
export function useCodeSplitting() {
  const preloadCategory = React.useCallback((categoryId: string) => {
    return codeSplittingManager.preloadCategory(categoryId)
  }, [])

  const smartPreload = React.useCallback((
    recentTools?: string[],
    favoriteTools?: string[],
    currentCategory?: string
  ) => {
    return codeSplittingManager.smartPreload(recentTools, favoriteTools, currentCategory)
  }, [])

  const getStats = React.useCallback(() => {
    return codeSplittingManager.getLoadStats()
  }, [])

  return {
    preloadCategory,
    smartPreload,
    getStats
  }
}

/**
 * 高阶组件 - 懒加载包装器
 */
export function withLazyLoading<P extends object>(
  toolSlug: string,
  fallback?: React.ComponentType
) {
  return function LazyWrapper(props: P) {
    const { component: Component, loading, error, retry } = useLazyTool(toolSlug)

    if (loading) {
      return fallback ? React.createElement(fallback) : React.createElement('div', {
        className: 'flex items-center justify-center min-h-[400px]'
      }, React.createElement('div', {
        className: 'animate-spin rounded-full h-8 w-8 border-b-2 border-primary'
      }))
    }

    if (error) {
      return React.createElement('div', {
        className: 'flex flex-col items-center justify-center min-h-[400px] space-y-4'
      }, [
        React.createElement('p', {
          key: 'error-message',
          className: 'text-destructive'
        }, `加载失败: ${error.message}`),
        React.createElement('button', {
          key: 'retry-button',
          onClick: retry,
          className: 'px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90'
        }, '重试')
      ])
    }

    if (!Component) {
      return React.createElement('div', {
        className: 'flex items-center justify-center min-h-[400px]'
      }, React.createElement('p', {
        className: 'text-muted-foreground'
      }, '工具未找到'))
    }

    return React.createElement(Component, props)
  }
}

// 初始化代码分割系统
if (typeof window !== 'undefined') {
  // 设置懒加载
  codeSplittingManager.setupLazyLoading()
  
  // 页面加载完成后开始智能预加载
  if (document.readyState === 'complete') {
    codeSplittingManager.smartPreload()
  } else {
    window.addEventListener('load', () => {
      codeSplittingManager.smartPreload()
    })
  }
}