import React from "react"
import { cacheStrategy } from "@/lib/storage"
import { logger } from "@/lib/data/logger"

/**
 * React Hook - 使用持久化缓存
 * @param key 缓存键
 * @param factory 数据工厂函数
 * @param ttl 生存时间（毫秒）
 */
export function usePersistentCache<T>(
  key: string,
  factory: () => Promise<T>,
  ttl: number = 24 * 60 * 60 * 1000
): [T | null, boolean, () => Promise<void>] {
  const [data, setData] = React.useState<T | null>(null)
  const [loading, setLoading] = React.useState(true)

  const refresh = React.useCallback(async () => {
    setLoading(true)
    try {
      // 先尝试从持久化缓存获取
      const cached = await cacheStrategy.getPersistent<T>(key)
      if (cached !== null) {
        setData(cached)
        setLoading(false)
        return
      }

      // 缓存未命中，执行工厂函数
      const newData = await factory()
      await cacheStrategy.setPersistent(key, newData, ttl)
      setData(newData)
    } catch (error) {
      logger.error("Failed to load persistent cache:", error)
    } finally {
      setLoading(false)
    }
  }, [key, factory, ttl])

  React.useEffect(() => {
    refresh()
  }, [refresh])

  return [data, loading, refresh]
}
