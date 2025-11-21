/**
 * 资源优化管理器 - 优化图标加载和资源按需加载
 */

import { cache } from '@/lib/storage'
import { LruCache } from '@/lib/storage'
import * as LucideIcons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import React from 'react'
import { idbGet, idbSet } from '@/lib/storage'

// 图标缓存映射
const iconCache = new LruCache<string, LucideIcon>(200)
const resourceCache = new LruCache<string, any>(128)

// 图标映射表 - 将@tabler/icons-react映射到lucide-react
const ICON_MAPPING: Record<string, string> = {
  // Tabler图标名 -> Lucide图标名
  IconMoon: 'Moon',
  IconSun: 'Sun',
  IconDeviceDesktop: 'Monitor',
  IconChevronRight: 'ChevronRight',
  IconDots: 'MoreHorizontal',
  IconFolder: 'Folder',
  IconShare3: 'Share',
  IconTrash: 'Trash2',
  IconTrendingDown: 'TrendingDown',
  IconTrendingUp: 'TrendingUp',
  // 添加更多映射...
}

// 常用图标列表（预加载）
const COMMON_ICONS = [
  'Home',
  'Settings',
  'Search',
  'Heart',
  'Star',
  'User',
  'Menu',
  'ChevronDown',
  'ChevronUp',
  'ChevronLeft',
  'ChevronRight',
  'Plus',
  'Minus',
  'X',
  'Check',
  'AlertCircle',
  'Info',
  'Download',
  'Upload',
  'Copy',
  'Edit',
  'Trash2',
  'Eye',
  'EyeOff',
  'Lock',
  'Unlock',
  'Mail',
  'Phone',
  'Calendar',
  'Moon',
  'Sun',
  'Monitor',
  'MoreHorizontal',
  'Folder',
  'Share',
  'TrendingDown',
  'TrendingUp',
]

// 依赖配置类型定义
interface DependencyConfig {
  size: string
  alternatives?: string[]
  treeshaking?: boolean
}

interface DependencyConfigs {
  [key: string]: DependencyConfig
}

// 第三方依赖优化配置
const DEPENDENCY_CONFIG = {
  // 重量级依赖
  heavy: {
    '@ffmpeg/ffmpeg': { size: '~2MB', alternatives: ['browser-image-compression'] },
    mermaid: { size: '~800KB', alternatives: ['lightweight-charts'] },
    xlsx: { size: '~600KB', alternatives: ['papaparse'] },
    'gifuct-js': { size: '~50KB', alternatives: ['gif.js'] },
    'pdf-lib': { size: '~200KB', alternatives: ['jspdf'] },
    // 补充常见可替换项
    moment: { size: '~200KB', alternatives: ['date-fns', 'dayjs'] },
  } as DependencyConfigs,
  // 可优化依赖
  optimizable: {
    motion: { size: '~200KB', treeshaking: true },
  } as DependencyConfigs,
  // 轻量级依赖
  light: {
    nanoid: { size: '~2KB' },
    clsx: { size: '~1KB' },
    zod: { size: '~50KB' },
  } as DependencyConfigs,
}

class ResourceOptimizer {
  private loadedResources = new Set<string>()
  private loadingPromises = new Map<string, Promise<any>>()
  private iconSprite: string | null = null
  private mountedSprites = new Set<string>()
  private spriteIconMap = new Map<string, string>() // 逻辑名 -> sprite 符号 id
  private spriteSymbolIds = new Set<string>() // 已挂载的符号 id 集

  constructor() {
    this.preloadCommonIcons()
  }

  /**
   * 预加载常用图标
   */
  private preloadCommonIcons(): void {
    COMMON_ICONS.forEach((iconName) => {
      const icon = (LucideIcons as any)[iconName]
      if (icon) {
        iconCache.set(iconName, icon)
      }
    })
  }

