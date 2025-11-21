import React from "react"
import { cache } from "@/lib/storage"

/**
 * React Hook - 用于在组件中使用缓存
 * @param key 缓存键
 * @param factory 数据工厂函数
 * @param ttl 生存时间（毫秒）
 * @param deps 依赖数组
 */
export function useCache<T>(key: string, factory: () => T, ttl: number = 5 * 60 * 1000, deps: any[] = []): T {
  const [data, setData] = React.useState<T>(() => {
    const cached = cache.get<T>(key)
    return cached !== null ? cached : factory()
  })

  React.useEffect(() => {
    const cached = cache.get<T>(key)
    if (cached !== null) {
      setData(cached)
    } else {
      const newData = factory()
      cache.set(key, newData, ttl)
      setData(newData)
    }
  }, deps)

  return data
}
