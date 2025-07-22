/**
 * 资源优化管理器 - 优化图标加载和资源按需加载
 */

import { cache } from './cache'
import * as Icons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import React from 'react'

// 图标缓存映射
const iconCache = new Map<string, LucideIcon>()

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
]

class ResourceOptimizer {
  private loadedResources = new Set<string>()
  private loadingPromises = new Map<string, Promise<any>>()
  private iconSprite: string | null = null

  constructor() {
    this.preloadCommonIcons()
  }

  /**
   * 预加载常用图标
   */
  private preloadCommonIcons(): void {
    COMMON_ICONS.forEach((iconName) => {
      const icon = (Icons as any)[iconName]
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
    // 首先检查缓存
    if (iconCache.has(iconName)) {
      return iconCache.get(iconName)!
    }

    // 尝试从Icons中获取
    const icon = (Icons as any)[iconName]
    if (icon) {
      iconCache.set(iconName, icon)
      return icon
    }

    // 返回默认图标
    return Icons.HelpCircle
  }

  /**
   * 批量预加载图标
   * @param iconNames 图标名称数组
   */
  preloadIcons(iconNames: string[]): void {
    iconNames.forEach((iconName) => {
      if (!iconCache.has(iconName)) {
        const icon = (Icons as any)[iconName]
        if (icon) {
          iconCache.set(iconName, icon)
        }
      }
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

    try {
      // 这里可以实现SVG精灵的创建逻辑
      // 由于lucide-react是React组件，我们使用虚拟的精灵概念
      const sprite = `<!-- SVG Sprite for icons: ${iconNames.join(', ')} -->`

      cache.set(cacheKey, sprite, 60 * 60 * 1000) // 缓存1小时
      this.iconSprite = sprite

      return sprite
    } catch (error) {
      console.warn('Failed to create icon sprite:', error)
      return ''
    }
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
      return this.loadingPromises.get(resourcePath)
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
    const criticalStyles = [
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
  } {
    return {
      loadedResources: this.loadedResources.size,
      loadingResources: this.loadingPromises.size,
      cachedIcons: iconCache.size,
    }
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