  /**
   * 获取图标组件（优化版）
   * @param iconName 图标名称
   * @returns 图标组件或默认图标
   */
  getIcon(iconName: string): LucideIcon {
    // 检查是否是Tabler图标，进行映射
    const mappedName = ICON_MAPPING[iconName] || iconName

    // 首先检查缓存
    const hit = iconCache.get(mappedName)
    if (hit) {
      return hit
    }

    // 尝试从LucideIcons中获取
    const icon = (LucideIcons as any)[mappedName]
    if (icon) {
      iconCache.set(mappedName, icon)
      return icon
    }

    // 返回默认图标
    return LucideIcons.HelpCircle
  }

  /**
   * 批量预加载图标
   * @param iconNames 图标名称数组
   */
  preloadIcons(iconNames: string[]): void {
    iconNames.forEach((iconName) => {
      const mappedName = ICON_MAPPING[iconName] || iconName
      const existing = iconCache.get(mappedName)
      if (!existing) {
        const icon = (LucideIcons as any)[mappedName]
        if (icon) iconCache.set(mappedName, icon)
      }
    })
  }

  /**
   * 分析依赖使用情况
   */
  analyzeDependencies(): {
    heavy: string[]
    optimizable: string[]
    light: string[]
    recommendations: string[]
  } {
    const recommendations: string[] = []

    // 检查重量级依赖
    const heavyDeps = Object.keys(DEPENDENCY_CONFIG.heavy)
    const optimizableDeps = Object.keys(DEPENDENCY_CONFIG.optimizable)
    const lightDeps = Object.keys(DEPENDENCY_CONFIG.light)

    // 生成优化建议
    heavyDeps.forEach((dep) => {
      const config = DEPENDENCY_CONFIG.heavy[dep]
      if (config.alternatives) {
        recommendations.push(`考虑将 ${dep} (${config.size}) 替换为更轻量的 ${config.alternatives.join(' 或 ')}`)
      }
    })

    optimizableDeps.forEach((dep) => {
      const config = DEPENDENCY_CONFIG.optimizable[dep]
      if (config.treeshaking) {
        recommendations.push(`${dep} 支持 tree-shaking，确保只导入需要的模块`)
      }
      if (config.alternatives) {
        recommendations.push(`可考虑将 ${dep} 替换为 ${config.alternatives.join(' 或 ')}`)
      }
    })

    return {
      heavy: heavyDeps,
      optimizable: optimizableDeps,
      light: lightDeps,
      recommendations,
    }
  }

  /**
   * 优化资源加载
   * @param resourceType 资源类型
   * @param resourcePath 资源路径
   */
  async optimizeResourceLoading(resourceType: 'image' | 'font' | 'script', resourcePath: string): Promise<void> {
    const cacheKey = `${resourceType}_${resourcePath}`

    const cached = resourceCache.get(cacheKey)
    if (cached) return cached

    const promise = this.loadOptimizedResource(resourceType, resourcePath)
    resourceCache.set(cacheKey, promise)
    return promise
  }

  /**
   * 加载优化后的资源
   */
  private async loadOptimizedResource(resourceType: 'image' | 'font' | 'script', resourcePath: string): Promise<void> {
    switch (resourceType) {
      case 'image':
        return this.preloadImage(resourcePath)
      case 'font':
        return this.preloadFont(resourcePath)
      case 'script':
        return this.loadScript(resourcePath)
      default:
        throw new Error(`Unsupported resource type: ${resourceType}`)
    }
  }

