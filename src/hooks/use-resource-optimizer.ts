import React from "react"
import type { LucideIcon } from "lucide-react"
import { resourceOptimizer } from "@/lib/performance"

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
      { rootMargin: "50px" }
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
export function useResourcePreload(resources: Array<{ path: string; type: "script" | "style" | "image" }>) {
  React.useEffect(() => {
    resources.forEach(({ path, type }) => {
      resourceOptimizer.lazyLoadResource(path, type).catch(console.warn)
    })
  }, [resources])
}