  /**
   * 预加载图片
   */
  private preloadImage(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve()
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
      img.src = src
    })
  }

  /**
   * 预加载字体
   */
  private preloadFont(fontUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'font'
      link.type = 'font/woff2'
      link.crossOrigin = 'anonymous'
      link.href = fontUrl
      link.onload = () => resolve()
      link.onerror = () => reject(new Error(`Failed to load font: ${fontUrl}`))
      document.head.appendChild(link)
    })
  }

  /**
   * 加载脚本
   */
  private loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = src
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`))
      document.head.appendChild(script)
    })
  }

  /**
   * 创建SVG图标精灵
   * @param iconNames 需要包含的图标名称
   */
  async createIconSprite(iconNames: string[]): Promise<string> {
    if (this.iconSprite) {
      return this.iconSprite
    }

    const cacheKey = `icon_sprite_${iconNames.join('_')}`
    const cached = cache.get<string>(cacheKey)
    if (cached) {
      this.iconSprite = cached
      return cached
    }
    const cachedIdb = await idbGet<string>(cacheKey)
    if (cachedIdb) {
      cache.set(cacheKey, cachedIdb, 60 * 60 * 1000)
      this.iconSprite = cachedIdb
      return cachedIdb
    }

    try {
      // 这里可以实现SVG精灵的创建逻辑
      // 由于lucide-react是React组件，我们使用虚拟的精灵概念
      const sprite = `<!-- SVG Sprite for icons: ${iconNames.join(', ')} -->`

      cache.set(cacheKey, sprite, 60 * 60 * 1000) // 缓存1小时
      idbSet(cacheKey, sprite).catch(() => {})
      this.iconSprite = sprite

      return sprite
    } catch (error) {
      console.warn('Failed to create icon sprite:', error)
      return ''
    }
  }

  /**
   * 将 SVG 雪碧图字符串挂载到文档（去重）
   * @param spriteText 完整 <svg>...</svg> 精灵内容
   * @param key 唯一键（默认使用内容哈希的简化版本）
   */
  mountSprite(spriteText: string, key?: string): void {
    if (typeof document === 'undefined') return
    const computedKey = key || `sprite_${this.hash(spriteText)}`
    if (this.mountedSprites.has(computedKey)) return

    const container = document.createElement('div')
    container.setAttribute('data-sprite-key', computedKey)
    container.style.display = 'none'
    container.innerHTML = spriteText
    document.body.prepend(container)

    this.mountedSprites.add(computedKey)

    // 建立符号缓存
    try {
      const symbols = container.querySelectorAll('symbol[id]')
      symbols.forEach((s) => {
        const id = s.getAttribute('id')
        if (id) this.spriteSymbolIds.add(id)
      })
    } catch {}
  }

  /**
   * 从 URL 拉取并挂载雪碧图（带缓存）
   */
  async mountSpriteFromUrl(url: string): Promise<void> {
    const cacheKey = `sprite_url_${url}`
    const cached = cache.get<string>(cacheKey)
    if (cached) {
      this.mountSprite(cached, cacheKey)
      return
    }

    const cachedIdb = await idbGet<string>(cacheKey)
    if (cachedIdb) {
      cache.set(cacheKey, cachedIdb, 24 * 60 * 60 * 1000)
      this.mountSprite(cachedIdb, cacheKey)
      return
    }

    const res = await fetch(url).catch(() => null)
    if (!res || !res.ok) return
    const text = await res.text()
    cache.set(cacheKey, text, 24 * 60 * 60 * 1000)
    idbSet(cacheKey, text).catch(() => {})
    this.mountSprite(text, cacheKey)
  }

  /**
   * 从 URL 加载 sprite 图标映射（例如 public/sprite.map.json）
   */
  async loadSpriteMapFromUrl(url: string): Promise<void> {
    const res = await fetch(url).catch(() => null)
    if (!res || !res.ok) return
    const data = (await res.json().catch(() => ({}))) as Record<string, string>
    Object.entries(data).forEach(([name, id]) => this.spriteIconMap.set(name, id))
  }

  /**
   * 是否存在某个符号 id
   */
  hasSpriteSymbol(id: string): boolean {
    if (this.spriteSymbolIds.has(id)) return true
    if (typeof document === 'undefined') return false
    const el = document.getElementById(id)
    if (el) {
      this.spriteSymbolIds.add(id)
      return true
    }
    return false
  }

  /**
   * 将逻辑图标名映射为 sprite 符号 id（优先使用映射文件，其次尝试同名）
   */
  getSpriteIdForIcon(iconName: string): string | null {
    const mapped = this.spriteIconMap.get(iconName)
    if (mapped && this.hasSpriteSymbol(mapped)) return mapped
    if (this.hasSpriteSymbol(iconName)) return iconName
    return null
  }

  private hash(input: string): string {
    let h = 0
    for (let i = 0; i < input.length; i++) {
      h = (h << 5) - h + input.charCodeAt(i)
      h |= 0
    }
    return Math.abs(h).toString(36)
  }

  /**
   * 懒加载资源
   * @param resourcePath 资源路径
   * @param type 资源类型
   */
  async lazyLoadResource(resourcePath: string, type: 'script' | 'style' | 'image' = 'script'): Promise<any> {
    if (this.loadedResources.has(resourcePath)) {
      return Promise.resolve()
    }

    if (this.loadingPromises.has(resourcePath)) {
      return this.loadingPromises.get(resourcePath)!
    }

    const loadPromise = this.loadResource(resourcePath, type)
    this.loadingPromises.set(resourcePath, loadPromise)

    try {
      const result = await loadPromise
      this.loadedResources.add(resourcePath)
      this.loadingPromises.delete(resourcePath)
      return result
    } catch (error) {
      this.loadingPromises.delete(resourcePath)
      throw error
    }
  }

  /**
   * 加载资源
   * @param resourcePath 资源路径
   * @param type 资源类型
   */
  private loadResource(resourcePath: string, type: 'script' | 'style' | 'image'): Promise<any> {
    return new Promise((resolve, reject) => {
      switch (type) {
        case 'script': {
          const script = document.createElement('script')
          script.src = resourcePath
          script.onload = () => resolve(script)
          script.onerror = () => reject(new Error(`Failed to load script: ${resourcePath}`))
          document.head.appendChild(script)
          break
        }
        case 'style': {
          const link = document.createElement('link')
          link.rel = 'stylesheet'
          link.href = resourcePath
          link.onload = () => resolve(link)
          link.onerror = () => reject(new Error(`Failed to load stylesheet: ${resourcePath}`))
          document.head.appendChild(link)
          break
        }
        case 'image': {
          const img = new Image()
          img.onload = () => resolve(img)
          img.onerror = () => reject(new Error(`Failed to load image: ${resourcePath}`))
          img.src = resourcePath
          break
        }
        default:
          reject(new Error(`Unsupported resource type: ${type}`))
      }
    })
  }

  /**
   * 预加载关键资源
   */
  preloadCriticalResources(): void {
    // 预加载关键CSS
    const criticalStyles: string[] = [
      // 可以添加关键样式文件
    ]

    criticalStyles.forEach((style) => {
      this.lazyLoadResource(style, 'style').catch(console.warn)
    })
  }

  /**
   * 图片懒加载
   * @param img 图片元素
   * @param src 图片源
   * @param placeholder 占位符
   */
  lazyLoadImage(img: HTMLImageElement, src: string, placeholder?: string): void {
    if (placeholder) {
      img.src = placeholder
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLImageElement
            target.src = src
            target.onload = () => {
              target.classList.add('loaded')
            }
            observer.unobserve(target)
          }
        })
      },
      {
        rootMargin: '50px',
      }
    )

    observer.observe(img)
  }

  /**
   * 压缩和优化图片
   * @param file 图片文件
   * @param quality 压缩质量 (0-1)
   * @param maxWidth 最大宽度
   * @param maxHeight 最大高度
   */
  async optimizeImage(
    file: File,
    quality: number = 0.8,
    maxWidth: number = 1920,
    maxHeight: number = 1080
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        // 计算新的尺寸
        let { width, height } = img

        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }

        canvas.width = width
        canvas.height = height

        // 绘制图片
        ctx?.drawImage(img, 0, 0, width, height)

        // 转换为Blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to optimize image'))
            }
          },
          'image/jpeg',
          quality
        )
      }

      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = URL.createObjectURL(file)
    })
  }

  /**
   * 获取资源加载统计
   */
  getStats(): {
    loadedResources: number
    loadingResources: number
    cachedIcons: number
    cachedResources: number
    dependencyAnalysis: {
      heavy: number
      optimizable: number
      light: number
    }
  } {
    const analysis = this.analyzeDependencies()
    return {
      loadedResources: this.loadedResources.size,
      loadingResources: this.loadingPromises.size,
      cachedIcons: iconCache.size,
      cachedResources: resourceCache.size,
      dependencyAnalysis: {
        heavy: analysis.heavy.length,
        optimizable: analysis.optimizable.length,
        light: analysis.light.length,
      },
    }
  }

  /**
   * 清理缓存
   */
  clearCache(): void {
    iconCache.clear()
    resourceCache.clear()
    this.loadedResources.clear()
    this.loadingPromises.clear()
  }

  /**
   * 获取优化建议
   */
  getOptimizationSuggestions(): string[] {
    const analysis = this.analyzeDependencies()
    const suggestions = [...analysis.recommendations]

    // 添加图标优化建议
    if (iconCache.size > 100) {
      suggestions.push('图标缓存过大，考虑实现图标按需加载')
    }

    // 添加资源优化建议
    if (resourceCache.size > 50) {
      suggestions.push('资源缓存过大，考虑实现LRU缓存策略')
    }

    return suggestions
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.loadedResources.clear()
    this.loadingPromises.clear()
    iconCache.clear()
    this.iconSprite = null
  }

  /**
   * 解析 npm audit --json 的结果，兼容不同 npm 版本结构
   */
  analyzeNpmAudit(auditJson: any): {
    issuesByPackage: Record<
      string,
      { highestSeverity: 'low' | 'moderate' | 'high' | 'critical'; count: number; titles: string[] }
    >
    totals: { low: number; moderate: number; high: number; critical: number; total: number }
  } {
    const severityOrder = ['low', 'moderate', 'high', 'critical'] as const
    const pickHigher = (a: any, b: any) => (severityOrder.indexOf(a) > severityOrder.indexOf(b) ? a : b)

    const byPkg: Record<
      string,
      { highestSeverity: 'low' | 'moderate' | 'high' | 'critical'; count: number; titles: string[] }
    > = {}
    let totals = { low: 0, moderate: 0, high: 0, critical: 0, total: 0 }

    if (!auditJson || typeof auditJson !== 'object') {
      return { issuesByPackage: byPkg, totals }
    }

    // npm v7+ 格式: vulnerabilities: { pkg: { severity, via: [...], ... } }, metadata: { vulnerabilities: { low, ... } }
    if (auditJson.vulnerabilities && typeof auditJson.vulnerabilities === 'object') {
      Object.entries(auditJson.vulnerabilities as Record<string, any>).forEach(([pkg, info]) => {
        const severity = (info.severity || 'low') as 'low' | 'moderate' | 'high' | 'critical'
        const via = Array.isArray(info.via) ? info.via : []
        const titles = via.map((v: any) => (typeof v === 'string' ? v : v?.title)).filter(Boolean)
        byPkg[pkg] = {
          highestSeverity: severity,
          count: info.effects?.length || via.length || 1,
          titles,
        }
      })

      const meta = auditJson.metadata?.vulnerabilities
      if (meta) {
        totals = {
          low: meta.low || 0,
          moderate: meta.moderate || 0,
          high: meta.high || 0,
          critical: meta.critical || 0,
          total: (meta.low || 0) + (meta.moderate || 0) + (meta.high || 0) + (meta.critical || 0),
        }
      } else {
        // 回退：按包聚合
        Object.values(byPkg).forEach((v) => {
          totals[v.highestSeverity] += v.count
          totals.total += v.count
        })
      }
    } else if (auditJson.advisories && typeof auditJson.advisories === 'object') {
      // 旧格式: advisories 映射
      Object.values(auditJson.advisories as Record<string, any>).forEach((adv: any) => {
        const pkg = adv.module_name as string
        const severity = (adv.severity || 'low') as 'low' | 'moderate' | 'high' | 'critical'
        const title = adv.title as string
        if (!byPkg[pkg]) {
          byPkg[pkg] = { highestSeverity: severity, count: 1, titles: title ? [title] : [] }
        } else {
          byPkg[pkg].highestSeverity = pickHigher(byPkg[pkg].highestSeverity, severity)
          byPkg[pkg].count += 1
          if (title) byPkg[pkg].titles.push(title)
        }
        totals[severity] += 1
        totals.total += 1
      })
    }

    return { issuesByPackage: byPkg, totals }
  }

  /**
   * 基于分析结果和审计信息生成替换计划（优先高风险）
   */
  generateReplacementPlan(
    analysis: { heavy: string[]; optimizable: string[] },
    issuesByPackage: Record<
      string,
      { highestSeverity: 'low' | 'moderate' | 'high' | 'critical'; count: number; titles: string[] }
    >
  ): Array<{ from: string; to: string; reason: string; severity?: string }> {
    const candidates = new Set<string>([...analysis.heavy, ...analysis.optimizable])
    const result: Array<{ from: string; to: string; reason: string; severity?: string }> = []

    const pushAlts = (fromPkg: string, alts: string[], severity?: string, reason?: string) => {
      if (!alts || alts.length === 0) return
      // 优先首个替代（可在 UI 中允许切换）
      result.push({ from: fromPkg, to: alts[0], reason: reason || '体积优化/生态建议', severity })
    }

    candidates.forEach((pkg) => {
      const conf = (DEPENDENCY_CONFIG.heavy as any)[pkg] || (DEPENDENCY_CONFIG.optimizable as any)[pkg]
      const issue = issuesByPackage[pkg]
      const reason = issue
        ? `安全风险 ${issue.highestSeverity}（${issue.count}）`
        : conf?.treeshaking
          ? '可 tree-shaking 优化'
          : '体积较大'
      pushAlts(pkg, conf?.alternatives || [], issue?.highestSeverity, reason)
    })

    return result
  }

  /**
   * 生成依赖替换脚本（默认 npm）。返回纯文本脚本内容。
   */
  generateReplacementScript(
    plan: Array<{ from: string; to: string }>,
    manager: 'npm' | 'pnpm' | 'yarn' = 'npm'
  ): string {
    const lines: string[] = [
      '#!/usr/bin/env bash',
      'set -euo pipefail',
      '',
      'echo "Applying dependency replacements..."',
    ]

    const rmCmd = manager === 'pnpm' ? 'pnpm remove' : manager === 'yarn' ? 'yarn remove' : 'npm uninstall'
    const addCmd = manager === 'pnpm' ? 'pnpm add' : manager === 'yarn' ? 'yarn add' : 'npm install'

    plan.forEach(({ from, to }) => {
      lines.push(`echo "Replace: ${from} -> ${to}"`)
      lines.push(`${rmCmd} ${from}`)
      lines.push(`${addCmd} ${to}`)
    })

    lines.push('', 'echo "Done."')
    return lines.join('\n')
  }
}

// 创建全局资源优化器实例
export const resourceOptimizer = new ResourceOptimizer()

/**
 * React Hook - 优化图标使用
 * @param iconName 图标名称
 */
export function useOptimizedIcon(iconName: string): LucideIcon {
  return React.useMemo(() => {
    return resourceOptimizer.getIcon(iconName)
  }, [iconName])
}

/**
 * React Hook - 图片懒加载
 * @param src 图片源
 * @param placeholder 占位符
 */
export function useLazyImage(src: string, placeholder?: string) {
  const [loaded, setLoaded] = React.useState(false)
  const [error, setError] = React.useState(false)
  const imgRef = React.useRef<HTMLImageElement>(null)

  React.useEffect(() => {
    const img = imgRef.current
    if (!img) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLImageElement
            target.src = src
            target.onload = () => setLoaded(true)
            target.onerror = () => setError(true)
            observer.unobserve(target)
          }
        })
      },
      { rootMargin: '50px' }
    )

    observer.observe(img)

    return () => observer.disconnect()
  }, [src])

  return {
    imgRef,
    loaded,
    error,
    src: loaded ? src : placeholder,
  }
}

/**
 * React Hook - 资源预加载
 * @param resources 资源列表
 */
export function useResourcePreload(resources: Array<{ path: string; type: 'script' | 'style' | 'image' }>) {
  React.useEffect(() => {
    resources.forEach(({ path, type }) => {
      resourceOptimizer.lazyLoadResource(path, type).catch(console.warn)
    })
  }, [resources])
}
